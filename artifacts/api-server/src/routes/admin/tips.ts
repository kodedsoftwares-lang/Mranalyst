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

export default router;
