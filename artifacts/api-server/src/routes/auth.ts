import { Router, type Request, type Response } from "express";
import { query, queryOne } from "../lib/db.js";
import { z } from "zod";

const router = Router();

const vipLoginSchema = z.object({
  email: z.string().email("Invalid email"),
  access_code: z.string().min(1, "Access code required"),
  tier: z.enum(["pro_plus", "pro"]).optional(),
});

router.post("/vip-login", async (req: Request, res: Response): Promise<void> => {
  const parsed = vipLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { email, access_code } = parsed.data;

  try {
    // Validate access code — must be active, not expired, and either unused or already used by this same email
    const codeRow = await queryOne<{
      id: string;
      tier: string;
      is_active: boolean;
      expires_at: string | null;
      used_by_email: string | null;
    }>(
      `SELECT id, tier, is_active, expires_at, used_by_email
       FROM vip_access_codes
       WHERE code = $1 AND is_active = true
       LIMIT 1`,
      [access_code],
    );

    if (!codeRow) {
      res.json({ success: false, tier: null, message: "Invalid or expired access code", token: null });
      return;
    }

    // Check expiry
    if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
      res.json({ success: false, tier: null, message: "This access code has expired", token: null });
      return;
    }

    // Enforce one code per user: if code is already used by someone else, reject
    if (codeRow.used_by_email && codeRow.used_by_email.toLowerCase() !== email.toLowerCase()) {
      res.json({ success: false, tier: null, message: "This access code is already in use", token: null });
      return;
    }

    // Check if this email has already used a DIFFERENT code
    const existingCodeUse = await queryOne<{ code: string }>(
      `SELECT code FROM vip_access_codes WHERE used_by_email = $1 AND code != $2 LIMIT 1`,
      [email, access_code],
    );
    if (existingCodeUse) {
      res.json({ success: false, tier: null, message: "Your email has already been registered with a different code", token: null });
      return;
    }

    const tier = codeRow.tier as "pro_plus" | "pro";

    // Upsert VIP user
    await query(
      `INSERT INTO vip_users (email, tier)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET tier = EXCLUDED.tier`,
      [email, tier],
    );

    // Mark code as used by this email (and increment count)
    await query(
      `UPDATE vip_access_codes
       SET used_count = used_count + 1, used_by_email = COALESCE(used_by_email, $2)
       WHERE id = $1`,
      [codeRow.id, email],
    );

    const tierLabel = tier === "pro_plus" ? "Pro Plus VIP" : "Pro VIP";
    res.json({
      success: true,
      tier,
      message: `Welcome! You have ${tierLabel} access.`,
      token: null,
    });
  } catch (err) {
    req.log.error({ err }, "VIP login failed");
    res.status(500).json({ success: false, tier: null, message: "Login failed. Please try again.", token: null });
  }
});

export default router;
