import React, { useState } from "react";
import {
  Copy,
  Check,
  ChevronRight,
  Code,
  Globe,
  Phone,
  Send,
  Shield,
  Link as LinkIcon,
  FileCode2,
} from "lucide-react";

const codeBlocks = {
  nodeSendText: `import axios from "axios";

const API_BASE_URL = "https://your-domain.com/api";
const API_KEY = "YOUR_API_KEY";

async function sendWhatsAppMessage() {
  try {
    const response = await axios.post(
      \`\${API_BASE_URL}/whatsapp/send-text\`,
      {
        to: "918107171472",
        message: "Hello from the WhatsApp API 🚀",
      },
      {
        headers: {
          "x-api-key": API_KEY,
        },
      }
    );

    console.log("Message sent:", response.data);
  } catch (error) {
    console.error("Error sending message:", error.response?.data || error.message);
  }
}

sendWhatsAppMessage();`,

  nodeSendMedia: `import axios from "axios";
import fs from "fs";

const API_BASE_URL = "https://your-domain.com/api";
const API_KEY = "YOUR_API_KEY";

async function sendWhatsAppMedia() {
  try {
    const response = await axios.post(
      \`\${API_BASE_URL}/whatsapp/send-media\`,
      {
        to: "918107171472",
        caption: "Here is your PDF 📎",
        mediaUrl: "https://your-cdn.com/invoice.pdf",
        mediaType: "document"
      },
      {
        headers: {
          "x-api-key": API_KEY,
        },
      }
    );

    console.log("Media sent:", response.data);
  } catch (error) {
    console.error("Error sending media:", error.response?.data || error.message);
  }
}

sendWhatsAppMedia();`,

  restExample: `POST /api/whatsapp/send-text HTTP/1.1
Host: your-domain.com
x-api-key: YOUR_API_KEY
Content-Type: application/json

{
  "to": "918107171472",
  "message": "Hello from the WhatsApp API 🚀"
}`,
};

function CodeBlock({ label, language = "javascript", code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1300);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/30 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
          <FileCode2 className="w-4 h-4" />
          <span>{label}</span>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-100 hover:bg-white/10 transition"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="relative max-h-[360px] overflow-auto px-4 py-4 text-xs leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function WhatsAppDocsPage() {
  const [activeTab, setActiveTab] = useState("quickstart");
  const [activeCode, setActiveCode] = useState("nodeSendText");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Subtle gradient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-20 pt-10 lg:flex-row">
        {/* LEFT: Intro + Navigation */}
        <aside className="w-full space-y-8 lg:w-80">
          {/* Brand row (no big version header text) */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/30 via-emerald-500/10 to-slate-900 border border-emerald-400/30 shadow-lg shadow-emerald-900/50">
              <Send className="h-5 w-5 text-emerald-200" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-50 tracking-tight">
                WhatsApp Messaging
              </h1>
              <p className="text-xs text-slate-400">
                A minimal, developer-first messaging API.
              </p>
            </div>
          </div>

          {/* Mini highlight card */}
          <div className="space-y-4 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/30 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
            <p className="text-sm text-slate-200">
              Send reliable WhatsApp messages with a single HTTP call. Built for
              modern stacks, optimized for performance and observability.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1 rounded-2xl border border-white/5 bg-white/5 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                  <Shield className="h-3 w-3" />
                  Secure by design
                </div>
                <p className="text-[11px] text-slate-300">
                  HMAC signatures & per-user API keys.
                </p>
              </div>
              <div className="space-y-1 rounded-2xl border border-white/5 bg-white/5 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                  <Globe className="h-3 w-3" />
                  Global-ready
                </div>
                <p className="text-[11px] text-slate-300">
                  Scale from a single message to millions.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent px-3 py-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-semibold text-emerald-200">
                  API
                </span>
                <div>
                  <p className="text-[11px] text-slate-300">
                    Base URL
                  </p>
                  <p className="text-[11px] font-mono text-emerald-200">
                    https://your-domain.com/api
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs / Section Nav */}
          <nav className="space-y-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-[0.22em]">
              Documentation
            </p>
            <div className="flex flex-col gap-1">
              {[
                { id: "quickstart", label: "Quickstart" },
                { id: "auth", label: "Authentication & Security" },
                { id: "text", label: "Send Text Messages" },
                { id: "media", label: "Send Media & Files" },
                { id: "errors", label: "Errors & Troubleshooting" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex items-center justify-between rounded-2xl px-3 py-2 text-sm transition ${
                    activeTab === item.id
                      ? "bg-white/5 text-slate-50 border border-white/10"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <span>{item.label}</span>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      activeTab === item.id ? "translate-x-0" : "translate-x-1"
                    }`}
                  />
                </button>
              ))}
            </div>
          </nav>

          {/* Small footer */}
          <div className="border-t border-white/5 pt-4 text-[11px] text-slate-500">
            <p>Designed for clean integrations & minimal setup.</p>
          </div>
        </aside>

        {/* RIGHT: Content */}
        <main className="flex-1 space-y-6">
          {/* Top strip: SDKs & status */}
          <section className="grid gap-3 rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/40 p-4 backdrop-blur-xl sm:grid-cols-[1.2fr_1fr]">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                START HERE
              </p>
              <h2 className="text-lg font-semibold text-slate-50">
                Integrate WhatsApp into your product in minutes.
              </h2>
              <p className="text-sm text-slate-300">
                Use any HTTP client you already love. cURL, Axios, Fetch —
                everything just works.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
                Status: Operational
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-200 inline-flex items-center gap-1">
                <Code className="h-3 w-3" />
                Node · REST · Frontend
              </span>
            </div>
          </section>

          {/* Active Tab Content */}
          {activeTab === "quickstart" && (
            <section className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-50">
                  1. Get your API key
                </h3>
                <p className="text-sm text-slate-300">
                  After creating your account, generate a per-project API key
                  from your dashboard. Keep this key secret — it grants full
                  access to your WhatsApp messages.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    Example API Key
                  </p>
                  <div className="flex items-center justify-between rounded-2xl bg-black/40 px-3 py-3">
                    <p className="font-mono text-[11px] text-slate-200 truncate">
                      sk_live_whatsapp_4e0f39e2b0f84c4a9dfc7c12
                    </p>
                    <Copy className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Attach it as <span className="font-mono">x-api-key</span>{" "}
                    on every request.
                  </p>
                </div>

                <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    HTTP Headers
                  </p>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="font-mono text-slate-300">
                        x-api-key
                      </span>
                      <span className="text-slate-500">Required</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-mono text-slate-300">
                        Content-Type
                      </span>
                      <span className="text-slate-500">application/json</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-semibold text-slate-50">
                  2. Send your first message
                </h3>
                <p className="text-sm text-slate-300">
                  Use any HTTP client. Here&apos;s an example using Node.js and
                  Axios:
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => setActiveCode("nodeSendText")}
                    className={`rounded-full px-3 py-1.5 ${
                      activeCode === "nodeSendText"
                        ? "bg-emerald-500/15 text-emerald-100 border border-emerald-400/40"
                        : "bg-white/5 text-slate-300 border border-white/10"
                    }`}
                  >
                    Node.js
                  </button>
                  <button
                    onClick={() => setActiveCode("restExample")}
                    className={`rounded-full px-3 py-1.5 ${
                      activeCode === "restExample"
                        ? "bg-emerald-500/15 text-emerald-100 border border-emerald-400/40"
                        : "bg-white/5 text-slate-300 border border-white/10"
                    }`}
                  >
                    Raw REST
                  </button>
                </div>
                <CodeBlock
                  label={
                    activeCode === "nodeSendText"
                      ? "Send a text message"
                      : "Send a text message (REST)"
                  }
                  code={
                    activeCode === "nodeSendText"
                      ? codeBlocks.nodeSendText
                      : codeBlocks.restExample
                  }
                />
              </div>
            </section>
          )}

          {activeTab === "auth" && (
            <section className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-50">
                  Authentication & Security
                </h3>
                <p className="text-sm text-slate-300">
                  Every request must be authenticated using your API key. For
                  extra security, you can also enable HMAC signatures.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    API Key (required)
                  </p>
                  <p className="text-sm text-slate-300">
                    Send your key via the{" "}
                    <span className="font-mono text-emerald-200">x-api-key</span>{" "}
                    header:
                  </p>
                  <pre className="mt-2 rounded-2xl bg-black/50 p-3 text-[11px] text-slate-100">
                    <code>
                      x-api-key: sk_live_whatsapp_4e0f39e2b0f84c4a9dfc7c12
                    </code>
                  </pre>
                </div>
                <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    HMAC Signature (optional)
                  </p>
                  <p className="text-sm text-slate-300">
                    If enabled, you&apos;ll receive a secret used to sign
                    request payloads. Verify the signature on your backend for
                    maximum security.
                  </p>
                  <div className="mt-2 rounded-2xl bg-black/50 p-3 text-[11px] text-slate-100">
                    <p className="font-mono text-slate-300">
                      X-Signature: hex(hmac_sha256(secret, body))
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === "text" && (
            <section className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-50">
                  Sending Text Messages
                </h3>
                <p className="text-sm text-slate-300">
                  Text messages are the simplest way to start. Provide the
                  recipient in international format and a UTF-8 message body.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
                <CodeBlock
                  label="Send a text message (Node.js)"
                  code={codeBlocks.nodeSendText}
                />
                <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    Request Body
                  </p>
                  <pre className="rounded-2xl bg-black/50 p-3 text-[11px] text-slate-100">
                    <code>{`{
  "to": "918107171472",
  "message": "Hello from the WhatsApp API 🚀"
}`}</code>
                  </pre>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    <li>
                      <span className="font-mono text-emerald-200">to</span> –
                      Recipient in E.164 format.
                    </li>
                    <li>
                      <span className="font-mono text-emerald-200">
                        message
                      </span>{" "}
                      – Up to 4096 characters.
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {activeTab === "media" && (
            <section className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-50">
                  Sending Media & Files
                </h3>
                <p className="text-sm text-slate-300">
                  Send images, PDFs, CSVs, and other supported media types by
                  passing a public URL and specifying the{" "}
                  <span className="font-mono text-emerald-200">mediaType</span>.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
                <CodeBlock
                  label="Send a media message (Node.js)"
                  code={codeBlocks.nodeSendMedia}
                />
                <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    Supported media
                  </p>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    <li>Images: JPG, PNG, WebP</li>
                    <li>Documents: PDF, CSV, DOCX</li>
                    <li>Videos (short): MP4</li>
                  </ul>
                  <p className="text-[11px] text-slate-400">
                    Make sure your URL is publicly accessible or signed with a
                    short-lived token from your storage provider.
                  </p>
                </div>
              </div>
            </section>
          )}

          {activeTab === "errors" && (
            <section className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-50">
                  Errors & Troubleshooting
                </h3>
                <p className="text-sm text-slate-300">
                  Every response includes a clear error message and a stable
                  error code you can use for handling and analytics.
                </p>
              </div>

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70">
                <table className="w-full text-left text-[12px] text-slate-300">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-4 py-2 font-medium">Code</th>
                      <th className="px-4 py-2 font-medium">HTTP</th>
                      <th className="px-4 py-2 font-medium">Message</th>
                      <th className="px-4 py-2 font-medium">What it means</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="px-4 py-2 font-mono text-emerald-200">
                        INVALID_API_KEY
                      </td>
                      <td className="px-4 py-2">401</td>
                      <td className="px-4 py-2">Invalid or missing API key.</td>
                      <td className="px-4 py-2">
                        Check your <span className="font-mono">x-api-key</span>{" "}
                        header.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-emerald-200">
                        INVALID_MEDIA_TYPE
                      </td>
                      <td className="px-4 py-2">400</td>
                      <td className="px-4 py-2">Unsupported mediaType.</td>
                      <td className="px-4 py-2">
                        Use <span className="font-mono">image</span>,{" "}
                        <span className="font-mono">video</span>, or{" "}
                        <span className="font-mono">document</span>.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-emerald-200">
                        RATE_LIMITED
                      </td>
                      <td className="px-4 py-2">429</td>
                      <td className="px-4 py-2">Too many requests.</td>
                      <td className="px-4 py-2">
                        Back off and retry with exponential delay.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-emerald-200">
                        PROVIDER_ERROR
                      </td>
                      <td className="px-4 py-2">502</td>
                      <td className="px-4 py-2">
                        Upstream WhatsApp provider error.
                      </td>
                      <td className="px-4 py-2">
                        Usually transient. Safe to retry.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-100 flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5" />
                <p>
                  While testing, make sure the{" "}
                  <span className="font-mono text-amber-100">to</span> number is
                  registered on WhatsApp and formatted in E.164 (e.g.{" "}
                  <span className="font-mono text-amber-100">
                    918107171472
                  </span>
                  ).
                </p>
              </div>
            </section>
          )}

          {/* Bottom CTA */}
          <section className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/40 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <LinkIcon className="h-4 w-4" />
              <span>
                Want to embed this in your docs or dashboard UI? Just reuse
                these components inside your React app.
              </span>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
