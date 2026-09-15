# Out of scope — criminal subject matter

These entries are not held pending research. They are excluded on scope and
will not be restored.

The reader this site is built for is an out-of-state defendant newly served
with a civil complaint in D.N.J. who has not yet appeared through counsel. A
criminal docket tells that reader nothing. A page listing a judge's
sentencings under an attorney-advertising banner is also the least defensible
thing the site could carry under RPC 8.4(e), because selection among criminal
outcomes reads as a verdict on the judge however factually each line is
written.

The line is drawn at subject matter, not docket type. A § 2255 motion, a
coram nobis petition and a federal habeas petition all carry civil docket
numbers and are criminal in substance, so they are excluded too. Decided by
the curator on 15 September 2026.

Excluded here: `federal-criminal`, `criminal-public-corruption` and
`habeas-post-conviction` as subject keys, and any record whose district
docket is a `cr` docket.

Not excluded, and worth stating because each looks criminal at a glance:

- *United States v. City of Newark* — a police consent decree. Civil rights.
- *United States v. Jefferson* — enforcement of a False Claims Act civil
  investigative demand. Civil.
- *Elfar v. Township of Holmdel* — a civil-rights plaintiff amending to plead
  malicious prosecution under the New Jersey Tort Claims Act. The tort is
  civil; the criminal proceeding is only its predicate.
- `privilege-crime-fraud` — the crime-fraud exception to attorney-client
  privilege, a civil discovery doctrine. Both records carrying it are civil.

`scripts/validate.mjs` fails the build if any of this returns to
`src/content`. It also warns where a record's prose reads as a prosecution
while its subject tag does not, which is how *United States v. Smith* was
caught: tagged `evidence-and-sanctions`, and a jury conviction underneath.
