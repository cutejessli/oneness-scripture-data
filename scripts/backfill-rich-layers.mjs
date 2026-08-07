import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, value = "true"] = arg.replace(/^--/, "").split("=");
  return [key, value];
}));

const BOOK_SOURCES = {
  "1-chronicles": "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/1Chronicles.json",
};

function pad(n) { return String(n).padStart(3, "0"); }
function note(title, body) { return { title, body }; }
function term(display, source, glossary_id, transliteration = source) {
  return { display, source, language: "Hebrew", glossary_id, transliteration };
}
function xref(reference, relationship = "parallel") { return { reference, relationship }; }
function uniq(values) { return [...new Set(values)]; }

const curated = {
  "1-chronicles:1": {
    ranges: [
      [1, 4, ["genealogy", "ancestral-memory", "primeval-history"], [xref("Genesis 5", "compressed-genealogy")]],
      [5, 23, ["genealogy", "ancestral-memory", "nations", "table-of-nations"], [xref("Genesis 10", "parallel-genealogy")]],
      [24, 27, ["genealogy", "ancestral-memory", "shem-line", "abraham-line"], [xref("Genesis 11:10-26", "parallel-genealogy")]],
      [28, 33, ["genealogy", "ancestral-memory", "abraham-family"], [xref("Genesis 25:1-18", "parallel-genealogy")]],
      [34, 42, ["genealogy", "ancestral-memory", "esau", "edom"], [xref("Genesis 36:1-30", "parallel-genealogy")]],
      [43, 54, ["genealogy", "ancestral-memory", "edom", "kingship", "political-memory"], [xref("Genesis 36:31-43", "parallel-genealogy")]],
    ],
    verses: {
      1: { notes: [note("Chronicles begins with Adam", "The genealogy opens with Adam and compresses long ancestral narratives into names. The list functions as a memory map, not a claim that only named males matter.")] },
      7: { notes: [note("Rodanim / Dodanim", "The restored text preserves the name variant rather than silently choosing one spelling. Parallel witnesses and Genesis 10 require later source-critical comparison.")], editorial_flags: ["textual-name-variant"] },
      10: { notes: [note("Mighty", "The description of Nimrod as mighty reports status or prowess; it is not automatically moral praise or divine endorsement.")], terms: [term("mighty", "gibbor", "gibbor")], tags: ["nimrod", "power"] },
      12: { notes: [note("Philistine ancestry line", "The compressed ancestry notice parallels Genesis 10 and has textual and historical complexities. Ancient genealogical labels must not be mapped directly onto modern populations.")], editorial_flags: ["ethnic-reception-risk"] },
      17: { notes: [note("Meshech / Mash", "The final name varies across parallel textual traditions. The slash preserves the unresolved reading rather than hiding the difference.")], editorial_flags: ["textual-name-variant"] },
      19: { notes: [note("Peleg and divided", "The verse connects Peleg's name with a division of the earth through Hebrew wordplay. The genealogy does not explain exactly what historical event the phrase refers to.")], terms: [term("Peleg", "Peleg", "peleg"), term("divided", "niflegah", "palag")], tags: ["wordplay"] },
      22: { notes: [note("Ebal / Obal", "The restored form keeps the parallel-name variation visible for later witness audit.")], editorial_flags: ["textual-name-variant"] },
      27: { notes: [note("Abram / Abraham", "The genealogy explicitly links the earlier name Abram with Abraham, maintaining continuity across the naming transition.")], terms: [term("Abram", "Avram", "abram"), term("Abraham", "Avraham", "abraham")], tags: ["renaming"] },
      28: { notes: [note("Isaac and Ishmael", "Both sons are retained in the ancestral archive. The list should not be read as permission to erase or degrade Ishmael's descendants.")], tags: ["ishmael"], editorial_flags: ["anti-ethnic-erasure"] },
      29: { notes: [note("Ishmael's firstborn", "Nebaioth is identified as Ishmael's firstborn. The genealogy preserves Ishmael's family as part of the larger Abrahamic memory.")], tags: ["ishmael"], editorial_flags: ["anti-ethnic-erasure"] },
      30: { tags: ["ishmael"] },
      31: { notes: [note("Sons of Ishmael", "The closing formula confirms the Ishmaelite line as a remembered branch of Abraham's family, not an alien or disposable people.")], tags: ["ishmael"], editorial_flags: ["anti-ethnic-erasure"] },
      32: { notes: [note("Keturah: concubine / wife", "Chronicles calls Keturah Abraham's concubine, while Genesis 25:1 calls her a wife and Genesis 25:6 refers to Abraham's concubines. The restored wording keeps that textual relationship visible instead of flattening it.")], terms: [term("concubine", "pilegesh", "pilegesh")], tags: ["keturah"], editorial_flags: ["gender-power-audit", "parallel-text-tension"] },
      33: { notes: [note("Keturah's descendants", "The descendants of Keturah remain part of the Abrahamic archive. Their presence should not be used to build later racial or religious hierarchies.")], tags: ["keturah"], editorial_flags: ["anti-ethnic-erasure"] },
      34: { notes: [note("Esau and Israel", "Esau and Israel are named together as Isaac's sons. The genealogy preserves kinship even where later narratives describe conflict.")], terms: [term("Israel", "Yisrael", "israel")], editorial_flags: ["anti-ethnic-erasure"] },
      36: { notes: [note("Timna and Amalek", "Timna is included inside the family line, and Amalek appears here as an ancestral name. This verse must never be converted into a label for a living ethnic, religious, or political enemy.")], terms: [term("Amalek", "Amaleq", "amalek")], tags: ["amalek", "reception-risk"], editorial_flags: ["modern-targeting-prohibited", "anti-collective-punishment"] },
      39: { notes: [note("Timna named as sister", "The line briefly breaks the dominant father-son pattern to name Timna as Lotan's sister. Her presence matters even though the genealogy gives women far less space overall.")], tags: ["women-in-genealogy"], editorial_flags: ["women-visible"] },
      40: { notes: [note("Name variants", "Alian/Alvan and Shephi/Shepho preserve differences found across parallel forms instead of silently standardizing them.")], editorial_flags: ["textual-name-variant"] },
      41: { notes: [note("Hamran / Hemdan", "The restored form keeps a parallel-name variation visible for later witness audit.")], editorial_flags: ["textual-name-variant"] },
      43: { notes: [note("Edom had kings before Israel", "The text explicitly remembers Edomite kings before Israelite monarchy. Political organization outside Israel is part of the biblical memory and should not be erased by Israel-centered readings.")], terms: [term("kings", "melakhim", "melekh"), term("reigned", "malakh", "malakh")], tags: ["edomite-kings"], editorial_flags: ["anti-national-supremacy"] },
      46: { notes: [note("Struck Midian", "The notice records a military victory as part of royal memory. Description of conquest is not moral authorization for violence against later peoples.")], editorial_flags: ["war-description-not-endorsement", "anti-ethnic-targeting"] },
      50: { notes: [note("Mehetabel, Matred, Me-zahab", "Three generations of women are named within the royal genealogy. Their naming should not be treated as incidental simply because most of the chapter is patrilineal."), note("Hadad / Hadar; Pai / Pau", "The restored text keeps variant forms visible rather than choosing a single spelling without a full witness audit.")], tags: ["women-in-genealogy"], editorial_flags: ["women-visible", "textual-name-variant"] },
      51: { notes: [note("Chiefs, not modern dukes", "The Hebrew title is better understood as clan chief or leader. The familiar KJV uses duke, an English historical title that can mislead modern readers."), note("Aliah / Alvah", "The restored text preserves a name variant for later textual comparison.")], terms: [term("chief", "alluf", "alluf")], tags: ["clan-leadership"], editorial_flags: ["textual-name-variant"] },
      52: { notes: [note("Chiefs, not modern dukes", "The Hebrew title is better understood as clan chief or leader. The familiar KJV uses duke, an English historical title that can mislead modern readers.")], terms: [term("chief", "alluf", "alluf")], tags: ["clan-leadership"] },
      53: { notes: [note("Chiefs, not modern dukes", "The Hebrew title is better understood as clan chief or leader. The familiar KJV uses duke, an English historical title that can mislead modern readers.")], terms: [term("chief", "alluf", "alluf")], tags: ["clan-leadership"] },
      54: { notes: [note("Chiefs, not modern dukes", "The Hebrew title is better understood as clan chief or leader. The familiar KJV uses duke, an English historical title that can mislead modern readers.")], terms: [term("chief", "alluf", "alluf")], tags: ["clan-leadership"] },
    },
  },
};

async function getKjv(bookId) {
  const url = BOOK_SOURCES[bookId];
  if (!url) throw new Error(`No familiar-source mapping yet for ${bookId}`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`KJV fetch failed: ${response.status}`);
  return response.json();
}

function applyCurated(verse, spec, chapter) {
  verse.notes ??= [];
  verse.terms ??= [];
  verse.tags ??= [];
  verse.cross_references ??= [];

  for (const [start, end, rangeTags, refs] of spec?.ranges ?? []) {
    if (verse.verse >= start && verse.verse <= end) {
      verse.tags = uniq([...verse.tags, ...rangeTags]);
      const seen = new Set(verse.cross_references.map((r) => `${r.reference}|${r.relationship}`));
      for (const ref of refs) if (!seen.has(`${ref.reference}|${ref.relationship}`)) verse.cross_references.push(ref);
    }
  }

  if (verse.verse >= 5 && verse.verse <= 23) {
    verse.editorial_flags = uniq([...(verse.editorial_flags ?? []), "ancient-name-not-modern-target"]);
  }

  const item = spec?.verses?.[verse.verse];
  if (!item) return;
  if (item.notes) verse.notes.push(...item.notes);
  if (item.terms) verse.terms.push(...item.terms);
  if (item.tags) verse.tags = uniq([...verse.tags, ...item.tags]);
  if (item.editorial_flags) verse.editorial_flags = uniq([...(verse.editorial_flags ?? []), ...item.editorial_flags]);
}

async function backfill(bookId, chapterNumber) {
  const filename = path.join(root, "scripture", bookId, `${bookId}-${pad(chapterNumber)}.json`);
  if (!fs.existsSync(filename)) throw new Error(`Missing ${filename}`);
  const chapter = JSON.parse(fs.readFileSync(filename, "utf8").replace(/^\uFEFF/, ""));
  const kjvBook = await getKjv(bookId);
  const kjvChapter = kjvBook.chapters.find((c) => Number(c.chapter) === chapterNumber);
  if (!kjvChapter) throw new Error(`Missing familiar chapter ${bookId} ${chapterNumber}`);
  const familiar = new Map(kjvChapter.verses.map((v) => [Number(v.verse), v.text]));
  const spec = curated[`${bookId}:${chapterNumber}`];

  for (const verse of chapter.verses ?? []) {
    const text = familiar.get(Number(verse.verse));
    if (text && !verse.familiar) verse.familiar = { source: "KJV", text };
    applyCurated(verse, spec, chapter);
  }

  chapter.layer_status = {
    ...(chapter.layer_status ?? {}),
    restored: true,
    familiar: chapter.verses.every((v) => v.familiar?.text),
    verse_notes: true,
    source_terms: "selective-key-terms",
    tags: true,
    cross_references: true,
    editorial_flags: true,
    mystical_companion: "separate-file",
  };
  chapter.backfill_status = {
    status: "rich-layer-backfilled",
    basis: "Genesis-style verse schema",
    preserved_restored_text: true,
  };
  chapter.source_witness_audit_flags ??= [];
  if (bookId === "1-chronicles" && chapterNumber === 1) {
    const flags = [
      "Compare 1 Chronicles 1 with Genesis 5, 10, 11, 25, and 36 for compressed genealogy and name variants.",
      "Rodanim/Dodanim, Meshech/Mash, Ebal/Obal, Hadad/Hadar, Zephi/Zepho, Alian/Alvan, Shephi/Shepho, Hamran/Hemdan, Pai/Pau, and related forms require manuscript/parallel witness review.",
      "Keturah's designation should be read alongside Genesis 25:1 and 25:6 rather than harmonized silently.",
    ];
    chapter.source_witness_audit_flags = uniq([...chapter.source_witness_audit_flags, ...flags]);
    if (chapter.audit_status?.review_note && !chapter.audit_status.review_note.includes("rich-layer backfill")) {
      chapter.audit_status.review_note += " Rich-layer backfill added familiar comparison, verse notes, selected source terms, tags, cross-references, and machine-readable editorial flags.";
    }
  }

  fs.writeFileSync(filename, `${JSON.stringify(chapter, null, 2)}\n`);
  console.log(`Backfilled ${bookId} ${chapterNumber}: ${chapter.verses.length} verses`);
}

const bookId = args.book ?? "1-chronicles";
const chapterNumber = Number(args.chapter ?? 1);
await backfill(bookId, chapterNumber);
