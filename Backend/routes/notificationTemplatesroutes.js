import express from "express";
import NotificationTemplate from "../models/NotificationTemplate.js";

const router = express.Router();


router.post("/", async (req, res) => {
  try {
    const { name, category, content, variables } = req.body;

    const template = await NotificationTemplate.create({
      name,
      category: category?.trim().toLowerCase() || "general",
      content,
      variables: variables || [],
    });

    res.status(201).json({ success: true, template });
  } catch (err) {
    console.error("Error creating template:", err);
    res.status(400).json({ success: false, error: err.message });
  }
});


router.get("/", async (req, res) => {
  try {
    const templates = await NotificationTemplate.find().sort({ createdAt: -1 });
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const template = await NotificationTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: "Template not found" });
    }
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const { name, category, content, variables } = req.body;

    const template = await NotificationTemplate.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(category && { category: category.trim().toLowerCase() }),
        ...(content && { content }),
        ...(variables && { variables }),
      },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ success: false, error: "Template not found" });
    }

    res.json({ success: true, template });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const template = await NotificationTemplate.findByIdAndDelete(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: "Template not found" });
    }
    res.json({ success: true, message: "Template deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
