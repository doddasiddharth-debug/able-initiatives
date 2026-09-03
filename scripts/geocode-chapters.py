#!/usr/bin/env python3
"""Fill in exact coordinates for every chapter card in impact.html.

Each `.chapter-card` carries a `data-address`. This script looks that address
up and writes the result into the card's `data-lat` / `data-lng`, plus a
`data-geocoded` attribute recording which address those coordinates came from.
A card is only looked up again when its address no longer matches
`data-geocoded`, so changing an address is the one edit needed to move a pin,
and unchanged cards cost nothing.

Lookups go to OpenStreetMap's Nominatim first (it knows building outlines, so
a school lands on the school), then the US Census geocoder as a fallback.
Neither needs an API key. Nominatim asks for one request per second and an
identifying User-Agent, both honoured below.

Run by .github/workflows/geocode.yml; can also be run by hand from the repo
root with network access:  python3 scripts/geocode-chapters.py
Standard library only.
"""

import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

PAGE = "impact.html"
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
    """Returns (lat, lng, label, precise) for the best match, or None."""
    params = urllib.parse.urlencode({"q": query, "format": "jsonv2", "limit": 1, "countrycodes": "us"})
    results = fetch_json("https://nominatim.openstreetmap.org/search?" + params)
    time.sleep(1.1)  # Nominatim's rate limit
    if not results:
        return None
    r = results[0]
    precise = r.get("category") in PRECISE or r.get("type") in PRECISE_TYPES
    return float(r["lat"]), float(r["lon"]), "OpenStreetMap: " + r.get("display_name", ""), precise


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
       building or a matched house number.
    2. Otherwise the chapter name in the same town, which finds the school
       itself when the address only resolved to its street.
    3. The Census geocoder, which matches house numbers along a street.
    4. Whatever street- or town-level match step 1 produced, as a last resort.
    """
    by_address = attempt(lambda: nominatim(address))
    if by_address and by_address[3]:
        return by_address

    town = ", ".join(address.split(",")[1:]).strip()
    if name and town and name.lower() not in address.lower():
        by_name = attempt(lambda: nominatim(f"{name}, {town}"))
        if by_name and by_name[3]:
            return by_name

    by_census = attempt(lambda: census(address))
    if by_census:
        return by_census

    return by_address


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
