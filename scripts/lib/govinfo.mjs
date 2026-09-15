/**
 * GovInfo, the source of record for recent federal district opinions.
 *
 * Why not CourtListener. Its citable opinions collection is where the older
 * material lives; a search of D.N.J. for "trade secret" returns 53 results whose
 * newest is June 2016, and nothing at all inside a five-year window. Recent
 * district decisions sit in RECAP as documents, where is_available is false on
 * most entries — the docket text is public, the PDF is not. The 44 published
 * entries decided 2021 or later bear this out: 19 link to GovInfo and 23 to
 * Justia, one to CourtListener.
 *
 * GovInfo's USCOURTS collection is free, full-text searchable, and its package
 * IDs are deterministic from the docket (USCOURTS-njd-2_22-cv-01268), which is
 * also what makes a located decision verifiable afterwards.
 *
 * DEMO_KEY works at low volume. A real key is free from api.data.gov and is what
 * a full run wants.
 */

const BASE = 'https://api.govinfo.gov';
const KEY = process.env.GOVINFO_API_KEY || 'DEMO_KEY';

let gapMs = KEY === 'DEMO_KEY' ? 3000 : 400;
let last = 0;
let throttleEvents = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const usingDemoKey = () => KEY === 'DEMO_KEY';
export const stats = () => ({ throttleEvents, gapMs });

async function call(path, init = {}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const wait = gapMs - (Date.now() - last);
    if (wait > 0) await sleep(wait);
    last = Date.now();

    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'X-Api-Key': KEY, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });

    if (res.status === 429) {
      throttleEvents++;
      gapMs = Math.min(20000, Math.round(gapMs * 2));
      const backoff = Math.min(60000, 3000 * 2 ** attempt);
      process.stderr.write(`      govinfo throttled; waiting ${Math.round(backoff / 1000)}s, pacing now ${gapMs}ms\n`);
      if (KEY === 'DEMO_KEY') process.stderr.write('      (DEMO_KEY is rate-limited; set GOVINFO_API_KEY)\n');
      await sleep(backoff);
      continue;
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`${res.status} ${path}${body ? ` — ${body.slice(0, 200)}` : ''}`);
    }
    return res.json();
  }
  throw new Error('govinfo: still throttled after five retries');
}

/**
 * Full-text search of the USCOURTS collection.
 *
 * GovInfo's query language is field-prefixed and ANDs by default. The fields
 * that matter here: collection, courtcode, and publishdate with a range.
 */
export async function searchUscourts({ courtCode, terms, since, pageSize = 50, offsetMark = '*' }) {
  const clauses = [`collection:USCOURTS`];
  if (courtCode) clauses.push(`courtcode:${courtCode}`);
  if (since) clauses.push(`publishdate:range(${since},)`);
  if (terms) clauses.push(`(${terms})`);
  return call('/search', {
    method: 'POST',
    body: JSON.stringify({
      query: clauses.join(' AND '),
      pageSize, offsetMark,
      sorts: [{ field: 'publishdate', sortOrder: 'DESC' }],
    }),
  });
}

/** Granule metadata — judge, case number, nature of suit, and the PDF link. */
export const granule = (packageId, granuleId) =>
  call(`/packages/${packageId}/granules/${granuleId}/summary`);

/** The deterministic package ID for a district docket. */
export function packageIdFor(courtCode, districtDocket) {
  const m = /^(\d):(\d{2}-(?:cv|cr|mc|md)-\d{3,6})$/.exec(districtDocket ?? '');
  return m ? `USCOURTS-${courtCode}-${m[1]}_${m[2]}` : null;
}

/** The public PDF for a granule, which is the link an entry carries. */
export const pdfUrl = (packageId, granuleId) =>
  `https://www.govinfo.gov/content/pkg/${packageId}/pdf/${granuleId}.pdf`;
