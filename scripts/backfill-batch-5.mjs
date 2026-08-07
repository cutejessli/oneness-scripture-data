import fs from "node:fs";
import path from "node:path";

const basePath = path.join(process.cwd(), "scripts", "backfill-batch-4.mjs");
const source = fs.readFileSync(basePath, "utf8");

const books = `const BOOKS = {
  john: {
    source: "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/John.json",
    language: "Greek",
  },
  acts: {
    source: "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/Acts.json",
    language: "Greek",
  },
  romans: {
    source: "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/Romans.json",
    language: "Greek",
  },
  "1-corinthians": {
    source: "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/1Corinthians.json",
    language: "Greek",
  },
  "2-corinthians": {
    source: "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/2Corinthians.json",
    language: "Greek",
  },
  galatians: {
    source: "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master/Galatians.json",
    language: "Greek",
  },
};`;

let patched = source.replace(/const BOOKS = \{[\s\S]*?\n\};\n\nconst TAG_RULES/, `${books}\n\nconst TAG_RULES`);
if (patched === source) throw new Error("Could not replace BOOKS block for batch 5");
patched = patched.replace("batch_version: 4", "batch_version: 5");

const tempPath = path.join(process.cwd(), "scripts", ".backfill-batch-5-runtime.mjs");
fs.writeFileSync(tempPath, patched);
try {
  await import(`./.backfill-batch-5-runtime.mjs?run=${Date.now()}`);
} finally {
  fs.rmSync(tempPath, { force: true });
}
