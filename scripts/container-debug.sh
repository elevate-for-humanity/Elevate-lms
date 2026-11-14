#!/bin/bash
# Container Debug Script - Run this inside the crashing container via Northflank Shell (SSH)
# This will diagnose why server.js is not being found

echo "=========================================="
echo "CONTAINER DEBUG REPORT"
echo "Generated: $(date)"
echo "=========================================="
echo ""

echo "=== 1. Current Directory ==="
pwd
echo ""

echo "=== 2. Root Directory Listing ==="
ls -la /
echo ""

echo "=== 3. /app Directory Listing ==="
ls -la /app/
echo ""

echo "=== 4. Find server.js anywhere in /app ==="
find /app -name "server.js" -type f 2>/dev/null
echo ""

echo "=== 5. Find BUILD_ID file ==="
find /app -name "BUILD_ID" -type f 2>/dev/null
echo ""

echo "=== 6. Find .next/standalone directory ==="
find /app -path "*/.next/standalone" -type d 2>/dev/null
echo ""

echo "=== 7. Check standalone directory contents ==="
if [ -d "/app/apps/lms/.next/standalone" ]; then
    echo "Found: /app/apps/lms/.next/standalone"
    ls -la /app/apps/lms/.next/standalone/
    echo ""
    echo "server.js in standalone?"
    ls -la /app/apps/lms/.next/standalone/server.js 2>/dev/null || echo "NOT FOUND"
else
    echo "ERROR: /app/apps/lms/.next/standalone does not exist!"
fi
echo ""

echo "=== 8. Check for standalone at root ==="
if [ -d "/app/standalone" ]; then
    echo "Found: /app/standalone"
    ls -la /app/standalone/
else
    echo "No /app/standalone directory"
fi
echo ""

echo "=== 9. Check CMD being executed ==="
cat /proc/1/cmdline | tr '\0' ' '
echo ""
echo ""

echo "=== 10. Environment Variables ==="
echo "NODE_ENV=$NODE_ENV"
echo "PORT=$PORT"
echo "HOSTNAME=$HOSTNAME"
echo "WORKDIR=$(pwd)"
echo ""

echo "=== 11. Node version ==="
node --version
echo ""

echo "=== 12. Test running server.js directly ==="
if [ -f "/app/server.js" ]; then
    echo "Found /app/server.js, attempting to load..."
    timeout 5 node -e "require('/app/server.js')" 2>&1 || echo "Failed to load server.js"
else
    echo "ERROR: /app/server.js does not exist"
fi
echo ""

echo "=========================================="
echo "END OF DEBUG REPORT"
echo "=========================================="
