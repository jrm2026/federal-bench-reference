#!/usr/bin/env python3
"""Batch 2, checked 2026-09-03. Appellate currency on the flagship matters."""

import json, os

D = os.path.join(os.path.dirname(__file__), "..", "data", "judges")
TODAY = "2026-09-03"

def load(j):
    with open(os.path.join(D, j + ".json"), encoding="utf-8") as f: return json.load(f)

def save(j, r):
    with open(os.path.join(D, j + ".json"), "w", encoding="utf-8") as f:
        json.dump(r, f, indent=2, ensure_ascii=False); f.write("\n")

# ---------------------------------------------------------------------------
# Sheridan — ANJRPC. The stay is of the MANDATE, and it is open-ended.
# ---------------------------------------------------------------------------
s = load("peter-g-sheridan")
o = s["significant_opinions"][0]
o["appellate_history"] = [
    {
        "court": "3d Cir. (en banc), No. 24-2415",
        "date": "2026-07-17",
        "disposition": "10-5. Freeman, J. Semi-automatic rifles and magazines holding more than ten rounds are arms in common use for lawful purposes; New Jersey's restrictions violate the Second Amendment. Broadened the district relief, which had reached only Colt-manufactured AR-15s, and reversed as to the magazine restriction. The first federal court of appeals decision invalidating a state assault-weapons ban on Second Amendment grounds.",
        "url": "https://law.justia.com/cases/federal/appellate-courts/ca3/24-2415/24-2415-2026-07-17.html",
        "effect_on_lower_ruling": "Modified and expanded in part; reversed in part",
        "status_checked": TODAY,
    },
    {
        "court": "3d Cir. (en banc)",
        "date": "2026-08-04",
        "disposition": "Freeman, J. Issuance of the mandate stayed pending the Supreme Court's disposition of the anticipated petition for a writ of certiorari, or until the time to file has expired. If certiorari is granted, the stay continues through final disposition on the merits. New Jersey moved on July 31, which itself suspended issuance while the motion was pending.",
        "url": None,
        "effect_on_lower_ruling": "Mandate stayed. The challenged provisions remain enforceable notwithstanding the holding.",
        "status_checked": TODAY,
    },
]
o["current_posture"] = {
    "as_of": TODAY,
    "statement": "No certiorari petition has been filed. New Jersey's deadline is 15 October 2026, extendable by application to the Circuit Justice for the Third Circuit. The en banc holding is not operative; the statutes remain enforceable.",
    "next_check_trigger": "2026-10-15 filing deadline, and any extension application.",
}
o["notes"] = (
    "The prior report presented the en banc holding as operative law and omitted the stay. "
    "The stay runs against the mandate, not the opinion: the holding stands as circuit precedent "
    "while the relief is suspended. State that distinction precisely or not at all."
)
save("peter-g-sheridan", s)

# ---------------------------------------------------------------------------
# Farbiarz — Khalil. Rehearing denied 6-5; mandate stayed under FRAP 41(d).
# ---------------------------------------------------------------------------
f = load("michael-e-farbiarz")
o = f["significant_opinions"][0]
o["caption"] = "Khalil v. President of the United States"
o["docket"] = "2:25-cv-01963 (D.N.J.) (district caption Khalil v. Joyce)"
o["appellate_history"] = [
    {
        "court": "3d Cir., Nos. 25-2162 & 25-2357",
        "date": "2026-01-15",
        "disposition": "Per curiam, 2-1 (Hardiman and Bibas, JJ.; Freeman, J., dissenting). The district court had habeas jurisdiction as the district of confinement, but 8 U.S.C. § 1252(b)(9) stripped subject-matter jurisdiction over claims arising from removal, channeling them into a petition for review. Vacated the orders of 29 April, 28 May, 11 June, 20 June and 17 July 2025 and remanded with instructions to dismiss the petition.",
        "url": "https://www2.ca3.uscourts.gov/opinarch/252162p.pdf",
        "effect_on_lower_ruling": "Vacated; remanded with instructions to dismiss",
        "status_checked": TODAY,
    },
    {
        "court": "3d Cir.",
        "date": "2026-05-22",
        "disposition": "Rehearing en banc denied, 6-5, over a dissent by Krause, Restrepo and Freeman, JJ.",
        "url": None,
        "effect_on_lower_ruling": "No change",
        "status_checked": TODAY,
    },
    {
        "court": "3d Cir.",
        "date": "2026-05-26",
        "disposition": "Motion to stay the mandate under Fed. R. App. P. 41(d) granted, pending the filing and disposition of a petition for certiorari. Absent the stay the mandate would have issued 29 May 2026 and the district court's orders would have dissolved.",
        "url": None,
        "effect_on_lower_ruling": "Mandate stayed; the vacatur has not taken effect below",
        "status_checked": TODAY,
    },
]
o["current_posture"] = {
    "as_of": TODAY,
    "statement": "No certiorari petition confirmed filed. The mandate remains stayed, so the district court's orders have not been dissolved. The Board of Immigration Appeals has separately entered a final order of removal, and review of that order runs through a petition for review in a different circuit, not through this case.",
    "next_check_trigger": "Supreme Court docket for a petition; Third Circuit docket for issuance of the mandate.",
}
o["notes"] = (
    "The prior report omitted the denial of rehearing and the stay. Two distinctions must survive "
    "into any published summary: the Third Circuit did not reach the constitutional merits, and its "
    "vacatur is not yet in effect. Do not describe the district court's analysis as good law and do "
    "not describe it as undone."
)
save("michael-e-farbiarz", f)

# ---------------------------------------------------------------------------
# Semper — McIver. Remand pending; count numbering unresolved.
# ---------------------------------------------------------------------------
sm = load("jamel-k-semper")
o = sm["significant_opinions"][0]
o["decided"] = "2025-11-13"
o["appellate_history"] = [
    {
        "court": "D.N.J. (subsequent district ruling)",
        "date": "2026-01",
        "disposition": "Semper, J., declined to dismiss the count on which he had reserved judgment in November. McIver noticed an appeal from that ruling as well.",
        "url": None,
        "effect_on_lower_ruling": "Not applicable",
        "status_checked": TODAY,
    },
    {
        "court": "3d Cir., No. 25-3573",
        "date": "2026-08-26",
        "disposition": "2-1 (Chung, J., joined by Bibas, J.; Ambro, J., dissenting in part). Affirmed as to Counts One and Two: prosecution would not require the Congresswoman to answer for legislative acts under the two-step test of United States v. Menendez. Vacated and remanded Count Three, which asserts no specific actus reus and reaches a broader range of conduct that the district court had analyzed together with Count One on the narrower timeframe outside the security gate. Dismissed the balance of the appeal, including the selective and vindictive prosecution claims, for lack of jurisdiction. Ambro, J., would have vacated as to Count Two and allowed discovery on the retaliation claim.",
        "url": "https://www2.ca3.uscourts.gov/opinarch/253573p.pdf",
        "effect_on_lower_ruling": "Affirmed in part; vacated and remanded in part",
        "status_checked": TODAY,
    },
]
o["current_posture"] = {
    "as_of": TODAY,
    "statement": "On remand Judge Semper must decide whether the conduct charged at Count Three includes legislative acts and, if so, whether the count can stand once protected conduct is removed. Counts One and Two may proceed. No trial date is set; trial was adjourned indefinitely in November 2025 pending the immunity rulings.",
    "next_check_trigger": "District docket for the remand ruling and any trial date.",
}
o["notes"] = (
    "Two open items. First, the docket is Crim. No. 25-388, not 2:25-cr-00373 as the prior report "
    "states. Second, the count numbering does not reconcile across sources: one repository copy of "
    "the 13 November 2025 order reads as a denial on Counts One and Three with judgment reserved on "
    "Count Two, while the Third Circuit opinion and contemporaneous reporting treat Count Three as "
    "the reserved and now remanded count. Read the signed order before writing the headnote, and do "
    "not paraphrase count numbers from press coverage."
)
save("jamel-k-semper", sm)

# ---------------------------------------------------------------------------
# Bumb — Koons. Current posture, added when gate 6a was introduced.
# ---------------------------------------------------------------------------
b = load("renee-marie-bumb")
b["significant_opinions"][0]["current_posture"] = {
    "as_of": TODAY,
    "statement": (
        "The 10 September 2025 panel opinion was vacated on 11 December 2025 when rehearing en banc "
        "was granted, so there is no operative appellate disposition. The consolidated appeal was "
        "argued en banc on 11 February 2026, with supplemental briefing after a Supreme Court decision "
        "in July 2026, and remains undecided. What governs is the district court's preliminary "
        "injunction as modified by the Third Circuit's partial stay of 20 June 2023, which stayed the "
        "injunction as to the enumerated sensitive places and left it in place as to private property "
        "open to the public and carry in vehicles."
    ),
    "next_check_trigger": "Third Circuit docket Nos. 23-1900 and 23-2043 for the en banc decision.",
}
save("renee-marie-bumb", b)

print("batch 2 applied")
