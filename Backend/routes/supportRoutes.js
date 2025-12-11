import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";
import { uploadSupport } from "../middlewares/upload.js";

import * as supportCtrl from "../controllers/supportController.js";

const router = express.Router();

//
// ADMIN ROUTES MUST COME FIRST ⬇⬇⬇
//
router.get(
  "/admin/all",
  authMiddleware,
  adminMiddleware,
  supportCtrl.adminListRequests
);

router.post(
  "/admin/:id/status",
  authMiddleware,
  adminMiddleware,
  supportCtrl.adminUpdateStatus
);

router.post(
  "/admin/:id/assign",
  authMiddleware,
  adminMiddleware,
  supportCtrl.adminAssign
);


//
// USER ROUTES (keep AFTER admin routes)
//
router.post(
  "/",
  authMiddleware,
  uploadSupport.array("attachments", 5),
  supportCtrl.createSupportRequest
);

router.get("/", authMiddleware, supportCtrl.listUserRequests);

router.get("/:id", authMiddleware, supportCtrl.getRequest);

router.post(
  "/:requestId/message",
  authMiddleware,
  uploadSupport.array("attachments", 5),
  supportCtrl.addMessage
);

export default router;
