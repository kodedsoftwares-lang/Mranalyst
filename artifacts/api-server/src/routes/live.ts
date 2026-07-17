import { Router, type Request, type Response } from "express";
import { query, queryOne } from "../lib/db.js";
import { z } from "zod";

const router = Router();

router.get("/messages", async (req: Request, res: Response): Promise<void> => {
  const limit = parseInt((req.query.limit as string) || "50", 10);

  try {
    const rows = await query(
      `SELECT * FROM live_messages ORDER BY created_at DESC LIMIT $1`,
      [limit],
    );
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch messages");
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

const messageSchema = z.object({
  user_name: z.string().min(1).max(100),
  user_city: z.string().optional(),
  message: z.string().min(1).max(500),
  tier: z.enum(["pro_plus", "pro"]),
});

router.post("/messages", async (req: Request, res: Response): Promise<void> => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { user_name, user_city, message, tier } = parsed.data;

  try {
    const row = await queryOne(
      `INSERT INTO live_messages (user_name, user_city, message, tier)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_name, user_city ?? null, message, tier],
    );
    res.status(201).json(row);
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
