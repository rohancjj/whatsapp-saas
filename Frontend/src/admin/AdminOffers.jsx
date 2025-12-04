import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash, Edit, Save, X, ToggleLeft, ToggleRight } from "lucide-react";

export default function AdminOffers() {
  const [plans, setPlans] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    messages: "",
    apiAccess: "",
    supportLevel: "",
    features: "",
    isFeatured: false,
    active: true,
  });

  const [editId, setEditId] = useState(null);

  // ======================== FETCH PLANS ========================
  const fetchPlans = async () => {
    const res = await fetch("http://localhost:8080/pricing");
    const data = await res.json();
    setPlans(data);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const token = localStorage.getItem("token");

  // ======================== INPUT HANDLER ========================
  const handleChange = (e) => {
    let { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  // ======================== CREATE PLAN ========================
  const handleCreate = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:8080/pricing/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
    if (!confirm("Delete this plan?")) return;

    await fetch(`http://localhost:8080/pricing/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchPlans();
  };

  // ======================== EDIT BUTTON OPEN FORM ========================
  const openEditModal = (plan) => {
    setEditId(plan._id);
    setForm({
      name: plan.name,
      price: plan.price,
      messages: plan.messages,
      apiAccess: plan.apiAccess,
      supportLevel: plan.supportLevel,
      features: plan.features.join(", "),
      isFeatured: plan.isFeatured,
      active: plan.active,
    });
    setIsEditing(true);
  };

  // ======================== UPDATE PLAN ========================
  const handleEditSave = async () => {
    const res = await fetch(`http://localhost:8080/pricing/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...form,
        features: form.features.split(",").map((f) => f.trim()),
      }),
    });

    if (!res.ok) return alert("Error updating plan");

    alert("Plan updated!");
    setIsEditing(false);
    fetchPlans();
  };

  // ======================== TOGGLE ACTIVE STATUS ========================
  const toggleStatus = async (id, currentStatus) => {
    await fetch(`http://localhost:8080/pricing/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ active: !currentStatus }),
    });

    fetchPlans();
  };

  return (
    <div className="space-y-10">

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-slate-800">Manage Pricing Plans</h1>
        <p className="text-slate-500">Create, update or delete subscription plans</p>
      </motion.div>

      {/* CREATE BUTTON */}
      <button
        onClick={() => setIsCreating(true)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg"
      >
        <Plus size={20} />
        Create New Plan
      </button>

      {/* CREATE MODAL */}
      {isCreating && (
        <Modal title="Create Pricing Plan" close={() => setIsCreating(false)} submit={handleCreate}>
          <FormFields form={form} handleChange={handleChange} />
        </Modal>
      )}

      {/* EDIT MODAL */}
      {isEditing && (
        <Modal title="Edit Plan" close={() => setIsEditing(false)} submit={handleEditSave}>
          <FormFields form={form} handleChange={handleChange} />
        </Modal>
      )}

      {/* PLAN LIST */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <motion.div
            key={plan._id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-lg border space-y-4"
          >
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="text-3xl font-bold text-emerald-600">₹{plan.price}</p>
            <p className="text-sm text-slate-500">Messages: {plan.messages}</p>

            <span className={`px-3 py-1 rounded-full text-xs font-bold ${plan.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {plan.active ? "ACTIVE" : "INACTIVE"}
            </span>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => openEditModal(plan)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl flex items-center justify-center gap-2"
              >
                <Edit size={18} /> Edit
              </button>

              <button
                onClick={() => toggleStatus(plan._id, plan.active)}
                className="p-3 rounded-xl border hover:bg-slate-100"
              >
                {plan.active ? <ToggleRight size={22} className="text-emerald-600" /> : <ToggleLeft size={22} className="text-red-600" />}
              </button>

              <button
                onClick={() => deletePlan(plan._id)}
                className="p-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
              >
                <Trash size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ======================== REUSABLE INPUT FORM ======================== */
const FormFields = ({ form, handleChange }) => (
  <div className="space-y-4">
    {["name", "price", "messages", "apiAccess", "supportLevel", "features"].map((key) => (
      <div key={key}>
        <label className="text-sm text-slate-600 capitalize">{key.replace("_", " ")}</label>
        <input name={key} value={form[key]} onChange={handleChange} className="p-3 border rounded-xl w-full" />
      </div>
    ))}

    <div className="flex items-center gap-2">
      <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} />
      <label>Featured</label>
    </div>
  </div>
);

/* ======================== MODAL COMPONENT ======================== */
const Modal = ({ children, title, close, submit }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-xl relative">
      <button onClick={close} className="absolute top-4 right-4">
        <X size={22} />
      </button>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {children}

      <button onClick={submit} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-6 py-3 rounded-xl flex justify-center gap-2">
        <Save size={20} /> Save
      </button>
    </motion.div>
  </div>
);
