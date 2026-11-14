#!/usr/bin/env bash
set -euo pipefail

DRY="${1:-}"
ROOT="$(pwd)"

echo "🔧 zinc: swapping headers/footers to single components…"
echo "root: $ROOT"
[ -f package.json ] || { echo "❌ run from project root (no package.json)"; exit 1; }

# files to scan
FILES=$(find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) 2>/dev/null || true)

if [ -z "$FILES" ]; then
  echo "⚠️  No source files found in src/"
  exit 0
fi

changed=0
backups=0

do_sed() {
  # portable in-place sed (creates .bak backups)
  local pattern="$1"
  local repl="$2"
  local file="$3"
  if [ -n "$DRY" ]; then
    # show a unified diff preview
    if grep -qE "$pattern" "$file" 2>/dev/null; then
      echo "— would change: $file"
      sed "s/$pattern/$repl/g" "$file" | diff -u "$file" - 2>/dev/null || true
    fi
  else
    # macOS/BSD and GNU compatible in-place edit
    if grep -qE "$pattern" "$file" 2>/dev/null; then
      sed -i.bak "s/$pattern/$repl/g" "$file" && backups=$((backups+1)) || true
    fi
  fi
}

for f in $FILES; do
  before="$(sha256sum "$f" 2>/dev/null | awk '{print $1}' || shasum -a 256 "$f" 2>/dev/null | awk '{print $1}' || echo "none")"

  # --- IMPORTS: headers → NavigationZinc --------------------------------------
  do_sed 'import[[:space:]]\+\{[[:space:]]*NavBar[[:space:]]*\}[[:space:]]\+from[[:space:]]\+["\x27][.][.]/components/NavBar[.]\(jsx\|tsx\)["\x27]' 'import NavigationZinc from "../components/NavigationZinc"' "$f"
  do_sed 'import[[:space:]]\+NavBar[[:space:]]\+from[[:space:]]\+["\x27][.][.]/components/NavBar[.]\(jsx\|tsx\)["\x27]' 'import NavigationZinc from "../components/NavigationZinc"' "$f"
  do_sed 'import[[:space:]]\+Header[[:space:]]\+from[[:space:]]\+["\x27][.][.]/components/Header[.]\(jsx\|tsx\)["\x27]' 'import NavigationZinc from "../components/NavigationZinc"' "$f"
  do_sed 'import[[:space:]]\+DurableNav[[:space:]]\+from[[:space:]]\+["\x27][.][.]/components/DurableNav[.]\(jsx\|tsx\)["\x27]' 'import NavigationZinc from "../components/NavigationZinc"' "$f"

  # --- IMPORTS: footers → FooterZinc ------------------------------------------
  do_sed 'import[[:space:]]\+Footer[[:space:]]\+from[[:space:]]\+["\x27][.][.]/components/Footer[.]\(jsx\|tsx\)["\x27]' 'import FooterZinc from "../components/FooterZinc"' "$f"
  do_sed 'import[[:space:]]\+DurableFooter[[:space:]]\+from[[:space:]]\+["\x27][.][.]/components/DurableFooter[.]\(jsx\|tsx\)["\x27]' 'import FooterZinc from "../components/FooterZinc"' "$f"

  # --- JSX tags: headers → <NavigationZinc /> ----------------------------------
  do_sed '<NavBar[[:space:]]*\/>' '<NavigationZinc />' "$f"
  do_sed '<NavBar>' '<NavigationZinc>' "$f"
  do_sed '</NavBar>' '</NavigationZinc>' "$f"
  do_sed '<Header[[:space:]]*\/>' '<NavigationZinc />' "$f"
  do_sed '<Header>' '<NavigationZinc>' "$f"
  do_sed '</Header>' '</NavigationZinc>' "$f"
  do_sed '<DurableNav[[:space:]]*\/>' '<NavigationZinc />' "$f"
  do_sed '<DurableNav>' '<NavigationZinc>' "$f"
  do_sed '</DurableNav>' '</NavigationZinc>' "$f"

  # --- JSX tags: footers → <FooterZinc /> --------------------------------------
  do_sed '<DurableFooter[[:space:]]*\/>' '<FooterZinc />' "$f"
  do_sed '<DurableFooter>' '<FooterZinc>' "$f"
  do_sed '</DurableFooter>' '</FooterZinc>' "$f"

  after="$(sha256sum "$f" 2>/dev/null | awk '{print $1}' || shasum -a 256 "$f" 2>/dev/null | awk '{print $1}' || echo "none")"
  if [ "$before" != "$after" ]; then
    echo "✔ changed: $f"
    changed=$((changed+1))
  fi
done

if [ -z "$DRY" ]; then
  # remove identical .bak backups produced by sed (some files may not change content)
  for b in $(find src -type f -name "*.bak" 2>/dev/null || true); do
    if cmp -s "${b%.bak}" "$b" 2>/dev/null; then 
      rm -f "$b"
    else 
      echo "↩ backup: $b"
    fi
  done
fi

echo "— summary —"
echo "files changed: $changed"
[ -n "$DRY" ] && echo "(dry run, no files modified)"
echo "✅ done."
