import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, value = "true"] = arg.replace(/^--/, "").split("=");
  return [key, value];
}));

const MODEL = process.env.SCRIPTURE_MODEL || "gpt-5.6-terra";
const TOKEN = process.env.GITHUB_TOKEN || process.env.COPILOT_GITHUB_TOKEN;
if (!TOKEN) throw new Error("A GitHub token is required for Copilot CLI authentication");

const CANON = [
  ["2-chronicles", "2 Chronicles", 36, "II Chronicles", "2Chronicles.json", "Hebrew"],
  ["ezra", "Ezra", 10, "Ezra", "Ezra.json", "Hebrew/Aramaic"],
  ["nehemiah", "Nehemiah", 13, "Nehemiah", "Nehemiah.json", "Hebrew"],
  ["esther", "Esther", 10, "Esther", "Esther.json", "Hebrew"],
  ["psalms", "Psalms", 150, "Psalms", "Psalms.json", "Hebrew"],
  ["proverbs", "Proverbs", 31, "Proverbs", "Proverbs.json", "Hebrew"],
  ["ecclesiastes", "Ecclesiastes", 12, "Ecclesiastes", "Ecclesiastes.json", "Hebrew"],
  ["song-of-songs", "Song of Songs", 8, "Song of Songs", "SongofSolomon.json", "Hebrew"],
  ["isaiah", "Isaiah", 66, "Isaiah", "Isaiah.json", "Hebrew"],
  ["jeremiah", "Jeremiah", 52, "Jeremiah", "Jeremiah.json", "Hebrew/Aramaic"],
  ["lamentations", "Lamentations", 5, "Lamentations", "Lamentations.json", "Hebrew"],
  ["ezekiel", "Ezekiel", 48, "Ezekiel", "Ezekiel.json", "Hebrew"],
  ["daniel", "Daniel", 12, "Daniel", "Daniel.json", "Hebrew/Aramaic"],
  ["hosea", "Hosea", 14, "Hosea", "Hosea.json", "Hebrew"],
  ["joel", "Joel", 3, "Joel", "Joel.json", "Hebrew"],
  ["amos", "Amos", 9, "Amos", "Amos.json", "Hebrew"],
  ["obadiah", "Obadiah", 1, "Obadiah", "Obadiah.json", "Hebrew"],
  ["jonah", "Jonah", 4, "Jonah", "Jonah.json", "Hebrew"],
  ["micah", "Micah", 7, "Micah", "Micah.json", "Hebrew"],
  ["nahum", "Nahum", 3, "Nahum", "Nahum.json", "Hebrew"],
  ["habakkuk", "Habakkuk", 3, "Habakkuk", "Habakkuk.json", "Hebrew"],
  ["zephaniah", "Zephaniah", 3, "Zephaniah", "Zephaniah.json", "Hebrew"],
  ["haggai", "Haggai", 2, "Haggai", "Haggai.json", "Hebrew"],
  ["zechariah", "Zechariah", 14, "Zechariah", "Zechariah.json", "Hebrew"],
  ["malachi", "Malachi", 4, "Malachi", "Malachi.json", "Hebrew"],
].map(([id, name, chapters, sefaria, kjv, sourceLanguage]) => ({ id, name, chapters, sefaria, kjv, sourceLanguage }));

const requested = (args.books || "").split(",").map((s) => s.trim()).filter(Boolean);
const books = requested.length ? CANON.filter((book) => requested.includes(book.id)) : CANON;
const maxChapters = Number(args["max-chapters"] || 9999);
const pad = (n) => String(n).padStart(3, "0");

function cleanJsonText(text) {
  const value = String(text || "").trim();
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return (fenced ? fenced[1] : value).trim();
}

function slugTerm(value) {
  return String(value || "term").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "term";
}

async function fetchJson(url, label) {
  const response = await fetch(url, { headers: { "User-Agent": "oneness-scripture-generator/2.0" } });
  if (!response.ok) throw new Error(`${label} fetch failed: ${response.status} ${await response.text()}`);
  return response.json();
}

async function fetchKjv(book) {
  return fetchJson(`https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/${book.kjv}`, `${book.name} KJV`);
}

async function fetchSourceChapter(book, chapter) {
  if (chapter < 1 || chapter > book.chapters) return [];
  const tref = encodeURIComponent(`${book.sefaria} ${chapter}`);
  const data = await fetchJson(`https://www.sefaria.org/api/v3/texts/${tref}?version=source&return_format=text_only`, `${book.name} ${chapter} source`);
  const versions = Array.isArray(data.versions) ? data.versions : [];
  const version = versions.find((v) => Array.isArray(v.text)) || versions[0];
  if (!version || !Array.isArray(version.text)) throw new Error(`No source-language verse array for ${book.name} ${chapter}`);
  return version.text.map((text, i) => ({ source_verse: i + 1, text: String(text || "").trim() }));
}

async function fetchSourceContext(book, chapter) {
  const current = await fetchSourceChapter(book, chapter);
  const previous = chapter > 1 ? await fetchSourceChapter(book, chapter - 1) : [];
  const next = chapter < book.chapters ? await fetchSourceChapter(book, chapter + 1) : [];
  return {
    previous_chapter_tail: previous.slice(-3),
    current_chapter: current,
    next_chapter_head: next.slice(0, 3),
  };
}

function projectInstructions(book) {
  return `You are producing exactly one chapter for the Oneness Scripture project. Return ONLY a valid JSON object. Do not wrap it in prose.

PROJECT RULES:
- Produce a source-sensitive English restored draft grounded primarily in the supplied ${book.sourceLanguage} source. Render the divine name יהוה as YHWH, never LORD.
- The supplied KJV is ONLY the familiar public-domain comparison and the required ENGLISH verse-numbering target. Never simply modernize or paraphrase KJV.
- Source-language and English versification can diverge at chapter boundaries. Reconcile by CONTENT using the current source chapter plus the supplied previous-tail/next-head. Output exactly the KJV verse count and verse numbers for the requested English chapter.
- Preserve ambiguity, wordplay, textual difficulty, variants, contradictions, and morally difficult material. Do not harmonize to protect theology, leaders, institutions, empires, or later doctrines.
- The mystical_translation is a separate contemplative companion, not a lexical translation and not a replacement for restored text.
- Do not sanitize violence, genocide rhetoric, slavery/coerced labor, sexual violence, child harm, misogyny, ethnic hostility, disability/illness stigma, suicide, coercive religion, imperialism, hereditary punishment, or abuse of spiritual authority.
- Ancient ethnic names must not become modern enemy-targeting. Do not invent anti-LGBTQ readings from unrelated/disputed ancient terms. Do not present illness, infertility, disability, poverty, or mental distress as proof of moral/spiritual failure.
- Preserve marginalized voices, survivor dignity, dissent, labor, foreigners, women, children, conquered populations, and unnamed people where relevant.
- Source terms must actually belong to the source wording translated. Label language Hebrew or Aramaic as appropriate. Max 2 significant source terms per verse.
- Keep ordinary verses compact. Empty arrays are better than filler.

RETURN JSON WITH THIS EXACT TOP-LEVEL SHAPE:
{
  "review_note": "concise chapter audit summary",
  "translation_notes": ["important chapter-level notes only"],
  "safety_note": "concise misuse/ethical note or empty string",
  "source_witness_audit_flags": ["only genuine items needing later witness review"],
  "contemplative_note": "one concise chapter-level contemplative note",
  "verses": [
    {
      "verse": 1,
      "restored": "source-sensitive English",
      "mystical_translation": "distinct contemplative companion",
      "notes": [{"title":"short","body":"short"}],
      "terms": [{"display":"English display","source":"source form or transliteration","language":"Hebrew","glossary_id":"stable-slug"}],
      "tags": ["theme"],
      "cross_references": [{"reference":"Book 1:1","relationship":"parallel|quotation|theme|contrast"}],
      "editorial_flags": ["machine-readable-flag"]
    }
  ]
}

Limits per verse: notes 0-1, terms 0-2, tags 0-3, cross_references 0-2.`;
}

function buildPrompt(book, chapter, sourceContext, kjvVerses, repair = "") {
  const familiar = kjvVerses.map((v) => ({ verse: Number(v.verse), text: v.text }));
  return `${projectInstructions(book)}

TASK: Produce ${book.name} chapter ${chapter}. It remains a draft pending the later global continuity and textual-witness audit.

SOURCE-LANGUAGE CONTEXT (source versification):
${JSON.stringify(sourceContext)}

KJV FAMILIAR COMPARISON / REQUIRED ENGLISH VERSE NUMBERING:
${JSON.stringify(familiar)}
${repair ? `\nVALIDATOR REPAIR REQUEST:\n${repair}\nRegenerate the full JSON correctly.` : ""}`;
}

function runCopilot(prompt, model) {
  try {
    return execFileSync("copilot", ["-s", "-p", prompt, "--yolo", "--no-ask-user", "--model", model, "--no-color"], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, GITHUB_TOKEN: TOKEN },
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const combined = `${String(error?.stderr || "")}\n${String(error?.stdout || "")}\n${error.message || ""}`;
    const wrapped = new Error(`Copilot CLI failed: ${combined.slice(-5000)}`);
    if (/rate limit|usage limit|premium request|quota|credit limit|too many requests|exceeded/i.test(combined)) wrapped.status = 429;
    if (/model.*not available|unknown model|unsupported model|invalid model/i.test(combined)) wrapped.status = 404;
    throw wrapped;
  }
}

function infer(book, chapter, sourceContext, kjvVerses, repair = "") {
  const prompt = buildPrompt(book, chapter, sourceContext, kjvVerses, repair);
  let raw;
  try {
    raw = runCopilot(prompt, MODEL);
  } catch (error) {
    if (error.status === 404 && MODEL !== "auto") raw = runCopilot(prompt, "auto");
    else throw error;
  }
  return JSON.parse(cleanJsonText(raw));
}

function validateGenerated(book, chapter, result, kjvVerses) {
  if (!result || !Array.isArray(result.verses)) throw new Error(`No verse array returned for ${book.name} ${chapter}`);
  if (result.verses.length !== kjvVerses.length) throw new Error(`${book.name} ${chapter}: expected ${kjvVerses.length} verses, got ${result.verses.length}`);
  for (let i = 0; i < kjvVerses.length; i += 1) {
    const expected = Number(kjvVerses[i].verse);
    const got = Number(result.verses[i]?.verse);
    if (got !== expected) throw new Error(`${book.name} ${chapter}: expected verse ${expected} at position ${i + 1}, got ${got}`);
    if (!String(result.verses[i]?.restored || "").trim()) throw new Error(`${book.name} ${chapter}:${expected} missing restored text`);
    if (!String(result.verses[i]?.mystical_translation || "").trim()) throw new Error(`${book.name} ${chapter}:${expected} missing mystical text`);
  }
}

function normalizeVerse(modelVerse, familiar) {
  const terms = Array.isArray(modelVerse.terms) ? modelVerse.terms.slice(0, 2).map((term) => ({
    display: String(term.display || "").trim(),
    source: String(term.source || "").trim(),
    language: String(term.language || "Hebrew").toLowerCase().includes("arama") ? "Aramaic" : "Hebrew",
    glossary_id: slugTerm(term.glossary_id || term.source || term.display),
  })).filter((term) => term.display && term.source) : [];

  return {
    verse: Number(modelVerse.verse),
    restored: String(modelVerse.restored || "").trim(),
    familiar: { source: "KJV", text: familiar },
    notes: Array.isArray(modelVerse.notes) ? modelVerse.notes.slice(0, 1) : [],
    terms,
    tags: Array.isArray(modelVerse.tags) ? modelVerse.tags.slice(0, 3) : [],
    cross_references: Array.isArray(modelVerse.cross_references) ? modelVerse.cross_references.slice(0, 2) : [],
    editorial_flags: Array.isArray(modelVerse.editorial_flags) ? modelVerse.editorial_flags : [],
  };
}

function writeChapter(book, chapter, result, kjvVerses) {
  const bookDir = path.join(root, "scripture", book.id);
  const mysticalDir = path.join(bookDir, "mystical");
  fs.mkdirSync(mysticalDir, { recursive: true });

  const restored = {
    book: book.name,
    book_id: book.id,
    chapter,
    audit_status: {
      status: "source-audited-draft",
      source_base: `${book.sourceLanguage} source via Sefaria with source/English versification reconciliation; public-domain KJV familiar comparison`,
      review_note: String(result.review_note || "Source-sensitive draft generated for later continuity and witness audit.").trim(),
    },
    verses: result.verses.map((verse, i) => normalizeVerse(verse, kjvVerses[i].text)),
    translation_notes: Array.isArray(result.translation_notes) ? result.translation_notes : [],
    safety_note: String(result.safety_note || "").trim(),
    source_witness_audit_flags: Array.isArray(result.source_witness_audit_flags) ? result.source_witness_audit_flags : [],
    layer_status: {
      restored: true,
      familiar: "complete",
      verse_notes: "baseline-generated",
      source_terms: "baseline-generated",
      tags: "baseline-generated",
      cross_references: "baseline-generated",
      editorial_flags: "baseline-generated",
      mystical_companion: "separate-file",
    },
    generation_status: {
      status: "source-sensitive-ai-draft",
      source_language: book.sourceLanguage,
      model: MODEL,
      continuity_audit: "pending-global-pass",
    },
  };

  const mystical = {
    book: book.name,
    book_id: book.id,
    chapter,
    layer: "mystical-companion",
    verses: result.verses.map((verse) => ({
      verse: Number(verse.verse),
      mystical_translation: String(verse.mystical_translation || "").trim(),
    })),
    contemplative_note: String(result.contemplative_note || "").trim(),
    safety_note: String(result.safety_note || "").trim(),
    generation_status: { model: MODEL, aligned_to_restored_chapter: true, continuity_audit: "pending-global-pass" },
  };

  fs.writeFileSync(path.join(bookDir, `${book.id}-${pad(chapter)}.json`), `${JSON.stringify(restored, null, 2)}\n`);
  fs.writeFileSync(path.join(mysticalDir, `${book.id}-${pad(chapter)}-mystical.json`), `${JSON.stringify(mystical, null, 2)}\n`);
}

function updateTracker(book) {
  const bookDir = path.join(root, "scripture", book.id);
  const restored = fs.existsSync(bookDir) ? fs.readdirSync(bookDir).filter((name) => new RegExp(`^${book.id}-\\d{3}\\.json$`).test(name)).length : 0;
  const mysticalDir = path.join(bookDir, "mystical");
  const mystical = fs.existsSync(mysticalDir) ? fs.readdirSync(mysticalDir).filter((name) => new RegExp(`^${book.id}-\\d{3}-mystical\\.json$`).test(name)).length : 0;
  fs.mkdirSync(path.join(root, "metadata"), { recursive: true });
  fs.writeFileSync(path.join(root, "metadata", `${book.id}-progress.json`), `${JSON.stringify({
    book: book.name,
    book_id: book.id,
    total_chapters: book.chapters,
    restored_chapters: restored,
    mystical_chapters: mystical,
    complete: restored === book.chapters && mystical === book.chapters,
    status: restored === book.chapters && mystical === book.chapters ? "complete-source-audited-draft-with-mystical-companions" : "in-progress-source-audited-draft",
    generation_model: MODEL,
    continuity_audit: "pending-global-pass",
  }, null, 2)}\n`);
}

let generated = 0;
const state = {
  engine: "GitHub Copilot CLI",
  model: MODEL,
  generatedThisRun: 0,
  stoppedForQuota: false,
  lastChapter: null,
  error: null,
  updatedAt: new Date().toISOString(),
};

outer:
for (const book of books) {
  let kjv;
  try {
    kjv = await fetchKjv(book);
  } catch (error) {
    state.error = error.message;
    break;
  }
  const chapters = new Map((kjv.chapters || []).map((chapter) => [Number(chapter.chapter), chapter.verses || []]));

  for (let chapter = 1; chapter <= book.chapters; chapter += 1) {
    if (generated >= maxChapters) break outer;
    const restoredPath = path.join(root, "scripture", book.id, `${book.id}-${pad(chapter)}.json`);
    const mysticalPath = path.join(root, "scripture", book.id, "mystical", `${book.id}-${pad(chapter)}-mystical.json`);
    if (fs.existsSync(restoredPath) && fs.existsSync(mysticalPath)) continue;

    const kjvVerses = chapters.get(chapter);
    if (!kjvVerses?.length) {
      state.error = `Missing KJV alignment for ${book.name} ${chapter}`;
      break outer;
    }

    console.log(`Generating ${book.name} ${chapter} (${kjvVerses.length} English verses) with ${MODEL}`);
    try {
      const sourceContext = await fetchSourceContext(book, chapter);
      let result;
      let repair = "";
      for (let attempt = 0; attempt < 2; attempt += 1) {
        result = infer(book, chapter, sourceContext, kjvVerses, repair);
        try {
          validateGenerated(book, chapter, result, kjvVerses);
          repair = "";
          break;
        } catch (error) {
          if (attempt === 1) throw error;
          repair = error.message;
          console.warn(`Validator requested repair for ${book.name} ${chapter}: ${repair}`);
        }
      }

      writeChapter(book, chapter, result, kjvVerses);
      generated += 1;
      state.generatedThisRun = generated;
      state.lastChapter = `${book.id}:${chapter}`;
      state.updatedAt = new Date().toISOString();
      updateTracker(book);
    } catch (error) {
      if (error?.status === 429) state.stoppedForQuota = true;
      state.error = error.message;
      state.updatedAt = new Date().toISOString();
      console.warn(`Stopping cleanly after ${generated} completed chapters: ${error.message}`);
      break outer;
    }
  }
  updateTracker(book);
}

for (const book of books) updateTracker(book);
fs.mkdirSync(path.join(root, "metadata"), { recursive: true });
fs.writeFileSync(path.join(root, "metadata", "generation-state.json"), `${JSON.stringify(state, null, 2)}\n`);
console.log(`Generation run closed cleanly: ${generated} new chapters. Last=${state.lastChapter || "none"}. Error=${state.error || "none"}`);
