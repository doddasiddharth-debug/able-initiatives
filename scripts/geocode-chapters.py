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


def nominatim(query):
    params = urllib.parse.urlencode({"q": query, "format": "jsonv2", "limit": 1, "countrycodes": "us"})
    results = fetch_json("https://nominatim.openstreetmap.org/search?" + params)
    if results:
        return float(results[0]["lat"]), float(results[0]["lon"]), "OpenStreetMap: " + results[0].get("display_name", "")
    return None


def census(address):
    params = urllib.parse.urlencode({"address": address, "benchmark": "Public_AR_Current", "format": "json"})
    data = fetch_json("https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?" + params)
    matches = data.get("result", {}).get("addressMatches", [])
    if matches:
        c = matches[0]["coordinates"]
        return float(c["y"]), float(c["x"]), "US Census: " + matches[0].get("matchedAddress", "")
    return None


def geocode(address, name):
    """Try the address, then the chapter name in the same town, then Census."""
    attempts = [lambda: nominatim(address)]
    town = ", ".join(address.split(",")[1:]).strip()
    if name and town and name.lower() not in address.lower():
        attempts.append(lambda: nominatim(f"{name}, {town}"))
    attempts.append(lambda: census(address))
    for attempt in attempts:
        try:
            hit = attempt()
        except (urllib.error.URLError, ValueError, KeyError) as err:
            print(f"    lookup error: {err}")
            hit = None
        time.sleep(1.1)  # Nominatim's rate limit
        if hit:
            return hit
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
        lat, lng, source = hit
        print(f"    -> {lat:.5f}, {lng:.5f}  [{source}]")
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
