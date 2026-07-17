import { Router, type Request, type Response } from "express";
import { query, queryOne } from "../../lib/db.js";
import { requireAdmin } from "../../middlewares/admin-auth.js";
import { z } from "zod";
import crypto from "node:crypto";

const router = Router();

const ADMIN_SECRET = process.env.ADMIN_SECRET || "mr-analyst-admin-2025";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@mranalyst.org";

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function signAdminToken(email: string): string {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = Buffer.from(JSON.stringify({ email, exp })).toString("base64url");
  const sig = crypto.createHmac("sha256", ADMIN_SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token: string): { email: string } | null {
  // Check plain ADMIN_SECRET
  if (token === ADMIN_SECRET) return { email: ADMIN_EMAIL };

  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac("sha256", ADMIN_SECRET).update(payload).digest("hex");
  if (sig !== expected) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (decoded.exp < Date.now()) return null;
    return { email: decoded.email };
  } catch {
    return null;
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/admin/auth/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid credentials" });
    return;
  }
  const { email, password } = parsed.data;

  try {
    // Bootstrap: check env-level admin
    if (
      email.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      password === ADMIN_SECRET
    ) {
      const token = signAdminToken(email);
      res.json({ success: true, token });
      return;
    }

    // DB admins
    const admin = await queryOne<{ password_hash: string; salt: string }>(
      `SELECT password_hash, split_part(password_hash, ':', 1) AS salt FROM admins WHERE email = $1`,
      [email],
    );

    if (!admin) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // password_hash stored as "salt:hash"
    const [storedSalt, storedHash] = admin.password_hash.split(":");
    const attemptHash = hashPassword(password, storedSalt);
    if (attemptHash !== storedHash) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signAdminToken(email);
    res.json({ success: true, token });
  } catch (err) {
    req.log?.error?.({ err }, "Admin login failed");
    res.status(500).json({ error: "Login failed" });
  }
});

// GET /api/admin/auth/me (verify token)
router.get("/me", requireAdmin, (req: Request, res: Response) => {
  res.json({ ok: true });
});

// ─── Admin accounts CRUD ─────────────────────────────────────────────────────

const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

router.get("/admins", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await query(`SELECT id, email, created_at FROM admins ORDER BY created_at`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admins" });
  }
});

router.post("/admins", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const parsed = createAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }
  const salt = generateSalt();
  const hash = hashPassword(parsed.data.password, salt);
  try {
    const row = await queryOne(
      `INSERT INTO admins (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at`,
      [parsed.data.email, `${salt}:${hash}`],
    );
    res.json(row);
  } catch (err: any) {
    if (err.constraint === "admins_email_key") {
      res.status(409).json({ error: "Admin with this email already exists" });
    } else {
      res.status(500).json({ error: "Failed to create admin" });
    }
  }
});

router.delete("/admins/:id", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    await query(`DELETE FROM admins WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete admin" });
  }
});

export default router;
