import { Router } from "express";
import adminRoutes from "./admin.routes.js";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
const router = Router();

router.use("/admin", adminRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
export default router;
