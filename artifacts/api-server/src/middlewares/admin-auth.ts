import { type Request, type Response, type NextFunction } from "express";
import { verifyAdminToken } from "../routes/admin/auth.js";

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyAdminToken(token);

  if (payload) {
    next();
    return;
  }

  res.status(403).json({ error: "Admin access required" });
}
