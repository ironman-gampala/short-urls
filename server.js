import "dotenv/config";
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

app.use(express.json());

/** Check if a string is a valid http or https URL */
function isValidHttpUrl(str) {
  if (typeof str !== "string" || !str.trim()) return false;
  try {
    const u = new URL(str.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Generate a random 7-character code from [a-zA-Z0-9] */
function makeCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const RESERVED_CODES = new Set(["api"]);
/** Validate custom code: 1–32 chars, only [a-zA-Z0-9], not reserved */
function isValidCustomCode(str) {
  if (typeof str !== "string") return false;
  const s = str.trim();
  if (s.length < 1 || s.length > 32) return false;
  if (RESERVED_CODES.has(s.toLowerCase())) return false;
  return /^[a-zA-Z0-9]+$/.test(s);
}

// Static files first so /style.css, /script.js, /favicon.ico are served
app.use(express.static(join(__dirname, "public")));

// POST /api/shorten
app.post("/api/shorten", async (req, res) => {
  const url = req.body?.url;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing or invalid url" });
  }
  const trimmed = url.trim();
  if (!isValidHttpUrl(trimmed)) {
    return res.status(400).json({ error: "URL must be http or https" });
  }

  const customCode = req.body?.code != null ? String(req.body.code).trim() : "";
  let code = null;

  if (customCode) {
    if (!isValidCustomCode(customCode)) {
      return res.status(400).json({
        error: "Invalid short code. Use 1–32 letters or numbers only (e.g. mmt).",
      });
    }
    const { data: existing } = await supabase
      .from("links")
      .select("code")
      .eq("code", customCode)
      .maybeSingle();
    if (existing) {
      return res.status(409).json({ error: "Code already taken" });
    }
    code = customCode;
  } else {
    for (let attempt = 0; attempt < 8; attempt++) {
      const candidate = makeCode();
      const { data: existing } = await supabase
        .from("links")
        .select("code")
        .eq("code", candidate)
        .maybeSingle();
      if (!existing) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      return res.status(500).json({ error: "Could not allocate code" });
    }
  }

  const { error: insertError } = await supabase.from("links").insert({ code, url: trimmed });
  if (insertError) {
    return res.status(500).json({ error: insertError.message || "Insert failed" });
  }

  const shortUrl = `${req.protocol}://${req.get("host")}/${code}`;
  return res.status(200).json({ code, shortUrl, longUrl: trimmed });
});

// GET /:code — only reached when static did not serve a file
app.get("/:code", async (req, res) => {
  const { code } = req.params;
  const { data, error } = await supabase
    .from("links")
    .select("url")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    return res.status(500).send("Server error");
  }
  if (!data) {
    return res.status(404).type("text/plain").send("Not found");
  }
  return res.redirect(302, data.url);
});

export { app };

if (!process.env.NETLIFY) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`URL shortener listening on port ${PORT}`);
  });
}
