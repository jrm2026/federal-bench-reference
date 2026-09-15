# CLAUDE.md — Federal Bench Reference

A neutral, sourced reference to the federal bench. District of New Jersey first,
built to absorb SDNY, EDNY and further districts. It supports a direct-mail
program: recipients are out-of-state defendants newly served in D.N.J. who have
not yet appeared through counsel, and the letter points them at the page for the
District Judge and Magistrate Judge on their docket.

Read this file before changing anything. `docs/handoff.md` is the full
specification; this file is the operating summary.

## Commands

    npm install
    npm run validate      # data and compliance gates — run before every commit
    npm run signoffs      # the curator's ledger
    npm run dev
    npm run build         # gates, then astro build; exit 1 blocks the deploy
    npm run resolve-links -- --district=dnj    # needs COURTLISTENER_TOKEN
    npm run reconcile -- --district=dnj --held # same
    npm run resolve-decisions -- --district=dnj --held  # needs COURTLISTENER_TOKEN
    npm run inventory -- --district=dnj        # regenerates docs/HELD-ENTRIES.md
    npm run ingest -- --district=dnj           # proposes the recent tier from RECAP
    npm run ingest -- --district=dnj --source=govinfo --subjects=trade-secrets
    # Both read .env via --env-file-if-exists. Calling node directly does not:
    # Node ignores .env unless told, and the run falls back to the 5/min throttle.
    node scripts/check-links.mjs                    # needs open network access

## The one rule that governs everything

Nothing about a sitting judge publishes unverified, and the site describes what
a judge has **done** — never what a judge will do.

That is not editorial taste. It is what keeps the site inside RPC 8.4(e) and
8.2, and the whole design follows from it. When a change would make a page more
persuasive, more flattering, or more predictive, the change is wrong even if it
would be more useful.

## Hard constraints — do not relax these

1. **No per-judge aggregate statistics.** No grant rates, reversal rates,
   average time to ruling, ideological scoring, percentile ranks. Not computed,
   not stored, not rendered. `scripts/validate.mjs` fails the build on field
   names matching that pattern. Topic-page aggregation *across the whole bench*
   is fine. If you find yourself arguing for a narrow exception, stop.
2. **No characterization of a judge.** Dispositions are factual phrases taken
   from the opinion ("granted in part"). Never "sharply rejected", never
   "plaintiff-friendly". The gates check the records for this; they cannot check
   prose you write, so you have to.

   The hard case is not the adjective, it is the accurate sentence. The held
   *United States v. Jackson* entry on Hayden's page states that the Third
   Circuit vacated her sentences three times and then reassigned sentencing to
   another judge, and justifies the selection "partly because of the unusual
   sequence of appellate reversals". Every word is sourced. On a page bearing
   her name it still lands as a verdict on the judge, and selection resting on
   how an appellate court treated her is outcome-based selection whatever the
   verb. The neutrality gate warns on that framing rather than blocking it,
   because the sentence may be the only honest way to state the posture. The
   curator decides whether the page can carry it.
3. **Every page renders through `src/layouts/Base.astro`**, which carries the
   attorney-advertising banner and the sponsor footer. No page opts out. The
   gates walk all of `src/pages` and fail any page that does not import it.
4. **Westlaw firewall.** No headnotes, synopses, key numbers, or alert summary
   text ever enter this repo. Case authority is a citation plus a link to a free
   public copy. *Thomson Reuters v. Ross Intelligence* (D. Del. 2025) held West
   headnotes copyrightable and rejected fair use.
5. **Never attribute an appellate opinion to the district judge.** Where the only
   public copy is appellate, the entry says so and keeps the warning strip.
6. **Ingestion never writes to `src/content`.** It proposes into
   `review/pending/` and opens a pull request. A human merges.
7. **A fact once corrected may not reappear.** Add an entry to
   `src/content/config/poison-list.json` with every correction. The gate blocks
   any build in which one returns. This has already caught two.
8. **Criminal subject matter is out of scope.** The reader is an out-of-state
   defendant newly served with a *civil* complaint who has not yet appeared. A
   criminal docket tells that reader nothing, and selection among criminal
   outcomes on a page carrying an attorney-advertising banner reads as a verdict
   on the judge however factually each line is written — which is the same
   objection constraint 2 raises against the *Jackson* entry, and excluding
   criminal is what finally answers it.

   The line is subject matter, not docket type. A habeas petition, a § 2255
   motion and a coram nobis petition each carry a civil docket number and are
   excluded on their substance. `scripts/validate.mjs` fails on the three
   removed subject keys and on any `cr` docket, and warns where a headnote reads
   as a prosecution while its subject tag does not — which is how *United States
   v. Smith* surfaced, tagged `evidence-and-sanctions` with a jury conviction
   underneath.

   Four look-alikes stay, and the reasons matter. *United States v. City of
   Newark* is a police consent decree. *United States v. Jefferson* enforces a
   False Claims Act civil investigative demand. *Elfar v. Township of Holmdel*
   is a civil-rights plaintiff pleading malicious prosecution under the Tort
   Claims Act — the tort is civil and the criminal case is only its predicate,
   which is why the prose test warns rather than fails. And
   `privilege-crime-fraud` is procedural, not a subject: it is the crime-fraud
   exception to attorney-client privilege, and both records carrying it are
   civil.

## Data model

    src/content/districts/<district>/
      district.json
      judges/<slug>.json      41 for dnj
      opinions/<id>.json      48 for dnj; 35 held, 12 out of scope
    src/content/config/       taxonomy, policy, firm, curator
                              poison-list, signoffs, roster-manifest

Schemas live in `src/content.config.ts` and are strict — a malformed record
fails the build rather than rendering. Subject and procedural tags must come
from `taxonomy.json`; there is no free-text tagging. Display labels live in
`taxonomy.labels`; the keys are the authority.

**Opinion identity is `judge_slug` + `caption` + `district_docket`.** Caption
alone collides on this corpus — *United States v. Jackson* appears on two judges'
pages, *Veterans Guardian v. Platkin* on two more. A matcher keyed on caption
will silently consume the wrong record. This has already happened once.

A docket also carries more than one decision. *NCAA v. Governor of New Jersey*
is 926 F. Supp. 2d 551 and 61 F. Supp. 3d 488, both Shipp, both on
3:12-cv-04947 — the 2012 law and the 2014 partial repeal — and only the second
was reversed in *Murphy*. One record said both and could say neither
accurately, so identity now carries `decision_ecf_number` too: ECF 142 and ECF
198 are different entries on one docket.

Both caption collisions turn out to be one case before two judges, which is why
the district docket is part of identity but does not by itself distinguish the
entries. *Jackson* was tried and sentenced before Hayden, then reassigned to
Wigenton for resentencing after three sentencing appeals: one criminal docket,
two decisions, two pages, both correct. *Veterans Guardian* is 3:23-cv-20660 with
Shipp presiding and Day referred. Resolving the docket for one entry resolves it
for its twin; deduplicating on the docket would delete a real page.

**A district docket and an appellate docket are different numbers for the same
litigation, and only one of them identifies a district decision.** They lived in
a single `docket` field until 14 September 2026, and a Third Circuit number
stood in for the district one on twelve records because the significance screen
keyed on the existence of an appeal. The field is now split into
`district_docket` and `appellate_docket`. Never write an appellate number into
the first. `scripts/reconcile-dockets.mjs` recovers a district docket from an
appellate one; `docs/DOCKET-RECONCILIATION.md` is the research that remains.

**A docket's assigned judge is not the judge who decided.** District cases are
reassigned constantly. CourtListener's `assignedTo` reports the *current*
assignment and had drifted on all three records checked against the source:
*Berkelhammer* showed Padin where Salas decided, *Huertas* showed Chesler where
Wigenton decided, *J.M. v. Summit City* showed nothing at all. The Berkelhammer
docket records its own mid-case reassignment — "Magistrate Judge Michael A.
Hammer no longer assigned to the case". Never attribute a decision from that
field. Nor from the docket's most recent signer: *Brian Trematore Plumbing v.
Sheet Metal Workers Local 25* is filed under Martinotti and its 2021 opinion is
signed by Vazquez, who had the case first. One docket, two authors, and only the
signature line distinguishes them.

Three sources do name the author, and every record says which one it used in
`authorship_source`. The gate refuses to publish an entry that says
`unverified`, and refuses one whose `authored_by` does not match the page it
sits on.

1. `docket_entry_signature` — the best of the three, because it also yields the
   ECF number and the date. The clerk's line ends "Signed by Judge Esther Salas
   on 3/31/2022", which is who decided, the date, and the document in one string.

   Ask for it directly. RECAP's document index is full-text searchable, so
   `type=rd & court=njd & docket_number=<n> & q="Signed by Judge"` returns every
   signed order on a docket in a single request, each with its ECF number, date,
   signing judge, and whether the PDF is held. `scripts/resolve-decisions.mjs`
   does this. It needs a token: the v4 search endpoint answers 403 to an
   anonymous caller, unlike the read endpoints, which answer and throttle.

   `scripts/reconcile-dockets.mjs` instead walks the docket — notice of appeal,
   the order it names, the entry that ties it to the circuit number — because
   the walk was written before the search was understood. It reads 298 entries
   on *Oakwood* to learn what one query answers, and it exhausted a day's quota
   before finishing the corpus. Keep it only for recovering a district docket
   from an appellate one, which search cannot do.
2. `appellate_cover_page` — "District Judge: Honorable ___" on the appeal.
3. `opinion_text` — the decision document itself, which the entry links to.

RECAP carries the docket text for D.N.J., and it carries more of the documents
than this file claimed until 15 September 2026. `is_available` is false on most
*entries*, which is true and beside the point: most entries are party filings
nobody has bought. It is true of the signed opinions, and that is the only class
this project needs. Five held dockets sampled through the search endpoint each
returned at least one signed dispositive order with a PDF — *Oakwood* four of
five, *Horizon* three, *ADP v. Mork*, *Trematore* and *GEICO* the rest. Try
RECAP first on any docket that went up on appeal. GovInfo stays the source of
record for the matter-relevant tier, where nothing was appealed and RECAP
therefore holds much less.

**An entry belongs on a judge's page only when the district court's own decision
is available.** An appellate opinion shows what the circuit did, not what the
judge did. The gate fails any significant-tier entry whose `link_level` is not
`district`.

The test is whether a judge wrote something, not how the case ended. Entering a
consent decree is ministerial: the parties write the terms and the court signs,
so a docket that records only the entry and its administration holds nothing
this reader can use. That is why *United States v. City of Newark* was dropped
rather than held — nine years of orders, not one reasoned opinion among them.
But where a court writes an opinion alongside the decree, examining its scope or
adequacy, the power to enter and enforce it, an objection, or a motion to modify
or terminate, that opinion is a decision and the entry qualifies like any other.
The same distinction governs stipulated judgments and settlement approvals: ask
what the judge explained, never what label the disposition carries.

**Captions drift between the district court and the appeal.** *Bryman v. Murphy*
on appeal is *Govatos v. Murphy* below; *Khalil v. President* is *Khalil v.
Joyce*; *NCAA v. Governor of New Jersey* is *NCAA v. Christie*; *ANJRPC v.
Platkin* becomes *ANJRPC I v. Attorney General New Jersey* en banc. Resolve by
docket, never by name. Captions also drift by *shortening*: the full Antar
caption names five defendants, so one index files it under Borgata and another
under BetMGM, and the two look like different cases until you read the whole
thing.

**A docket number is written four ways and they are all the same case.** The
leading digit is only the vicinage and is dropped as often as written; the clerk
zero-pads the sequence and nobody else does. So 2:22-cv-05785, 22-cv-05785,
2:22-cv-5785 and 22-cv-5785 are one docket, and a search on the padded form
finds nothing — which is why *Antar* sat in the corpus as "no docket, nothing to
resolve from" while its order was a click away. `scripts/lib/docket.mjs`
normalises and enumerates the forms. Vicinage is deliberately not part of
identity: it changes when a case is transferred, which is why GovInfo carries
ANJRPC under both `1_` and `3_`.

**Secondary sources find what the APIs do not.** Feeding the appellate caption,
the district docket and the date into a search engine resolved five records the
docket text could not, including two whose appeals had never been recorded.
Courthouse News (`courthousenews.com`) is on the source allowlist because it
hosts the court's own filings as PDFs — link the hosted document, never the
article about it. A reporter's account of a ruling belongs on this site no more
than a headnote does.

## The gates

`npm run validate` runs both halves. Exit 1 blocks the build.

`scripts/validate.mjs` checks that the data is well formed: schemas, the closed
vocabulary, score components that sum and clear their floors, the five-per-judge
cap, declared counts against records on disk, opinion identity, and the Base
layout on every page.

`scripts/gates-compliance.mjs` checks that what a reader will see is allowed to
be published: fail-closed on a missing gate file, the Westlaw firewall, the
source-host allowlist, tone, tallies and outcome-based selection, appellate
currency inside a 45-day window, the poison list, and the sign-off ledger.

Unsigned records are reported, not blocked — that is the expected state before
launch. Lapsed and orphaned sign-offs block. `--require-signoffs` makes unsigned
records block too, which is a launch-checklist decision.

## Sign-off

The confidence field inside a record is self-reported, and an automated process
with write access to `src/content` can set it. Authority lives in
`src/content/config/signoffs.json`, which CODEOWNERS protects, and each entry is
bound to a sha256 of everything on that judge's page. Edit any of it and the
sign-off lapses.

    node scripts/sign-record.mjs <slug> --reviewer "Name"

Read the rendered page, not the JSON, and ask the question the gate cannot:
would a reader infer a tendency from this selection?

## Two tiers, selected on different criteria

`tier: "significant"` is the career screen — scored, capped at five per judge,
no date cutoff. All 48 published records are this tier, as are the 35 held.

`tier: "recent"` is the matter-relevant tier: subject tag on the intake list,
inside the lookback window, link resolves. Three gates, no scoring. Do not run
matter-relevant candidates through the significance rubric; it will reject
exactly the ordinary trade-secrets TRO the recipient wants to see.

`scripts/validate.mjs` enforces all three, and refuses a recent record that
carries a significance score — which is how the rubric would creep back in.
Caps are per tier and counted separately: the career screen is capped per judge,
the matter-relevant tier per judge per subject, because a reader arrives with
one subject and five entries in it is already generous. Counting both against
one cap would have failed any judge with a full career screen the moment the
first matter-relevant entry landed.

Judge pages render the two tiers in separate sections. "Selected decisions" is
the career screen; "Decisions by matter type" groups the matter-relevant tier
under the subject the reader arrived with, secondary tags included, with the
governing window stated under the heading. Splitting on `subject_screen` alone
worked only while every record was `significant`.

`scripts/ingest-decisions.mjs` proposes for this tier, from GovInfo. Search
terms per subject live in `taxonomy.json` so they can be tuned without code.

**RECAP supplies this tier; the citable opinions collection does not.** This
file said until 15 September 2026 that CourtListener could not serve it at all.
That was true of the collection it was tested against and false of
CourtListener. Its *citable opinions* collection returns 53 D.N.J. hits for
"trade secret" whose newest is June 2016 — the finding was right, the
conclusion too broad.

The RECAP *document* index is a different thing: full-text searchable across
the filings themselves. `type=rd & court=njd & q="trade secret" &
filed_after=2021-01-01 & available_only` returns 264 opinions with retrievable
PDFs, by Quraishi, Wigenton, Salas, Padin, Martinotti and Castner — the judges
whose pages this tier exists to fill.

It is also the better source, and not only because it has the documents. The
clerk's signature line comes with them, so a record sourced here carries
`docket_entry_signature` — authorship, date and ECF number in one string —
where GovInfo yields a judge field that has to be matched by surname against
the page. `scripts/lib/recap.mjs` does the search; `--source=govinfo` keeps the
older path for a district where RECAP coverage turns out thin.

The earlier reasoning still holds for what it actually explains. RECAP fills
when somebody pays PACER, and somebody always pays on an appealed case, which
is why the held significant entries were so well covered. What that reasoning
got wrong was the inference that nobody buys anything else: a busy commercial
docket generates purchases for reasons other than appeal.

**Ask for the signature line in the query, and ask for both forms.** Every
subject search appends `AND ("Signed by Judge" OR "Signed by Magistrate
Judge")`. The phrase lives in the clerk's docket text rather than the document,
so it cuts a result set from complaints, briefs and exhibit stacks down to
signed orders and opinions, and it guarantees the authorship source the record
needs. The second form is not optional and not a substring of the first: a
magistrate's line reads "Signed by Magistrate Judge Matthew J. Skahill". Query
only the first and the sweep returns no magistrate decision at all, which is
indistinguishable from scarcity.

**A subject tag from full-text search is a hypothesis; the docket's
nature-of-suit code is the cheapest way to test it.** The search matches terms
anywhere in the document, not in the holding, so the tag is a guess until a
human reads the opinion. The code is the plaintiff's civil cover sheet as the
clerk recorded it — a fact about the case, not the ruling — so it can never
confirm a tag. It contradicts a wrong one for one call to `/dockets/<id>/`, and
on this corpus it does so about a fifth of the time. *Ocean Port Enterprise*
surfaced on "LLC operating agreement" and is docketed Rent Lease & Ejectment;
*Miller v. Brozen* surfaced on "breach of fiduciary duty" and is docketed
ERISA; *Arro-Mark v. Warren* surfaced on "closely held" and is docketed under
the DTSA. None became a record. Seven that did carry a contradiction, five of
them among the eleven written before the code was being read; two of the seven,
*Glaud* and *Hinds v. Sun Pharmaceutical*, had no intake subject at all and are
in `review/dropped/`. `natureOfSuitReading` in
`scripts/lib/proposal.mjs` states the three readings, and a contradicted record
carries `_ingest.subject_conflict`. The code never moves a tag on its own: a
franchise docket can still produce a covenant ruling, and a Franchise Practices
Act claim is coded "Other Statutory Actions".

**Take the PDF path from the API or leave it out.** Most RECAP paths are
`gov.uscourts.njd.<pacer>.<ecf>.0.pdf`, which makes constructing one look safe.
The *Universal Property* opinion is filed at `.165.0_1.pdf` and the constructed
form is a dead link. The docket-entry page is the durable link anyway.

Why this tier matters more than the significant one. Of the 48 published
entries, eleven are on an intake-list subject and nine of those were decided
in 2021 or later, and seven intake subjects — trade secrets, restrictive
covenants, copyright, business torts, consumer fraud, franchise, securities —
have no entry at all. The significant
tier cannot fix that: it is a career screen, and a career-significant decision
is one that got appealed, which is why the district-decision rule emptied
fifteen District Judge pages. A recent Rule 12 ruling was never appealed, so
there is no appellate opinion to mistake for it and it sits at the district
level by construction. This tier serves the reader and refills those pages in
the same pass.

A sweep on 15 September 2026 proposed 36 candidates covering all thirteen
intake subjects, on the eight thinnest District Judge pages. Two subjects came
out lopsided, both for reasons about the forum rather than the research.

Franchise is the richest vein and the best fit for this reader, and one fact
causes both. Wyndham is headquartered in Parsippany, and Days Inns, Super 8,
Travelodge, Baymont, Microtel, AmericInn and La Quinta are its brands; their
franchise agreements carry D.N.J. forum clauses. The docket fills with a
Newark plaintiff suing an out-of-state franchisee who has just been served and
has no New Jersey counsel — the mail program's reader, described exactly.

Closely held and fiduciary is the opposite, and it is thin structurally rather
than for want of looking. Oppression, dissolution and the duties among owners
are state-law claims, and the federal door is diversity, which usually shuts:
an LLC takes the citizenship of its members, so a member suing his own company
is not diverse from it. *Zambelli Fireworks v. Wood*, 592 F.3d 412 (3d Cir.
2010). What reaches D.N.J. is the residue — a foreign parent, a diverse buyer,
an arbitration to confirm. Let the page stay short and say so.

The magistrate pages cannot be filled from this source. Querying all five thin
magistrate pages across the intake subjects returns eleven documents, every one
of them scheduling, pro hac vice, a motion to quash or leave to amend, and
three of the five judges return nothing at all. That is the coverage note on the
magistrate template, confirmed rather than assumed.

Lookback windows and caps live in `policy.json`. Render the governing window as
a line under each section heading so the reader can calibrate.

The subject window is 25 years, widened from 5 on 15 September 2026. Five years
returned nothing for trade secrets on any judge while real district decisions in
the subject sat just outside it on judges with empty pages. Candidates are
ordered newest first and the cap fills from the top, so a judge with recent
decisions still gets recent ones and the older material surfaces only where
nothing newer exists.

A wider window reaches back past changes in the law. `policy.json` carries
`doctrinal_watersheds`, and the ingest flags any candidate decided before the
watershed for its subject — the DTSA on 11 May 2016 for trade secrets and
restrictive covenants, the December 2015 Rule 26(b)(1) amendments for discovery.
A 2009 D.N.J. trade-secrets ruling applies the New Jersey Trade Secrets Act or
common law, not the federal cause of action the reader's complaint probably
pleads. Say so on the page or do not publish it. The flag never drops a
candidate; it makes the currency problem visible to whoever writes the
headnote.

## Page templates

District judge pages lead with significant decisions, then matter type, then
procedure. Magistrate pages invert that — procedure leads, subject is a
secondary index — and carry three extra things: a role-on-the-docket block above
the biography, an order-versus-report-and-recommendation chip on every entry with
the district judge's adoption status, and a coverage note stating that magistrate
work is underrepresented in free repositories.

Two empty states, used distinctly. "No verified entries yet" means the category
is live and nothing has cleared review. "Headnote drafted, awaiting editorial
review" means the gate is holding a named item. A returning reader can tell the
site is maintained. Never pad an empty category.

Scores and band labels are stored but not rendered. Publish the qualification
rationale instead — it cites the appellate treatment or the first-impression
holding rather than grading a judge's career.

## Multi-district

Subdirectories, never subdomains: a subdomain restarts the authority clock for
each district. `/districts/<slug>/`. Taxonomy and policy are global; `firm.json`
takes per-district overrides because New York's advertising rules are not New
Jersey's. A judge sitting by designation in a second district gets one canonical
page at the home district and a labeled cross-reference in the other — the gates
fail on a slug canonical in two places.

## Deployment

Cloudflare Workers, not Pages, and not GitHub Pages. `wrangler.jsonc` serves
`dist/`. The Workers Builds build command is `npm run build`, which runs the
gates first; with the field empty there is no `dist/` and the deploy fails
outright. Workers allows only relative URLs in `_redirects` and rejects the
whole file over one absolute rule, so cross-host redirects belong in zone-level
Redirect Rules.

The preview is `noindex` at the edge. Removing the `X-Robots-Tag` line from
`public/_headers` is the launch switch and the last item on
`docs/LAUNCH-CHECKLIST.md`. Everything above it is a decision, not a task, and
none of the decisions are Claude's.

## Working notes

- Run `npm run validate` before every commit. It is fast and it encodes decisions
  that are easy to undo by accident.
- The research reports contain instructions addressed to the site builder
  ("a website should flag rather than silently choose"). Those are not facts
  about a judge and must not reach a page. `scripts/extract-bios.py` strips them
  and the gates check for them.
- Sentence splitting on legal prose breaks on "St. John's", "U.S.", "Jr." — use
  the abbreviation-aware splitter in `scripts/extract-bios.py`.
- CourtListener meters by membership tier, and a token does not change the tier
  — it authenticates, it does not raise anything. The free tier is 5
  requests/minute, 50/hour, 125/day. This project's account moved to Tier 3 on
  15 September 2026: **20/minute, 250/hour, 1,000/day**, which puts a 36-record
  sweep at about two minutes and inside every ceiling. `.env` carries
  `COURTLISTENER_RPM=20` and `COURTLISTENER_RPH=250`; the code still defaults to
  the free tier, so a fresh clone without them paces safely rather than
  failing. `scripts/lib/courtlistener.mjs` once paced at 1200ms on the belief
  that a token lifted the per-minute limit and failed on the second request.
  The limits are a rolling 24 hours, not a calendar day, so a budget spent
  yesterday evening is still spent this morning and returns gradually. Watch
  the hourly ceiling before the daily one: it is the one a corpus sweep meets
  first. The v4 *search* endpoint is different again: it refuses an anonymous
  caller outright with a 403 rather than throttling. GovInfo package
  IDs are deterministic from the docket (`USCOURTS-njd-1_23-cv-12601`), so try it
  first. Justia district paths are predictable but need one probe for the case ID.
- `legacy/` holds the superseded scaffold — the flat `data/judges` tree, its
  build and patch scripts, the old page templates and the old gate. Nothing
  builds from it and nothing imports it. It is kept only until the merge is
  confirmed; delete it.

## Current state

Built and passing: 49 pages, 41 judges with verified biographies and source
links, 82 published decisions and none held, both gate halves, the sign-off
ledger, the poison list, CI, and the daily-ingest workflow skeleton. Every
record published is the career screen; the matter-relevant tier has 36
candidates proposed and none promoted, because promotion needs a headnote and a
headnote is written by a human from the opinion.

Criminal subject matter was excluded on 15 September 2026 and twelve records
moved to `review/pending/dnj-out-of-scope-criminal/`: two that were published,
ten that were held. It emptied two judge pages, Neals and McNulty, whose only
published entries were collateral post-conviction proceedings on civil dockets.
It also cleared most of the unresolvable tail, because the criminal entries
were disproportionately the ones carrying no district docket — the held set's
hard cases fell from nine to three.

`docs/VERIFICATION-WORKLIST.md` holds the open items in the order I would take
them. The matter-relevant sweep is done and its output is in
`review/pending/dnj-recent-2026-09-15/`, thirty-six proposals across all
thirteen intake subjects, five of them carrying a nature-of-suit conflict that
the README lists by name. Confirming the subject and writing the headnote is
the next real work, and it is the curator's. After that, the FindLaw question
on *Ireland v. Hegseth*, then the firm block, then the Phase 3 news module.

`ingest-daily.yml` now calls `scripts/ingest-decisions.mjs`, which exists. It
needs `GOVINFO_API_KEY` in Actions secrets; on DEMO_KEY it throttles hard.

## Ownership

Repository, domain, and API credentials belong to Jay R. McDaniel personally.
The sponsoring firm appears only in `firm.json`, so it detaches cleanly.
