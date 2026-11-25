#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Read-only checks: generate artifacts and render media before starting this chain.
for SCRIPT in scripts/*.sh; do bash -n "$SCRIPT"; done
node --check src/job-engine.mjs
python3 - <<'PY'
import ast
from pathlib import Path
for path in Path('scripts').glob('*.py'):
    ast.parse(path.read_text(), filename=str(path))
print('syntax: shell, JavaScript core and Python OK')
PY
node --test tests/*.mjs
node scripts/build-workflows.mjs --check
bash scripts/validate.sh
docker compose config --quiet
bash scripts/gate.sh
bash scripts/gate-video.sh
python3 scripts/n8n-smoke.py
echo 'verify: PASS (offline demo; live provider integrations remain unverified)'
