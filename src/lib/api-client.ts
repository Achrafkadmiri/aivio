// Most routes are served by the Supabase Edge Function. A few routes depend
// on the Next.js backend's in-process job runner (generation submission, the
// SSE progress stream) or haven't been ported yet (upload), and stay on the
// Next.js backend (NEXT_PUBLIC_API_URL).
//
// Edge Function requests go through the "/edge-api" same-origin proxy
// (see next.config.ts rewrites) rather than the Edge Function's absolute
// cross-site URL. This makes its session cookie first-party, which iOS
// Safari/Chrome (WebKit) requires — it blocks all third-party cookies by
// default, so calling the cross-site URL directly silently dropped the
// session cookie on iOS and immediately bounced users back to /login.
const NEXTJS_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const NEXTJS_ONLY_PATTERNS = [
  /^\/api\/generations\/text-to-video$/,
  /^\/api\/generations\/text-to-image$/,
  /^\/api\/generations\/image-to-video$/,
  /^\/api\/generations\/[^/]+\/duplicate$/,
  /^\/api\/generations\/[^/]+\/stream$/,
  /^\/api\/upload$/,
];

function isNextjsOnly(path: string) {
  return NEXTJS_ONLY_PATTERNS.some((pattern) => pattern.test(path));
}

export function apiUrl(path: string) {
  if (isNextjsOnly(path)) return `${NEXTJS_API_URL}${path}`;
  // "/edge-api" is rewritten (see next.config.ts) to the Edge Function's
  // "/api" segment, so strip the leading "/api" from Next.js-style paths to
  // avoid doubling it.
  const edgePath = path.startsWith("/api/") ? path.slice(4) : path;
  return `/edge-api${edgePath}`;
}

export function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!isNextjsOnly(path) && SUPABASE_ANON_KEY) {
    headers.set("apikey", SUPABASE_ANON_KEY);
  }
  return fetch(apiUrl(path), { ...init, headers, credentials: "include" });
}
