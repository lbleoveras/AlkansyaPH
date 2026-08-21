// index.ts
//
// Supabase Edge Function: delete-account
//
// Lets a signed-in user delete their own account and everything tied to it.
// verify_jwt stays enabled (the default) since this genuinely should accept
// any authenticated user -- the safety property is that the account deleted
// is always derived from the caller's own verified JWT (via auth.getUser()),
// never from a client-supplied id in the request body. That would let one
// user delete another's account just by passing their id.
//
// auth.admin.deleteUser() cascades to holdings, push_tokens, and
// price_alerts_sent via their `references auth.users (id) on delete cascade`
// foreign keys -- no manual cleanup needed here.

import { createClient } from "jsr:@supabase/supabase-js@2";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey || !supabaseAnonKey) {
    return jsonResponse({ error: "Missing environment variables" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData?.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userData.user.id);
  if (deleteError) {
    return jsonResponse({ error: deleteError.message }, 500);
  }

  return jsonResponse({ deleted: true });
});
