import { Router } from "express";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";

import {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  deletePlan
} from "../controllers/pricingcontroller.js";

const router = Router();

router.get("/", getPlans);

// ⭐ NEW ROUTE FOR PAYMENT PAGE
router.get("/:id", getPlanById);

router.post("/create", authMiddleware, adminMiddleware, createPlan);
router.put("/:id", authMiddleware, adminMiddleware, updatePlan);
router.delete("/:id", authMiddleware, adminMiddleware, deletePlan);

export default router;
