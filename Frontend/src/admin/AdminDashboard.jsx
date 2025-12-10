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
  LogOut, // New icon for Disconnect
} from "lucide-react";

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
/* ============================================================== */
/* REST OF THE COMPONENT REMAINS THE SAME */
/* ============================================================== */

  /* ====== Loading State ====== */
  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-xl text-slate-500">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-blue-600" size={40} />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-red-500 p-10 text-lg">
        <AlertCircle className="mx-auto mb-4" size={48} />
        <p>Failed to load dashboard data.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn">

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col"
      >
        <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-slate-500">WhatsAPI Platform Control Center</p>
      </motion.div>

      {/* =============== SOCKET STATUS INDICATOR =============== */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
        socketConnected 
          ? "bg-green-50 text-green-700" 
          : "bg-red-50 text-red-700"
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          socketConnected ? "bg-green-500" : "bg-red-500"
        } animate-pulse`} />
        {socketConnected ? "Real-time connection active" : "Connection lost - Reconnecting..."}
      </div>

      {/* =============== ADMIN WHATSAPP STATUS (ENTERPRISE FIXED) =============== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-lg border border-slate-200 p-6 rounded-3xl shadow-lg"
      >
        <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Smartphone size={22} className="text-blue-600" /> 
            Admin WhatsApp Status
          </h2>
          
          <div className="flex gap-3">
            {/* DISCONNECT BUTTON (Only visible when connected) */}
            {adminConnected && (
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut size={18} className={disconnecting ? "animate-spin" : ""} />
                {disconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            )}

            {/* REFRESH/RETRY BUTTON (Only visible when not connected) */}
            {!adminConnected && (
              <button
                onClick={handleRefreshConnection}
                disabled={qrLoading || !socketConnected || disconnecting}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={18} className={qrLoading ? "animate-spin" : ""} />
                {qrLoading ? "Refreshing..." : "Refresh QR"}
              </button>
            )}
          </div>
        </div>

        {/* ERROR DISPLAY */}
        {disconnectError && (
          <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-800 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle size={18} />
            <span>Error: {disconnectError}</span>
          </div>
        )}


        {/* ✅ CONNECTION INDICATOR */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
          {adminConnected ? (
            <>
              <div className="flex-shrink-0">
                <CheckCircle2 className="text-green-600" size={36} />
              </div>
              <div className="flex-grow">
                <p className="text-green-600 text-lg font-semibold">
                  Admin WhatsApp Connected
                </p>
                {adminNumber && (
                  <p className="text-slate-600 text-sm mt-1 font-mono">
                    📞 +{adminNumber}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Ready to send notifications and alerts
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex-shrink-0">
                <XCircle className="text-orange-500" size={36} />
              </div>
              <div className="flex-grow">
                <p className="text-orange-600 text-lg font-semibold">
                  Admin WhatsApp Not Connected
                </p>
                <p className="text-slate-500 text-sm mt-1">
                  {adminQR 
                    ? "Scan the QR code below to connect" 
                    : "Waiting for QR code to generate..."}
                </p>
              </div>
            </>
          )}
        </div>

        {/* ✅ QR DISPLAY (ONLY WHEN NOT CONNECTED AND QR EXISTS) */}
        {!adminConnected && adminQR && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-6"
          >
            <div className="bg-white p-6 rounded-2xl shadow-2xl border-4 border-slate-200 relative">
              <img
                src={adminQR}
                alt="Admin WhatsApp QR"
                className="w-72 h-72 rounded-xl"
              />
              <div className="absolute -top-3 -right-3 bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg">
                ADMIN
              </div>
            </div>
            
            <div className="mt-6 text-center max-w-md bg-blue-50 p-4 rounded-xl border border-blue-200">
              <p className="text-blue-900 font-medium mb-2 flex items-center justify-center gap-2">
                <Smartphone size={18} />
                How to Connect
              </p>
              <ol className="text-sm text-blue-800 text-left space-y-1">
                <li>1. Open WhatsApp on your phone</li>
                <li>2. Go to <strong>Linked Devices</strong></li>
                <li>3. Tap <strong>Link a Device</strong></li>
                <li>4. Scan this QR code</li>
              </ol>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              QR code refreshes automatically every 30 seconds
            </p>
          </motion.div>
        )}

        {/* ✅ WAITING STATE (NO QR YET) */}
        {!adminConnected && !adminQR && !disconnecting && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <RefreshCw className="animate-spin mb-4 text-blue-600" size={40} />
            <p className="text-lg font-medium">Generating QR Code...</p>
            <p className="text-sm mt-2">Please wait a moment</p>
            
            {!socketConnected && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                <AlertCircle className="inline mr-2" size={16} />
                Connection issue detected. Check your server.
              </div>
            )}
          </div>
        )}
        
        {/* 🔴 DISCONNECTING STATE */}
        {!adminConnected && !adminQR && disconnecting && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <RefreshCw className="animate-spin mb-4 text-red-600" size={40} />
            <p className="text-lg font-medium text-red-700">Attempting Disconnection...</p>
            <p className="text-sm mt-2">Waiting for server confirmation.</p>
          </div>
        )}


        {/* ✅ CONNECTED STATE - NO QR SHOWN */}
        {adminConnected && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200"
          >
            <CheckCircle2 className="mx-auto text-green-600 mb-3" size={56} />
            <p className="text-green-700 font-semibold text-xl mb-2">
              Admin WhatsApp Active
            </p>
            <p className="text-green-600 text-sm">
              System ready to send notifications to users
            </p>
            
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-green-200">
                <p className="text-xs text-slate-500">Last Connected</p>
                <p className="text-sm font-semibold text-slate-700">Just now</p>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-green-200">
                <p className="text-xs text-slate-500">Status</p>
                <p className="text-sm font-semibold text-green-600">Online</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ========================= TOP STATS ========================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<Users size={24} />}
          color="from-green-500 to-emerald-600"
        />

        <StatCard
          title="Active API Keys"
          value={stats.activeAPIKeys}
          icon={<KeyRound size={24} />}
          color="from-blue-500 to-indigo-600"
        />

        <StatCard
          title="Messages Used"
          value={stats.totalMessagesUsed}
          icon={<MessageCircle size={24} />}
          color="from-amber-500 to-orange-600"
        />

        <StatCard
          title="Messages Left"
          value={stats.totalMessagesLeft}
          icon={<BarChart3 size={24} />}
          color="from-rose-500 to-red-600"
        />
      </div>

      {/* ========================= SYSTEM STATUS ========================= */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-lg border border-slate-200 p-6 rounded-3xl shadow-lg"
      >
        <h2 className="text-xl font-semibold mb-5">System Status</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatusCard
            label="Server Status"
            value={stats.system.serverStatus}
            color="text-green-600"
            icon={<Zap size={20} />}
          />

          <StatusCard
            label="Connected WhatsApp Sessions"
            value={`${stats.connectedUsers} Active`}
            color="text-blue-600"
            icon={<Smartphone size={20} />}
          />

          <StatusCard
            label="API Response Time"
            value={`${stats.system.apiLatency} ms`}
            color="text-orange-600"
            icon={<Activity size={20} />}
          />
        </div>
      </motion.div>
    </div>
  );
}

/* ===========================================
   COMPONENTS (Unchanged)
=========================================== */
const StatCard = ({ title, value, icon, color }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    transition={{ type: "spring", stiffness: 300 }}
    className={`rounded-3xl p-6 shadow-lg bg-gradient-to-br ${color} text-white flex flex-col gap-3 cursor-pointer`}
  >
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-medium opacity-90">{title}</h3>
      <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">{icon}</div>
    </div>
    <h2 className="text-3xl font-bold">{value}</h2>
  </motion.div>
);

const StatusCard = ({ label, value, icon, color }) => (
  <div className="p-5 bg-slate-100 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow text-slate-600">
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  </div>
);