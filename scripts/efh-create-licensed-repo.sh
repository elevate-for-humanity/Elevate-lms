#!/usr/bin/env bash
set -euo pipefail

# EFH Licensed Repo Creator (with branding + fingerprint + checklist)
#
# Usage:
#   scripts/efh-create-licensed-repo.sh "Region 5 Workforce Board" "EFH-2025-CLIENT-007" \
#     --org elevateforhumanity \
#     --repo-prefix efh \
#     --license-type single-org \
#     --domains localhost,region5workforce.org \
#     --app-name "Region 5 Workforce Hub" \
#     --primary-color "#FF6B2C" \
#     --logo-path branding-assets/region5-logo.png
#
# Optional flags:
#   --org <github_org>           (default: elevateforhumanity)
#   --repo-prefix <prefix>       (default: efh)
#   --license-type <type>        (single-org|white-label|acquisition; default: single-org)
#   --domains <csv>              (default: localhost)
#   --branch <branch>            (default: main)
#   --private / --public         (default: --private)
#   --app-name <name>            (branding for this client)
#   --primary-color <hex>        (branding accent color)
#   --logo-path <relative_path>  (relative to current repo; copied into public/branding/logo.png)
#   --dry-run                    (no GitHub create/push, just prepares temp folder)

CLIENT_NAME="${1:-}"; shift || true
LICENSE_ID="${1:-}";  shift || true

if [[ -z "${CLIENT_NAME}" || -z "${LICENSE_ID}" ]]; then
  echo "Usage: $0 \"Client Name\" \"EFH-YYYY-CLIENT-###\" [flags]"
  exit 1
fi

# Defaults
GITHUB_ORG="elevateforhumanity"
REPO_PREFIX="efh"
LICENSE_TYPE="single-org"
DOMAINS_CSV="localhost"
TARGET_BRANCH="main"
VISIBILITY="--private"
DRY_RUN="false"
APP_NAME=""
PRIMARY_COLOR=""
LOGO_PATH=""

# Parse flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --org)           GITHUB_ORG="$2"; shift 2 ;;
    --repo-prefix)   REPO_PREFIX="$2"; shift 2 ;;
    --license-type)  LICENSE_TYPE="$2"; shift 2 ;;
    --domains)       DOMAINS_CSV="$2"; shift 2 ;;
    --branch)        TARGET_BRANCH="$2"; shift 2 ;;
    --private)       VISIBILITY="--private"; shift ;;
    --public)        VISIBILITY="--public"; shift ;;
    --app-name)      APP_NAME="$2"; shift 2 ;;
    --primary-color) PRIMARY_COLOR="$2"; shift 2 ;;
    --logo-path)     LOGO_PATH="$2"; shift 2 ;;
    --dry-run)       DRY_RUN="true"; shift ;;
    *) echo "Unknown flag: $1"; exit 1 ;;
  esac
done

# Slugify client name for repo suffix
slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g;s/^-+|-+$//g'
}
CLIENT_SLUG="$(slugify "${CLIENT_NAME}")"
NEW_REPO_NAME="${REPO_PREFIX}-${CLIENT_SLUG}-platform"

echo "▶ Creating licensed repo"
echo "   Org:        ${GITHUB_ORG}"
echo "   Repo Name:  ${NEW_REPO_NAME}"
echo "   Branch:     ${TARGET_BRANCH}"
echo "   Client:     ${CLIENT_NAME}"
echo "   License ID: ${LICENSE_ID}"
echo "   Type:       ${LICENSE_TYPE}"
echo "   Domains:    ${DOMAINS_CSV}"
echo "   Visibility: ${VISIBILITY#--}"
echo "   Dry Run:    ${DRY_RUN}"
[[ -n "${APP_NAME}" ]]      && echo "   App Name:   ${APP_NAME}"
[[ -n "${PRIMARY_COLOR}" ]] && echo "   Primary:    ${PRIMARY_COLOR}"
[[ -n "${LOGO_PATH}" ]]     && echo "   Logo Path:  ${LOGO_PATH}"

# Ensure we are in a git repo
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "Not inside a git repo."; exit 1; }

WORKDIR="$(pwd)"

# Make a clean temp copy of current repo HEAD
TMPDIR="$(mktemp -d)"
echo "→ Staging temp copy at: ${TMPDIR}"
git archive --format=tar HEAD | tar -x -C "${TMPDIR}"

cd "${TMPDIR}"

# Ensure config dir exists
mkdir -p config

# Build validDomains JSON array from CSV
IFS=',' read -ra DOMAINS_ARR <<< "${DOMAINS_CSV}"
VD_JSON=$(printf '"%s",' "${DOMAINS_ARR[@]}")
VD_JSON="[${VD_JSON%,}]"

# Write license.json
cat > config/license.json <<JSON
{
  "licenseHolder": "${CLIENT_NAME}",
  "licenseId": "${LICENSE_ID}",
  "licenseType": "${LICENSE_TYPE}",
  "issuedAt": "$(date +%Y-%m-%d)",
  "validDomains": ${VD_JSON},
  "status": "active"
}
JSON

# Ensure lib exists and update fingerprint if present
mkdir -p lib
if [[ -f "lib/license.ts" ]]; then
  # Replace EFH_LICENSE_FINGERPRINT constant if found
  if grep -q "EFH_LICENSE_FINGERPRINT" lib/license.ts; then
    sed -i.bak -E "s|(EFH_LICENSE_FINGERPRINT\\s*=\\s*\").*(\";)|\\1${LICENSE_ID}\\2|g" lib/license.ts || true
    rm -f lib/license.ts.bak
  fi
fi

# Add extra subtle fingerprints in common files if present
fingerprint_comment="// EFH LICENSE FINGERPRINT: ${LICENSE_ID}"
for f in app/layout.tsx next.config.js lib/utils.ts app/page.tsx; do
  [[ -f "$f" ]] && echo -e "\n${fingerprint_comment}" >> "$f"
done

# Optional branding config
if [[ -n "${APP_NAME}" || -n "${PRIMARY_COLOR}" ]]; then
  mkdir -p config
  if [[ -f "config/branding.json" ]]; then
    # Update existing branding.json via node (safe JSON edit)
    node <<JS
const fs = require("fs");
const path = "config/branding.json";
let data = {};
try { data = JSON.parse(fs.readFileSync(path, "utf8")); } catch (e) {}
if ("${APP_NAME}") data.appName = "${APP_NAME}";
if ("${PRIMARY_COLOR}") data.primaryColor = "${PRIMARY_COLOR}";
fs.writeFileSync(path, JSON.stringify(data, null, 2));
JS
  else
    # Create a simple branding file
    cat > config/branding.json <<BJSON
{
  "appName": "${APP_NAME:-Elevate Workforce Platform}",
  "primaryColor": "${PRIMARY_COLOR:-#FF6B2C}"
}
BJSON
  fi
fi

# Optional logo copy
if [[ -n "${LOGO_PATH}" ]]; then
  SRC_LOGO="${WORKDIR}/${LOGO_PATH}"
  if [[ -f "${SRC_LOGO}" ]]; then
    mkdir -p public/branding
    cp "${SRC_LOGO}" public/branding/logo.png
    echo "→ Copied logo to public/branding/logo.png"
  else
    echo "⚠️ Logo file not found at ${SRC_LOGO} (skipping logo copy)"
  fi
fi

# Initialize new repo and push
git init -b "${TARGET_BRANCH}"
git add .
git commit -m "Initialize licensed repo for ${CLIENT_NAME} (${LICENSE_ID})"

if [[ "${DRY_RUN}" == "true" ]]; then
  echo "✓ Dry run complete. Repo not created on GitHub."
  echo "   Temp folder with ready repo: ${TMPDIR}"
  echo
  echo "Next steps (manual, since this was dry run):"
  echo "  - Inspect files in: ${TMPDIR}"
  echo "  - Create private repo on GitHub"
  echo "  - Add remote + push"
  exit 0
fi

# Create GitHub repo and push
gh repo create "${GITHUB_ORG}/${NEW_REPO_NAME}" ${VISIBILITY} --source=. --remote=origin --push

echo
echo "✓ Licensed repo created:"
echo "  https://github.com/${GITHUB_ORG}/${NEW_REPO_NAME}"
echo
echo "🔎 Quick checklist for ${CLIENT_NAME}:"
echo "  1) Add environment variables in hosting (Supabase, Stripe, email, etc.)."
echo "  2) Configure DNS so one of these domains points to the app:"
echo "     - ${DOMAINS_CSV}"
echo "  3) Run migrations / verify Supabase tables match."
echo "  4) Open /admin/license in the deployed app to confirm license info."
echo "  5) Test key flows: login, programs, enrollment, admin screens."
echo "  6) Update config/branding.json or public/branding/logo.png if further branding is needed."
