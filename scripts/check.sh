#!/usr/bin/env bash
# Local quality gate. This is what a CI job would call; there is deliberately no hosted CI.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n\033[1m▶ %s\033[0m\n' "$1"; }

step "tsc";        npx tsc -b
step "oxlint";     npx oxlint src api scripts
step "vitest";     npx vitest run
step "build";      npm run build
# BUDGET_SOFT defaults to 1 until Task 26 archives the legacy app; then flip to 0.
step "budget";     BUDGET_SOFT="${BUDGET_SOFT:-1}" node scripts/bundle-budget.mjs
if [ "${SKIP_E2E:-0}" != "1" ]; then
  step "playwright"; npx playwright test
fi
printf '\n\033[32m✓ all checks passed\033[0m\n'
