# Oneness Scripture Data Workplan

## Immediate Corpus

Complete the following books for the first database foundation:

1. Genesis 1-50
2. Job 1-42
3. Matthew 1-28
4. John 1-21
5. Revelation 1-22

## Required Layers for Each Chapter

Each chapter needs two aligned files:

### Source-audited restored file

Path pattern:

```text
scripture/<book>/<book>-NNN.json
```

Required fields:

- book
- book_id
- chapter
- audit_status
- verses
- restored
- familiar KJV comparison
- notes
- terms
- tags

### Mystical companion file

Path pattern:

```text
scripture/<book>/mystical/<book>-NNN-mystical.json
```

Required fields:

- book
- book_id
- chapter
- layer: mystical_translation
- relationship_to_restored_text
- verses
- mystical_translation

## Status Levels

- restored-draft
- source-audited-draft
- source-critical

Default target for this phase:

```text
source-audited-draft
```

## Current Status

Completed:

- Genesis 1 restored source-audited draft
- Genesis 2 restored source-audited draft
- Genesis 3 restored source-audited draft
- Genesis 1 mystical translation
- Genesis 2 mystical translation
- Genesis 3 mystical translation

Next:

- Finish Genesis 4 restored source-audited draft
- Add Genesis 4 mystical translation
- Continue Genesis 5-50
- Then Job
- Then Matthew
- Then John
- Then Revelation

## Translation Rules

1. Do not do keyword replacement.
2. Translate the whole verse.
3. Check major source-language terms.
4. Preserve hard wording when the source is hard.
5. Put interpretation into notes, not into the literal line.
6. Keep mystical translation separate from restored translation.
7. Update metadata/progress.json after each batch.

## Batch Strategy

Recommended batches:

1. Genesis 4-11: Cain, violence, lineages, flood, covenant, Babel.
2. Genesis 12-25: Abraham cycle.
3. Genesis 26-36: Isaac, Jacob, Esau, lineage material.
4. Genesis 37-50: Joseph cycle.
5. Job 1-14.
6. Job 15-31.
7. Job 32-42.
8. Matthew 1-7.
9. Matthew 8-14.
10. Matthew 15-21.
11. Matthew 22-28.
12. John 1-7.
13. John 8-14.
14. John 15-21.
15. Revelation 1-7.
16. Revelation 8-14.
17. Revelation 15-22.

## Important Principle

The source-audited restored translation is the textual anchor. The mystical layer is the living contemplative reading. Both are valuable, but they must remain clearly labeled.
