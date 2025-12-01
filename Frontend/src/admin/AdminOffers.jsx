import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash, Edit, Save, X } from "lucide-react";

export default function AdminOffers() {
  const [plans, setPlans] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    messages: "",
    apiAccess: "",
    supportLevel: "",
    features: "",
    isFeatured: false,
  });

  // ======================== FETCH PLANS ========================
  const fetchPlans = async () => {
    const res = await fetch("http://localhost:8080/pricing");
    const data = await res.json();
    setPlans(data);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // ======================== INPUT HANDLER ========================
  const handleChange = (e) => {
    let { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  // ======================== CREATE PLAN ========================
  // ======================== CREATE PLAN ========================
const handleCreate = async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:8080/pricing/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,  // ✔ FIXED
    },
    body: JSON.stringify({
      ...form,
      features: form.features.split(",").map((f) => f.trim()),
    }),
  });

  if (!res.ok) return alert("Error creating plan");

  alert("Plan created!");
  setIsCreating(false);
  fetchPlans();
};

// ======================== DELETE PLAN ========================
const deletePlan = async (id) => {
  const token = localStorage.getItem("token");

  if (!confirm("Delete this plan?")) return;

  await fetch(`http://localhost:8080/pricing/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,   // ✔ FIXED
    },
  });

  fetchPlans();
};


  return (
    <div className="space-y-10">

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-slate-800">Manage Pricing Plans</h1>
        <p className="text-slate-500">Create, update or delete subscription plans</p>
      </motion.div>

      {/* CREATE PLAN BUTTON */}
      <button
        onClick={() => setIsCreating(true)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg"
      >
        <Plus size={20} />
        Create New Plan
      </button>

      {/* ================== CREATE PLAN MODAL ================== */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-xl relative"
          >
            <button
              onClick={() => setIsCreating(false)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg"
            >
              <X size={22} />
            </button>

            <h2 className="text-2xl font-bold mb-4">Create Pricing Plan</h2>

            <form className="space-y-4" onSubmit={handleCreate}>
              <Input label="Name" name="name" onChange={handleChange} />

              <Input label="Price (₹)" name="price" type="number" onChange={handleChange} />

              <Input label="Messages Limit" name="messages" onChange={handleChange} />

              <Input label="API Access" name="apiAccess" onChange={handleChange} />

              <Input label="Support Level" name="supportLevel" onChange={handleChange} />

              <Input
                label="Features (comma-separated)"
                name="features"
                onChange={handleChange}
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isFeatured"
                  onChange={handleChange}
                />
                <label>Featured Plan</label>
              </div>

              <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl flex items-center justify-center gap-2">
                <Save size={20} />
                Save Plan
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* ======================== PLANS LIST ======================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <motion.div
            key={plan._id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 space-y-4"
          >
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="text-3xl font-bold text-emerald-600">₹{plan.price}</p>

            <p className="text-slate-600 text-sm">Messages: {plan.messages}</p>
            <p className="text-slate-600 text-sm">API: {plan.apiAccess}</p>
            <p className="text-slate-600 text-sm">Support: {plan.supportLevel}</p>

            <ul className="text-sm text-slate-700 list-disc ml-5">
              {plan.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => deletePlan(plan._id)}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-xl flex items-center justify-center gap-2"
              >
                <Trash size={18} />
                Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ======================== REUSABLE INPUT COMPONENT ======================== */
const Input = ({ label, name, type = "text", onChange }) => (
  <div className="flex flex-col">
    <label className="text-sm text-slate-600">{label}</label>
    <input
      name={name}
      type={type}
      onChange={onChange}
      className="p-3 border border-slate-300 rounded-xl mt-1 focus:ring-2 focus:ring-emerald-500 outline-none"
    />
  </div>
);
