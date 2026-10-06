import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  LoaderCircle,
  MessageCircle,
  PhoneCall,
  Printer,
  QrCode,
  ScanLine,
  Search,
  Share2,
  ShieldCheck,
  Ticket,
  TimerReset,
  UserRound,
  X,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

import authBackground from "@/assets/BACKG.png";
import waitlessLogoIcon from "@/assets/waitless-logo-icon.png";
import { DEPARTMENTS } from "@/services/queueMeta";
import { kioskCheckIn, kioskLookup } from "@/services/queueApi";
import { useLiveRefresh } from "@/context/LiveRefreshContext";
import {
  printQueueTicket,
  shareQueueTicket,
} from "@/services/queueTicketHandoff";

const STEPS = {
  WELCOME: "welcome",
  PHONE: "phone",
  SCAN: "scan",
  FOUND: "found",
  DEPARTMENT: "department",
  SUCCESS: "success",
  NOT_FOUND: "not_found",
};

const AUTO_RESET_SECONDS = 45;

const STEP_FLOW = ["Identify", "Department", "Ticket"];

const STEP_INDEX = {
  [STEPS.WELCOME]: 0,
  [STEPS.PHONE]: 0,
  [STEPS.SCAN]: 0,
  [STEPS.FOUND]: 0,
  [STEPS.NOT_FOUND]: 0,
  [STEPS.DEPARTMENT]: 1,
  [STEPS.SUCCESS]: 2,
};

const KIOSK_STYLES = `
  @keyframes kiosk-pop {
    0% { opacity: 0; transform: scale(0.92) translateY(12px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes kiosk-check {
    0% { transform: scale(0) rotate(-18deg); }
    62% { transform: scale(1.14) rotate(4deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
  .kiosk-pop { animation: kiosk-pop 0.55s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .kiosk-check-badge { animation: kiosk-check 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both; }
`;

export default function KioskPage() {
  const navigate = useNavigate();
  const { refreshLiveData } = useLiveRefresh();
  const [step, setStep] = useState(STEPS.WELCOME);
  const [patient, setPatient] = useState(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [department, setDepartment] = useState("OPD");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [notificationConsent, setNotificationConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState(null);
  const [handoffState, setHandoffState] = useState("");
  const [copied, setCopied] = useState(false);
  const [resetCountdown, setResetCountdown] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const stopScanner = useCallback(() => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current
        .stop()
        .then(() => html5QrCodeRef.current.clear())
        .catch(() => {})
        .finally(() => {
          html5QrCodeRef.current = null;
        });
    }
  }, []);

  useEffect(() => {
    return () => stopScanner();
  }, [stopScanner]);

  async function handleLookup(identifier) {
    setLoading(true);
    setError("");
    try {
      const result = await kioskLookup(identifier);
      setPatient(result);
      setStep(STEPS.FOUND);
    } catch (err) {
      if (err.status === 404) {
        setStep(STEPS.NOT_FOUND);
      } else {
        setError(err.message || "Lookup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handlePhoneSubmit(event) {
    event.preventDefault();
    if (!phoneInput.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    handleLookup(phoneInput.trim());
  }

  function startScanner() {
    setStep(STEPS.SCAN);
    setError("");

    setTimeout(() => {
      const containerId = "qr-reader";
      const container = document.getElementById(containerId);
      if (!container) return;

      const html5QrCode = new Html5Qrcode(containerId);
      html5QrCodeRef.current = html5QrCode;

      html5QrCode
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            stopScanner();
            handleLookup(decodedText);
          },
          () => {},
        )
        .catch((err) => {
          setError(
            "Unable to access camera. Please use phone number lookup instead.",
          );
        });
    }, 100);
  }

  function handleProceedToDepartment() {
    setStep(STEPS.DEPARTMENT);
  }

  async function handleCheckIn(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await kioskCheckIn({
        patientId: patient.id,
        dept: department,
        chiefComplaint,
        notificationConsent,
        whatsApp: notificationConsent,
      });
      refreshLiveData();
      setTicket(result);
      setStep(STEPS.SUCCESS);
    } catch (err) {
      setError(err.message || "Check-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePrintTicket() {
    try {
      setHandoffState("Preparing printable ticket...");
      await printQueueTicket(ticket);
      setHandoffState("Print dialog opened.");
    } catch (err) {
      setHandoffState(err.message || "The ticket could not be printed.");
    }
  }

  async function handleShareTicket() {
    try {
      setHandoffState(await shareQueueTicket(ticket));
    } catch (err) {
      setHandoffState(err.message || "The ticket could not be shared.");
    }
  }

  async function handleCopyTicket() {
    if (!ticket?.ticket) return;
    try {
      await navigator.clipboard.writeText(ticket.ticket);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setHandoffState("Could not copy — write the code down.");
    }
  }

  const resetKiosk = useCallback(() => {
    stopScanner();
    setPatient(null);
    setPhoneInput("");
    setDepartment("OPD");
    setChiefComplaint("");
    setNotificationConsent(true);
    setError("");
    setTicket(null);
    setHandoffState("");
    setCopied(false);
    setResetCountdown(null);
    setStep(STEPS.WELCOME);
  }, [stopScanner]);

  useEffect(() => {
    if (step !== STEPS.SUCCESS) return undefined;

    setResetCountdown(AUTO_RESET_SECONDS);
    const timer = setInterval(() => {
      setResetCountdown((current) => (current === null ? null : current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if (resetCountdown === 0) resetKiosk();
  }, [resetCountdown, resetKiosk]);

  return (
    <section className="relative isolate min-h-screen overflow-hidden px-4 py-6 text-white sm:px-6 lg:px-8">
      <style>{KIOSK_STYLES}</style>
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-20 hidden lg:block">
        <img src={authBackground} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#04141f]/82 via-[#062a35]/72 to-[#0a1f2e]/78" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04141f]/60 via-transparent to-[#04141f]/30" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 hidden opacity-[0.05] lg:block [background-image:linear-gradient(rgba(148,163,184,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.4)_1px,transparent_1px)] [background-size:82px_82px]" />
      <div className="absolute inset-0 -z-10 bg-[#04141f] lg:hidden" />

      <div className="relative mx-auto flex w-full max-w-2xl flex-col pb-8">
        {/* Logo header */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <img src={waitlessLogoIcon} alt="WaitLess" className="h-11 w-11 rounded-lg object-contain" />
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-teal-400">Self-service kiosk</div>
            <div className="text-sm font-medium text-white/70">Smarter Queues, Better Care</div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mb-5 flex items-center justify-center gap-2">
          {STEP_FLOW.map((label, index) => {
            const current = STEP_INDEX[step] ?? 0;
            const state =
              index < current ? "done" : index === current ? "active" : "todo";
            return (
              <div key={label} className="flex items-center gap-2">
                {index > 0 ? (
                  <span
                    className={`h-px w-6 sm:w-10 ${state === "done" ? "bg-teal-400/70" : "bg-white/15"}`}
                  />
                ) : null}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] ${
                    state === "done"
                      ? "border-teal-400/30 bg-teal-400/10 text-teal-300"
                      : state === "active"
                        ? "border-teal-300/40 bg-teal-400/15 text-teal-200 shadow-[0_0_18px_-4px_rgba(45,212,191,0.5)]"
                        : "border-white/10 bg-white/[0.03] text-slate-500"
                  }`}
                >
                  {state === "done" ? <Check className="h-3 w-3" /> : null}
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* WELCOME STEP */}
        {step === STEPS.WELCOME && (
          <div className="relative overflow-hidden rounded-2xl bg-[#04141f]/60 shadow-[0_32px_80px_-28px_rgba(2,8,20,0.45)] backdrop-blur-2xl">
            <div className="relative z-10 p-8 text-center sm:p-10">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-teal-500/12 text-teal-300">
                <ScanLine className="h-10 w-10" />
              </div>
              <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Welcome back
              </h1>
              <p className="mt-4 max-w-md mx-auto text-sm leading-6 text-slate-400">
                Already registered with us? Check in faster — scan your QR code
                or enter your phone number to get your queue ticket instantly.
              </p>

              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <button
                  onClick={startScanner}
                  className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-8 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5 sm:w-auto"
                >
                  <QrCode className="h-5 w-5" />
                  Scan QR Code
                </button>
                <button
                  onClick={() => setStep(STEPS.PHONE)}
                  className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-8 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.08] sm:w-auto"
                >
                  <PhoneCall className="h-5 w-5" />
                  Enter Phone Number
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-xs text-slate-500">
                  New patient?{" "}
                  <Link
                    to="/self-register"
                    className="font-semibold text-teal-300 hover:text-teal-200"
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PHONE STEP */}
        {step === STEPS.PHONE && (
          <div className="relative overflow-hidden rounded-2xl bg-[#04141f]/60 shadow-[0_32px_80px_-28px_rgba(2,8,20,0.45)] backdrop-blur-2xl">
            <div className="relative z-10">
              <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(4,20,31,0.82)_0%,rgba(6,42,53,0.72)_48%,rgba(10,31,46,0.78)_100%)] px-6 py-6 sm:px-8">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-500/12 text-teal-300">
                    <PhoneCall className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-teal-300">Phone lookup</div>
                    <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white">
                      Enter your phone number
                    </h1>
                  </div>
                </div>
              </div>

              <form className="space-y-5 px-6 py-7 sm:px-8" onSubmit={handlePhoneSubmit}>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-white">
                    Phone number <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <PhoneCall className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="e.g. 077 123 4567"
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                      autoFocus
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Enter the phone number you used when you first registered.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Looking up...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Find my record
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep(STEPS.WELCOME);
                  }}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.08]"
                >
                  Back
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SCAN STEP */}
        {step === STEPS.SCAN && (
          <div className="relative overflow-hidden rounded-2xl bg-[#04141f]/60 shadow-[0_32px_80px_-28px_rgba(2,8,20,0.45)] backdrop-blur-2xl">
            <div className="relative z-10">
              <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(4,20,31,0.82)_0%,rgba(6,42,53,0.72)_48%,rgba(10,31,46,0.78)_100%)] px-6 py-6 sm:px-8">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-500/12 text-teal-300">
                    <Camera className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-teal-300">QR scanner</div>
                    <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white">
                      Scan your QR code
                    </h1>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Hold your QR code in front of the camera. It will be detected
                  automatically.
                </p>
              </div>

              <div className="px-6 py-7 sm:px-8">
                <div
                  id="qr-reader"
                  ref={scannerRef}
                  className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-white/10"
                />

                {loading && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-teal-300">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Looking up your record...
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    stopScanner();
                    setError("");
                    setStep(STEPS.WELCOME);
                  }}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.08]"
                >
                  <X className="h-4 w-4" />
                  Cancel scan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FOUND STEP */}
        {step === STEPS.FOUND && patient && (
          <div className="relative overflow-hidden rounded-2xl bg-[#04141f]/60 shadow-[0_32px_80px_-28px_rgba(2,8,20,0.45)] backdrop-blur-2xl">
            <div className="relative z-10 p-8 text-center sm:p-10">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500/12 text-emerald-400">
                <UserRound className="h-10 w-10" />
              </div>

              <div className="mt-6 text-[0.7rem] font-bold uppercase tracking-[0.24em] text-teal-300">
                Welcome back
              </div>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white">
                {patient.patientName}
              </h1>

              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2">
                <span className="text-xs font-medium text-slate-400">Patient No.</span>
                <span className="text-sm font-bold text-teal-200">{patient.patientNumber}</span>
              </div>

              {patient.lastVisitAt && (
                <p className="mt-4 text-xs text-slate-500">
                  Last visit: {new Date(patient.lastVisitAt).toLocaleDateString()}
                </p>
              )}

              <button
                onClick={handleProceedToDepartment}
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-8 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5"
              >
                Proceed to check-in
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={resetKiosk}
                className="mt-3 block w-full text-xs text-slate-500 hover:text-slate-300"
              >
                Not you? Start over
              </button>
            </div>
          </div>
        )}

        {/* DEPARTMENT STEP */}
        {step === STEPS.DEPARTMENT && patient && (
          <div className="relative overflow-hidden rounded-2xl bg-[#04141f]/60 shadow-[0_32px_80px_-28px_rgba(2,8,20,0.45)] backdrop-blur-2xl">
            <div className="relative z-10">
              <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(4,20,31,0.82)_0%,rgba(6,42,53,0.72)_48%,rgba(10,31,46,0.78)_100%)] px-6 py-6 sm:px-8">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-500/12 text-teal-300">
                    <Ticket className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-teal-300">Check-in</div>
                    <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white">
                      Select your department
                    </h1>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  Welcome back, {patient.patientName}. Choose where you need to go today.
                </p>
              </div>

              <form className="space-y-5 px-6 py-7 sm:px-8" onSubmit={handleCheckIn}>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-white">
                    Department <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} className="bg-[#04141f] text-white">
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-white">
                    Reason for visit (optional)
                  </label>
                  <textarea
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="Briefly describe your symptoms or reason for visiting"
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
                  />
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
                  <input
                    type="checkbox"
                    id="kioskNotificationConsent"
                    checked={notificationConsent}
                    onChange={(e) => setNotificationConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-white/20 text-teal-500 focus:ring-teal-400/20"
                  />
                  <label htmlFor="kioskNotificationConsent" className="text-sm leading-5 text-slate-200">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <MessageCircle className="h-3.5 w-3.5 text-teal-300" />
                      Send me WhatsApp updates
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Get notified when it's almost your turn.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
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
                  onClick={() => setStep(STEPS.FOUND)}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.08]"
                >
                  Back
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SUCCESS STEP */}
        {step === STEPS.SUCCESS && ticket && (
          <div className="kiosk-pop relative overflow-hidden rounded-2xl bg-[#04141f]/60 shadow-[0_32px_80px_-28px_rgba(2,8,20,0.45)] backdrop-blur-2xl">
            <div className="relative z-10 p-8 text-center sm:p-10">
              <div className="kiosk-check-badge mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500/12 text-emerald-400">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div className="mt-6 text-[0.7rem] font-bold uppercase tracking-[0.24em] text-teal-300">
                You're in the queue
              </div>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Your ticket has been issued
              </h1>

              <button
                type="button"
                onClick={handleCopyTicket}
                title="Copy ticket code"
                className="group mt-6 inline-flex items-center gap-3 rounded-2xl border border-teal-200/12 bg-teal-100/[0.07] px-6 py-4 transition-all hover:border-teal-200/25 hover:bg-teal-100/[0.11]"
              >
                <Ticket className="h-6 w-6 text-teal-300" />
                <span className="font-display text-3xl font-bold tracking-wide text-teal-200">
                  {ticket.ticket}
                </span>
                <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-slate-300 transition-colors group-hover:border-teal-300/30 group-hover:text-teal-200">
                  {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                </span>
              </button>
              <div className="mt-2 h-4 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                {copied ? "Copied to clipboard" : "Tap to copy"}
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-4">
                <div className="text-xs font-medium text-slate-400">Please proceed to</div>
                <div className="mt-1 text-lg font-bold text-white">{ticket.department}</div>
              </div>

              <p className="mt-5 max-w-md mx-auto text-sm leading-6 text-slate-400">
                Save your ticket code. You'll receive WhatsApp updates as your
                position changes. Present this code at the service desk when called.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  to={`/track?ticket=${encodeURIComponent(ticket.ticket)}`}
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5"
                >
                  Track your ticket
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={handlePrintTicket}
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.08]"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={handleShareTicket}
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.08]"
                >
                  <Share2 className="h-4 w-4" />
                  Send to phone
                </button>
                <button
                  onClick={resetKiosk}
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.08]"
                >
                  Check in another patient
                </button>
              </div>

              <div className="mt-4 min-h-5 text-xs font-semibold text-teal-300">
                {handoffState ||
                  (ticket.whatsApp
                    ? "Token synced to WhatsApp and the live display."
                    : "Token synced to the live display.")}
              </div>

              {resetCountdown !== null && (
                <button
                  type="button"
                  onClick={() => setResetCountdown(null)}
                  title="Stay on this screen"
                  className="mx-auto mt-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-500 transition-colors hover:border-teal-300/30 hover:text-teal-300"
                >
                  <TimerReset className="h-3.5 w-3.5" />
                  New patient in {resetCountdown}s — tap to stay
                </button>
              )}
            </div>
          </div>
        )}

        {/* NOT_FOUND STEP */}
        {step === STEPS.NOT_FOUND && (
          <div className="relative overflow-hidden rounded-2xl bg-[#04141f]/60 shadow-[0_32px_80px_-28px_rgba(2,8,20,0.45)] backdrop-blur-2xl">
            <div className="relative z-10 p-8 text-center sm:p-10">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-500/12 text-amber-400">
                <AlertCircle className="h-10 w-10" />
              </div>

              <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-white">
                No record found
              </h1>
              <p className="mt-4 max-w-md mx-auto text-sm leading-6 text-slate-400">
                We couldn't find a patient record with those details.
                You'll need to register first — it only takes a moment.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  to="/self-register"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5"
                >
                  Register now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={resetKiosk}
                  className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.08]"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-400/60" />
          <span>Secure self-service kiosk · Data is encrypted in transit</span>
        </div>
      </div>
    </section>
  );
}
