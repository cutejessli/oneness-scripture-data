import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const scriptureDir = path.join(root, "scripture");
const metadataDir = path.join(root, "metadata");

const canon = [
  ["genesis","Genesis",50,"Torah","Hebrew Bible"],["exodus","Exodus",40,"Torah","Hebrew Bible"],["leviticus","Leviticus",27,"Torah","Hebrew Bible"],["numbers","Numbers",36,"Torah","Hebrew Bible"],["deuteronomy","Deuteronomy",34,"Torah","Hebrew Bible"],
  ["joshua","Joshua",24,"History","Hebrew Bible"],["judges","Judges",21,"History","Hebrew Bible"],["ruth","Ruth",4,"History","Hebrew Bible"],["1-samuel","1 Samuel",31,"History","Hebrew Bible"],["2-samuel","2 Samuel",24,"History","Hebrew Bible"],["1-kings","1 Kings",22,"History","Hebrew Bible"],["2-kings","2 Kings",25,"History","Hebrew Bible"],["1-chronicles","1 Chronicles",29,"History","Hebrew Bible"],["2-chronicles","2 Chronicles",36,"History","Hebrew Bible"],["ezra","Ezra",10,"History","Hebrew Bible"],["nehemiah","Nehemiah",13,"History","Hebrew Bible"],["esther","Esther",10,"History","Hebrew Bible"],
  ["job","Job",42,"Wisdom","Hebrew Bible"],["psalms","Psalms",150,"Wisdom","Hebrew Bible"],["proverbs","Proverbs",31,"Wisdom","Hebrew Bible"],["ecclesiastes","Ecclesiastes",12,"Wisdom","Hebrew Bible"],["song-of-songs","Song of Songs",8,"Wisdom","Hebrew Bible"],
  ["isaiah","Isaiah",66,"Prophets","Hebrew Bible"],["jeremiah","Jeremiah",52,"Prophets","Hebrew Bible"],["lamentations","Lamentations",5,"Prophets","Hebrew Bible"],["ezekiel","Ezekiel",48,"Prophets","Hebrew Bible"],["daniel","Daniel",12,"Prophets","Hebrew Bible"],["hosea","Hosea",14,"Prophets","Hebrew Bible"],["joel","Joel",3,"Prophets","Hebrew Bible"],["amos","Amos",9,"Prophets","Hebrew Bible"],["obadiah","Obadiah",1,"Prophets","Hebrew Bible"],["jonah","Jonah",4,"Prophets","Hebrew Bible"],["micah","Micah",7,"Prophets","Hebrew Bible"],["nahum","Nahum",3,"Prophets","Hebrew Bible"],["habakkuk","Habakkuk",3,"Prophets","Hebrew Bible"],["zephaniah","Zephaniah",3,"Prophets","Hebrew Bible"],["haggai","Haggai",2,"Prophets","Hebrew Bible"],["zechariah","Zechariah",14,"Prophets","Hebrew Bible"],["malachi","Malachi",4,"Prophets","Hebrew Bible"],
  ["matthew","Matthew",28,"Gospels","New Testament"],["mark","Mark",16,"Gospels","New Testament"],["luke","Luke",24,"Gospels","New Testament"],["john","John",21,"Gospels","New Testament"],["acts","Acts",28,"Acts","New Testament"],
  ["romans","Romans",16,"Letters","New Testament"],["1-corinthians","1 Corinthians",16,"Letters","New Testament"],["2-corinthians","2 Corinthians",13,"Letters","New Testament"],["galatians","Galatians",6,"Letters","New Testament"],["ephesians","Ephesians",6,"Letters","New Testament"],["philippians","Philippians",4,"Letters","New Testament"],["colossians","Colossians",4,"Letters","New Testament"],["1-thessalonians","1 Thessalonians",5,"Letters","New Testament"],["2-thessalonians","2 Thessalonians",3,"Letters","New Testament"],["1-timothy","1 Timothy",6,"Letters","New Testament"],["2-timothy","2 Timothy",4,"Letters","New Testament"],["titus","Titus",3,"Letters","New Testament"],["philemon","Philemon",1,"Letters","New Testament"],["hebrews","Hebrews",13,"Letters","New Testament"],["james","James",5,"Letters","New Testament"],["1-peter","1 Peter",5,"Letters","New Testament"],["2-peter","2 Peter",3,"Letters","New Testament"],["1-john","1 John",5,"Letters","New Testament"],["2-john","2 John",1,"Letters","New Testament"],["3-john","3 John",1,"Letters","New Testament"],["jude","Jude",1,"Letters","New Testament"],
  ["revelation","Revelation",22,"Apocalypse","New Testament"]
];

function chapterNumbers(dir, regex) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).map((name) => name.match(regex)).filter(Boolean).map((match) => Number(match[1])).sort((a, b) => a - b);
}

function trackerStatus(bookId) {
  const file = path.join(metadataDir, `${bookId}-progress.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")).current_status || null;
  } catch {
    return null;
  }
}

function safeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const books = canon.map(([id, name, chapterCount, section, testament], index) => {
  const bookDir = path.join(scriptureDir, id);
  const mysticalDir = path.join(bookDir, "mystical");
  const escapedId = safeRegex(id);
  const restored = chapterNumbers(bookDir, new RegExp(`^${escapedId}-(\\d{3})\\.json$`));
  const mystical = chapterNumbers(mysticalDir, new RegExp(`^${escapedId}-(\\d{3})-mystical\\.json$`));
  const complete = restored.length === chapterCount && mystical.length === chapterCount;

  return {
    id,
    name,
    order: index + 1,
    section,
    testament,
    chapterCount,
    availableChapters: restored,
    mysticalChapters: mystical,
    restoredCount: restored.length,
    mysticalCount: mystical.length,
    complete,
    status: trackerStatus(id) || (restored.length ? "in-progress-source-audited-draft" : "not-yet-published")
  };
});

const manifest = {
  project: "Oneness Scripture",
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  dataBranch: "main",
  dataBase: "https://raw.githubusercontent.com/cutejessli/oneness-scripture-data/main",
  stats: {
    canonBooks: books.length,
    booksLive: books.filter((book) => book.restoredCount > 0).length,
    restoredChaptersLive: books.reduce((sum, book) => sum + book.restoredCount, 0),
    mysticalChaptersLive: books.reduce((sum, book) => sum + book.mysticalCount, 0)
  },
  books
};

fs.writeFileSync(path.join(metadataDir, "library-index.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`library-index.json: ${manifest.stats.booksLive} books, ${manifest.stats.restoredChaptersLive} restored chapters`);
