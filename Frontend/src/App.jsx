import { BrowserRouter, Routes, Route } from "react-router-dom";

// WEBSITE
import LandingPage from "./website/pages/LandingPage";
import NavBar from "./website/pages/NavBar";

// AUTH
import AuthPage from "./website/pages/AuthPage";

// USER
// import UserDashboard from "./user/pages/UserDashboard";
import Pricing from "./website/pages/Pricing";

// ADMIN
import AdminDashboard from "./admin/AdminDashboard";

// PROTECTED ROUTES
import ProtectedUser from "./routes/ProtectedUser";
import ProtectedAdmin from "./routes/ProtectedAdmin";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50">

        {/* Navbar only for website + auth */}
        <Routes>
          <Route
            path="/*"
            element={
              <>
                <NavBar />
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                </Routes>
              </>
            }
          />

          {/* USER ROUTES */}
          <Route
            path="/user/*"
            element={
              <ProtectedUser>
                <Routes>
                  {/* <Route path="dashboard" element={<UserDashboard />} /> */}
                  <Route path="pricing" element={<Pricing />} />
                </Routes>
              </ProtectedUser>
            }
          />

          {/* ADMIN ROUTES */}
          <Route
            path="/admin/*"
            element={
              <ProtectedAdmin>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                </Routes>
              </ProtectedAdmin>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
