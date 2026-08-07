import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const baseScript = path.join(process.cwd(), "scripts", "backfill-large-batch.mjs");
const source = fs.readFileSync(baseScript, "utf8");

const extraSources = `const BOOK_SOURCES = {\n  "exodus": "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/Exodus.json",\n  "leviticus": "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/Leviticus.json",\n  "numbers": "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/Numbers.json",`;

const patched = source.replace("const BOOK_SOURCES = {", extraSources);
if (patched === source) throw new Error("Could not inject batch-3 KJV source mappings");

const tempScript = path.join(os.tmpdir(), "oneness-backfill-batch-3.mjs");
fs.writeFileSync(tempScript, patched);

execFileSync(process.execPath, [
  tempScript,
  "--books=exodus,leviticus,numbers",
], {
  cwd: process.cwd(),
  stdio: "inherit",
});
