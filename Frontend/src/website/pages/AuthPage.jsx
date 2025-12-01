import React, { useState } from "react";
import { Mail, Lock, User, ArrowRight, Phone } from "lucide-react";

export default function AuthPage() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    usage: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // -------------------------------
  // 🔥 LOGIN HANDLER
  // -------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();

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

      if (!res.ok) return alert(data.message || "Login failed");

      // Save token + role + user object
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("user", JSON.stringify(data.user)); // IMPORTANT FIX

      // Redirect based on role
      if (data.user.role === "admin") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/user/pricing";
      }
    } catch (err) {
      alert("Server error");
    }
  };

  // -------------------------------
  // 🔥 SIGNUP HANDLER
  // -------------------------------
  const handleSignup = async (e) => {
    e.preventDefault();

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

      if (!res.ok) return alert(data.message || "Signup failed");

      alert("Account created successfully!");
      setMode("signin");
    } catch (err) {
      alert("Server error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-green-100 animate-fadeInUp">

        {/* HEADER */}
        <h1 className="text-3xl font-extrabold text-center bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent mb-1">
          WhatsAPI
        </h1>
        <p className="text-center text-slate-600 mb-8">
          {mode === "signin"
            ? "Welcome back! Login to continue."
            : "Create your WhatsAPI SaaS account"}
        </p>

        {/* TOGGLE BUTTON */}
        <div className="flex justify-center mb-6">
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setMode("signin")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "signin" ? "bg-white shadow" : "text-slate-500"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "signup" ? "bg-white shadow" : "text-slate-500"
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* SIGN IN FORM */}
        {mode === "signin" && (
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="text-sm font-medium">Email</label>
              <div className="flex items-center gap-2 bg-slate-100 p-3 rounded-xl">
                <Mail size={18} className="text-slate-500" />
                <input
                  name="email"
                  onChange={handleChange}
                  type="email"
                  placeholder="you@example.com"
                  className="bg-transparent outline-none w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="flex items-center gap-2 bg-slate-100 p-3 rounded-xl">
                <Lock size={18} className="text-slate-500" />
                <input
                  name="password"
                  onChange={handleChange}
                  type="password"
                  placeholder="••••••••"
                  className="bg-transparent outline-none w-full"
                />
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
              Login <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* SIGN UP FORM */}
        {mode === "signup" && (
          <form className="space-y-5" onSubmit={handleSignup}>
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <div className="flex items-center gap-2 bg-slate-100 p-3 rounded-xl">
                <User size={18} className="text-slate-500" />
                <input
                  name="fullName"
                  onChange={handleChange}
                  type="text"
                  placeholder="Rohan Jangir"
                  className="bg-transparent outline-none w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <div className="flex items-center gap-2 bg-slate-100 p-3 rounded-xl">
                <Mail size={18} className="text-slate-500" />
                <input
                  name="email"
                  onChange={handleChange}
                  type="email"
                  placeholder="you@example.com"
                  className="bg-transparent outline-none w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="flex items-center gap-2 bg-slate-100 p-3 rounded-xl">
                <Lock size={18} className="text-slate-500" />
                <input
                  name="password"
                  onChange={handleChange}
                  type="password"
                  placeholder="Create a strong password"
                  className="bg-transparent outline-none w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">What will you use WhatsAPI for?</label>
              <select
                name="usage"
                onChange={handleChange}
                className="bg-slate-100 p-3 rounded-xl outline-none w-full text-sm"
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
              <label className="text-sm font-medium">Phone Number</label>
              <div className="flex items-center gap-2 bg-slate-100 p-3 rounded-xl">
                <Phone size={18} className="text-slate-500" />
                <input
                  name="phone"
                  onChange={handleChange}
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="bg-transparent outline-none w-full"
                />
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
              Create Account <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
