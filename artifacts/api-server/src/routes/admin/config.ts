import { Router, type Request, type Response } from "express";
import { query, queryOne } from "../../lib/db.js";
import { requireAdmin } from "../../middlewares/admin-auth.js";
import { z } from "zod";

const router = Router();
router.use(requireAdmin);

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await query(`SELECT * FROM app_config ORDER BY key`);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch config");
    res.status(500).json({ error: "Failed to fetch config" });
  }
});

const configUpdateSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

router.put("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = configUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const row = await queryOne(
      `INSERT INTO app_config (key, value, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
       RETURNING *`,
      [parsed.data.key, parsed.data.value],
    );
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "Failed to update config");
    res.status(500).json({ error: "Failed to update config" });
  }
});

export default router;
