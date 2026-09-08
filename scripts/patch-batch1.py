#!/usr/bin/env python3
"""Batch 1 verification, checked 2026-09-03. Includes a reversal of a
correction I made in error on the same date."""

import json, os

D = os.path.join(os.path.dirname(__file__), "..", "data", "judges")
TODAY = "2026-09-03"

def load(j):
    with open(os.path.join(D, j + ".json"), encoding="utf-8") as f: return json.load(f)

def save(j, r):
    with open(os.path.join(D, j + ".json"), "w", encoding="utf-8") as f:
        json.dump(r, f, indent=2, ensure_ascii=False); f.write("\n")

# ---------------------------------------------------------------------------
# 1. HAMMER / SILAGI — reversing my own error
#
# The court's Notice to the Bar of 1 September 2026 states that Silagi fills
# "the full-time magistrate judgeship position vacated upon the retirement of
# Magistrate Judge Michael A. Hammer." Hammer joined Lowenstein Sandler on
# 2 September 2026 after fifteen years on the bench.
#
# The prior research report was therefore right to carry Silagi and not Hammer.
# The Our Judges page is stale: it still lists Hammer and does not yet list
# Silagi. My earlier correction was wrong.
# ---------------------------------------------------------------------------

h = load("michael-a-hammer")
h["status"].update({
    "label": "Former",
    "commission_or_appointment_date": "2011-07-25",
    "term_end": "2026",
    "roster_basis": "Retired. Still listed on the Our Judges directory as of the roster read; the directory is stale.",
    "roster_source": "https://www.njd.uscourts.gov/sites/njd/files/NoticetotheBarADS.pdf",
    "notes": (
        "RETIRED 2026. Appointed 25 July 2011; reappointed 2019 to a term that would have run to "
        "24 July 2027. Served as chief magistrate judge. Do not publish a profile page. Retain the "
        "record so that opinions authored by him carry a correct author attribution and a former-judge label."
    ),
})
h["publish"] = False
h["research_lead"] = {"source": None, "note": "Former judge. No profile page."}
save("michael-a-hammer", h)

s = load("alex-d-silagi")
s["status"].update({
    "roster_basis": (
        "Appointed by the court's district judges and informally sworn 1 September 2026 per Notice to "
        "the Bar; fills the full-time Newark magistrate judgeship vacated by the retirement of "
        "Magistrate Judge Michael A. Hammer. Not yet reflected on the Our Judges directory."
    ),
    "roster_source": "https://www.njd.uscourts.gov/sites/njd/files/NoticetotheBarADS.pdf",
    "notes": "Formal investiture to be scheduled. Chambers at the Frank R. Lautenberg U.S. Post Office and Courthouse, Newark. No case list: no judicial output can exist.",
})
s["biography"].update({
    "education": [
        {"institution": "Rutgers University", "degree": "B.A.", "year": 2010},
        {"institution": "Seton Hall University School of Law", "degree": "J.D.", "year": 2014},
    ],
    "prior_service": [
        {"role": "Associate, Carter Ledyard & Milburn LLP, New York", "years": "2014–2015"},
        {"role": "Law clerk to Hon. Madeline Cox Arleo, U.S. District Court, D.N.J.", "years": "2015–2017"},
        {"role": "Law clerk to Hon. Morton I. Greenberg, U.S. Court of Appeals for the Third Circuit", "years": "2017–2018"},
        {"role": "Associate, Proskauer Rose LLP", "years": "2018–2020"},
        {"role": "Assistant U.S. Attorney and Deputy Chief of the Civil Division, District of New Jersey", "years": "2020–2026"},
    ],
    "source_url": "https://www.njd.uscourts.gov/sites/njd/files/NoticetotheBarADS.pdf",
    "verification_status": "source-checked",
})
save("alex-d-silagi", s)

# ---------------------------------------------------------------------------
# 2. Senior status dates — FJC
# ---------------------------------------------------------------------------

for jid, comm, senior, src in [
    ("stanley-r-chesler", "2002-12-04", "2015-06-15", "https://www.fjc.gov/history/judges/chesler-stanley-r"),
    ("katharine-s-hayden", "1997-09-29", "2010-05-30", "https://www.fjc.gov/history/judges/hayden-katharine-sweeney"),
    ("william-j-martini", "2002-11-19", "2015-02-10", "https://www.fjc.gov/history/judges/martini-william-j"),
]:
    r = load(jid)
    r["status"].update({
        "commission_or_appointment_date": comm,
        "senior_status_date": senior,
        "notes": None,
        "source_url": src,
        "roster_checked": TODAY,
    })
    save(jid, r)

hy = load("katharine-s-hayden")
hy["biography"]["education"] = [
    {"institution": "Marymount Manhattan College", "degree": "B.A.", "year": 1963},
    {"institution": "Seton Hall University", "degree": "M.A.", "year": 1971},
    {"institution": "Seton Hall University School of Law", "degree": "J.D.", "year": 1975},
]
hy["biography"]["source_url"] = "https://www.fjc.gov/history/judges/hayden-katharine-sweeney"
hy["biography"]["verification_status"] = "source-checked"
hy["biography"]["notes"] = "The prior report gave 'Marymount College.' The FJC records Marymount Manhattan College."
save("katharine-s-hayden", hy)

# ---------------------------------------------------------------------------
# 3. Magistrate appointment dates — uscourts.gov judicial milestones
# ---------------------------------------------------------------------------

p = load("elizabeth-a-pascal")
p["status"].update({
    "commission_or_appointment_date": "2022-06-06",
    "notes": (
        "The prior report gave 'on bench by August 2022,' which is the date of the court's combined "
        "formal investiture ceremony for seven magistrate judges appointed during the pandemic, not "
        "an appointment date. Appointed 6 June 2022."
    ),
    "source_url": "https://www.uscourts.gov/judicial-milestones/elizabeth-pascal",
    "roster_checked": TODAY,
})
save("elizabeth-a-pascal", p)

e = load("andre-m-espinosa")
e["status"].update({
    "commission_or_appointment_date": "2021-03-24",
    "notes": None,
    "source_url": "https://www.uscourts.gov/judicial-milestones/andre-m-espinosa",
    "roster_checked": TODAY,
})
save("andre-m-espinosa", e)

c = load("james-b-clark-iii")
c["status"].update({
    "commission_or_appointment_date": "2013-07-15",
    "term_end": "2029-07-14",
    "notes": (
        "Reappointment Notice to the Bar records his term expiring 14 July 2021 and a merit selection "
        "panel convened for a new eight-year term, so the current term runs to 14 July 2029. "
        "LAW SCHOOL UNRESOLVED. The St. John's attribution traces to the prior report's narrative and "
        "to a blocked commercial-AI source. Ballotpedia and a New Jersey Law Journal biographical entry "
        "both give Seton Hall (J.D. 1986), with Notre Dame, B.B.A. 1983. The NJLJ-derived page also "
        "states that a President nominated him, which is wrong for a magistrate judge, so it is not "
        "reliable enough to close the question. Omit the law school from the published page until the "
        "court or chambers confirms it."
    ),
    "roster_checked": TODAY,
})
save("james-b-clark-iii", c)

# ---------------------------------------------------------------------------
# 4. Koons — the September 2025 panel opinion no longer exists
# ---------------------------------------------------------------------------

b = load("renee-marie-bumb")
b["significant_opinions"][0].update({
    "decided": "2023-05-16",
    "appellate_history": [
        {
            "court": "3d Cir., Nos. 23-1900 & 23-2043 (panel)",
            "date": "2025-09-10",
            "disposition": "Panel opinion, amended 17 September 2025, affirming in part and reversing in part. VACATED. Do not cite as law and do not link as the current appellate disposition.",
            "url": None,
            "effect_on_lower_ruling": "Vacated by the court's own order of 11 December 2025",
            "status_checked": TODAY,
        },
        {
            "court": "3d Cir. (en banc)",
            "date": "2025-12-11",
            "disposition": "Rehearing en banc granted. The panel opinion of 10 September 2025, as amended 17 September 2025, and the judgment entered 10 September 2025 were vacated.",
            "url": "https://www.courtlistener.com/docket/67401781/ronald-koons-v-attorney-general-new-jersey/",
            "effect_on_lower_ruling": "Panel disposition vacated; appeal pending",
            "status_checked": TODAY,
        },
        {
            "court": "3d Cir. (en banc)",
            "date": "2026-02-11",
            "disposition": "Argued en banc. Supplemental briefing followed a Supreme Court decision in July 2026. No en banc decision had issued as of this check.",
            "url": None,
            "effect_on_lower_ruling": "Pending",
            "status_checked": TODAY,
        },
    ],
    "verification_status": "source-checked",
    "notes": (
        "MATERIAL CORRECTION. The prior report states that in September 2025 the Third Circuit upheld "
        "most sensitive-place restrictions, links that opinion, and repeats it in the watchlist as "
        "current law. That opinion was vacated on 11 December 2025 when rehearing en banc was granted. "
        "The appeal is pending. The district court's preliminary injunction posture, as modified by the "
        "partial stay of 20 June 2023, governs. Recheck before every publish."
    ),
})
b["significant_opinions"][0]["headnote"] = None
save("renee-marie-bumb", b)

print("batch 1 applied")
