# ForgeFlow — Demo / Presentation Video — Spec

Date: 2026-06-11

> Historical storyboard. Updated on 2026-11-25: the rendered video presents the credential-free demo, shared deterministic rules, eight synthetic jobs and two alert previews at reference date 2026-06-11. It reads structured CLI output; external integrations are shown as a disabled, unverified template. See [README](../../README.md) for the current run and verification commands. Original PM-owned video gate remains unchanged.

Owner: Patrik (SYNAPTIC FORGE) — PM: Claude, Builder: Codex (codex-runner)

## Goal

A polished ~45–75s presentation video that sells ForgeFlow as a proof asset.
Goes on the GitHub repo, n8n Markets / Contra / Upwork profile. It must look
**at a professional level** — clean type, smooth motion, on-brand, no AI-slop.

## Important honesty constraint

This video is built from the REAL ForgeFlow assets — do NOT fabricate results.
The classification/routing shown must be the ACTUAL output of
`bash scripts/mock-run.sh` over `sample-data/jobs.csv`. J-1002 (overdue) and
J-1005 (line-stoppage) must visibly land as ALERT; the rest as BOARD. The video
demonstrates the design + real routing logic; it does not claim a live API run.

## Tool choice — builder decides

Pick the best tool available and wrap it in `scripts/render-video.sh` so the
mp4 regenerates reproducibly. Local tooling present: node 22, npm/npx, ffmpeg,
chromium + google-chrome, python3. Reasonable options:
- **Remotion** (React → mp4) — best motion/typography control. Recommended.
- HTML/CSS slides → Playwright/Chromium screenshots → ffmpeg.
- ffmpeg-only slide deck with xfade transitions.
Whatever is chosen, source lives in `video/`, output is `media/forgeflow-demo.mp4`.

## Storyboard (target ~60s)

1. **00:00–00:06 Title** — "ForgeFlow" + "CNC Production Job Tracker" + small
   "by SYNAPTIC FORGE". Dark, industrial-clean. Subtle motion.
2. **00:06–00:18 Problem** — spreadsheets + missed due dates + line stoppage.
   1–2 short lines, not a wall of text.
3. **00:18–00:34 Architecture** — animate the flow: Webhook/Job → Claude
   classify → Switch (milling/turning/laser/edm) → Sheets board → IF → Telegram.
4. **00:34–00:52 Real run** — the actual mock-run routing table animates in;
   J-1002 & J-1005 highlight red as ALERT, others green as BOARD.
5. **00:52–01:00 Close** — "n8n + Claude. Built solo via a Claude + Codex
   pipeline." + contact/handle. CTA.

## Deliverables (Codex builds)

| Path | What |
|---|---|
| `video/` | Source project (Remotion comp or slides + assets) |
| `scripts/render-video.sh` | One command -> renders `media/forgeflow-demo.mp4` |
| `media/forgeflow-demo.mp4` | Final video, 720p+ (1920x1080 preferred), 25–120s |

## Gate

`scripts/gate-video.sh` (PM-owned, do NOT edit) validates via ffprobe: file
exists, real video stream, width >= 1280, duration 25–120s, reproducible render
script + `video/` source present, no secrets. Content quality = judge + Patrik.

## Out of scope

- Voiceover / music (optional; captions are enough). No stock-footage filler.
- Real live-API screen capture: separate step, needs Patrik's keys.
