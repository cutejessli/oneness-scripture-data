import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const webDir = process.env.WEB_USFM_DIR;
const oshbPath = process.env.OSHB_JSON;
const morphGntDir = process.env.MORPHGNT_DIR;

if (!webDir || !oshbPath || !morphGntDir) {
  throw new Error("WEB_USFM_DIR, OSHB_JSON, and MORPHGNT_DIR are required");
}

const BOOK_CODE_TO_ID = {
  GEN:"genesis", EXO:"exodus", LEV:"leviticus", NUM:"numbers", DEU:"deuteronomy",
  JOS:"joshua", JDG:"judges", RUT:"ruth", "1SA":"1-samuel", "2SA":"2-samuel",
  "1KI":"1-kings", "2KI":"2-kings", "1CH":"1-chronicles", "2CH":"2-chronicles",
  EZR:"ezra", NEH:"nehemiah", EST:"esther", JOB:"job", PSA:"psalms", PRO:"proverbs",
  ECC:"ecclesiastes", SNG:"song-of-songs", ISA:"isaiah", JER:"jeremiah", LAM:"lamentations",
  EZK:"ezekiel", DAN:"daniel", HOS:"hosea", JOL:"joel", AMO:"amos", OBA:"obadiah",
  JON:"jonah", MIC:"micah", NAM:"nahum", HAB:"habakkuk", ZEP:"zephaniah", HAG:"haggai",
  ZEC:"zechariah", MAL:"malachi", MAT:"matthew", MRK:"mark", LUK:"luke", JHN:"john",
  ACT:"acts", ROM:"romans", "1CO":"1-corinthians", "2CO":"2-corinthians", GAL:"galatians",
  EPH:"ephesians", PHP:"philippians", COL:"colossians", "1TH":"1-thessalonians",
  "2TH":"2-thessalonians", "1TI":"1-timothy", "2TI":"2-timothy", TIT:"titus",
  PHM:"philemon", HEB:"hebrews", JAS:"james", "1PE":"1-peter", "2PE":"2-peter",
  "1JN":"1-john", "2JN":"2-john", "3JN":"3-john", JUD:"jude", REV:"revelation"
};

const NAME_TO_ID = {
  genesis:"genesis", exodus:"exodus", leviticus:"leviticus", numbers:"numbers", deuteronomy:"deuteronomy",
  joshua:"joshua", judges:"judges", ruth:"ruth", "1 samuel":"1-samuel", "2 samuel":"2-samuel",
  "1 kings":"1-kings", "2 kings":"2-kings", "1 chronicles":"1-chronicles", "2 chronicles":"2-chronicles",
  ezra:"ezra", nehemiah:"nehemiah", esther:"esther", job:"job", psalms:"psalms", psalm:"psalms",
  proverbs:"proverbs", ecclesiastes:"ecclesiastes", "song of songs":"song-of-songs", "song of solomon":"song-of-songs",
  isaiah:"isaiah", jeremiah:"jeremiah", lamentations:"lamentations", ezekiel:"ezekiel", daniel:"daniel",
  hosea:"hosea", joel:"joel", amos:"amos", obadiah:"obadiah", jonah:"jonah", micah:"micah", nahum:"nahum",
  habakkuk:"habakkuk", zephaniah:"zephaniah", haggai:"haggai", zechariah:"zechariah", malachi:"malachi"
};

const MORPH_FILES = {
  "61-Mt":"matthew", "62-Mk":"mark", "63-Lk":"luke", "64-Jn":"john", "65-Ac":"acts",
  "66-Ro":"romans", "67-1Co":"1-corinthians", "68-2Co":"2-corinthians", "69-Ga":"galatians",
  "70-Eph":"ephesians", "71-Php":"philippians", "72-Col":"colossians", "73-1Th":"1-thessalonians",
  "74-2Th":"2-thessalonians", "75-1Ti":"1-timothy", "76-2Ti":"2-timothy", "77-Tit":"titus",
  "78-Phm":"philemon", "79-Heb":"hebrews", "80-Jas":"james", "81-1Pe":"1-peter",
  "82-2Pe":"2-peter", "83-1Jn":"1-john", "84-2Jn":"2-john", "85-3Jn":"3-john",
  "86-Jud":"jude", "87-Re":"revelation"
};

const key = (book, chapter, verse) => `${book}:${Number(chapter)}:${Number(verse)}`;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
}

function cleanUsfmText(input) {
  return String(input || "")
    .replace(/\\f\s[\s\S]*?\\f\*/g, " ")
    .replace(/\\x\s[\s\S]*?\\x\*/g, " ")
    .replace(/\\fig\s[\s\S]*?\\fig\*/g, " ")
    .replace(/\\w\s([^|\\]+)(?:\|[^\\]*)?\\w\*/g, "$1")
    .replace(/\\(?:add|nd|wj|qt|it|bd|em|sc|sup|bk|k|tl|dc|sig|sls|pn|ord)\s?/g, "")
    .replace(/\\(?:add|nd|wj|qt|it|bd|em|sc|sup|bk|k|tl|dc|sig|sls|pn|ord)\*/g, "")
    .replace(/\\[a-z0-9-]+\*?/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseWebUsfm() {
  const map = new Map();
  for (const file of walk(webDir).filter((p) => /\.usfm$/i.test(p))) {
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
    let book = null;
    let chapter = null;
    let currentKey = null;
    for (const line of lines) {
      const id = line.match(/^\\id\s+([0-9A-Z]{3})\b/);
      if (id) { book = BOOK_CODE_TO_ID[id[1]] || null; currentKey = null; continue; }
      const c = line.match(/^\\c\s+(\d+)/);
      if (c) { chapter = Number(c[1]); currentKey = null; continue; }
      const v = line.match(/^\\v\s+(\d+)(?:[-–]\d+)?\s*(.*)$/);
      if (v && book && chapter) {
        currentKey = key(book, chapter, Number(v[1]));
        map.set(currentKey, cleanUsfmText(v[2]));
        continue;
      }
      if (currentKey && !/^\\(?:id|c|v)\b/.test(line)) {
        const extra = cleanUsfmText(line);
        if (extra) map.set(currentKey, `${map.get(currentKey)} ${extra}`.trim());
      }
    }
  }
  return map;
}

function parseOshb() {
  const raw = JSON.parse(fs.readFileSync(oshbPath, "utf8"));
  const map = new Map();
  for (const [name, chapters] of Object.entries(raw)) {
    const book = NAME_TO_ID[String(name).toLowerCase()];
    if (!book || !Array.isArray(chapters)) continue;
    chapters.forEach((verses, ci) => {
      if (!Array.isArray(verses)) return;
      verses.forEach((words, vi) => {
        if (!Array.isArray(words)) return;
        const text = words.map((word) => String(Array.isArray(word) ? word[0] : "").replace(/\//g, "")).filter(Boolean).join(" ")
          .replace(/\s+([׃־])/g, "$1").replace(/\s+/g, " ").trim();
        const langs = new Set(words.map((word) => String(Array.isArray(word) ? word[2] : "").slice(0,1)).filter(Boolean));
        const language = langs.has("A") && langs.has("H") ? "Hebrew/Aramaic" : langs.has("A") ? "Aramaic" : "Hebrew";
        if (text) map.set(key(book, ci + 1, vi + 1), { text, language });
      });
    });
  }
  return map;
}

function parseMorphGnt() {
  const map = new Map();
  const files = fs.readdirSync(morphGntDir).filter((name) => /-morphgnt\.txt$/.test(name));
  for (const name of files) {
    const stem = name.replace(/-morphgnt\.txt$/, "");
    const book = MORPH_FILES[stem];
    if (!book) continue;
    const verseTokens = new Map();
    for (const line of fs.readFileSync(path.join(morphGntDir, name), "utf8").split(/\r?\n/)) {
      if (!line.trim()) continue;
      const cols = line.trim().split(/\s+/);
      const bcv = cols[0];
      const token = cols[3];
      if (!/^\d{6}$/.test(bcv) || !token) continue;
      const chapter = Number(bcv.slice(2,4));
      const verse = Number(bcv.slice(4,6));
      const k = key(book, chapter, verse);
      if (!verseTokens.has(k)) verseTokens.set(k, []);
      verseTokens.get(k).push(token);
    }
    for (const [k, tokens] of verseTokens) {
      const text = tokens.join(" ").replace(/\s+([,.;··:!?])/g, "$1").replace(/\s+/g, " ").trim();
      map.set(k, { text, language: "Greek" });
    }
  }
  return map;
}

const modern = parseWebUsfm();
const hebrew = parseOshb();
const greek = parseMorphGnt();

let filesChanged = 0;
let versesModern = 0;
let versesOriginal = 0;
let missingModern = 0;
let missingOriginal = 0;

const scriptureDir = path.join(root, "scripture");
for (const book of fs.readdirSync(scriptureDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
  const dir = path.join(scriptureDir, book);
  for (const file of fs.readdirSync(dir).filter((name) => new RegExp(`^${book}-\\d{3}\\.json$`).test(name))) {
    const p = path.join(dir, file);
    const doc = JSON.parse(fs.readFileSync(p, "utf8"));
    let changed = false;
    for (const verse of doc.verses || []) {
      const k = key(book, doc.chapter, verse.verse);
      const web = modern.get(k);
      if (web) {
        const next = { source: "WEB", edition: "World English Bible (66-book protocanon)", text: web };
        if (JSON.stringify(verse.modern) !== JSON.stringify(next)) { verse.modern = next; changed = true; }
        versesModern += 1;
      } else missingModern += 1;

      const source = greek.get(k) || hebrew.get(k);
      if (source) {
        const next = {
          source: greek.has(k) ? "SBLGNT" : "WLC/OSHB",
          language: source.language,
          text: source.text
        };
        if (JSON.stringify(verse.original) !== JSON.stringify(next)) { verse.original = next; changed = true; }
        versesOriginal += 1;
      } else missingOriginal += 1;
    }

    doc.layer_status ||= {};
    if (doc.verses?.every((v) => v.modern?.text)) doc.layer_status.modern_comparison = "complete-WEB";
    if (doc.verses?.every((v) => v.original?.text)) doc.layer_status.original_language = "complete-open-source";
    doc.reference_layers = {
      modern: {
        source: "World English Bible",
        license: "Public Domain",
        provenance: "eBible.org engwebp USFM"
      },
      original_hebrew: {
        source: "Westminster Leningrad Codex via Open Scriptures Hebrew Bible",
        text_license: "Public Domain",
        morphology_license: "CC BY 4.0",
        attribution: "Open Scriptures Hebrew Bible Project"
      },
      original_greek: {
        source: "SBL Greek New Testament via MorphGNT tokenization",
        text_license: "CC BY 4.0",
        attribution: "Society of Biblical Literature and Logos Bible Software; MorphGNT used for tokenized access"
      }
    };

    if (changed) {
      fs.writeFileSync(p, `${JSON.stringify(doc, null, 2)}\n`);
      filesChanged += 1;
    }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  filesChanged,
  versesModern,
  versesOriginal,
  missingModern,
  missingOriginal,
  sources: {
    modern: "World English Bible (Public Domain)",
    hebrew: "WLC text via Open Scriptures Hebrew Bible (WLC Public Domain; morphology CC BY 4.0)",
    greek: "SBLGNT (CC BY 4.0)"
  }
};
fs.mkdirSync(path.join(root, "metadata"), { recursive: true });
fs.writeFileSync(path.join(root, "metadata", "reference-layer-report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

if (missingModern || missingOriginal) {
  console.warn(`Reference backfill completed with gaps: modern=${missingModern}, original=${missingOriginal}`);
}
