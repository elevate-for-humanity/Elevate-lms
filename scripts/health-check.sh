#!/bin/bash

set -e

echo "🏥 Running health checks..."

API_URL=${API_URL:-http://localhost:3001}

echo "🔍 Checking backend health..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)

if [ "$BACKEND_STATUS" = "200" ]; then
  echo "✅ Backend is healthy"
else
  echo "❌ Backend health check failed (Status: $BACKEND_STATUS)"
  exit 1
fi

echo "🔍 Checking database connection..."
docker-compose exec -T postgres pg_isready -U elevate

if [ $? -eq 0 ]; then
  echo "✅ Database is healthy"
else
  echo "❌ Database health check failed"
  exit 1
fi

echo "🔍 Checking Redis connection..."
docker-compose exec -T redis redis-cli ping

if [ $? -eq 0 ]; then
  echo "✅ Redis is healthy"
else
  echo "❌ Redis health check failed"
  exit 1
fi

echo "🔍 Checking Docker containers..."
docker-compose ps

echo "✅ All health checks passed!"
