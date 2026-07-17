import { Router } from "express";
import healthRouter from "./health.js";
import tipsRouter from "./tips.js";
import statsRouter from "./stats.js";
import authRouter from "./auth.js";
import liveRouter from "./live.js";
import publicConfigRouter from "./public-config.js";
import adminTipsRouter from "./admin/tips.js";
import adminUsersRouter from "./admin/users.js";
import adminConfigRouter from "./admin/config.js";
import adminScheduledPostsRouter from "./admin/scheduled-posts.js";
import adminAuthRouter from "./admin/auth.js";
import adminAccessCodesRouter from "./admin/access-codes.js";

const router = Router();

router.use("/", healthRouter);
router.use("/tips", tipsRouter);
router.use("/stats", statsRouter);
router.use("/auth", authRouter);
router.use("/live", liveRouter);
router.use("/config", publicConfigRouter);
router.use("/admin/auth", adminAuthRouter);
router.use("/admin/tips", adminTipsRouter);
router.use("/admin/users", adminUsersRouter);
router.use("/admin/config", adminConfigRouter);
router.use("/admin/access-codes", adminAccessCodesRouter);
router.use("/admin/scheduled-posts", adminScheduledPostsRouter);

export default router;
