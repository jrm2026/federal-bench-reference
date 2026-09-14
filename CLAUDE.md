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
    node scripts/resolve-links.mjs --district=dnj   # needs COURTLISTENER_TOKEN
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

## Data model

    src/content/districts/<district>/
      district.json
      judges/<slug>.json      41 for dnj
      opinions/<id>.json      95 for dnj
    src/content/config/       taxonomy, policy, firm, curator
                              poison-list, signoffs, roster-manifest

Schemas live in `src/content.config.ts` and are strict — a malformed record
fails the build rather than rendering. Subject and procedural tags must come
from `taxonomy.json`; there is no free-text tagging. Display labels live in
`taxonomy.labels`; the keys are the authority.

**Opinion identity is `judge_slug` + `caption` + `docket`.** Caption alone
collides on this corpus — *United States v. Jackson* appears on two judges'
pages, *Veterans Guardian v. Platkin* on two more. A matcher keyed on caption
will silently consume the wrong record. This has already happened once.

**Captions drift between the district court and the appeal.** *Bryman v. Murphy*
on appeal is *Govatos v. Murphy* below. Resolve by docket, never by name.

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
no date cutoff. All 95 current records are this tier.

`tier: "recent"` is the matter-relevant tier: subject tag on the intake list,
inside the lookback window, link resolves. Three gates, no scoring. **This tier
does not exist yet and it is what the mail campaign actually needs.** Do not run
matter-relevant candidates through the significance rubric; it will reject
exactly the ordinary trade-secrets TRO the recipient wants to see.

Lookback windows and caps live in `policy.json`. Render the governing window as
a line under each section heading so the reader can calibrate.

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
- CourtListener throttles at 5 requests/minute without a token. GovInfo package
  IDs are deterministic from the docket (`USCOURTS-njd-1_23-cv-12601`), so try it
  first. Justia district paths are predictable but need one probe for the case ID.
- `legacy/` holds the superseded scaffold — the flat `data/judges` tree, its
  build and patch scripts, the old page templates and the old gate. Nothing
  builds from it and nothing imports it. It is kept only until the merge is
  confirmed; delete it.

## Current state

Built and passing: 49 pages, 41 judges with verified biographies and source
links, 95 scored and subject-screened decisions, both gate halves, the sign-off
ledger, the poison list, CI, and the daily-ingest workflow skeleton.

`docs/VERIFICATION-WORKLIST.md` holds the open items in the order I would take
them. The first two came out of the merge: *Antar v. Borgata* has no
district-level link and no docket to resolve one by, and the FindLaw question on
*Ireland v. Hegseth* is undecided. After those, link resolution, then the
matter-relevant tier, then the firm block, then the Phase 3 news module.

`ingest-daily.yml` calls `scripts/ingest-courtlistener.mjs`, which does not
exist. The workflow will fail if it fires before that script is written.

## Ownership

Repository, domain, and API credentials belong to Jay R. McDaniel personally.
The sponsoring firm appears only in `firm.json`, so it detaches cleanly.
