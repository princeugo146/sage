#!/bin/bash

set -e

echo "Running database migrations..."
pnpm drizzle-kit push

echo "Starting SAGE..."
node .next/server/index.js
