#!/usr/bin/env bash
#
# Push every variable from .env.local into your Vercel project.
# Your secrets stay on your machine — they go straight from .env.local to Vercel.
#
# Usage:
#   1. vercel login          # authenticate (opens browser)
#   2. vercel link           # link this folder to your Vercel project
#   3. bash scripts/push-env-to-vercel.sh
#
# By default it targets production, preview, and development. Existing values
# are overwritten (removed then re-added), so the script is safe to re-run.

set -euo pipefail

ENV_FILE="$(dirname "$0")/../.env.local"
TARGETS=(production preview development)

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ $ENV_FILE not found. Fill it in first."
  exit 1
fi

if ! vercel whoami >/dev/null 2>&1; then
  echo "❌ Not logged in. Run: vercel login"
  exit 1
fi

PROJ_DIR="$(dirname "$0")/.."
if [[ ! -f "$PROJ_DIR/.vercel/project.json" && ! -f "$PROJ_DIR/.vercel/repo.json" ]]; then
  echo "❌ Project not linked. Run: vercel link"
  exit 1
fi

pushed=0
while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip blanks and comments.
  [[ -z "${line// }" ]] && continue
  [[ "${line#\#}" != "$line" ]] && continue
  # Split on the FIRST '=' only (values may contain '=' or spaces).
  key="${line%%=*}"
  value="${line#*=}"
  key="${key// /}"
  [[ -z "$key" ]] && continue
  # Skip Vercel's own system vars (e.g. the OIDC token it writes into .env.local).
  [[ "$key" == VERCEL_* ]] && continue

  echo "→ $key"
  for target in "${TARGETS[@]}"; do
    # Remove any existing value (ignore error if absent), then add.
    vercel env rm "$key" "$target" --yes >/dev/null 2>&1 || true
    printf '%s' "$value" | vercel env add "$key" "$target" >/dev/null 2>&1 \
      && echo "   ✓ $target" \
      || echo "   ✗ $target (failed)"
  done
  pushed=$((pushed + 1))
done < "$ENV_FILE"

echo ""
echo "✅ Pushed $pushed variables. Trigger a redeploy for them to take effect:"
echo "   vercel --prod"
