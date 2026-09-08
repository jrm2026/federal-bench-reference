#!/usr/bin/env python3
"""Batch 3 (in progress). Biographies drafted from primary sources."""
import json, os
D = os.path.join(os.path.dirname(__file__), "..", "data", "judges")

def load(j):
    with open(os.path.join(D, j + ".json"), encoding="utf-8") as f: return json.load(f)
def save(j, r):
    with open(os.path.join(D, j + ".json"), "w", encoding="utf-8") as f:
        json.dump(r, f, indent=2, ensure_ascii=False); f.write("\n")

# --- Kiel, from the FJC Biographical Directory -----------------------------
k = load("edward-s-kiel")
k["biography"] = {
    "text": None,
    "education": [
        {"institution": "Rutgers University", "degree": "B.A.", "year": 1988},
        {"institution": "Rutgers University", "degree": "B.S.E.E.", "year": 1988},
        {"institution": "University of Notre Dame", "degree": "J.D.", "year": 1991},
    ],
    "prior_service": [
        {"role": "Law clerk to Hon. Michael R. Imbriani, Superior Court of New Jersey, Somerset County", "years": "1991–1992"},
        {"role": "Private practice, New Jersey", "years": "1992–2019"},
        {"role": "U.S. Magistrate Judge, District of New Jersey", "years": "2019–2024"},
    ],
    "facts": [
        {"label": "Born", "value": "1965, Daegu, South Korea"},
        {"label": "Nominated", "value": "Joseph R. Biden, January 8, 2024, to the seat vacated by Kevin McNulty"},
        {"label": "Confirmed", "value": "March 20, 2024"},
        {"label": "Commission", "value": "March 25, 2024"},
    ],
    "source_url": "https://www.fjc.gov/history/judges/kiel-edward-sunyol",
    "verification_status": "source-checked",
    "reviewer": None,
    "review_date": None,
    "notes": (
        "Served as a D.N.J. magistrate judge from 2019 to 2024. Any opinion selected from that period "
        "must be labelled as magistrate work, per the audit item carried in docs/CORRECTIONS.md. "
        "He fills the seat Kevin McNulty vacated on taking senior status, which independently "
        "corroborates that McNulty is in senior service rather than inactive."
    ),
}
save("edward-s-kiel", k)
print("batch 3: kiel")
