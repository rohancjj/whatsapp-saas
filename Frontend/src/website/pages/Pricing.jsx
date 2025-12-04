import React, { useEffect, useState } from "react";
import { Check, ArrowRightCircle } from "lucide-react";

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/pricing")
      .then((res) => res.json())
      .then((data) => {
        // Sort plans so free plan appears first dynamically
        const freePlan = data.find((p) => p.price === 0);
        const paidPlans = data.filter((p) => p.price !== 0);

        const finalList = freePlan ? [freePlan, ...paidPlans] : data;

        setPlans(finalList);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Loading Pricing...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-slate-100 py-20 px-6">

      {/* HEADER */}
      <div className="max-w-6xl mx-auto text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Choose Your Plan
        </h1>
        <p className="text-lg text-slate-600 mt-3">
          Unlock WhatsApp automation with transparent, flexible pricing.
        </p>
      </div>

      {/* PRICING GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-10 max-w-6xl mx-auto">
        {plans.map((p) => (
          <PlanCard key={p._id} p={p} />
        ))}
      </div>
    </div>
  );
}

/* PLAN CARD */
const PlanCard = ({ p }) => {
  const isFree = p.price === 0;

  const handleSelect = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please login to continue");

    // FREE PLAN → ACTIVATE DIRECTLY
    if (isFree) {
      try {
        const res = await fetch(`http://localhost:8080/user/select-plan/${p._id}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return alert("Failed to activate free plan");

        alert("Free plan activated!");
        window.location.href = "/user/dashboard";
      } catch (err) {
        console.log(err);
        alert("Error activating free plan");
      }
      return;
    }

    // PAID PLAN → PAYMENT PAGE
    window.location.href = `/user/payment/${p._id}`;
  };

  return (
    <div
      className="
        relative p-7 rounded-3xl shadow-xl border backdrop-blur-xl
        bg-gradient-to-br from-slate-50 to-slate-200
        hover:shadow-2xl hover:-translate-y-2 transition-all
        w-full h-[520px] flex flex-col justify-between border-slate-300"
    >
      {/* FEATURED BADGE */}
      {p.isFeatured && (
        <span className="absolute top-3 right-3 text-xs bg-emerald-600 text-white px-3 py-1 rounded-full shadow">
          Recommended
        </span>
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {p.name}
        </h2>

        {/* PRICE SECTION */}
        <div className="mt-3 flex items-end gap-1">
          {isFree ? (
            <span className="text-4xl font-extrabold text-green-600">Free</span>
          ) : (
            <>
              <span className="text-4xl font-extrabold text-slate-900">₹{p.price}</span>
              <span className="text-slate-500">/month</span>
            </>
          )}
        </div>

        <p className="text-slate-600 text-sm mt-1">{p.messages}</p>

        {/* FEATURES */}
        <div className="mt-5 space-y-3">
          {p.apiAccess && <Feature text={p.apiAccess} />}
          {p.supportLevel && <Feature text={p.supportLevel} />}
          {p.features?.map((f, i) => <Feature key={i} text={f} />)}
        </div>
      </div>

      {/* BUTTON */}
      <button
        onClick={handleSelect}
        className={`
          w-full py-3 rounded-xl font-semibold shadow-lg 
          flex items-center justify-center gap-2 transition-all
          ${isFree ? "bg-green-600 text-white hover:scale-[1.03]" : "bg-slate-900 text-white hover:scale-[1.02]"}
        `}
      >
        {isFree ? "Activate Free Plan" : "Choose Plan"} 
        <ArrowRightCircle size={20} />
      </button>
    </div>
  );
};

/* FEATURE ITEM */
const Feature = ({ text }) => (
  <div className="flex items-center gap-2 text-slate-700">
    <Check className="text-green-600" size={18} />
    <span className="text-sm">{text}</span>
  </div>
);
