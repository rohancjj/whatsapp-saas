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
  Power,
  ShieldX,
  Trash,
  RefreshCw,
  Slash
} from "lucide-react";

export default function UserManagement() {

  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [openDropdown, setOpenDropdown] = useState(null);

  // CONFIRM MODAL STATE
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

  // CONFIRMATION → ACTION
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

      setTimeout(() => {
        fetchUsers();
      }, 400);

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
      disconnect: `Disconnect WhatsApp session for ${user.fullName}?`,
      delete: `Delete ${user.fullName} permanently? This action cannot be undone.`
    };

    setConfirmModal({
      open: true,
      user,
      action,
      message: messages[action],
    });

    setOpenDropdown(null);
  };

  const openPaymentModal = async (user) => {
    setPaymentModal({ open: true, loading: true, payments: [], user });

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
    } catch (err) {
      console.error(err);
      setPaymentModal({ open: true, loading: false, payments: [], user });
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <motion.div
        className="h-10 w-10 border-4 rounded-full border-slate-300 border-t-slate-900"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
      />
    </div>
  );

  return (
    <div className="p-6 space-y-8 animate-fadeIn">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="relative">
          <Search className="absolute left-3 top-2 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e)=>handleSearch(e.target.value)}
            placeholder="Search users…"
            className="pl-10 pr-4 py-2 w-60 rounded-xl border bg-slate-50 focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      {/* USER TABLE */}
      <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-slate-500 border-b">
              <th>User</th><th>Email</th><th>Plan</th>
              <th>API Key</th><th>Status</th><th></th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((user) => (
              <tr key={user._id} className="border-b">

                {/* USER INFO */}
                <td className="py-4 flex gap-3">
                  <UserCircle size={32} className="text-slate-400" />
                  <div>
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-xs text-gray-500">{user.phone}</p>
                  </div>
                </td>

                {/* EMAIL */}
                <td className="flex gap-1 items-center text-sm">
                  <Mail size={16}/> {user.email}
                </td>

                {/* PLAN */}
                <td>{user.activePlan?.name || "No Plan"}</td>

                {/* API KEY */}
                <td>
                  {user.activePlan?.apiKey 
                    ? <span className="text-xs bg-slate-100 px-2 py-1 rounded">{user.activePlan.apiKey.slice(0,10)}...</span>
                    : "-"
                  }
                </td>

                {/* WHATSAPP STATUS */}
                <td>
                  {user.whatsapp?.connected 
                    ? <span className="text-green-600 flex gap-1"><Wifi size={18}/>Online</span>
                    : <span className="text-red-600 flex gap-1"><WifiOff size={18}/>Offline</span>
                  }
                </td>

                {/* ACTION MENU */}
                <td className="relative">
                  <button 
                    className="px-3 py-1 text-xs bg-black text-white rounded-lg"
                    onClick={() => setOpenDropdown(openDropdown === user._id ? null : user._id)}
                  >⋯ Actions</button>

                  <AnimatePresence>
                  {openDropdown === user._id && (
                    <motion.div
                      initial={{opacity:0,y:-6}}
                      animate={{opacity:1,y:0}}
                      exit={{opacity:0,y:-6}}
                      className="absolute right-0 mt-2 p-2 w-52 bg-white border shadow rounded-xl z-50"
                    >
                      <button className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm flex gap-2"
                        onClick={()=>openPaymentModal(user)}>
                        <CreditCard size={16}/>View Payments
                      </button>

                      {/* Suspend / Unsuspend */}
                      <button
                        onClick={() => askConfirm(user, user.suspended ? "unsuspend" : "suspend")}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm flex gap-2"
                      >
                        {user.suspended ? <RefreshCw size={16}/> : <ShieldX size={16}/>}
                        {user.suspended ? "Unsuspend User" : "Suspend User"}
                      </button>

                      {/* WhatsApp */}
                      <button
                        onClick={() => askConfirm(user,"disconnect")}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm flex gap-2"
                      >
                        <Power size={16}/> Disconnect WhatsApp
                      </button>

                      {/* Terminate / Resume */}
                      <button
                        onClick={() => askConfirm(user,user.terminated ? "resume" : "terminate")}
                        className={`w-full px-3 py-2 text-left text-sm flex gap-2 ${
                          user.terminated ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {user.terminated ? <RefreshCw size={16}/> : <Slash size={16}/> }
                        {user.terminated ? "Restore Account" : "Terminate Account"}
                      </button>

                      <button
                        onClick={() => askConfirm(user,"delete")}
                        className="w-full px-3 py-2 text-left hover:bg-red-100 text-sm text-red-800 flex gap-2"
                      >
                        <Trash size={16}/>Delete Permanently
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

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
      {confirmModal.open && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50"
          initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        >
          <motion.div 
            className="bg-white p-6 w-96 rounded-3xl shadow-xl text-center"
            initial={{scale:0.9}} animate={{scale:1}}
          >
            <h2 className="text-xl font-semibold mb-2">Are you sure?</h2>
            <p className="text-gray-600 mb-5">{confirmModal.message}</p>

            <div className="flex gap-3">
              <button
                onClick={()=>setConfirmModal({open:false})}
                className="w-1/2 py-2 bg-gray-200 rounded-xl hover:bg-gray-300"
              >Cancel</button>

              <button
                onClick={executeAction}
                className="w-1/2 py-2 bg-black text-white rounded-xl hover:bg-gray-800"
              >Yes, Continue</button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

    </div>
  );
}
