import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const BOOKS = {
  genesis: ["Genesis.json", "Hebrew"],
  ephesians: ["Ephesians.json", "Greek"],
  philippians: ["Philippians.json", "Greek"],
  colossians: ["Colossians.json", "Greek"],
  "1-thessalonians": ["1Thessalonians.json", "Greek"],
  "2-thessalonians": ["2Thessalonians.json", "Greek"],
  "1-timothy": ["1Timothy.json", "Greek"],
  "2-timothy": ["2Timothy.json", "Greek"],
  titus: ["Titus.json", "Greek"],
  philemon: ["Philemon.json", "Greek"],
  hebrews: ["Hebrews.json", "Greek"],
  james: ["James.json", "Greek"],
  "1-peter": ["1Peter.json", "Greek"],
  "2-peter": ["2Peter.json", "Greek"],
  "1-john": ["1John.json", "Greek"],
  "2-john": ["2John.json", "Greek"],
  "3-john": ["3John.json", "Greek"],
  jude: ["Jude.json", "Greek"],
  revelation: ["Revelation.json", "Greek"],
};

const BASE = "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/";

const TAG_RULES = [
  [/\bking|kingdom|reign|throne|crown\b/i, "kingship-power"],
  [/\bpriest|prophet|apostle|teacher|elder|overseer\b/i, "religious-authority"],
  [/\btemple|sanctuary|holy place|assembly|church\b/i, "sacred-community"],
  [/\bwife|wives|daughter|daughters|sister|woman|women|widow\b/i, "women-gender"],
  [/\bservant|servants|slave|slaves|bondservant\b/i, "labor-power"],
  [/\bforeigner|stranger|sojourner|gentile|nations\b/i, "foreigner-migrant"],
  [/\bspirit\b/i, "spirit"],
  [/\blove\b/i, "love"],
  [/\bfaith|trust|believe|believing\b/i, "trust-faith"],
  [/\bpoor|poverty|rich|wealth|money\b/i, "economic-justice"],
  [/\bchild|children|son|sons|daughter|daughters\b/i, "family-lineage"],
  [/\bheal|healed|healing|sick|disease|blind|lame\b/i, "healing-disability"],
  [/\bwar|battle|sword|slain|killed|kill|death\b/i, "violence-death"],
];

const FLAG_RULES = [
  [/\bwar|battle|sword|slain|killed|kill\b/i, "violence-description-not-endorsement"],
  [/\bservant|servants|slave|slaves|bondservant\b/i, "labor-power-audit"],
  [/\bwife|wives|daughter|daughters|woman|women|widow\b/i, "gender-power-audit"],
  [/\bforeigner|stranger|sojourner|gentile|nations\b/i, "migrant-dignity"],
  [/\bking|throne|anointed|messiah|elder|overseer\b/i, "leader-accountability"],
  [/\bprophet|apostle|teacher\b/i, "spiritual-authority-audit"],
  [/\bblind|lame|disease|sick\b/i, "disability-illness-nonstigmatizing"],
];

const GREEK_TERM_RULES = [
  [/\bMessiah\b/i, { display:"Messiah", source:"Christos", language:"Greek", glossary_id:"christos", transliteration:"Christos" }],
  [/\bSpirit\b/i, { display:"Spirit", source:"pneuma", language:"Greek", glossary_id:"pneuma", transliteration:"pneuma" }],
  [/\bkingdom\b/i, { display:"kingdom", source:"basileia", language:"Greek", glossary_id:"basileia", transliteration:"basileia" }],
  [/\blove\b/i, { display:"love", source:"agape", language:"Greek", glossary_id:"agape", transliteration:"agape" }],
  [/\bfaith|trust\b/i, { display:"faith/trust", source:"pistis", language:"Greek", glossary_id:"pistis", transliteration:"pistis" }],
  [/\bgrace\b/i, { display:"grace", source:"charis", language:"Greek", glossary_id:"charis", transliteration:"charis" }],
  [/\bassembly\b/i, { display:"assembly", source:"ekklesia", language:"Greek", glossary_id:"ekklesia", transliteration:"ekklesia" }],
  [/\bgood news|gospel\b/i, { display:"good news", source:"euangelion", language:"Greek", glossary_id:"euangelion", transliteration:"euangelion" }],
];

const HEBREW_TERM_RULES = [
  [/\bYHWH\b/i, { display:"YHWH", source:"YHWH", language:"Hebrew", glossary_id:"yhwh", transliteration:"YHWH" }],
  [/\bthe Divine\b/i, { display:"the Divine", source:"Elohim", language:"Hebrew", glossary_id:"elohim", transliteration:"Elohim" }],
  [/\bspirit\b/i, { display:"spirit", source:"ruach", language:"Hebrew", glossary_id:"ruach", transliteration:"ruach" }],
  [/\bheart\b/i, { display:"heart", source:"lev", language:"Hebrew", glossary_id:"lev", transliteration:"lev" }],
  [/\bcovenant\b/i, { display:"covenant", source:"berit", language:"Hebrew", glossary_id:"berit", transliteration:"berit" }],
];

function uniqBy(values, keyFn) {
  const seen = new Set();
  return values.filter((v) => { const k = keyFn(v); if (seen.has(k)) return false; seen.add(k); return true; });
}

async function fetchKjv(filename, bookId) {
  const response = await fetch(BASE + filename);
  if (!response.ok) throw new Error(`KJV fetch failed for ${bookId}: ${response.status} ${filename}`);
  return response.json();
}

function addTerms(verse, language) {
  verse.terms ??= [];
  const rules = language === "Greek" ? GREEK_TERM_RULES : HEBREW_TERM_RULES;
  const additions = [];
  for (const [re, term] of rules) if (re.test(verse.restored || "")) additions.push(term);
  verse.terms = uniqBy([...verse.terms, ...additions], (x) => `${x.language}|${x.source}|${x.glossary_id}`);
}

function addTagsAndFlags(verse) {
  verse.tags ??= [];
  verse.editorial_flags ??= [];
  for (const [re, tag] of TAG_RULES) if (re.test(verse.restored || "") && !verse.tags.includes(tag)) verse.tags.push(tag);
  for (const [re, flag] of FLAG_RULES) if (re.test(verse.restored || "") && !verse.editorial_flags.includes(flag)) verse.editorial_flags.push(flag);
}

function layerState(verses, key) {
  const count = verses.filter((v) => (v[key] || []).length > 0).length;
  if (count === verses.length && count > 0) return "present-all-verses";
  if (count > 0) return `partial-${count}-of-${verses.length}`;
  return "pending-deep-backfill";
}

async function backfillBook(bookId, filename, language) {
  const dir = path.join(root, "scripture", bookId);
  if (!fs.existsSync(dir)) throw new Error(`Missing scripture directory ${bookId}`);
  const files = fs.readdirSync(dir).filter((n) => new RegExp(`^${bookId}-(\\d{3})\\.json$`).test(n)).sort();
  const kjv = await fetchKjv(filename, bookId);
  const chapters = new Map(kjv.chapters.map((c) => [Number(c.chapter), c]));
  let changed = 0;
  let scanned = 0;

  for (const file of files) {
    const full = path.join(dir, file);
    const chapter = JSON.parse(fs.readFileSync(full, "utf8").replace(/^\uFEFF/, ""));
    const before = JSON.stringify(chapter);
    const kch = chapters.get(Number(chapter.chapter));
    if (!kch) throw new Error(`Missing familiar chapter ${bookId} ${chapter.chapter}`);
    const familiar = new Map(kch.verses.map((v) => [Number(v.verse), v.text]));

    for (const verse of chapter.verses ?? []) {
      const text = familiar.get(Number(verse.verse));
      if (text && !verse.familiar) verse.familiar = { source:"KJV", text };
      verse.notes ??= [];
      verse.cross_references ??= [];
      addTerms(verse, language);
      addTagsAndFlags(verse);
      scanned += 1;
    }

    const verses = chapter.verses ?? [];
    chapter.layer_status = {
      ...(chapter.layer_status ?? {}),
      restored: true,
      familiar: verses.length && verses.every((v) => v.familiar?.text) ? "complete" : "partial",
      verse_notes: layerState(verses, "notes"),
      source_terms: layerState(verses, "terms"),
      tags: layerState(verses, "tags"),
      cross_references: layerState(verses, "cross_references"),
      editorial_flags: layerState(verses, "editorial_flags"),
      mystical_companion: "separate-file",
    };
    chapter.backfill_status = {
      ...(chapter.backfill_status ?? {}),
      status:"baseline-rich-layer-backfilled",
      basis:"Genesis-style verse schema",
      preserved_restored_text:true,
      familiar_layer:"complete-when-source-aligned",
      source_language:language,
      deeper_linguistic_notes:"continue-in-deep-backfill-pass",
      batch_version:6,
    };

    if (JSON.stringify(chapter) !== before) {
      fs.writeFileSync(full, `${JSON.stringify(chapter, null, 2)}\n`);
      changed += 1;
    }
  }
  console.log(`${bookId}: ${changed} chapter files changed; ${scanned} verses scanned`);
}

for (const [bookId, [filename, language]] of Object.entries(BOOKS)) {
  await backfillBook(bookId, filename, language);
}
