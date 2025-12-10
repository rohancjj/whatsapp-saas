import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { io } from "socket.io-client";
import QRCode from "qrcode";

import {
  Users,
  MessageCircle,
  BarChart3,
  Smartphone,
  KeyRound,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  LogOut,
  Scan, // New icon for QR scanner feel
  Loader2, // New icon for smoother loading states
} from "lucide-react";

// StatCard Component - Premium Styling
const StatCard = ({ title, value, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className={`rounded-xl p-6 shadow-xl ${color} text-white flex flex-col gap-3 cursor-pointer overflow-hidden relative`}
  >
    {/* Background Pattern */}
    <div className="absolute top-0 right-0 h-24 w-24 bg-white/10 rounded-full blur-xl transform translate-x-1/2 -translate-y-1/2 opacity-50"></div>
    <div className="absolute bottom-0 left-0 h-16 w-16 bg-white/10 rounded-full blur-xl transform -translate-x-1/3 translate-y-1/3 opacity-50"></div>

    <div className="flex items-start justify-between z-10">
      <h3 className="text-base font-medium opacity-90 tracking-wider uppercase">{title}</h3>
      <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm shadow-md">{icon}</div>
    </div>
    <h2 className="text-4xl font-extrabold tracking-tight z-10">{value}</h2>
  </motion.div>
);

// StatusCard Component - Premium Styling
const StatusCard = ({ label, value, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: "spring", stiffness: 400, delay: 0.2 }}
    className="p-5 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center gap-4 hover:shadow-xl transition-shadow"
  >
    <div className={`p-3 rounded-full shadow-inner ${
      color.includes('green') ? 'bg-green-50' : 
      color.includes('blue') ? 'bg-blue-50' : 
      color.includes('orange') ? 'bg-orange-50' : 'bg-slate-50'
    }`}>
      <div className={`${color} text-lg`}>{icon}</div>
    </div>
    <div>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  </motion.div>
);


export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [adminQR, setAdminQR] = useState(null);
  const [adminConnected, setAdminConnected] = useState(false);
  const [adminNumber, setAdminNumber] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // NEW STATE for disconnect loading/status
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState(null);

  const socketRef = useRef(null);
  const token = localStorage.getItem("token");

  // ==============================================================================
  // CORE LOGIC - DO NOT CHANGE
  // ==============================================================================
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await axios.get("http://localhost:8080/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    /* ========================= SOCKET (ENTERPRISE GRADE) ========================= */
    const socket = io("http://localhost:8080", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 20000,
    });

    socketRef.current = socket;

    // Socket Connection Events
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      setSocketConnected(true);
      setQrLoading(false);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setSocketConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("🔴 Socket connection error:", err.message);
      setSocketConnected(false);
    });

    // ✅ ADMIN QR EVENT (FIXED)
    socket.on("admin_qr", async (qrString) => {
      console.log("📲 Received Admin QR Event:", qrString ? "QR Data" : "null (clear QR)");

      if (!qrString) {
        // QR should be cleared (connection established)
        setAdminQR(null);
        setQrLoading(false);
        return;
      }

      try {
        const qrImage = await QRCode.toDataURL(qrString);
        setAdminQR(qrImage);
        setAdminConnected(false);
        setAdminNumber(null);
        setQrLoading(false);
        setDisconnecting(false); // New: Clear disconnecting on successful QR generation
        console.log("✅ QR Code generated and displayed");
      } catch (err) {
        console.error("❌ QR Code generation error:", err);
        setQrLoading(false);
      }
    });

    // ✅ ADMIN CONNECTED EVENT (FIXED)
    socket.on("admin_connected", ({ phoneNumber }) => {
      console.log("🟢 Admin WA Connected Event:", phoneNumber);

      // CRITICAL: Clear QR immediately on connection
      setAdminQR(null);
      setAdminConnected(true);
      setAdminNumber(phoneNumber);
      setQrLoading(false);
      setDisconnecting(false); // Stop disconnecting status if a new connection is established
      setDisconnectError(null);
    });

    // ✅ ADMIN DISCONNECTED EVENT
    socket.on("admin_disconnected", () => {
      console.log("🔴 Admin WA Disconnected Event");

      setAdminConnected(false);
      setAdminNumber(null);
      setDisconnecting(false); // Clear disconnecting state on confirmation
      // Don't clear QR here - wait for new QR or connection event
    });

    // Cleanup on unmount
    return () => {
      console.log("🧹 Cleaning up socket connection");
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token]);

  /* ====== Refresh Connection ====== */
  const handleRefreshConnection = () => {
    console.log("🔄 Refreshing Admin WhatsApp connection...");
    setQrLoading(true);
    setDisconnectError(null);

    // Reconnect socket to trigger new QR
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }

    // Timeout in case QR doesn't come
    setTimeout(() => {
      if (qrLoading) {
        setQrLoading(false);
        console.log("⚠️ QR refresh timeout");
      }
    }, 15000);
  };

  /* ============================================================== */
  /* 🚀 Disconnect Connection (Updated Function) */
  /* ============================================================== */
  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect the Admin WhatsApp session? This will force a new QR code to be generated.")) {
      return;
    }

    setDisconnecting(true);
    setDisconnectError(null);
    setAdminQR(null); // Optimistic UI update

    try {
      // Call the backend endpoint
      await axios.post("http://localhost:8080/api/v1/whatsapp/disconnect", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // If the request succeeds, the socket listener ('admin_disconnected') 
      // will handle the final state update (setDisconnecting(false)).
      console.log("✅ Admin WhatsApp disconnection requested.");

    } catch (err) {
      console.error("Disconnect API call failed:", err);
      const responseMessage = err.response?.data?.message;

      // 🛑 CORE FIX: Handle "No active session" (400 Bad Request) as success.
      if (err.response?.status === 400 && responseMessage === "No active session") {
        console.log("⚠️ Session was already inactive on the server. Treating as success.");

        // Manually update the state to force UI to QR/Waiting state
        setAdminConnected(false);
        setAdminNumber(null);
        setDisconnecting(false);
        // Attempt to refresh the connection to immediately trigger QR generation
        handleRefreshConnection();
        return;
      }

      // Handle other failures (e.g., 500 server error, network issues)
      setDisconnectError(responseMessage || "Failed to disconnect session due to server error.");
      setDisconnecting(false);
      // Attempt to refresh/reconnect to get a clean state
      handleRefreshConnection();
    }
  };
  // ==============================================================================
  // END CORE LOGIC
  // ==============================================================================

  /* ====== Loading State ====== */
  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-xl text-slate-500">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <span className="text-2xl font-semibold text-slate-700">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center bg-red-50 p-10 rounded-xl shadow-lg text-lg border border-red-200">
        <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
        <p className="text-xl font-semibold text-red-700 mb-4">Failed to load dashboard data.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-8 py-3 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 transition transform hover:scale-105"
        >
          <RefreshCw className="inline mr-2" size={18} />
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10 bg-slate-50/50 min-h-screen">
      
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col border-b border-slate-200 pb-4"
      >
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Enterprise Dashboard</h1>
        <p className="text-lg text-slate-500 mt-1">WhatsAPI Platform Control Center - System Overview</p>
      </motion.div>

      {/* =============== SOCKET STATUS INDICATOR =============== */}
      <div className={`flex items-center gap-3 px-5 py-3 rounded-xl text-base shadow-sm ${
        socketConnected
          ? "bg-green-100 text-green-800 border border-green-200"
          : "bg-red-100 text-red-800 border border-red-200"
      }`}>
        <div className={`w-3 h-3 rounded-full ${
          socketConnected ? "bg-green-500" : "bg-red-500"
        } animate-ping-slow`} />
        <span className="font-semibold">Real-time Service Status:</span>
        {socketConnected ? "Active and connected" : "Connection lost - Attempting immediate reconnection..."}
      </div>

      {/* ========================= TOP STATS ========================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={<Users size={28} />}
          color="bg-gradient-to-r from-emerald-500 to-green-600"
        />

        <StatCard
          title="Active API Keys"
          value={stats.activeAPIKeys.toLocaleString()}
          icon={<KeyRound size={28} />}
          color="bg-gradient-to-r from-blue-500 to-indigo-600"
        />

        <StatCard
          title="Messages Used"
          value={stats.totalMessagesUsed.toLocaleString()}
          icon={<MessageCircle size={28} />}
          color="bg-gradient-to-r from-amber-500 to-orange-600"
        />

        <StatCard
          title="Messages Left"
          value={stats.totalMessagesLeft.toLocaleString()}
          icon={<BarChart3 size={28} />}
          color="bg-gradient-to-r from-rose-500 to-red-600"
        />
      </div>

      {/* =============== ADMIN WHATSAPP STATUS (ENTERPRISE FIXED) =============== */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-100"
      >
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4 border-b pb-4">
          <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-800">
            <Smartphone size={24} className="text-blue-600" />
            Admin WhatsApp Connection Control
          </h2>

          <div className="flex gap-3">
            {/* DISCONNECT BUTTON (Only visible when connected) */}
            {adminConnected && (
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                <LogOut size={20} className={disconnecting ? "animate-spin" : ""} />
                {disconnecting ? "Disconnecting..." : "Disconnect Session"}
              </button>
            )}

            {/* REFRESH/RETRY BUTTON (Only visible when not connected) */}
            {!adminConnected && (
              <button
                onClick={handleRefreshConnection}
                disabled={qrLoading || !socketConnected || disconnecting}
                className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              >
                <RefreshCw size={20} className={qrLoading ? "animate-spin" : ""} />
                {qrLoading ? "Requesting New QR..." : "Refresh/Get QR"}
              </button>
            )}
          </div>
        </div>

        {/* ERROR DISPLAY */}
        {disconnectError && (
          <div className="p-4 mb-4 bg-red-50 border border-red-300 text-red-800 rounded-lg text-base flex items-center gap-2 font-medium">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
            <span>**Connection Error:** {disconnectError}</span>
          </div>
        )}


        {/* ✅ CONNECTION INDICATOR */}
        <div className="flex items-center gap-6 mb-8 p-5 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200">
          {adminConnected ? (
            <>
              <div className="flex-shrink-0">
                <CheckCircle2 className="text-green-600" size={40} />
              </div>
              <div className="flex-grow">
                <p className="text-green-700 text-xl font-extrabold">
                  Admin WhatsApp Connected
                </p>
                {adminNumber && (
                  <p className="text-slate-600 text-md mt-1 font-mono tracking-wider">
                    **Active Number:** +{adminNumber}
                  </p>
                )}
                <p className="text-sm text-slate-500 mt-2">
                  The system is fully operational and ready to send high-priority notifications.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex-shrink-0">
                <XCircle className="text-red-500" size={40} />
              </div>
              <div className="flex-grow">
                <p className="text-red-600 text-xl font-extrabold">
                  Admin WhatsApp Disconnected
                </p>
                <p className="text-slate-500 text-md mt-1">
                  {adminQR
                    ? "Scan the QR code below to re-establish the connection."
                    : "The system is currently waiting for a QR code to be generated from the server."}
                </p>
              </div>
            </>
          )}
        </div>

        {/* ✅ QR DISPLAY (ONLY WHEN NOT CONNECTED AND QR EXISTS) */}
        {!adminConnected && adminQR && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="flex flex-col md:flex-row items-center justify-center gap-12 py-6 bg-blue-50 rounded-xl border-4 border-dashed border-blue-200"
          >
            <div className="bg-white p-8 rounded-2xl shadow-2xl border-4 border-blue-600 relative">
              <img
                src={adminQR}
                alt="Admin WhatsApp QR"
                className="w-72 h-72 rounded-lg"
              />
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-sm px-4 py-1.5 rounded-full font-bold shadow-xl flex items-center gap-2">
                <Scan size={18} />
                SCAN TO CONNECT
              </div>
            </div>

            <div className="text-left max-w-sm p-4">
              <p className="text-blue-900 font-bold text-xl mb-4 flex items-center gap-2">
                <Smartphone size={24} className="text-blue-600" />
                Connection Steps
              </p>
              <ol className="text-base text-slate-700 space-y-3 font-medium list-decimal list-inside">
                <li>Open **WhatsApp** on your Admin phone.</li>
                <li>Navigate to **Linked Devices**.</li>
                <li>Tap **Link a Device**.</li>
                <li>Scan the **QR code** to securely establish the session.</li>
              </ol>

              <p className="text-xs text-slate-500 mt-6 pt-4 border-t border-slate-200">
                Note: This QR code is time-sensitive and will refresh automatically every 30 seconds to maintain security.
              </p>
            </div>
          </motion.div>
        )}

        {/* ✅ WAITING STATE (NO QR YET) */}
        {!adminConnected && !adminQR && !disconnecting && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            <Loader2 className="animate-spin mb-4 text-blue-600" size={48} />
            <p className="text-xl font-extrabold text-slate-800">Generating New QR Code...</p>
            <p className="text-md mt-2">Establishing secure handshake with the server.</p>

            {!socketConnected && (
              <div className="mt-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 text-sm font-semibold">
                <AlertCircle className="inline mr-2" size={18} />
                Socket connection is unstable. Server communication may be delayed.
              </div>
            )}
          </div>
        )}

        {/* 🔴 DISCONNECTING STATE */}
        {!adminConnected && !adminQR && disconnecting && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-red-50 rounded-xl border border-red-200">
            <Loader2 className="animate-spin mb-4 text-red-600" size={48} />
            <p className="text-xl font-extrabold text-red-700">Initiating Session Disconnection...</p>
            <p className="text-md mt-2">Sending termination request to the WhatsApp server.</p>
          </div>
        )}


        {/* ✅ CONNECTED STATE - NO QR SHOWN */}
        {adminConnected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-10 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-4 border-green-300 border-dashed"
          >
            <CheckCircle2 className="mx-auto text-green-600 mb-4" size={64} />
            <p className="text-green-800 font-extrabold text-2xl mb-2">
              SESSION ACTIVE & STABLE
            </p>
            <p className="text-green-700 text-lg font-medium">
              The Admin WhatsApp session is securely linked and operational.
            </p>

            <div className="mt-8 flex items-center justify-center gap-6">
              <div className="bg-white px-6 py-3 rounded-xl shadow-md border border-green-200">
                <p className="text-xs text-slate-500 uppercase tracking-widest">Last Activity</p>
                <p className="text-lg font-bold text-slate-700 mt-1">Less than 1 min ago</p>
              </div>
              <div className="bg-white px-6 py-3 rounded-xl shadow-md border border-green-200">
                <p className="text-xs text-slate-500 uppercase tracking-widest">Status</p>
                <p className="text-lg font-bold text-green-600 mt-1">Fully Online</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ========================= SYSTEM STATUS ========================= */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-100"
      >
        <h2 className="text-2xl font-bold mb-6 text-slate-800 border-b pb-4">System Health Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatusCard
            label="Server Status"
            value={stats.system.serverStatus === 'online' ? 'Operational' : stats.system.serverStatus}
            color="text-green-600"
            icon={<Zap size={24} />}
          />

          

          <StatusCard
            label="API Response Time"
            value={`${stats.system.apiLatency} ms`}
            color={stats.system.apiLatency > 500 ? "text-red-600" : "text-orange-600"}
            icon={<Activity size={24} />}
          />
        </div>
      </motion.div>
    </div>
  );
}