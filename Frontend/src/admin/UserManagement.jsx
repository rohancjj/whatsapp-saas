import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, UserCircle, Wifi, WifiOff, Mail, CreditCard, Power, ShieldX, Trash, RefreshCw, Slash, X
} from "lucide-react";

export default function UserManagement() {

  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [openDropdown, setOpenDropdown] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    user: null,
    action: null,
    message: ""
  });

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

      const normalized = res.data.map(user => ({
        ...user,
        suspended: Boolean(user.suspended),
        terminated: Boolean(user.terminated),
        whatsapp: {
          connected: Boolean(user.whatsapp?.connected),
          ...user.whatsapp
        }
      }));

      setUsers(normalized);
      setFiltered(normalized);
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

  /* ---------------------- Execute Confirmed Action ---------------------- */
  const executeAction = async () => {
    const { user, action } = confirmModal;

    const endpointMap = {
      suspend: `/admin/suspend/${user._id}`,
      unsuspend: `/admin/unsuspend/${user._id}`,
      disconnect: `/admin/disconnect/${user._id}`,
      terminate: `/admin/terminate/${user._id}`,
      resume: `/admin/resume/${user._id}`,
      delete: `/admin/user/${user._id}`,
    };

    try {
      await axios({
        method: action === "delete" ? "delete" : "post",
        url: `http://localhost:8080${endpointMap[action]}`,
        headers: { Authorization: `Bearer ${token}` },
      });

      setConfirmModal({ open: false, user: null, action: null });

      setTimeout(fetchUsers, 500);
    } catch (err) {
      alert("Action failed.");
      console.error(err);
    }
  };

  const askConfirm = (user, action) => {
    const messages = {
      suspend: `Suspend access for ${user.fullName}?`,
      unsuspend: `Restore access for ${user.fullName}?`,
      terminate: `Terminate account for ${user.fullName}?`,
      resume: `Restore terminated account for ${user.fullName}?`,
      disconnect: `Disconnect WhatsApp for ${user.fullName}?`,
      delete: `PERMANENTLY delete ${user.fullName}? This cannot be undone.`
    };

    setConfirmModal({
      open: true,
      user,
      action,
      message: messages[action],
    });

    setOpenDropdown(null);
  };

  /* ----------------------- Payment Modal fetch ----------------------- */
  const openPaymentModal = async (user) => {
    setPaymentModal({ open: true, loading: true, payments: [], user });
    setOpenDropdown(null); // Close dropdown when opening modal

    try {
      const res = await axios.get(
        `http://localhost:8080/api/v1/admin/manual-payments?userId=${user._id}&status=all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPaymentModal({
        open: true,
        loading: false,
        payments: res.data.payments || [],
        user,
      });
    } catch {
      setPaymentModal({ open: true, loading: false, payments: [], user });
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <motion.div className="h-10 w-10 border-4 rounded-full border-slate-300 border-t-slate-900"
        animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9 }} />
    </div>
  );

  return (
    <div className="p-6 space-y-8">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="relative">
          <Search className="absolute left-3 top-2 text-gray-400" size={18} />
          <input
            value={search}
            onChange={(e)=>handleSearch(e.target.value)}
            placeholder="Search users…"
            className="pl-10 w-64 py-2 rounded-xl border bg-gray-50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="border-b text-gray-500 text-sm">
            <th className="py-3">User</th>
            <th className="py-3">Email</th>
            <th className="py-3">Plan</th>
            <th className="py-3">API Key</th>
            <th className="py-3">Status</th>
            <th className="py-3"></th>
          </tr></thead>

          <tbody>
            {filtered.map((user) => (
              <tr key={user._id} className="border-b hover:bg-gray-50">
                <td className="py-4">
                  <div className="flex gap-3 items-center">
                    <UserCircle size={32} className="text-gray-400" />
                    <div>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-xs text-gray-500">{user.phone}</p>
                    </div>
                  </div>
                </td>

                <td className="text-sm">
                  <div className="flex gap-1 items-center">
                    <Mail size={16}/> {user.email}
                  </div>
                </td>

                <td className="text-sm">{user.activePlan?.name || "No Plan"}</td>

                <td className="text-sm">
                  {user.activePlan?.apiKey ? 
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {user.activePlan.apiKey.slice(0,10)}...
                    </span> : "-"}
                </td>

                <td className="text-sm">
                  {user.whatsapp?.connected ? 
                    <span className="text-green-600 flex gap-1 items-center">
                      <Wifi size={18}/>Online
                    </span> : 
                    <span className="text-red-600 flex gap-1 items-center">
                      <WifiOff size={18}/>Offline
                    </span>}
                </td>

                <td className="relative">
                  <button 
                    onClick={() => setOpenDropdown(openDropdown === user._id ? null : user._id)} 
                    className="px-3 py-1 text-xs bg-black text-white rounded-lg hover:bg-gray-800 transition"
                  >
                    ⋯
                  </button>

                  <AnimatePresence>
                  {openDropdown === user._id && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setOpenDropdown(null)}
                      />

                      <motion.div 
                        initial={{opacity:0, y:-6}} 
                        animate={{opacity:1, y:0}} 
                        exit={{opacity:0, y:-6}}
                        className="absolute right-0 mt-2 p-2 w-52 bg-white border shadow-lg rounded-xl z-20"
                      >

                        <button 
                          className="px-3 py-2 w-full text-left text-sm flex gap-2 items-center hover:bg-gray-100 rounded-lg transition"
                          onClick={() => openPaymentModal(user)}
                        >
                          <CreditCard size={16}/>
                          View Payments
                        </button>

                        <button 
                          className="px-3 py-2 w-full text-left text-sm flex gap-2 items-center hover:bg-gray-100 rounded-lg transition"
                          onClick={() => askConfirm(user, user.suspended ? "unsuspend" : "suspend")}
                        >
                          {user.suspended ? <RefreshCw size={16}/> : <ShieldX size={16}/>}
                          {user.suspended ? "Unsuspend" : "Suspend"}
                        </button>

                        <button 
                          className="px-3 py-2 w-full text-left text-sm flex gap-2 items-center hover:bg-gray-100 rounded-lg transition"
                          onClick={() => askConfirm(user,"disconnect")}
                        >
                          <Power size={16}/>
                          Disconnect WhatsApp
                        </button>

                        <button 
                          className={`px-3 py-2 w-full text-left text-sm flex gap-2 items-center hover:bg-gray-100 rounded-lg transition ${user.terminated ? "text-green-600" : "text-red-600"}`}
                          onClick={() => askConfirm(user, user.terminated ? "resume" : "terminate")}
                        >
                          {user.terminated ? <RefreshCw size={16}/> : <Slash size={16}/>}
                          {user.terminated ? "Restore Account" : "Terminate Account"}
                        </button>

                        <button 
                          className="px-3 py-2 w-full text-left text-sm text-red-600 hover:bg-red-50 flex gap-2 items-center rounded-lg transition"
                          onClick={() => askConfirm(user,"delete")}
                        >
                          <Trash size={16}/>
                          Delete Permanently
                        </button>

                      </motion.div>
                    </>
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
          className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
          initial={{opacity:0}} 
          animate={{opacity:1}} 
          exit={{opacity:0}}
        >
          <motion.div 
            className="bg-white p-6 w-full max-w-2xl rounded-xl shadow-xl max-h-[80vh] overflow-y-auto"
            initial={{scale:0.9}} 
            animate={{scale:1}}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Payments - {paymentModal.user?.fullName}
              </h2>
              <button 
                onClick={() => setPaymentModal({open: false, loading: true, payments: [], user: null})}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {paymentModal.loading ? (
              <div className="flex justify-center py-12">
                <motion.div 
                  className="h-8 w-8 border-4 rounded-full border-slate-300 border-t-slate-900"
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 0.9 }} 
                />
              </div>
            ) : paymentModal.payments.length === 0 ? (
              <p className="text-center text-gray-500 py-12">No payments found</p>
            ) : (
              <div className="space-y-3">
                {paymentModal.payments.map((payment) => (
                  <div 
                    key={payment._id} 
                    className="p-4 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{payment.planName}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{payment.amount}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          payment.status === 'approved' ? 'bg-green-100 text-green-700' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
      {confirmModal.open && (
        <motion.div 
          className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
          initial={{opacity:0}} 
          animate={{opacity:1}} 
          exit={{opacity:0}}
        >
          <motion.div 
            className="bg-white p-6 w-96 rounded-xl text-center shadow-xl"
            initial={{scale:0.9}} 
            animate={{scale:1}}
          >
            <h2 className="text-xl font-semibold mb-2">Confirm Action</h2>
            <p className="text-gray-600 mb-6">{confirmModal.message}</p>

            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal({open:false})} 
                className="w-1/2 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                onClick={executeAction} 
                className="w-1/2 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition"
              >
                Yes, Continue
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

    </div>
  );
}