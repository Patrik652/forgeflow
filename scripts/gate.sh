#!/usr/bin/env bash
# =============================================================================
# PM-OWNED DETERMINISTIC GATE — Codex MUST NOT modify this file.
# Make it pass by BUILDING the deliverables, never by weakening the checks.
# Editing this file = automatic task failure (judge will reject).
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

WF=workflows/forgeflow-job-tracker.json
fail() { echo "GATE FAIL: $1" >&2; exit 1; }

# 1) workflow JSON exists + valid
[ -f "$WF" ] || fail "missing $WF"
jq -e . "$WF" >/dev/null 2>&1 || fail "$WF is not valid JSON"
jq -e '.nodes | type=="array" and length>=5' "$WF" >/dev/null 2>&1 \
  || fail "workflow needs an array of >=5 nodes"

# 2) required node categories present (match on type + name, case-insensitive)
catalog=$(jq -r '[.nodes[] | (.type + " " + (.name // ""))] | join("\n")' "$WF" \
  | tr '[:upper:]' '[:lower:]')
check_cat() { echo "$catalog" | grep -Eq "$1" || fail "missing node category: $2"; }
check_cat 'webhook'                       'webhook trigger'
check_cat 'anthropic|claude|langchain'    'Claude / Anthropic classifier'
check_cat 'switch|if'                      'Switch/IF routing'
check_cat 'sheets'                         'Google Sheets board'
check_cat 'telegram'                       'Telegram alert'

# 3) required deliverable files exist
for f in scripts/validate.sh scripts/mock-run.sh docker-compose.yml \
         README.md sample-data/jobs.csv .env.example; do
  [ -f "$f" ] || fail "missing required file: $f"
done

# 4) README has the required sections
grep -Eqi '^#+.*problem'            README.md || fail "README missing a Problem section"
grep -Eqi '^#+.*architecture'       README.md || fail "README missing an Architecture section"
grep -Eqi '^#+.*(run|quick ?start)' README.md || fail "README missing a Run/Quickstart section"

# 5) no secrets committed
if git ls-files 2>/dev/null | grep -qE '(^|/)\.env$'; then
  fail ".env must never be committed"
fi
if git ls-files 2>/dev/null | xargs -r grep -lE 'sk-ant-[a-zA-Z0-9]{8,}' 2>/dev/null \
   | grep -vq '.env.example'; then
  fail "a real-looking Anthropic key is committed in a tracked file"
fi

echo "GATE OK"
