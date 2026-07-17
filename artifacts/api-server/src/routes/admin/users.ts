import { Router, type Request, type Response } from "express";
import { query } from "../../lib/db.js";
import { requireAdmin } from "../../middlewares/admin-auth.js";
import { z } from "zod";

const router = Router();
router.use(requireAdmin);

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await query(
      `SELECT id, email, tier as subscription, created_at, false as is_admin, null as last_sign_in_at
       FROM vip_users
       ORDER BY created_at DESC`,
    );
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch users");
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

const userUpdateSchema = z.object({
  subscription: z.enum(["pro_plus", "pro"]).nullable().optional(),
  is_admin: z.boolean().optional(),
});

router.patch("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const parsed = userUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    if (parsed.data.subscription !== undefined && parsed.data.subscription !== null) {
      await query(
        `UPDATE vip_users SET tier = $1 WHERE id = $2`,
        [parsed.data.subscription, id],
      );
    }

    const rows = await query(
      `SELECT id, email, tier as subscription, created_at, false as is_admin, null as last_sign_in_at
       FROM vip_users WHERE id = $1`,
      [id],
    );

    if (!rows[0]) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(rows[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to update user");
    res.status(500).json({ error: "Failed to update user" });
  }
});

export default router;
