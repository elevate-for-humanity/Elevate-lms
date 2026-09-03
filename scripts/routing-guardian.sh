#!/usr/bin/env bash
set -euo pipefail

# Elevate Autopilot: Dynamic Routing Guardian
# Compatible with Node 20, ESM modules, and existing build system

echo "== Elevate Autopilot: Dynamic Routing Guardian =="

ROOT="$(pwd)"
ROUTES="$ROOT/routes.config.mjs"
APP_FILE="$ROOT/src/App.jsx"
LOG_DIR="$ROOT/.data/routing"
LOG="$LOG_DIR/guardian.log"

mkdir -p "$LOG_DIR"

timestamp() { date +"%Y-%m-%d %H:%M:%S"; }
log() { echo "[$(timestamp)] $*" | tee -a "$LOG"; }

# -------------------------------------------------------------------
# 1. Check runtime compatibility
# -------------------------------------------------------------------
log "Checking Node.js environment..."

NODE_VERSION=$(node -v)
REQUIRED_VERSION="v20"

if [[ ! "$NODE_VERSION" =~ ^v20\. ]]; then
  log "⚠️  Node version mismatch: $NODE_VERSION (required: $REQUIRED_VERSION)"
  log "Current Node version is acceptable but package.json specifies 20.11.1"
else
  log "✅ Node version: $NODE_VERSION"
fi

# Check package manager
if [[ -f "pnpm-lock.yaml" ]]; then
  PKG_MGR="pnpm"
  log "✅ Package manager: pnpm"
elif [[ -f "package-lock.json" ]]; then
  PKG_MGR="npm"
  log "✅ Package manager: npm"
elif [[ -f "yarn.lock" ]]; then
  PKG_MGR="yarn"
  log "✅ Package manager: yarn"
else
  PKG_MGR="npm"
  log "⚠️  No lockfile found, defaulting to npm"
fi

# Check for lockfile conflicts
LOCKFILE_COUNT=$(ls -1 package-lock.json yarn.lock pnpm-lock.yaml 2>/dev/null | wc -l)
if [[ $LOCKFILE_COUNT -gt 1 ]]; then
  log "⚠️  Multiple lockfiles detected, keeping $PKG_MGR"
  case $PKG_MGR in
    pnpm) rm -f package-lock.json yarn.lock ;;
    npm) rm -f yarn.lock pnpm-lock.yaml ;;
    yarn) rm -f package-lock.json pnpm-lock.yaml ;;
  esac
fi

# -------------------------------------------------------------------
# 2. Scan for dynamic pages
# -------------------------------------------------------------------
log "Scanning src/pages for React components..."

PAGES_DIR="$ROOT/src/pages"
if [[ ! -d "$PAGES_DIR" ]]; then
  log "❌ src/pages directory not found"
  exit 1
fi

# Find all JSX/TSX files
mapfile -t PAGE_FILES < <(find "$PAGES_DIR" -type f \( -name "*.jsx" -o -name "*.tsx" \) | sort)

log "Found ${#PAGE_FILES[@]} page components"

# Extract component names and routes
declare -A COMPONENTS
declare -A ROUTES_MAP

for file in "${PAGE_FILES[@]}"; do
  # Get component name from filename
  basename=$(basename "$file" .jsx)
  basename=$(basename "$basename" .tsx)
  
  # Convert to route path
  if [[ "$basename" == "HomePage" || "$basename" == "Home" ]]; then
    route="/"
  else
    # Convert PascalCase to kebab-case
    route=$(echo "$basename" | sed 's/\([A-Z]\)/-\1/g' | sed 's/^-//' | tr '[:upper:]' '[:lower:]')
    route="/$route"
  fi
  
  COMPONENTS["$basename"]="$file"
  ROUTES_MAP["$basename"]="$route"
  
  log "  - $basename → $route"
done

# -------------------------------------------------------------------
# 3. Verify routes in App.jsx
# -------------------------------------------------------------------
log "Checking routes in App.jsx..."

MISSING_ROUTES=()
MISSING_IMPORTS=()

for component in "${!COMPONENTS[@]}"; do
  file="${COMPONENTS[$component]}"
  route="${ROUTES_MAP[$component]}"
  
  # Check if component is imported
  if ! grep -q "import.*$component" "$APP_FILE"; then
    MISSING_IMPORTS+=("$component")
    log "  ⚠️  Missing import: $component"
  fi
  
  # Check if route exists (look for Route element with path)
  if ! grep -q "<Route.*path=\"$route\"" "$APP_FILE" && [[ "$route" != "/" ]]; then
    MISSING_ROUTES+=("$route")
    log "  ⚠️  Missing route: $route"
  fi
done

if [[ ${#MISSING_IMPORTS[@]} -eq 0 && ${#MISSING_ROUTES[@]} -eq 0 ]]; then
  log "✅ All components imported and routed"
else
  log "⚠️  Found ${#MISSING_IMPORTS[@]} missing imports and ${#MISSING_ROUTES[@]} missing routes"
fi

# -------------------------------------------------------------------
# 4. Update routes.config.mjs
# -------------------------------------------------------------------
log "Updating routes.config.mjs..."

# Backup existing file
if [[ -f "$ROUTES" ]]; then
  cp "$ROUTES" "$ROUTES.bak.$(date +%s)"
fi

# Read existing routes
EXISTING_ROUTES=()
if [[ -f "$ROUTES" ]]; then
  while IFS= read -r line; do
    if [[ "$line" =~ \'([^\']+)\' ]]; then
      EXISTING_ROUTES+=("${BASH_REMATCH[1]}")
    fi
  done < "$ROUTES"
fi

# Add page routes
NEW_ROUTES=()
for route in "${ROUTES_MAP[@]}"; do
  # Check if route already exists
  found=false
  for existing in "${EXISTING_ROUTES[@]}"; do
    if [[ "$existing" == "$route" ]]; then
      found=true
      break
    fi
  done
  
  if [[ "$found" == false ]]; then
    NEW_ROUTES+=("$route")
    log "  + Adding route: $route"
  fi
done

# Write updated routes.config.mjs
if [[ ${#NEW_ROUTES[@]} -gt 0 ]]; then
  {
    echo "export const routes = ["
    
    # Add existing routes
    for route in "${EXISTING_ROUTES[@]}"; do
      echo "  '$route',"
    done
    
    # Add new routes
    for route in "${NEW_ROUTES[@]}"; do
      echo "  '$route',"
    done
    
    echo "];"
  } > "$ROUTES"
  
  log "✅ Updated routes.config.mjs with ${#NEW_ROUTES[@]} new routes"
else
  log "✅ routes.config.mjs is up to date"
fi

# -------------------------------------------------------------------
# 5. Generate sitemap entries
# -------------------------------------------------------------------
log "Generating sitemap entries..."

SITEMAP_DIR="$ROOT/sitemaps"
SITEMAP_PAGES="$SITEMAP_DIR/sitemap-pages.xml"

mkdir -p "$SITEMAP_DIR"

{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  
  for route in "${ROUTES_MAP[@]}"; do
    echo "  <url>"
    echo "    <loc>https://elevateforhumanity.org$route</loc>"
    echo "    <lastmod>$(date +%Y-%m-%d)</lastmod>"
    echo "    <changefreq>weekly</changefreq>"
    echo "    <priority>0.8</priority>"
    echo "  </url>"
  done
  
  echo '</urlset>'
} > "$SITEMAP_PAGES"

log "✅ Generated sitemap: $SITEMAP_PAGES"

# -------------------------------------------------------------------
# 6. Sister sites validation
# -------------------------------------------------------------------
log "Checking sister site configurations..."

SISTER_SITES=(
  "elevateforhumanity.org"
  "selfishinc.org"
  "curvaturebodysculpting.com"
)

SISTER_ROUTES=()

for site in "${SISTER_SITES[@]}"; do
  route="/landing/$site"
  SISTER_ROUTES+=("$route")
  
  # Check if route exists
  if ! grep -q "'$route'" "$ROUTES"; then
    log "  + Adding sister site route: $route"
    # Append to routes file
    sed -i "s|];|  '$route',\n];|" "$ROUTES"
  else
    log "  ✅ Sister site route exists: $route"
  fi
  
  # Check if landing page component exists
  landing_file="$PAGES_DIR/landing/${site//\./-}.jsx"
  if [[ ! -f "$landing_file" ]]; then
    log "  ⚠️  Missing landing page: $landing_file"
  fi
done

# -------------------------------------------------------------------
# 7. Build verification
# -------------------------------------------------------------------
log "Running build verification..."

if [[ "${DRY_RUN:-0}" == "1" ]]; then
  log "🔍 DRY RUN: Skipping build"
else
  log "Building application..."
  
  if $PKG_MGR run build > "$LOG_DIR/build.log" 2>&1; then
    log "✅ Build successful"
  else
    log "❌ Build failed, check $LOG_DIR/build.log"
    log "Attempting to fix common issues..."
    
    # Try installing dependencies
    log "Installing dependencies..."
    $PKG_MGR install
    
    # Try build again
    if $PKG_MGR run build > "$LOG_DIR/build-retry.log" 2>&1; then
      log "✅ Build successful after dependency install"
    else
      log "❌ Build still failing, manual intervention required"
      tail -20 "$LOG_DIR/build-retry.log" | tee -a "$LOG"
      exit 1
    fi
  fi
fi

# -------------------------------------------------------------------
# 8. Generate routing report
# -------------------------------------------------------------------
log "Generating routing report..."

REPORT="$LOG_DIR/routing-report.json"

{
  echo "{"
  echo "  \"timestamp\": \"$(date -Iseconds)\","
  echo "  \"node_version\": \"$NODE_VERSION\","
  echo "  \"package_manager\": \"$PKG_MGR\","
  echo "  \"total_pages\": ${#PAGE_FILES[@]},"
  echo "  \"total_routes\": ${#ROUTES_MAP[@]},"
  echo "  \"missing_imports\": ${#MISSING_IMPORTS[@]},"
  echo "  \"missing_routes\": ${#MISSING_ROUTES[@]},"
  echo "  \"new_routes_added\": ${#NEW_ROUTES[@]},"
  echo "  \"sister_sites\": ${#SISTER_SITES[@]},"
  echo "  \"pages\": ["
  
  first=true
  for component in "${!COMPONENTS[@]}"; do
    if [[ "$first" == true ]]; then
      first=false
    else
      echo ","
    fi
    echo -n "    {\"component\": \"$component\", \"route\": \"${ROUTES_MAP[$component]}\"}"
  done
  
  echo ""
  echo "  ]"
  echo "}"
} > "$REPORT"

log "✅ Routing report saved: $REPORT"

# -------------------------------------------------------------------
# 9. Summary
# -------------------------------------------------------------------
echo ""
echo "=========================================="
echo "Routing Guardian Summary"
echo "=========================================="
echo "Total Pages:       ${#PAGE_FILES[@]}"
echo "Total Routes:      ${#ROUTES_MAP[@]}"
echo "Missing Imports:   ${#MISSING_IMPORTS[@]}"
echo "Missing Routes:    ${#MISSING_ROUTES[@]}"
echo "New Routes Added:  ${#NEW_ROUTES[@]}"
echo "Sister Sites:      ${#SISTER_SITES[@]}"
echo "=========================================="
echo ""

if [[ ${#MISSING_IMPORTS[@]} -gt 0 || ${#MISSING_ROUTES[@]} -gt 0 ]]; then
  echo "⚠️  Action required: Some components need manual routing in App.jsx"
  echo ""
  echo "Missing imports:"
  for component in "${MISSING_IMPORTS[@]}"; do
    echo "  - $component"
  done
  echo ""
  echo "Missing routes:"
  for route in "${MISSING_ROUTES[@]}"; do
    echo "  - $route"
  done
  echo ""
  exit 1
else
  echo "✅ All routes configured correctly"
  echo ""
  log "Routing Guardian completed successfully"
  exit 0
fi
