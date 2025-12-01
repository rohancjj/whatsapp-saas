import { Router } from "express";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";

import {
  createPlan,
  getPlans,
  updatePlan,
  deletePlan
} from "../controllers/pricingcontroller.js";

const router = Router();

// USER CAN VIEW PLANS
router.get("/", getPlans);

// ADMIN ROUTES (Protected)
router.post("/create", authMiddleware, adminMiddleware, createPlan);
router.put("/:id", authMiddleware, adminMiddleware, updatePlan);
router.delete("/:id", authMiddleware, adminMiddleware, deletePlan);

export default router;
