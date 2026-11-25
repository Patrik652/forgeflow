# ForgeFlow — CNC Job Triage Demo

Turn a CSV of production jobs into a work-centre board and a short list of exceptions. Every routing decision is reproducible: dates, machine mappings and priority rules run in code.

**Portfolio demonstration with synthetic data.** The default demo needs no accounts, makes no AI calls and sends nothing. Google Sheets, Telegram and optional Claude enrichment are a separate, disabled integration template. This is not a customer deployment or evidence of measured business savings.

[Watch the 60-second demo](media/forgeflow-demo.mp4)

## Problem

A production planner needs to see which jobs belong to each work centre and which need attention. Scattered spreadsheets and free-text notes make that difficult.

ForgeFlow validates the whole input batch, routes known machines and retains unknown machines for manual review. Late or explicitly high-priority jobs produce an alert preview. It demonstrates one small automation that can be adapted to a real shop after agreeing its actual planning rules.

## Architecture

```text
Synthetic CSV / manual n8n trigger
                  |
       Validate the entire batch
                  |
       Shared JavaScript rules
       date + priority + machine
                  |
      MILL | LATHE | LASER | EDM
            unknown → REVIEW
                  |
            Local board rows
                  |
         late OR high priority?
                  |
        Local alert previews
```

- `src/job-engine.mjs` is the shared source of truth for the CLI and generated n8n Code nodes.
- `workflows/forgeflow-demo.json` is the credential-free executable demo.
- `workflows/forgeflow-job-tracker.json` is an **inactive integration template**. Its Anthropic, Google Sheets and Telegram nodes are disabled. Optional AI can add an explanation; it cannot change the rule-derived decisions. Provider response handling is tested with offline fixtures; live accounts and delivery are unverified.
- Invalid input fails explicitly. Unknown machines survive as `REVIEW`; an unknown, late job also requires an alert.

## Quickstart / Run

Requires Node.js 22+, Python 3 and `jq`. Docker is needed only for the actual n8n runtime check or editor.

```bash
bash scripts/mock-run.sh
bash scripts/mock-run.sh --json
```

The bundled eight-job fixture deliberately uses **2026-06-11** as its reference date. It produces eight board rows and exactly two alert previews: `J-1002` and `J-1005`. These are reference results, not today's production status.

For your own CSV, supply a date explicitly:

```bash
FORGEFLOW_TODAY=2026-11-25 bash scripts/mock-run.sh /path/to/jobs.csv --json
```

Required columns: `job_id,part_name,material,qty,due_date,requested_machine,customer,notes`. CSV quoting, commas, multiline notes and CRLF are supported. Quantities must be positive safe integers; dates must be valid `YYYY-MM-DD`; job IDs must be unique within a batch. Maximum 10 MB, 10,000 rows and 4,000 characters per field.

### Run in n8n

```bash
docker compose up -d
```

Open `http://127.0.0.1:5678`, set up the local owner account and import **`workflows/forgeflow-demo.json`**. Click **Execute workflow**. Inspect the local board and alert outputs. The editor stores its state in the named local Docker volume. Stop it with `docker compose down`; keep the volume to preserve local work.

For external integrations, work on a copy of the inactive template. Configure provider credentials in n8n, set the target Sheet and Telegram chat, review the data being shared and deliberately enable only the required nodes. Do not publish a webhook or enable external delivery as part of the demo. The historical fixture date must be replaced with the agreed business clock for real input. Production use also needs access control, idempotent delivery, retries, monitoring and provider-specific acceptance tests.

## Rules and limits

| Decision | Rule |
|---|---|
| Work centre | milling → MILL; turning → LATHE; laser → LASER; edm → EDM; other → REVIEW |
| ETA risk | due before reference date → late; due today or notes containing `at-risk`, `at risk`, `capacity` → at_risk; otherwise on_track |
| Priority | notes containing `high priority`, `line stoppage`, `escalated`, `overdue` → high; otherwise `low priority` → low; otherwise medium |
| Alert preview | late OR high priority |

These are explicit demonstration heuristics, not a capacity planner or natural-language understanding. Negation and business-specific meanings need a revised, agreed rule set. Upserts can update board rows by job ID; this demo does not implement exactly-once notifications or durable recovery.

## Verification

```bash
bash scripts/verify.sh
```

The chain checks the original PM-owned gates, deterministic rules, real CSV ingestion, generated workflow consistency, provider boundaries with offline responses, and an actual execution in **n8n 2.49.6** with Docker networking disabled. It needs no live credentials. Before the first runtime check, cache the pinned image from Compose:

```bash
docker compose pull
```

Useful individual checks:

```bash
node --test tests/*.mjs
node scripts/build-workflows.mjs --check
python3 scripts/n8n-smoke.py
bash scripts/gate.sh
bash scripts/gate-video.sh
```

Rebuild the video after changing the synthetic fixture or presentation:

```bash
bash scripts/render-video.sh
```

The video is generated from the actual structured CLI output. It illustrates the safe demo; it does not show live provider delivery.
