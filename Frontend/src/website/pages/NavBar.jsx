import React from "react";
import { Zap, Menu } from "lucide-react";
import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <header className="w-full bg-[#f6fff8]/80 backdrop-blur-xl border-b border-green-200/50 shadow-[0_8px_20px_rgba(0,0,0,0.04)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* BRAND */}
        <Link
          to="/"
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 via-green-500 to-green-700 flex items-center justify-center shadow-[0_10px_25px_rgba(0,128,0,0.25)] group-hover:scale-110 transition-all duration-300">
            <Zap className="text-white drop-shadow" size={26} strokeWidth={2.7} />
          </div>
          <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-green-700 via-green-600 to-green-400 bg-clip-text text-transparent group-hover:opacity-90 transition-all">
            WhatsAPI
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex gap-10 items-center font-medium">
          <a href="#home" className="hover:text-green-700 transition-all hover:tracking-wide text-[15px]">Home</a>
          <a href="#features" className="hover:text-green-700 transition-all hover:tracking-wide text-[15px]">Features</a>
          <a href="#how" className="hover:text-green-700 transition-all hover:tracking-wide text-[15px]">How it Works</a>

          {/* GET STARTED – ROUTING */}
          <Link
            to="/auth"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-white shadow-[0_8px_20px_rgba(0,128,0,0.35)] hover:shadow-[0_10px_30px_rgba(0,128,0,0.55)] hover:scale-[1.05] active:scale-[0.98] transition-all duration-300"
          >
            Get Started
          </Link>
        </nav>

        {/* MOBILE ICON */}
        <button className="md:hidden p-3 rounded-xl bg-white shadow-md border border-green-100 hover:scale-110 transition-all">
          <Menu size={26} className="text-green-700" />
        </button>
      </div>
    </header>
  );
}
