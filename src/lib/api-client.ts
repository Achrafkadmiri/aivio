// Most routes are served by the Supabase Edge Function. A few routes depend
// on the Next.js backend's in-process job runner (generation submission, the
// SSE progress stream) or haven't been ported yet (upload), and stay on the
// Next.js backend (NEXT_PUBLIC_API_URL).
const EDGE_API_URL = process.env.NEXT_PUBLIC_EDGE_API_URL ?? "";
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
  // EDGE_API_URL already ends in the function's "/api" segment, so strip the
  // leading "/api" from Next.js-style paths to avoid doubling it.
  const edgePath = path.startsWith("/api/") ? path.slice(4) : path;
  return `${EDGE_API_URL}${edgePath}`;
}

export function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!isNextjsOnly(path) && SUPABASE_ANON_KEY) {
    headers.set("apikey", SUPABASE_ANON_KEY);
  }
  return fetch(apiUrl(path), { ...init, headers, credentials: "include" });
}
