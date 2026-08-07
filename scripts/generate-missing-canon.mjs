import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, value = "true"] = arg.replace(/^--/, "").split("=");
  return [key, value];
}));

const MODEL = process.env.SCRIPTURE_MODEL || "openai/gpt-4.1";
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) throw new Error("GITHUB_TOKEN is required for GitHub Models inference");

const CANON = [
  ["2-chronicles", "2 Chronicles", 36, "II Chronicles", "2Chronicles.json"],
  ["ezra", "Ezra", 10, "Ezra", "Ezra.json"],
  ["nehemiah", "Nehemiah", 13, "Nehemiah", "Nehemiah.json"],
  ["esther", "Esther", 10, "Esther", "Esther.json"],
  ["psalms", "Psalms", 150, "Psalms", "Psalms.json"],
  ["proverbs", "Proverbs", 31, "Proverbs", "Proverbs.json"],
  ["ecclesiastes", "Ecclesiastes", 12, "Ecclesiastes", "Ecclesiastes.json"],
  ["song-of-songs", "Song of Songs", 8, "Song of Songs", "SongofSolomon.json"],
  ["isaiah", "Isaiah", 66, "Isaiah", "Isaiah.json"],
  ["jeremiah", "Jeremiah", 52, "Jeremiah", "Jeremiah.json"],
  ["lamentations", "Lamentations", 5, "Lamentations", "Lamentations.json"],
  ["ezekiel", "Ezekiel", 48, "Ezekiel", "Ezekiel.json"],
  ["daniel", "Daniel", 12, "Daniel", "Daniel.json"],
  ["hosea", "Hosea", 14, "Hosea", "Hosea.json"],
  ["joel", "Joel", 3, "Joel", "Joel.json"],
  ["amos", "Amos", 9, "Amos", "Amos.json"],
  ["obadiah", "Obadiah", 1, "Obadiah", "Obadiah.json"],
  ["jonah", "Jonah", 4, "Jonah", "Jonah.json"],
  ["micah", "Micah", 7, "Micah", "Micah.json"],
  ["nahum", "Nahum", 3, "Nahum", "Nahum.json"],
  ["habakkuk", "Habakkuk", 3, "Habakkuk", "Habakkuk.json"],
  ["zephaniah", "Zephaniah", 3, "Zephaniah", "Zephaniah.json"],
  ["haggai", "Haggai", 2, "Haggai", "Haggai.json"],
  ["zechariah", "Zechariah", 14, "Zechariah", "Zechariah.json"],
  ["malachi", "Malachi", 4, "Malachi", "Malachi.json"],
].map(([id, name, chapters, sefaria, kjv]) => ({ id, name, chapters, sefaria, kjv }));

const requested = (args.books || "").split(",").map((s) => s.trim()).filter(Boolean);
const books = requested.length ? CANON.filter((book) => requested.includes(book.id)) : CANON;
const maxChapters = Number(args["max-chapters"] || 9999);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pad = (n) => String(n).padStart(3, "0");

function cleanJsonText(text) {
  return String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

function slugTerm(value) {
  return String(value || "term").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "term";
}

async function fetchJson(url, label) {
  const response = await fetch(url, { headers: { "User-Agent": "oneness-scripture-generator/1.0" } });
  if (!response.ok) throw new Error(`${label} fetch failed: ${response.status} ${await response.text()}`);
  return response.json();
}

async function fetchKjv(book) {
  return fetchJson(`https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/${book.kjv}`, `${book.name} KJV`);
}

async function fetchHebrew(book, chapter) {
  const tref = encodeURIComponent(`${book.sefaria} ${chapter}`);
  const url = `https://www.sefaria.org/api/v3/texts/${tref}?version=source&return_format=text_only`;
  const data = await fetchJson(url, `${book.name} ${chapter} Sefaria source`);
  const versions = Array.isArray(data.versions) ? data.versions : [];
  const version = versions.find((v) => Array.isArray(v.text)) || versions[0];
  if (!version || !Array.isArray(version.text)) throw new Error(`No source-language verse array for ${book.name} ${chapter}`);
  return version.text.map((text) => String(text || "").trim());
}

function systemPrompt() {
  return `You are producing a chapter for the Oneness Scripture project. Return ONLY valid JSON, never Markdown.\n\nNON-NEGOTIABLE PROJECT RULES:\n- Restored text is a source-sensitive English draft aligned to the supplied Hebrew source. Use YHWH for יהוה; never LORD.\n- Preserve ambiguity, wordplay, textual difficulty, contradictions, and morally difficult material. Do not harmonize to protect theology or leaders.\n- Mystical translation is a separate contemplative companion and must not pretend to be literal translation.\n- Do not sanitize violence, slavery, sexual violence, child harm, misogyny, ethnic hostility, disability/illness stigma, coercive religion, imperialism, hereditary punishment, or abuse of spiritual authority. Add concise editorial flags when needed.\n- Ancient ethnic names must never be turned into modern enemy-targeting.\n- Do not create anti-LGBTQ readings from disputed or unrelated terms.\n- Do not use suffering, illness, infertility, disability, poverty, or mental distress as proof of moral/spiritual failure.\n- Keep verse numbers exactly aligned with the supplied source and familiar comparison.\n- Source terms must actually occur in the supplied Hebrew verse. Max 2 significant terms per verse.\n- Keep output compact enough for one chapter. Restored and mystical lines should usually be concise.\n\nJSON SHAPE:\n{\n  \"review_note\": \"concise chapter audit summary\",\n  \"translation_notes\": [\"important chapter-level notes only\"],\n  \"safety_note\": \"concise misuse/ethical note or empty string\",\n  \"source_witness_audit_flags\": [\"only genuine issues needing later witness review\"],\n  \"contemplative_note\": \"one concise chapter-level contemplative note\",\n  \"verses\": [\n    {\n      \"verse\": 1,\n      \"restored\": \"source-sensitive English\",\n      \"mystical_translation\": \"distinct contemplative companion\",\n      \"notes\": [{\"title\":\"short\",\"body\":\"short\"}],\n      \"terms\": [{\"display\":\"English display\",\"source\":\"Hebrew form or transliteration\",\"language\":\"Hebrew\",\"glossary_id\":\"stable-slug\"}],\n      \"tags\": [\"theme\"],\n      \"cross_references\": [{\"reference\":\"Book 1:1\",\"relationship\":\"parallel|quotation|theme|contrast\"}],\n      \"editorial_flags\": [\"machine-readable-flag\"]\n    }\n  ]\n}\n\nFor ordinary verses use empty arrays rather than filler. Notes max 1 per verse, terms max 2, tags max 3, cross references max 2. Preserve marginalized voices and power dynamics.`;
}

function chapterPrompt(book, chapter, hebrew, kjvVerses) {
  const aligned = kjvVerses.map((verse, i) => ({
    verse: Number(verse.verse),
    hebrew: hebrew[i] ?? "",
    familiar_kjv: verse.text,
  }));
  return `Produce ${book.name} chapter ${chapter}. This is a draft, not a claim of final scholarly consensus. Work primarily from the supplied Hebrew; use KJV only as the familiar comparison and alignment aid. Preserve the project's Hebrew-first naming and ethical audit principles.\n\nALIGNED SOURCE DATA:\n${JSON.stringify(aligned)}`;
}

async function infer(book, chapter, hebrew, kjvVerses) {
  const body = {
    model: MODEL,
    temperature: 0.15,
    max_tokens: 4000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt() },
      { role: "user", content: chapterPrompt(book, chapter, hebrew, kjvVerses) },
    ],
  };

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch("https://models.github.ai/inference/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error(`Empty model response for ${book.name} ${chapter}`);
      return JSON.parse(cleanJsonText(text));
    }

    const errorText = await response.text();
    if ((response.status === 429 || response.status >= 500) && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after") || 0);
      await sleep(Math.max(retryAfter * 1000, (attempt + 1) * 15000));
      continue;
    }
    const error = new Error(`Model request failed ${response.status}: ${errorText}`);
    error.status = response.status;
    throw error;
  }
}

function normalizeVerse(modelVerse, familiar) {
  const verse = Number(modelVerse.verse);
  const terms = Array.isArray(modelVerse.terms) ? modelVerse.terms.slice(0, 2).map((term) => ({
    display: String(term.display || "").trim(),
    source: String(term.source || "").trim(),
    language: "Hebrew",
    glossary_id: slugTerm(term.glossary_id || term.source || term.display),
  })).filter((term) => term.display && term.source) : [];
  return {
    verse,
    restored: String(modelVerse.restored || "").trim(),
    familiar: { source: "KJV", text: familiar },
    notes: Array.isArray(modelVerse.notes) ? modelVerse.notes.slice(0, 1) : [],
    terms,
    tags: Array.isArray(modelVerse.tags) ? modelVerse.tags.slice(0, 3) : [],
    cross_references: Array.isArray(modelVerse.cross_references) ? modelVerse.cross_references.slice(0, 2) : [],
    editorial_flags: Array.isArray(modelVerse.editorial_flags) ? modelVerse.editorial_flags : [],
  };
}

function validateGenerated(book, chapter, result, kjvVerses) {
  if (!result || !Array.isArray(result.verses)) throw new Error(`No verse array returned for ${book.name} ${chapter}`);
  if (result.verses.length !== kjvVerses.length) throw new Error(`${book.name} ${chapter}: expected ${kjvVerses.length} verses, got ${result.verses.length}`);
  for (let i = 0; i < kjvVerses.length; i += 1) {
    const expected = Number(kjvVerses[i].verse);
    const got = Number(result.verses[i]?.verse);
    if (got !== expected) throw new Error(`${book.name} ${chapter}: verse alignment error at ${expected}; got ${got}`);
    if (!String(result.verses[i]?.restored || "").trim()) throw new Error(`${book.name} ${chapter}:${expected} missing restored text`);
    if (!String(result.verses[i]?.mystical_translation || "").trim()) throw new Error(`${book.name} ${chapter}:${expected} missing mystical text`);
  }
}

function writeChapter(book, chapter, result, kjvVerses) {
  const bookDir = path.join(root, "scripture", book.id);
  const mysticalDir = path.join(bookDir, "mystical");
  fs.mkdirSync(mysticalDir, { recursive: true });

  const restoredVerses = result.verses.map((verse, i) => normalizeVerse(verse, kjvVerses[i].text));
  const mysticalVerses = result.verses.map((verse) => ({
    verse: Number(verse.verse),
    mystical_translation: String(verse.mystical_translation || "").trim(),
  }));

  const restored = {
    book: book.name,
    book_id: book.id,
    chapter,
    audit_status: {
      status: "source-audited-draft",
      source_base: `Hebrew ${book.name} chapter ${chapter} via Sefaria source text; public-domain KJV familiar comparison`,
      review_note: String(result.review_note || "Source-sensitive draft generated for later continuity and witness audit.").trim(),
    },
    verses: restoredVerses,
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
      source_language: "Hebrew",
      model: MODEL,
      continuity_audit: "pending-global-pass",
    },
  };

  const mystical = {
    book: book.name,
    book_id: book.id,
    chapter,
    layer: "mystical-companion",
    verses: mysticalVerses,
    contemplative_note: String(result.contemplative_note || "").trim(),
    safety_note: String(result.safety_note || "").trim(),
    generation_status: {
      model: MODEL,
      aligned_to_restored_chapter: true,
      continuity_audit: "pending-global-pass",
    },
  };

  fs.writeFileSync(path.join(bookDir, `${book.id}-${pad(chapter)}.json`), `${JSON.stringify(restored, null, 2)}\n`);
  fs.writeFileSync(path.join(mysticalDir, `${book.id}-${pad(chapter)}-mystical.json`), `${JSON.stringify(mystical, null, 2)}\n`);
}

function updateTracker(book) {
  const bookDir = path.join(root, "scripture", book.id);
  const restored = fs.existsSync(bookDir) ? fs.readdirSync(bookDir).filter((name) => new RegExp(`^${book.id}-\\d{3}\\.json$`).test(name)).length : 0;
  const mysticalDir = path.join(bookDir, "mystical");
  const mystical = fs.existsSync(mysticalDir) ? fs.readdirSync(mysticalDir).filter((name) => new RegExp(`^${book.id}-\\d{3}-mystical\\.json$`).test(name)).length : 0;
  const tracker = {
    book: book.name,
    book_id: book.id,
    total_chapters: book.chapters,
    restored_chapters: restored,
    mystical_chapters: mystical,
    complete: restored === book.chapters && mystical === book.chapters,
    status: restored === book.chapters && mystical === book.chapters ? "complete-source-audited-draft-with-mystical-companions" : "in-progress-source-audited-draft",
    generation_model: MODEL,
    continuity_audit: "pending-global-pass",
  };
  fs.mkdirSync(path.join(root, "metadata"), { recursive: true });
  fs.writeFileSync(path.join(root, "metadata", `${book.id}-progress.json`), `${JSON.stringify(tracker, null, 2)}\n`);
}

let generated = 0;
let stoppedForQuota = false;
const state = { model: MODEL, generatedThisRun: 0, stoppedForQuota: false, lastChapter: null, updatedAt: new Date().toISOString() };

outer:
for (const book of books) {
  const kjv = await fetchKjv(book);
  const chapters = new Map((kjv.chapters || []).map((chapter) => [Number(chapter.chapter), chapter.verses || []]));
  for (let chapter = 1; chapter <= book.chapters; chapter += 1) {
    if (generated >= maxChapters) break outer;
    const restoredPath = path.join(root, "scripture", book.id, `${book.id}-${pad(chapter)}.json`);
    const mysticalPath = path.join(root, "scripture", book.id, "mystical", `${book.id}-${pad(chapter)}-mystical.json`);
    if (fs.existsSync(restoredPath) && fs.existsSync(mysticalPath)) continue;

    const kjvVerses = chapters.get(chapter);
    if (!kjvVerses?.length) throw new Error(`Missing KJV alignment for ${book.name} ${chapter}`);
    console.log(`Generating ${book.name} ${chapter} (${kjvVerses.length} verses) with ${MODEL}`);

    try {
      const hebrew = await fetchHebrew(book, chapter);
      if (hebrew.length !== kjvVerses.length) console.warn(`${book.name} ${chapter}: source has ${hebrew.length} segments; familiar has ${kjvVerses.length}`);
      const result = await infer(book, chapter, hebrew, kjvVerses);
      validateGenerated(book, chapter, result, kjvVerses);
      writeChapter(book, chapter, result, kjvVerses);
      generated += 1;
      state.generatedThisRun = generated;
      state.lastChapter = `${book.id}:${chapter}`;
      state.updatedAt = new Date().toISOString();
      updateTracker(book);
      await sleep(7000);
    } catch (error) {
      if (error?.status === 429) {
        console.warn(`GitHub Models quota/rate limit reached after ${generated} generated chapters; preserving completed work for next run.`);
        stoppedForQuota = true;
        state.stoppedForQuota = true;
        state.updatedAt = new Date().toISOString();
        break outer;
      }
      throw error;
    }
  }
  updateTracker(book);
}

for (const book of books) updateTracker(book);
fs.writeFileSync(path.join(root, "metadata", "generation-state.json"), `${JSON.stringify(state, null, 2)}\n`);
console.log(`Generation run complete: ${generated} new chapters${stoppedForQuota ? "; stopped at model quota" : ""}.`);
