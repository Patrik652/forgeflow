#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

CSV="${1:-sample-data/jobs.csv}"
TODAY="${FORGEFLOW_TODAY:-2026-06-11}"

if [ ! -f "$CSV" ]; then
  echo "mock-run: missing input CSV: $CSV" >&2
  exit 1
fi

printf 'ForgeFlow mock run (offline Claude stub)\n'
printf 'Input: %s | Today: %s\n\n' "$CSV" "$TODAY"
printf '%-8s | %-10s | %-7s | %-11s | %-8s | %-9s | %s\n' \
  "JOB" "MACHINE" "ROUTE" "ETA_RISK" "PRIORITY" "ACTION" "REASON"
printf '%s\n' '---------+------------+---------+-------------+----------+-----------+------------------------------------------'

awk -F',' -v today="$TODAY" '
NR == 1 { next }
{
  job_id=$1
  material=$3
  qty=$4 + 0
  due_date=$5
  machine=tolower($6)
  customer=$7
  notes=$8
  notes_lc=tolower(notes)

  eta_risk="on_track"
  if (due_date < today) {
    eta_risk="late"
  } else if (notes_lc ~ /at-risk|at risk|capacity/ || due_date == today) {
    eta_risk="at_risk"
  }

  priority="medium"
  if (notes_lc ~ /high priority|line stoppage|escalated|overdue/) {
    priority="high"
  } else if (notes_lc ~ /low priority/) {
    priority="low"
  }

  route=machine
  if (route == "milling") {
    work_center="MILL"
  } else if (route == "turning") {
    work_center="LATHE"
  } else if (route == "laser") {
    work_center="LASER"
  } else if (route == "edm") {
    work_center="EDM"
  } else {
    work_center="REVIEW"
  }

  action="BOARD"
  if (eta_risk == "late" || priority == "high") {
    action="ALERT"
  }

  reason=sprintf("%s for %s; due %s; %s", material, customer, due_date, notes)
  printf "%-8s | %-10s | %-7s | %-11s | %-8s | %-9s | %s\n", job_id, machine, work_center, eta_risk, priority, action, reason
}
' "$CSV"
