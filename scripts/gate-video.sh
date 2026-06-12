#!/usr/bin/env bash
# =============================================================================
# PM-OWNED VIDEO GATE — Codex MUST NOT modify this file.
# Produce the deliverable until this prints GATE OK. Editing it = task failure.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

MP4=media/forgeflow-demo.mp4
fail() { echo "VIDEO GATE FAIL: $1" >&2; exit 1; }

# 1) deliverables exist
[ -f "$MP4" ]                  || fail "missing $MP4"
[ -f scripts/render-video.sh ] || fail "missing scripts/render-video.sh (video must be reproducible from source)"
[ -d video ]                   || fail "missing video/ source project (composition lives here)"

command -v ffprobe >/dev/null  || fail "ffprobe not available to validate the video"

# 2) real video stream  (default=nokey avoids the csv trailing-comma trap)
ct=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_type -of default=nokey=1:noprint_wrappers=1 "$MP4" 2>/dev/null | head -1 || true)
[ "$ct" = "video" ] || fail "$MP4 has no video stream"

# 3) resolution width >= 1280 (720p+)
w=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of default=nokey=1:noprint_wrappers=1 "$MP4" 2>/dev/null | head -1 || echo 0)
[ "${w:-0}" -ge 1280 ] || fail "video width ${w}px < 1280 (need 720p+, e.g. 1280x720 or 1920x1080)"

# 4) duration between 25s and 120s
dur=$(ffprobe -v error -show_entries format=duration -of default=nokey=1:noprint_wrappers=1 "$MP4" 2>/dev/null | head -1 || echo 0)
ok=$(awk -v d="$dur" 'BEGIN{ print (d>=25 && d<=120) ? "1" : "0" }')
[ "$ok" = "1" ] || fail "video duration ${dur}s not in 25..120s window"

# 5) no secrets committed
if git ls-files 2>/dev/null | grep -qE '(^|/)\.env$'; then fail ".env must never be committed"; fi
if git ls-files 2>/dev/null | xargs -r grep -lE 'sk-ant-[a-zA-Z0-9]{8,}' 2>/dev/null | grep -vq '.env.example'; then
  fail "a real Anthropic key is committed in a tracked file"
fi

echo "GATE OK"
echo "  video: ${w}px wide, ${dur}s, $MP4"
