import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash, Edit, Save, X, ToggleLeft, ToggleRight } from "lucide-react";

export default function AdminOffers() {
  const [plans, setPlans] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    messages: "",
    apiAccess: "none",
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
        price: Number(form.price),
        messages: Number(form.messages),
        features: form.features.split(",").map((f) => f.trim()),
      }),
    });

    if (!res.ok) return alert("Error creating plan");

    alert("Plan created!");
    setIsCreating(false);
    fetchPlans();
  };

  // ======================== OPEN EDIT MODAL ========================
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
        price: Number(form.price),
        messages: Number(form.messages),
        features: form.features.split(",").map((f) => f.trim()),
      }),
    });

    if (!res.ok) return alert("Error updating plan");

    alert("Plan updated!");
    setIsEditing(false);
    fetchPlans();
  };

  // ======================== DELETE CONFIRMATION ========================
  const askDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    await fetch(`http://localhost:8080/pricing/${deleteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setShowDeleteModal(false);
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

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <DeleteModal
          close={() => setShowDeleteModal(false)}
          confirm={confirmDelete}
        />
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
                onClick={() => askDelete(plan._id)}
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

/* ======================== REUSABLE FORM ======================== */
const FormFields = ({ form, handleChange }) => (
  <div className="space-y-4">
    
    {/* NAME */}
    <div>
      <label>Name</label>
      <input name="name" value={form.name} onChange={handleChange} className="p-3 border rounded-xl w-full" />
    </div>

    {/* PRICE */}
    <div>
      <label>Price (₹)</label>
      <input type="number" name="price" value={form.price} onChange={handleChange} className="p-3 border rounded-xl w-full" />
    </div>

    {/* MESSAGES */}
    <div>
      <label>Messages</label>
      <input type="number" name="messages" value={form.messages} onChange={handleChange} className="p-3 border rounded-xl w-full" />
    </div>

    {/* API ACCESS */}
    <div>
      <label>API Access</label>
      <select name="apiAccess" value={form.apiAccess} onChange={handleChange} className="p-3 border rounded-xl w-full">
        <option value="none">None</option>
        <option value="basic">Basic</option>
        <option value="full">Full</option>
      </select>
    </div>

    {/* SUPPORT LEVEL */}
    <div>
      <label>Support Level</label>
      <input name="supportLevel" value={form.supportLevel} onChange={handleChange} className="p-3 border rounded-xl w-full" />
    </div>

    {/* FEATURES */}
    <div>
      <label>Features (comma separated)</label>
      <input name="features" value={form.features} onChange={handleChange} className="p-3 border rounded-xl w-full" />
    </div>

    {/* FEATURED */}
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

/* ======================== DELETE CONFIRMATION POPUP ======================== */
const DeleteModal = ({ close, confirm }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm"
    >
      <h2 className="text-xl font-semibold mb-3 text-center">Confirm Deletion</h2>
      <p className="text-center text-slate-600 mb-6">Are you sure you want to delete this plan?</p>

      <div className="flex gap-3">
        <button
          onClick={close}
          className="w-1/2 bg-gray-300 hover:bg-gray-400 text-black py-2 rounded-xl"
        >
          Cancel
        </button>
        <button
          onClick={confirm}
          className="w-1/2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl"
        >
          Delete
        </button>
      </div>
    </motion.div>
  </div>
);
