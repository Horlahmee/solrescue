// Server-side scripts hit our own Helius key, which is domain-allowlisted for
// the browser. Sending our production origin lets these first-party calls pass
// the same allowlist without needing a separate unrestricted key.
const ORIGIN =
  process.env.HELIUS_ALLOWLIST_ORIGIN ?? 'https://solrescue.techgeniehq.com';

export function heliusFetch(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN,
      Referer: `${ORIGIN}/`,
    },
    body: JSON.stringify(body),
  });
}
