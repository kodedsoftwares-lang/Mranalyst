import { Router, type Request, type Response } from "express";
import { query, queryOne } from "../../lib/db.js";
import { requireAdmin } from "../../middlewares/admin-auth.js";
import { z } from "zod";

const router = Router();
router.use(requireAdmin);

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await query(`SELECT * FROM scheduled_posts ORDER BY publish_at ASC`);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch scheduled posts");
    res.status(500).json({ error: "Failed to fetch scheduled posts" });
  }
});

const postInputSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  tier: z.enum(["pro_plus", "pro"]),
  publish_at: z.string(),
});

const postUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  tier: z.enum(["pro_plus", "pro"]).optional(),
  publish_at: z.string().optional(),
  status: z.enum(["scheduled", "published", "cancelled"]).optional(),
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const parsed = postInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { title, content, tier, publish_at } = parsed.data;
  try {
    const row = await queryOne(
      `INSERT INTO scheduled_posts (title, content, tier, publish_at, status)
       VALUES ($1, $2, $3, $4, 'scheduled')
       RETURNING *`,
      [title, content, tier, publish_at],
    );
    res.status(201).json(row);
  } catch (err) {
    req.log.error({ err }, "Failed to create scheduled post");
    res.status(500).json({ error: "Failed to create scheduled post" });
  }
});

router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const parsed = postUpdateSchema.safeParse(req.body);
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
      `UPDATE scheduled_posts SET ${setClauses} WHERE id = $1 RETURNING *`,
      [id, ...values],
    );
    if (!row) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "Failed to update scheduled post");
    res.status(500).json({ error: "Failed to update scheduled post" });
  }
});

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await query(`DELETE FROM scheduled_posts WHERE id = $1`, [id]);
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete scheduled post");
    res.status(500).json({ error: "Failed to delete scheduled post" });
  }
});

export default router;
