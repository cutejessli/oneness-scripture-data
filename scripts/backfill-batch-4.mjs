import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const BOOKS = {
  job: {
    source: "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/Job.json",
    language: "Hebrew",
  },
  matthew: {
    source: "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/Matthew.json",
    language: "Greek",
  },
  mark: {
    source: "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/Mark.json",
    language: "Greek",
  },
  luke: {
    source: "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/Luke.json",
    language: "Greek",
  },
};

const TAG_RULES = [
  [/\bwar|battle|army|armies|soldier|sword|slain|slew|killed|kill|smote|struck\b/i, "war-violence"],
  [/\bking|reign|throne|royal|crown\b/i, "kingship-power"],
  [/\bpriest|prophet|apostle|disciple|teacher|rabbi\b/i, "religious-authority"],
  [/\btemple|synagogue|sanctuary|holy place\b/i, "sacred-space"],
  [/\bwife|wives|daughter|daughters|sister|woman|women|widow\b/i, "women-gender"],
  [/\bservant|servants|slave|slaves|bondservant\b/i, "labor-power"],
  [/\bforeigner|foreigners|stranger|strangers|sojourner|sojourners|gentile|gentiles\b/i, "foreigner-migrant"],
  [/\boffering|sacrifice|altar\b/i, "sacrifice-worship"],
  [/\bcovenant\b/i, "covenant"],
  [/\bspirit\b/i, "spirit"],
  [/\bpoor|poverty|beggar|hungry|hunger\b/i, "poverty-economic-justice"],
  [/\bchild|children|son|sons|daughter|daughters\b/i, "family-lineage"],
  [/\bheal|healed|healing|sick|disease|blind|lame|leper|leprosy\b/i, "healing-disability"],
];

const FLAG_RULES = [
  [/\bwar|battle|slain|slew|killed|kill|sword|smote|struck\b/i, "violence-description-not-endorsement"],
  [/\bservant|servants|slave|slaves|bondservant\b/i, "labor-power-audit"],
  [/\bwife|wives|daughter|daughters|woman|women|widow\b/i, "gender-power-audit"],
  [/\bforeigner|foreigners|stranger|strangers|sojourner|sojourners|gentile|gentiles\b/i, "migrant-dignity"],
  [/\bking|throne|anointed|messiah\b/i, "leader-accountability"],
  [/\bprophet|apostle|teacher|rabbi\b/i, "spiritual-authority-audit"],
  [/\bblind|lame|disease|diseased|leper|leprosy|sick\b/i, "disability-illness-nonstigmatizing"],
];

const GREEK_TERM_RULES = [
  [/\bMessiah\b/i, { display: "Messiah", source: "Christos", language: "Greek", glossary_id: "christos", transliteration: "Christos" }],
  [/\bSpirit\b/i, { display: "Spirit", source: "pneuma", language: "Greek", glossary_id: "pneuma", transliteration: "pneuma" }],
  [/\bkingdom\b/i, { display: "kingdom", source: "basileia", language: "Greek", glossary_id: "basileia", transliteration: "basileia" }],
  [/\bking\b/i, { display: "king", source: "basileus", language: "Greek", glossary_id: "basileus", transliteration: "basileus" }],
  [/\bdisciple\b/i, { display: "disciple", source: "mathetes", language: "Greek", glossary_id: "mathetes", transliteration: "mathetes" }],
  [/\bgospel|good news\b/i, { display: "good news", source: "euangelion", language: "Greek", glossary_id: "euangelion", transliteration: "euangelion" }],
];

const HEBREW_TERM_RULES = [
  [/\bthe Divine\b/i, { display: "the Divine", source: "Elohim", language: "Hebrew", glossary_id: "elohim", transliteration: "Elohim" }],
  [/\bspirit\b/i, { display: "spirit", source: "ruach", language: "Hebrew", glossary_id: "ruach", transliteration: "ruach" }],
  [/\bheart\b/i, { display: "heart", source: "lev", language: "Hebrew", glossary_id: "lev", transliteration: "lev" }],
];

function uniqBy(values, keyFn) {
  const seen = new Set();
  return values.filter((value) => {
    const key = keyFn(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchKjv(url, bookId) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`KJV fetch failed for ${bookId}: ${response.status}`);
  return response.json();
}

function addTerms(verse, language) {
  verse.terms ??= [];
  const rules = language === "Greek" ? GREEK_TERM_RULES : HEBREW_TERM_RULES;
  const additions = [];
  for (const [re, term] of rules) if (re.test(verse.restored || "")) additions.push(term);
  verse.terms = uniqBy([...verse.terms, ...additions], (item) => `${item.language}|${item.source}|${item.glossary_id}`);
}

function addTags(verse) {
  verse.tags ??= [];
  for (const [re, tag] of TAG_RULES) if (re.test(verse.restored || "") && !verse.tags.includes(tag)) verse.tags.push(tag);
}

function addFlags(verse) {
  verse.editorial_flags ??= [];
  for (const [re, flag] of FLAG_RULES) if (re.test(verse.restored || "") && !verse.editorial_flags.includes(flag)) verse.editorial_flags.push(flag);
}

function layerState(verses, key, predicate = (v) => (v[key] || []).length > 0) {
  const count = verses.filter(predicate).length;
  if (count === verses.length && count > 0) return "present-all-verses";
  if (count > 0) return `partial-${count}-of-${verses.length}`;
  return "pending-deep-backfill";
}

async function backfillBook(bookId, config) {
  const dir = path.join(root, "scripture", bookId);
  if (!fs.existsSync(dir)) throw new Error(`Missing scripture directory: ${dir}`);
  const files = fs.readdirSync(dir).filter((name) => new RegExp(`^${bookId}-(\\d{3})\\.json$`).test(name)).sort();
  const kjv = await fetchKjv(config.source, bookId);
  const kjvByChapter = new Map(kjv.chapters.map((c) => [Number(c.chapter), c]));
  let changed = 0;
  let scanned = 0;

  for (const file of files) {
    const filename = path.join(dir, file);
    const chapter = JSON.parse(fs.readFileSync(filename, "utf8").replace(/^\uFEFF/, ""));
    const before = JSON.stringify(chapter);
    const familiarChapter = kjvByChapter.get(Number(chapter.chapter));
    if (!familiarChapter) throw new Error(`Missing familiar chapter ${bookId} ${chapter.chapter}`);
    const familiar = new Map(familiarChapter.verses.map((v) => [Number(v.verse), v.text]));

    for (const verse of chapter.verses ?? []) {
      const text = familiar.get(Number(verse.verse));
      if (text && !verse.familiar) verse.familiar = { source: "KJV", text };
      verse.notes ??= [];
      verse.cross_references ??= [];
      addTerms(verse, config.language);
      addTags(verse);
      addFlags(verse);
      scanned += 1;
    }

    const verses = chapter.verses ?? [];
    chapter.layer_status = {
      ...(chapter.layer_status ?? {}),
      restored: true,
      familiar: verses.length > 0 && verses.every((v) => v.familiar?.text) ? "complete" : "partial",
      verse_notes: layerState(verses, "notes"),
      source_terms: layerState(verses, "terms"),
      tags: layerState(verses, "tags"),
      cross_references: layerState(verses, "cross_references"),
      editorial_flags: layerState(verses, "editorial_flags"),
      mystical_companion: "separate-file",
    };
    chapter.backfill_status = {
      ...(chapter.backfill_status ?? {}),
      status: "baseline-rich-layer-backfilled",
      basis: "Genesis-style verse schema",
      preserved_restored_text: true,
      familiar_layer: "complete-when-source-aligned",
      source_language: config.language,
      deeper_linguistic_notes: "continue-in-deep-backfill-pass",
      batch_version: 4,
    };

    if (JSON.stringify(chapter) !== before) {
      fs.writeFileSync(filename, `${JSON.stringify(chapter, null, 2)}\n`);
      changed += 1;
    }
  }

  console.log(`${bookId}: ${changed} chapter files changed; ${scanned} verses scanned`);
}

for (const [bookId, config] of Object.entries(BOOKS)) await backfillBook(bookId, config);
