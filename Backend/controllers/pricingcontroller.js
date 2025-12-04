import Pricing from "../models/Pricing.js";

export const createPlan = async (req, res) => {
  try {
    const plan = await Pricing.create(req.body);
    res.json({ message: "Plan created", plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating plan" });
  }
};

export const getPlans = async (req, res) => {
  try {
    const plans = await Pricing.find({ active: true }).sort({ price: 1 });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: "Error fetching plans" });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const plan = await Pricing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ message: "Plan updated", plan });
  } catch (err) {
    res.status(500).json({ message: "Error updating plan" });
  }
};

export const deletePlan = async (req, res) => {
  try {
    await Pricing.findByIdAndDelete(req.params.id);
    res.json({ message: "Plan deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting plan" });
  }
};
export const getPlanById = async (req, res) => {
  try {
    const plan = await Pricing.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: "Error fetching plan", error: err.message });
  }
};

