import React, { useState, useEffect, useMemo } from "react";
import { Outlet, Navigate, useNavigate, useLocation } from "react-router-dom";

import {
  LayoutDashboard,
  Percent,
  Users,
  Cog,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";


import { motion, AnimatePresence } from "framer-motion";

const AdminLayout = () => {
  const token = localStorage.getItem("token");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebar, setIsMobileSidebar] = useState(false);
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();

  /* ------------------ Auto Sidebar for Desktop ------------------ */
  useEffect(() => {
    if (window.innerWidth >= 1024) setIsSidebarOpen(true);
  }, []);

  /* ------------------ Live Clock ------------------ */
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ------------------ MENU ITEMS ------------------ */
  const menuItems = useMemo(
    () => [
      {
        name: "Dashboard",
        icon: <LayoutDashboard size={20} />,
        path: "/admin/dashboard",
      },
      {
        name: "Offers",
        icon: <Percent size={20} />,
        path: "/admin/offers",
      },
      {
        name: "Users",
        icon: <Users size={20} />,
        path: "/admin/users",
      },
      {
        name: "Payment",
        icon: <FileText size={20} />,
        path: "/admin/AdminPaymentDashboard",
      },
      {
        name: "Payment Settings",
        icon: <Cog size={20} />,
        path: "/admin/PaymentSettings",
      },
      {
        name: "Template Manager",
        icon: <FileText size={20} />,
        path: "/admin/TemplateManager",
      },
    ],
    []
  );

  /* ------------------ LOGOUT ------------------ */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/auth");
  };

  /* ------------------ AUTH CHECK ------------------ */
  if (!token) return <Navigate to="/auth" replace />;

  return (
    <div className="flex h-screen bg-[#f7f7f7] text-slate-800 overflow-hidden">

      {/* ======================= SIDEBAR (DESKTOP) ======================= */}
      <motion.aside
        animate={{ width: isSidebarOpen ? 250 : 80 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="hidden lg:flex bg-white border-r shadow-md flex-col"
      >
        {/* LOGO */}
        <div className="p-4 border-b flex items-center gap-2">
          <img src="/icon.gif" alt="logo" className="w-8 h-8 rounded-md" />
          {isSidebarOpen && <h2 className="font-semibold text-lg">Admin Panel</h2>}
        </div>

        {/* MENU */}
        <nav className="flex-1 overflow-y-auto p-3">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-2 transition 
                  ${
                    active
                      ? "bg-slate-200 font-semibold"
                      : "hover:bg-slate-100"
                  }`}
              >
                {item.icon}
                {isSidebarOpen && <span>{item.name}</span>}
              </button>
            );
          })}
        </nav>

        {/* LOGOUT */}
        <div className="p-3 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-100 text-red-600 w-full"
          >
            <LogOut size={18} />
            {isSidebarOpen && "Logout"}
          </button>
        </div>
      </motion.aside>

      {/* ======================= MOBILE SIDEBAR ======================= */}
      <AnimatePresence>
        {isMobileSidebar && (
          <>
            <motion.div
              onClick={() => setIsMobileSidebar(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            />

            <motion.aside
              initial={{ x: -250 }}
              animate={{ x: 0 }}
              exit={{ x: -250 }}
              className="fixed top-0 left-0 w-64 h-full bg-white shadow-xl z-50 p-4"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Admin Panel</h2>
                <button onClick={() => setIsMobileSidebar(false)}>
                  <X size={22} />
                </button>
              </div>

              <nav>
                {menuItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileSidebar(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 mb-2 rounded-lg hover:bg-slate-100"
                  >
                    {item.icon} {item.name}
                  </button>
                ))}
              </nav>

              <button
                onClick={handleLogout}
                className="mt-4 flex items-center gap-3 px-3 py-2 text-red-600 rounded-lg hover:bg-red-100 w-full"
              >
                <LogOut size={18} /> Logout
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ======================= CONTENT AREA ======================= */}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b shadow-sm p-3 flex justify-between items-center">
          <button
            className="lg:hidden p-2 rounded-md bg-slate-200"
            onClick={() => setIsMobileSidebar(true)}
          >
            <Menu size={22} />
          </button>

          <h1 className="text-xl font-semibold">Admin Panel</h1>

          <span className="font-mono text-sm">{time.toLocaleTimeString()}</span>
        </div>

        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
