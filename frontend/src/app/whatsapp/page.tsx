"use client";

import { useState } from "react";
import { 
  useWhatsAppStatus, 
  useWhatsAppQR, 
  useStartWhatsAppSession, 
  useStopWhatsAppSession, 
  useSendWhatsAppMessage 
} from "@/lib/queries";
import { 
  MessageSquare, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Play, 
  Square, 
  Send, 
  Smartphone, 
  ShieldCheck, 
  Sparkles,
  Terminal,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WhatsAppPage() {
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [sessionName, setSessionName] = useState("default");
  const [copiedDocker, setCopiedDocker] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useWhatsAppStatus(sessionName);
  const { data: qrData, isLoading: qrLoading } = useWhatsAppQR(sessionName);

  const startSessionMutation = useStartWhatsAppSession();
  const stopSessionMutation = useStopWhatsAppSession();
  const sendMessageMutation = useSendWhatsAppMessage();

  const isWorking = statusData?.status === "WORKING" || statusData?.status === "PAIRED" || statusData?.status === "CONNECTED";
  const needsScan = statusData?.status === "SCAN_QR_CODE" || (!isWorking && qrData?.data_url);
  const isStopped = statusData?.status === "STOPPED" || statusData?.status === "FAILED";
  const isUnconfigured = statusData?.status === "NOT_CONFIGURED";

  const dockerCommand = "docker run -it -p 3000:3000/tcp -e WHATSAPP_DEFAULT_ENGINE=WEBJS devlikeappro/waha";

  const handleCopyDocker = () => {
    navigator.clipboard.writeText(dockerCommand);
    setCopiedDocker(true);
    setTimeout(() => setCopiedDocker(false), 2500);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !message) return;

    try {
      await sendMessageMutation.mutateAsync({
        chatId: recipient,
        text: message,
        session: sessionName,
      });
      setSendSuccess(`Message successfully sent to ${recipient}!`);
      setMessage("");
      setTimeout(() => setSendSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/5">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                WhatsApp API Gateway
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  WAHA Powered
                </span>
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Autonomous WhatsApp integration for Founder directives, automated customer communications, and real-time team alerts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetchStatus()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700/80 text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Status
            </button>
          </div>
        </div>

        {/* Status & Session Control Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Status Card */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Connection State
                </span>
                
                {statusLoading ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Checking...
                  </span>
                ) : isWorking ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Connected & Ready
                  </span>
                ) : needsScan ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <QrCode className="w-3.5 h-3.5" />
                    Scan QR Code to Pair
                  </span>
                ) : isUnconfigured ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                    WAHA Base URL Not Set
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Session Offline ({statusData?.status || "STOPPED"})
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">
                  Session: <span className="font-mono text-emerald-400">{sessionName}</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  WAHA (WhatsApp HTTP API) links your WhatsApp number to Company OS. When messages arrive, 
                  your Personal Assistant interprets mandates and delegates work across finance, engineering, and operations.
                </p>
              </div>

              {statusData?.me && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500">Phone ID: </span>
                    <span className="text-emerald-400 font-semibold">{statusData.me.id || statusData.me.user}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Pushname: </span>
                    <span className="text-slate-200">{statusData.me.pushName || "Active"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Session Action Buttons */}
            <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
              <button
                onClick={() => startSessionMutation.mutate(sessionName)}
                disabled={startSessionMutation.isPending || isWorking}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-all shadow-lg shadow-emerald-900/30 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                {startSessionMutation.isPending ? "Starting..." : "Start Session"}
              </button>

              <button
                onClick={() => stopSessionMutation.mutate(sessionName)}
                disabled={stopSessionMutation.isPending || isStopped}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/50 disabled:opacity-50 text-rose-300 transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                {stopSessionMutation.isPending ? "Stopping..." : "Stop Session"}
              </button>
            </div>
          </div>

          {/* QR Pairing Card */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-emerald-400" />
              WhatsApp Web Pairing
            </h4>

            {isWorking ? (
              <div className="py-8 flex flex-col items-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-white">Device Paired</p>
                <p className="text-xs text-slate-400 max-w-[200px]">
                  Your WhatsApp is linked and receiving webhooks from the team.
                </p>
              </div>
            ) : qrData?.data_url ? (
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-xl shadow-2xl inline-block border-4 border-emerald-500/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrData.data_url}
                    alt="WhatsApp QR Code"
                    className="w-44 h-44 object-contain"
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Open WhatsApp on your phone &gt; Linked Devices &gt; Scan this QR.
                </p>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                  <QrCode className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium text-slate-300">QR Code Inactive</p>
                <p className="text-xs text-slate-500 max-w-[220px]">
                  Click <strong>Start Session</strong> to generate a pairing QR code.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Interactive Send Message & WAHA Quickstart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Dispatch Message Test Form */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5 shadow-xl">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Send WhatsApp Message / Direct Alert
              </h3>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Recipient (Phone number or chat ID)
                </label>
                <input
                  type="text"
                  placeholder="+1234567890 or 1234567890@c.us"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 font-mono transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Message Body
                </label>
                <textarea
                  rows={4}
                  placeholder="Type your message, executive brief, or directive here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-all resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={sendMessageMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-all shadow-lg shadow-emerald-900/30 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {sendMessageMutation.isPending ? "Sending Message..." : "Send Message"}
              </button>

              {sendSuccess && (
                <p className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-center">
                  {sendSuccess}
                </p>
              )}

              {sendMessageMutation.isError && (
                <p className="text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl text-center">
                  {(sendMessageMutation.error as any)?.message || "Failed to send message"}
                </p>
              )}
            </form>
          </div>

          {/* Quickstart / Self-Hosting Guide */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  WAHA Server Quickstart (Docker)
                </h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Run WAHA locally or on Railway / your VPS in one terminal command:
              </p>

              <div className="relative group p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 break-all">
                <code>{dockerCommand}</code>
                <button
                  onClick={handleCopyDocker}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Copy command"
                >
                  {copiedDocker ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="space-y-2 pt-2 text-xs text-slate-400">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 shrink-0 text-[10px]">1</span>
                  <span>Set <code>WAHA_BASE_URL=http://localhost:3000</code> in your <code>.env</code>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 shrink-0 text-[10px]">2</span>
                  <span>Point WAHA Webhook to <code>{`/api/v1/whatsapp/webhook`}</code> for instant task ingestion.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 shrink-0 text-[10px]">3</span>
                  <span>Text your WhatsApp number anytime to assign tasks to your Personal Assistant!</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Agents can also proactively send WhatsApp notifications using the <code>send_whatsapp_message</code> tool.</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
