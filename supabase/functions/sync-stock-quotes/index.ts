// index.ts
//
// Supabase Edge Function: sync-stock-quotes
//
// Replaces the earlier PSE-Edge-HTML-scraping approach (retired: edge.pse.com.ph's
// robots.txt explicitly disallows ClaudeBot). Instead, fetches live PSE quotes from
// phisix (https://phisix-api3.appspot.com/stocks.json) — a single JSON request that
// returns every PSE-listed security at once, no per-company scraping needed.
//
// On each invocation:
//   1. Checks whether the PSE market is currently open (Asia/Manila trading hours).
//      Authoritative gate — no-ops outside market hours regardless of cron timing.
//   2. Fetches phisix's full stock list in one request.
//   3. Updates only the symbols we track (present in `stocks`), deriving a signed
//      peso change from phisix's percentChange since phisix doesn't provide one
//      directly, and logs a row per symbol into `stock_price_history`.
//   4. Responds 200 with a summary of what happened.

import { createClient } from "jsr:@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// PSE market-hours gate (ported from src/utils/market-hours.ts)
// ---------------------------------------------------------------------------

const MARKET_OPEN_MINUTES = 9 * 60 + 30;
const MARKET_CLOSE_MINUTES = 15 * 60 + 30;

function getManilaParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { weekday: get("weekday"), hour: Number(get("hour")), minute: Number(get("minute")) };
}

function isPseMarketOpen(date: Date = new Date()): boolean {
  const { weekday, hour, minute } = getManilaParts(date);
  if (weekday === "Sat" || weekday === "Sun") return false;
  const minutesSinceMidnight = hour * 60 + minute;
  return minutesSinceMidnight >= MARKET_OPEN_MINUTES && minutesSinceMidnight < MARKET_CLOSE_MINUTES;
}

// ---------------------------------------------------------------------------

const PHISIX_URL = "https://phisix-api3.appspot.com/stocks.json";

interface PhisixStock {
  name: string;
  price: { currency: string; amount: number };
  percentChange: number;
  volume: number;
  symbol: string;
}

interface PhisixResponse {
  stocks: PhisixStock[];
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (_req: Request) => {
  if (!isPseMarketOpen()) {
    return jsonResponse({ skipped: true, reason: "market-closed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return jsonResponse(
      { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables" },
      500,
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: rows, error: selectError } = await supabase.from("stocks").select("symbol");
  if (selectError) {
    return jsonResponse({ error: `Failed to load tracked symbols: ${selectError.message}` }, 500);
  }
  const trackedSymbols = new Set((rows ?? []).map((r: { symbol: string }) => r.symbol));

  let phisixData: PhisixResponse;
  try {
    const response = await fetch(PHISIX_URL, {
      headers: { "User-Agent": "AlkansyaPH/1.0 (+personal portfolio tracker)" },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    phisixData = await response.json();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: `Failed to fetch phisix: ${message}` }, 502);
  }

  const nowIso = new Date().toISOString();
  let succeeded = 0;
  const failed: { symbol: string; error: string }[] = [];

  for (const stock of phisixData.stocks ?? []) {
    if (!trackedSymbols.has(stock.symbol)) continue;

    try {
      const price = stock.price.amount;
      const changePercent = stock.percentChange;
      // phisix gives percent change but not a signed peso amount directly —
      // derive it from the implied previous close.
      const impliedPrevClose = changePercent !== 0 ? price / (1 + changePercent / 100) : price;
      const changeAmount = price - impliedPrevClose;

      const { error: updateError } = await supabase
        .from("stocks")
        .update({
          price,
          change_amount: changeAmount,
          change_percent: changePercent,
          volume: stock.volume,
          last_scraped_at: nowIso,
          updated_at: nowIso,
        })
        .eq("symbol", stock.symbol);

      if (updateError) throw new Error(`Update failed: ${updateError.message}`);

      const { error: historyError } = await supabase.from("stock_price_history").insert({
        symbol: stock.symbol,
        price,
        captured_at: nowIso,
      });
      if (historyError) throw new Error(`History insert failed: ${historyError.message}`);

      succeeded++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[sync-stock-quotes] Failed to update ${stock.symbol}: ${message}`);
      failed.push({ symbol: stock.symbol, error: message });
    }
  }

  return jsonResponse({
    tracked: trackedSymbols.size,
    matched: succeeded + failed.length,
    succeeded,
    failed: failed.length,
    failedSymbols: failed,
  });
});
