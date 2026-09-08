# Federal Bench Reference — corrected content layer (D.N.J.)

Drop-in replacement for the content layer. Nothing here is a design change.

    data/judges/*.json        43 jurist records, structural facts populated,
                              narrative facts null and unverified
    data/roster-manifest.json counts and the divergences from the prior report
    data/poison-list.json     facts confirmed wrong; the gate blocks their return
    scripts/build-roster.py   regenerates the records from the roster source
    scripts/patch-verified.py applies the content checked on 2026-09-03
    scripts/validate-content.mjs  the build gate
    docs/CORRECTIONS.md       what was wrong, and the source for each fix
    docs/VERIFICATION-WORKLIST.md  what to do next, in order
    docs/SELECTION-SPEC.md    which opinions belong on a page, and why
    docs/LAUNCH-CHECKLIST.md  everything between a working build and a live site
    docs/HANDOFF.md           desktop setup, exact commands, Claude Code brief
    data/signoffs.json        the curator's ledger; CODEOWNERS-protected
    scripts/sign-record.mjs   records a sign-off, bound to a content hash
    scripts/check-links.mjs   resolves every URL; needs open network access
    .github/workflows/        the gate, on push, on PR, and weekly
    public/_headers           edge headers; carries the noindex launch switch
    public/_redirects         secondary domain to primary
    templates/judge-page.html the approved design, stripped of all specimen facts

## Run the gate

    node scripts/validate-content.mjs
    node scripts/validate-content.mjs --stale-days 30

Wire it into the build and into CI. Exit 1 blocks.

## Sign-off

The `reviewer` field inside a judge record is self-reported and an automated
process can type any name into it. Authority therefore lives in
`data/signoffs.json`, which CODEOWNERS protects, and each entry is bound to a
sha256 of the record's publishable content. Edit a signed record and the hash
stops matching, the sign-off lapses, and the build blocks until a human signs
again. Editorial notes are excluded from the hash, so a correction can be
reworded without invalidating a sign-off on the substance.

    node scripts/sign-record.mjs <jurist_id> --reviewer "Name"
    node scripts/sign-record.mjs --verify-all

## The gates

1. Schema. Every roster fact names its source and its check date.
2. Review. `publish: true` requires a named reviewer and a review date on the
   biography and on every opinion, and a headnote on every opinion. Publish the
   citation and the link alone, or hold the entry.
3. Westlaw firewall. No subscription research service anywhere in reader-facing
   content. Editorial notes are excluded so a correction can name its error.
4. Sources. Opinion and biography links must resolve to GovInfo, CourtListener
   or RECAP, Justia, uscourts.gov, ca3, njd or the FJC. Advocacy, party,
   commercial-AI and press hosts are refused.
5. Tone. Language that characterizes the judge rather than the holding fails the
   build. Prediction language fails the build.
6. Appellate currency. Any vacated, reversed, stayed or remanded posture needs a
   status check inside the window.
7. Poison list. A fact once corrected cannot reappear.

Verification states are `unverified`, `source-checked` and `verified`. Only
`verified` clears the gate, and only a named human can set it.


## Rebuilding from scratch

The builder seeds and never overwrites. Verification is layered on top by the
patch scripts, so a rebuild cannot erase a curator's sign-off:

    python3 scripts/build-roster.py      # creates missing records only
    python3 scripts/patch-verified.py    # source-checked content, 2026-09-03
    python3 scripts/patch-batch1.py      # roster and biography verification
    python3 scripts/patch-batch2.py      # appellate postures
    node scripts/validate-content.mjs

Run in that order on an empty `data/judges/` and the tree reproduces exactly.
`build-roster.py --check` writes nothing and reports drift: records on the
roster source missing from the tree, records in the tree no longer on the roster
source, and divergence in name, office or vicinage. CI runs it on every push.

Drift is a signal, not an error. The court's directory changed, or a patch
script deliberately changed something. A human decides which.

## Deployment posture

The preview is `noindex` at the edge and behind Cloudflare Access. Removing the
`X-Robots-Tag` line from `public/_headers` is the launch switch and the last
item on the checklist. Everything above it on that list is a decision, not a
task, and none of the decisions are Claude's.
