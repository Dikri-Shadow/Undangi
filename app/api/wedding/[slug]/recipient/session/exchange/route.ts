import { POST as exchange } from "../../../../rsvp/session/route";

export async function POST(request: Request) {
  const slug = decodeURIComponent(new URL(request.url).pathname.split("/")[3] ?? "");
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  // Build a fresh Request from the URL string: re-wrapping the consumed
  // `request` itself throws in workerd (body already disturbed), which made
  // this endpoint return 500 on every call. Forward the original headers
  // (origin, user-agent, cf-connecting-ip) so the inner handler sees the
  // same request context; drop content-length/encoding since the body changed.
  const headers = new Headers(request.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.set("Content-Type", "application/json");
  return exchange(new Request(request.url, { method: "POST", headers, body: JSON.stringify({ ...body, slug }) }));
}
