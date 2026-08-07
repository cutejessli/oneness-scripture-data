import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, value = "true"] = arg.replace(/^--/, "").split("=");
  return [key, value];
}));
const books = (args.books || "").split(",").map((s) => s.trim()).filter(Boolean);
if (!books.length) throw new Error("Pass --books=book-a,book-b");

let chapters = 0;
let verses = 0;
for (const id of books) {
  const dir = path.join(root, "scripture", id);
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter((name) => new RegExp(`^${id}-\\d{3}\\.json$`).test(name)).sort();
  for (const name of files) {
    const restoredPath = path.join(dir, name);
    const restored = JSON.parse(fs.readFileSync(restoredPath, "utf8"));
    if (!Array.isArray(restored.verses) || restored.verses.length === 0) throw new Error(`${restoredPath}: no verses`);
    for (let i = 0; i < restored.verses.length; i += 1) {
      const verse = restored.verses[i];
      if (Number(verse.verse) !== i + 1) throw new Error(`${restoredPath}: non-sequential verse at ${i + 1}`);
      if (!String(verse.restored || "").trim()) throw new Error(`${restoredPath}:${i + 1}: missing restored text`);
      if (/\bLORD\b/.test(String(verse.restored))) throw new Error(`${restoredPath}:${i + 1}: restored text contains LORD instead of YHWH convention`);
      if (!String(verse.familiar?.text || "").trim()) throw new Error(`${restoredPath}:${i + 1}: missing familiar comparison`);
      if (verse.familiar?.source !== "KJV") throw new Error(`${restoredPath}:${i + 1}: familiar source is not KJV`);
      for (const term of verse.terms || []) {
        if (!term.source || !term.display || !term.glossary_id) throw new Error(`${restoredPath}:${i + 1}: malformed term`);
        if (!['Hebrew','Aramaic'].includes(term.language)) throw new Error(`${restoredPath}:${i + 1}: invalid source-term language ${term.language}`);
      }
      verses += 1;
    }

    const ch = String(restored.chapter).padStart(3, "0");
    const mysticalPath = path.join(dir, "mystical", `${id}-${ch}-mystical.json`);
    if (!fs.existsSync(mysticalPath)) throw new Error(`${restoredPath}: missing mystical companion`);
    const mystical = JSON.parse(fs.readFileSync(mysticalPath, "utf8"));
    if (!Array.isArray(mystical.verses) || mystical.verses.length !== restored.verses.length) throw new Error(`${mysticalPath}: verse count does not match restored`);
    for (let i = 0; i < mystical.verses.length; i += 1) {
      const verse = mystical.verses[i];
      if (Number(verse.verse) !== i + 1 || !String(verse.mystical_translation || "").trim()) throw new Error(`${mysticalPath}:${i + 1}: invalid mystical alignment`);
    }
    chapters += 1;
  }
}
console.log(`Validated ${chapters} generated chapter pairs / ${verses} restored verses across ${books.join(', ')}.`);
