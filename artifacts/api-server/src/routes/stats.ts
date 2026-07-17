import { Router, type Request, type Response } from "express";
import { query } from "../lib/db.js";

const router = Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);

  try {
    const rows = await query<{
      tier: string;
      status: string;
      match_date: Date | null;
    }>(`SELECT tier, status, match_date FROM tips`);

    const computeStats = (tierKey: string) => {
      const tips = rows.filter((t) => t.tier === tierKey);
      const won = tips.filter((t) => t.status === "won").length;
      const lost = tips.filter((t) => t.status === "lost").length;
      const pending = tips.filter((t) => t.status === "pending").length;
      const postponed = tips.filter((t) => t.status === "postponed").length;
      const cancelled = tips.filter((t) => t.status === "cancelled").length;
      const total = tips.length;
      const played = won + lost;
      const win_rate = played > 0 ? Math.round((won / played) * 100) : 0;
      const todays_tips = tips.filter((t) => {
        const d = t.match_date ? (t.match_date as Date).toISOString().slice(0, 10) : null;
        return d === today;
      }).length;

      return { total, won, lost, pending, postponed, cancelled, win_rate, todays_tips, played };
    };

    res.json({
      pro_plus: computeStats("pro_plus"),
      pro: computeStats("pro"),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
