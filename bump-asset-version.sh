#!/usr/bin/env sh
# Bump the cache-busting query string on every first-party CSS/JS file in every page.
#
# GitHub Pages serves the CSS and JS with max-age=600, so after a change to
# either file a visitor can hold the new HTML with a cached older asset for up
# to ten minutes. Bumping the version forces a fresh fetch. Every page pins the
# same number, and there is no templating, so this is the one place to do it.
#
# Usage: ./bump-asset-version.sh        (increments the current number)
#        ./bump-asset-version.sh 12     (sets it to 12)
set -eu
cd "$(dirname "$0")"

current=$(grep -o 'style\.css?v=[0-9]*' index.html | head -1 | sed 's/.*v=//')
if [ -z "$current" ]; then
  echo "could not find a style.css?v= version in index.html" >&2
  exit 1
fi
next=${1:-$((current + 1))}

for f in *.html; do
  # Every first-party stylesheet and script under assets/css and assets/js.
  # Vendored libraries carry their version in the directory name instead.
  sed -i -E "s|(assets/(css\|js)/[A-Za-z0-9_-]+\.(css\|js))\?v=[0-9]+|\1?v=$next|g" "$f"
done

echo "v$current -> v$next"
printf '  style.css refs: %s\n' "$(grep -l "style.css?v=$next" *.html | wc -l)"
printf '  main.js refs:   %s\n' "$(grep -l "main.js?v=$next" *.html | wc -l)"
other=$(grep -oh "assets/js/[A-Za-z0-9_-]*\.js?v=$next" *.html | grep -v main.js | sort | uniq -c | sed 's/^ *//' || true)
[ -n "$other" ] && printf '  other:          %s\n' "$other"
