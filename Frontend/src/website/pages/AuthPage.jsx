import React, { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Phone,
  ShieldCheck,
  Layers,
  Zap,
  Smartphone,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

/* ---------------------------------------
   SUCCESS CARD (same as before)
---------------------------------------- */
function RedirectSuccessCard({ onComplete }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown === 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onComplete]);

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 p-2 pointer-events-none">
      <div className="bg-white p-4 rounded-xl shadow-2xl border border-green-200">
        <div className="flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600" />
          <div>
            <h2 className="text-sm font-bold">Signup Successful!</h2>
            <p className="text-xs text-gray-600">
              Redirecting in <b>{countdown}s</b>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------
   MAIN COMPONENT
---------------------------------------- */
export default function PremiumAuth() {
  const [mode, setMode] = useState("signin");
  const [loading, setLoading] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState(null);
  const [showSuccessCard, setShowSuccessCard] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    usage: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    if (e.target.name === "phone") {
      setPhoneStatus(null);
      setOtpSent(false);
      setOtpVerified(false);
    }
  };

  /* ---------------------------------------
     SEND OTP
  ---------------------------------------- */
  const sendOtp = async () => {
    if (!form.phone || form.phone.length < 10) {
      return alert("Enter a valid phone number before sending OTP.");
    }

    try {
      const res = await fetch("http://localhost:8080/api/v1/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone }),
      });

      const data = await res.json();

      if (data.success) {
        setOtpSent(true);
        alert("OTP Sent to WhatsApp!");
      } else {
        alert("OTP sending failed: " + data.message);
      }
    } catch (err) {
      alert("Server error");
    }
  };

  /* ---------------------------------------
     VERIFY OTP
  ---------------------------------------- */
  const verifyOtp = async () => {
    if (!otp) return alert("Enter OTP");

    try {
      const res = await fetch("http://localhost:8080/api/v1/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, code: otp }),
      });

      const data = await res.json();

      if (data.success) {
        setOtpVerified(true);
        alert("OTP Verified! You can now complete signup.");
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Server error");
    }
  };

  /* ---------------------------------------
     LOGIN HANDLER
  ---------------------------------------- */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) return alert(data.message);

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("user", JSON.stringify(data.user));

      window.location.href =
        data.user.role === "admin" ? "/admin/dashboard" : "/user/dashboard";
    } catch (err) {
      setLoading(false);
      alert("Server error");
    }
  };

  /* ---------------------------------------
     SIGNUP HANDLER (REQUIRES OTP VERIFIED)
  ---------------------------------------- */
  const handleSignup = async (e) => {
    e.preventDefault();

    if (!otpVerified)
      return alert("Please verify OTP before creating account.");

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          phone: form.phone,
          usageReason: form.usage,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) return alert(data.message);

      setShowSuccessCard(true);
    } catch (err) {
      setLoading(false);
      alert("Server error");
    }
  };

  /* ---------------------------------------
     UI RENDER
  ---------------------------------------- */
  const statusDisplay = phoneStatus
    ? {
        verified: {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-50",
          message: "WhatsApp number exists!",
        },
        "not-found": {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          message: "Number not found on WhatsApp",
        },
        unavailable: {
          icon: AlertCircle,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          message: "Unable to verify number",
        },
      }[phoneStatus]
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center px-6 py-12">
      {showSuccessCard && <RedirectSuccessCard onComplete={() => {
        setMode("signin");
        setShowSuccessCard(false);
      }} />}

      <div className="w-full max-w-6xl bg-white shadow-2xl rounded-3xl overflow-hidden border grid grid-cols-1 md:grid-cols-2">

        {/* ------------------------------
            SIGNUP FORM
        ------------------------------ */}
        <div className="bg-white p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </h1>

          <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl w-fit mb-8">
            <button
              onClick={() => setMode("signin")}
              className={`px-5 py-2 rounded-xl ${
                mode === "signin" ? "bg-white shadow font-medium" : "text-gray-500"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`px-5 py-2 rounded-xl ${
                mode === "signup" ? "bg-white shadow font-medium" : "text-gray-500"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* LOGIN */}
          {mode === "signin" && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label>Email</label>
                <div className="flex bg-gray-100 p-3 rounded-xl mt-2">
                  <Mail size={18} />
                  <input
                    name="email"
                    type="email"
                    onChange={handleChange}
                    className="bg-transparent w-full ml-2"
                  />
                </div>
              </div>

              <div>
                <label>Password</label>
                <div className="flex bg-gray-100 p-3 rounded-xl mt-2">
                  <Lock size={18} />
                  <input
                    name="password"
                    type="password"
                    onChange={handleChange}
                    className="bg-transparent w-full ml-2"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gray-900 text-white py-3 rounded-xl"
              >
                Continue
              </button>
            </form>
          )}

          {/* SIGNUP */}
          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label>Full Name</label>
                <div className="flex bg-gray-100 p-3 rounded-xl mt-2">
                  <User size={18} />
                  <input
                    name="fullName"
                    onChange={handleChange}
                    className="bg-transparent w-full ml-2"
                  />
                </div>
              </div>

              <div>
                <label>Email</label>
                <div className="flex bg-gray-100 p-3 rounded-xl mt-2">
                  <Mail size={18} />
                  <input
                    name="email"
                    type="email"
                    onChange={handleChange}
                    className="bg-transparent w-full ml-2"
                  />
                </div>
              </div>

              <div>
                <label>Password</label>
                <div className="flex bg-gray-100 p-3 rounded-xl mt-2">
                  <Lock size={18} />
                  <input
                    name="password"
                    type="password"
                    onChange={handleChange}
                    className="bg-transparent w-full ml-2"
                  />
                </div>
              </div>

              <div>
                <label>Usage</label>
                <select
                  name="usage"
                  onChange={handleChange}
                  className="bg-gray-100 p-3 rounded-xl w-full mt-2"
                >
                  <option value="">Select</option>
                  <option>Chatbot automation</option>
                  <option>Marketing broadcasts</option>
                  <option>Customer support</option>
                </select>
              </div>

              {/* PHONE + OTP SECTION */}
              <div>
                <label>Phone Number</label>
                <div className="flex bg-gray-100 p-3 rounded-xl mt-2">
                  <Phone size={18} />
                  <input
                    name="phone"
                    type="tel"
                    onChange={handleChange}
                    className="bg-transparent w-full ml-2"
                    placeholder="+91 98765 43210"
                  />
                </div>

                {/* SEND OTP */}
                <button
                  type="button"
                  onClick={sendOtp}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-xl"
                >
                  Send OTP
                </button>

                {/* OTP INPUT */}
                {otpSent && (
                  <>
                    <input
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="bg-gray-100 p-3 rounded-xl w-full mt-3"
                    />

                    <button
                      type="button"
                      onClick={verifyOtp}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl mt-2"
                    >
                      Verify OTP
                    </button>
                  </>
                )}

                {otpVerified && (
                  <p className="text-green-600 mt-2 flex items-center gap-2">
                    <CheckCircle size={18} /> OTP Verified!
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!otpVerified}
                className={`w-full py-3 rounded-xl text-lg font-semibold
                  ${otpVerified ? "bg-gray-900 text-white" : "bg-gray-300 text-gray-500"}`}
              >
                Create Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
