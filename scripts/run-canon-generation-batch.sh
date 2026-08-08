#!/usr/bin/env bash
set -euo pipefail

BOOKS="$1"
MAX_CHAPTERS="$2"
LABEL="${3:-canon batch}"
MAX_REPAIR_ATTEMPTS="${SCRIPTURE_RETRY_ATTEMPTS:-6}"
CHUNK_SIZE="${SCRIPTURE_CHUNK_SIZE:-5}"
GENERATED_TOTAL=0
REPAIR_ATTEMPT=0

commit_progress() {
  node scripts/build-library-index.mjs
  node scripts/validate-generated-canon.mjs --books="$BOOKS"

  git config user.name "github-actions[bot]"
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
  # The workflow marks the OpenAI shim executable before generation. Stage that
  # mode change too so checkpoint commits leave a clean worktree for rebase.
  git add scripture metadata/library-index.json metadata/generation-state.json metadata/*-progress.json scripts/github-models-copilot-shim.mjs

  if ! git diff --cached --quiet; then
    GENERATED=$(node -e "const s=JSON.parse(require('fs').readFileSync('metadata/generation-state.json','utf8')); console.log(s.generatedThisRun || 0)")
    LAST=$(node -e "const s=JSON.parse(require('fs').readFileSync('metadata/generation-state.json','utf8')); console.log(s.lastChapter || 'none')")
    git commit -m "Generate ${GENERATED} scripture chapters (${LABEL}) through ${LAST}"
    git pull --rebase origin main
    git push
  else
    echo "No batch changes to commit"
  fi
}

while [ "$GENERATED_TOTAL" -lt "$MAX_CHAPTERS" ]; do
  REMAINING=$((MAX_CHAPTERS - GENERATED_TOTAL))
  REQUEST_SIZE="$CHUNK_SIZE"
  if [ "$REMAINING" -lt "$REQUEST_SIZE" ]; then REQUEST_SIZE="$REMAINING"; fi

  echo "Generating next checkpoint chunk for ${LABEL}: up to ${REQUEST_SIZE} chapters"
  node scripts/generate-missing-canon.mjs --books="$BOOKS" --max-chapters="$REQUEST_SIZE"
  commit_progress

  GENERATED=$(node -e "const s=JSON.parse(require('fs').readFileSync('metadata/generation-state.json','utf8')); console.log(Number(s.generatedThisRun || 0))")
  ERROR=$(node -e "const s=JSON.parse(require('fs').readFileSync('metadata/generation-state.json','utf8')); process.stdout.write(s.error || '')")
  GENERATED_TOTAL=$((GENERATED_TOTAL + GENERATED))

  if [ -z "$ERROR" ]; then
    REPAIR_ATTEMPT=0
    if [ "$GENERATED" -lt "$REQUEST_SIZE" ]; then
      echo "${LABEL} has no more missing chapters. Generated ${GENERATED_TOTAL} chapters in this job."
      exit 0
    fi
    echo "Checkpoint committed; continuing ${LABEL} automatically."
    continue
  fi

  if echo "$ERROR" | grep -Eqi 'quota|credit limit|premium request|usage limit|rate limit|too many requests|exceeded|HTTP 429|Models 429'; then
    echo "Generator stopped on account/model quota after preserving validated work: $ERROR" >&2
    exit 1
  fi

  if echo "$ERROR" | grep -Eqi 'JSON|double-quoted property|Unexpected token|Unexpected end|verse alignment|expected .* verses|missing restored|missing mystical|validator'; then
    REPAIR_ATTEMPT=$((REPAIR_ATTEMPT + 1))
    if [ "$REPAIR_ATTEMPT" -ge "$MAX_REPAIR_ATTEMPTS" ]; then
      echo "Generator exhausted ${MAX_REPAIR_ATTEMPTS} automatic repair attempts after preserving validated work: $ERROR" >&2
      exit 1
    fi
    echo "Recoverable model-output error; regenerating the same missing chapter automatically (${REPAIR_ATTEMPT}/${MAX_REPAIR_ATTEMPTS}): $ERROR" >&2
    continue
  fi

  echo "Generator stopped after preserving validated work: $ERROR" >&2
  exit 1
done

echo "${LABEL} reached its configured generation cap (${MAX_CHAPTERS})."
