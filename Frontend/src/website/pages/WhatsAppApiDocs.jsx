import React, { useState } from 'react';
import { Copy, Check, Send, MessageSquare, Image, File, List, Zap, Code, Eye, EyeOff } from 'lucide-react';

export default function WhatsAppApiDocs() {
  const [copiedSection, setCopiedSection] = useState(null);
  const [activeTab, setActiveTab] = useState('getting-started');
  const [showApiKey, setShowApiKey] = useState(false);

  const demoApiKey = "wa_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

  const copyToClipboard = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const CodeBlock = ({ code, language = "bash", id }) => (
    <div className="relative group">
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm border border-slate-700">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <button
        onClick={() => copyToClipboard(code, id)}
        className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-md transition-all opacity-0 group-hover:opacity-100"
      >
        {copiedSection === id ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-slate-300" />
        )}
      </button>
    </div>
  );

  const tabs = [
    { id: 'getting-started', label: 'Getting Started', icon: Zap },
    { id: 'text', label: 'Text', icon: MessageSquare },
    { id: 'media', label: 'Media', icon: Image },
    { id: 'interactive', label: 'Interactive', icon: List },
    { id: 'examples', label: 'Code Examples', icon: Code },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/90">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">WhatsApp API</h1>
                <p className="text-sm text-slate-500">Send messages programmatically</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                v1.0
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 sticky top-24 h-fit">
            <nav className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              {/* Getting Started */}
              {activeTab === 'getting-started' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Getting Started</h2>
                    <p className="text-slate-600">Start sending WhatsApp messages in minutes</p>
                  </div>

                  {/* API Key Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-green-600" />
                      Your API Key
                    </h3>
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">API Key</span>
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono text-slate-900">
                          {showApiKey ? demoApiKey : '•'.repeat(64)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(demoApiKey, 'api-key')}
                          className="ml-4 p-2 hover:bg-green-100 rounded-md transition-colors"
                        >
                          {copiedSection === 'api-key' ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mt-3">
                      🔒 Keep your API key secure. Never share it publicly or commit it to version control.
                    </p>
                  </div>

                  {/* Quick Start */}
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">Quick Start</h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 mb-2">Link Your WhatsApp</h4>
                          <p className="text-slate-600 text-sm mb-3">Connect your WhatsApp account by scanning the QR code in your dashboard.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 mb-2">Get Your API Key</h4>
                          <p className="text-slate-600 text-sm mb-3">Your API key is generated automatically after linking WhatsApp.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 mb-2">Send Your First Message</h4>
                          <p className="text-slate-600 text-sm mb-3">Use the API endpoint to send messages.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Base URL */}
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">Base URL</h3>
                    <CodeBlock 
                      code="https://your-domain.com/api/v1/whatsapp"
                      id="base-url"
                    />
                  </div>

                  {/* Authentication */}
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">Authentication</h3>
                    <p className="text-slate-600 mb-4">Include your API key in the request headers:</p>
                    <CodeBlock 
                      code={`curl -X POST https://your-domain.com/api/v1/whatsapp/send \\
  -H "x-api-key: ${demoApiKey}" \\
  -H "Content-Type: application/json"`}
                      id="auth"
                    />
                  </div>
                </div>
              )}

              {/* Text Messages */}
              {activeTab === 'text' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Text Messages</h2>
                    <p className="text-slate-600">Send simple text messages to any WhatsApp number</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Endpoint:</strong> <code className="bg-white px-2 py-1 rounded">POST /api/v1/whatsapp/send</code>
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">Request Body</h3>
                    <CodeBlock 
                      language="json"
                      code={`{
  "to": "918107171472",
  "type": "text",
  "text": "Hello! This is a test message from WhatsApp API 👋"
}`}
                      id="text-json"
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">cURL Example</h3>
                    <CodeBlock 
                      code={`curl -X POST https://your-domain.com/api/v1/whatsapp/send \\
  -H "x-api-key: ${demoApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "918107171472",
    "type": "text",
    "text": "Hello! This is a test message 👋"
  }'`}
                      id="text-curl"
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">Response</h3>
                    <CodeBlock 
                      language="json"
                      code={`{
  "success": true,
  "message": "Message sent successfully ✨",
  "messageId": "3EB0C1A4B2E5F8D9A1B2",
  "usedToday": 1,
  "limit": 1000,
  "remainingToday": 999
}`}
                      id="text-response"
                    />
                  </div>
                </div>
              )}

              {/* Media Messages */}
              {activeTab === 'media' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Media Messages</h2>
                    <p className="text-slate-600">Send images and documents via WhatsApp</p>
                  </div>

                  {/* Image */}
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">Send Image</h3>
                    <CodeBlock 
                      language="json"
                      code={`{
  "to": "918107171472",
  "type": "image",
  "image_url": "https://example.com/image.jpg",
  "text": "Check out this amazing image! 📸"
}`}
                      id="image-json"
                    />
                  </div>

                  {/* Document */}
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">Send Document</h3>
                    <CodeBlock 
                      language="json"
                      code={`{
  "to": "918107171472",
  "type": "document",
  "file_url": "https://example.com/invoice.pdf",
  "text": "Here's your invoice 📄"
}`}
                      id="document-json"
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> Media URLs must be publicly accessible. The file will be downloaded and sent to the recipient.
                    </p>
                  </div>
                </div>
              )}

              {/* Interactive Messages */}
              {activeTab === 'interactive' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Interactive Messages</h2>
                    <p className="text-slate-600">Create engaging experiences with buttons, lists, and polls</p>
                  </div>

                  {/* Buttons */}
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">Template Buttons</h3>
                    <CodeBlock 
                      language="json"
                      code={`{
  "to": "918107171472",
  "type": "template",
  "template": {
    "text": "👋 Welcome! Choose an option:",
    "footer": "Powered by WhatsApp API",
    "buttons": [
      { "id": "track_order", "title": "📦 Track Order" },
      { "id": "view_products", "title": "🛒 Products" },
      { "id": "contact_us", "title": "📞 Contact Us" }
    ]
  }
}`}
                      id="button-json"
                    />
                  </div>

                  {/* List */}
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">List Message</h3>
                    <CodeBlock 
                      language="json"
                      code={`{
  "to": "918107171472",
  "type": "list",
  "list": {
    "message": {
      "text": "Please select a category",
      "footer": "Powered by WhatsApp API",
      "title": "Product Categories",
      "buttonText": "View Options",
      "sections": [
        {
          "title": "Electronics",
          "rows": [
            {
              "title": "Smartphones",
              "rowId": "smartphones",
              "description": "Latest mobile phones"
            },
            {
              "title": "Laptops",
              "rowId": "laptops",
              "description": "High-performance laptops"
            }
          ]
        }
      ]
    }
  }
}`}
                      id="list-json"
                    />
                  </div>

                  {/* Poll */}
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">Poll Message</h3>
                    <CodeBlock 
                      language="json"
                      code={`{
  "to": "918107171472",
  "type": "poll",
  "poll": {
    "question": "What's your favorite feature?",
    "options": ["Fast Delivery", "Great Support", "Low Prices"],
    "selectableCount": 1
  }
}`}
                      id="poll-json"
                    />
                  </div>
                </div>
              )}

              {/* Code Examples */}
              {activeTab === 'examples' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">Code Examples</h2>
                    <p className="text-slate-600">Integration examples in popular languages</p>
                  </div>

                  {/* JavaScript/Node.js */}
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">JavaScript (Node.js)</h3>
                    <CodeBlock 
                      language="javascript"
                      code={`const axios = require('axios');

const API_KEY = '${demoApiKey}';
const BASE_URL = 'https://your-domain.com/api/v1/whatsapp';

async function sendMessage(to, text) {
  try {
    const response = await axios.post(\`\${BASE_URL}/send\`, {
      to: to,
      type: 'text',
      text: text
    }, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Message sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
sendMessage('918107171472', 'Hello from Node.js! 🚀');`}
                      id="js-example"
                    />
                  </div>

                  {/* Python */}
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">Python</h3>
                    <CodeBlock 
                      language="python"
                      code={`import requests

API_KEY = '${demoApiKey}'
BASE_URL = 'https://your-domain.com/api/v1/whatsapp'

def send_message(to, text):
    headers = {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
    }
    
    payload = {
        'to': to,
        'type': 'text',
        'text': text
    }
    
    response = requests.post(
        f'{BASE_URL}/send',
        json=payload,
        headers=headers
    )
    
    if response.status_code == 200:
        print('✅ Message sent:', response.json())
        return response.json()
    else:
        print('❌ Error:', response.json())
        raise Exception(response.json())

# Usage
send_message('918107171472', 'Hello from Python! 🐍')`}
                      id="python-example"
                    />
                  </div>

                  {/* PHP */}
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">PHP</h3>
                    <CodeBlock 
                      language="php"
                      code={`<?php

$apiKey = '${demoApiKey}';
$baseUrl = 'https://your-domain.com/api/v1/whatsapp';

function sendMessage($to, $text) {
    global $apiKey, $baseUrl;
    
    $data = [
        'to' => $to,
        'type' => 'text',
        'text' => $text
    ];
    
    $ch = curl_init("$baseUrl/send");
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'x-api-key: ' . $apiKey,
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode == 200) {
        echo "✅ Message sent: $response\\n";
        return json_decode($response);
    } else {
        echo "❌ Error: $response\\n";
        throw new Exception($response);
    }
}

// Usage
sendMessage('918107171472', 'Hello from PHP! 🐘');`}
                      id="php-example"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Need Help?</h3>
              <p className="text-slate-600 text-sm mb-4">
                Check out our full documentation or contact support for assistance.
              </p>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                  View Full Docs
                </button>
                <button className="px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium border border-slate-200">
                  Contact Support
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}