/**
 * Build a `recent`-tier proposal from one RECAP search hit.
 *
 * A proposal is not an entry. It carries what the API said and nothing a human
 * has to say: no headnote, no procedural tags, no disposition. Those are the
 * curator's, and hard constraint 6 keeps this file out of src/content.
 *
 * Three things the API gives away that are worth writing down every time.
 *
 * The clerk's signature line — "Signed by Judge Jamel K. Semper on 6/17/2026" —
 * is authorship, date and ECF number in one string, which is why a record
 * sourced here carries `docket_entry_signature` rather than an inference off a
 * docket's assignedTo field.
 *
 * The docket's nature-of-suit code is the plaintiff's own civil cover sheet as
 * the clerk recorded it. It does not say what the opinion held, so it cannot
 * confirm a subject tag. It can contradict one, and it has: Ocean Port
 * Enterprise surfaced on "LLC operating agreement" and is docketed Rent Lease &
 * Ejectment; Miller v. Brozen surfaced on "breach of fiduciary duty" and is
 * docketed ERISA. Both were dropped before anyone read them.
 *
 * The PDF path comes from the API or not at all. Most RECAP paths are
 * gov.uscourts.njd.<pacer>.<ecf>.0.pdf and constructing one is tempting; the
 * Universal Property opinion is filed at .165.0_1.pdf and the constructed form
 * is a dead link. Where the search did not report a path, the record links the
 * docket-entry page alone and says the PDF is still to be added.
 */

/**
 * What the docket's nature-of-suit code says about a proposed subject tag.
 *
 * The code is the plaintiff's civil cover sheet as the clerk recorded it: a
 * fact about the case, not about the holding. So it can never confirm a tag —
 * a franchise case can produce an opinion entirely about personal jurisdiction
 * — but it is the cheapest contradiction available, and it caught two
 * mis-tagged candidates in this corpus before anyone opened a PDF.
 *
 * Data privacy is the one subject with no code of its own. Breach class
 * actions are filed under contract or personal injury, so silence there means
 * nothing either way and the reading says so.
 */
const NOS_FOR_SUBJECT = {
  'trade-secrets': /trade\s?secret|contract/i,
  'restrictive-covenants': /contract|labor|employ/i,
  'trademark-unfair-competition': /trademark|840/i,
  copyright: /copyright|820/i,
  'commercial-contract': /contract/i,
  'business-torts': /contract|tort|other statutory/i,
  'closely-held-fiduciary': /contract|stockholder|corporat/i,
  'franchise-distribution': /franchise/i,
  securities: /securit|commodit/i,
  'consumer-fraud': /consumer|fraud|truth in lending|other statutory/i,
  employment: /jobs|labor|employ|americans with disabilities/i,
  'insurance-coverage': /insurance/i,
};

// Codes whose distinguishing half is the word "Other": Contract: Other, Civil
// Rights: Other, P.I.: Other, Other Statutory Actions. A catch-all cannot
// contradict a tag, because it names nothing to contradict it with. Universal
// Property is the case that forced the distinction — a franchise termination
// pleaded under the Petroleum Marketing Practices Act is a statutory action on
// the cover sheet, and the code has no franchise box to tick unless the claim
// sounds in contract. The reading has to say "silent", not "wrong".
const CATCH_ALL = /(?::\s*other|^(?:\d+\s+)?other statutory actions?)$/i;

export function natureOfSuitReading(subject, nos) {
  if (!nos) return 'The docket reports no nature-of-suit code.';
  if (subject === 'data-privacy-cybersecurity')
    return `Docketed ${nos}. There is no nature-of-suit code for a data breach — `
      + 'these are filed under contract or personal injury — so the code neither '
      + 'corroborates nor contradicts the tag.';
  const pattern = NOS_FOR_SUBJECT[subject];
  if (pattern && pattern.test(nos)) return `Docketed ${nos}, consistent with the tag.`;
  if (CATCH_ALL.test(nos.trim()))
    return `Docketed ${nos}, a catch-all that names no subject, so the code is `
      + 'silent rather than contrary. The opinion still decides the tag.';
  return `Docketed ${nos}, which does not name this subject. Read the opinion before promoting.`;
}

const HOST = 'https://www.courtlistener.com';
const STORAGE = 'https://storage.courtlistener.com';

export function buildProposal(c, { district, researchDate }) {
  const page = `${HOST}/docket/${c.docket_id}/${c.ecf}/${c.slug}/`;
  const pdf = c.filepath ? `${STORAGE}/${c.filepath}` : null;
  const id = `${c.judge_slug}--${slugify(c.caption)}`;

  return {
    id,
    district,
    judge_slug: c.judge_slug,
    judge_name: c.judge_name,
    judge_office: c.judge_office ?? 'district',
    caption: c.caption,
    citation_line: `${c.caption}, No. ${c.district_docket}, ECF No. ${c.ecf} (D.N.J. ${longDate(c.date)})`,
    district_docket: c.district_docket,
    appellate_docket: null,
    additional_dockets: [],
    reporter_cite: null,
    court: 'D.N.J.',
    tier: 'recent',
    document_type: 'opinion',
    rr_disposition: null,
    headnote_district_ruling: null,
    qualification_rationale: null,
    appellate_posture_note: `No appellate disposition identified as of ${researchDate}.`,
    headnote_status: 'draft',
    public_url: page,
    links: [
      { anchor: `District opinion, ECF ${c.ecf} (CourtListener)`, url: page },
      ...(pdf ? [{ anchor: 'District opinion PDF (RECAP)', url: pdf }] : []),
    ],
    link_level: 'district',
    classification: null,
    score_total: null,
    components: {},
    subject_screen: 'qualifying',
    subject_label: c.subject_label,
    subject_screen_exclusion_reason: null,
    publish_subject_index: true,
    subject_primary: c.subject,
    subject_secondary: [],
    subject_index_only: false,
    procedural_tags: [],
    motion_type: null,
    disposition: null,
    taxonomy_gap: null,
    decision_ecf_number: String(c.ecf),
    decision_date: c.date,
    authored_by: c.judge_name,
    authorship_source: 'docket_entry_signature',
    research_cutoff: researchDate,
    status_checked: researchDate,
    last_verified: researchDate,
    _ingest: {
      source: 'recap',
      matched_subject: c.subject,
      matched_terms: c.terms,
      docket_entry: c.entry,
      nature_of_suit: c.nos ?? null,
      nature_of_suit_reading: natureOfSuitReading(c.subject, c.nos),
      window: c.window,
      subject_is_hypothesis: true,
      needs: [
        'CONFIRM THE SUBJECT against the holding, then retag or discard',
        'headnote written from the public opinion',
        'procedural tags',
        ...(pdf ? [] : ['PDF link added — the search did not report a storage path']),
        'link verified to resolve',
      ],
    },
  };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function longDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

// Matches the ids already in review/pending: lowercase, punctuation to hyphens,
// apostrophes dropped rather than hyphenated so O'Brien is o-brien as filed.
export function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[.,]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
