// Extracts INSAIT JOY session data from the newest image in /sessions
// and writes /data/latest-session.json. Run by GitHub Actions (Node 20, global fetch).
//
// Env:
//   ANTHROPIC_API_KEY  (required)  - your Anthropic API key (GitHub secret)
//   ANTHROPIC_MODEL    (optional)  - defaults to "claude-sonnet-4-6"

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const SESSIONS_DIR = join(ROOT, "sessions");
const OUT = join(ROOT, "data", "latest-session.json");
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY");
  process.exit(1);
}

const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

function newestImage() {
  const files = readdirSync(SESSIONS_DIR)
    .filter((f) => MIME[extname(f).toLowerCase()])
    .map((f) => ({ f, t: statSync(join(SESSIONS_DIR, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  if (!files.length) throw new Error("No image found in /sessions");
  return files[0].f;
}

const SCHEMA = `{
  "date_display": string  // e.g. "17 May 2026 · Sun" (format the date you see as "D Mon YYYY · Ddd")
  "kickoff": string       // e.g. "10:16"
  "duration": string      // the value next to "Time", formatted exactly as shown, e.g. "138'17\\""
  "grade": string         // e.g. "A+"
  "score": number         // the /NN score, e.g. 88
  "beating": number       // the "Beating NN% users" percentage, e.g. 91
  "scores": { "stamina": number, "speed": number, "acceleration": number, "balance": number, "power": number },
  "stamina": { "distance_per_min": number, "avg_sprint": number, "calories": number, "distance": number, "high_speed": number, "sprint": number },
  "speed": { "hs_runs": number, "max_speed": string, "sprints": number },   // max_speed as string to keep the decimal, e.g. "26.0"
  "acceleration": { "max_accel": string, "sharp_turns": number, "jumps": number, "highest_jump": number },  // max_accel as string, e.g. "3.8"
  "balance": { "left_foot": number, "right_foot": number, "touch_left": number, "touch_right": number },
  "power": { "max_kick": number }
}`;

const PROMPT = `You are a precise data extractor for INSAIT JOY football session reports.
Read the attached report image and return ONLY a single JSON object, no prose, no markdown fences.
Use EXACTLY these keys and types:
${SCHEMA}
Rules:
- Numbers must be plain numbers (no thousands separators, no units).
- Keep "max_speed" and "max_accel" as strings exactly as displayed (preserve the decimal).
- "duration" is the value labelled "Time".
- If any single value is genuinely unreadable, use null for that field only.
- Output the JSON object and nothing else.`;

async function main() {
  const img = newestImage();
  const b64 = readFileSync(join(SESSIONS_DIR, img)).toString("base64");
  const media = MIME[extname(img).toLowerCase()];

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: media, data: b64 } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error("API error", res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  let text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  text = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    console.error("Could not parse JSON from model output:\n", text);
    process.exit(1);
  }

  parsed.source_image = "sessions/" + img;

  // light sanity check
  for (const k of ["score", "scores", "stamina", "speed", "acceleration", "balance", "power"]) {
    if (parsed[k] === undefined) {
      console.error("Missing key in extracted data:", k);
      process.exit(1);
    }
  }

  writeFileSync(OUT, JSON.stringify(parsed, null, 2) + "\n");
  console.log("Wrote", OUT, "from", img);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
