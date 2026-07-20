import { Router, type Request, type Response } from "express";
import { query } from "../lib/db.js";

const router = Router();

// Public config keys that the frontend can read without auth
const PUBLIC_KEYS = [
  "support_email",
  "whatsapp_link",
  "telegram_link",
  "chat_type",
  "pro_plus_price",
  "pro_price",
  "payment_link_pro_plus",
  "payment_link_pro",
  "hero_bg_url",
];

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await query<{ key: string; value: string }>(
      `SELECT key, value FROM app_config WHERE key = ANY($1)`,
      [PUBLIC_KEYS],
    );
    const obj: Record<string, string> = {};
    for (const r of rows) obj[r.key] = r.value;
    // defaults
    for (const k of PUBLIC_KEYS) if (!(k in obj)) obj[k] = "";
    res.json(obj);
  } catch (err) {
    req.log?.error?.({ err }, "Failed to fetch public config");
    res.status(500).json({ error: "Failed to fetch config" });
  }
});

export default router;
