import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, value = "true"] = arg.replace(/^--/, "").split("=");
  return [key, value];
}));

const BOOK_SOURCES = {
  "2-samuel": "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/2Samuel.json",
  "1-kings": "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/1Kings.json",
  "2-kings": "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/2Kings.json",
  "1-chronicles": "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/1Chronicles.json",
};

const PARALLELS = {
  "2-samuel": {
    1: ["1 Samuel 31", "1 Chronicles 10"],
    2: ["1 Chronicles 11:1-3"],
    5: ["1 Chronicles 11:1-9", "1 Chronicles 14"],
    6: ["1 Chronicles 13", "1 Chronicles 15-16"],
    7: ["1 Chronicles 17"],
    8: ["1 Chronicles 18"],
    10: ["1 Chronicles 19"],
    11: ["1 Chronicles 20:1", "Psalm 51"],
    12: ["Psalm 51"],
    20: ["1 Chronicles 20"],
    21: ["1 Chronicles 20:4-8"],
    22: ["Psalm 18"],
    23: ["1 Chronicles 11:10-47"],
    24: ["1 Chronicles 21"],
  },
  "1-kings": {
    1: ["1 Chronicles 29:21-30"],
    2: ["1 Chronicles 29:22-30", "2 Chronicles 1"],
    3: ["2 Chronicles 1:1-13"],
    5: ["2 Chronicles 2"],
    6: ["2 Chronicles 3"],
    7: ["2 Chronicles 4"],
    8: ["2 Chronicles 5-7"],
    9: ["2 Chronicles 7:11-22"],
    10: ["2 Chronicles 8-9"],
    12: ["2 Chronicles 10"],
    13: ["2 Chronicles 11-13"],
    14: ["2 Chronicles 14-16"],
    18: ["2 Chronicles 18"],
    22: ["2 Chronicles 18:28-34"],
  },
  "2-kings": {
    11: ["2 Chronicles 22-23"],
    12: ["2 Chronicles 24"],
    14: ["2 Chronicles 25"],
    15: ["2 Chronicles 26-27"],
    16: ["2 Chronicles 28"],
    18: ["2 Chronicles 32", "Isaiah 36"],
    19: ["2 Chronicles 32", "Isaiah 37"],
    20: ["2 Chronicles 32", "Isaiah 38-39"],
    21: ["2 Chronicles 33"],
    22: ["2 Chronicles 34"],
    23: ["2 Chronicles 34-35"],
    24: ["2 Chronicles 36", "Jeremiah 37-39"],
    25: ["2 Chronicles 36", "Jeremiah 39", "Jeremiah 52"],
  },
  "1-chronicles": {
    1: ["Genesis 5", "Genesis 10", "Genesis 11:10-26", "Genesis 25", "Genesis 36"],
    2: ["Genesis 38", "Ruth 4:18-22", "1 Samuel 16"],
    3: ["2 Samuel 3:2-5", "2 Samuel 5:13-16", "2 Kings 24-25"],
    4: ["Genesis 46", "Numbers 26"],
    5: ["Genesis 46", "Numbers 26", "2 Kings 15:29", "2 Kings 17:6"],
    6: ["Exodus 6", "Numbers 3-4", "Joshua 21"],
    7: ["Genesis 46", "Numbers 26"],
    8: ["1 Samuel 9", "1 Samuel 14"],
    9: ["Ezra 2", "Nehemiah 11", "1 Samuel 31"],
    10: ["1 Samuel 31"],
    11: ["2 Samuel 5", "2 Samuel 23"],
    12: ["1 Samuel 27", "2 Samuel 2", "2 Samuel 5"],
    13: ["2 Samuel 6:1-11"],
    14: ["2 Samuel 5:11-25"],
    15: ["2 Samuel 6:12-23"],
    16: ["Psalm 96", "Psalm 105", "Psalm 106"],
    17: ["2 Samuel 7"],
    18: ["2 Samuel 8"],
    19: ["2 Samuel 10"],
    20: ["2 Samuel 11-12", "2 Samuel 21:15-22"],
    21: ["2 Samuel 24"],
    22: ["2 Samuel 7", "1 Kings 5"],
  },
};

const TERM_RULES = [
  { re: /\bYHWH\b/i, term: ["YHWH", "YHWH", "Hebrew", "yhwh", "YHWH"] },
  { re: /\bthe Divine\b/i, term: ["the Divine", "Elohim", "Hebrew", "elohim", "Elohim"] },
  { re: /\bking(s)?\b/i, term: ["king", "melekh", "Hebrew", "melekh", "melekh"] },
  { re: /\breign(ed|s|ing)?\b/i, term: ["reign", "malakh", "Hebrew", "malakh", "malakh"] },
  { re: /\bpriest(s)?\b/i, term: ["priest", "kohen", "Hebrew", "kohen", "kohen"] },
  { re: /\bLevite(s)?\b/i, term: ["Levite", "Levi", "Hebrew", "levi", "Levi"] },
  { re: /\bcovenant\b/i, term: ["covenant", "berit", "Hebrew", "berit", "berit"] },
  { re: /\bark\b/i, term: ["ark", "aron", "Hebrew", "aron", "aron"] },
  { re: /\banointed\b/i, term: ["anointed", "mashiach", "Hebrew", "mashiach", "mashiach"] },
  { re: /\bprophet(s)?\b/i, term: ["prophet", "navi", "Hebrew", "navi", "navi"] },
  { re: /\bseer\b/i, term: ["seer", "roeh", "Hebrew", "roeh", "roeh"] },
  { re: /\boffering(s)?\b/i, term: ["offering", "qorban", "Hebrew", "qorban", "qorban"] },
  { re: /\bburnt offering(s)?\b/i, term: ["burnt offering", "olah", "Hebrew", "olah", "olah"] },
  { re: /\bpeace offering(s)?\b/i, term: ["peace offering", "shelamim", "Hebrew", "shelamim", "shelamim"] },
  { re: /\bheart\b/i, term: ["heart", "lev", "Hebrew", "lev", "lev"] },
  { re: /\bspirit\b/i, term: ["spirit", "ruach", "Hebrew", "ruach", "ruach"] },
];

const TAG_RULES = [
  [/\bwar|battle|army|armies|soldier|sword|slain|slew|killed|kill|smote|struck\b/i, "war-violence"],
  [/\bking|reign|throne|royal|crown\b/i, "kingship-power"],
  [/\bpriest|levite|prophet|seer\b/i, "religious-authority"],
  [/\btemple|house of YHWH|ark|sanctuary|holy place\b/i, "sacred-space"],
  [/\bwife|wives|daughter|daughters|sister|woman|women|concubine\b/i, "women-gender"],
  [/\bservant|servants|slave|slaves|forced labor|tribute\b/i, "labor-power"],
  [/\bforeigner|foreigners|stranger|strangers|sojourner|sojourners\b/i, "foreigner-migrant"],
  [/\boffering|sacrifice|burnt offering|altar\b/i, "sacrifice-worship"],
  [/\bcensus|numbered|numbering\b/i, "census"],
  [/\bcovenant\b/i, "covenant"],
  [/\bsing|singer|singers|music|musician|musicians|harp|lyre|cymbal\b/i, "music-worship"],
  [/\bAmalek|Amalekite|Amalekites\b/i, "amalek-reception-risk"],
  [/\bPhilistine|Philistines|Edom|Edomite|Moab|Moabite|Ammon|Ammonite\b/i, "ancient-people"],
  [/\bchild|children|son|sons|daughter|daughters\b/i, "family-lineage"],
];

const FLAG_RULES = [
  [/\bAmalek|Amalekite|Amalekites\b/i, "modern-targeting-prohibited"],
  [/\bwar|battle|slain|slew|killed|kill|sword|smote|struck\b/i, "violence-description-not-endorsement"],
  [/\bservant|servants|slave|slaves|forced labor|tribute\b/i, "labor-power-audit"],
  [/\bwife|wives|concubine|daughter|daughters|woman|women\b/i, "gender-power-audit"],
  [/\bforeigner|foreigners|stranger|strangers|sojourner|sojourners\b/i, "migrant-dignity"],
  [/\bking|throne|anointed\b/i, "leader-accountability"],
  [/\bprophet|seer\b/i, "spiritual-authority-audit"],
  [/\bblind|lame|disease|diseased|leper|leprosy\b/i, "disability-illness-nonstigmatizing"],
  [/\bchild|children\b.*\bfire|burn|sacrifice\b|\bfire|burn|sacrifice\b.*\bchild|children\b/i, "child-harm-audit"],
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

function pad(n) { return String(n).padStart(3, "0"); }

async function fetchKjv(bookId) {
  const url = BOOK_SOURCES[bookId];
  if (!url) throw new Error(`No KJV source mapping for ${bookId}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`KJV fetch failed for ${bookId}: ${response.status}`);
  return response.json();
}

function addBaselineTerms(verse) {
  const text = verse.restored || "";
  verse.terms ??= [];
  const additions = [];
  for (const rule of TERM_RULES) {
    if (!rule.re.test(text)) continue;
    const [display, source, language, glossary_id, transliteration] = rule.term;
    additions.push({ display, source, language, glossary_id, transliteration });
  }
  verse.terms = uniqBy([...verse.terms, ...additions], (item) => `${item.language}|${item.source}|${item.glossary_id}`);
}

function addBaselineTags(verse) {
  const text = verse.restored || "";
  verse.tags ??= [];
  for (const [re, tag] of TAG_RULES) if (re.test(text) && !verse.tags.includes(tag)) verse.tags.push(tag);
}

function addEditorialFlags(verse) {
  const text = verse.restored || "";
  verse.editorial_flags ??= [];
  for (const [re, flag] of FLAG_RULES) if (re.test(text) && !verse.editorial_flags.includes(flag)) verse.editorial_flags.push(flag);
  if (/\bPhilistine|Philistines|Edom|Edomite|Moab|Moabite|Ammon|Ammonite|Hagarite|Ishmaelite|Jebusite|Canaanite\b/i.test(text)) {
    if (!verse.editorial_flags.includes("ancient-name-not-modern-target")) verse.editorial_flags.push("ancient-name-not-modern-target");
  }
}

function addChapterCrossReferences(bookId, chapterNumber, verse) {
  verse.cross_references ??= [];
  const refs = PARALLELS[bookId]?.[chapterNumber] || [];
  const additions = refs.map((reference) => ({ reference, relationship: "chapter-parallel-or-related-passage" }));
  verse.cross_references = uniqBy([...verse.cross_references, ...additions], (item) => `${item.reference}|${item.relationship}`);
}

function layerState(verses, key, predicate = (v) => (v[key] || []).length > 0) {
  const count = verses.filter(predicate).length;
  if (count === verses.length && count > 0) return "present-all-verses";
  if (count > 0) return `partial-${count}-of-${verses.length}`;
  return "pending-deep-backfill";
}

async function backfillBook(bookId) {
  const bookDir = path.join(root, "scripture", bookId);
  if (!fs.existsSync(bookDir)) throw new Error(`Missing scripture directory: ${bookDir}`);

  const files = fs.readdirSync(bookDir)
    .filter((name) => new RegExp(`^${bookId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d{3})\\.json$`).test(name))
    .sort();

  const kjvBook = await fetchKjv(bookId);
  const kjvByChapter = new Map(kjvBook.chapters.map((chapter) => [Number(chapter.chapter), chapter]));
  let changedFiles = 0;
  let verseCount = 0;

  for (const file of files) {
    const filename = path.join(bookDir, file);
    const chapter = JSON.parse(fs.readFileSync(filename, "utf8").replace(/^\uFEFF/, ""));
    const chapterNumber = Number(chapter.chapter);
    const kjvChapter = kjvByChapter.get(chapterNumber);
    if (!kjvChapter) throw new Error(`Missing familiar chapter ${bookId} ${chapterNumber}`);
    const familiar = new Map(kjvChapter.verses.map((verse) => [Number(verse.verse), verse.text]));
    const before = JSON.stringify(chapter);

    for (const verse of chapter.verses ?? []) {
      const familiarText = familiar.get(Number(verse.verse));
      if (familiarText && !verse.familiar) verse.familiar = { source: "KJV", text: familiarText };
      verse.notes ??= [];
      verse.terms ??= [];
      verse.tags ??= [];
      verse.cross_references ??= [];
      addBaselineTerms(verse);
      addBaselineTags(verse);
      addEditorialFlags(verse);
      addChapterCrossReferences(bookId, chapterNumber, verse);
      verseCount += 1;
    }

    const verses = chapter.verses ?? [];
    chapter.layer_status = {
      ...(chapter.layer_status ?? {}),
      restored: true,
      familiar: verses.length > 0 && verses.every((verse) => verse.familiar?.text) ? "complete" : "partial",
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
      deeper_linguistic_notes: "continue-in-deep-backfill-pass",
      batch_version: 2,
    };

    if (JSON.stringify(chapter) !== before) {
      fs.writeFileSync(filename, `${JSON.stringify(chapter, null, 2)}\n`);
      changedFiles += 1;
    }
  }

  console.log(`${bookId}: ${changedFiles} chapter files changed; ${verseCount} verses scanned`);
}

const books = (args.books || "2-samuel,1-kings,2-kings,1-chronicles")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

for (const bookId of books) await backfillBook(bookId);
