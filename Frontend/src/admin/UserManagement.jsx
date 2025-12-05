import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, UserCircle, Wifi, WifiOff, Mail, CreditCard, Power, ShieldX, Trash, RefreshCw, Slash
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
      <div className="bg-white p-6 rounded-xl shadow-md">
        <table className="w-full text-left">
          <thead><tr className="border-b text-gray-500 text-sm">
            <th>User</th><th>Email</th><th>Plan</th><th>API Key</th><th>Status</th><th></th></tr></thead>

          <tbody>
            {filtered.map((user) => (
              <tr key={user._id} className="border-b">
                <td className="py-4 flex gap-3">
                  <UserCircle size={32} className="text-gray-400" />
                  <div><p className="font-medium">{user.fullName}</p><p className="text-xs text-gray-500">{user.phone}</p></div>
                </td>

                <td className="text-sm flex gap-1 items-center"><Mail size={16}/> {user.email}</td>
                <td>{user.activePlan?.name || "No Plan"}</td>

                <td>{user.activePlan?.apiKey ? <span className="text-xs bg-gray-100 px-2 py-1 rounded">{user.activePlan.apiKey.slice(0,10)}...</span> : "-"}</td>

                <td>{user.whatsapp?.connected ? <span className="text-green-600 flex gap-1"><Wifi size={18}/>Online</span> : <span className="text-red-600 flex gap-1"><WifiOff size={18}/>Offline</span>}</td>

                <td className="relative">
                  <button onClick={() => setOpenDropdown(openDropdown === user._id ? null : user._id)} className="px-3 py-1 text-xs bg-black text-white rounded-lg">⋯</button>

                  <AnimatePresence>
                  {openDropdown === user._id && (
                    <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}}
                      className="absolute right-0 mt-2 p-2 w-52 bg-white border shadow rounded-xl">

                      <button className="px-3 py-2 w-full text-left flex gap-2 hover:bg-gray-100" onClick={()=>openPaymentModal(user)}>
                        <CreditCard size={16}/>View Payments
                      </button>

                      <button className="px-3 py-2 w-full flex gap-2 hover:bg-gray-100"
                        onClick={()=>askConfirm(user, user.suspended ? "unsuspend" : "suspend")}>
                        {user.suspended ? <RefreshCw size={16}/> : <ShieldX size={16}/>}
                        {user.suspended ? "Unsuspend" : "Suspend"}
                      </button>

                      <button className="px-3 py-2 w-full flex gap-2 hover:bg-gray-100" onClick={()=>askConfirm(user,"disconnect")}>
                        <Power size={16}/>Disconnect WhatsApp
                      </button>

                      <button className={`px-3 py-2 w-full flex gap-2 hover:bg-gray-100 ${user.terminated ? "text-green-600" : "text-red-600"}`}
                        onClick={()=>askConfirm(user,user.terminated ? "resume" : "terminate")}>
                        {user.terminated ? <RefreshCw size={16}/> : <Slash size={16}/>}
                        {user.terminated ? "Restore Account" : "Terminate Account"}
                      </button>

                      <button className="px-3 py-2 text-red-600 hover:bg-red-100 w-full flex gap-2"
                        onClick={() => askConfirm(user,"delete")}>
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

      {/* Confirmation Modal */}
      <AnimatePresence>
      {confirmModal.open && (
        <motion.div className="fixed inset-0 bg-black/40 flex justify-center items-center"
          initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>

          <motion.div className="bg-white p-6 w-96 rounded-xl text-center shadow-xl"
            initial={{scale:0.9}} animate={{scale:1}}>

            <h2 className="text-xl font-semibold mb-2">Confirm Action</h2>
            <p className="text-gray-600 mb-4">{confirmModal.message}</p>

            <div className="flex gap-3">
              <button onClick={()=>setConfirmModal({open:false})} className="w-1/2 py-2 bg-gray-300 rounded-lg">Cancel</button>
              <button onClick={executeAction} className="w-1/2 py-2 bg-black text-white rounded-lg">Yes, Continue</button>
            </div>

          </motion.div>

        </motion.div>
      )}
      </AnimatePresence>

    </div>
  );
}
