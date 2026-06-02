#!/usr/bin/env bash
# Export all /elevate/* SSM parameters to a JSON file for Northflank import.
# Requires AWS CLI credentials (same account as ECS: 954718262498, us-east-1).
#
# Usage:
#   bash scripts/northflank/export-ssm-env.sh exports/northflank-env.production.json
#
# Then upload via Northflank UI or:
#   pnpm tsx scripts/northflank/sync-env.ts --file exports/northflank-env.production.json

set -euo pipefail

OUT="${1:-exports/northflank-env.production.json}"
REGION="${AWS_REGION:-us-east-1}"
PREFIX="/elevate"

mkdir -p "$(dirname "$OUT")"

echo "Listing parameters under ${PREFIX} in ${REGION}..."
NAMES=$(aws ssm get-parameters-by-path \
  --path "${PREFIX}" \
  --recursive \
  --region "$REGION" \
  --query 'Parameters[].Name' \
  --output text)

if [ -z "$NAMES" ]; then
  echo "No parameters found. Check AWS credentials and path ${PREFIX}."
  exit 1
fi

echo "{" > "$OUT"
FIRST=1
for NAME in $NAMES; do
  KEY="${NAME#${PREFIX}/}"
  VAL=$(aws ssm get-parameter \
    --name "$NAME" \
    --with-decryption \
    --region "$REGION" \
    --query 'Parameter.Value' \
    --output text)
  if [ "$FIRST" -eq 1 ]; then FIRST=0; else echo "," >> "$OUT"; fi
  python3 -c "import json,sys; print(json.dumps(sys.argv[1]), end='')" "$KEY" >> "$OUT"
  echo -n ": " >> "$OUT"
  python3 -c "import json,sys; print(json.dumps(sys.argv[1]))" "$VAL" >> "$OUT"
done
echo "" >> "$OUT"
echo "}" >> "$OUT"

COUNT=$(python3 -c "import json; print(len(json.load(open('$OUT'))))")
echo "Wrote $COUNT keys to $OUT (do not commit this file)."
