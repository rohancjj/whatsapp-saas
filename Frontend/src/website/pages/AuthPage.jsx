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
  LogIn, // Added for the redirect card
} from "lucide-react";

// --- REVISED TOASTER SUCCESS COMPONENT ---
function RedirectSuccessCard({ onComplete }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown === 0) {
      onComplete(); // Execute redirect after countdown
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onComplete]);

  // keyframes and transition for a smooth entry/exit (tailwind needs config for this, but we'll use simple classes)
  return (
    // REVISED: fixed, top-center positioning, small padding, no black overlay
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 p-2 pointer-events-none">
      <div 
        className="bg-white p-4 rounded-xl shadow-2xl border border-green-200 
                   max-w-xs transition-all duration-500 ease-out 
                   transform translate-y-0 opacity-100"
      >
        <div className="flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-gray-900">
              Signup Successful!
            </h2>
            <p className="text-xs text-gray-600">
              Redirecting to Sign In in... 
              <span className="font-semibold text-green-700 ml-1">{countdown}s</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function PremiumAuth() {
  const [mode, setMode] = useState("signin");
  const [loading, setLoading] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState(null); // null, 'verified', 'not-found', 'unavailable'
  const [showSuccessCard, setShowSuccessCard] = useState(false); // State for success card

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
      setPhoneStatus(null); // Clear status when user types
    }
  };

  /* ------------------------------------------------------
    WHATSAPP NUMBER CHECK 
  ------------------------------------------------------ */
  const checkWhatsAppNumber = async (number) => {
    try {
      const res = await fetch("http://localhost:8080/api/v1/whatsapp/check-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number }),
      });

      const data = await res.json();
      
      return {
        exists: data.exists,
        verified: data.verified || false,
        message: data.message || ""
      };
    } catch (err) {
      console.error("WhatsApp check failed:", err);
      return { 
        exists: null, 
        verified: false, 
        message: "Check failed" 
      };
    }
  };

  /* ------------------------------------------------------
    PHONE VALIDATION (ON BLUR) 
  ------------------------------------------------------ */
  const handlePhoneBlur = async () => {
    if (!form.phone || form.phone.length < 10) return;

    setCheckingPhone(true);
    const result = await checkWhatsAppNumber(form.phone.trim());
    setCheckingPhone(false);

    if (result.exists === true) {
      setPhoneStatus('verified');
    } else if (result.exists === false) {
      setPhoneStatus('not-found');
    } else {
      setPhoneStatus('unavailable');
    }
  };

  /* ------------------------------------------------------
    LOGIN HANDLER 
  ------------------------------------------------------ */
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message || "Login failed");

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "admin") window.location.href = "/admin/dashboard";
      else window.location.href = "/user/pricing";
    } catch (err) {
      alert("Server error");
    }
  };

  /* ------------------------------------------------------
    SIGNUP HANDLER 
  ------------------------------------------------------ */
  const handleSignup = async (e) => {
    e.preventDefault(); 
    setLoading(true);

    if (!form.phone) {
      setLoading(false);
      return alert("Please enter your phone number.");
    }
    
    // Basic validation check to ensure all fields are non-empty
    if (!form.fullName || !form.email || !form.password || !form.usage) {
        setLoading(false);
        return alert("Please fill out all required fields.");
    }


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
      if (!res.ok) {
        setLoading(false);
        return alert(data.message || "Signup failed");
      }

      // Success: show the card
      setLoading(false);
      setShowSuccessCard(true); 
      
    } catch (err) {
      setLoading(false);
      alert("Server error");
    }
  };
  
  // Handler passed to the success card to execute the final action (switch mode)
  const handleRedirect = () => {
      // Clear all fields except email, switch mode, and hide card
      setForm({ 
        fullName: "", 
        email: form.email, // Pre-fill email for signin
        password: "", 
        phone: "", 
        usage: "" 
      });
      setMode("signin");
      setShowSuccessCard(false);
  };


  // Get status display info
  const getPhoneStatusDisplay = () => {
    if (!phoneStatus) return null;

    const statusConfig = {
      verified: {
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50",
        message: "✅ WhatsApp number verified!"
      },
      'not-found': {
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        message: "❌ This number is NOT on WhatsApp. Please verify it's correct."
      },
      unavailable: {
        icon: AlertCircle,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        message: "⚠️ Number verification unavailable. Please ensure it's correct before continuing."
      }
    };

    return statusConfig[phoneStatus];
  };

  const statusDisplay = getPhoneStatusDisplay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center px-6 py-12">
      {/* RENDER SUCCESS CARD AS A MINIMAL TOAST NOTIFICATION */}
      {showSuccessCard && <RedirectSuccessCard onComplete={handleRedirect} />} 
      
      <div className="w-full max-w-6xl bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-200 grid grid-cols-1 md:grid-cols-2">

        {/* LEFT DESIGN PANEL */}
        <div className="hidden md:flex flex-col justify-center p-12 bg-gradient-to-br from-white to-gray-50">
          <h1 className="text-4xl font-extrabold mb-4 tracking-tight text-gray-900">
            WhatsAPI Premium
          </h1>
          <p className="text-gray-600 mb-10 text-lg leading-relaxed">
            A next-gen WhatsApp automation layer crafted with precision and minimalism.
          </p>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="bg-gray-100 p-3 rounded-2xl shadow-sm">
                <ShieldCheck className="text-green-600" size={26} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Enterprise Security</h3>
                <p className="text-gray-500 text-sm">Ultra-safe encrypted API sessions.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-gray-100 p-3 rounded-2xl shadow-sm">
                <Zap className="text-yellow-500" size={26} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Instant Messaging</h3>
                <p className="text-gray-500 text-sm">Blazing-fast delivery via socket engine.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-gray-100 p-3 rounded-2xl shadow-sm">
                <Layers className="text-blue-600" size={26} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Multi-Device Sync</h3>
                <p className="text-gray-500 text-sm">Zero-conflict cross-device support.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-gray-100 p-3 rounded-2xl shadow-sm">
                <Smartphone className="text-purple-600" size={26} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Always Online</h3>
                <p className="text-gray-500 text-sm">24/7 seamless uptime.</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT AUTH PANEL */}
        <div className="bg-white p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </h1>
          <p className="text-gray-500 mb-10">
            {mode === "signin"
              ? "Welcome back. Sign in to continue."
              : "Join our platform and unlock premium features."}
          </p>

          {/* Tabs */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl w-fit mb-10">
            <button
              onClick={() => { setMode("signin"); setShowSuccessCard(false); }} 
              className={`px-5 py-2 rounded-xl text-sm transition-all ${
                mode === "signin" ? "bg-white shadow font-medium" : "text-gray-500"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("signup"); setShowSuccessCard(false); }} 
              className={`px-5 py-2 rounded-xl text-sm transition-all ${
                mode === "signup" ? "bg-white shadow font-medium" : "text-gray-500"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Login Form */}
          {mode === "signin" && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-900">Email</label>
                <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl mt-2">
                  <Mail size={18} className="text-gray-500" />
                  <input
                    name="email"
                    type="email"
                    onChange={handleChange}
                    value={form.email}
                    className="bg-transparent outline-none w-full text-gray-800"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900">Password</label>
                <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl mt-2">
                  <Lock size={18} className="text-gray-500" />
                  <input
                    name="password"
                    type="password"
                    onChange={handleChange}
                    value={form.password}
                    className="bg-transparent outline-none w-full text-gray-800"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-gray-900 text-white py-3 rounded-xl text-lg font-semibold shadow hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
              >
                Continue <ArrowRight size={20} />
              </button>
            </form>
          )}

          
          {/* Signup Form */}
          {mode === "signup" && (
            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-900">Full Name</label>
                <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl mt-2">
                  <User size={18} className="text-gray-500" />
                  <input
                    name="fullName"
                    onChange={handleChange}
                    value={form.fullName}
                    className="bg-transparent outline-none w-full text-gray-800"
                    placeholder="Rohan Jangir"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900">Email</label>
                <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl mt-2">
                  <Mail size={18} className="text-gray-500" />
                  <input
                    name="email"
                    type="email"
                    onChange={handleChange}
                    value={form.email}
                    className="bg-transparent outline-none w-full text-gray-800"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900">Password</label>
                <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl mt-2">
                  <Lock size={18} className="text-gray-500" />
                  <input
                    name="password"
                    type="password"
                    onChange={handleChange}
                    value={form.password}
                    className="bg-transparent outline-none w-full text-gray-800"
                    placeholder="Create a strong password"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900">Usage</label>
                <select
                  name="usage"
                  onChange={handleChange}
                  value={form.usage}
                  className="bg-gray-100 p-3 rounded-xl outline-none w-full text-gray-700 mt-2"
                >
                  <option value="">Select an option</option>
                  <option>Chatbot automation</option>
                  <option>CRM / Client management</option>
                  <option>Marketing broadcasts</option>
                  <option>Customer support</option>
                  <option>Personal automation</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900">Phone Number</label>
                <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl mt-2">
                  <Phone size={18} className="text-gray-500" />
                  <input
                    name="phone"
                    type="tel"
                    onChange={handleChange}
                    onBlur={handlePhoneBlur}
                    value={form.phone}
                    className="bg-transparent outline-none w-full text-gray-800"
                    placeholder="+91 98765 43210"
                  />
                  {checkingPhone && (
                    <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                  )}
                </div>
                
                {/* Status Display */}
                {statusDisplay && (
                  <div className={`flex items-start gap-2 mt-3 p-3 rounded-lg ${statusDisplay.bgColor}`}>
                    <statusDisplay.icon size={18} className={`mt-0.5 flex-shrink-0 ${statusDisplay.color}`} />
                    <span className={`text-sm ${statusDisplay.color}`}>
                      {statusDisplay.message}
                    </span>
                  </div>
                )}
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white py-3 rounded-xl text-lg font-semibold shadow hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Account…" : "Create Account"}
                <ArrowRight size={20} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}