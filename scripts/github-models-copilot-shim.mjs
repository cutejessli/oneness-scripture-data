#!/usr/bin/env node

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};

const prompt = valueAfter("-p") || valueAfter("--prompt");
if (!prompt) {
  console.error("OpenAI shim: missing -p prompt");
  process.exit(2);
}

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OpenAI API key missing: configure repository secret OPENAI_API_KEY");
  process.exit(2);
}

const model = process.env.OPENAI_SCRIPTURE_MODEL || "gpt-5.6-terra";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (let attempt = 1; attempt <= 8; attempt += 1) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "Follow the requested output format exactly. Return only one valid JSON object, with no markdown fences, preamble, or commentary.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 32000,
      reasoning_effort: "medium"
    }),
  });

  if (response.ok) {
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      console.error(`OpenAI returned no text for ${model}`);
      process.exit(1);
    }
    process.stdout.write(content);
    process.exit(0);
  }

  const body = await response.text();
  if ((response.status === 429 || response.status >= 500) && attempt < 8) {
    const retryAfter = Number(response.headers.get("retry-after") || 0);
    const delay = retryAfter > 0 ? retryAfter * 1000 : Math.min(60000, 5000 * 2 ** (attempt - 1));
    console.error(`OpenAI ${response.status}; retrying ${model} (attempt ${attempt}/8)`);
    await sleep(delay);
    continue;
  }

  const quotaLabel = response.status === 429 ? " quota/rate limit" : "";
  console.error(`OpenAI API${quotaLabel} failed (${response.status}) using ${model}: ${body.slice(-4000)}`);
  process.exit(1);
}
