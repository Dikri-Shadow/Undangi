export function isLocalDevelopmentRequest(request: Request): boolean {
  if (process.env.NODE_ENV === "production") return false;
  try {
    const hostname = new URL(request.url).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1";
  } catch { return false; }
}

export function adminRateLimitKey(request: Request, scope: string, identifier: string): string {
  return isLocalDevelopmentRequest(request) ? `${scope}:development:${identifier}` : `${scope}:${identifier}`;
}
