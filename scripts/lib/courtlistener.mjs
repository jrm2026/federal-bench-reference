/**
 * CourtListener HTTP, paced and throttle-aware.
 *
 * Extracted so the ingest and the docket walk cannot drift apart on throttling,
 * which took three tries to get right. The rules, learned the hard way:
 *
 *   - A token lifts the anonymous five-per-minute limit. It does not remove the
 *     limit. A quarter-second gap collects 429s within seconds.
 *   - Honour Retry-After, and widen the standing gap on every throttle so a run
 *     that starts too fast settles into a pace the server accepts.
 *   - A Retry-After measured in tens of minutes is a quota reset, not a burst
 *     limit. Waiting it out in the foreground helps nobody; stop and resume.
 */

const BASE = 'https://www.courtlistener.com/api/rest/v4';
const TOKEN = process.env.COURTLISTENER_TOKEN;

let gapMs = TOKEN ? 1200 : 13000;
let last = 0;
let throttleEvents = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const hasToken = () => Boolean(TOKEN);
export const stats = () => ({ throttleEvents, gapMs });

export async function request(url) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const wait = gapMs - (Date.now() - last);
    if (wait > 0) await sleep(wait);
    last = Date.now();

    const res = await fetch(url, { headers: TOKEN ? { Authorization: `Token ${TOKEN}` } : {} });

    if (res.status === 429) {
      throttleEvents++;
      const retryAfter = Number(res.headers.get('retry-after'));
      const backoff = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.min(60000, 2000 * 2 ** attempt);
      if (backoff > 300000) {
        throw new Error(`quota exhausted — CourtListener asks for ${Math.round(backoff / 60000)} minutes. ` +
                        `Work already written is kept; re-run later and it resumes.`);
      }
      gapMs = Math.min(15000, Math.round(gapMs * 1.5));
      process.stderr.write(`      throttled; waiting ${Math.round(backoff / 1000)}s, pacing now ${gapMs}ms\n`);
      await sleep(backoff);
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${new URL(url).pathname}`);
    return res.json();
  }
  throw new Error(TOKEN
    ? 'still throttled after six retries — CourtListener is rate-limiting this token'
    : 'throttled and no COURTLISTENER_TOKEN is set');
}

export function cl(path, params = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);
  return request(url);
}

export const clNext = (url) => request(new URL(url));
