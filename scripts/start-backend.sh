#!/bin/bash
cd /workspaces/fix2
export $(cat .env | grep -v '^#' | xargs)
cd server
npx tsx index.ts
