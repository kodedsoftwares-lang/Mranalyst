import { Router, type Request, type Response } from "express";
import { query, queryOne } from "../../lib/db.js";
import { requireAdmin } from "../../middlewares/admin-auth.js";
import { z } from "zod";

const router = Router();
router.use(requireAdmin);

const tipSchema = z.object({
  tier: z.enum(["pro_plus", "pro"]),
  teams: z.string().optional(),
  tip_type: z.string().optional(),
  odds: z.number().positive().optional(),
  status: z.enum(["locked", "pending", "won", "lost", "postponed", "cancelled"]),
  match_date: z.string().optional(),
  match_time: z.string().optional(),
  publish_at: z.string().optional(),
});

const tipUpdateSchema = tipSchema.partial();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  const tier = req.query.tier as string | undefined;
  const limit = parseInt((req.query.limit as string) || "50", 10);
  const offset = parseInt((req.query.offset as string) || "0", 10);

  try {
    const params: unknown[] = [limit, offset];
    let sql = `SELECT * FROM tips`;
    if (tier) {
      sql += ` WHERE tier = $3`;
      params.push(tier);
    }
    sql += ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`;

    const rows = await query(sql, params);
    const tips = rows.map((tip) => ({
      ...tip,
      match_date: tip.match_date ? (tip.match_date as Date).toISOString().slice(0, 10) : null,
      is_locked: tip.status === "locked",
    }));
    res.json(tips);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin tips");
    res.status(500).json({ error: "Failed to fetch tips" });
  }
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = tipSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { tier, teams, tip_type, odds, status, match_date, match_time, publish_at } = parsed.data;

  try {
    const row = await queryOne(
      `INSERT INTO tips (tier, teams, tip_type, odds, status, match_date, match_time, publish_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [tier, teams ?? null, tip_type ?? null, odds ?? null, status,
       match_date ?? null, match_time ?? null, publish_at ?? null],
    );
    const tip = row as Record<string, unknown>;
    res.status(201).json({
      ...tip,
      match_date: tip.match_date ? (tip.match_date as Date).toISOString().slice(0, 10) : null,
      is_locked: tip.status === "locked",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create tip");
    res.status(500).json({ error: "Failed to create tip" });
  }
});

router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const parsed = tipUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const updates = parsed.data;
  const fields = Object.keys(updates) as (keyof typeof updates)[];
  if (fields.length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
  const values = fields.map((f) => updates[f] ?? null);

  try {
    const row = await queryOne(
      `UPDATE tips SET ${setClauses} WHERE id = $1 RETURNING *`,
      [id, ...values],
    );
    if (!row) {
      res.status(404).json({ error: "Tip not found" });
      return;
    }
    const tip = row as Record<string, unknown>;
    res.json({
      ...tip,
      match_date: tip.match_date ? (tip.match_date as Date).toISOString().slice(0, 10) : null,
      is_locked: tip.status === "locked",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update tip");
    res.status(500).json({ error: "Failed to update tip" });
  }
});

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await query(`DELETE FROM tips WHERE id = $1`, [id]);
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete tip");
    res.status(500).json({ error: "Failed to delete tip" });
  }
});

// POST /api/admin/tips/import-bulk  — bulk insert from CSV or betslip scan
const bulkImportSchema = z.object({
  tier: z.enum(["pro_plus", "pro"]).default("pro_plus"),
  status: z.enum(["locked", "pending", "won", "lost", "postponed", "cancelled"]).default("pending"),
  tips: z.array(z.object({
    teams: z.string().optional(),
    tip_type: z.string().optional(),
    odds: z.union([z.number(), z.string()]).optional().transform((v) => {
      if (v === undefined || v === null || v === "") return undefined;
      const n = typeof v === "number" ? v : parseFloat(v as string);
      return isNaN(n) ? undefined : n;
    }),
    match_date: z.string().optional(),
    match_time: z.string().optional(),
  })),
});

router.post("/import-bulk", async (req: Request, res: Response): Promise<void> => {
  const parsed = bulkImportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }
  const { tier, status, tips } = parsed.data;
  const results: Array<{ ok: boolean; error?: string; teams?: string }> = [];

  for (const t of tips) {
    try {
      await queryOne(
        `INSERT INTO tips (tier, teams, tip_type, odds, status, match_date, match_time)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [tier, t.teams ?? null, t.tip_type ?? null, t.odds ?? null, status,
         t.match_date || null, t.match_time || null],
      );
      results.push({ ok: true, teams: t.teams });
    } catch (err) {
      results.push({ ok: false, error: String(err), teams: t.teams });
    }
  }

  const inserted = results.filter((r) => r.ok).length;
  res.json({ inserted, failed: results.length - inserted, results });
});

// POST /api/admin/tips/scan-betslip  — AI-powered betslip image extraction
router.post("/scan-betslip", async (req: Request, res: Response): Promise<void> => {
  const { image_base64, mime_type } = req.body as { image_base64?: string; mime_type?: string };

  if (!image_base64) {
    res.status(400).json({ error: "image_base64 is required" });
    return;
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    res.status(503).json({ error: "GEMINI_API_KEY not configured. Add it in Secrets." });
    return;
  }

  const prompt = `You are analysing a sports betting slip or ticket image. Extract every match/selection visible.
Return ONLY a valid JSON array (no markdown, no explanation) where each element has:
{
  "teams": "Home Team vs Away Team",
  "tip_type": "e.g. Over 2.5 Goals / Home Win / BTTS / Correct Score 2-1 / HTFT",
  "odds": 1.85,
  "match_date": "YYYY-MM-DD or null",
  "match_time": "HH:MM or null"
}
Use your knowledge to infer match_date/match_time if not printed but you recognise the fixture.
Output ONLY the JSON array.`;

  try {
    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mime_type || "image/jpeg", data: image_base64 } },
            ],
          }],
          generationConfig: { maxOutputTokens: 8192 },
        }),
      },
    );

    const data = await geminiResp.json() as Record<string, unknown>;
    const rawText: string = (
      (data?.candidates as Array<Record<string, unknown>>)?.[0]
        ?.content as Record<string, unknown>
    )?.parts as unknown as string ?? "[]";
    const textStr = typeof rawText === "string"
      ? rawText
      : ((rawText as unknown as Array<Record<string, unknown>>)?.[0]?.text as string ?? "[]");

    const clean = textStr.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let matches: unknown[];
    try {
      matches = JSON.parse(clean);
    } catch {
      matches = [];
    }

    res.json({ matches });
  } catch (err) {
    req.log?.error?.({ err }, "Betslip scan failed");
    res.status(500).json({ error: "Scan failed — check your Gemini API key and try again" });
  }
});

export default router;
