# Docket reconciliation

The significance screen keyed on the existence of an appeal, so the Third
Circuit's docket number was recorded where the district court's belongs. The two
identify different proceedings in the same litigation, and only one of them
identifies a decision by the trial judge. `docket` is now split into
`district_docket` and `appellate_docket`, and the gate fails any significant-tier
entry whose link is not district-level.

Reconciliation was run against CourtListener on 14 September 2026 through the MCP
server, unauthenticated, at five requests a minute. This container's network
policy refuses `www.courtlistener.com` at the proxy, so
`scripts/reconcile-dockets.mjs` cannot run here with or without a token — it is
written for the desk.

**33 of the 45 held entries now carry a verified district docket.**
The docket is not the decision. Each still needs the trial judge's opinion on that
docket located and read before it can go back on a page.

---

## Verified — district docket and judge both confirmed (33)

CourtListener's RECAP docket for each names the judge the record already
attributes it to.

| Judge | Case below | District docket | GovInfo candidate |
|---|---|---|---|
| Madeline Cox Arleo | *United States v. City of Newark* | `2:16-cv-01731` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_16-cv-01731 |
| Renée Marie Bumb | *Bryman v. Murphy* | `1:23-cv-12601` | https://www.govinfo.gov/app/details/USCOURTS-njd-1_23-cv-12601 |
| Georgette Castner | *StoneMor, Inc. v. International Brotherhood of Teamsters, Local 469* | `3:22-cv-01388` | https://www.govinfo.gov/app/details/USCOURTS-njd-3_22-cv-01388 |
| Claire C. Cecchi | *ADP, LLC v. Mork* | `2:17-cv-04613` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_17-cv-04613 |
| Claire C. Cecchi | *In re Horizon Healthcare Services Inc. Data Breach Litigation* | `2:13-cv-07418` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_13-cv-07418 |
| Stanley R. Chesler | *Borough of Longport v. Netflix, Inc.* | `2:21-cv-15303` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_21-cv-15303 |
| Stanley R. Chesler | *CAF and CTF v. Viacom, Inc. (lead case, MDL 2443)* | `2:12-cv-07829` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_12-cv-07829 |
| Stanley R. Chesler | *Teva Branded Pharmaceutical Products R&D, Inc. v. Amneal Pharmaceuticals of New York, LLC* | `2:23-cv-20964` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_23-cv-20964 |
| Stanley R. Chesler | *Williams v. BASF Catalysts LLC* | `2:11-cv-01754` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_11-cv-01754 |
| Mary Little Cooper | *Lightner v. 1621 Route 22 West Operating Co.* | `3:11-cv-02007` | https://www.govinfo.gov/app/details/USCOURTS-njd-3_11-cv-02007 |
| Michael E. Farbiarz | *Khalil v. Joyce* | `2:25-cv-01963` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_25-cv-01963 |
| Katharine S. Hayden | *Honda Lease Trust v. Malanga's Automotive* | `2:22-cv-04862` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_22-cv-04862 |
| Edward S. Kiel | *KalshiEX LLC v. Flaherty* | `1:25-cv-02152` | https://www.govinfo.gov/app/details/USCOURTS-njd-1_25-cv-02152 |
| Robert Kirsch | *New Jersey v. Dow Chemical Co.* | `3:23-cv-02449` | https://www.govinfo.gov/app/details/USCOURTS-njd-3_23-cv-02449 |
| William J. Martini | *Hassan v. The City of New York* | `2:12-cv-03401` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_12-cv-03401 |
| William J. Martini | *Jorjani v. New Jersey Institute of Technology* | `2:18-cv-11693` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_18-cv-11693 |
| William J. Martini | *United States v. Soto* | `2:20-cr-00903` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_20-cr-00903 |
| Brian R. Martinotti | *Brian Trematore Plumbing & Heating, Inc. v. Sheet Metal Workers Local Union 25, SMART* | `2:21-cv-05285` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_21-cv-05285 |
| Brian R. Martinotti | *Government Employees Insurance Co. v. Caring Pain Management, P.C.* | `2:22-cv-05017` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_22-cv-05017 |
| Kevin McNulty | *Matrix Distributors, Inc. v. National Association of Boards of Pharmacy* | `2:18-cv-17462` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_18-cv-17462 |
| Julien X. Neals | *Golden Fortune Import & Export Corp. v. Mei-Xin Ltd.* | `2:22-cv-01369` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_22-cv-01369 |
| Julien X. Neals | *United States v. Figueroa* | `2:14-cr-00672` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_14-cr-00672 |
| Evelyn Padin | *Handal v. Innovative Industrial Properties, Inc.* | `2:22-cv-02359` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_22-cv-02359 |
| Zahid N. Quraishi | *Kim v. Hanlon* | `3:24-cv-01098` | https://www.govinfo.gov/app/details/USCOURTS-njd-3_24-cv-01098 |
| Jamel K. Semper | *United States v. McIver* | `2:25-cr-00388` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_25-cr-00388 |
| Peter G. Sheridan | *Association of New Jersey Rifle & Pistol Clubs, Inc. v. Grewal* | `3:18-cv-10507` | https://www.govinfo.gov/app/details/USCOURTS-njd-3_18-cv-10507 |
| Peter G. Sheridan | *Oakwood Laboratories, LLC v. Thanoo* | `3:17-cv-05090` | https://www.govinfo.gov/app/details/USCOURTS-njd-3_17-cv-05090 |
| Peter G. Sheridan | *Sovereign Bank v. REMI Capital, Inc.* | `3:09-cv-01580` | https://www.govinfo.gov/app/details/USCOURTS-njd-3_09-cv-01580 |
| Michael A. Shipp | *Government Employees Insurance Co. v. Precision Pain & Spine Institute LLC* | `3:21-cv-16255` | https://www.govinfo.gov/app/details/USCOURTS-njd-3_21-cv-16255 |
| Michael A. Shipp | *National Collegiate Athletic Ass'n v. Christie* | `3:12-cv-04947` | https://www.govinfo.gov/app/details/USCOURTS-njd-3_12-cv-04947 |
| Michael A. Shipp | *Veterans Guardian VA Claim Consulting, LLC v. Platkin* | `3:23-cv-20660` | https://www.govinfo.gov/app/details/USCOURTS-njd-3_23-cv-20660 |
| Susan D. Wigenton | *United States v. Auernheimer* | `2:11-cr-00470` | https://www.govinfo.gov/app/details/USCOURTS-njd-2_11-cr-00470 |
| Karen M. Williams | *Cornish-Adebiyi v. Caesars Entertainment, Inc.* | `1:23-cv-02536` | https://www.govinfo.gov/app/details/USCOURTS-njd-1_23-cv-02536 |

Three of these confirm something the record had lost. *ANJRPC v. Platkin* is
*ANJRPC v. Grewal* below — the caption followed the Attorney General, not the
case. *Khalil v. President* is *Khalil v. Joyce* below. And *Veterans Guardian*
is a single docket, 3:23-cv-20660, with Shipp presiding and Day referred: the
entry on each judge's page is that judge's own ruling in one matter, not a
duplicate.

---

## Judge conflicts — do not restore until the cover page is read (3)

The docket resolved, but the judge on it is not the judge on the record.
CourtListener reports the *current* assignment, which is not necessarily the
judge appealed from. The Third Circuit states the judge appealed from on the
cover page of its opinion. Read it.


**Kevin McNulty — *J.M. v. Summit City Board of Education***  
District docket `2:19-cv-00159`. The docket carries no assignment in CourtListener, so McNulty is not confirmed from this source. Timing fits: the appeal, No. 20-3391, was taken in 2020, which rules out the two 2023 J.M. dockets before Neals and Padin. Confirm the judge from the Third Circuit cover page before restoring.  
Read: https://www2.ca3.uscourts.gov/opinarch/203391p.pdf

**Esther Salas — *Berkelhammer v. ADP TotalSource Group, Inc.***  
District docket `2:20-cv-05696`. Record attributes this to Esther Salas. The docket's current assignment is Evelyn Padin. Padin was not on the bench when the case was filed in May 2020, so a reassignment is likely and the CourtListener field shows the present assignment, not the judge appealed from. Read the Third Circuit cover page in No. 22-1618, which names the district judge. Do not restore this entry to either judge's page until that is read.  
Read: https://www2.ca3.uscourts.gov/opinarch/221618p.pdf

**Susan D. Wigenton — *Huertas v. Bayer US LLC***  
District docket `2:21-cv-20021`. Record attributes this to Susan D. Wigenton. The docket is assigned to Stanley R. Chesler. Both sit in Newark, so a reassignment is possible, but the entry cannot go on Wigenton's page until the Third Circuit cover page in No. 23-2178 names the judge appealed from. If it names Chesler, the entry belongs on Chesler's page, not Wigenton's.  
Read: https://www2.ca3.uscourts.gov/opinarch/232178p.pdf

---

## Still open (12)

| Judge | Case | Appellate docket | Why | Read this |
|---|---|---|---|---|
| Madeline Cox Arleo | *Antar v. Borgata Hotel Casino & Spa, LLC* | — | No Antar v. | https://www2.ca3.uscourts.gov/opinarch/241364np.pdf |
| Madeline Cox Arleo | *In re Congoleum Corp.* | 23-1295 | Forty-four Congoleum dockets in D. | https://www2.ca3.uscourts.gov/opinarch/231295p.pdf |
| Mary Little Cooper | *Coleman v. Home Depot, Inc.* | — | Not yet attempted. | https://www2.ca3.uscourts.gov/opinarch/003496.pdf |
| Mary Little Cooper | *United States v. Smith* | 12-1516 | Not yet attempted. | https://www2.ca3.uscourts.gov/opinarch/121516p.pdf |
| Katharine S. Hayden | *United States v. Gwinnett* | 06-1766 | The appeal is United States v. | https://www2.ca3.uscourts.gov/opinarch/061766p.pdf |
| Katharine S. Hayden | *United States v. Jackson* | 16-1200, 16-1201 | The appeal is United States v. | https://www2.ca3.uscourts.gov/opinarch/161200p.pdf |
| Kevin McNulty | *J.M. v. Summit City Board of Education* | 20-3391 | The docket carries no assignment in CourtListener, so McNulty is not confirmed from this source. | https://www2.ca3.uscourts.gov/opinarch/203391p.pdf |
| Christine P. O’Hearn | *Thieme v. Warden Fort Dix FCI* | 23-1697 | Two candidates, both before O'Hearn and both Fort Dix habeas petitions captioned by the warden of the day: Thieme v. | https://www2.ca3.uscourts.gov/opinarch/231697p.pdf |
| Esther Salas | *Berkelhammer v. ADP TotalSource Group, Inc.* | 22-1618 | Record attributes this to Esther Salas. | https://www2.ca3.uscourts.gov/opinarch/221618p.pdf |
| Susan D. Wigenton | *Huertas v. Bayer US LLC* | 23-2178 | Record attributes this to Susan D. | https://www2.ca3.uscourts.gov/opinarch/232178p.pdf |
| Susan D. Wigenton | *United States v. Baroni and Kelly; Supreme Cou* | — | The Baroni dockets in RECAP are a 2020 magistrate matter and a 2021 criminal case, neither of which is the Bridgegate prosecution. | https://www.supremecourt.gov/opinions/19pdf/18-1059_e2p3.pdf |
| Susan D. Wigenton | *United States v. Jackson* | 23-2492 | Not yet attempted. | https://www2.ca3.uscourts.gov/opinarch/232492p.pdf |

---

## Published entries missing a district docket (3)

These render and their links resolve to a district decision. Only the docket is
absent, which makes them unverifiable. The gate warns rather than blocks.

| Judge | Case | Link |
|---|---|---|
| Renée Marie Bumb | *Koons v. Platkin* | https://cases.justia.com/federal/district-courts/new-jersey/njdce/1%3A2022cv07464/506033/124/0.pdf?ts=1684339152 |
| Esther Salas | *FTC v. Wyndham Worldwide Corp.* | https://www.courtlistener.com/opinion/7305635/federal-trade-commission-v-wyndham-worldwide-corp/ |
| Anne Elise Thompson | *Bowen Engineering Corp. v. Estate of Reeve* | https://law.justia.com/cases/federal/district-courts/FSupp/799/467/1379103/ |

---

## Restoring an entry

Finding the docket is step one. The entry goes back only when the trial judge's
own decision on that docket is in hand.

1. Locate the opinion or order the appeal was taken from. Try the GovInfo
   candidate above, then RECAP's docket entries.
2. Confirm the judge who signed it is the judge whose page it will appear on.
3. Set `public_url` and `links` to the district decision, keeping the appellate
   link as a second entry with its own anchor. Set `link_level` to `district`.
4. Move the file into `src/content/districts/dnj/opinions/`.
5. Raise the judge's `actual_selected_count` and `declared_selected_count` and
   the count in `service_line_reviewed`. Set `record_status` back to
   `represented` and clear `record_status_note`.
6. `npm run validate`.

