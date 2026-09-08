# Verification worklist

43 records exist. None is publishable. The gate reports `0 marked publish=true`,
which is the correct state on day one. Work in this order.

## 1. Roster confirmation (blocks everything, one sitting)

Confirm from the court and the FJC, not from the prior report:

- Hammer's original appointment date and current term expiry.
- Pascal's appointment date. The report shrugs at "on bench by August 2022" and
  falls back on Martindale. The court publishes a Notice to the Bar and a merit
  selection panel notice for every magistrate appointment.
- Espinosa's appointment day, not just the month.
- Clark's law school. The report flags a conflict between St. John's and Seton
  Hall and correctly declines to choose. A merit selection notice or the court's
  profile resolves it. If it does not, publish the fact as disputed or omit it.
- Senior status dates for Chesler, Hayden and Martini, which the roster carries
  as original commission dates pending FJC reconciliation.
- Whether Cooper, Thompson, Sheridan and McNulty have received an assignment in
  the last twelve months. Docket evidence, then a status sentence.

## 2. Appellate currency (blocks the four flagship pages)

The gate treats any vacated, reversed, stayed or remanded posture as stale after
45 days. Four entries need a certiorari docket check before launch and on a
standing schedule after it:

- *ANJRPC v. Platkin* — Third Circuit judgment stayed 4 Aug 2026 pending New
  Jersey's petition. Has the petition been filed or acted on?
- *Khalil* — mandate stayed 26 May 2026 pending certiorari. Same question.
- *Koons v. Platkin* — appellate scope and any Supreme Court activity were not
  re-verified. Read the 10 Sept 2025 opinion and state precisely which
  provisions survived.
- *McIver* — Count Three is on remand to Judge Semper. Track it.

## 3. Biographies and page spine (37 records)

Move the practice information block and the appearing-from-out-of-state material
above the case list on the judge page template. Those sections are complete for
every judge on day one and carry the pages of the newest judges, who have no
corpus and who will nonetheless receive mail.



Draft from the FJC for Article III judges and from the court's profile and
Notices to the Bar for magistrate judges. Nothing from the prior report goes in
without a primary-source read. Bumb is done to `source-checked` as the pattern
to follow; she still needs a curator sign-off to publish.

Kill the "Other writings" field from the published site. Thirty-odd repetitions
of "no separately authored publication was located" tells a reader nothing and
implies a deficiency in the judge. Keep the search result in the data layer.

## 4. Case selection (the real work)

Governed by docs/SELECTION-SPEC.md. The short version: select at the
intersection of early-stage procedure and the six matter types, not on the
matter types alone. Personal jurisdiction first, then venue and transfer, then
injunction practice, then arbitration and forum selection, then remand, then
Rule 12(b)(6). Summary judgment last. Criminal, MDL and off-taxonomy statutory
work come out entirely.

Treat the magistrate pages as equal in priority to the district judge pages.
The mail piece names both, this reader will see the magistrate more in year one,
and magistrate output is procedural, which is both what the reader needs and the
easiest thing to summarize without characterizing anyone.

Two tiers with different rules, enforced by gate 9. Significant opinions: three
per judge maximum, sixty words each, existing for credibility. Matter-relevant
opinions: the full 250 to 500 word headnote, tagged with a posture from
taxonomy.json.

Bias toward settled opinions. Every disturbed-posture entry is a recurring
status check forever, and the gate warns past twelve across the tree.

Never select by outcome. Gate 8 catches tallies and outcome-phrased selection
bases, but the gate is a backstop. Publish the criteria on the methodology page.

Do not gate launch on headnotes. Gate launch on the roster and the bios.

## 5. Link durability

GovInfo `USCOURTS-...-0.pdf` package URLs are brittle and the suffix is not
stable. Before launch, run the full link check on a machine with open network
access, capture an archive URL for every opinion, and store both. The allowlist
in the gate checks the host; it does not check that the link resolves.

## 6. Ingest, once the above is stable

Three feeds, in ascending order of cost:

- The court's public ECF RSS feed at `ecf.njd.uscourts.gov/cgi-bin/rss_outside.pl`
  gives new filings free, with no editorial content and no subscription-service
  exposure. Evaluate it against the docket alert currently contemplated for the
  private pipeline; it may replace it.
- Notices to the Bar, for roster and procedure changes. Weekly.
- CourtListener, for opinions by judge and by category. Draft-only, pull request
  only, as specified.

## Standing cadence

Daily or weekly: new opinions, MDL orders, appellate dispositions.
Monthly: roster, designation page, chambers links, judicial preferences.
Quarterly: full FJC reconciliation, biography source audit, link check, and a
rerun of every "not located" search.
Event-driven: appointment, elevation, chief judge change, senior status, recall,
retirement, resignation, death, reassignment, recusal, appellate mandate.
