#!/usr/bin/env bash
set -euo pipefail

BOOKS="$1"
MAX_CHAPTERS="$2"
LABEL="${3:-canon batch}"
MAX_ATTEMPTS="${SCRIPTURE_RETRY_ATTEMPTS:-6}"

commit_progress() {
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
}

for ATTEMPT in $(seq 1 "$MAX_ATTEMPTS"); do
  echo "Generation attempt ${ATTEMPT}/${MAX_ATTEMPTS} for ${LABEL}"
  node scripts/generate-missing-canon.mjs --books="$BOOKS" --max-chapters="$MAX_CHAPTERS"
  commit_progress

  ERROR=$(node -e "const s=JSON.parse(require('fs').readFileSync('metadata/generation-state.json','utf8')); process.stdout.write(s.error || '')")
  if [ -z "$ERROR" ]; then
    echo "${LABEL} completed with no generator error."
    exit 0
  fi

  if echo "$ERROR" | grep -Eqi 'quota|credit limit|premium request|usage limit|rate limit|too many requests|exceeded'; then
    echo "Generator stopped on account/model quota after preserving validated work: $ERROR" >&2
    exit 1
  fi

  if echo "$ERROR" | grep -Eqi 'JSON|double-quoted property|Unexpected token|Unexpected end|verse alignment|expected .* verses|missing restored|missing mystical|validator'; then
    echo "Recoverable model-output error; regenerating the same missing chapter automatically: $ERROR" >&2
    continue
  fi

  echo "Generator stopped after preserving validated work: $ERROR" >&2
  exit 1
done

ERROR=$(node -e "const s=JSON.parse(require('fs').readFileSync('metadata/generation-state.json','utf8')); process.stdout.write(s.error || 'unknown recoverable generation failure')")
echo "Generator exhausted ${MAX_ATTEMPTS} automatic repair attempts after preserving validated work: $ERROR" >&2
exit 1
