# Federal Bench Reference

A neutral, sourced reference to the federal bench. District of New Jersey
first, built to absorb SDNY, EDNY and further districts as subdirectories under
one domain. It supports a direct-mail program: the recipient is an out-of-state
defendant newly served in D.N.J. who has not yet appeared through counsel, and
the letter points at the page for the judges on the docket.

    npm install
    npm run validate      # the gates; run before every commit
    npm run dev           # local preview on :4321
    npm run build         # gates, then astro build; exit 1 blocks the deploy

`CLAUDE.md` is the operating summary. `docs/handoff.md` is the specification.

## Layout

    src/content/districts/<d>/judges/*.json    the jurists, one file each
    src/content/districts/<d>/opinions/*.json  the decisions, one file each
    src/content/config/                        taxonomy, policy, firm, curator
    src/content/config/poison-list.json        facts confirmed wrong
    src/content/config/signoffs.json           the curator's ledger
    src/content.config.ts                      strict schemas; malformed fails the build
    src/pages/districts/[district]/            bench index and judge pages
    src/layouts/Base.astro                     the shell, the banner, the footer
    scripts/validate.mjs                       schema, taxonomy, scoring, identity
    scripts/gates-compliance.mjs               what a reader is allowed to see
    scripts/sign-record.mjs                    the curator's sign-off, hash-bound
    scripts/check-links.mjs                    resolves every URL; needs open network
    scripts/resolve-links.mjs                  fills missing district links
    review/pending/                            where ingestion proposes; a human merges
    docs/                                      the specification and the open decisions
    public/_headers                            edge headers; carries the noindex switch
    wrangler.jsonc                             Workers static assets, serving dist/

`src/content/` sits outside the assets root. The records are versioned here and
never served; only what Astro renders into `dist/` reaches the edge.

## The one rule

Nothing about a sitting judge publishes unverified, and the site describes what
a judge has **done** — never what a judge will do. That is not editorial taste.
It is what keeps the site inside RPC 8.4(e) and 8.2, and the whole design
follows from it.

## The gates

`npm run validate` runs both halves and exit 1 blocks the build.

Data integrity, in `scripts/validate.mjs`: strict schemas; a closed subject and
procedural vocabulary; score components that must sum to their total and clear
their independent floors; the five-per-judge cap; declared counts that must
match the records on disk; and opinion identity keyed on judge, caption **and**
docket, because caption alone collides on this corpus. Every page must render
through `Base.astro`, which carries the advertising banner.

Compliance, in `scripts/gates-compliance.mjs`:

1. Fail closed. A missing gate file stops the run rather than switching a gate
   off. A tree that once arrived without its gate files reported "passed."
2. Westlaw firewall. No subscription research service in reader-facing content.
3. Sources. Opinion links must resolve to a free public repository — GovInfo,
   CourtListener, Justia, uscourts.gov, ca3 or the FJC. Advocacy, party,
   commercial-AI and commercial-press hosts are refused. Biography sources
   outside that list warn rather than block.
4. Tone. Language characterizing the judge rather than the holding fails.
5. Neutrality. Tallies and outcome-based selection language fail. A tally is a
   prediction wearing the costume of a fact.
6. Appellate currency. A vacated, reversed, stayed or remanded posture needs a
   status check inside the window — 45 days, `--stale-days` to change it.
7. Poison list. A fact once corrected may not reappear.
8. Sign-off ledger. Lapsed and orphaned entries block. Unsigned records are
   reported; `--require-signoffs` makes them block.

No per-judge aggregate statistics of any kind — not computed, not stored, not
rendered. The gate fails on field names matching that pattern. Aggregation
across the whole bench, as on `/topics/`, is fine.

## Sign-off

The confidence field inside a record is self-reported, and an automated process
with write access to `src/content` can set it. Authority therefore lives in
`src/content/config/signoffs.json`, which CODEOWNERS protects, and each entry is
bound to a sha256 of everything on that judge's page: the biography and every
opinion record keyed to the slug. Edit any of it and the hash stops matching,
the sign-off lapses, and the gate reports it. Scores and workflow dates are
excluded, so re-scoring a decision does not lapse a sign-off on the substance.

    node scripts/sign-record.mjs <slug> --reviewer "Name"
    node scripts/sign-record.mjs --verify-all

Read the rendered page, not the JSON, and ask the question the gate cannot:
would a reader infer a tendency from this selection?

## Deployment posture

This is a Workers project, not Pages. The difference is not cosmetic: Workers
allows only relative URLs in `_redirects` and rejects the whole file over one
absolute rule.

The preview is `noindex` at the edge and behind Cloudflare Access. Removing the
`X-Robots-Tag` line from `public/_headers` is the launch switch and the last
item on `docs/LAUNCH-CHECKLIST.md`. Everything above it on that list is a
decision, not a task, and none of the decisions are Claude's.

## Ownership

Repository, domain and API credentials belong to Jay R. McDaniel personally.
The sponsoring firm appears only in `src/content/config/firm.json`, which takes
per-district overrides, so it detaches cleanly.
