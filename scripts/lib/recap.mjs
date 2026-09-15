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
// Widened twice, both times by reading output rather than reasoning about it.
// The first pass listed "Motion to/for X" and missed "Motion SEEKING Leave To
// Serve A Third Party Subpoena"; it also had no entry for discovery, which is
// the commonest procedural opinion of all. Match the relief, not the phrasing.
const PROCEDURAL = new RegExp([
  '\\b(?:to |for |seeking )(?:leave|discovery|reconsideration|disgorgement)\\b',
  '\\bmotion\\b[^.]{0,40}\\b(?:seal|compel|subpoena|quash|strike|sever|stay|remand|venue|transfer)\\b',
  '\\bto seal\\b', '\\battorney\'?s? fees\\b', '\\bscheduling order\\b',
  '\\bpro hac vice\\b', '\\bamended? (?:answers|scheduling)\\b',
  '\\brule 26\\(f\\)\\b', '\\bthird[- ]party subpoena\\b',
].join('|'), 'i');

/**
 * Opinions on a subject, newest first.
 *
 * `terms` is the taxonomy's own query for the subject, so tuning search lives in
 * taxonomy.json and not in code.
 */
/**
 * Is this docket entry a decision on the merits?
 *
 * Note what this cannot do: the search finds cases ABOUT a subject and this
 * separates decisions from motions, but neither can tell whether the decision
 * is ON that subject. A venue ruling in a consumer-fraud case passes here and
 * still does not belong under consumer fraud. That judgment is the curator's,
 * and `_ingest.needs` says so on every proposal.
 */
export const classify = (description) =>
  DECISION.test(description ?? '') &&
  !NOT_A_DECISION.test(description ?? '') &&
  !PROCEDURAL.test(description ?? '');

export async function findBySubject({ court, terms, since, limit = 40 }) {
  const payload = await cl('/search/', {
    type: 'rd',
    court,
    // The clerk's signature line lives in the docket text, not the document, so
    // this cuts the result set to signed orders and opinions and drops the
    // complaints, briefs and exhibit stacks that otherwise fill the first page.
    // It also guarantees the one thing every record needs, an authorship source
    // that is not a guess — the filter below discards anything without a
    // signature anyway, so asking for it up front stops that waste.
    //
    // Both forms, and they are not substrings of each other: a magistrate's
    // line reads "Signed by Magistrate Judge Matthew J. Skahill". Query only
    // the first and the sweep returns no magistrate decision at all, and
    // nobody can tell that from scarcity.
    q: `(${terms}) AND ("Signed by Judge" OR "Signed by Magistrate Judge")`,
    filed_after: since,
    available_only: 'on',
    order_by: 'entry_date_filed desc',
  });

  const out = [];
  for (const r of payload.results ?? []) {
    for (const d of (Array.isArray(r.recap_documents) ? r.recap_documents : [r])) {
      const description = d.description ?? '';
      if (!classify(description)) continue;
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
 * Docket number, case name and nature of suit for a set of docket ids.
 *
 * One request each, because the dockets endpoint takes only range operators on
 * id — no `in` filter — and the search index does not carry the docket number
 * down to the document level. A thirteen-subject sweep at five candidates a
 * subject is about sixty-five lookups, most of them repeats within a subject,
 * so the cache below matters more than the batching would have.
 *
 * The nature-of-suit code is worth the field. It is the plaintiff's civil cover
 * sheet as the clerk recorded it, so it says nothing about the holding and can
 * never confirm a subject tag — but it contradicts a wrong one cheaply, and on
 * this corpus it has done so repeatedly. See natureOfSuitReading in proposal.mjs.
 */
const cache = new Map();

export async function docketsById(ids) {
  const out = new Map();
  for (const id of new Set(ids.filter(Boolean))) {
    if (!cache.has(id)) {
      try {
        cache.set(id, await cl(`/dockets/${id}/`,
          { fields: 'id,docket_number,case_name,nature_of_suit' }));
      } catch {
        cache.set(id, null);           // a docket that will not resolve is not fatal
      }
    }
    if (cache.get(id)) out.set(id, cache.get(id));
  }
  return out;
}
