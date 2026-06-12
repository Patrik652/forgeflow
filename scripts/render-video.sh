#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p media video/data

bash scripts/mock-run.sh > video/data/mock-run.txt
node video/scripts/parse-mock-run.mjs video/data/mock-run.txt video/data/mock-run.json

if [ ! -d video/node_modules ]; then
  npm --prefix video install --no-audit --no-fund
fi

npm --prefix video run render
