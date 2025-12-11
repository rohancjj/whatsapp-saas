import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// WEBSITE
import LandingPage from "./website/pages/LandingPage";
import NavBar from "./website/pages/NavBar";
import WhatsAppApiDocs from "./website/pages/WhatsAppApiDocs";

// AUTH
import AuthPage from "./website/pages/AuthPage";

// USER
import Pricing from "./website/pages/Pricing";
import UserDashboard from "./website/pages/UserDashboard";
import ProtectedUser from "./routes/ProtectedUser";
import PaymentPage from "./website/pages/PaymentPage";

// ADMIN
import ProtectedAdmin from "./routes/ProtectedAdmin";
import AdminLayout from "./admin/layout/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import AdminOffers from "./admin/AdminOffers";
import UserManagement from "./admin/UserManagement";
import AdminPaymentSettings from "./admin/AdminPaymentSettings";
import TemplateManager from "./admin/TemplateManager";
import AdminPaymentDashboard from "./admin/AdminPaymentDashboard";

import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">

        <Routes>

          {/* ================= WEBSITE ROUTES ================= */}
          <Route
            path="/"
            element={
              <>
                <NavBar />
                <LandingPage />
                <WhatsAppApiDocs />
              </>
            }
          />

          <Route
            path="/auth"
            element={
              <>
                <NavBar />
                <AuthPage />
              </>
            }
          />

          {/* ================= USER ROUTES (NESTED) ================= */}
          <Route
            path="/user"
            element={
              <ProtectedUser>
                <Outlet />
              </ProtectedUser>
            }
          >
            {/* Pricing Page (without sidebar) */}
            <Route path="pricing" element={<Pricing />} />

            {/* Payment Route (without sidebar) */}
            <Route path="payment/:planId" element={<PaymentPage />} />

            {/* Dashboard Route - UserDashboard handles its own nested routing */}
            <Route path="dashboard/*" element={<UserDashboard />} />

            {/* Default redirect to dashboard */}
            <Route index element={<Navigate to="/user/dashboard" replace />} />
          </Route>

          {/* ================= ADMIN ROUTES ================= */}
          <Route
            path="/admin"
            element={
              <ProtectedAdmin>
                <AdminLayout />
              </ProtectedAdmin>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="offers" element={<AdminOffers />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="AdminPaymentDashboard" element={<AdminPaymentDashboard />} />
            <Route path="PaymentSettings" element={<AdminPaymentSettings />} />
            <Route path="TemplateManager" element={<TemplateManager />} />
          </Route>

        </Routes>

      </div>
    </BrowserRouter>
  );
}