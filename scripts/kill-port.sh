#!/bin/bash
# scripts/kill-port.sh
# Kill any process using the specified port

PORT=${1:-3000}

echo "🔍 Checking for processes on port $PORT..."

# Find and kill processes using the port
PID=$(lsof -ti:$PORT 2>/dev/null)

if [ -z "$PID" ]; then
    echo "✅ Port $PORT is free"
    exit 0
fi

echo "⚠️  Found process $PID using port $PORT"
echo "🔪 Killing process..."

kill -9 $PID 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Successfully killed process on port $PORT"
else
    echo "❌ Failed to kill process (may require sudo)"
    exit 1
fi
