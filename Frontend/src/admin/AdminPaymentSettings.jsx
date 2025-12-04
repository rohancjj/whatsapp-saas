import React, { useEffect, useState } from "react";
import { Upload, CreditCard, Building, Save, Image, Loader2 } from "lucide-react";

export default function AdminPaymentSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [upiId, setUpiId] = useState("");
  const [qrPreview, setQrPreview] = useState(null);
  const [qrFile, setQrFile] = useState(null);

  const [bank, setBank] = useState({
    name: "",
    accountNumber: "",
    ifsc: "",
    holderName: "",
  });

  const token = localStorage.getItem("token");

  /* -----------------------------------------
      LOAD EXISTING SETTINGS
  ------------------------------------------ */
  useEffect(() => {
    fetch("http://localhost:8080/api/v1/admin/payment-settings", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.upiId) setUpiId(data.upiId);
        if (data.bank) setBank(data.bank);
        if (data.qrCodeUrl) setQrPreview(`http://localhost:8080${data.qrCodeUrl}`);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* -----------------------------------------
      HANDLE QR FILE UPLOAD
  ------------------------------------------ */
  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setQrFile(file);
    setQrPreview(URL.createObjectURL(file));
  };

  /* -----------------------------------------
      SAVE SETTINGS
  ------------------------------------------ */
  const handleSave = async () => {
    setSaving(true);

    const formData = new FormData();
    formData.append("upiId", upiId);
    formData.append("bankName", bank.name);
    formData.append("accountNumber", bank.accountNumber);
    formData.append("ifsc", bank.ifsc);
    formData.append("holderName", bank.holderName);

    if (qrFile) formData.append("qr", qrFile);

    try {
      const res = await fetch("http://localhost:8080/api/v1/admin/payment-settings", {
        method: "PUT",
        headers: {
  Authorization: `Bearer ${token}`,
},
body: formData,

      });

      if (!res.ok) throw new Error("Failed to update settings");

      alert("Payment settings updated successfully!");

    } catch (err) {
      console.error(err);
      alert("Error saving settings");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex justify-center items-center text-slate-500">
        <Loader2 className="animate-spin mr-2" /> Loading...
      </div>
    );
  }

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-10 animate-fadeIn">

      <h1 className="text-3xl font-bold text-slate-800">Payment Settings</h1>
      <p className="text-slate-500 mb-4">
        Configure how users will make manual payments — UPI, QR, and Bank Transfer.
      </p>

      {/* CARD WRAPPER */}
      <div className="bg-white shadow-xl border border-slate-200 rounded-3xl p-8 space-y-10">

        {/* UPI SECTION */}
        <section>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <CreditCard className="text-violet-600" /> UPI Details
          </h2>

          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">UPI ID</label>
            <input
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="example@upi"
              className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-violet-500 outline-none"
            />
          </div>
        </section>

        {/* QR UPLOAD */}
        <section>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Image className="text-blue-600" /> QR Code
          </h2>

          <div className="mt-4 flex items-center gap-6">
            {/* Preview */}
            <div className="w-40 h-40 border rounded-xl overflow-hidden flex items-center justify-center bg-slate-50">
              {qrPreview ? (
                <img src={qrPreview} alt="QR Code" className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-400 text-sm">No QR Uploaded</span>
              )}
            </div>

            {/* Upload Button */}
            <label className="cursor-pointer">
              <div
                className="
                px-5 py-3 bg-slate-900 text-white rounded-xl shadow flex items-center gap-2
                hover:bg-slate-800 transition-all"
              >
                <Upload size={18} />
                Upload QR Code
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleQrUpload} />
            </label>
          </div>
        </section>

        {/* BANK DETAILS */}
        <section>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Building className="text-emerald-600" /> Bank Transfer
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <Field label="Bank Name" value={bank.name} onChange={(e) => setBank({ ...bank, name: e.target.value })} />
            <Field label="Account Number" value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })} />
            <Field label="IFSC Code" value={bank.ifsc} onChange={(e) => setBank({ ...bank, ifsc: e.target.value })} />
            <Field label="Account Holder Name" value={bank.holderName} onChange={(e) => setBank({ ...bank, holderName: e.target.value })} />
          </div>
        </section>

        {/* SAVE BUTTON */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="
            w-full bg-violet-600 text-white py-4 rounded-xl text-lg font-semibold shadow-lg
            hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
          Save Settings
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------
   REUSABLE FIELD COMPONENT
-------------------------------------- */
const Field = ({ label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input
      value={value}
      onChange={onChange}
      className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-violet-500 outline-none"
    />
  </div>
);
