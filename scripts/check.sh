#!/usr/bin/env bash
# Local quality gate. This is what a CI job would call; there is deliberately no hosted CI.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n\033[1m▶ %s\033[0m\n' "$1"; }

step "tsc";        npx tsc -b
step "oxlint";     npx oxlint src api server scripts
step "vitest";     npx vitest run
step "build";      npm run build
# BUDGET_SOFT=1 only for a local experiment; the gate is hard.
step "budget";     BUDGET_SOFT="${BUDGET_SOFT:-0}" node scripts/bundle-budget.mjs
step "api smoke";  node scripts/api-smoke.mjs
if [ "${SKIP_E2E:-0}" != "1" ]; then
  step "playwright"; npx playwright test
fi
printf '\n\033[32m✓ all checks passed\033[0m\n'
