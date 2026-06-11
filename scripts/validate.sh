#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

WF="${1:-workflows/forgeflow-job-tracker.json}"

if [ ! -f "$WF" ]; then
  echo "validate: missing workflow: $WF" >&2
  exit 1
fi

jq -e . "$WF" >/dev/null

jq -e '
  .name == "forgeflow-job-tracker"
  and (.nodes | type == "array" and length >= 8)
  and (.connections | type == "object")
  and ([.nodes[].type] | any(test("webhook"; "i")))
  and ([.nodes[] | (.type + " " + .name)] | any(test("anthropic|claude|langchain"; "i")))
  and ([.nodes[].type] | any(test("switch"; "i")))
  and ([.nodes[].type] | any(test("if"; "i")))
  and ([.nodes[] | (.type + " " + .name)] | any(test("sheets"; "i")))
  and ([.nodes[] | (.type + " " + .name)] | any(test("telegram"; "i")))
' "$WF" >/dev/null

echo "validate: JSON structure OK"

if command -v n8n >/dev/null 2>&1; then
  tmp_dir="$(mktemp -d)"
  trap 'rm -rf "$tmp_dir"' EXIT
  export N8N_USER_FOLDER="$tmp_dir"
  n8n import:workflow --input="$WF" >/dev/null
  echo "validate: n8n import OK"
else
  echo "validate: n8n CLI not found; skipped import dry run"
fi
