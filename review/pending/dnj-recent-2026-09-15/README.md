# Proposed: dnj recent tier, 15 September 2026

Thirty-six candidates from CourtListener's RECAP document index, covering all
thirteen intake subjects. Nothing here renders and nothing here is finished.

    trade secrets                  2   Neals, Semper
    restrictive covenants          2   Castner, Wigenton
    trademark and unfair comp.     3   Castner, Hayden, Semper
    copyright                      3   Castner, Neals, Semper
    commercial contract            3   Kiel, Neals, Semper
    business torts                 2   Hayden, Wigenton
    closely held and fiduciary     1   Castner
    franchise and distribution     4   Castner, Neals, Padin, Semper
    securities                     3   Kiel, Neals, Semper
    consumer fraud                 2   Castner, Padin
    employment                     5   Castner, Kirsch, Neals, Semper 2
    insurance coverage             4   Castner, Hayden, Kirsch, Semper
    data privacy                   2   Semper, Wigenton

Every judge here had a thin page: Semper none, and Castner, Hayden, Kiel,
Kirsch, Neals, Padin and Wigenton one apiece. The judge, date and ECF number
come from the clerk's signature line, so each record carries
`docket_entry_signature` rather than an inference. Those are sound.

## The subject tag is a hypothesis, and the docket says how good a one

The tag records which search found the document. A full-text search matches
terms anywhere in the document, not in the holding, so the tag is a guess until
someone reads the opinion — and on the first eleven records it was close to a
coin flip.

What changed the odds is the docket's nature-of-suit code, which the search
result does not carry but the dockets endpoint does for one cheap call. The code
is the plaintiff's civil cover sheet as the clerk recorded it. It says nothing
about the holding, so it can never confirm a tag. It can contradict one, and it
does, often enough to be worth the call every time.

Four candidates never became records because of it. *Ocean Port Enterprise v.
Fox Glass* surfaced on "LLC operating agreement" and is docketed Rent Lease &
Ejectment. *Miller v. Brozen* surfaced on "breach of fiduciary duty" and is
docketed ERISA. *Arro-Mark v. Warren* surfaced on "closely held" and is docketed
under the Defend Trade Secrets Act. *Winters v. Valleau* surfaced on
"shareholder derivative" and is a prisoner civil-rights case.

Two records are gone on the strength of the code. *Glaud v. NFL Player
Disability and Survivor Benefit Plan* matched the business-torts term "breach of
fiduciary duty" and is docketed ERISA, where the duty is the one a plan
administrator owes a participant. *Hinds v. Sun Pharmaceutical* matched consumer
fraud, surfaced again in the data-breach search, and is docketed pharmaceutical
products liability. Neither subject is on the intake list. Both are in
`review/dropped/` with the reasoning. Consumer fraud is not left empty: *Novick
v. Unilever United States* before Padin and *Shafranski v. NewRez* before
Castner replace it, docketed Other Fraud and Consumer Credit respectively.

Three tags moved, each where the code and the caption agree and no reading of
the opinion could change the answer. *St. Paul Protective Insurance Co. v.
Macor* came from the copyright search, is captioned for an insurer and is
docketed Insurance; it is now insurance-coverage. *Bernard v. Comport
Consulting* and *Rosely v. Strive Asset Management* both matched a trade-secrets
term somewhere in the document and are both docketed Civil Rights: Jobs; they
are now employment. `_ingest.retagged_from` records where each came from, and
`matched_subject` still names the search that found it.

The retags cost trade secrets half its entries, four down to two, and take
employment to five. That is the right direction. A trade-secrets heading holding
two employment cases would have been the exact failure this section is about,
and employment at five is still one per judge except Semper, who has two.

Reading the *Universal Property* opinion forced a distinction the reading logic
had been missing. That case is a franchise termination under the Petroleum
Marketing Practices Act — seventeen Circle K gas-station franchise agreements in
Florida, each a lease plus a fuel supply contract, assigned to Lehigh Gas and
terminated in February 2020 — and it is docketed Other Statutory Actions because
a PMPA claim is a federal statutory action. The code had no franchise box to
tick. It was not contradicting the tag; it had nothing to say about it.

So `natureOfSuitReading` now separates a contradiction from a catch-all. Codes
whose distinguishing half is the word "Other" — Contract: Other, Civil Rights:
Other, P.I.: Other, Other Statutory Actions — are silent rather than contrary,
and no longer set `subject_conflict`. Every real contradiction this sweep found
came from a specific code: ERISA, Pharmaceutical Personal Injury, Civil Rights:
Jobs, Rent Lease & Ejectment, Negotiable Instrument. The change sharpens the
test rather than relaxing it.

That leaves one contradiction:

    American Financial Resources v.        business torts   → Negotiable
      LoanCare                                                Instrument

and two records where the code is silent and the opinion still decides the tag:
*Tucker v. The Arc*, docketed Civil Rights: Other, which covers disability and
public-accommodation claims as well as employment ones; and *Universal
Property*, now read and confirmed. Its `_ingest.subject_confirmed` records what
was read and why the tag stands.

A wrong tag is worse here than a missing one. It would put a decision under a
matter type a reader chose *because it matches the complaint they were served
with*.

## What each still needs

1. Confirm the subject against the holding. Retag or discard. The
   nature-of-suit reading on each record says how much work that is.
2. A headnote, written from the public opinion. Null by design: no automated
   process writes what a judge decided, and a commercial headnote never enters
   this repo.
3. Procedural tags from `taxonomy.json`.
4. The link verified. Twenty-two records carry the RECAP PDF as the API
   reported it; fourteen carry only the docket-entry page, because the search
   that found them was not asked for the storage path. Do not construct one —
   the Universal Property opinion is filed at `.165.0_1.pdf` and the obvious
   guess is a dead link. The network policy in the build container blocks
   `storage.courtlistener.com` outright, so neither form can be checked from
   here; `scripts/check-links.mjs` needs open network access, as it says.
5. The judge's counts raised in `src/content/districts/dnj/judges/`.

Then `npm run validate` and move the file into
`src/content/districts/dnj/opinions/`.

## What the sweep found out

The corpus is far deeper than the tier was designed against. Counting only
signed decisions with a retrievable PDF, D.N.J. since 2018 returns 556 in
securities, 360 in trademark, 301 in copyright, 291 in franchise and 239 in data
privacy; employment returns 145 since 2024 alone. Four of the five subjects swept
earlier were counted before the signature filter existed and so counted every
document, opinions and exhibit stacks alike: 2,083 for business torts, 829 for
consumer fraud, 563 for trade secrets, 256 for restrictive covenants. Either way
the conclusion holds. Scarcity is not the constraint. The per-judge-per-subject
cap is, and after that the headnote work, which is human by design and does not
scale with the search.

Adding `AND "Signed by Judge"` to every query is what made a hand sweep
possible. The phrase lives in the clerk's docket text, not the document, so it
cuts the result set to signed orders and opinions and drops the complaints,
briefs and exhibit stacks that otherwise fill the first page. It also
guarantees the one thing every record needs, which is an authorship source that
is not a guess.

Franchise is the richest vein and the best fit for this reader, and the two
facts have the same cause. Wyndham is headquartered in Parsippany, and Days
Inns, Super 8, Travelodge, Baymont, Microtel, AmericInn and La Quinta are its
brands; their franchise agreements carry D.N.J. forum clauses. So the docket
fills with a Newark plaintiff suing an out-of-state franchisee who has just been
served and has no New Jersey counsel. That is the mail program's reader,
described exactly.

Closely held and fiduciary is the opposite, and it is thin for a structural
reason rather than a research failure. Oppression, dissolution and the fiduciary
duties among owners are state-law claims, and the federal door is diversity —
which usually shuts, because an LLC takes the citizenship of its members, so a
member suing his own company is not diverse from it. *Zambelli Fireworks v.
Wood*, 592 F.3d 412 (3d Cir. 2010). What reaches D.N.J. is the residue: a
foreign corporate parent, a diverse buyer, an arbitration to confirm. One
candidate survived the sweep, *Onyx Enterprises Canada Inc. v. Royzenshteyn*
before Castner, and it is a real founders' dispute. Expect the page to stay
short and say so rather than padding it.

Two changes to `taxonomy.json` came out of this. Seven intake subjects had no
display label, so the judge pages would have rendered headings like "Data
Privacy Cybersecurity" off the title-cased key; the labels are now written. And
the insurance-coverage search string ended `OR "declaratory judgment" AND
policy`, which reads as a precedence bug and is not one — Lucene binds AND
tighter than OR — so it is now parenthesized to say what it always meant.

The filter earned its test file. `scripts/lib/recap.test.mjs` holds eighteen
real docket descriptions and the classification each should get; it was widened
twice by reading output rather than reasoning about it. The hardest class is not
the motions, it is the procedural *opinions*: a trade-secrets case generates
real opinions by the right judge on sealing, on compelling discovery, on
attorney's fees, none of them a decision about trade secrets.
