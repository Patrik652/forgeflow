# ForgeFlow — CNC Production Job Tracker (n8n + Claude) — Design

Date: 2026-06-11
Owner: Patrik (SYNAPTIC FORGE)
Purpose: **Public proof asset** that closes the "no n8n portfolio" gap. Unlocks
Upwork n8n proposals + the inbound-platform pivot (n8n Markets / Contra /
Freelancermap). Showcases the CNC/manufacturing edge + Claude as differentiator.

## Problem (the story we sell)

Small CNC / manufacturing shops triage incoming production jobs by hand:
spreadsheets, gut-feel priority, and a foreman who only notices a late job when
the customer calls. Result: missed due dates, line stoppages, no single board.

## Solution — one n8n workflow

```
Trigger:  Webhook (single job)  +  Manual trigger -> read sample-data/jobs.csv (batch)
   |
Claude (Anthropic node): classify each job ->
        { priority: low|medium|high, machine_type, eta_risk: on_track|at_risk|late }
        Reasoning uses due_date vs today, qty, material, and notes.
   |
Switch: route by machine_type -> work-center (milling | turning | laser | edm)
   |
Google Sheets: upsert a status row onto the board (one row per job_id)
   |
IF (eta_risk == late) OR (priority == high):  Telegram alert   else: no alert
```

## Components / deliverables (Codex builds)

| Path | What |
|---|---|
| `workflows/forgeflow-job-tracker.json` | Valid, importable n8n workflow implementing the flow above |
| `scripts/validate.sh` | Validate workflow JSON + (best-effort) `n8n import:workflow` dry run |
| `scripts/mock-run.sh` | **Offline** end-to-end run on `sample-data/jobs.csv` with a STUBBED Claude classifier (no live keys). Prints the routing table and must surface the late/high-priority jobs as ALERT rows |
| `docker-compose.yml` | One-command local n8n (so Patrik can import + record the live demo) |
| `README.md` | Problem, Architecture (ASCII), Quickstart/Run, Stack, screenshot placeholders |
| `.env.example` | Already scaffolded — document required creds |
| `sample-data/jobs.csv` | Already scaffolded — 8 realistic jobs incl. overdue + high-priority |

## Mock-run contract (so the gate is meaningful)

`scripts/mock-run.sh` runs fully offline. It parses `sample-data/jobs.csv`,
applies a deterministic stub classifier (same rules Claude would apply:
`due_date < today` => late; notes containing "high priority"/"line stoppage"/
"escalated"/"OVERDUE" => high), routes by `requested_machine`, and prints a
table. Jobs J-1002 (overdue) and J-1005 (high priority) MUST appear as ALERT.
The stub stands in for Claude so CI/the gate never needs a live API key; the
real workflow uses the Anthropic node.

## Deterministic gate

`scripts/gate.sh` (PM-owned, do NOT edit) enforces: valid workflow JSON,
required node categories (webhook, Claude/Anthropic, switch/if, sheets,
telegram), all deliverable files present, README sections present, no secrets
committed. Plus `mock-run.sh` must exit 0 and output an ALERT line.

## Out of scope (YAGNI)

- No real CRM, no auth, no multi-tenant. One workflow, one board, one alert path.
- Notion sync, dashboards, analytics: later, only if a client asks.
- Live API keys + 60s demo video: Patrik's manual step after the build passes.
