#!/usr/bin/env python3
"""
Applies content that was checked against a primary source on 2026-09-03.

Verification states:
  unverified    - nothing has been read against a primary source
  source-checked- an agent read the primary source and the field matches it
  verified      - the curator signed off; requires reviewer + review_date

Only "verified" clears the build gate. Everything below is left at
"source-checked" because the curator has not signed off.
"""

import json, os

D = os.path.join(os.path.dirname(__file__), "..", "data", "judges")
TODAY = "2026-09-03"


def load(jid):
    with open(os.path.join(D, jid + ".json"), encoding="utf-8") as f:
        return json.load(f)


def save(jid, r):
    with open(os.path.join(D, jid + ".json"), "w", encoding="utf-8") as f:
        json.dump(r, f, indent=2, ensure_ascii=False)
        f.write("\n")


# --- Bumb: biography checked against the FJC Biographical Directory ---------

b = load("renee-marie-bumb")
b["biography"] = {
    "text": None,  # prose to be drafted from the facts below, then reviewed
    "education": [
        {"institution": "Ohio State University", "degree": "B.A.", "year": 1981},
        {"institution": "University of Chicago", "degree": "M.A.", "year": 1983},
        {"institution": "Rutgers School of Law–Newark", "degree": "J.D.", "year": 1987},
    ],
    "prior_service": [
        {"role": "Law clerk to Hon. Garrett E. Brown, Jr., U.S. District Court, D.N.J.", "years": "1987–1988"},
        {"role": "Private practice, New Jersey", "years": "1988–1991"},
        {"role": "Assistant U.S. Attorney, District of New Jersey", "years": "1991–2006"},
    ],
    "facts": [
        {"label": "Born", "value": "1960, Bellevue, Ohio"},
        {"label": "Nominated", "value": "George W. Bush, January 25, 2006, to the seat vacated by William H. Walls"},
        {"label": "Confirmed", "value": "June 6, 2006"},
        {"label": "Commission", "value": "June 12, 2006"},
        {"label": "Chief Judge", "value": "2023–present"},
        {"label": "Judicial Conference of the United States", "value": "Member, 2023"},
    ],
    "source_url": "https://www.fjc.gov/history/judges/bumb-ren-e-marie",
    "verification_status": "source-checked",
    "reviewer": None,
    "review_date": None,
}
b["status"]["notes"] = (
    "CORRECTION: the Appendix A reference template carried a biography for this judge showing Ursinus "
    "College and the University of Pennsylvania Law School. Both are wrong. The FJC directory records "
    "Ohio State, Chicago and Rutgers–Newark. The template biography must not be used as scaffold content."
)
b["significant_opinions"] = [
    {
        "caption": "Koons v. Platkin",
        "citation": "673 F. Supp. 3d 515 (D.N.J. 2023)",
        "docket": "1:22-cv-07464",
        "court": "D.N.J.",
        "decided": "2023-05-16",
        "public_url": "https://www.govinfo.gov/content/pkg/USCOURTS-njd-1_22-cv-07464/pdf/USCOURTS-njd-1_22-cv-07464-3.pdf",
        "repository": "GovInfo",
        "authored_as": "district judge",
        "selection_basis": "Institutional consequence; consolidated constitutional challenge; extensive appellate treatment",
        "headnote": None,
        "appellate_history": [
            {
                "court": "3d Cir.",
                "date": "2025-09-10",
                "disposition": "Precedential decision on the consolidated appeals",
                "url": "https://www2.ca3.uscourts.gov/opinarch/231900p.pdf",
                "effect_on_lower_ruling": "Mixed. Confirm the precise scope before publication.",
                "status_checked": None,
            }
        ],
        "verification_status": "unverified",
        "reviewer": None,
        "review_date": None,
        "notes": "Appellate scope and any Supreme Court activity NOT re-verified. Do not publish until checked.",
    }
]
save("renee-marie-bumb", b)

# --- Sheridan: ANJRPC, re-verified including the August 4 stay --------------

s = load("peter-g-sheridan")
s["significant_opinions"] = [
    {
        "caption": "Association of New Jersey Rifle & Pistol Clubs, Inc. v. Platkin",
        "citation": "742 F. Supp. 3d 421 (D.N.J. 2024)",
        "docket": "Consolidated, 1:18-cv-10507 et al.",
        "court": "D.N.J.",
        "decided": "2024-07-30",
        "public_url": "https://www.govinfo.gov/content/pkg/USCOURTS-njd-3_22-cv-04397/pdf/USCOURTS-njd-3_22-cv-04397-1.pdf",
        "repository": "GovInfo",
        "authored_as": "senior district judge",
        "selection_basis": "Institutional consequence; en banc appellate treatment",
        "headnote": None,
        "appellate_history": [
            {
                "court": "3d Cir. (en banc), No. 24-2415",
                "date": "2026-07-17",
                "disposition": "10-5. Held that semi-automatic rifles and magazines over ten rounds are arms in common use and that New Jersey's restrictions violate the Second Amendment. Majority by Freeman, J. Broadened the district relief, which had reached only Colt-manufactured AR-15s, and reversed as to the magazine restriction.",
                "url": "https://law.justia.com/cases/federal/appellate-courts/ca3/24-2415/24-2415-2026-07-17.html",
                "effect_on_lower_ruling": "Modified and expanded in part; reversed in part",
                "status_checked": TODAY,
            },
            {
                "court": "3d Cir. (en banc)",
                "date": "2026-08-04",
                "disposition": "The court stayed its own judgment before the July 31 effective date, pending New Jersey's petition for certiorari. The challenged provisions remain enforced.",
                "url": None,
                "effect_on_lower_ruling": "Judgment stayed; relief not in effect",
                "status_checked": TODAY,
            },
        ],
        "verification_status": "source-checked",
        "reviewer": None,
        "review_date": None,
        "notes": "The prior research report omitted the August 4, 2026 stay and presented the en banc holding as operative law. Recheck the certiorari docket before every publish.",
    }
]
save("peter-g-sheridan", s)

# --- Semper: McIver, docket number corrected -------------------------------

sm = load("jamel-k-semper")
sm["significant_opinions"] = [
    {
        "caption": "United States v. McIver",
        "citation": None,
        "docket": "Crim. No. 25-388 (D.N.J.)",
        "court": "D.N.J.",
        "decided": "2025-11-13",
        "public_url": "https://storage.courtlistener.com/recap/gov.uscourts.njd.575005/gov.uscourts.njd.575005.44.0.pdf",
        "repository": "CourtListener / RECAP",
        "authored_as": "district judge",
        "selection_basis": "Institutional consequence; Speech or Debate Clause; interlocutory appeal",
        "headnote": None,
        "appellate_history": [
            {
                "court": "3d Cir., No. 25-3573",
                "date": "2026-08-26",
                "disposition": "2-1 (Chung, J., joined by Bibas, J.; Ambro, J., dissenting in part). Affirmed the denial of legislative immunity as to Counts One and Two; vacated and remanded as to Count Three for further consideration of legislative immunity; dismissed the balance of the appeal, including the selective and vindictive prosecution claims, for lack of jurisdiction.",
                "url": "https://law.justia.com/cases/federal/appellate-courts/ca3/25-3573/25-3573-2026-08-26.html",
                "effect_on_lower_ruling": "Affirmed in part; vacated and remanded in part",
                "status_checked": TODAY,
            }
        ],
        "verification_status": "source-checked",
        "reviewer": None,
        "review_date": None,
        "notes": (
            "CORRECTIONS to the prior research report: (1) the docket is Crim. No. 25-388, not 2:25-cr-00373; "
            "(2) the district court denied the motion as to Counts One and Three and reserved judgment on "
            "Count Two, which the report did not reflect. Reconcile the count numbering against both opinions "
            "before writing the headnote."
        ),
    }
]
save("jamel-k-semper", sm)

# --- Farbiarz: Khalil, current posture -------------------------------------

f = load("michael-e-farbiarz")
f["significant_opinions"] = [
    {
        "caption": "Khalil v. President of the United States",
        "citation": None,
        "docket": "2:25-cv-01963 (D.N.J.)",
        "court": "D.N.J.",
        "decided": "2025-06-11",
        "public_url": None,
        "repository": None,
        "authored_as": "district judge",
        "selection_basis": "Institutional consequence; appellate treatment on jurisdiction",
        "headnote": None,
        "appellate_history": [
            {
                "court": "3d Cir., Nos. 25-2162 & 25-2357",
                "date": "2026-01-15",
                "disposition": "Per curiam, 2-1 (Hardiman and Bibas, JJ.; Freeman, J., dissenting). Held the district court had habeas jurisdiction but that 8 U.S.C. § 1252(b)(9) stripped subject-matter jurisdiction over the removal claims. Vacated the orders of April 29, May 28, June 11, June 20 and July 17, 2025 and remanded with instructions to dismiss the petition.",
                "url": "https://www2.ca3.uscourts.gov/opinarch/252162p.pdf",
                "effect_on_lower_ruling": "Vacated; remanded with instructions to dismiss",
                "status_checked": TODAY,
            },
            {
                "court": "3d Cir.",
                "date": "2026-05-22",
                "disposition": "Rehearing en banc denied.",
                "url": None,
                "effect_on_lower_ruling": "No change",
                "status_checked": TODAY,
            },
            {
                "court": "3d Cir.",
                "date": "2026-05-26",
                "disposition": "Mandate stayed pending a petition for certiorari.",
                "url": None,
                "effect_on_lower_ruling": "Mandate not issued; the vacatur has not taken effect below",
                "status_checked": TODAY,
            },
        ],
        "verification_status": "source-checked",
        "reviewer": None,
        "review_date": None,
        "notes": (
            "The prior research report omitted the denial of rehearing and the stay of the mandate. "
            "Do not describe the district court's constitutional analysis as operative law, and do not "
            "describe the vacatur as having taken effect. Recheck the certiorari docket before publish."
        ),
    }
]
save("michael-e-farbiarz", f)

print("patched: bumb, sheridan, semper, farbiarz")
