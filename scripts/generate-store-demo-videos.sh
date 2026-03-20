#!/usr/bin/env bash
# =============================================================================
# generate-store-demo-videos.sh
#
# Generates demo videos for every product in the Elevate store.
#
# Strategy (in order of preference):
#   1. HeyGen API  — talking-head avatar with narration (HEYGEN_API_KEY set)
#   2. D-ID API    — talking-head from photo + TTS audio (DID_API_KEY set)
#   3. ffmpeg      — slide-style video from existing assets (ffmpeg available)
#   4. Symlink     — reuse closest existing video as placeholder (always works)
#
# Output: public/videos/store/
#   store-platform-overview.mp4
#   store-managed-platform.mp4
#   store-enterprise-license.mp4
#   store-hvac-course.mp4
#   store-community-hub.mp4
#   store-analytics-pro.mp4
#   store-compliance-automation.mp4
#   store-sam-gov.mp4
#   store-grants-navigator.mp4
#   store-website-builder.mp4
#   store-ai-studio.mp4
#   store-digital-resources.mp4
#   store-admin-demo.mp4
#   store-employer-demo.mp4
#   store-student-demo.mp4
#   store-workforce-demo.mp4
#
# Usage:
#   bash scripts/generate-store-demo-videos.sh
#   HEYGEN_API_KEY=sk_... bash scripts/generate-store-demo-videos.sh
#   DID_API_KEY=... bash scripts/generate-store-demo-videos.sh
#   FORCE=1 bash scripts/generate-store-demo-videos.sh   # regenerate all
#
# =============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT/public/videos/store"
PHOTO="$ROOT/public/images/team/elizabeth-greene-headshot.jpg"
SITE_URL="https://www.elevateforhumanity.org"
FORCE="${FORCE:-0}"

mkdir -p "$OUT_DIR"

# ---------------------------------------------------------------------------
# Detect available generation method
# ---------------------------------------------------------------------------
METHOD="symlink"
if [[ -n "${HEYGEN_API_KEY:-}" ]]; then
  METHOD="heygen"
  echo "✅ HeyGen API key found — will generate talking-head videos"
elif [[ -n "${DID_API_KEY:-}" ]]; then
  METHOD="did"
  echo "✅ D-ID API key found — will generate talking-head videos"
elif command -v ffmpeg &>/dev/null; then
  METHOD="ffmpeg"
  echo "✅ ffmpeg found — will generate slide-style videos"
else
  echo "⚠️  No API keys or ffmpeg — will symlink existing videos as placeholders"
  echo "    Set HEYGEN_API_KEY or DID_API_KEY to generate real talking-head videos"
  echo "    Install ffmpeg to generate slide-style videos"
fi

# ---------------------------------------------------------------------------
# Product definitions: OUTPUT_FILE | TITLE | NARRATION_SCRIPT | FALLBACK_VIDEO
# ---------------------------------------------------------------------------
declare -A PRODUCTS
declare -A SCRIPTS
declare -A FALLBACKS

# Scripts are kept under 750 characters (~60 seconds at normal speaking pace)
# to stay within HeyGen's per-video input limit.

PRODUCTS[store-platform-overview]="Elevate Platform Overview"
SCRIPTS[store-platform-overview]="The Elevate Workforce Operating System is a complete white-label platform for workforce development organizations. Enrollment, WIOA compliance, credential tracking, employer matching, and automated reporting — all in one place. Your brand, your domain, your instance. We handle the infrastructure. Start a 14-day free trial today. No credit card required."
FALLBACKS[store-platform-overview]="store-demo-narrated.mp4"

PRODUCTS[store-managed-platform]="Managed Platform License"
SCRIPTS[store-managed-platform]="The Managed Platform gives your organization a fully branded workforce LMS — hosted and supported by Elevate. Admin, student, and employer portals included. WIOA compliance reporting, credential issuance, and employer matching are all automated. Starting at fifteen hundred dollars per month. 14-day free trial, no credit card required."
FALLBACKS[store-managed-platform]="store-whitelabel-narrated.mp4"

PRODUCTS[store-enterprise-license]="Enterprise Source-Use License"
SCRIPTS[store-enterprise-license]="The Enterprise Source-Use license gives large organizations and state agencies full source code access to deploy Elevate on their own infrastructure. Includes 40 hours of implementation support, annual security updates, and quarterly compliance reviews. One-time fee of seventy-five thousand dollars plus annual maintenance."
FALLBACKS[store-enterprise-license]="store-whitelabel-narrated.mp4"

PRODUCTS[store-hvac-course]="HVAC Technician Course License"
SCRIPTS[store-hvac-course]="License the complete HVAC Technician course for your workforce program. 16 modules, 94 lessons, EPA 608 prep, OSHA 10-Hour, CPR content, and a 400-question assessment bank. SCORM and xAPI export included. Annual license at forty-five hundred dollars per organization."
FALLBACKS[store-hvac-course]="hvac-technician.mp4"

PRODUCTS[store-community-hub]="Community Hub Add-On"
SCRIPTS[store-community-hub]="Community Hub adds a complete peer learning community to your LMS. Discussion forums, member groups, leaderboards, a badge system, an events calendar, and direct messaging — all integrated with your student data. Peer community increases engagement by 40 percent and reduces dropout rates. One-time purchase at nineteen ninety-seven."
FALLBACKS[store-community-hub]="lms-learning.mp4"

PRODUCTS[store-analytics-pro]="Analytics Pro Add-On"
SCRIPTS[store-analytics-pro]="Analytics Pro gives your organization advanced reporting and predictive analytics for student outcomes. Real-time dashboards show enrollment trends, completion rates, and at-risk students before they drop out. Custom report builder, cohort analysis, and automated compliance alerts. One-time purchase at fourteen ninety-seven."
FALLBACKS[store-analytics-pro]="dashboard-analytics-narrated.mp4"

PRODUCTS[store-compliance-automation]="Compliance Automation Add-On"
SCRIPTS[store-compliance-automation]="Compliance Automation handles WIOA, FERPA, grant reporting, and accreditation requirements automatically. Eligibility is verified at enrollment. PIRL reports generate on demand. Audit logs capture every data access event. Your compliance team reviews results instead of building spreadsheets. One-time purchase at twelve ninety-seven."
FALLBACKS[store-compliance-automation]="dashboard-admin-narrated.mp4"

PRODUCTS[store-sam-gov]="SAM.gov Registration Assistant"
SCRIPTS[store-sam-gov]="The SAM.gov Registration Assistant walks your organization through federal contractor registration step by step. Get your Unique Entity Identifier, complete your entity registration, and stay compliant with annual renewal requirements. Built for workforce organizations and nonprofits pursuing federal contracts and grants. One hundred forty-nine dollars per month."
FALLBACKS[store-sam-gov]="business-finance.mp4"

PRODUCTS[store-grants-navigator]="Grants Discovery and Management"
SCRIPTS[store-grants-navigator]="The Grants Discovery app uses AI to match your organization with federal, state, and foundation grants. Track application deadlines, manage reporting requirements, and monitor grant utilization in one dashboard. Workforce organizations using this tool find three times more relevant funding opportunities. One hundred ninety-nine dollars per month."
FALLBACKS[store-grants-navigator]="business-finance.mp4"

PRODUCTS[store-website-builder]="Website Builder for Training Providers"
SCRIPTS[store-website-builder]="The Website Builder creates professional training websites with built-in LMS integration, enrollment forms, and SEO tools. No coding required. Launch in hours, not weeks. Includes WIOA-compliant consumer information pages, credential verification widgets, and employer partnership pages. Seventy-nine dollars per month."
FALLBACKS[store-website-builder]="programs-overview-video-with-narration.mp4"

PRODUCTS[store-ai-studio]="AI Studio"
SCRIPTS[store-ai-studio]="AI Studio lets your organization generate course videos, lesson narrations, marketing content, and student communications using AI. Upload your curriculum and get professional video lessons in minutes. Generate email campaigns and grant narratives automatically. Built specifically for workforce training organizations."
FALLBACKS[store-ai-studio]="ai-assistant-welcome.mp4"

PRODUCTS[store-digital-resources]="Digital Resources"
SCRIPTS[store-digital-resources]="The Elevate digital resource library includes toolkits, guides, and templates for workforce training organizations. The Capital Readiness Guide, Tax Business Toolkit, Grant Readiness Guide, and Workforce Compliance Toolkit are available as instant downloads. Everything you need to start, grow, and scale your training operation."
FALLBACKS[store-digital-resources]="store-marketplace-narrated.mp4"

PRODUCTS[store-admin-demo]="Admin Dashboard Demo"
SCRIPTS[store-admin-demo]="The Admin Dashboard is where your staff manages everything. Search and filter students by program or status. Review applications, track enrollment and completion in real time, and generate WIOA compliance reports with one click. Every screen is live and clickable — try the demo with no signup required."
FALLBACKS[store-admin-demo]="dashboard-admin-narrated.mp4"

PRODUCTS[store-employer-demo]="Employer Portal Demo"
SCRIPTS[store-employer-demo]="The Employer Portal gives your hiring partners everything they need. Browse pre-screened candidates with verified credentials. Track apprenticeship hours, manage OJT contracts, and sign compliance documents electronically. WOTC tax credit documentation is generated automatically. Try the live demo — no signup required."
FALLBACKS[store-employer-demo]="dashboard-employer-narrated.mp4"

PRODUCTS[store-student-demo]="Student Portal Demo"
SCRIPTS[store-student-demo]="The Student Portal is what your learners see every day. Course modules with video lessons and quizzes. Progress bars showing exactly where they are in the program. Apprenticeship hour logging from their phone. Earned certificates and a credential wallet they can share with employers. Try the live demo — no signup required."
FALLBACKS[store-student-demo]="dashboard-student-narrated.mp4"

PRODUCTS[store-workforce-demo]="Workforce Board View Demo"
SCRIPTS[store-workforce-demo]="The Workforce Board view is built for state agencies and workforce boards. WIOA eligibility screening, ITA management, and funding allocation across providers. Automated PIRL reporting and quarterly performance metrics. Manage your entire network of training providers and employers from one dashboard. Try the live demo — no signup required."
FALLBACKS[store-workforce-demo]="dashboard-analytics-narrated.mp4"

# ---------------------------------------------------------------------------
# Helper: check if output file exists and is non-empty
# ---------------------------------------------------------------------------
needs_generation() {
  local out="$OUT_DIR/$1.mp4"
  if [[ "$FORCE" == "1" ]]; then return 0; fi
  if [[ ! -f "$out" ]] || [[ ! -s "$out" ]]; then return 0; fi
  return 1
}

# ---------------------------------------------------------------------------
# Method: symlink fallback
# ---------------------------------------------------------------------------
generate_symlink() {
  local key="$1"
  local fallback="${FALLBACKS[$key]}"
  local out="$OUT_DIR/$key.mp4"
  local src="$ROOT/public/videos/$fallback"

  if [[ -f "$src" ]]; then
    cp "$src" "$out"
    echo "  → Copied $fallback as placeholder"
  else
    # Find any store video as last resort
    local any
    any=$(find "$ROOT/public/videos" -name "store-demo*.mp4" | head -1)
    if [[ -n "$any" ]]; then
      cp "$any" "$out"
      echo "  → Copied $(basename "$any") as last-resort placeholder"
    else
      echo "  ⚠️  No fallback found for $key — skipping"
    fi
  fi
}

# ---------------------------------------------------------------------------
# Method: ffmpeg slide-style video
# ---------------------------------------------------------------------------
generate_ffmpeg() {
  local key="$1"
  local title="${PRODUCTS[$key]}"
  local fallback="${FALLBACKS[$key]}"
  local out="$OUT_DIR/$key.mp4"
  local src="$ROOT/public/videos/$fallback"

  if [[ ! -f "$src" ]]; then
    echo "  ⚠️  Fallback video not found, using symlink method"
    generate_symlink "$key"
    return
  fi

  # Trim first 30s of the fallback video and add a title overlay
  ffmpeg -y -i "$src" \
    -t 30 \
    -vf "drawtext=text='${title}':fontcolor=white:fontsize=28:box=1:boxcolor=black@0.5:boxborderw=8:x=(w-text_w)/2:y=h-th-20" \
    -c:v libx264 -preset fast -crf 28 \
    -c:a aac -b:a 128k \
    "$out" 2>/dev/null && echo "  → Generated with ffmpeg (trimmed + title overlay)" \
    || { echo "  ⚠️  ffmpeg failed, falling back to copy"; generate_symlink "$key"; }
}

# ---------------------------------------------------------------------------
# Method: HeyGen API
# ---------------------------------------------------------------------------
generate_heygen() {
  local key="$1"
  local script="${SCRIPTS[$key]}"
  local out="$OUT_DIR/$key.mp4"

  echo "  → Submitting to HeyGen..."

  # Write script to temp file to avoid shell quoting issues
  local tmp_script
  tmp_script=$(mktemp)
  printf '%s' "$script" > "$tmp_script"

  local payload
  payload=$(python3 - "$tmp_script" <<'PYEOF'
import json, sys
script = open(sys.argv[1]).read()
payload = {
  'video_inputs': [{
    'character': {
      'type': 'avatar',
      'avatar_id': 'Adriana_Business_Front_public',
      'avatar_style': 'normal'
    },
    'voice': {
      'type': 'text',
      'input_text': script,
      'voice_id': '68dedac41a9f46a6a4271a95c733823c',
      'speed': 1.0
    },
    'background': {
      'type': 'color',
      'value': '#0f172a'
    }
  }],
  'dimension': {'width': 1280, 'height': 720},
  'aspect_ratio': '16:9',
  'test': False
}
print(json.dumps(payload))
PYEOF
)
  rm -f "$tmp_script"

  local response
  response=$(curl -s -X POST "https://api.heygen.com/v2/video/generate" \
    -H "X-Api-Key: $HEYGEN_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload")

  local video_id
  video_id=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('video_id',''))" 2>/dev/null || echo "")

  if [[ -z "$video_id" ]]; then
    echo "  ⚠️  HeyGen submission failed: $response"
    echo "  → Falling back to symlink"
    generate_symlink "$key"
    return
  fi

  echo "  → HeyGen video_id: $video_id (polling...)"

  # Poll up to 10 minutes — use Python to avoid bash arithmetic exit-code issues
  python3 - "$video_id" "$out" "$HEYGEN_API_KEY" <<'PYEOF'
import sys, time, urllib.request, json

video_id = sys.argv[1]
out_path  = sys.argv[2]
api_key   = sys.argv[3]

for attempt in range(1, 61):
    time.sleep(10)
    req = urllib.request.Request(
        f"https://api.heygen.com/v1/video_status.get?video_id={video_id}",
        headers={"X-Api-Key": api_key}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            d = json.load(r).get("data", {})
    except Exception as e:
        print(f"    Poll error: {e}")
        continue

    status    = d.get("status", "")
    video_url = d.get("video_url", "") or ""
    print(f"    Status: {status} (attempt {attempt}/60)", flush=True)

    if status == "completed" and video_url:
        print(f"  → Downloading...", flush=True)
        urllib.request.urlretrieve(video_url, out_path)
        size = len(open(out_path, "rb").read())
        print(f"  ✅ Downloaded: {size:,} bytes", flush=True)
        sys.exit(0)
    elif status == "failed":
        print("  ❌ HeyGen generation failed", flush=True)
        sys.exit(1)

print("  ⚠️  Timed out", flush=True)
sys.exit(1)
PYEOF
  local py_exit=$?
  if [[ $py_exit -ne 0 ]]; then
    echo "  → Falling back to symlink"
    generate_symlink "$key"
  fi
}

# ---------------------------------------------------------------------------
# Method: D-ID API
# ---------------------------------------------------------------------------
generate_did() {
  local key="$1"
  local script="${SCRIPTS[$key]}"
  local out="$OUT_DIR/$key.mp4"

  echo "  → Submitting to D-ID..."

  # Use a publicly accessible presenter image
  local source_url="https://www.elevateforhumanity.org/images/team/elizabeth-greene-headshot.jpg"

  # Write script to temp file to avoid shell quoting issues
  local tmp_script
  tmp_script=$(mktemp)
  printf '%s' "$script" > "$tmp_script"

  local payload
  payload=$(python3 - "$tmp_script" "$source_url" <<'PYEOF'
import json, sys
script = open(sys.argv[1]).read()
source_url = sys.argv[2]
payload = {
  'script': {
    'type': 'text',
    'input': script,
    'provider': {
      'type': 'microsoft',
      'voice_id': 'en-US-JennyNeural'
    }
  },
  'source_url': source_url,
  'config': {
    'fluent': True,
    'pad_audio': 0.0,
    'result_format': 'mp4'
  }
}
print(json.dumps(payload))
PYEOF
)
  rm -f "$tmp_script"

  local response
  response=$(curl -s -X POST "https://api.d-id.com/talks" \
    -H "Authorization: Basic $DID_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload")

  local talk_id
  talk_id=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null || echo "")

  if [[ -z "$talk_id" ]]; then
    echo "  ⚠️  D-ID submission failed: $response"
    generate_symlink "$key"
    return
  fi

  echo "  → D-ID talk_id: $talk_id (polling...)"

  local attempts=0
  local max_attempts=60

  while [[ $attempts -lt $max_attempts ]]; do
    sleep 10
    local status_resp
    status_resp=$(curl -s "https://api.d-id.com/talks/$talk_id" \
      -H "Authorization: Basic $DID_API_KEY")
    local status
    status=$(echo "$status_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status',''))" 2>/dev/null || echo "")
    local result_url
    result_url=$(echo "$status_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('result_url',''))" 2>/dev/null || echo "")

    echo "    Status: $status (attempt $((attempts+1))/$max_attempts)"

    if [[ "$status" == "done" ]] && [[ -n "$result_url" ]]; then
      curl -sL "$result_url" -o "$out"
      echo "  ✅ Downloaded: $key.mp4"
      return
    elif [[ "$status" == "error" ]]; then
      echo "  ❌ D-ID generation failed"
      generate_symlink "$key"
      return
    fi
    ((attempts++))
  done

  echo "  ⚠️  D-ID timed out"
  generate_symlink "$key"
}

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------
echo ""
echo "=== Store Demo Video Generator ==="
echo "Method: $METHOD"
echo "Output: $OUT_DIR"
echo ""

GENERATED=0
SKIPPED=0

for key in "${!PRODUCTS[@]}"; do
  title="${PRODUCTS[$key]}"
  out="$OUT_DIR/$key.mp4"

  if ! needs_generation "$key"; then
    echo "⏭  Skipping $key.mp4 (already exists)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  echo "🎬 Generating: $title"
  echo "   Output: $key.mp4"

  case "$METHOD" in
    heygen)  generate_heygen "$key" ;;
    did)     generate_did "$key" ;;
    ffmpeg)  generate_ffmpeg "$key" ;;
    symlink) generate_symlink "$key" ;;
  esac

  if [[ -f "$out" ]] && [[ -s "$out" ]]; then
    size=$(du -sh "$out" | cut -f1)
    echo "   ✅ Done ($size)"
    GENERATED=$((GENERATED + 1))
  else
    echo "   ❌ Failed — no output file"
  fi
  echo ""
done

echo "=== Complete ==="
echo "Generated: $GENERATED"
echo "Skipped:   $SKIPPED"
echo ""

if [[ "$METHOD" == "symlink" ]]; then
  echo "NOTE: Videos are placeholders copied from existing assets."
  echo "To generate real talking-head videos:"
  echo "  HEYGEN_API_KEY=sk_... bash scripts/generate-store-demo-videos.sh"
  echo "  DID_API_KEY=...     bash scripts/generate-store-demo-videos.sh"
fi
