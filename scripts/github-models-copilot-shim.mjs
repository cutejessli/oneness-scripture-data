#!/usr/bin/env node
import fs from "node:fs";

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};

const prompt = valueAfter("-p") || valueAfter("--prompt");
if (!prompt) {
  console.error("GitHub Models shim: missing -p prompt");
  process.exit(2);
}

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) {
  console.error("GitHub Models shim: GITHUB_TOKEN is required");
  process.exit(2);
}

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "X-GitHub-Api-Version": "2026-03-10",
};

const cachePath = "/tmp/oneness-github-model-id";

async function chooseModel() {
  if (process.env.GITHUB_MODELS_MODEL) return process.env.GITHUB_MODELS_MODEL;
  if (fs.existsSync(cachePath)) {
    const cached = fs.readFileSync(cachePath, "utf8").trim();
    if (cached) return cached;
  }

  try {
    const response = await fetch("https://models.github.ai/catalog/models", { headers });
    if (response.ok) {
      const catalog = await response.json();
      const ids = (Array.isArray(catalog) ? catalog : []).map((m) => String(m.id || ""));
      const preferred = [
        "openai/gpt-5.6-terra",
        "openai/gpt-5.6-sol",
        "openai/gpt-5.5",
        "openai/gpt-5.4",
        "openai/gpt-5",
        "openai/gpt-4.1",
      ];
      for (const wanted of preferred) {
        const exact = ids.find((id) => id.toLowerCase() === wanted.toLowerCase());
        if (exact) {
          fs.writeFileSync(cachePath, exact);
          return exact;
        }
      }
      const bestOpenAI = ids.find((id) => /^openai\/gpt-/i.test(id));
      if (bestOpenAI) {
        fs.writeFileSync(cachePath, bestOpenAI);
        return bestOpenAI;
      }
    }
  } catch {
    // Fall through to the documented stable model ID.
  }

  return "openai/gpt-4.1";
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const model = await chooseModel();

for (let attempt = 1; attempt <= 8; attempt += 1) {
  const response = await fetch("https://models.github.ai/inference/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "Follow the user's requested output format exactly. When asked for JSON, return only valid JSON with no markdown fences or commentary.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 30000,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      console.error(`GitHub Models returned no text for ${model}`);
      process.exit(1);
    }
    process.stdout.write(content);
    process.exit(0);
  }

  const body = await response.text();
  if ((response.status === 429 || response.status >= 500) && attempt < 8) {
    const retryAfter = Number(response.headers.get("retry-after") || 0);
    const delay = retryAfter > 0 ? retryAfter * 1000 : Math.min(60000, 5000 * 2 ** (attempt - 1));
    console.error(`GitHub Models ${response.status}; retrying ${model} (attempt ${attempt}/8)`);
    await sleep(delay);
    continue;
  }

  console.error(`GitHub Models inference failed (${response.status}) using ${model}: ${body.slice(-4000)}`);
  process.exit(1);
}
