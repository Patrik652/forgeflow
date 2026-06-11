# ForgeFlow CNC Production Job Tracker

ForgeFlow is a public proof asset for an n8n automation that triages CNC production jobs, classifies schedule risk with Claude, updates a Google Sheets production board, and alerts Telegram only when a job is late or high priority.

## Problem

Small CNC and manufacturing shops often triage jobs from spreadsheets and inboxes. A foreman may only notice a late shaft, bracket, or mold insert after the customer escalates. That creates missed due dates, line stoppages, and no single production board that sales, planning, and the shop floor can trust.

ForgeFlow shows the fix in one workflow: every incoming job is normalized, classified, routed to the right work center, written to a status board, and escalated only when attention is needed.

## Architecture

```text
Webhook job payload      Manual demo trigger
        |                       |
        +----------+------------+
                   |
             Normalize job
                   |
     Claude / Anthropic classifier
                   |
     priority + eta_risk + machine_type
                   |
          Switch by machine_type
       milling | turning | laser | edm
                   |
        Google Sheets status board
                   |
       IF late OR high priority?
              yes / no
              |     |
       Telegram    Board only
```

The live n8n workflow is in `workflows/forgeflow-job-tracker.json`. The offline mock runner uses the same deterministic routing contract without calling Anthropic, Google, Telegram, or n8n.

## Quickstart / Run

Run the offline proof:

```bash
bash scripts/mock-run.sh
```

Validate the workflow JSON:

```bash
bash scripts/validate.sh
```

Run the deterministic gate:

```bash
bash scripts/gate.sh
```

Launch n8n locally:

```bash
cp .env.example .env
docker compose up -d
```

Open `http://localhost:5678`, import `workflows/forgeflow-job-tracker.json`, then create credentials for Anthropic, Google Sheets, and Telegram. The `.env` file is for local demo credentials only and must never be committed.

## Stack

- n8n workflow automation
- Anthropic Claude classifier node
- Google Sheets production status board
- Telegram exception alerts
- Bash + `jq` validation
- Docker Compose local demo

## Demo Data

`sample-data/jobs.csv` contains eight CNC jobs across milling, turning, laser, and EDM. The offline run must flag `J-1002` and `J-1005` as `ALERT` because they are overdue and/or high priority.

## Screenshot Placeholders

- `screenshots/01-workflow-canvas.png` - imported n8n workflow canvas
- `screenshots/02-google-sheet-board.png` - production board after sample run
- `screenshots/03-telegram-alert.png` - late/high-priority alert message
