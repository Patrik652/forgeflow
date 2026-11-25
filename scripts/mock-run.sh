#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

CSV=sample-data/jobs.csv
FORMAT=()
INPUT_SET=false
for ARG in "$@"; do
  if [[ "$ARG" == --json ]]; then
    FORMAT=(--json)
  elif [[ "$ARG" == --* ]] || $INPUT_SET; then
    echo 'Usage: bash scripts/mock-run.sh [CSV] [--json]' >&2
    exit 1
  else
    CSV="$ARG"
    INPUT_SET=true
  fi
done
# Only the bundled historical fixture defaults to a frozen reference date.
if [[ -z "${FORGEFLOW_TODAY:-}" ]] && $INPUT_SET; then
  echo 'Custom CSV requires FORGEFLOW_TODAY=YYYY-MM-DD' >&2
  exit 1
fi
export FORGEFLOW_TODAY="${FORGEFLOW_TODAY:-2026-06-11}"
python3 scripts/read-csv.py "$CSV" | node scripts/run-jobs.mjs "${FORMAT[@]}"
