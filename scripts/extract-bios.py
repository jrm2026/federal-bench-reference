#!/usr/bin/env python3
"""Extract biographies from the 3 September 2026 DNJ research report into the
judge records in the Astro content collection.

Captures the biography prose, education, other writings, and the verification
source links. Sets a confidence flag where the report itself flags thin or
conflicting sourcing — the report's own cautions become the page's cautions.
"""
import json, re, os, glob, unicodedata
from docx import Document
from docx.oxml.ns import qn

SRC = "/mnt/project/District_of_New_Jersey_Judges_Research_Report_2026-09-03__2_.docx"
JUDGES = "/home/claude/fbr/src/content/districts/dnj/judges"

# The report flags these itself; carry the caution onto the page.
CONFIDENCE = {
    "elizabeth-a-pascal": ("partial",
        "The reviewed official sources do not provide a full career resume. The "
        "pre-bench details above come from public professional directories and are "
        "not confirmed by an official source."),
    "james-b-clark-iii": ("conflicted",
        "Public secondary sources conflict on law school: one identifies St. John's "
        "University School of Law, another Seton Hall. Both are recorded; neither is "
        "adopted until an official resume resolves it."),
    "tonianne-j-bongiovanni": ("partial",
        "Publicly accessible sources reviewed provide limited detail about pre-bench "
        "practice. No inference is drawn."),
    "jose-r-almonte": ("partial",
        "Graduation years were not stated in the reviewed official sources."),
    "rukhsanah-l-singh": ("partial",
        "Graduation years were not stated in the reviewed official sources."),
    "andre-m-espinosa": ("partial",
        "Graduation years were not stated in the reviewed official sources."),
}

EDU = re.compile(
    r"(B\.A\.|B\.S\.|B\.S\.E\.E\.|A\.B\.|J\.D\.|LL\.B\.|M\.A\.|M\.S\.W\.|M\.P\.A\.)")


def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^\w\s-]", "", s).strip().lower()
    return re.sub(r"[\s_]+", "-", s)


# Sentences addressed to the site builder, not facts about the judge.
META = re.compile(
    r"(a website should|the website should|should be rechecked before publication|"
    r"this report does not infer|the report does not infer|so these secondary details|"
    r"until an official r.sum. resolves|sources conflict on)", re.I)


ABBR = ["St.", "U.S.", "Mr.", "Ms.", "Mrs.", "Dr.", "Jr.", "Sr.", "Co.", "Inc.",
        "Corp.", "Ltd.", "Bros.", "Prof.", "Gov.", "Rep.", "Sen.", "Hon.", "No.",
        "Nos.", "v.", "Ass'n", "Univ.", "Dept.", "D.C.", "N.J.", "N.Y.", "L.L.B.",
        "A.B.", "B.A.", "B.S.", "M.A.", "M.S.", "J.D.", "LL.B.", "LL.M.", "Ph.D.",
        "M.P.A.", "M.S.W.", "B.S.E.E.", "Jr.,", "III.", "et al."]


def sentences(text):
    """Split on sentence boundaries without breaking on common abbreviations."""
    t = text
    for i, a in enumerate(ABBR):
        t = t.replace(a, f"\x00{i}\x00")
    parts = re.split(r"(?<=[.?!])\s+", t)
    out = []
    for p in parts:
        for i, a in enumerate(ABBR):
            p = p.replace(f"\x00{i}\x00", a)
        out.append(p)
    return out


def scrub(text):
    """Drop the report's editorial instructions from published biography prose."""
    keep = [s for s in sentences(text) if not META.search(s)]
    return re.sub(r"\s+", " ", " ".join(keep)).strip()


def para_text_links(p, rels):
    parts, links = [], []
    for ch in p._p.iterchildren():
        if ch.tag == qn("w:hyperlink"):
            rid = ch.get(qn("r:id"))
            a = "".join(n.text or "" for n in ch.iter(qn("w:t")))
            u = rels[rid].target_ref if rid in rels else None
            if u:
                links.append({"label": a.strip(), "url": u})
            parts.append(a)
        elif ch.tag == qn("w:r"):
            parts.append("".join(n.text or "" for n in ch.iter(qn("w:t"))))
    return re.sub(r"\s+", " ", "".join(parts)).strip(), links


def main():
    raw = open(SRC, encoding="utf-8").read()
    blocks = re.split(r"^## ", raw, flags=re.M)[1:]
    bios = {}
    for b in blocks:
        name = b.split("\n", 1)[0].strip()
        if "### Biography" not in b:
            continue
        slug = slugify(name)
        role = None
        m = re.search(r"^\s*(.+\|.+\|.+)$", b.split("### Biography")[0], flags=re.M)
        if m:
            role = re.sub(r"\s+", " ", m.group(1)).strip()
        bio = b.split("### Biography", 1)[1]
        bio = re.split(r"### ", bio)[0].strip()
        bio = re.sub(r"\s+", " ", bio)

        writings = []
        wm = re.search(r"### Other writings(.*?)(?=\n\*\*Verification sources|\Z)", b, re.S)
        if wm:
            w = re.sub(r"\s+", " ", wm.group(1)).strip()
            if w and not w.lower().startswith("no separately authored"):
                url = re.search(r"\]\((https?://[^)]+)\)", w)
                writings.append({"text": re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", w).strip(),
                                 "url": url.group(1) if url else None})

        srcs = []
        sm = re.search(r"\*\*Verification sources[^\n]*", b)
        if sm:
            for lbl, url in re.findall(r"\[([^\]]+)\]\((https?://[^)]+)\)", sm.group(0)):
                srcs.append({"label": lbl, "url": url})
        bios[slug] = {"bio": bio, "writings": writings, "sources": srcs, "role_line": role}

    matched, missing_bio = 0, []
    roster = {os.path.basename(f)[:-5] for f in glob.glob(f"{JUDGES}/*.json")}
    for fp in sorted(glob.glob(f"{JUDGES}/*.json")):
        rec = json.load(open(fp))
        b = bios.get(rec["slug"])
        if not b or not b["bio"]:
            missing_bio.append(rec["slug"])
            continue
        prose = scrub(b["bio"])
        edu = [s.strip() for s in sentences(prose)
               if EDU.search(s) and re.search(r"\bfrom\b|\bat\b|\(\d{4}\)", s)]
        conf, note = CONFIDENCE.get(rec["slug"], ("verified", None))
        rec["biography"] = {
            "text": prose,
            "education_sentences": edu[:2],
            "confidence": conf,
            "source_note": note,
            "sources": [s["url"] for s in b["sources"]],
            "source_labels": [s["label"] for s in b["sources"]],
            "last_verified": "2026-09-03",
        }
        rec["other_writings"] = b["writings"]
        if b["role_line"]:
            rec["role_line"] = b["role_line"]
        json.dump(rec, open(fp, "w"), indent=2, ensure_ascii=False)
        matched += 1

    print(f"report profiles parsed  : {len(bios)}")
    print(f"biographies written     : {matched} of {len(roster)} judges")
    if missing_bio:
        print(f"no biography found      : {len(missing_bio)}")
        for x in missing_bio:
            print("   -", x)
    extra = sorted(set(bios) - roster)
    if extra:
        print(f"in report, not on roster: {extra}")
    conf = {}
    for fp in glob.glob(f"{JUDGES}/*.json"):
        r = json.load(open(fp))
        c = (r.get("biography") or {}).get("confidence")
        conf[c] = conf.get(c, 0) + 1
    print("confidence:", conf)
    wr = [json.load(open(fp))["name"] for fp in glob.glob(f"{JUDGES}/*.json")
          if json.load(open(fp)).get("other_writings")]
    print(f"judges with authored writings: {len(wr)} -> {sorted(wr)}")


if __name__ == "__main__":
    main()
