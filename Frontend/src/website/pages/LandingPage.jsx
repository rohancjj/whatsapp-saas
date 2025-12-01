import React from "react";

import { ArrowRight, QrCode } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white text-slate-900 overflow-hidden">
      

      {/* HERO SECTION */}
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* LEFT TEXT */}
        <div className="space-y-6 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/70 backdrop-blur rounded-full shadow text-xs font-medium text-green-700">
            <span className="w-2 h-2 rounded-full bg-green-600"></span>
            WhatsApp API • Baileys Wrapper
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
            Build WhatsApp-powered Apps
            <span className="block text-green-600">Without Complexity.</span>
          </h1>

          <p className="text-lg text-slate-700 max-w-xl">
            A premium and super‑simple API platform that lets your users log in using WhatsApp QR, generate API keys instantly, and integrate messaging in minutes.
          </p>

          <div className="flex gap-4 items-center pt-4">
            <a
              href="#start"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 text-white shadow-lg hover:bg-green-700 active:scale-[0.97] transition-all"
            >
              Start Free
              <ArrowRight size={18} />
            </a>

            <a
              href="#demo"
              className="px-6 py-3 rounded-xl border border-green-300 text-green-700 bg-white hover:bg-green-50 active:scale-[0.97] transition-all"
            >
              Live Demo
            </a>
          </div>
        </div>

        {/* RIGHT — QR CARD */}
        <div className="flex justify-center lg:justify-end relative animate-fadeInUp delay-150">
          <div className="w-[360px] sm:w-[420px] bg-white rounded-3xl shadow-2xl p-6 border border-green-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">W</div>
                <div>
                  <p className="font-semibold text-sm">WhatsAPI</p>
                  <p className="text-xs text-slate-500">Session · Online</p>
                </div>
              </div>
              <span className="text-xs text-slate-500">Active · 3m</span>
            </div>

            <div className="bg-green-50 rounded-xl p-6 shadow-inner flex flex-col items-center gap-4">
              <div className="bg-white rounded-lg p-4 shadow">
                <QrCode size={90} />
              </div>

              <p className="text-sm text-slate-700 text-center font-medium">Scan QR to authenticate</p>
              <p className="text-xs text-slate-500 text-center">WhatsApp → Linked Devices → Scan</p>
            </div>

            <div className="mt-6 bg-slate-900 text-white rounded-xl p-4 font-mono text-xs">
              <p className="mb-2 opacity-70">Example API Token</p>
              <div className="truncate">sk_live_3e4fA9kLm923jf92h3...</div>
            </div>
          </div>
        </div>
      </section>

      {/* SUBTLE BOTTOM GRADIENT */}
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-green-200/40 to-transparent"></div>
    </div>
  );
}
