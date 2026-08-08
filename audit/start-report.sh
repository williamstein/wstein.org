#!/usr/bin/env bash
set -euo pipefail

REPORT_DIR="/home/user/wstein-site-audit/report"
PORT="${PORT:-8081}"
PID_FILE="/home/user/wstein-site-audit/.report-server.pid"
LOG_FILE="/home/user/wstein-site-audit/.report-server.log"

if [[ -f "$PID_FILE" ]]; then
  PID="$(<"$PID_FILE")"
  if kill -0 "$PID" 2>/dev/null; then
    echo "Audit report is already running on port $PORT (pid $PID)."
    exit 0
  fi
  rm -f "$PID_FILE"
fi

if [[ ! -f "$REPORT_DIR/index.html" ]]; then
  echo "No report found. Run 'npm run audit' first." >&2
  exit 1
fi

setsid python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$REPORT_DIR" \
  >"$LOG_FILE" 2>&1 < /dev/null &
PID="$!"
echo "$PID" > "$PID_FILE"

sleep 0.2
if ! kill -0 "$PID" 2>/dev/null; then
  echo "Report server failed to start; see $LOG_FILE." >&2
  exit 1
fi

echo "Audit report: http://127.0.0.1:$PORT/"
