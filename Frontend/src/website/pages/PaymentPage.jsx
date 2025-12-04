import React, { useEffect, useState } from "react";
import { CreditCard, QrCode } from "lucide-react";
import { useParams } from "react-router-dom";

export default function PaymentPage() {
  const { planId } = useParams();

  const [method, setMethod] = useState(null);
  const [settings, setSettings] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const [screenshot, setScreenshot] = useState(null);
  const token = localStorage.getItem("token");

  /* ---------------------------------------
     LOAD PAYMENT SETTINGS (PUBLIC SAFE API)
  -------------------------------------- */
  useEffect(() => {
    fetch("http://localhost:8080/api/v1/payment-settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(() => {})
  }, []);

  /* ---------------------------------------
     LOAD PLAN DETAILS (NEEDED FOR AMOUNT)
  -------------------------------------- */
  useEffect(() => {
    fetch(`http://localhost:8080/pricing/${planId}`)


      .then((res) => res.json())
      .then((data) => {
        setPlan(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [planId]);

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (file) setScreenshot(file);
  };

  /* ---------------------------------------
     SUBMIT MANUAL PAYMENT
  -------------------------------------- */
  const handleSubmitManualPayment = async () => {
  if (!screenshot) return alert("Please upload payment screenshot!");
  if (!plan) return alert("Plan not loaded");

  const formData = new FormData();
  formData.append("planId", planId);   // 🔥 REQUIRED
  formData.append("amount", plan.price);
  formData.append("currency", "INR");
  formData.append("note", `Payment for ${plan.name}`);
  formData.append("screenshot", screenshot);

  const res = await fetch(`http://localhost:8080/api/v1/payments/manual?planId=${planId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`, // DO NOT add content-type
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) return alert(data.message || "Payment submission failed!");

  alert("Payment submitted successfully! Admin will verify.");
  window.location.href = "/user/dashboard";
};


  if (loading || !settings)
    return (
      <div className="p-10 text-center text-slate-600">
        Loading payment options...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-100 p-10">
      <div className="max-w-3xl mx-auto bg-white p-10 rounded-3xl shadow-xl">
        <h1 className="text-3xl font-bold text-center text-slate-900 mb-10">
          Complete Your Payment
        </h1>

        {/* SELECT PAYMENT METHOD */}
        <div className="flex justify-center gap-5 mb-10">
          <button
            onClick={() => setMethod("manual")}
            className={`px-6 py-3 rounded-xl shadow font-semibold ${
              method === "manual"
                ? "bg-slate-900 text-white"
                : "bg-slate-200"
            }`}
          >
            Manual Payment
          </button>

          <button
            disabled
            className="px-6 py-3 rounded-xl shadow bg-slate-300 text-slate-500 cursor-not-allowed"
          >
            Razorpay (Coming Soon)
          </button>
        </div>

        {!method && (
          <p className="text-center text-slate-500">
            Select a payment method to continue.
          </p>
        )}

        {/* MANUAL PAYMENT SECTION */}
        {method === "manual" && (
          <div className="space-y-8 animate-fadeIn">
            {/* UPI SECTION */}
            <section>
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                <QrCode size={22} className="text-blue-600" />
                UPI Payment
              </h2>

              <p className="mt-2 text-slate-700">
                UPI ID: <b>{settings?.upiId}</b>
              </p>

              {settings?.qrCodeUrl && (
                <img
                  src={`http://localhost:8080${settings.qrCodeUrl}`}
                  className="w-48 h-48 mt-4 border rounded-xl shadow"
                  alt="QR Code"
                />
              )}
            </section>

            {/* BANK TRANSFER */}
            <section>
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                <CreditCard size={22} className="text-green-600" />
                Bank Transfer
              </h2>

              <div className="mt-3 text-slate-700 space-y-1">
                <p>Bank: <b>{settings?.bank?.name}</b></p>
                <p>Account No: <b>{settings?.bank?.accountNumber}</b></p>
                <p>IFSC: <b>{settings?.bank?.ifsc}</b></p>
                <p>Holder Name: <b>{settings?.bank?.holderName}</b></p>
              </div>
            </section>

            {/* SCREENSHOT UPLOAD */}
            <section>
              <label className="font-semibold text-slate-800">
                Upload Payment Screenshot
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleScreenshotUpload}
                className="mt-2"
              />

              {screenshot && (
                <img
                  src={URL.createObjectURL(screenshot)}
                  className="w-40 h-40 mt-4 border rounded-xl shadow"
                  alt="Preview"
                />
              )}
            </section>

            <button
              onClick={handleSubmitManualPayment}
              className="w-full bg-slate-900 py-4 text-white rounded-xl text-lg shadow-lg hover:bg-slate-700 transition"
            >
              Submit Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
