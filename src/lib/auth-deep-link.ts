// Supabase's hosted auth links redirect back to `redirectTo` with the
// session tokens in the URL *fragment* (#access_token=...), not the query
// string -- React Native's URLSearchParams never sees past the `#`, and a
// plain `new URL()` treats the fragment as opaque too, so this parses it by
// hand instead of relying on either.
export type ParsedAuthLink =
  | { kind: 'recovery'; accessToken: string; refreshToken: string }
  | { kind: 'signup'; accessToken: string; refreshToken: string }
  | null;

export function parseAuthDeepLink(url: string): ParsedAuthLink {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const paramsString =
    hashIndex >= 0 ? url.slice(hashIndex + 1) : queryIndex >= 0 ? url.slice(queryIndex + 1) : '';
  if (!paramsString) return null;

  const params = new URLSearchParams(paramsString);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const type = params.get('type');
  if (!accessToken || !refreshToken) return null;

  if (type === 'recovery') return { kind: 'recovery', accessToken, refreshToken };
  if (type === 'signup' || type === 'email_change' || type === 'magiclink') {
    return { kind: 'signup', accessToken, refreshToken };
  }
  return null;
}
