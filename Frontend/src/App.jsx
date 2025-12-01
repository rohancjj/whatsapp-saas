import { BrowserRouter, Routes, Route } from "react-router-dom";

// WEBSITE
import LandingPage from "./website/pages/LandingPage";
import NavBar from "./website/pages/NavBar";

// AUTH
import AuthPage from "./website/pages/AuthPage";

// USER
import Pricing from "./website/pages/Pricing";
import UserDashboard from "./website/pages/UserDashboard";
import ProtectedUser from "./routes/ProtectedUser";

// ADMIN
import ProtectedAdmin from "./routes/ProtectedAdmin";
import AdminLayout from "./admin/layout/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import AdminOffers from "./admin/AdminOffers";

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
            <Route path="pricing" element={<Pricing />} />
            <Route path="dashboard" element={<UserDashboard />} />
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
          </Route>

        </Routes>

      </div>
    </BrowserRouter>
  );
}
