#!/usr/bin/env python3
"""Fill in exact coordinates for every chapter card in impact.html.

Each `.chapter-card` carries a `data-address`. This script looks that address
up and writes the result into the card's `data-lat` / `data-lng`, plus a
`data-geocoded` attribute recording which address those coordinates came from.
A card is only looked up again when its address no longer matches
`data-geocoded`, so changing an address is the one edit needed to move a pin,
and unchanged cards cost nothing.

Lookups go to OpenStreetMap's Nominatim first (it knows building outlines, so
a school lands on the school), then the US Census geocoder as a fallback for
US addresses. Lookups are limited to the countries in COUNTRIES, where the
chapters are; add a country's ISO code there when one opens somewhere new.
Neither needs an API key. Nominatim asks for one request per second and an
identifying User-Agent, both honoured below.

Run by .github/workflows/geocode.yml; can also be run by hand from the repo
root with network access:  python3 scripts/geocode-chapters.py
Standard library only.
"""

import html
import json
import math
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

PAGE = "impact.html"
# ISO 3166-1 alpha-2 codes Nominatim may return results from. Restricting it is
# what stops "Hyderabad" resolving to the one in India, or "Vancouver" to the
# one in Washington.
COUNTRIES = "us,ca,pk"
# How far a match found by name may land from the chapter's town before it is
# treated as a namesake somewhere else and refused.
NEAR_KM = 60
USER_AGENT = "ABLE Initiatives website geocoder (https://ableinitiatives.com; ableinitiativespchs@gmail.com)"
CARD_RE = re.compile(r'<div class="chapter-card[^"]*"[^>]*>')
ATTR_RE = re.compile(r'([a-zA-Z-]+)="([^"]*)"')


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


# Nominatim result categories that mean "this exact place", as opposed to a
# street, a neighbourhood or a town. A school on the map is amenity/school; a
# matched house number is place/house; an outlined building is building/*.
PRECISE = {"amenity", "building", "leisure", "office", "shop", "tourism"}
PRECISE_TYPES = {"house", "school", "college", "university"}


def nominatim(query):
    """Returns (lat, lng, label, precise) for the best match, or None.

    The first precise result wins, since a school often ranks below its own
    street or neighbourhood; failing that, the top result is returned as
    imprecise.
    """
    params = urllib.parse.urlencode({"q": query, "format": "jsonv2", "limit": 5, "countrycodes": COUNTRIES})
    results = fetch_json("https://nominatim.openstreetmap.org/search?" + params)
    time.sleep(1.1)  # Nominatim's rate limit
    if not results:
        return None

    def is_precise(r):
        return r.get("category") in PRECISE or r.get("type") in PRECISE_TYPES

    r = next((r for r in results if is_precise(r)), results[0])
    return float(r["lat"]), float(r["lon"]), "OpenStreetMap: " + r.get("display_name", ""), is_precise(r)


def name_variants(name):
    """'Discovery Canyon Campus High School' -> itself, 'Discovery Canyon
    Campus', 'Discovery Canyon': the map often lists a school under its short
    name, with the level left off. 'Govt' and 'Government' are tried both
    ways, since OpenStreetMap uses either for Pakistani state schools."""
    bases = [name]
    for short, full in (("Govt ", "Government "), ("Govt. ", "Government ")):
        if name.startswith(short):
            bases.append(full + name[len(short):])
        elif name.startswith(full):
            bases.append(short + name[len(full):])
    variants = []
    for base in bases:
        trimmed = base
        if trimmed not in variants:
            variants.append(trimmed)
        for suffix in (" High School", " Middle School", " Elementary School", " School", " Campus", " Academy"):
            if trimmed.lower().endswith(suffix.lower()):
                trimmed = trimmed[: -len(suffix)].strip()
                if trimmed and trimmed not in variants:
                    variants.append(trimmed)
    return variants


INSTITUTION_WORDS = ("school", "academy", "college", "campus", "university", "institute")


def split_address(address, name):
    """(town, is_town_chapter) for a card's address.

    The first comma-separated part is either a street, the school's own name
    ("Rampart High School, Colorado Springs, CO") or, for a chapter that is a
    whole city, the city itself ("Denver, CO"). Everything after it is the
    town. A chapter whose name is its town — and isn't an institution — has
    nothing more precise to find than the town itself.
    """
    parts = [p.strip() for p in address.split(",")]
    town = ", ".join(parts[1:])
    is_town = (
        bool(name)
        and parts[0].lower() == name.lower()
        and not any(w in name.lower() for w in INSTITUTION_WORDS)
    )
    return town, is_town


def distance_km(a, b):
    """Great-circle distance between two (lat, lng, ...) tuples."""
    lat1, lng1, lat2, lng2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


def census(address):
    params = urllib.parse.urlencode({"address": address, "benchmark": "Public_AR_Current", "format": "json"})
    data = fetch_json("https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?" + params)
    matches = data.get("result", {}).get("addressMatches", [])
    if matches:
        c = matches[0]["coordinates"]
        return float(c["y"]), float(c["x"]), "US Census: " + matches[0].get("matchedAddress", ""), True
    return None


def attempt(fn):
    try:
        return fn()
    except (urllib.error.URLError, ValueError, KeyError) as err:
        print(f"    lookup error: {err}")
        return None


def geocode(address, name):
    """Best available match for a chapter, most precise first.

    1. The address on OpenStreetMap. Taken as final if it resolves to the
       building or a matched house number, or if the chapter is a whole town
       ("Denver, CO"), where the town is the answer.
    2. Otherwise the chapter name — and its shorter forms — in the same town,
       which finds the school itself when the address only resolved to its
       street, or didn't match because OpenStreetMap spells the name
       differently ("Stargate" for "Stargate High School").
    3. The chapter name alone, for a school listed under a different town
       than the one people write (a campus on a base, say).
    4. The Census geocoder, which matches US house numbers along a street.
    5. Whatever step 1 produced, or failing that the town itself, as a last
       resort. Both are reported as street/town level.

    Steps 2 and 3 are matches by name, and a name can belong to more than one
    school — "Allama Iqbal" is one of the most common school names in
    Pakistan. So a name match is accepted only if it lands within NEAR_KM of
    the chapter's town; one further away is a namesake, and is refused rather
    than pinned in the wrong city.
    """
    town, is_town = split_address(address, name)
    by_address = attempt(lambda: nominatim(address))
    if by_address and (by_address[3] or is_town):
        return by_address

    anchor = attempt(lambda: nominatim(town)) if town else None

    def near(hit):
        if not hit or not hit[3]:
            return False
        if anchor is None:
            return True
        km = distance_km(hit, anchor)
        if km > NEAR_KM:
            print(f"    refused {hit[2]!r}: {km:.0f} km from {town}")
            return False
        return True

    if name and town:
        for variant in name_variants(name):
            query = f"{variant}, {town}"
            if query.lower() == address.lower():
                continue  # step 1 already asked exactly this
            by_name = attempt(lambda: nominatim(query))
            if near(by_name):
                return by_name

    if name:
        by_bare_name = attempt(lambda: nominatim(name))
        if near(by_bare_name):
            return by_bare_name

    by_census = attempt(lambda: census(address))
    if by_census:
        return by_census

    if by_address:
        return by_address
    if anchor:
        return anchor[0], anchor[1], anchor[2], False
    return None


def set_attr(tag, key, value):
    value = html.escape(value, quote=True)
    if re.search(rf'\s{key}="[^"]*"', tag):
        return re.sub(rf'(\s{key}=")[^"]*(")', rf"\g<1>{value}\g<2>", tag, count=1)
    return tag[:-1] + f' {key}="{value}">'


def main():
    src = open(PAGE, encoding="utf-8").read()
    out = src
    failures = []
    updated = 0

    for m in CARD_RE.finditer(src):
        tag = m.group(0)
        attrs = {k: html.unescape(v) for k, v in ATTR_RE.findall(tag)}
        address = attrs.get("data-address", "").strip()
        if not address:
            continue
        # The chapter name is the next .chapter-name after the tag.
        name_m = re.search(r'<div class="chapter-name">([^<]*)</div>', src[m.end():])
        name = html.unescape(name_m.group(1)).strip() if name_m else ""

        current = attrs.get("data-geocoded", "")
        if current == address and attrs.get("data-lat") and attrs.get("data-lng"):
            print(f"  {name}: up to date")
            continue

        print(f"  {name}: looking up \"{address}\"")
        hit = geocode(address, name)
        if not hit:
            failures.append(f"{name} ({address})")
            print("    no match")
            continue
        lat, lng, source, precise = hit
        print(f"    -> {lat:.5f}, {lng:.5f}  [{source}]" + ("" if precise else "  (street/town level)"))
        new_tag = set_attr(tag, "data-lat", f"{lat:.5f}")
        new_tag = set_attr(new_tag, "data-lng", f"{lng:.5f}")
        new_tag = set_attr(new_tag, "data-geocoded", address)
        out = out.replace(tag, new_tag, 1)
        updated += 1

    if out != src:
        open(PAGE, "w", encoding="utf-8").write(out)
    print(f"\n{updated} card(s) updated, {len(failures)} failed.")
    if failures:
        print("Could not geocode:\n  " + "\n  ".join(failures))
        print("Check the address spelling, or set data-lat / data-lng by hand and data-geocoded to the address.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
