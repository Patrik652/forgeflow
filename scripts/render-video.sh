#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p media video/data

# The video documents this historical synthetic fixture, regardless of caller environment.
export FORGEFLOW_TODAY=2026-06-11
bash scripts/mock-run.sh --json > video/data/mock-run-output.json
node video/scripts/parse-mock-run.mjs video/data/mock-run-output.json video/data/mock-run.json

npm --prefix video ci --no-audit --no-fund

npm --prefix video run render -- "$@"
