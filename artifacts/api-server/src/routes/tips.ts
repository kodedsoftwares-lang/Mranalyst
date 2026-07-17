import { Router, type Request, type Response } from "express";
import { query } from "../lib/db.js";

const router = Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  const tier = req.query.tier as string | undefined;
  const limit = parseInt((req.query.limit as string) || "20", 10);
  const offset = parseInt((req.query.offset as string) || "0", 10);

  try {
    const params: unknown[] = [limit, offset];
    let sql = `SELECT * FROM tips`;
    if (tier) {
      sql += ` WHERE tier = $3`;
      params.push(tier);
    }
    sql += ` ORDER BY match_date DESC NULLS LAST, created_at DESC LIMIT $1 OFFSET $2`;

    const rows = await query(sql, params);

    const tips = rows.map((tip) => ({
      ...tip,
      match_date: tip.match_date ? (tip.match_date as Date).toISOString().slice(0, 10) : null,
      is_locked: tip.status === "locked",
      teams: tip.status === "locked" ? null : tip.teams,
      tip_type: tip.status === "locked" ? null : tip.tip_type,
      odds: tip.status === "locked" ? null : tip.odds,
    }));

    res.json(tips);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch tips");
    res.status(500).json({ error: "Failed to fetch tips" });
  }
});

export default router;
