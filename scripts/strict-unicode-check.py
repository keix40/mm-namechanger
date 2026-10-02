#!/usr/bin/env python3
"""Independent strict Myanmar orthography check for dictionary.json (review tool)."""
import json
import re
import sys
import unicodedata as ud

path = sys.argv[1] if len(sys.argv) > 1 else "data/dictionary.json"
d = json.load(open(path, encoding="utf-8"))
CONS = set(chr(c) for c in range(0x1000, 0x1022))
INDEP = set("\u1023\u1024\u1025\u1026\u1027\u1029\u102A\u103F")
SYM = set(chr(c) for c in list(range(0x1040, 0x104A)) + list(range(0x104C, 0x1050)))
TALL_AA = set("ခဂငဒပဝ")
NAS = set("ငဉညနမ")
STOP = set("ကစတပ")


def rhymes():
    R = {
        "",
        "့",
        "ာ",
        "ား",
        "ါ",
        "ါး",
        "ိ",
        "ီ",
        "ီး",
        "ု",
        "ူ",
        "ူး",
        "ေ",
        "ေ့",
        "ေး",
        "ဲ",
        "ဲ့",
        "ော",
        "ော့",
        "ော်",
        "ေါ",
        "ေါ့",
        "ေါ်",
        "ို",
        "ို့",
        "ိုး",
        "ံ",
        "ံ့",
        "ုံ",
        "ုံ့",
        "ုံး",
        "ယ်",
        "ိုလ်",
        "ာဏ်",
        "ာန်",
    }

    def nas(pre, ns):
        for n in ns:
            R.update({pre + n + "်", pre + n + "့်", pre + n + "်း"})

    nas("", NAS)
    R.update(s + "်" for s in STOP)
    for v in ("ိ", "ု"):
        nas(v, "နမ")
        R.update({v + "တ်", v + "ပ်"})
    for v in ("ော", "ေါ", "ို"):
        nas(v, "င")
        R.add(v + "က်")
    return R


OK = rhymes()
Q = {"း", "ာ့", "ါ့", "ံး", "ယ့်", "ယ်း"}
MED = "\u103B?\u103C?\u103D?\u103E?"
ONS = re.compile(
    "^((?:[\u1000-\u1021]\u103A\u1039)?)([\u1000-\u1021])((?:\u1039[\u1000-\u1021])?)(" + MED + ")(.*)$"
)


def clusters(s):
    out = []
    i = 0
    n = len(s)
    while i < n:
        st = i
        if i + 2 < n and s[i] in CONS and s[i + 1] == "\u103A" and s[i + 2] == "\u1039":
            i += 3
        if i < n and (s[i] in CONS or s[i] in INDEP or s[i] in SYM):
            i += 1
        else:
            i += 1
        while i < n and not (s[i] in CONS or s[i] in INDEP or s[i] in SYM) or (i < n and i > 0 and s[i - 1] == "\u1039"):
            i += 1
        out.append(s[st:i])
    return out


def check(s):
    errs = []
    qs = []
    for ch in s:
        o = ord(ch)
        if not (0x1000 <= o <= 0x109F):
            errs.append(f"non-Myanmar char U+{o:04X}")
        elif 0x1060 <= o <= 0x1097:
            errs.append(f"Zawgyi/ext code point U+{o:04X}")
        elif o in (0x1022, 0x1028, 0x104A, 0x104B) or 0x1050 <= o <= 0x105F or 0x1098 <= o:
            errs.append(f"unexpected U+{o:04X}")
    if errs:
        return errs, qs
    if s != ud.normalize("NFC", s):
        qs.append("not NFC")
    for a, b in zip(s, s[1:]):
        if a == b and not ("\u1000" <= a <= "\u1021" or a in SYM):
            errs.append(f"double mark U+{ord(a):04X}")
    cl = clusters(s)
    syl = []
    for c in cl:
        if re.fullmatch("[\u1000-\u1021]\u1037?\u103A\u1038?", c) and syl and syl[-1][0] in CONS | {"ဦ"}:
            syl[-1] = syl[-1] + c
        elif re.fullmatch("[\u1037\u1038]", c) and syl:
            syl[-1] += c
        else:
            syl.append(c)
    for y in syl:
        b = y[0]
        if b in SYM:
            if len(y) > 1:
                errs.append(f"marks after digit/symbol: {y}")
            continue
        if b in INDEP:
            if y in ("ဥ", "ဦ", "ဦး", "ဥ\u102E", "ဥ\u102Eး", "ဣ", "ဤ", "ဧ", "ဩ", "ဪ"):
                if "\u102E" in y and y[0] == "ဥ":
                    qs.append(f"decomposed ဦ in {y}")
                continue
            errs.append(f"bad independent-vowel syllable {y!r}")
            continue
        if b not in CONS:
            errs.append(f"syllable starts with mark (vowel E before consonant / stray): {y!r}")
            continue
        m = ONS.match(y)
        if not m:
            errs.append(f"unparsable {y!r}")
            continue
        kin, base, stk, med, rh = m.groups()
        if "\u103B" in med and "\u103C" in med:
            errs.append(f"ya+ra medial {y}")
        if re.search("[\u103B-\u103E]", rh):
            errs.append(f"medial out of order/position in {y!r}")
        if "\u1039" in rh:
            errs.append(f"U+1039 misuse (Zawgyi asat?) in {y!r}")
        if rh in OK:
            pass
        elif rh in Q:
            qs.append(f"rare rhyme {rh!r} in {y}")
        elif re.fullmatch("(?:ို|[ိုေ])?[ာါ]?[\u1000-\u1021]\u1037?\u103A\u1038?", rh):
            qs.append(f"loan/Pali coda {rh!r} in {y}")
        else:
            errs.append(f"invalid vowel/final/tone tail {rh!r} in {y!r}")
        if not med and not kin and not stk:
            if rh.startswith("ါ") or rh.startswith("ေါ"):
                if base not in TALL_AA:
                    errs.append(f"tall aa after {base} in {y}")
            elif (rh.startswith("ာ") or rh.startswith("ော")) and base in TALL_AA:
                errs.append(f"short aa after {base} (expect ါ) in {y}")
    return errs, qs


bad = 0
tot = 0
qn = 0
for e in d["entries"]:
    for sp in e["spellings"]:
        tot += 1
        t = sp["text"]
        errs = []
        qs = []
        if t != t.strip() or "  " in t:
            errs.append("whitespace")
        for w in t.split(" "):
            a, b = check(w)
            errs += a
            qs += b
        if errs:
            bad += 1
            print("BAD", e["variants"][0], repr(t), errs)
        elif qs:
            qn += 1
            print("Q  ", e["variants"][0], t, qs)
print(f'entries={len(d["entries"])} spellings={tot} malformed={bad} questionable={qn}')
sys.exit(1 if bad else 0)
