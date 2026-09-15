/**
 * CourtListener HTTP, paced and throttle-aware.
 *
 * Extracted so the ingest and the docket walk cannot drift apart on throttling,
 * which took three tries to get right. The rules, learned the hard way:
 *
 *   - A token authenticates you. It does not raise your tier. This file paced
 *     at 1200ms on the belief that a token lifted the anonymous five-per-minute
 *     limit; the account that owns this project is registered, holds a token,
 *     and is still metered at 5/minute, 50/hour, 125/day. Fifty requests a
 *     minute against a five-per-minute ceiling fails on the second request.
 *   - Rates are a rolling window, not a calendar day. Django REST Framework
 *     counts requests in the trailing 24 hours, so a budget spent yesterday
 *     evening is still spent this morning and returns gradually rather than at
 *     midnight. A run that reports "expected available in 24794 seconds" is
 *     reading that window, not a clock.
 *   - Honour Retry-After, and widen the standing gap on every throttle so a run
 *     that starts too fast settles into a pace the server accepts.
 *   - A Retry-After measured in tens of minutes is a quota reset, not a burst
 *     limit. Waiting it out in the foreground helps nobody; stop and resume.
 *
 * Set COURTLISTENER_RPM if the account's tier changes. The hourly ceiling is
 * the one a corpus sweep meets first: 50/hour stops a run at fifty records
 * however patiently it is paced.
 */

const BASE = 'https://www.courtlistener.com/api/rest/v4';
const TOKEN = process.env.COURTLISTENER_TOKEN;

// Requests per minute this account is allowed. The free tier is 5, with or
// without a token, and that is the safe default: pacing too slowly wastes
// minutes, pacing too quickly wastes the daily budget on refusals.
const RPM = Math.max(1, Number(process.env.COURTLISTENER_RPM) || 5);

// A tenth over the strict interval, because the server's minute and ours are
// not the same minute.
let gapMs = Math.ceil(60000 / RPM * 1.1);
let last = 0;
let throttleEvents = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const hasToken = () => Boolean(TOKEN);
export const stats = () => ({ throttleEvents, gapMs, rpm: RPM });

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
      gapMs = Math.min(60000, Math.round(gapMs * 1.5));
      process.stderr.write(`      throttled; waiting ${Math.round(backoff / 1000)}s, pacing now ${gapMs}ms\n`);
      await sleep(backoff);
      continue;
    }
    if (res.status === 403 && !TOKEN) {
      throw new Error(`403 ${new URL(url).pathname} — this endpoint requires a token. ` +
                      `The v4 search endpoint refuses anonymous callers outright; ` +
                      `set COURTLISTENER_TOKEN and re-run.`);
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
