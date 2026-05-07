// Upload the two local PNG ads to Meta and print their image_hash values.
// Requires META_ACCESS_TOKEN in env (the same token the MCP uses).
import fs from "node:fs/promises";
import path from "node:path";

const ACCOUNT_ID = "act_1328757317281125";
const TOKEN = process.env.META_ACCESS_TOKEN;
if (!TOKEN) {
  console.error("META_ACCESS_TOKEN missing");
  process.exit(1);
}

const files = [
  { local: "public/images/ads/ad-a-hortensia-emocional.png", name: "ad_a_hortensia_emocional" },
  { local: "public/images/ads/ad-b-portal-celular.png", name: "ad_b_portal_celular" },
];

const out = {};
for (const f of files) {
  const buf = await fs.readFile(f.local);
  const fd = new FormData();
  fd.append("filename", new Blob([buf], { type: "image/png" }), `${f.name}.png`);
  fd.append("access_token", TOKEN);
  const res = await fetch(
    `https://graph.facebook.com/v24.0/${ACCOUNT_ID}/adimages`,
    { method: "POST", body: fd },
  );
  const json = await res.json();
  if (!res.ok) {
    console.error(`Failed for ${f.name}:`, JSON.stringify(json, null, 2));
    process.exit(1);
  }
  const hash = Object.values(json.images)[0].hash;
  console.log(`${f.name}: hash=${hash}`);
  out[f.name] = hash;
}

await fs.writeFile("scripts/_image_hashes.json", JSON.stringify(out, null, 2));
console.log("Wrote scripts/_image_hashes.json");
