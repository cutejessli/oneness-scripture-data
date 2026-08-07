import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const baseScript = path.join(process.cwd(), "scripts", "backfill-large-batch.mjs");
const source = fs.readFileSync(baseScript, "utf8");

const extraSources = `const BOOK_SOURCES = {\n  "1-samuel": "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/1Samuel.json",\n  "joshua": "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/Joshua.json",\n  "judges": "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/Judges.json",\n  "ruth": "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/Ruth.json",\n  "deuteronomy": "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/Deuteronomy.json",`;

const patched = source.replace("const BOOK_SOURCES = {", extraSources);
if (patched === source) throw new Error("Could not inject batch-2 KJV source mappings");

const tempScript = path.join(os.tmpdir(), "oneness-backfill-batch-2.mjs");
fs.writeFileSync(tempScript, patched);

execFileSync(process.execPath, [
  tempScript,
  "--books=1-samuel,joshua,judges,ruth,deuteronomy",
], {
  cwd: process.cwd(),
  stdio: "inherit",
});
