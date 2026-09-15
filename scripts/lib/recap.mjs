/**
 * Recent district decisions, from RECAP's document index.
 *
 * CLAUDE.md said until 15 September 2026 that CourtListener could not supply
 * the matter-relevant tier. That was true of the collection it was tested
 * against and false of CourtListener. The *citable opinions* collection stops
 * at June 2016 for D.N.J. and returns nothing inside a five-year window. The
 * RECAP *document* index is a different thing entirely: full-text searchable
 * across the filings themselves, and a query for "trade secret" restricted to
 * njd, filed since 2021, with a retrievable PDF, returns 264 opinions — by
 * Quraishi, Wigenton, Salas, Padin, Martinotti and Castner, which is to say by
 * the judges whose pages this tier exists to fill.
 *
 * What makes it the better source, beyond having the documents: the clerk's
 * signature line comes with them. GovInfo yields a judge field that has to be
 * matched against the page; RECAP yields "Signed by Judge Evelyn Padin on
 * 3/28/2025", which is authorship, date and document in one string. A record
 * sourced here carries `docket_entry_signature` rather than `opinion_text`.
 *
 * Cost: one search per subject, then one lookup per distinct docket, cached
 * across subjects. A thirteen-subject sweep is roughly seventy requests against
 * a 250/hour ceiling — one sitting, well inside the daily budget.
 */

import { cl } from './courtlistener.mjs';
import { signedBy } from '../reconcile-dockets.mjs';

/**
 * Only documents a judge wrote, and only on the merits.
 *
 * A full-text search for a subject matches every document in a case about that
 * subject. Most of the noise is obvious — complaints, motions, letters — but the
 * expensive kind is not: a trade-secrets case generates opinions on sealing, on
 * compelling discovery, on attorney's fees. Those are genuine opinions by the
 * right judge in the right case, and none of them is a decision about trade
 * secrets. Asking what the document IS rather than what the case is ABOUT is the
 * whole filter.
 *
 * Procedural rulings are not discarded from the site — they have their own
 * section and their own tags — but they do not belong under a matter type a
 * reader chose because it matches their complaint.
 */
const DECISION = /\b(OPINION|MEMORANDUM)\b/i;
const NOT_A_DECISION = /^\s*\W*(MOTION|CROSS[- ]MOTION|BRIEF|MEMORANDUM IN (SUPPORT|OPPOSITION)|LETTER|NOTICE|DECLARATION|CERTIFICAT|COMPLAINT|ANSWER|STIPULATION|RESPONSE|REPLY)/i;
const PROCEDURAL = /\bMotion (to|for) (Seal|Compel|Change Venue|Attorney|Attorney'?s? Fees|Leave|Extension|Reconsideration|Withdraw|Stay|Expedited)\b|\bto Seal\b|\bAttorney'?s? Fees\b|\bScheduling Order\b|\bpro hac vice\b/i;

/**
 * Opinions on a subject, newest first.
 *
 * `terms` is the taxonomy's own query for the subject, so tuning search lives in
 * taxonomy.json and not in code.
 */
export async function findBySubject({ court, terms, since, limit = 40 }) {
  const payload = await cl('/search/', {
    type: 'rd',
    court,
    q: `(${terms}) AND (OPINION OR "MEMORANDUM OPINION")`,
    filed_after: since,
    available_only: 'on',
    order_by: 'entry_date_filed desc',
  });

  const out = [];
  for (const r of payload.results ?? []) {
    for (const d of (Array.isArray(r.recap_documents) ? r.recap_documents : [r])) {
      const description = d.description ?? '';
      if (!DECISION.test(description) || NOT_A_DECISION.test(description)) continue;
      if (PROCEDURAL.test(description)) continue;   // a real opinion, wrong section
      const sig = signedBy(description);
      if (!sig) continue;                       // no signature line, no attribution
      if (!d.is_available) continue;            // no retrievable copy, no entry
      out.push({
        docketId: d.docket_id ?? r.docket_id ?? null,
        ecf: d.document_number ?? null,
        dateSigned: sig.date,
        dateFiled: d.entry_date_filed ?? null,
        judge: sig.judge,
        description,
        snippet: d.snippet ?? null,
        page: d.absolute_url ? `https://www.courtlistener.com${d.absolute_url}` : null,
        pdf: d.filepath_local ? `https://storage.courtlistener.com/${d.filepath_local}` : null,
      });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/**
 * Docket number and case name for a set of docket ids.
 *
 * One request each, because the dockets endpoint takes only range operators on
 * id — no `in` filter — and the search index does not carry the docket number
 * down to the document level. A thirteen-subject sweep at five candidates a
 * subject is about sixty-five lookups, most of them repeats within a subject,
 * so the cache below matters more than the batching would have.
 */
const cache = new Map();

export async function docketsById(ids) {
  const out = new Map();
  for (const id of new Set(ids.filter(Boolean))) {
    if (!cache.has(id)) {
      try {
        cache.set(id, await cl(`/dockets/${id}/`, { fields: 'id,docket_number,case_name' }));
      } catch {
        cache.set(id, null);           // a docket that will not resolve is not fatal
      }
    }
    if (cache.get(id)) out.set(id, cache.get(id));
  }
  return out;
}
