import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  UserCircle,
  Wifi,
  WifiOff,
  Mail,
  CreditCard,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [openDropdown, setOpenDropdown] = useState(null);
  const [paymentModal, setPaymentModal] = useState({
    open: false,
    loading: true,
    payments: [],
    user: null,
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:8080/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(res.data || []);
      setFiltered(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Error:", err);
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    const s = value.toLowerCase();
    setFiltered(
      users.filter(
        (u) =>
          u.fullName?.toLowerCase().includes(s) ||
          u.email?.toLowerCase().includes(s) ||
          u.phone?.toLowerCase().includes(s)
      )
    );
  };

  const openPaymentModal = async (user) => {
    setPaymentModal({ open: true, loading: true, payments: [], user });

    try {
      const res = await axios.get(
        `http://localhost:8080/api/v1/admin/manual-payments?userId=${user._id || user.userId}&status=all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPaymentModal({
        open: true,
        loading: false,
        payments: res.data.payments || [],
        user,
      });
    } catch (err) {
      console.error(err);
      setPaymentModal({ open: true, loading: false, payments: [], user });
    }
  };

  const approvePayment = async (id) => {
    await axios.post(
      `http://localhost:8080/api/v1/admin/manual-payments/${id}/approve`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    openPaymentModal(paymentModal.user);
    fetchUsers();
  };

  const rejectPayment = async (id) => {
    await axios.post(
      `http://localhost:8080/api/v1/admin/manual-payments/${id}/reject`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    openPaymentModal(paymentModal.user);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div
          className="h-10 w-10 border-4 rounded-full border-slate-300 border-t-slate-900"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">User Management</h1>

        <div className="relative">
          <Search className="absolute left-3 top-2 text-slate-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users…"
            className="pl-10 pr-4 py-2 w-60 rounded-xl border bg-slate-50 focus:ring-2 focus:ring-black outline-none"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-500 border-b text-sm">
              <th className="py-2">User</th>
              <th>Email</th>
              <th>Plan</th>
              <th>API Key</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((user) => (
              <tr key={user._id} className="border-b hover:bg-slate-50 transition">
                <td className="py-4 flex items-center gap-3">
                  <UserCircle size={32} className="text-slate-400" />
                  <div>
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-xs text-slate-500">{user.phone}</p>
                  </div>
                </td>

                <td className="text-sm flex items-center gap-1 text-slate-700">
                  <Mail size={16} /> {user.email}
                </td>

                <td>{user.activePlan?.name || "No Plan"}</td>

                <td>
                  {user.activePlan?.apiKey ? (
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                      {user.activePlan.apiKey.slice(0, 12)}...
                    </span>
                  ) : (
                    "-"
                  )}
                </td>

                <td>
                  {user.whatsapp?.connected ? (
                    <span className="flex items-center text-green-600 gap-1">
                      <Wifi size={18} /> Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600">
                      <WifiOff size={18} /> Offline
                    </span>
                  )}
                </td>

                <td className="relative">
                  <button
                    className="px-3 py-1 bg-black text-white rounded-lg text-xs hover:bg-gray-800"
                    onClick={() =>
                      setOpenDropdown(openDropdown === user._id ? null : user._id)
                    }
                  >
                    ⋯ Actions
                  </button>

                  <AnimatePresence>
                    {openDropdown === user._id && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl border shadow-xl p-2 z-50"
                      >
                        <button
                          onClick={() => {
                            openPaymentModal(user);
                            setOpenDropdown(null);
                          }}
                          className="w-full px-3 py-2 text-left rounded-lg hover:bg-slate-100 text-sm flex items-center gap-2"
                        >
                          <CreditCard size={16} /> View Payments
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {paymentModal.open && (
          <motion.div
            onClick={(e) => e.target === e.currentTarget && setPaymentModal({ open: false })}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white w-full max-w-xl p-6 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-semibold text-slate-900">Payment History</h2>
              <p className="text-sm text-slate-500 mb-4">
                {paymentModal.user?.fullName} — {paymentModal.user?.email}
              </p>

              {paymentModal.loading ? (
                <div className="flex justify-center py-8">
                  <motion.div
                    className="h-8 w-8 border-4 rounded-full border-slate-300 border-t-black"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                  />
                </div>
              ) : paymentModal.payments.length === 0 ? (
                <p className="text-center text-slate-500 py-10">No payments found.</p>
              ) : (
                paymentModal.payments.map((payment) => (
                  <motion.div
                    key={payment._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-2xl p-4 my-4 shadow bg-slate-50"
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{payment.planId?.name}</p>

                      <span
                        className={`px-3 py-1 text-xs rounded-full ${
                          payment.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : payment.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {payment.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 mt-1">Amount: ₹{payment.amount}</p>

                    {payment.screenshotUrl && (
                      <img
                        src={`http://localhost:8080${payment.screenshotUrl}`}
                        className="w-full rounded-xl mt-3 shadow"
                        alt="Payment proof"
                      />
                    )}

                    {payment.status === "pending" && (
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => approvePayment(payment._id)}
                          className="flex-1 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700"
                        >
                          <CheckCircle size={16} className="inline mr-1" /> Approve
                        </button>

                        <button
                          onClick={() => rejectPayment(payment._id)}
                          className="flex-1 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
                        >
                          <XCircle size={16} className="inline mr-1" /> Reject
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))
              )}

              <button
                onClick={() => setPaymentModal({ open: false })}
                className="w-full mt-4 py-3 rounded-xl bg-black text-white hover:bg-gray-800 transition"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
