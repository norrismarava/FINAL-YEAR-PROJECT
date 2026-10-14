import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  House,
  LoaderCircle,
  MessageCircle,
  PhoneCall,
  Printer,
  QrCode,
  Search,
  Share2,
  ShieldCheck,
  Ticket,
  UserRound,
} from "lucide-react";
import QRCode from "qrcode";

import authBackground from "@/assets/BACKG.png";
import waitlessLogoIcon from "@/assets/waitless-logo-icon.png";
import { DEPARTMENTS } from "@/services/queueMeta";
import GlowToggle from "@/components/GlowToggle";
import { selfRegisterPatient, preRegisterPatient } from "@/services/queueApi";
import { useLiveRefresh } from "@/context/LiveRefreshContext";
import {
  printQueueTicket,
  shareQueueTicket,
} from "@/services/queueTicketHandoff";

const INITIAL_FORM = {
  fullName: "",
  phone: "",
  dept: "OPD",
  chiefComplaint: "",
  notificationConsent: true,
  whatsApp: true,
};

const SUCCESS_STYLES = `
  @keyframes self-reg-pop {
    0% { opacity: 0; transform: scale(0.92) translateY(12px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes self-reg-check {
    0% { transform: scale(0) rotate(-18deg); }
    62% { transform: scale(1.14) rotate(4deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
  @keyframes self-reg-enter {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .self-reg-success-card { animation: self-reg-pop 0.55s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .self-reg-check-badge { animation: self-reg-check 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both; }
  .self-reg-enter { animation: self-reg-enter 0.65s cubic-bezier(0.16, 1, 0.3, 1) both; }
`;

export default function SelfRegisterPage() {
  const navigate = useNavigate();
  const { refreshLiveData } = useLiveRefresh();
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [handoffState, setHandoffState] = useState("");
  const [copied, setCopied] = useState(false);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Please enter your phone number for queue notifications.");
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await selfRegisterPatient(form);
      refreshLiveData();
      setSuccess(ticket);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePreRegister(event) {
    event.preventDefault();
    setError("");

    if (!form.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Please enter your phone number for queue notifications.");
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await preRegisterPatient(form);
      refreshLiveData();
      setSuccess(ticket);
    } catch (err) {
      setError(err.message || "Pre-registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const qrCanvasRef = useRef(null);

  async function handleCopyTicket() {
    if (!success?.ticket) return;
    try {
      await navigator.clipboard.writeText(success.ticket);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setHandoffState("Could not copy — write the code down.");
    }
  }

  async function handlePrintTicket() {
    try {
      setHandoffState("Preparing printable ticket...");
      await printQueueTicket(success);
      setHandoffState("Print dialog opened.");
    } catch (err) {
      setHandoffState(err.message || "The ticket could not be printed.");
    }
  }

  async function handleShareTicket() {
    try {
      setHandoffState(await shareQueueTicket(success));
    } catch (err) {
      setHandoffState(err.message || "The ticket could not be shared.");
    }
  }

  useEffect(() => {
    if (success?.patientNumber && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, success.patientNumber, {
        width: 180,
        margin: 2,
        color: { dark: "#04141f", light: "#ffffff" },
      });
    }
  }, [success]);

  if (success) {
    return (
      <section className="relative isolate min-h-screen overflow-hidden px-4 py-6 text-white sm:px-6 lg:px-8">
        <style>{SUCCESS_STYLES}</style>
        {/* Background image */}
        <div className="pointer-events-none absolute inset-0 -z-20 hidden lg:block">
          <img src={authBackground} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#04141f]/82 via-[#062a35]/72 to-[#0a1f2e]/78" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#04141f]/60 via-transparent to-[#04141f]/30" />
        </div>
        <div className="absolute inset-0 -z-10 bg-[#04141f] lg:hidden" />

        <div className="relative mx-auto flex w-full max-w-lg flex-col pb-8">
          {/* ambient glow behind the card */}
          <div className="pointer-events-none absolute -inset-x-10 top-24 -z-10 h-96 rounded-full bg-teal-400/[0.08] blur-[80px]" />

          <div className="self-reg-success-card relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#04141f]/60 shadow-[0_32px_80px_-28px_rgba(2,8,20,0.45)] ring-1 ring-inset ring-teal-400/[0.08] backdrop-blur-2xl">
            <div className="relative z-10 p-6 text-center sm:p-8">
              <img src={waitlessLogoIcon} alt="WaitLess" className="mx-auto h-12 w-12 rounded-xl object-contain drop-shadow-[0_0_14px_rgba(45,212,191,0.4)]" />
              <div className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-teal-300">Patient self-service</div>
              <div className="self-reg-check-badge mx-auto mt-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-500/12 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="mt-6 text-[0.7rem] font-bold uppercase tracking-[0.24em] text-teal-300">
                {success.status === "pre-registered" ? "Pre-registered" : "You're in the queue"}
              </div>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {success.status === "pre-registered" ? "You're pre-registered!" : "Your ticket has been issued"}
              </h1>

              <button
                type="button"
                onClick={handleCopyTicket}
                title="Copy ticket code"
                className="group mt-6 inline-flex items-center gap-3 rounded-2xl border border-teal-200/12 bg-teal-100/[0.07] px-6 py-4 transition-all hover:border-teal-200/25 hover:bg-teal-100/[0.11]"
              >
                <Ticket className="h-6 w-6 text-teal-300" />
                <span className="font-display text-3xl font-bold tracking-wide text-teal-200">
                  {success.ticket}
                </span>
                <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-slate-300 transition-colors group-hover:border-teal-300/30 group-hover:text-teal-200">
                  {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                </span>
              </button>
              <div className="mt-2 h-4 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                {copied ? "Copied to clipboard" : "Tap to copy"}
              </div>

              <p className="mt-5 max-w-md mx-auto text-sm leading-6 text-slate-400">
                {success.status === "pre-registered" ? ("Your ticket is pre-issued. Visit the reception desk to confirm your arrival and enter the live queue. Bring this ticket code.") : ("Save your ticket code. You'll receive WhatsApp updates as your position changes. Present this code at the service desk when called.")}
              </p>

              {success.patientNumber ? (
                <div className="mt-6 rounded-2xl border border-teal-200/12 bg-teal-100/[0.07] px-6 py-5">
                  <div className="flex items-center justify-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-teal-300">
                    <QrCode className="h-3.5 w-3.5" />
                    Save for next visit
                  </div>
                  <div className="mt-3 flex justify-center">
                    <canvas ref={qrCanvasRef} className="rounded-lg bg-white p-2" />
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    Scan this QR code at the kiosk next time for instant check-in.
                  </p>
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to={`/track?ticket=${encodeURIComponent(success.ticket)}`}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5"
                >
                  Track your ticket
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={handlePrintTicket}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.08]"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={handleShareTicket}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.08]"
                >
                  <Share2 className="h-4 w-4" />
                  Send to phone
                </button>
                <button
                  onClick={() => {
                    setSuccess(null);
                    setForm(INITIAL_FORM);
                    setHandoffState("");
                    setCopied(false);
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.08]"
                >
                  Register another patient
                </button>
              </div>

              <div className="mt-4 min-h-5 text-xs font-semibold text-teal-300">
                {handoffState ||
                  (success.whatsApp
                    ? "Your token is synced to WhatsApp and the live display."
                    : "Your token is synced to the live display.")}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-400/60" />
            <span>Secure self-service registration · Data is encrypted in transit</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative isolate min-h-screen overflow-hidden px-4 py-6 text-white sm:px-6 lg:px-8">
      {/* Background image */}
      <div className="pointer-events-none absolute inset-0 -z-20 hidden lg:block">
        <img src={authBackground} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#04141f]/82 via-[#062a35]/72 to-[#0a1f2e]/78" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04141f]/60 via-transparent to-[#04141f]/30" />
      </div>
      <div className="absolute inset-0 -z-10 bg-[#04141f] lg:hidden" />

      <div className="relative mx-auto flex w-full max-w-lg flex-col pb-8">
        {/* ambient glow behind the card */}
        <div className="pointer-events-none absolute -inset-x-10 top-24 -z-10 h-96 rounded-full bg-teal-400/[0.08] blur-[80px]" />

        <div className="self-reg-enter relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#04141f]/60 shadow-[0_32px_80px_-28px_rgba(2,8,20,0.45)] ring-1 ring-inset ring-teal-400/[0.08] backdrop-blur-2xl" style={{ animationDelay: "0.12s" }}>
          <div className="relative z-10">
            {/* Header */}
            <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(4,20,31,0.82)_0%,rgba(6,42,53,0.72)_48%,rgba(10,31,46,0.78)_100%)] px-5 py-4 text-center sm:px-6">
              <img src={waitlessLogoIcon} alt="WaitLess" className="mx-auto h-12 w-12 rounded-xl object-contain drop-shadow-[0_0_14px_rgba(45,212,191,0.4)]" />
              <div className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.22em] text-teal-300">Patient self-service</div>
              <h1 className="mt-1.5 font-display text-xl font-bold tracking-tight text-white">
                Book your spot in the queue
              </h1>
              <p className="mt-2.5 text-[13px] leading-5 text-slate-400">
                Fill in your details to get a ticket number. You'll see your live
                queue position and receive updates on your phone.
              </p>
              <div className="mt-3.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
                <span className="inline-flex items-center gap-1.5"><span className="grid h-4 w-4 place-items-center rounded-full bg-teal-400/15 text-[9px] font-bold text-teal-300">1</span>Your details</span>
                <span className="h-px flex-1 bg-white/10" />
                <span className="inline-flex items-center gap-1.5"><span className="grid h-4 w-4 place-items-center rounded-full bg-teal-400/15 text-[9px] font-bold text-teal-300">2</span>Get ticket</span>
                <span className="h-px flex-1 bg-white/10" />
                <span className="inline-flex items-center gap-1.5"><span className="grid h-4 w-4 place-items-center rounded-full bg-teal-400/15 text-[9px] font-bold text-teal-300">3</span>Get notified</span>
              </div>
            </div>

            {/* Form */}
            <form className="space-y-4 px-5 py-4 sm:px-6" onSubmit={handleSubmit}>
              {error ? (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              ) : null}

              {/* Full name + phone */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-white">
                    Full name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      placeholder="e.g. Tendai Mukamuri"
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-white">
                    Phone number <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <PhoneCall className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="e.g. 077 123 4567"
                      className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                      required
                    />
                  </div>
                </div>
              </div>
              <p className="-mt-1 text-xs text-slate-500">
                Phone number is used for WhatsApp queue notifications.
              </p>

              {/* Department */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-white">
                  Department <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.dept}
                  onChange={(e) => updateField("dept", e.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept} className="bg-[#04141f] text-white">
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chief complaint */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-white">
                  Reason for visit
                </label>
                <textarea
                  value={form.chiefComplaint}
                  onChange={(e) => updateField("chiefComplaint", e.target.value)}
                  placeholder="Briefly describe your symptoms or reason for visiting"
                  rows={2}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                />
              </div>

              {/* Notification consent */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
                <div className="text-sm leading-5 text-slate-200">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <MessageCircle className="h-3.5 w-3.5 text-teal-300" />
                    Send me WhatsApp updates
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Get notified when it's almost your turn.
                  </span>
                </div>
                <GlowToggle
                  id="notificationConsent"
                  label="Send me WhatsApp updates"
                  checked={form.notificationConsent}
                  onChange={(on) => {
                    updateField("notificationConsent", on);
                    updateField("whatsApp", on);
                  }}
                />
              </div>

              {/* Actions */}
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Issuing your ticket...
                    </>
                  ) : (
                    <>
                      Get my ticket
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handlePreRegister}
                  disabled={submitting}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Pre-register
                      <Clock3 className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-slate-500">
                Pre-register online and confirm your arrival at the reception desk to enter the queue.
              </p>

              <div className="flex items-center justify-center gap-4 pt-2 text-xs text-slate-500">
                <Link
                  to="/track"
                  className="inline-flex items-center gap-1.5 font-medium text-teal-300 hover:text-teal-200"
                >
                  <Search className="h-3.5 w-3.5" />
                  Track an existing ticket
                </Link>
                <span className="text-white/20">|</span>
                <Link
                  to="/queue"
                  className="inline-flex items-center gap-1.5 font-medium text-teal-300 hover:text-teal-200"
                >
                  <Clock3 className="h-3.5 w-3.5" />
                  View queue board
                </Link>
                <span className="text-white/20">|</span>
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 font-medium text-teal-300 hover:text-teal-200"
                >
                  <House className="h-3.5 w-3.5" />
                  Home
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Security footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-400/60" />
          <span>Secure self-service registration · Data is encrypted in transit</span>
        </div>
      </div>
    </section>
  );
}
