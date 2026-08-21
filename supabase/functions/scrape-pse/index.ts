// RETIRED 2026-08-21: edge.pse.com.ph's robots.txt explicitly disallows
// ClaudeBot (`User-agent: ClaudeBot\nDisallow: /`). This function used to
// scrape that site directly and has been replaced by `sync-stock-quotes`,
// which uses the phisix API instead. Left in place (inert) rather than
// removed, in case anything still references this slug.

Deno.serve(() => {
  return new Response(
    JSON.stringify({
      retired: true,
      reason:
        "edge.pse.com.ph disallows ClaudeBot via robots.txt. Use sync-stock-quotes instead.",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
