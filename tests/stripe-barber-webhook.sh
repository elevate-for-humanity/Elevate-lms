#!/usr/bin/env bash
set -euo pipefail

if ! command -v stripe >/dev/null 2>&1; then
  echo "Stripe CLI is required."
  exit 1
fi

APP_URL="${APP_URL:-http://localhost:3000}"

echo "1) Start webhook forwarding in another terminal:"
echo "stripe listen --forward-to ${APP_URL}/api/barber/webhook"
echo
echo "2) Trigger the event your code actually handles."
echo "If your code handles checkout.session.completed, use:"
echo "stripe trigger checkout.session.completed"
echo
echo "3) Then verify DB row and email logs."
