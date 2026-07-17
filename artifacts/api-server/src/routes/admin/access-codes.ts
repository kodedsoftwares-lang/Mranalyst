import { Router, type Request, type Response } from "express";
import { query, queryOne } from "../../lib/db.js";
import { requireAdmin } from "../../middlewares/admin-auth.js";
import { z } from "zod";
import crypto from "node:crypto";

const router = Router();
router.use(requireAdmin);

function generateCode(tier: string): string {
  const prefix = tier === "pro_plus" ? "MRPP" : "MRPV";
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${rand.slice(0, 4)}-${rand.slice(4)}`;
}

const createCodeSchema = z.object({
  tier: z.enum(["pro_plus", "pro"]),
  expires_at: z.string().datetime().optional().nullable(),
  label: z.string().optional().nullable(),
});

// GET /api/admin/access-codes
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await query(`
      SELECT id, code, tier, is_active, used_count, used_by_email, expires_at, label, created_at
      FROM vip_access_codes
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    req.log?.error?.({ err }, "Failed to fetch access codes");
    res.status(500).json({ error: "Failed to fetch access codes" });
  }
});

// POST /api/admin/access-codes — generate a new code
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = createCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }
  const { tier, expires_at, label } = parsed.data;
  const code = generateCode(tier);

  try {
    const row = await queryOne(`
      INSERT INTO vip_access_codes (code, tier, is_active, expires_at, label)
      VALUES ($1, $2, true, $3, $4)
      RETURNING id, code, tier, is_active, used_count, used_by_email, expires_at, label, created_at
    `, [code, tier, expires_at ?? null, label ?? null]);
    res.json(row);
  } catch (err) {
    req.log?.error?.({ err }, "Failed to create access code");
    res.status(500).json({ error: "Failed to create access code" });
  }
});

// PATCH /api/admin/access-codes/:id — toggle active
router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const { is_active } = req.body;
  try {
    const row = await queryOne(`
      UPDATE vip_access_codes SET is_active = $1 WHERE id = $2
      RETURNING id, code, tier, is_active, used_count, used_by_email, expires_at, label, created_at
    `, [is_active, req.params.id]);
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch {
    res.status(500).json({ error: "Failed to update code" });
  }
});

// DELETE /api/admin/access-codes/:id
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    await query(`DELETE FROM vip_access_codes WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete code" });
  }
});

export default router;
