import React from "react";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <header className="w-full bg-white/90 backdrop-blur-lg border-b border-black/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        {/* LEFT NAV */}
        <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-black/70">
          <Link to="/" className="hover:text-black transition">Home</Link>
          <Link to="/docs" className="hover:text-black transition">Docs</Link>
          <Link to="/api" className="hover:text-black transition">API</Link>
          <Link to="/features" className="hover:text-black transition">Features</Link>
          <Link to="/how-it-works" className="hover:text-black transition">How it Works</Link>
        </nav>

        {/* CENTER LOGO */}
        <Link
          to="/"
          className="absolute left-1/2 -translate-x-1/2 select-none"
        >
          <span className="text-3xl font-extrabold tracking-tight text-black">
            current
          </span>
        </Link>

        {/* RIGHT NAV */}
        <div className="hidden md:flex items-center gap-8 text-[14px] font-medium text-black/70">
          <Link to="/about" className="hover:text-black transition">About</Link>
          <Link to="/help" className="hover:text-black transition">Help</Link>

          <Link
            to="/auth"
            className="px-5 py-2 rounded-full bg-black text-white font-medium hover:bg-black/90 transition"
          >
            Get started
          </Link>
        </div>

        {/* MOBILE MENU ICON */}
        <button className="md:hidden p-2 rounded-lg border border-black/10">
          <Menu size={24} className="text-black" />
        </button>

      </div>
    </header>
  );
}
