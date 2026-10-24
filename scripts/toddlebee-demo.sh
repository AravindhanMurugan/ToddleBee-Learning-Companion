#!/usr/bin/env bash
set -euo pipefail

base_url="${TODDLEBEE_BASE_URL:-}"
if [[ -z "$base_url" && -n "${REPLIT_DEV_DOMAIN:-}" ]]; then
  base_url="https://${REPLIT_DEV_DOMAIN}"
fi
if [[ -z "$base_url" ]]; then
  echo "Set TODDLEBEE_BASE_URL or run this inside Replit with REPLIT_DEV_DOMAIN set." >&2
  exit 2
fi

base_url="${base_url%/}"
api_url="${base_url}/api"

echo "ToddleBee read-only demo check: ${base_url}"
printf 'API health: '
curl --fail --silent --show-error "${api_url}/health"
printf '\nEnglish questions: '
curl --fail --silent --show-error "${api_url}/quiz/questions?language=en"
printf '\nTamil questions: '
curl --fail --silent --show-error "${api_url}/quiz/questions?language=ta"
printf '\nNarration availability: '
curl --fail --silent --show-error "${api_url}/audio/voices"
printf '\n\nOpen the app and follow the interactive flow in README.md for lesson, quiz, progress, and educator review.\n'
