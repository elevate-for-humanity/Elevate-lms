#!/usr/bin/env bash
# Downloads real workforce photos from Pexels for all program pages and site sections.
# Pexels free license — no attribution required for web use.

DEST="public/images/pages"
mkdir -p "$DEST"

dl() {
  local name="$1"
  local url="$2"
  if [ -f "$DEST/$name" ]; then
    echo "skip: $name"
  else
    curl -sL "$url" -o "$DEST/$name" && echo "✅ $name" || echo "❌ FAILED: $name"
  fi
}

echo "=== HEALTHCARE ==="
dl "cna-patient-care.jpg"       "https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "cna-vitals.jpg"             "https://images.pexels.com/photos/7089401/pexels-photo-7089401.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "cna-clinical.jpg"           "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "medical-assistant-lab.jpg"  "https://images.pexels.com/photos/4226119/pexels-photo-4226119.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "medical-assistant-desk.jpg" "https://images.pexels.com/photos/5407206/pexels-photo-5407206.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "phlebotomy-draw.jpg"        "https://images.pexels.com/photos/4047186/pexels-photo-4047186.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "phlebotomy-lab.jpg"         "https://images.pexels.com/photos/3938023/pexels-photo-3938023.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "cpr-mannequin.jpg"          "https://images.pexels.com/photos/6823601/pexels-photo-6823601.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "cpr-aed.jpg"                "https://images.pexels.com/photos/6823568/pexels-photo-6823568.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "pharmacy-tech.jpg"          "https://images.pexels.com/photos/5910955/pexels-photo-5910955.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "healthcare-classroom.jpg"   "https://images.pexels.com/photos/8376277/pexels-photo-8376277.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "healthcare-grad.jpg"        "https://images.pexels.com/photos/5452201/pexels-photo-5452201.jpeg?auto=compress&cs=tinysrgb&w=1280"

echo "=== HVAC / TRADES ==="
dl "hvac-unit.jpg"              "https://images.pexels.com/photos/5691659/pexels-photo-8486944.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "hvac-ductwork.jpg"          "https://images.pexels.com/photos/5691658/pexels-photo-8486945.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "hvac-tools.jpg"             "https://images.pexels.com/photos/8486972/pexels-photo-8486972.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "electrical-wiring.jpg"      "https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "electrical-panel.jpg"       "https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "electrical-conduit.jpg"     "https://images.pexels.com/photos/8005397/pexels-photo-8005397.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "welding-sparks.jpg"         "https://images.pexels.com/photos/1474993/pexels-photo-1474993.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "welding-mask.jpg"           "https://images.pexels.com/photos/3862130/pexels-photo-3862130.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "welding-torch.jpg"          "https://images.pexels.com/photos/2760243/pexels-photo-2760243.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "plumbing-pipes.jpg"         "https://images.pexels.com/photos/8005368/pexels-photo-8005368.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "plumbing-tools.jpg"         "https://images.pexels.com/photos/6419128/pexels-photo-6419128.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "trades-classroom.jpg"       "https://images.pexels.com/photos/8005401/pexels-photo-8005401.jpeg?auto=compress&cs=tinysrgb&w=1280"

echo "=== CDL / TRUCKING ==="
dl "cdl-truck-highway.jpg"      "https://images.pexels.com/photos/1427107/pexels-photo-1427107.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "cdl-cab-interior.jpg"       "https://images.pexels.com/photos/2199293/pexels-photo-2199293.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "cdl-pretrip.jpg"            "https://images.pexels.com/photos/906982/pexels-photo-906982.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "cdl-loading-dock.jpg"       "https://images.pexels.com/photos/4481259/pexels-photo-4481259.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "cdl-driver-seat.jpg"        "https://images.pexels.com/photos/3806288/pexels-photo-3806288.jpeg?auto=compress&cs=tinysrgb&w=1280"

echo "=== BARBER ==="
dl "barber-fade.jpg"            "https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "barber-shop-interior.jpg"   "https://images.pexels.com/photos/3992874/pexels-photo-3992874.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "barber-clippers.jpg"        "https://images.pexels.com/photos/2076930/pexels-photo-2076930.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "barber-lineup.jpg"          "https://images.pexels.com/photos/1570807/pexels-photo-1570807.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "barber-student.jpg"         "https://images.pexels.com/photos/3998429/pexels-photo-3998429.jpeg?auto=compress&cs=tinysrgb&w=1280"

echo "=== TECHNOLOGY ==="
dl "it-helpdesk-desk.jpg"       "https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "it-hardware.jpg"            "https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "it-networking.jpg"          "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "cybersecurity-screen.jpg"   "https://images.pexels.com/photos/5380664/pexels-photo-5380664.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "cybersecurity-code.jpg"     "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "tech-classroom.jpg"         "https://images.pexels.com/photos/3861964/pexels-photo-3861964.jpeg?auto=compress&cs=tinysrgb&w=1280"

echo "=== BUSINESS / TAX ==="
dl "tax-prep-desk.jpg"          "https://images.pexels.com/photos/6863183/pexels-photo-6863183.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "tax-forms.jpg"              "https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "bookkeeping-ledger.jpg"     "https://images.pexels.com/photos/6693661/pexels-photo-6693661.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "office-admin-desk.jpg"      "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1280"

echo "=== WORKFORCE / FUNDING ==="
dl "workforce-training.jpg"     "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "job-placement.jpg"          "https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "career-counseling.jpg"      "https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "wioa-meeting.jpg"           "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "employer-handshake.jpg"     "https://images.pexels.com/photos/3184317/pexels-photo-3184317.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "graduation-ceremony.jpg"    "https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "adult-learner.jpg"          "https://images.pexels.com/photos/4145153/pexels-photo-4145153.jpeg?auto=compress&cs=tinysrgb&w=1280"
dl "training-cohort.jpg"        "https://images.pexels.com/photos/3184396/pexels-photo-3184396.jpeg?auto=compress&cs=tinysrgb&w=1280"

echo "=== HOMEPAGE AUDIENCE CARDS ==="
dl "hp-train-real.jpg"          "https://images.pexels.com/photos/8199562/pexels-photo-8199562.jpeg?auto=compress&cs=tinysrgb&w=800"
dl "hp-funding-real.jpg"        "https://images.pexels.com/photos/6863254/pexels-photo-6863254.jpeg?auto=compress&cs=tinysrgb&w=800"
dl "hp-employer-real.jpg"       "https://images.pexels.com/photos/3184405/pexels-photo-3184405.jpeg?auto=compress&cs=tinysrgb&w=800"
dl "hp-school-real.jpg"         "https://images.pexels.com/photos/3184394/pexels-photo-3184394.jpeg?auto=compress&cs=tinysrgb&w=800"
dl "hp-candidates-real.jpg"     "https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=800"
dl "hp-wioa-real.jpg"           "https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=800"
dl "hp-grants-real.jpg"         "https://images.pexels.com/photos/6863255/pexels-photo-6863255.jpeg?auto=compress&cs=tinysrgb&w=800"
dl "hp-government-real.jpg"     "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"

echo ""
echo "=== SUMMARY ==="
total=$(ls "$DEST"/*.jpg 2>/dev/null | wc -l)
echo "Total images in $DEST: $total"
du -sh "$DEST"
