#!/bin/bash
# Serve locally
npm run build
echo "🌐 Starting local server..."
npx serve dist -p 8080
