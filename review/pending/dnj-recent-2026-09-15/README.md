# Proposed: dnj recent tier, 15 September 2026

Eleven candidates from CourtListener's RECAP document index, across five of
the thirteen intake subjects. Nothing here renders and nothing here is
finished.

    trade secrets           4   Neals 2, Semper 2
    restrictive covenants   2   Castner, Wigenton
    copyright               1   Castner
    business torts          3   Wigenton, Kiel, Hayden
    consumer fraud          1   Kirsch

Every judge here had a thin page: Semper none, and Wigenton, Castner, Kiel,
Hayden, Kirsch and Neals one apiece.

The judge, date and ECF number come from the clerk's signature line, so each
record carries `docket_entry_signature` rather than an inference. Those are
sound.

## The subject tag is a hypothesis, not a finding

Read this before promoting anything. The tag on each proposal records which
search found the document, and a full-text search matches terms *somewhere in
the document*, not in the holding. Two of these are visibly wrong already:

- *St. Paul Protective Insurance Co. v. Macor* surfaced from the **copyright**
  search and is, on its caption, an insurance coverage case.
- *Glaud v. NFL Player Disability and Survivor Benefit Plan* surfaced from
  **business torts** and reads as an ERISA benefits dispute.

Both may still be right — a coverage action can turn on whether a policy
reaches copyright claims — and neither is knowable without reading the opinion.
That is why `_ingest.subject_is_hypothesis` is true on every record and why the
first item in `needs` is to confirm or retag.

A wrong tag is worse here than a missing one. It would put a decision under a
matter type a reader chose *because it matches the complaint they were served
with*.

## What each still needs

1. **Confirm the subject** against the holding. Retag or discard.
2. **A headnote**, written from the public opinion. Null by design: no
   automated process writes what a judge decided, and a commercial headnote
   never enters this repo.
3. **Procedural tags** from `taxonomy.json`.
4. **The link verified** to resolve to the right document.
5. **The judge's counts raised** in `src/content/districts/dnj/judges/`.

Then `npm run validate` and move the file into
`src/content/districts/dnj/opinions/`.

## What the sweep found out

The corpus is far deeper than the tier was designed against. Searching D.N.J.
since 2019 or 2020, with a retrievable PDF:

    trade secrets           563 documents
    restrictive covenants   256
    copyright               713
    consumer fraud          829
    business torts        2,083

So scarcity is not the constraint. The per-judge-per-subject cap is, and after
that the headnote work, which is human by design and does not scale with the
search. Eight subjects remain unsearched — trademark, commercial contract,
closely held fiduciary, franchise, securities, employment, insurance coverage,
data privacy — and they are a scripted run, not a hand sweep.

The filter earned its test file. `scripts/lib/recap.test.mjs` holds eighteen
real docket descriptions and the classification each should get; it was widened
twice by reading output rather than reasoning about it. The hardest class is
not the motions, it is the procedural *opinions*: a trade-secrets case
generates real opinions by the right judge on sealing, on compelling discovery,
on attorney's fees, none of them a decision about trade secrets.
