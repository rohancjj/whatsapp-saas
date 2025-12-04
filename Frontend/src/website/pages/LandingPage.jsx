import React from "react";

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#fafafa] via-white to-[#f3f3f3] relative overflow-hidden">

      {/* Soft radial glow behind text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-white/40 rounded-full blur-[180px]" />
      </div>

      {/* Center Text */}
      <div className="relative text-center px-6 animate-fadeInUp space-y-8">

        {/* Premium Headline */}
        <h1 className="text-6xl md:text-8xl font-semibold text-slate-900 tracking-tight leading-[1.05]">
          The Future of  
          <span className="block bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900">
            WhatsApp Automation
          </span>
        </h1>

        {/* Ultra Thin Subtitle */}
        <p className="text-lg md:text-2xl font-light text-slate-600 max-w-2xl mx-auto leading-relaxed tracking-wide">
          Crafted with precision. Engineered for scale. A beautifully simple WhatsApp API platform 
          designed to elevate everything you build.
        </p>

      </div>

      {/* Very subtle top + bottom shadows (Apple-style depth) */}
      <div className="absolute top-0 w-full h-40 bg-gradient-to-b from-black/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
    </div>
  );
}
