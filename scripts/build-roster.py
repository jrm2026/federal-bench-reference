#!/usr/bin/env python3
"""
Federal Bench Reference — roster builder (D.N.J.)

Emits one JSON record per jurist into data/judges/.

Design rule: nothing arrives here already "verified." Structural facts
(name, office, vicinage, roster source) are populated because they were
read off the court's own directory. Narrative facts (biography, case
selections, summaries) are emitted as null with verification_status
"unverified" so the review gate blocks them until a human reads the
primary source. The prior research report is treated as a lead sheet,
carried in `research_lead`, never as publishable content.

Roster read from https://www.njd.uscourts.gov/our-judges on 2026-09-03.
"""

import json, os, re, sys, datetime

CHECK_ONLY = "--check" in sys.argv  # CI mode: report drift and fail, write nothing

OUT = os.path.join(os.path.dirname(__file__), "..", "data", "judges")
ROSTER_SOURCE = "https://www.njd.uscourts.gov/our-judges"
ROSTER_READ = "2026-09-03"
FJC_CSV = "https://www.fjc.gov/sites/default/files/history/judges.csv"
DESIGNATION = "https://www.njd.uscourts.gov/judges-sitting-designation"


def slug(name):
    s = name.lower()
    s = s.replace("é", "e").replace("è", "e").replace("á", "a").replace("í", "i").replace("ó", "o").replace("ñ", "n")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


# ---------------------------------------------------------------------------
# ROSTER
# fields: name, office, vicinage, status_note, commission/appointment (ISO or None),
#         roster_basis, court_profile
# ---------------------------------------------------------------------------

ART3_DIRECTORY = [
    # Camden
    ("Renée Marie Bumb", "Chief U.S. District Judge", "Camden", "2006-06-12",
     "https://www.njd.uscourts.gov/content/ren%C3%A9e-marie-bumb"),
    ("Edward S. Kiel", "U.S. District Judge", "Camden", "2024-03-25",
     "https://www.njd.uscourts.gov/content/edward-s-kiel"),
    ("Christine P. O'Hearn", "U.S. District Judge", "Camden", "2021-10-22",
     "https://www.njd.uscourts.gov/content/christine-p-ohearn"),
    ("Karen M. Williams", "U.S. District Judge", "Camden", "2021-11-01",
     "https://www.njd.uscourts.gov/content/karen-m-williams"),
    # Newark
    ("Madeline Cox Arleo", "U.S. District Judge", "Newark", "2014-11-21",
     "https://www.njd.uscourts.gov/content/madeline-cox-arleo"),
    ("Claire C. Cecchi", "U.S. District Judge", "Newark", "2011-06-14",
     "https://www.njd.uscourts.gov/content/claire-c-cecchi"),
    ("Stanley R. Chesler", "Senior U.S. District Judge", "Newark", "2002-09-19",
     "https://www.njd.uscourts.gov/content/stanley-r-chesler"),
    ("Michael E. Farbiarz", "U.S. District Judge", "Newark", "2023-05-05",
     "https://www.njd.uscourts.gov/content/michael-e-farbiarz"),
    ("Katharine S. Hayden", "Senior U.S. District Judge", "Newark", "1997-11-10",
     "https://www.njd.uscourts.gov/content/katharine-s-hayden"),
    ("William J. Martini", "Senior U.S. District Judge", "Newark", "2002-11-25",
     "https://www.njd.uscourts.gov/content/william-j-martini"),
    ("Brian R. Martinotti", "U.S. District Judge", "Newark", "2016-07-11",
     "https://www.njd.uscourts.gov/content/brian-r-martinotti"),
    ("Julien X. Neals", "U.S. District Judge", "Newark", "2021-06-22",
     "https://www.njd.uscourts.gov/content/julien-xavier-neals"),
    ("Evelyn Padin", "U.S. District Judge", "Newark", "2022-06-24",
     "https://www.njd.uscourts.gov/content/evelyn-padin"),
    ("Esther Salas", "U.S. District Judge", "Newark", "2011-06-14",
     "https://www.njd.uscourts.gov/content/esther-salas"),
    ("Jamel K. Semper", "U.S. District Judge", "Newark", "2023-12-01",
     "https://www.njd.uscourts.gov/content/jamel-k-semper"),
    ("Susan D. Wigenton", "U.S. District Judge", "Newark", "2006-06-12",
     "https://www.njd.uscourts.gov/content/susan-d-wigenton"),
    # Trenton
    ("Georgette Castner", "U.S. District Judge", "Trenton", "2022-04-05",
     "https://www.njd.uscourts.gov/content/georgette-castner"),
    ("Robert Kirsch", "U.S. District Judge", "Trenton", "2023-05-08",
     "https://www.njd.uscourts.gov/content/robert-kirsch"),
    ("Zahid N. Quraishi", "U.S. District Judge", "Trenton", "2021-06-22",
     "https://www.njd.uscourts.gov/content/zahid-n-quraishi"),
    ("Michael A. Shipp", "U.S. District Judge", "Trenton", "2012-07-26",
     "https://www.njd.uscourts.gov/content/michael-shipp"),
]

MAG_DIRECTORY = [
    # Camden
    ("Ethan A. Hougah", "Camden", "2026-07-23", "https://www.njd.uscourts.gov/content/ethan-hougah"),
    ("Sharon A. King", "Camden", "2021-04-22", "https://www.njd.uscourts.gov/content/sharon-king"),
    ("Elizabeth A. Pascal", "Camden", None, "https://www.njd.uscourts.gov/content/elizabeth-pascal"),
    ("Matthew J. Skahill", "Camden", "2021-03-09", "https://www.njd.uscourts.gov/content/matthew-j-skahill"),
    # Newark
    ("Stacey D. Adams", "Newark", "2024-06-21", "https://www.njd.uscourts.gov/content/stacey-d-adams"),
    ("Jessica S. Allen", "Newark", "2021-02-17", "https://www.njd.uscourts.gov/content/jessica-s-allen"),
    ("José R. Almonte", "Newark", "2022-02-15", "https://www.njd.uscourts.gov/content/jos%C3%A9-r-almonte"),
    ("James B. Clark III", "Newark", "2013-07-15", "https://www.njd.uscourts.gov/content/james-b-clark-iii"),
    ("André M. Espinosa", "Newark", None, "https://www.njd.uscourts.gov/content/andr%C3%A9-m-espinosa"),
    ("Cari Fais", "Newark", "2025-09-03", "https://www.njd.uscourts.gov/content/cari-fais"),
    ("Leda Dunn Wettre", "Newark", None, "https://www.njd.uscourts.gov/content/leda-dunn-wettre"),
    # Trenton
    ("Tonianne J. Bongiovanni", "Trenton", "2003-04-14", "https://www.njd.uscourts.gov/content/tonianne-j-bongiovanni"),
    ("J. Brendan Day", "Trenton", "2023-04-03", "https://www.njd.uscourts.gov/content/j-brendan-day"),
    ("Justin T. Quinn", "Trenton", "2024-05-29", "https://www.njd.uscourts.gov/content/justin-t-quinn"),
    ("Rukhsanah L. Singh", "Trenton", "2022-03-16", "https://www.njd.uscourts.gov/content/rukhsanah-l-singh"),
]

# Special cases -------------------------------------------------------------

BERGMAN = ("Andrea D. Bergman", "Part-Time U.S. Magistrate Judge", "Trenton / Fort Dix", "2024-03-14",
           "https://www.njd.uscourts.gov/content/andrea-d-bergman")

# Retired, but still listed on the court's Our Judges directory at the roster
# read. The directory lags; the Notices to the Bar lead. Retained as a record
# so opinions he authored carry a correct attribution.
FORMER = [
    ("Michael A. Hammer", "U.S. Magistrate Judge", "Newark", "2011-07-25", "2026",
     "https://www.njd.uscourts.gov/content/michael-hammer"),
]

SILAGI = ("Alex D. Silagi", "U.S. Magistrate Judge", "Newark", "2026-09-01",
          "https://www.njd.uscourts.gov/content/alex-d-silagi")

# Senior Article III judges holding un-terminated commissions who are NOT on the
# chambers/e-filing directory. CORRECTION: absence from that page is not evidence
# of inactive service. Sheridan issued a merits opinion in July 2024.
SENIOR_OFF_DIRECTORY = [
    ("Mary Little Cooper", "Senior U.S. District Judge", "1992-10-09", "2011",
     "https://www.fjc.gov/node/1386061"),
    ("Anne Elise Thompson", "Senior U.S. District Judge", "1979-10-05", "2001",
     "https://www.fjc.gov/node/1388736"),
    ("Peter G. Sheridan", "Senior U.S. District Judge", "2006-06-12", "2018-06-14",
     "https://www.fjc.gov/node/1392436"),
    ("Kevin McNulty", "Senior U.S. District Judge", "2012-07-18", "2023-10-31",
     "https://www.fjc.gov/node/1394026"),
]

POLLAK = ("Cheryl L. Pollak", "Recalled U.S. Magistrate Judge sitting by designation", "Designation (home court E.D.N.Y.)")


def base(name, office, vicinage):
    return {
        "jurist_id": slug(name),
        "canonical_name": name,
        "office": office,
        "vicinage": vicinage,
        "article_iii": office.endswith("District Judge"),
        "status": {
            "label": None,
            "senior_status_date": None,
            "commission_or_appointment_date": None,
            "roster_basis": None,
            "roster_source": None,
            "roster_checked": ROSTER_READ,
            "notes": None,
        },
        "official_profile_url": None,
        "biography": {
            "text": None,
            "education": [],
            "prior_service": [],
            "facts": [],
            "source_url": None,
            "verification_status": "unverified",
            "reviewer": None,
            "review_date": None,
        },
        "significant_opinions": [],
        "matter_relevant_opinions": {
            "trade-secrets": [],
            "restrictive-covenants": [],
            "trademark-copyright": [],
            "commercial-contract": [],
            "securities": [],
            "employment": [],
        },
        "practice_information": {
            "judicial_preferences_url": "https://www.njd.uscourts.gov/judicial-preferences",
            "standing_orders_url": "https://www.njd.uscourts.gov/standing-orders",
            "motion_days_url": "https://www.njd.uscourts.gov/motion-days-0",
            "verification_status": "unverified",
        },
        "matter_listing_note": {
            k: ("Every opinion located in this category is listed, without summary. Entries are added "
                "as they are identified and are not selected by outcome. Summaries are published as "
                "they clear editorial review.")
            for k in ["trade-secrets", "restrictive-covenants", "trademark-copyright",
                      "commercial-contract", "securities", "employment"]
        },
        "news": [],
        "research_lead": {
            "source": "ChatGPT research report, 2026-09-03 (unverified)",
            "note": "Carried for triage only. Never publish from this field.",
        },
        "publish": False,
        "last_verified": None,
    }


records = []

for name, office, vic, comm, url in ART3_DIRECTORY:
    r = base(name, office, vic)
    r["status"].update({
        "label": "Senior" if office.startswith("Senior") else ("Chief" if office.startswith("Chief") else "Active"),
        "commission_or_appointment_date": comm,
        "roster_basis": "Listed on the court's Our Judges directory",
        "roster_source": ROSTER_SOURCE,
    })
    if office.startswith("Senior"):
        r["status"]["notes"] = "Senior status date to be confirmed against FJC; commission date shown is original commission."
    r["official_profile_url"] = url
    records.append(r)

for name, vic, appt, url in MAG_DIRECTORY:
    r = base(name, "U.S. Magistrate Judge", vic)
    r["status"].update({
        "label": "Active",
        "commission_or_appointment_date": appt,
        "roster_basis": "Listed on the court's Our Judges directory",
        "roster_source": ROSTER_SOURCE,
    })
    if appt is None:
        r["status"]["notes"] = "Appointment date not established. Resolve from the court's Notice to the Bar / merit selection panel notice before publishing any date."
    r["official_profile_url"] = url
    records.append(r)

# Bergman
name, office, vic, appt, url = BERGMAN
r = base(name, office, vic)
r["status"].update({
    "label": "Active (part-time)",
    "commission_or_appointment_date": appt,
    "roster_basis": "Listed on the court's Our Judges directory (Trenton); Fort Dix duty station",
    "roster_source": ROSTER_SOURCE,
})
r["official_profile_url"] = url
records.append(r)

# Silagi — sworn but not yet on the directory
name, office, vic, appt, url = SILAGI
r = base(name, office, vic)
r["status"].update({
    "label": "Active",
    "commission_or_appointment_date": appt,
    "roster_basis": "Sworn 2026-09-01 per Notice to the Bar; not yet listed on the Our Judges directory as of roster read",
    "roster_source": "https://www.njd.uscourts.gov/notices-bar",
    "notes": "Do not publish a case list. No judicial output can exist. Bio only, or hold until listed.",
})
r["official_profile_url"] = url
records.append(r)

for name, office, vic, appt, ended, url in FORMER:
    r = base(name, office, vic)
    r["status"].update({
        "label": "Former",
        "commission_or_appointment_date": appt,
        "term_end": ended,
        "roster_basis": "Retired. Still listed on the Our Judges directory at the roster read; the directory is stale.",
        "roster_source": "https://www.njd.uscourts.gov/sites/njd/files/NoticetotheBarADS.pdf",
        "notes": "Do not publish a profile page. Retain for correct authorship attribution on opinions.",
    })
    r["official_profile_url"] = url
    records.append(r)

# Senior judges off the chambers directory
for name, office, comm, senior, fjc in SENIOR_OFF_DIRECTORY:
    r = base(name, office, "Not stated on the court's chambers directory")
    r["status"].update({
        "label": "Senior",
        "senior_status_date": senior,
        "commission_or_appointment_date": comm,
        "roster_basis": "FJC records an un-terminated Article III commission; not listed on the court's chambers/e-filing directory",
        "roster_source": FJC_CSV,
        "notes": (
            "CORRECTED FRAMING. The Our Judges page is a chambers and e-filing contact directory, not a "
            "roster of commissions, and it does not separate district from magistrate judges. Absence from "
            "it is not evidence of inactive service. Do not label this judge inactive. Establish current "
            "service by docket activity within the last 12 months before publishing any status language."
        ),
    })
    r["official_profile_url"] = fjc
    records.append(r)

sher = next(r for r in records if r["jurist_id"] == "peter-g-sheridan")
sher["status"]["notes"] += (
    " Sheridan issued the consolidated summary judgment opinion in Association of New Jersey Rifle & "
    "Pistol Clubs v. Platkin on 2024-07-30. He is in ordinary senior service."
)

# Pollak — designation only
name, office, vic = POLLAK
r = base(name, office, vic)
r["article_iii"] = False
r["status"].update({
    "label": "Recalled, sitting by designation",
    "roster_basis": "Listed on the court's judges-sitting-by-designation page, not on the permanent roster",
    "roster_source": DESIGNATION,
    "notes": "Do not present E.D.N.Y. rulings as District of New Jersey case law. No case list on this page.",
})
r["official_profile_url"] = DESIGNATION
records.append(r)

# ---------------------------------------------------------------------------
# NON-DESTRUCTIVE EMIT
#
# The builder seeds; it never overwrites. Verification work is layered on top
# of these records by the patch scripts and, eventually, by hand. A builder
# that regenerates the tree would silently erase a curator's sign-off, which
# is the one thing this project cannot afford. So:
#
#   - a record that does not exist is written
#   - a record that exists is left alone, and any divergence between the
#     roster source and the committed structural fields is reported as drift
#
# Drift is a signal, not an error: the court's directory changed, or a patch
# script deliberately changed a structural field (Hammer's retirement, for
# instance). A human decides which.
# ---------------------------------------------------------------------------

STRUCTURAL = ["canonical_name", "office", "vicinage"]

os.makedirs(OUT, exist_ok=True)
created, drift = [], []

for r in records:
    path = os.path.join(OUT, r["jurist_id"] + ".json")
    if not os.path.exists(path):
        if CHECK_ONLY:
            drift.append(f"{r['jurist_id']}: on the roster source but missing from the tree")
            continue
        with open(path, "w", encoding="utf-8") as f:
            json.dump(r, f, indent=2, ensure_ascii=False)
            f.write("\n")
        created.append(r["jurist_id"])
        continue
    with open(path, encoding="utf-8") as f:
        existing = json.load(f)
    for k in STRUCTURAL:
        if existing.get(k) != r.get(k):
            drift.append(f"{r['jurist_id']}: {k} committed={existing.get(k)!r} roster={r.get(k)!r}")

known = {r["jurist_id"] for r in records}
for fn in sorted(os.listdir(OUT)):
    if not fn.endswith(".json"):
        continue
    jid = fn[:-5]
    if jid not in known:
        drift.append(f"{jid}: present in the tree but not on the roster source (former judge, or removed upstream)")

# Roster manifest
manifest = {
    "district": "District of New Jersey",
    "roster_source": ROSTER_SOURCE,
    "roster_read": ROSTER_READ,
    "counts": {
        "article_iii_on_directory": len(ART3_DIRECTORY),
        "magistrate_active": len(MAG_DIRECTORY) + 2,
        "sworn_not_yet_listed": 1,
        "former_still_listed_on_directory": len(FORMER),
        "senior_off_directory": len(SENIOR_OFF_DIRECTORY),
        "recalled_by_designation": 1,
        "records_total": len(records),
    },
    "roster_source_note": (
        "No single source is current. The Our Judges directory lags and does not distinguish "
        "district from magistrate judges; the Notices to the Bar lead. Reconcile both on every check."
    ),
    "known_divergence_from_prior_report": [
        "Michael A. Hammer retired in 2026 and Silagi fills his seat. The prior report was right to "
        "carry Silagi and not Hammer; the court's directory is stale in both directions.",
        "The 20/17 district-magistrate split is an inference from a page that does not draw it.",
        "Cooper, Thompson, Sheridan and McNulty were labelled inactive senior. Withdrawn pending docket evidence.",
        "Koons: the September 2025 panel opinion was vacated in December 2025; the en banc appeal is pending.",
    ],
}
# The manifest is wholly derived from this file, so rewriting it is safe.
if not CHECK_ONLY:
    with open(os.path.join(OUT, "..", "roster-manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        f.write("\n")

print(f"roster: {len(records)} records defined, {len(created)} created, {len(records) - len(created)} left untouched")
if created:
    for c in created:
        print(f"  + {c}")
if drift:
    print(f"\ndrift ({len(drift)}) — reconcile by hand, do not regenerate:")
    for d in drift:
        print(f"  ~ {d}")
print()
print(json.dumps(manifest["counts"], indent=2))
if CHECK_ONLY and drift:
    sys.exit(1)
