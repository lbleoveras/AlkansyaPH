// index.ts
//
// Supabase Edge Function: send-price-alerts
//
// Runs a few minutes after sync-stock-quotes (so `stocks.change_percent`
// reflects the latest tick) and pushes a notification to any user holding a
// stock that has moved +/- ALERT_THRESHOLD_PERCENT or more today, via
// Expo's push API. Deduped through price_alerts_sent so a stock sitting
// past the threshold all day only triggers one push per user per symbol
// per day, and a user with no registered device is skipped without being
// marked as alerted (so a later same-day registration can still catch it).
//
// Internal/cron-only: deployed with verify_jwt disabled and its own secret
// check below (see isAuthorizedInternalCaller) -- this reads every user's
// holdings and pushes to their devices, so it must not be triggerable by
// just any signed-in user holding the public anon key.

import { createClient } from "jsr:@supabase/supabase-js@2";

const ALERT_THRESHOLD_PERCENT = 5;
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_PUSH_BATCH_SIZE = 100;

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  const length = Math.max(aBytes.length, bBytes.length, 1);
  let diff = aBytes.length === bBytes.length ? 0 : 1;
  for (let i = 0; i < length; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

async function isAuthorizedInternalCaller(
  req: Request,
  supabase: ReturnType<typeof createClient>,
): Promise<boolean> {
  const provided = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!provided) return false;
  const { data: expected } = await supabase.rpc("get_internal_secret", {
    secret_name: "internal_cron_secret",
  });
  if (!expected) return false;
  return timingSafeEqual(provided, expected as string);
}

interface HoldingRow {
  user_id: string;
  symbol: string;
  stocks: { company_name: string; change_percent: number | string } | null;
}

interface Candidate {
  user_id: string;
  symbol: string;
  company_name: string;
  change_percent: number;
}

interface ExpoPushMessage {
  to: string;
  sound: "default";
  title: string;
  body: string;
  data: { symbol: string };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return jsonResponse({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }, 500);
  }
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  if (!(await isAuthorizedInternalCaller(req, supabase))) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: rows, error: holdingsError } = await supabase
    .from("holdings")
    .select("user_id, symbol, stocks(company_name, change_percent)");
  if (holdingsError) {
    return jsonResponse({ error: `Failed to load holdings: ${holdingsError.message}` }, 500);
  }

  const candidates: Candidate[] = ((rows ?? []) as unknown as HoldingRow[])
    .filter((row) => row.stocks !== null)
    .map((row) => ({
      user_id: row.user_id,
      symbol: row.symbol,
      company_name: row.stocks?.company_name ?? row.symbol,
      change_percent: Number(row.stocks?.change_percent ?? 0),
    }))
    .filter((candidate) => Math.abs(candidate.change_percent) >= ALERT_THRESHOLD_PERCENT);

  if (candidates.length === 0) {
    return jsonResponse({ candidates: 0, sent: 0 });
  }

  const { data: alreadySent, error: sentError } = await supabase
    .from("price_alerts_sent")
    .select("user_id, symbol")
    .eq("alert_date", today);
  if (sentError) {
    return jsonResponse({ error: `Failed to load dedup log: ${sentError.message}` }, 500);
  }
  const sentKey = new Set((alreadySent ?? []).map((row) => `${row.user_id}:${row.symbol}`));
  const toNotify = candidates.filter((candidate) => !sentKey.has(`${candidate.user_id}:${candidate.symbol}`));

  if (toNotify.length === 0) {
    return jsonResponse({ candidates: candidates.length, sent: 0, reason: "already alerted today" });
  }

  const userIds = Array.from(new Set(toNotify.map((candidate) => candidate.user_id)));
  const { data: tokenRows, error: tokensError } = await supabase
    .from("push_tokens")
    .select("user_id, expo_push_token")
    .in("user_id", userIds);
  if (tokensError) {
    return jsonResponse({ error: `Failed to load push tokens: ${tokensError.message}` }, 500);
  }

  const tokensByUser = new Map<string, string[]>();
  for (const row of tokenRows ?? []) {
    const list = tokensByUser.get(row.user_id) ?? [];
    list.push(row.expo_push_token);
    tokensByUser.set(row.user_id, list);
  }

  const messages: ExpoPushMessage[] = [];
  const dedupeInserts: { user_id: string; symbol: string; alert_date: string; change_percent: number }[] = [];

  for (const candidate of toNotify) {
    const tokens = tokensByUser.get(candidate.user_id) ?? [];
    if (tokens.length === 0) continue; // no device registered yet -- don't mark as alerted, let it retry later today

    const direction = candidate.change_percent >= 0 ? "up" : "down";
    const magnitude = Math.abs(candidate.change_percent).toFixed(1);
    for (const token of tokens) {
      messages.push({
        to: token,
        sound: "default",
        title: `${candidate.symbol} is ${direction} ${magnitude}%`,
        body: `${candidate.company_name} moved ${direction} ${magnitude}% today.`,
        data: { symbol: candidate.symbol },
      });
    }
    dedupeInserts.push({
      user_id: candidate.user_id,
      symbol: candidate.symbol,
      alert_date: today,
      change_percent: candidate.change_percent,
    });
  }

  let sent = 0;
  const sendErrors: string[] = [];
  for (let i = 0; i < messages.length; i += EXPO_PUSH_BATCH_SIZE) {
    const batch = messages.slice(i, i + EXPO_PUSH_BATCH_SIZE);
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(batch),
      });
      if (!response.ok) {
        sendErrors.push(`HTTP ${response.status}`);
        continue;
      }
      sent += batch.length;
    } catch (err) {
      sendErrors.push(err instanceof Error ? err.message : String(err));
    }
  }

  if (dedupeInserts.length > 0) {
    const { error: dedupeError } = await supabase
      .from("price_alerts_sent")
      .upsert(dedupeInserts, { onConflict: "user_id,symbol,alert_date" });
    if (dedupeError) {
      sendErrors.push(`Dedup log write failed: ${dedupeError.message}`);
    }
  }

  return jsonResponse({
    candidates: candidates.length,
    notifiedUsers: dedupeInserts.length,
    sent,
    sendErrors,
  });
});
