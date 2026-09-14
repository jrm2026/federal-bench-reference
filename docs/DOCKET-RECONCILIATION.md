# Docket reconciliation worksheet

The significance screen keyed on the existence of an appeal, so the Third
Circuit's docket number was recorded where the district court's belongs. The two
are different numbers for the same litigation, and the entry that belongs on a
judge's page is the trial judge's opinion on the district docket — the one the
appeal was taken from.

`docket` has been split into `district_docket` and `appellate_docket` so the two
can no longer stand in for one another. The gate now fails any significant-tier
entry whose link is not district-level, and warns on any that carries no district
docket.

**This worksheet is the research that remains.** It could not be completed in
session: CourtListener throttles at five requests a minute without a token, and
this environment's network policy blocks GovInfo, Justia and the courts
outright. Both are available at the desk.

- **24 held entries have no district docket.** Step 1 below.
- **21 held entries have one.** Step 2 below.
- **3 published entries carry a district link but no district docket.** Step 3.

---

## Step 1 — recover the district docket (24 entries)

Every precedential Third Circuit opinion states it on the cover page: *"On Appeal
from the United States District Court for the District of New Jersey (D.C. Civil
Action No. 2-11-cv-01754), District Judge: Honorable ____."* That line gives the
district docket and confirms the trial judge in one read. The appellate opinion
is already linked on each record.

Where the cover page is not available, `originating-court-information` on
CourtListener carries `docket_number` and `assigned_to_str` — but only for
appellate dockets bought from PACER, which most of these are not. Read the PDF.

| Judge | Case | Appellate docket | Read this |
|---|---|---|---|
| Madeline Cox Arleo | *Antar v. Borgata Hotel Casino & Spa, LLC* | — | https://www2.ca3.uscourts.gov/opinarch/241364np.pdf |
| Madeline Cox Arleo | *In re Congoleum Corp.* | 23-1295 | https://www2.ca3.uscourts.gov/opinarch/231295p.pdf |
| Claire C. Cecchi | *In re Horizon Healthcare Services Inc. Data Breach Litigation* | 846 F.3d 625 | https://www2.ca3.uscourts.gov/opinarch/152309p.pdf |
| Stanley R. Chesler | *In re Nickelodeon Consumer Privacy Litigation* | 827 F.3d 262 | https://www2.ca3.uscourts.gov/opinarch/151441p.pdf |
| Mary Little Cooper | *Coleman v. Home Depot, Inc.* | 306 F.3d 1333 | https://www2.ca3.uscourts.gov/opinarch/003496.pdf |
| Mary Little Cooper | *United States v. Smith* | 12-1516 | https://www2.ca3.uscourts.gov/opinarch/121516p.pdf |
| Michael E. Farbiarz | *Khalil v. President* | 25-2162 | https://www2.ca3.uscourts.gov/opinarch/252162p.pdf |
| Katharine S. Hayden | *Honda Lease Trust v. Malanga’s Automotive* | 24-2369 | https://www2.ca3.uscourts.gov/opinarch/242369p.pdf |
| Katharine S. Hayden | *United States v. Gwinnett* | 483 F.3d 200 | https://www2.ca3.uscourts.gov/opinarch/061766p.pdf |
| Katharine S. Hayden | *United States v. Jackson* | 862 F.3d 365 | https://www2.ca3.uscourts.gov/opinarch/161200p.pdf |
| William J. Martini | *Hassan v. City of New York* | 804 F.3d 277 | https://law.justia.com/cases/federal/appellate-courts/ca3/14-1688/14-1688-2016-02-02.html |
| Brian R. Martinotti | *Brian Trematore Plumbing & Heating, Inc. v. Sheet Metal Workers Local Union 25* | 24-1298 | https://www2.ca3.uscourts.gov/opinarch/241298p.pdf |
| Kevin McNulty | *J.M. v. Summit City Board of Education* | 20-3391 | https://www2.ca3.uscourts.gov/opinarch/203391p.pdf |
| Christine P. O’Hearn | *Thieme v. Warden Fort Dix FCI* | 23-1697 | https://www2.ca3.uscourts.gov/opinarch/231697p.pdf |
| Esther Salas | *Berkelhammer v. ADP TotalSource Group, Inc.* | 22-1618 | https://www2.ca3.uscourts.gov/opinarch/221618p.pdf |
| Peter G. Sheridan | *Association of New Jersey Rifle & Pistol Clubs, Inc. v. Platkin* | 742 F. Supp. 3d 421 | https://www2.ca3.uscourts.gov/opinarch/242415p.pdf |
| Peter G. Sheridan | *Oakwood Laboratories LLC v. Thanoo* | 999 F.3d 892 | https://www2.ca3.uscourts.gov/opinarch/193707p.pdf |
| Peter G. Sheridan | *Sovereign Bank v. REMI Capital, Inc.* | 21-2289 | https://www2.ca3.uscourts.gov/opinarch/212289p.pdf |
| Michael A. Shipp | *NCAA v. Governor of New Jersey* | 926 F. Supp. 2d 551 | https://www.supremecourt.gov/opinions/17pdf/16-476_dbfi.pdf |
| Michael A. Shipp | *Veterans Guardian VA Claim Consulting LLC v. Platkin* | 24-1097 | https://www2.ca3.uscourts.gov/opinarch/241097p.pdf |
| Susan D. Wigenton | *Huertas v. Bayer US LLC* | 23-2178 | https://www2.ca3.uscourts.gov/opinarch/232178p.pdf |
| Susan D. Wigenton | *United States v. Baroni and Kelly; Supreme Court review in Kelly v. United States, 590 U.S. 391 (2020)* | — | https://www.supremecourt.gov/opinions/19pdf/18-1059_e2p3.pdf |
| Susan D. Wigenton | *United States v. Jackson* | 23-2492 | https://www2.ca3.uscourts.gov/opinarch/232492p.pdf |
| Karen M. Williams | *Cornish-Adebiyi v. Caesars Entertainment, Inc.* | — | https://www2.ca3.uscourts.gov/opinarch/243006p.pdf |

---

## Step 2 — find the trial judge's opinion on the district docket (21 entries)

The district docket is on the record. GovInfo package IDs are deterministic from
it, so try the URL in the last column first. If GovInfo has no package, search
RECAP for the docket and read the entries for the opinion or order the appeal was
taken from.

Confirm three things before restoring an entry: the opinion is the trial judge's
own, it is the decision the appeal was taken from, and the judge named on it
matches the page it will appear on.

| Judge | Case | District docket | Appellate docket | GovInfo candidate |
|---|---|---|---|---|
| Madeline Cox Arleo | *United States v. City of Newark* | `2:16-cv-01731` | — | https://www.govinfo.gov/app/details/USCOURTS-njd-2_16-cv-01731 |
| Renée Marie Bumb | *Bryman v. Murphy* | `1:23-cv-12601` | 24-2947 | https://www.govinfo.gov/app/details/USCOURTS-njd-1_23-cv-12601 |
| Georgette Castner | *StoneMor, Inc. v. International Brotherhood of Teamsters, Local 469* | `3:22-cv-01388` | 23-1489 | https://www.govinfo.gov/app/details/USCOURTS-njd-3_22-cv-01388 |
| Claire C. Cecchi | *ADP, LLC v. Mork* | `2:17-cv-04613` | — | https://www.govinfo.gov/app/details/USCOURTS-njd-2_17-cv-04613 |
| Stanley R. Chesler | *Borough of Longport v. Netflix, Inc.* | `2:21-cv-15303` | 22-2139 | https://www.govinfo.gov/app/details/USCOURTS-njd-2_21-cv-15303 |
| Stanley R. Chesler | *Teva Branded Pharmaceutical Products R&D, Inc. v. Amneal Pharmaceuticals of New York, LLC* | `2:23-cv-20964` | 2024-1936 | https://www.govinfo.gov/app/details/USCOURTS-njd-2_23-cv-20964 |
| Stanley R. Chesler | *Williams v. BASF Catalysts LLC* | `2:11-cv-01754` | — | https://www.govinfo.gov/app/details/USCOURTS-njd-2_11-cv-01754 |
| Mary Little Cooper | *Lightner v. 1621 Route 22 West Operating Co.* | `3:11-cv-02007` | 12-2122 | https://www.govinfo.gov/app/details/USCOURTS-njd-3_11-cv-02007 |
| Edward S. Kiel | *KalshiEX LLC v. Flaherty* | `1:25-cv-02152` | 25-1922 | https://www.govinfo.gov/app/details/USCOURTS-njd-1_25-cv-02152 |
| Robert Kirsch | *New Jersey v. Dow Chemical Co.* | `3:23-cv-02449` | 24-1753 | https://www.govinfo.gov/app/details/USCOURTS-njd-3_23-cv-02449 |
| William J. Martini | *Jorjani v. New Jersey Institute of Technology* | `2:18-cv-11693` | — | https://www.govinfo.gov/app/details/USCOURTS-njd-2_18-cv-11693 |
| William J. Martini | *United States v. Soto* | `2:20-cr-00903` | 23-1827 | https://www.govinfo.gov/app/details/USCOURTS-njd-2_20-cr-00903 |
| Brian R. Martinotti | *Government Employees Insurance Co. v. Caring Pain Management, P.C.* | `2:22-cv-05017` | — | https://www.govinfo.gov/app/details/USCOURTS-njd-2_22-cv-05017 |
| Kevin McNulty | *Matrix Distributors, Inc. v. National Association of Boards of Pharmacy* | `2:18-cv-17462` | 20-3638 | https://www.govinfo.gov/app/details/USCOURTS-njd-2_18-cv-17462 |
| Julien X. Neals | *Golden Fortune Import & Export Corp. v. Mei-Xin Ltd.* | `2:22-cv-01369` | 22-1710 | https://www.govinfo.gov/app/details/USCOURTS-njd-2_22-cv-01369 |
| Julien X. Neals | *United States v. Figueroa* | `2:14-cr-00672` | 23-1742 | https://www.govinfo.gov/app/details/USCOURTS-njd-2_14-cr-00672 |
| Evelyn Padin | *Handal v. Innovative Industrial Properties, Inc.* | `2:22-cv-02359` | 24-2829 | https://www.govinfo.gov/app/details/USCOURTS-njd-2_22-cv-02359 |
| Zahid N. Quraishi | *Kim v. Hanlon* | `3:24-cv-01098` | 24-1594 | https://www.govinfo.gov/app/details/USCOURTS-njd-3_24-cv-01098 |
| Jamel K. Semper | *United States v. McIver* | `2:25-cr-00388` | 25-3573 | https://www.govinfo.gov/app/details/USCOURTS-njd-2_25-cr-00388 |
| Michael A. Shipp | *Government Employees Insurance Co. v. Precision Pain & Spine Institute LLC* | `3:21-cv-16255` | — | https://www.govinfo.gov/app/details/USCOURTS-njd-3_21-cv-16255 |
| Susan D. Wigenton | *United States v. Auernheimer* | `2:11-cr-00470` | — | https://www.govinfo.gov/app/details/USCOURTS-njd-2_11-cr-00470 |

---

## Step 3 — published entries missing a district docket (3)

These render today and their links resolve to a district decision. Only the
docket number is absent from the record, which makes them unverifiable and
un-refindable. The gate warns rather than blocks.

| Judge | Case | Link |
|---|---|---|
| Renée Marie Bumb | *Koons v. Platkin* | https://cases.justia.com/federal/district-courts/new-jersey/njdce/1%3A2022cv07464/506033/124/0.pdf?ts=1684339152 |
| Esther Salas | *FTC v. Wyndham Worldwide Corp.* | https://www.courtlistener.com/opinion/7305635/federal-trade-commission-v-wyndham-worldwide-corp/ |
| Anne Elise Thompson | *Bowen Engineering Corp. v. Estate of Reeve* | https://law.justia.com/cases/federal/district-courts/FSupp/799/467/1379103/ |

---

## Restoring an entry

1. Set `district_docket`, keeping `appellate_docket` where there was an appeal.
2. Set `public_url` and `links` to the district decision. Keep the appellate link
   as a second entry with its own anchor.
3. Set `link_level` to `district`.
4. Move the file from `review/pending/dnj-no-district-decision/` into
   `src/content/districts/dnj/opinions/`.
5. Raise the judge's `actual_selected_count` and `declared_selected_count`, and
   the count in `service_line_reviewed`. Set `record_status` back to
   `represented` and clear `record_status_note`.
6. `npm run validate`. The gate checks the count against the files on disk.

