#!/bin/bash
# Memory monitoring script - runs every 5 minutes

USAGE=$(du -sm . | cut -f1)
THRESHOLD=600

if [ "$USAGE" -gt "$THRESHOLD" ]; then
  echo "$(date): Memory usage $USAGE MB exceeds threshold $THRESHOLD MB" >> memory-alerts.log
  node scripts/memory-manager.mjs --auto-cleanup
fi
