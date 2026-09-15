# Kept and held entries — District of New Jersey

Generated 2026-09-15 by `scripts/inventory-held.mjs`. Do not edit by hand —
re-run it. An entry belongs on a judge's page only when the district court's
own decision is available; an appellate opinion shows what the circuit did,
not what the judge did. 35 entries failed that test and sit in
`review/pending/dnj-no-district-decision/`, which does not render. 48 remain published.

Every held entry came from a District Judge. No magistrate judge lost one.
The significant tier was scored on career significance, and a district
decision important enough to score is a district decision important enough
to appeal, so it survives in free repositories as a Third Circuit PDF.
Magistrate work is not appealed and sits in GovInfo at the district level.

12 further entries are not held but excluded, as criminal subject
matter. They are in `review/pending/dnj-out-of-scope-criminal/` and will not be restored; that
directory's README says where the line falls and which look-alikes stay.

## What the record carries

| | Count | What it means |
|---|---|---|
| **A** | 32 | A district docket is on the record. A district link resolves from it. |
| **B** | 1 | The docket on the record is the Third Circuit’s. The district docket is missing. |
| **C** | 0 | No docket, but the district decision is published in F. Supp. and findable by citation. |
| **D** | 1 | The record carries only an appellate citation. As written, this entry is the appeal. |
| **E** | 1 | No docket and no reporter citation. Nothing on the record to resolve from. |

33 of the 35 are recoverable with a lookup.
2 need research or should be dropped.

## What the docket actually holds

From `docs/decision-resolution-dnj.json`. A category estimates recoverability from what the record
carries. A verdict answers it from the court's own docket, so where the two
disagree the verdict governs.

| | Count | What it means |
|---|---|---|
| `ok` | 30 | a signed district decision by this judge, PDF held |
| `empty` | 2 | no signed orders indexed |

## Defects in held records

`npm run validate` walks `src/content` and these records are not there,
so nothing checks them until the moment one is restored and the gate sees
it for the first time. 2 would fail today.

- `julien-x-neals--golden-fortune-import-export-corp-v-mei-xin-ltd` — authored_by 'Julien Xavier Neals' is not the judge whose page this sits on ('Julien X. Neals')
- `mary-little-cooper--lightner-v-1621-route-22-west-operating-co` — authored_by 'Mary L. Cooper' is not the judge whose page this sits on ('Mary Little Cooper')

---

# District Judges

## Madeline Cox Arleo
kept 0 · held 3

- **Kept: none.** The page reads "Developing record."
- **Held (E).** Antar v. Borgata Hotel Casino & Spa, LLC, 2024 WL 1672280 (D.N.J. Jan. 31, 2024)  
  No docket and no reporter citation. Nothing on the record to resolve from.
- **Held (B).** In re Congoleum Corp., No. 23-1295 (3d Cir. Aug. 22, 2025)  
  The docket on the record is the Third Circuit’s. The district docket is missing.
- **Held (A).** · `ok` United States v. City of Newark, No. 2:16-cv-01731 — Newark Police consent-decree administration and termination  
  A district docket is on the record. A district link resolves from it.
  20 signed orders by this judge: ECF 443 (2025-11-19), ECF 434 (2025-09-03), ECF 431 (2025-08-05), ECF 429 (2025-07-09), ECF 428 (2025-07-01), ECF 423 (2025-06-17), ECF 424 (2025-06-17), ECF 425 (2025-06-17), ECF 410 (2025-04-02), ECF 411 (2025-04-02), ECF 408 (2025-04-02), ECF 409 (2025-04-02), ECF 412 (2025-03-31), ECF 400 (2025-02-05), ECF 398 (2025-02-05), ECF 399 (2025-02-05), ECF 387 (2024-11-22), ECF 388 (2024-11-22), ECF 389 (2024-11-22), ECF 378 (2024-08-30). Pick one.

## Renée Marie Bumb
kept 2 · held 1

- **Kept.** Koons v. Platkin, 673 F. Supp. 3d 515 (D.N.J. 2023)  
  `cases.justia.com`
- **Kept.** New Jersey Department of Environmental Protection v. E.I. du Pont de Nemours & Co., Nos. 1:19-cv-14758, 1:19-cv-14765, 1:19-cv-14766 & 3:19-cv-14767 (D.N.J. Aug. 7, 2026)  
  `cases.justia.com`
- **Held (A).** · `empty` Bryman v. Murphy, No. 1:23-cv-12601; aff’d, No. 24-2947 (3d Cir. Dec. 5, 2025)  
  A district docket is on the record. A district link resolves from it.

## Georgette Castner
kept 0 · held 1

- **Kept: none.** The page reads "Developing record."
- **Held (A).** · `empty` StoneMor, Inc. v. International Brotherhood of Teamsters, Local 469, No. 3:22-cv-01388; aff’d, No. 23-1489 (3d Cir. July 10, 2024)  
  A district docket is on the record. A district link resolves from it.

## Claire C. Cecchi
kept 0 · held 2

- **Kept: none.** The page reads "Developing record."
- **Held (A).** · `ok` ADP, LLC v. Mork, No. 2:17-cv-04613; appeal consolidated in ADP, LLC v. Rafferty, 923 F.3d 113 (3d Cir. 2019)  
  A district docket is on the record. A district link resolves from it.
  3 signed orders by this judge: ECF 43 (2018-06-22), ECF 44 (2018-06-22), ECF 16 (2017-07-13). Pick one.
- **Held (A).** · `ok` In re Horizon Healthcare Services Inc. Data Breach Litigation, 846 F.3d 625 (3d Cir. 2017)  
  A district docket is on the record. A district link resolves from it.
  19 signed orders by this judge: ECF 157 (2021-12-21), ECF 158 (2021-12-21), ECF 141 (2019-04-29), ECF 135 (2019-05-07), ECF 131 (2019-04-02), ECF 94 (2017-08-08), ECF 92 (2017-07-28), ECF 73 (2017-05-16), ECF 68 (2017-04-17), ECF 64 (2017-04-05), ECF 50 (2015-05-07), ECF 48 (2015-03-31), ECF 47 (2015-03-31), ECF 46 (2014-11-21), ECF 44 (2014-11-10), ECF 39 (2014-07-24), ECF 34 (2014-06-23), ECF 28 (2014-05-22), ECF 21 (2014-03-13). Pick one.

## Stanley R. Chesler
kept 0 · held 4

- **Kept: none.** The page reads "Developing record."
- **Held (A).** · `ok` Borough of Longport v. Netflix, Inc., No. 2:21-cv-15303; aff’d, No. 22-2139 (3d Cir. Feb. 29, 2024)  
  A district docket is on the record. A district link resolves from it.
  2 signed orders by this judge: ECF 53 (2022-05-20), ECF 52 (2022-05-20). Pick one.
- **Held (A).** · `ok` In re Nickelodeon Consumer Privacy Litigation, 827 F.3d 262 (3d Cir. 2016)  
  A district docket is on the record. A district link resolves from it.
  20 signed orders by this judge: ECF 136 (2017-11-15), ECF 126 (2017-03-08), ECF 124 (2017-02-22), ECF 112 (2016-10-27), ECF 98 (2016-08-31), ECF 96 (2016-08-22), ECF 85 (2015-01-20), ECF 84 (2015-01-20), ECF 80 (2014-11-13), ECF 76 (2014-09-29), ECF 74 (2014-09-19), ECF 66 (2014-07-02), ECF 65 (2014-07-02), ECF 58 (2014-03-21), ECF 54 (2014-03-05), ECF 32 (2013-09-20), ECF 31 (2013-09-20), ECF 25 (2013-09-09), ECF 24 (2013-09-09), ECF 16 (2013-08-07). Pick one.
- **Held (A).** · `ok` Teva Branded Pharmaceutical Products R&D, Inc. v. Amneal Pharmaceuticals of New York, LLC, No. 2:23-cv-20964; aff’d, No. 2024-1936 (Fed. Cir. Dec. 20, 2024)  
  A district docket is on the record. A district link resolves from it.
  5 signed orders by this judge: ECF 148 (2025-06-12), ECF 124 (2024-11-04), ECF 98 (2024-06-13), ECF 88 (2024-06-10), ECF 54 (2024-03-08). Pick one.
- **Held (A).** · `ok` Williams v. BASF Catalysts LLC, No. 2:11-cv-01754; aff'd in part and rev'd in part, 765 F.3d 306 (3d Cir. 2014)  
  A district docket is on the record. A district link resolves from it.
  8 signed orders by this judge: ECF 130 (2012-12-12), ECF 129 (2012-12-12), ECF 120 (2012-07-20), ECF 103 (2012-01-05), ECF 95 (2011-11-28), ECF 90 (2011-11-07), ECF 76 (2011-09-21), ECF 46 (2011-07-08). Pick one.

## Mary Little Cooper
kept 0 · held 2

- **Kept: none.** The page reads "Developing record."
- **Held (D).** Coleman v. Home Depot, Inc., 306 F.3d 1333 (3d Cir. 2002)  
  The record carries only an appellate citation. As written, this entry is the appeal.
- **Held (A).** · `ok` Lightner v. 1621 Route 22 West Operating Co., Nos. 3:11-cv-02007, 3:11-cv-03960 & 3:11-cv-04072; appeal dismissed, Nos. 12-2122 & 12-2726 (3d Cir. Sept. 4, 2013)  
  A district docket is on the record. A district link resolves from it.
  9 signed orders by this judge: ECF 145 (2012-05-02), ECF 144 (2012-05-01), ECF 136 (2012-04-19), ECF 132 (2012-04-16), ECF 131 (2012-04-16), ECF 119 (2012-02-06), ECF 77 (2011-10-12), ECF 76 (2011-10-12), ECF 9 (2011-04-20). Pick one.

## Michael E. Farbiarz
kept 1 · held 1

- **Kept.** Knox v. New Jersey Department of Corrections, No. 2:25-cv-01293 (D.N.J. Feb. 2, 2026)  
  `law.justia.com`
- **Held (A).** · `ok` Khalil v. President, 777 F. Supp. 3d 369 (D.N.J. 2025); appeal, Nos. 25-2162 & 25-2357 (3d Cir. Jan. 15, 2026)  
  A district docket is on the record. A district link resolves from it.
  20 signed orders by this judge: ECF 374 (2025-08-08), ECF 367 (2025-07-25), ECF 355 (2025-07-17), ECF 350 (2025-07-16), ECF 346 (2025-07-10), ECF 316 (2025-06-20), ECF 306 (2025-06-13), ECF 299 (2025-06-11), ECF 278 (2025-06-04), ECF 272 (2025-05-28), ECF 262 (2025-05-21), ECF 222 (2025-05-01), ECF 214 (2025-04-29), ECF 215 (2025-04-29), ECF 216 (2025-04-29), ECF 217 (2025-04-29), ECF 188 (2025-04-10), ECF 178 (2025-04-08), ECF 172 (2025-04-04), ECF 171 (2025-04-04). Pick one.

## Katharine S. Hayden
kept 0 · held 1

- **Kept: none.** The page reads "Developing record."
- **Held (A).** · `ok` Honda Lease Trust v. Malanga’s Automotive, No. 24-2369 (3d Cir. Sept. 15, 2025)  
  A district docket is on the record. A district link resolves from it.
  2 signed orders by this judge: ECF 36 (2024-06-28), ECF 35 (2024-06-28). Pick one.

## Edward S. Kiel
kept 0 · held 1

- **Kept: none.** The page reads "Developing record."
- **Held (A).** · `ok` KalshiEX LLC v. Flaherty, No. 1:25-cv-02152; aff’d, No. 25-1922 (3d Cir. Apr. 6, 2026)  
  A district docket is on the record. A district link resolves from it.
  8 signed orders by this judge: ECF 41 (2026-05-19), ECF 31 (2025-05-21), ECF 28 (2025-05-09), ECF 23 (2025-05-06), ECF 22 (2025-04-28), ECF 21 (2025-04-28), ECF 9 (2025-04-01), ECF 8 (2025-03-31). Pick one.

## Robert Kirsch
kept 0 · held 1

- **Kept: none.** The page reads "Developing record."
- **Held (A).** · `ok` New Jersey v. Dow Chemical Co., No. 3:23-cv-02449; aff’d, No. 24-1753 (3d Cir. June 11, 2025)  
  A district docket is on the record. A district link resolves from it.
  9 signed orders by this judge: ECF 102 (2024-07-09), ECF 103 (2024-07-09), ECF 101 (2024-06-14), ECF 96 (2024-05-09), ECF 92 (2024-04-25), ECF 86 (2024-04-23), ECF 87 (2024-04-23), ECF 71 (2023-08-14), ECF 69 (2023-07-18). Pick one.

## William J. Martini
kept 0 · held 2

- **Kept: none.** The page reads "Developing record."
- **Held (A).** · `ok` Hassan v. City of New York, 804 F.3d 277 (3d Cir. 2015)  
  A district docket is on the record. A district link resolves from it.
  5 signed orders by this judge: ECF 89 (2018-04-11), ECF 86 (2018-02-20), ECF 45 (2015-11-06), ECF 41 (2014-02-20), ECF 40 (2014-02-20). Pick one.
- **Held (A).** · `ok` Jorjani v. New Jersey Institute of Technology, Nos. 2:18-cv-11693 & 2:20-cv-01422  
  A district docket is on the record. A district link resolves from it.
  10 signed orders by this judge: ECF 209 (2026-04-20), ECF 188 (2024-07-29), ECF 189 (2024-07-29), ECF 163 (2023-11-09), ECF 164 (2023-11-09), ECF 67 (2021-05-26), ECF 29 (2019-06-26), ECF 28 (2019-06-26), ECF 15 (2019-03-12), ECF 14 (2019-03-12). Pick one.

## Brian R. Martinotti
kept 0 · held 2

- **Kept: none.** The page reads "Developing record."
- **Held (A).** · `ok` Brian Trematore Plumbing & Heating, Inc. v. Sheet Metal Workers Local Union 25, No. 24-1298 (3d Cir. Aug. 1, 2025)  
  A district docket is on the record. A district link resolves from it.
  ECF 76, signed 2024-01-19 by Brian R. Martinotti.
- **Held (A).** · `ok` Government Employees Insurance Co. v. Caring Pain Management, P.C., No. 2:22-cv-05017; rev'd, 98 F.4th 463 (3d Cir. 2024)  
  A district docket is on the record. A district link resolves from it.
  4 signed orders by this judge: ECF 108 (2025-10-15), ECF 104 (2025-08-12), ECF 99 (2025-07-18), ECF 38 (2023-05-31). Pick one.

## Kevin McNulty
kept 0 · held 2

- **Kept: none.** The page reads "Developing record."
- **Held (A).** · `ok` J.M. v. Summit City Board of Education, No. 20-3391 (3d Cir. July 1, 2022)  
  A district docket is on the record. A district link resolves from it.
  ECF 84, signed 2020-10-27 by Kevin McNulty.
- **Held (A).** · `ok` Matrix Distributors, Inc. v. National Association of Boards of Pharmacy, No. 2:18-cv-17462; appeal, No. 20-3638 (3d Cir. May 19, 2022)  
  A district docket is on the record. A district link resolves from it.
  10 signed orders by this judge: ECF 201 (2022-08-10), ECF 189 (2021-01-04), ECF 184 (2020-12-04), ECF 185 (2020-12-04), ECF 173 (2020-07-02), ECF 170 (2020-06-12), ECF 151 (2019-11-25), ECF 64 (2019-02-22), ECF 36 (2019-01-11), ECF 16 (2018-12-28). Pick one.

## Julien X. Neals
kept 0 · held 1

- **Kept: none.** The page reads "Developing record."
- **Held (A).** · `ok` Golden Fortune Import & Export Corp. v. Mei-Xin Ltd., No. 2:22-cv-01369; rev'd, Nos. 22-1710 & 22-1885 (3d Cir. Aug. 5, 2022)  
  A district docket is on the record. A district link resolves from it.
  7 signed orders by this judge: ECF 49 (2023-03-20), ECF 38 (2022-05-05), ECF 21 (2022-04-04), ECF 20 (2022-04-04), ECF 18 (2022-04-04), ECF 19 (2022-04-04), ECF 7 (2022-03-16). Pick one.

## Christine P. O’Hearn
kept 2 · held 0

- **Kept.** Duran v. Fairton Federal Correctional Institution, No. 1:23-cv-12960 (D.N.J. June 2, 2026)  
  `law.justia.com`
- **Kept.** Ireland v. Hegseth, No. 1:25-cv-01918, ECF No. 28 (D.N.J. Mar. 24, 2025)  
  `www.courtlistener.com`

## Evelyn Padin
kept 0 · held 1

- **Kept: none.** The page reads "Developing record."
- **Held (A).** · `ok` Handal v. Innovative Industrial Properties, Inc., No. 2:22-cv-02359; aff’d, No. 24-2829 (3d Cir. Oct. 15, 2025)  
  A district docket is on the record. A district link resolves from it.
  9 signed orders by this judge: ECF 68 (2024-09-25), ECF 67 (2024-09-25), ECF 59 (2023-10-24), ECF 55 (2023-09-19), ECF 56 (2023-09-19), ECF 50 (2023-02-21), ECF 46 (2023-01-13), ECF 40 (2022-10-17), ECF 30 (2022-07-27). Pick one.

## Zahid N. Quraishi
kept 1 · held 1

- **Kept.** National Shooting Sports Foundation v. Platkin, No. 3:22-cv-06646 (D.N.J. July 10, 2025), rev'd, No. 25-2546 (3d Cir. Sept. 8, 2026)  
  `cases.justia.com`
- **Held (A).** · `ok` Kim v. Hanlon, No. 3:24-cv-01098; aff’d, No. 24-1594 (3d Cir. Apr. 17, 2024)  
  A district docket is on the record. A district link resolves from it.
  19 signed orders by this judge: ECF 362 (2026-08-04), ECF 360 (2026-07-20), ECF 358 (2026-07-06), ECF 356 (2026-06-09), ECF 354 (2026-06-05), ECF 352 (2026-05-29), ECF 350 (2026-05-22), ECF 349 (2025-10-31), ECF 343 (2025-10-09), ECF 340 (2025-09-17), ECF 338 (2025-09-02), ECF 335 (2025-08-19), ECF 333 (2025-07-14), ECF 327 (2025-07-03), ECF 323 (2025-06-04), ECF 321 (2025-06-03), ECF 318 (2025-06-02), ECF 319 (2025-06-02), ECF 311 (2025-03-31). Pick one.

## Esther Salas
kept 1 · held 1

- **Kept.** FTC v. Wyndham Worldwide Corp., 10 F. Supp. 3d 602 (D.N.J. 2014), aff’d, 799 F.3d 236 (3d Cir. 2015)  
  `www.courtlistener.com`
- **Held (A).** · `ok` Berkelhammer v. ADP TotalSource Group, Inc., No. 2:20-cv-05696, ECF No. 133 (D.N.J. Mar. 31, 2022), aff’d, 74 F.4th 115 (3d Cir. 2023)  
  A district docket is on the record. A district link resolves from it.
  8 signed orders by this judge: ECF 270 (2025-02-13), ECF 148 (2022-08-23), ECF 149 (2022-08-23), ECF 150 (2022-08-23), ECF 151 (2022-08-23), ECF 132 (2022-03-31), ECF 133 (2022-03-31), ECF 91 (2021-06-03). Pick one.

## Peter G. Sheridan
kept 0 · held 3

- **Kept: none.** The page reads "Developing record."
- **Held (A).** · `ok` Association of New Jersey Rifle & Pistol Clubs, Inc. v. Platkin, 742 F. Supp. 3d 421 (D.N.J. 2024)  
  A district docket is on the record. A district link resolves from it.
  20 signed orders by this judge: ECF 229 (2024-07-30), ECF 228 (2024-07-30), ECF 208 (2024-02-20), ECF 202 (2024-01-17), ECF 202 (2024-01-17), ECF 194 (2023-12-11), ECF 187 (2023-11-13), ECF 180 (2023-10-30), ECF 173 (2023-10-02), ECF 168 (2023-09-11), ECF 148 (2023-02-03), ECF 143 (2023-01-11), ECF 138 (2022-12-30), ECF 135 (2022-12-05), ECF 132 (2022-11-29), ECF 121 (2022-10-25), ECF 118 (2022-09-21), ECF 117 (2022-09-20), ECF 115 (2022-09-20), ECF 116 (2022-09-20). Pick one.
- **Held (A).** · `ok` Oakwood Laboratories LLC v. Thanoo, 999 F.3d 892 (3d Cir. 2021)  
  A district docket is on the record. A district link resolves from it.
  12 signed orders by this judge: ECF 144 (2022-07-19), ECF 136 (2022-06-15), ECF 89 (2021-07-06), ECF 83 (2019-10-23), ECF 78 (2019-08-28), ECF 69 (2019-02-26), ECF 67 (2019-01-31), ECF 49 (2018-07-10), ECF 46 (2018-06-12), ECF 39 (2018-02-28), ECF 34 (2017-11-28), ECF 32 (2017-11-20). Pick one.
- **Held (A).** · `ok` Sovereign Bank v. REMI Capital, Inc., No. 21-2289 (3d Cir. Sept. 15, 2022)  
  A district docket is on the record. A district link resolves from it.
  15 signed orders by this judge: ECF 110 (2021-06-17), ECF 105 (2020-11-08), ECF 105 (2020-11-08), ECF 91 (2018-09-24), ECF 91 (2018-09-24), ECF 84 (2018-07-12), ECF 73 (2018-01-29), ECF 59 (2017-12-28), ECF 52 (2010-09-01), ECF 46 (2010-05-05), ECF 41 (2010-03-12), ECF 23 (2009-08-21), ECF 18 (2009-08-12), ECF 16 (2009-07-07), ECF 7 (2009-05-07). Pick one.

## Michael A. Shipp
kept 0 · held 3

- **Kept: none.** The page reads "Developing record."
- **Held (A).** · `ok` Government Employees Insurance Co. v. Precision Pain & Spine Institute LLC, No. 3:21-cv-16255; rev'd, 98 F.4th 463 (3d Cir. 2024)  
  A district docket is on the record. A district link resolves from it.
  8 signed orders by this judge: ECF 134 (2025-04-24), ECF 132 (2025-04-08), ECF 111 (2024-12-23), ECF 112 (2024-12-23), ECF 105 (2024-05-08), ECF 90 (2023-07-14), ECF 46 (2022-06-30), ECF 47 (2022-06-30). Pick one.
- **Held (A).** · `ok` NCAA v. Governor of New Jersey, 926 F. Supp. 2d 551 (D.N.J. 2013), and 61 F. Supp. 3d 488 (D.N.J. 2014); reversed in Murphy v. NCAA, 584 U.S. 453 (2018)  
  A district docket is on the record. A district link resolves from it.
  20 signed orders by this judge: ECF 199 (2014-11-21), ECF 198 (2014-11-21), ECF 187 (2014-10-27), ECF 182 (2014-10-24), ECF 181 (2014-10-24), ECF 164 (2014-09-19), ECF 144 (2013-03-05), ECF 143 (2013-02-28), ECF 142 (2013-02-28), ECF 135 (2013-01-24), ECF 129 (2013-01-22), ECF 124 (2013-01-07), ECF 114 (2012-12-21), ECF 113 (2012-12-21), ECF 103 (2012-12-11), ECF 102 (2012-12-11), ECF 94 (2012-12-05), ECF 87 (2012-11-28), ECF 84 (2012-11-27), ECF 65 (2012-11-14). Pick one.
- **Held (A).** · `ok` Veterans Guardian VA Claim Consulting LLC v. Platkin, No. 24-1097 (3d Cir. Apr. 1, 2025)  
  A district docket is on the record. A district link resolves from it.
  5 signed orders by this judge: ECF 56 (2025-08-04), ECF 41 (2024-01-18), ECF 41 (2024-01-18), ECF 37 (2024-01-05), ECF 38 (2024-01-05). Pick one.

## Anne Elise Thompson
kept 2 · held 0

- **Kept.** Bowen Engineering Corp. v. Estate of Reeve, 799 F. Supp. 467 (D.N.J. 1992)  
  `law.justia.com`
- **Kept.** New Jersey Civil Justice Institute v. Grewal, No. 3:19-cv-17518 (D.N.J. Mar. 25, 2021)  
  `law.justia.com`

## Susan D. Wigenton
kept 0 · held 1

- **Kept: none.** The page reads "Developing record."
- **Held (A).** · `ok` Huertas v. Bayer US LLC, No. 23-2178 (3d Cir. Nov. 7, 2024)  
  A district docket is on the record. A district link resolves from it.
  5 signed orders by this judge: ECF 57 (2025-01-22), ECF 48 (2023-05-23), ECF 49 (2023-05-23), ECF 28 (2022-08-19), ECF 27 (2022-08-19). Pick one.

## Karen M. Williams
kept 1 · held 1

- **Kept.** Williams v. Township of Cherry Hill, No. 1:26-cv-00893 (D.N.J. July 27, 2026)  
  `law.justia.com`
- **Held (A).** · `ok` Cornish-Adebiyi v. Caesars Entertainment, Inc., 2024 WL 4356188 (D.N.J. Sept. 30, 2024)  
  A district docket is on the record. A district link resolves from it.
  4 signed orders by this judge: ECF 140 (2024-09-30), ECF 139 (2024-09-30), ECF 115 (2024-05-20), ECF 76 (2024-01-16). Pick one.

---

# Magistrate Judges

## Stacey D. Adams
kept 3 · held 0

- **Kept.** Ameritas Life Insurance Corp. v. Wilmington Trust, N.A., No. 2:19-cv-18713, ECF No. 210 (D.N.J. Jan. 27, 2025)  
  `www.govinfo.gov`
- **Kept.** Howard v. Peoplease Holdings, LLC, No. 2:24-cv-09476, ECF No. 34 (D.N.J. Oct. 27, 2025)  
  `cases.justia.com`
- **Kept.** United States ex rel. Silbersher v. Janssen Biotech, Inc., No. 2:19-cv-12107, ECF No. 454 (D.N.J. Sept. 22, 2025)  
  `www.govinfo.gov`

## Jessica S. Allen
kept 4 · held 0

- **Kept.** ADP, Inc. v. Wise Payments Ltd., No. 2:21-cv-12457, ECF No. 52 (D.N.J. July 19, 2022)  
  `www.govinfo.gov`
- **Kept.** Olivet University v. Candappa, No. 2:25-cv-18777, ECF No. 25 (D.N.J. Sept. 2, 2026)  
  `cases.justia.com`
- **Kept.** Rodwell v. Baraka, No. 2:22-cv-06427, ECF No. 131 (D.N.J. Feb. 6, 2026)  
  `www.govinfo.gov`
- **Kept.** Township of Cranford v. Cranford Harrison Developers, LLC, No. 2:23-cv-04367, ECF No. 6 (D.N.J. Oct. 11, 2023)  
  `www.govinfo.gov`

## José R. Almonte
kept 4 · held 0

- **Kept.** 80 Maple Ave LLC v. Harleysville Insurance Co. of New Jersey, No. 2:25-cv-02878, ECF No. 18 (D.N.J. June 25, 2026)  
  `cases.justia.com`
- **Kept.** Government Employees Insurance Co. v. Koppel, No. 2:21-cv-03413, ECF No. 159 (D.N.J. Aug. 28, 2023)  
  `www.govinfo.gov`
- **Kept.** Novartis AG v. Novadoz Pharmaceuticals LLC, No. 2:25-cv-00849, ECF No. 111 (D.N.J. Aug. 4, 2026)  
  `cases.justia.com`
- **Kept.** Two Canoes LLC v. Addian Inc., No. 2:21-cv-19729, ECF No. 72 (D.N.J. Apr. 21, 2023)  
  `www.govinfo.gov`

## Tonianne J. Bongiovanni
kept 2 · held 0

- **Kept.** B.H. v. JSK Princeton LLC, No. 3:24-cv-08851, ECF No. 28 (D.N.J. Mar. 31, 2026)  
  `law.justia.com`
- **Kept.** Isaac v. Defendant 1, No. 3:25-cv-01325, ECF No. 11 (D.N.J. Dec. 30, 2025)  
  `law.justia.com`

## J. Brendan Day
kept 3 · held 0

- **Kept.** Elfar v. Township of Holmdel, No. 3:22-cv-05367, ECF No. 57 (D.N.J. July 26, 2023)  
  `www.govinfo.gov`
- **Kept.** Lin v. Hudson City Savings Bank, No. 3:18-cv-15387, ECF No. 92 (D.N.J. Apr. 19, 2024)  
  `www.govinfo.gov`
- **Kept.** Veterans Guardian VA Claim Consulting, LLC v. Platkin, No. 3:23-cv-20660, ECF No. 87 (D.N.J. Aug. 18, 2026)  
  `docs.justia.com`

## André M. Espinosa
kept 3 · held 0

- **Kept.** Democratic Party of New Jersey, Inc. v. Devine, No. 2:22-cv-01268, ECF No. 152 (D.N.J. May 16, 2025)  
  `www.govinfo.gov`
- **Kept.** Stevenson v. City of Newark, No. 2:20-cv-18722, ECF No. 76 (D.N.J. Apr. 9, 2024)  
  `law.justia.com`
- **Kept.** Valley National Bank v. Burrini's Olde World Market, Inc., No. 2:22-cv-00919, ECF No. 18 (D.N.J. July 29, 2022)  
  `www.govinfo.gov`

## James B. Clark III
kept 4 · held 0

- **Kept.** 31-01 Broadway Associates, LLC v. Travelers Casualty & Surety Co., No. 2:17-cv-06292, ECF No. 84 (D.N.J. Aug. 27, 2019)  
  `www.govinfo.gov`
- **Kept.** Luxama v. Ironbound Express, Inc., No. 2:11-cv-02224, ECF No. 460 (D.N.J. Sept. 16, 2024)  
  `law.justia.com`
- **Kept.** MaxLite, Inc. v. ATG Electronics, Inc., No. 2:15-cv-01116, ECF No. 185 (D.N.J. Mar. 15, 2018)  
  `www.govinfo.gov`
- **Kept.** Step by Step School v. Philadelphia Indemnity Insurance Co., No. 2:23-cv-02324, ECF No. 38 (D.N.J. Dec. 19, 2024)  
  `cases.justia.com`

## Sharon A. King
kept 2 · held 0

- **Kept.** Chambers v. Rowan University, No. 1:23-cv-02094, ECF No. 63 (D.N.J. Nov. 26, 2024)  
  `www.govinfo.gov`
- **Kept.** United States v. Jefferson, No. 1:25-cv-01931, ECF No. 4 (D.N.J. May 20, 2025)  
  `www.govinfo.gov`

## Elizabeth A. Pascal
kept 2 · held 0

- **Kept.** Jones v. Ryan, No. 1:23-cv-04557, ECF No. 160 (D.N.J. Jan. 23, 2026)  
  `cases.justia.com`
- **Kept.** Puma Biotechnology, Inc. v. Sandoz Inc., No. 1:21-cv-19918, ECF No. 89 (D.N.J. Dec. 20, 2022)  
  `www.govinfo.gov`

## Justin T. Quinn
kept 3 · held 0

- **Kept.** BFI Waste Systems of New Jersey, Inc. v. Township of Monroe, No. 3:23-cv-00059, ECF No. 45 (D.N.J. Jan. 24, 2025)  
  `law.justia.com`
- **Kept.** In re Application of RH2 Participações Societárias Ltda., No. 3:23-cv-04025, ECF No. 19 (D.N.J. July 31, 2024)  
  `www.govinfo.gov`
- **Kept.** Khal Anshei Tallymawr Inc. v. Township of Toms River, Nos. 3:21-cv-02716 & 3:21-cv-03239, ECF No. 168 (D.N.J. Aug. 8, 2024)  
  `www.govinfo.gov`

## Rukhsanah L. Singh
kept 4 · held 0

- **Kept.** Bais Brucha Inc. v. Township of Toms River, No. 3:21-cv-03239, ECF No. 53 (D.N.J. Nov. 3, 2022)  
  `law.justia.com`
- **Kept.** Doe I v. Chaparro, No. 3:25-cv-13961, ECF No. 16 (D.N.J. Dec. 22, 2025)  
  `law.justia.com`
- **Kept.** Gruber v. Sabert Corp., No. 3:21-cv-13312, ECF No. 107 (D.N.J. June 20, 2025)  
  `cases.justia.com`
- **Kept.** The Kislak Co. v. Prominent Properties LLC, No. 3:22-cv-02482, ECF No. 13 (D.N.J. Feb. 14, 2023)  
  `www.govinfo.gov`

## Matthew J. Skahill
kept 1 · held 0

- **Kept.** Truong v. Delta International Machinery Corp., No. 1:19-cv-19384, ECF No. 51 (D.N.J. Oct. 29, 2021)  
  `www.govinfo.gov`

## Leda Dunn Wettre
kept 3 · held 0

- **Kept.** Castro v. Linden Bulk Transportation LLC, No. 2:19-cv-20442, ECF No. 27 (D.N.J. Apr. 20, 2020)  
  `www.govinfo.gov`
- **Kept.** Edrington-Latham v. Unified Vailsburg Services Organization, No. 2:22-cv-01465, ECF No. 18 (D.N.J. July 14, 2022)  
  `www.govinfo.gov`
- **Kept.** Garcia v. Missing Sock Laundry Service LLC, No. 2:24-cv-08045, ECF No. 38 (D.N.J. June 24, 2025)  
  `law.justia.com`
