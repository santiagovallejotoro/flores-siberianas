// One-shot script to generate the two ad creatives via OpenAI gpt-image-1.
// Usage: node scripts/generate-ad-images.mjs
import fs from "node:fs/promises";
import path from "node:path";

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY ||
  (await fs.readFile(".env.local", "utf8").catch(() => ""))
    .split("\n")
    .find((l) => l.startsWith("OPENAI_API_KEY="))
    ?.split("=")[1]
    ?.trim();

if (!OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY missing");
  process.exit(1);
}

const ads = [
  {
    file: "ad-a-hortensia-emocional.png",
    prompt:
      "Natural documentary photograph of a real hydrangea plant growing outdoors in a small Colombian highland farm in Oriente Antioqueño. A large blue-purple hydrangea bloom on its bush, surrounded by its own green serrated leaves, slightly imperfect with one or two flowers leaning, captured with morning natural light. Background: open mountain landscape with green hills, no greenhouse, no plastic — just open sky and field. Warm but realistic, looks like a real photo a farmer would take with a good camera, not over-stylized, not commercial product photography. Shallow depth of field. Square 1:1 framing. No text, no logos, no watermarks.",
  },
  {
    file: "ad-b-portal-celular.png",
    prompt:
      "Documentary-style photograph: weathered hands of a Colombian male flower farmer (around 45 years old, sun-tanned forearms, plaid work shirt) holding a modern smartphone vertically. The phone screen shows a clean abstract farm dashboard UI with green and purple accent colors — colorful bar charts, calendar grid, KPI cards (no readable text, just abstract shapes and icons). Background: open outdoor field of cultivated hydrangea bushes in full bloom under blue sky in the Colombian highlands of Oriente Antioqueño. NO greenhouse, NO plastic cover, NO tunnel — completely open sky overhead, mountains visible in the distance. Natural warm sunlight, shallow depth of field, real-world feel. Square 1:1 framing. No real text, no logos, no watermarks.",
  },
];

const outDir = path.resolve("public/images/ads");
await fs.mkdir(outDir, { recursive: true });

for (const ad of ads) {
  console.log(`Generating ${ad.file}...`);
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: ad.prompt,
      size: "1024x1024",
      n: 1,
    }),
  });
  if (!res.ok) {
    console.error(`Failed for ${ad.file}:`, res.status, await res.text());
    process.exit(1);
  }
  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) {
    console.error(`No image data for ${ad.file}:`, JSON.stringify(json).slice(0, 500));
    process.exit(1);
  }
  const buf = Buffer.from(b64, "base64");
  const outPath = path.join(outDir, ad.file);
  await fs.writeFile(outPath, buf);
  console.log(`  saved -> ${outPath} (${(buf.length / 1024).toFixed(0)} KB)`);
}

console.log("Done.");
