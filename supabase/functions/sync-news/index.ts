// index.ts
//
// Supabase Edge Function: sync-news
//
// Pulls PH business news from two legitimate, syndication-designed RSS feeds
// (no robots.txt AI restrictions on either, unlike edge.pse.com.ph — see
// sync-stock-quotes' history) and keeps only articles that are actually
// relevant to a PH stock-market audience:
//   - articles that name one of our tracked companies get tagged with that
//     symbol (related_symbol)
//   - articles that don't name a specific company but are clearly general
//     market/PSEi news are kept untagged
//   - everything else (unrelated PH business news — health care launches,
//     real-estate project openings, etc.) is dropped
//
// Runs once daily via pg_cron (no market-hours gate — news isn't tied to
// trading sessions the way price data is).

import { createClient } from "jsr:@supabase/supabase-js@2";

const FEEDS: { url: string; source: string }[] = [
  { url: "https://www.philstar.com/rss/business", source: "Philstar" },
  { url: "https://bworldonline.com/feed/", source: "BusinessWorld" },
];

const MARKET_KEYWORDS = [
  "psei",
  "philippine stock exchange",
  "stock exchange",
  "stock market",
  "bourse",
  "trading session",
  "index gained",
  "index fell",
  "index rose",
  "index dropped",
  "shares gained",
  "shares fell",
  "market capitalization",
  "foreign buying",
  "foreign selling",
  "blue chip",
  "board lot",
];

// Corporate-suffix noise stripped from `stocks.company_name` to get a more
// distinctive core name for matching (e.g. "Ayala Land, Inc." -> "Ayala Land").
const SUFFIX_PATTERN = /,?\s*(inc\.?|incorporated|corp\.?|corporation|company|co\.?|group|holdings?)\.?\s*$/i;

// A handful of well-known short/common forms that diverge enough from the
// formal company_name that suffix-stripping alone wouldn't catch them.
const ALIASES: Record<string, string[]> = {
  MER: ["Meralco"],
  TEL: ["PLDT"],
  GLO: ["Globe Telecom", "Globe"],
  MBT: ["Metrobank"],
  ICT: ["ICTSI"],
  CEB: ["Cebu Pacific"],
  BLOOM: ["Solaire"],
};

interface StockRow {
  symbol: string;
  company_name: string;
}

interface FeedItem {
  title: string;
  link: string;
  description: string;
  publishedAt: string;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;|&lsquo;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match) return "";
  const raw = match[1].trim();
  const cdataMatch = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return decodeEntities((cdataMatch ? cdataMatch[1] : raw).trim());
}

function parseRssItems(xml: string): FeedItem[] {
  const itemBlocks = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) ?? [];
  return itemBlocks.map((block) => {
    const pubDateRaw = extractTag(block, "pubDate");
    const parsedDate = pubDateRaw ? new Date(pubDateRaw) : null;
    return {
      title: extractTag(block, "title"),
      link: extractTag(block, "link"),
      description: extractTag(block, "description"),
      publishedAt:
        parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString(),
    };
  });
}

function buildMatchers(stocks: StockRow[]): { symbol: string; needles: string[] }[] {
  return stocks.map((stock) => {
    const core = stock.company_name.replace(SUFFIX_PATTERN, "").trim();
    const needles = [core, ...(ALIASES[stock.symbol] ?? [])].filter((n) => n.length >= 3).map((n) => n.toLowerCase());
    return { symbol: stock.symbol, needles };
  });
}

function matchSymbol(text: string, matchers: { symbol: string; needles: string[] }[]): string | null {
  const lower = text.toLowerCase();
  for (const { symbol, needles } of matchers) {
    if (needles.some((needle) => lower.includes(needle))) return symbol;
  }
  return null;
}

function isGeneralMarketNews(text: string): boolean {
  const lower = text.toLowerCase();
  return MARKET_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (_req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return jsonResponse(
      { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables" },
      500,
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: stocks, error: stocksError } = await supabase.from("stocks").select("symbol, company_name");
  if (stocksError) {
    return jsonResponse({ error: `Failed to load stocks: ${stocksError.message}` }, 500);
  }
  const matchers = buildMatchers((stocks ?? []) as StockRow[]);

  let fetched = 0;
  let matched = 0;
  let inserted = 0;
  const feedErrors: { source: string; error: string }[] = [];

  for (const feed of FEEDS) {
    try {
      const response = await fetch(feed.url, {
        headers: { "User-Agent": "AlkansyaPH/1.0 (+personal portfolio tracker)" },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      const xml = await response.text();
      const items = parseRssItems(xml);
      fetched += items.length;

      for (const item of items) {
        if (!item.title || !item.link) continue;

        const searchableText = `${item.title} ${item.description}`;
        const relatedSymbol = matchSymbol(searchableText, matchers);
        if (!relatedSymbol && !isGeneralMarketNews(searchableText)) continue;

        matched++;

        const { error: insertError, count } = await supabase
          .from("news_articles")
          .upsert(
            {
              headline: item.title,
              source: feed.source,
              summary: item.description.slice(0, 500),
              url: item.link,
              published_at: item.publishedAt,
              related_symbol: relatedSymbol,
              fetched_at: new Date().toISOString(),
            },
            { onConflict: "url", ignoreDuplicates: true, count: "exact" },
          );

        if (insertError) {
          console.error(`[sync-news] Failed to upsert "${item.title}": ${insertError.message}`);
          continue;
        }
        if (count) inserted += count;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[sync-news] Failed to fetch feed ${feed.source}: ${message}`);
      feedErrors.push({ source: feed.source, error: message });
    }
  }

  return jsonResponse({ fetched, matched, inserted, feedErrors });
});
