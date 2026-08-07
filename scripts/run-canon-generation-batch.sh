#!/usr/bin/env bash
set -euo pipefail

BOOKS="$1"
MAX_CHAPTERS="$2"
LABEL="${3:-canon batch}"

node scripts/generate-missing-canon.mjs --books="$BOOKS" --max-chapters="$MAX_CHAPTERS"
node scripts/build-library-index.mjs
node scripts/validate-generated-canon.mjs --books="$BOOKS"

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add scripture metadata/library-index.json metadata/generation-state.json metadata/*-progress.json

if ! git diff --cached --quiet; then
  GENERATED=$(node -e "const s=JSON.parse(require('fs').readFileSync('metadata/generation-state.json','utf8')); console.log(s.generatedThisRun || 0)")
  LAST=$(node -e "const s=JSON.parse(require('fs').readFileSync('metadata/generation-state.json','utf8')); console.log(s.lastChapter || 'none')")
  git commit -m "Generate ${GENERATED} scripture chapters (${LABEL}) through ${LAST}"
  git push
else
  echo "No batch changes to commit"
fi

ERROR=$(node -e "const s=JSON.parse(require('fs').readFileSync('metadata/generation-state.json','utf8')); process.stdout.write(s.error || '')")
if [ -n "$ERROR" ]; then
  echo "Generator stopped after preserving validated work: $ERROR" >&2
  exit 1
fi
