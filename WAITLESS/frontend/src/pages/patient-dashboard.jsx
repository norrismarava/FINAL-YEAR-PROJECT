import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  ClipboardList,
  Clock3,
  Download,
  FlaskConical,
  HeartPulse,
  LoaderCircle,
  MessageSquare,
  Pill,
  Printer,
  QrCode,
  Search,
  ShieldCheck,
  Siren,
  Sparkles,
  Star,
  Stethoscope,
  Ticket,
  TrendingUp,
} from "lucide-react";
import QRCode from "qrcode";

import { usePatientAuth } from "@/auth/PatientAuthProvider";
import {
  fetchPatientTickets,
  fetchPatientProfileCard,
} from "@/services/patientAuthApi";
import { useApiResource } from "@/hooks/useApiResource";
import { useTranslation } from "@/i18n/useTranslation";

const STATUS_LABELS = {
  waiting: "status.waiting",
  "in-service": "status.in-service",
  completed: "status.completed",
  missed: "status.missed",
  recalled: "status.recalled",
  transferred: "status.transferred",
};

const PRIORITY_META = {
  red: { labelKey: "priority.red", color: "bg-red-500/15 text-red-400", dot: "bg-red-500" },
  yellow: { labelKey: "priority.yellow", color: "bg-amber-500/15 text-amber-400", dot: "bg-amber-500" },
  green: { labelKey: "priority.green", color: "bg-emerald-500/15 text-emerald-400", dot: "bg-emerald-500" },
  black: { labelKey: "priority.black", color: "bg-slate-500/15 text-slate-400", dot: "bg-slate-500" },
};

const TIMELINE_ICONS = {
  visit: Stethoscope,
  prescription: Pill,
  "test-order": FlaskConical,
};

const TIMELINE_COLORS = {
  visit: "bg-teal-500/15 text-teal-400",
  prescription: "bg-blue-500/15 text-blue-400",
  "test-order": "bg-purple-500/15 text-purple-400",
};

const STATUS_COLORS = {
  waiting: "bg-amber-500/12 text-amber-300",
  "in-service": "bg-blue-500/12 text-blue-300",
  completed: "bg-emerald-500/12 text-emerald-300",
  missed: "bg-red-500/12 text-red-300",
  recalled: "bg-purple-500/12 text-purple-300",
  transferred: "bg-indigo-500/12 text-indigo-300",
};

const PRESCRIPTION_STATE_LABELS = {
  prescribed: "rx.prescribed",
  dispensing: "rx.dispensing",
  ready: "rx.ready",
  collected: "rx.collected",
  cancelled: "rx.cancelled",
};

const PRESCRIPTION_STATE_COLORS = {
  prescribed: "bg-amber-500/15 text-amber-300",
  dispensing: "bg-blue-500/15 text-blue-300",
  ready: "bg-emerald-500/15 text-emerald-300",
  collected: "bg-slate-500/15 text-slate-300",
  cancelled: "bg-red-500/15 text-red-300",
};

const TEST_ORDER_STATE_LABELS = {
  ordered: "test.ordered",
  "sample-collected": "test.sample-collected",
  "in-progress": "test.in-progress",
  completed: "test.completed",
  "result-ready": "test.result-ready",
  cancelled: "test.cancelled",
};

const TEST_ORDER_STATE_COLORS = {
  ordered: "bg-amber-500/15 text-amber-300",
  "sample-collected": "bg-blue-500/15 text-blue-300",
  "in-progress": "bg-purple-500/15 text-purple-300",
  completed: "bg-slate-500/15 text-slate-300",
  "result-ready": "bg-emerald-500/15 text-emerald-300",
  cancelled: "bg-red-500/15 text-red-300",
};

function getGreetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return "dashboard.greetingMorning";
  if (hour < 17) return "dashboard.greetingAfternoon";
  return "dashboard.greetingEvening";
}

export default function PatientDashboardPage() {
  const { patientUser, isPatientAuthenticated, isPatientReady } =
    usePatientAuth();
  const { isLight } = useOutletContext() || { isLight: false };
  const { t } = useTranslation();

  const loadTickets = useCallback(() => fetchPatientTickets(), []);
  const ticketsQuery = useApiResource(loadTickets, {
    enabled: isPatientReady && isPatientAuthenticated,
  });

  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const qrCanvasRef = useRef(null);
  const qrDownloadRef = useRef(null);

  useEffect(() => {
    if (!isPatientReady || !isPatientAuthenticated) return;
    setProfileLoading(true);
    fetchPatientProfileCard()
      .then((data) => setProfileData(data))
      .catch(() => setProfileData(null))
      .finally(() => setProfileLoading(false));
  }, [isPatientReady, isPatientAuthenticated]);

  const patientProfile = profileData?.profile ?? null;
  const stats = profileData?.stats ?? null;
  const prescriptions = profileData?.prescriptions ?? [];
  const testOrders = profileData?.testOrders ?? [];
  const feedbackList = profileData?.feedback ?? [];
  const triageHistory = profileData?.triageHistory ?? [];
  const healthTimeline = profileData?.healthTimeline ?? [];
  const notifications = profileData?.notifications ?? [];
  const upcomingAppointments = profileData?.upcomingAppointments ?? [];
  const departmentBreakdown = profileData?.departmentBreakdown ?? {};
  const priorityBreakdown = profileData?.priorityBreakdown ?? {};

  const maxDeptCount = Math.max(1, ...Object.values(departmentBreakdown));
  const tipOfDay = t(`tip.${(new Date().getDate() % 6) + 1}`);

  useEffect(() => {
    if (patientProfile?.patientNumber && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, patientProfile.patientNumber, {
        width: 200,
        margin: 2,
        color: { dark: "#04141f", light: "#ffffff" },
      });
    }
    if (patientProfile?.patientNumber && qrDownloadRef.current) {
      QRCode.toCanvas(qrDownloadRef.current, patientProfile.patientNumber, {
        width: 300,
        margin: 2,
        color: { dark: "#04141f", light: "#ffffff" },
      });
    }
  }, [patientProfile]);

  function downloadQrCard() {
    if (!qrDownloadRef.current) return;
    const link = document.createElement("a");
    link.download = `waitless-patient-card-${patientProfile?.patientNumber ?? "unknown"}.png`;
    link.href = qrDownloadRef.current.toDataURL("image/png");
    link.click();
  }

  function printQrCard() {
    if (!patientProfile) return;
    const printWindow = window.open("", "waitless-qr-card", "width=480,height=640");
    if (!printWindow) return;
    const qrDataUrl = qrDownloadRef.current?.toDataURL("image/png") ?? "";
    printWindow.document.write(`<!doctype html>
      <html lang="en"><head><meta charset="utf-8" />
      <title>WaitLess Patient Card</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; background: #eef6f7; }
        .card {
          width: 86mm; min-height: 54mm; margin: 20px auto;
          padding: 8mm 6mm; background: #fff; border-top: 5px solid #0f9faf;
          box-shadow: 0 12px 32px rgba(6,42,53,0.14); text-align: center;
        }
        .brand { font-size: 22px; font-weight: 800; color: #078aa0; }
        .tagline { margin-top: 2px; color: #5e7880; font-size: 8px; text-transform: uppercase; letter-spacing: 2px; }
        .rule { margin: 5mm 0; border-top: 1px dashed #b8cdd1; }
        .qr { width: 38mm; height: 38mm; margin: 4mm auto; display: block; }
        .name { font-size: 16px; font-weight: 700; color: #062a35; }
        .meta { margin-top: 3mm; font-size: 10px; color: #55737a; }
        .meta div { padding: 1.5mm 0; }
        .footer { margin-top: 5mm; color: #078aa0; font-size: 10px; font-weight: 700; }
        @media print { @page { size: 86mm 54mm; margin: 0; } body { background: #fff; } .card { width: 86mm; min-height: 0; margin: 0; box-shadow: none; } }
      </style></head><body>
      <main class="card">
        <div class="brand">WaitLess</div>
        <div class="tagline">Smarter queues, better care</div>
        <div class="rule"></div>
        <img class="qr" src="${qrDataUrl}" alt="Patient QR code" />
        <div class="name">${patientProfile.patientName ?? patientUser.fullName ?? "Patient"}</div>
        <div class="meta">
          <div>Patient No: <strong>${patientProfile.patientNumber ?? "N/A"}</strong></div>
          ${patientProfile.phone ? `<div>Phone: ${patientProfile.phone}</div>` : ""}
          ${patientProfile.dob ? `<div>DOB: ${patientProfile.dob}</div>` : ""}
        </div>
        <div class="footer">Present this card at the kiosk for instant check-in</div>
      </main></body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 250);
  }

  if (!isPatientReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <LoaderCircle className="h-8 w-8 animate-spin text-teal-400" />
      </div>
    );
  }

  const tickets = ticketsQuery.data ?? [];
  const activeTickets = tickets.filter(
    (t) => t.status === "waiting" || t.status === "in-service" || t.status === "recalled",
  );
  const pastTickets = tickets.filter(
    (t) => t.status === "completed" || t.status === "missed",
  );

  const cardClass = isLight
    ? "rounded-2xl border border-slate-200 bg-white/80 p-5"
    : "rounded-2xl border border-white/10 bg-white/[0.06] p-5";
  const cardClassP6 = isLight
    ? "rounded-2xl border border-slate-200 bg-white/80 p-6"
    : "rounded-2xl border border-white/15 bg-white/[0.06] p-6";
  const headingText = isLight ? "text-slate-900" : "text-white";
  const subtext = isLight ? "text-slate-500" : "text-slate-300";
  const mutedText = isLight ? "text-slate-400" : "text-slate-400";
  const tealAccent = isLight ? "text-teal-600" : "text-teal-300";
  const tealIconBg = isLight ? "bg-teal-500/10 text-teal-600" : "bg-teal-500/15 text-teal-300";
  const actionCardClass = isLight
    ? "group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 p-5 transition-transform hover:-translate-y-0.5"
    : "group flex items-center gap-4 rounded-2xl border border-white/15 bg-white/[0.06] p-5 transition-transform hover:-translate-y-0.5";
  const actionIconBg = isLight ? "bg-teal-500/10 text-teal-600" : "bg-teal-500/15 text-teal-300";
  const actionText = isLight ? "text-slate-900" : "text-white";
  const actionSub = isLight ? "text-slate-500" : "text-slate-300";
  const actionArrow = isLight ? "text-slate-400" : "text-slate-300";
  const emptyCardClass = isLight
    ? "mt-4 rounded-2xl border border-slate-200 bg-white/60 p-8 text-center"
    : "mt-4 rounded-2xl border border-white/15 bg-white/[0.06] p-8 text-center";
  const emptyText = isLight ? "text-slate-600" : "text-slate-200";
  const emptySub = isLight ? "text-slate-400" : "text-slate-400";
  const emptyIcon = isLight ? "text-slate-300" : "text-slate-600";
  const ticketCardClass = isLight
    ? "rounded-2xl border border-slate-200 bg-white/80 p-5"
    : "rounded-2xl border border-white/20 bg-white/[0.12] p-5";
  const ticketCodeText = isLight ? "text-teal-600" : "text-teal-300";
  const ticketIconBg = isLight ? "bg-teal-500/10 text-teal-600" : "bg-teal-500/20 text-teal-400";
  const tableWrapClass = isLight
    ? "mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white/80"
    : "mt-4 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06]";
  const tableHeadClass = isLight ? "text-slate-600" : "text-slate-300";
  const tableBorderClass = isLight ? "border-slate-100" : "border-white/5";
  const tableBodyText = isLight ? "text-slate-700" : "text-slate-100";
  const itemPillClass = isLight
    ? "rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
    : "rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-200";
  const dateText = isLight ? "text-slate-400" : "text-slate-400";
  const btnSecondary = isLight
    ? "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
    : "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.12]";

  return (
    <div className={`px-4 py-8 sm:px-6 lg:px-10 ${isLight ? "text-slate-900" : "text-white"}`}>
      <div className="relative mx-auto flex w-full max-w-5xl flex-col pb-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className={`font-display text-2xl font-bold tracking-tight ${headingText}`}>
            {t(getGreetingKey())}, {patientUser.fullName?.split(" ")[0] || t("dashboard.patient")}
          </h1>
          <p className={`mt-1 text-sm ${subtext}`}>
            {t("dashboard.subtitle")}
          </p>
        </div>

        {/* Stats grid */}
      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={Ticket} label={t("dashboard.statsTotalVisits")} value={stats.totalVisits} isLight={isLight} />
          <StatCard icon={Activity} label={t("dashboard.statsActiveTickets")} value={stats.activeTickets} accent="amber" isLight={isLight} />
          <StatCard icon={CalendarDays} label={t("dashboard.statsAppointments")} value={stats.upcomingAppointments} accent="blue" isLight={isLight} />
          <StatCard icon={Pill} label={t("dashboard.statsPrescriptions")} value={stats.prescriptionsCount} accent="blue" isLight={isLight} />
          <StatCard icon={FlaskConical} label={t("dashboard.statsTestOrders")} value={stats.testOrdersCount} accent="purple" isLight={isLight} />
          <StatCard icon={Siren} label={t("dashboard.statsTriageEvents")} value={stats.triageEvents} accent="amber" isLight={isLight} />
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link
          to="/self-register"
          className={actionCardClass}
        >
          <span className={`grid h-11 w-11 place-items-center rounded-xl ${actionIconBg}`}>
            <ClipboardList className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className={`font-semibold ${actionText}`}>{t("dashboard.actionBookQueue")}</div>
            <div className={`text-xs ${actionSub}`}>{t("dashboard.actionBookQueueSub")}</div>
          </div>
          <ArrowRight className={`h-4 w-4 ${actionArrow} transition-transform group-hover:translate-x-1`} />
        </Link>

        <Link
          to="/track"
          className={actionCardClass}
        >
          <span className={`grid h-11 w-11 place-items-center rounded-xl ${actionIconBg}`}>
            <Search className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className={`font-semibold ${actionText}`}>{t("dashboard.actionTrackTicket")}</div>
            <div className={`text-xs ${actionSub}`}>{t("dashboard.actionTrackTicketSub")}</div>
          </div>
          <ArrowRight className={`h-4 w-4 ${actionArrow} transition-transform group-hover:translate-x-1`} />
        </Link>

        <Link
          to="/queue"
          className={actionCardClass}
        >
          <span className={`grid h-11 w-11 place-items-center rounded-xl ${actionIconBg}`}>
            <Activity className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className={`font-semibold ${actionText}`}>{t("dashboard.actionQueueBoard")}</div>
            <div className={`text-xs ${actionSub}`}>{t("dashboard.actionQueueBoardSub")}</div>
          </div>
          <ArrowRight className={`h-4 w-4 ${actionArrow} transition-transform group-hover:translate-x-1`} />
        </Link>
      </div>

      {/* QR Patient Card */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className={cardClassP6}>
          <div className={`text-[0.7rem] font-bold uppercase tracking-[0.24em] ${tealAccent}`}>
            {t("dashboard.qrCardEyebrow")}
          </div>
          <h2 className={`mt-2 font-display text-lg font-bold tracking-tight ${headingText}`}>
            {t("dashboard.qrCardTitle")}
          </h2>
          <p className={`mt-1 text-xs ${subtext}`}>
            {t("dashboard.qrCardDesc")}
          </p>

          {profileLoading ? (
            <div className={`mt-6 flex items-center gap-2 text-sm ${isLight ? "text-slate-600" : "text-slate-200"}`}>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              {t("dashboard.qrLoadingCard")}
            </div>
          ) : patientProfile ? (
            <div className="mt-5 flex flex-col items-center">
              <canvas ref={qrCanvasRef} className="rounded-lg bg-white p-2" />
              <div className="mt-3 text-center">
                <div className={`font-display text-lg font-bold ${tealAccent}`}>
                  {patientProfile.patientNumber}
                </div>
                <div className={`text-xs ${isLight ? "text-slate-700" : "text-slate-200"}`}>
                  {patientProfile.patientName ?? patientUser.fullName}
                </div>
              </div>
            </div>
          ) : (
            <div className={`mt-5 rounded-xl border px-4 py-6 text-center ${isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/[0.03]"}`}>
              <QrCode className={`mx-auto h-8 w-8 ${emptyIcon}`} />
              <p className={`mt-2 text-xs ${emptyText}`}>
                {t("dashboard.qrNoProfile")}
              </p>
            </div>
          )}

          <canvas ref={qrDownloadRef} className="hidden" />

          {patientProfile ? (
            <div className="mt-5 flex gap-3">
              <button
                onClick={downloadQrCard}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5"
              >
                <Download className="h-4 w-4" />
                {t("dashboard.download")}
              </button>
              <button
                onClick={printQrCard}
                className={btnSecondary}
              >
                <Printer className="h-4 w-4" />
                {t("dashboard.print")}
              </button>
            </div>
          ) : null}
        </div>

        <div className={cardClassP6}>
          <div className={`text-[0.7rem] font-bold uppercase tracking-[0.24em] ${tealAccent}`}>
            {t("dashboard.howItWorks")}
          </div>
          <h2 className={`mt-2 font-display text-lg font-bold tracking-tight ${headingText}`}>
            {t("dashboard.howItWorksTitle")}
          </h2>
          <div className="mt-4 space-y-4">
            <div className="flex gap-3">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tealIconBg} text-xs font-bold`}>1</span>
              <div>
                <div className={`text-sm font-semibold ${headingText}`}>{t("dashboard.step1Title")}</div>
                <div className={`text-xs ${subtext}`}>{t("dashboard.step1Desc")}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tealIconBg} text-xs font-bold`}>2</span>
              <div>
                <div className={`text-sm font-semibold ${headingText}`}>{t("dashboard.step2Title")}</div>
                <div className={`text-xs ${subtext}`}>{t("dashboard.step2Desc")}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tealIconBg} text-xs font-bold`}>3</span>
              <div>
                <div className={`text-sm font-semibold ${headingText}`}>{t("dashboard.step3Title")}</div>
                <div className={`text-xs ${subtext}`}>{t("dashboard.step3Desc")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <CalendarDays className={`h-5 w-5 ${tealAccent}`} />
            <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
              {t("dashboard.upcomingAppointments")}
            </h2>
          </div>
          <p className={`mt-1 text-sm ${subtext}`}>
            {t("dashboard.upcomingAppointmentsDesc")}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {upcomingAppointments.map((appt) => (
              <div key={appt.id} className={cardClass}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-9 w-9 place-items-center rounded-xl ${tealIconBg}`}>
                      <CalendarDays className="h-4 w-4" />
                    </span>
                    <div>
                      <div className={`font-semibold ${headingText}`}>
                        {new Date(appt.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {appt.timeSlot}
                      </div>
                      <div className={`text-xs ${subtext}`}>{appt.serviceCategory}</div>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${appt.status === "confirmed" ? "bg-blue-500/15 text-blue-400" : "bg-amber-500/15 text-amber-400"}`}>
                    {appt.status}
                  </span>
                </div>
                {appt.notes && (
                  <p className={`mt-2 text-sm ${isLight ? "text-slate-700" : "text-slate-200"}`}>&ldquo;{appt.notes}&rdquo;</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Timeline */}
      {healthTimeline.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <HeartPulse className={`h-5 w-5 ${tealAccent}`} />
            <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
              {t("dashboard.healthTimeline")}
            </h2>
          </div>
          <p className={`mt-1 text-sm ${subtext}`}>
            {t("dashboard.healthTimelineDesc")}
          </p>
          <div className={`mt-4 space-y-3`}>
            {healthTimeline.slice(0, 10).map((entry, idx) => {
              const Icon = TIMELINE_ICONS[entry.type] ?? Activity;
              const colorClass = TIMELINE_COLORS[entry.type] ?? "bg-slate-500/15 text-slate-400";
              return (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    {idx < Math.min(healthTimeline.length, 10) - 1 && (
                      <div className={`mt-1 h-full w-px flex-1 ${isLight ? "bg-slate-200" : "bg-white/10"}`} />
                    )}
                  </div>
                  <div className={`flex-1 ${cardClass}`}>
                    <div className="flex items-center justify-between">
                      <div className={`text-sm font-semibold ${headingText}`}>{entry.title}</div>
                      <span className={`text-xs ${dateText}`}>
                        {new Date(entry.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <div className={`mt-1 text-xs ${subtext}`}>
                      {entry.description}
                      {entry.department && ` · ${entry.department}`}
                    </div>
                    {entry.status && (
                      <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${entry.status === "completed" ? "bg-emerald-500/15 text-emerald-400" : entry.status === "cancelled" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>
                        {t(`status.${entry.status}`) ?? entry.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Triage History */}
      {triageHistory.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <Siren className={`h-5 w-5 ${tealAccent}`} />
            <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
              {t("dashboard.triageHistory")}
            </h2>
          </div>
          <p className={`mt-1 text-sm ${subtext}`}>
            {t("dashboard.triageHistoryDesc")}
          </p>
          <div className="mt-4 space-y-3">
            {triageHistory.map((triage, idx) => {
              const meta = PRIORITY_META[triage.priority] ?? PRIORITY_META.green;
              return (
                <div key={idx} className={cardClass}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`grid h-9 w-9 place-items-center rounded-xl ${meta.color}`}>
                        <Siren className="h-4 w-4" />
                      </span>
                      <div>
                        <div className={`font-semibold ${headingText}`}>{triage.ticketCode}</div>
                        <div className={`text-xs ${subtext}`}>{triage.department}</div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {t(meta.labelKey)}
                    </span>
                  </div>
                  {triage.chiefComplaint && (
                    <p className={`mt-2 text-sm ${isLight ? "text-slate-700" : "text-slate-200"}`}>{triage.chiefComplaint}</p>
                  )}
                  <div className={`mt-2 flex items-center gap-3 text-xs ${dateText}`}>
                    <span className="flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      {new Date(triage.registeredAt).toLocaleDateString()}
                    </span>
                    {triage.triagedAt && (
                      <span>{t("dashboard.triaged")} {new Date(triage.triagedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active tickets */}
      <div className="mt-8">
        <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
          {t("dashboard.activeTickets")}
        </h2>
        <p className={`mt-1 text-sm ${subtext}`}>
          {t("dashboard.activeTicketsDesc")}
        </p>

        {ticketsQuery.loading ? (
          <div className={`mt-4 flex items-center gap-2 text-sm ${isLight ? "text-slate-600" : "text-slate-200"}`}>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {t("dashboard.loadingTickets")}
          </div>
        ) : activeTickets.length === 0 ? (
          <div className={emptyCardClass}>
            <Ticket className={`mx-auto h-10 w-10 ${emptyIcon}`} />
            <p className={`mt-3 text-sm ${emptyText}`}>
              {t("dashboard.noActiveTickets")}
            </p>
            <Link
              to="/self-register"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)]"
            >
              {t("dashboard.actionBookQueue")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {activeTickets.map((ticket) => (
              <div
                key={ticket.id}
                className={ticketCardClass}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${ticketIconBg}`}>
                      <Ticket className="h-5 w-5" />
                    </span>
                    <div>
                      <div className={`font-display text-lg font-bold ${ticketCodeText}`}>
                        {ticket.ticket}
                      </div>
                      <div className={`text-xs ${subtext}`}>
                        {ticket.department}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      STATUS_COLORS[ticket.status] ?? (isLight ? "bg-slate-100 text-slate-600" : "bg-white/10 text-slate-300")
                    }`}
                  >
                    {t(STATUS_LABELS[ticket.status]) ?? ticket.status}
                  </span>
                </div>
                {ticket.chiefComplaint ? (
                  <p className={`mt-3 text-sm ${isLight ? "text-slate-700" : "text-slate-200"}`}>
                    {ticket.chiefComplaint}
                  </p>
                ) : null}
                <Link
                  to={`/track?ticket=${encodeURIComponent(ticket.ticket)}`}
                  className={`mt-3 inline-flex items-center gap-1.5 text-sm font-medium ${tealAccent} hover:opacity-80`}
                >
                  {t("dashboard.trackThisTicket")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visit history */}
      {pastTickets.length > 0 ? (
        <div className="mt-8">
          <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
            {t("dashboard.visitHistoryTitle")}
          </h2>
          <p className={`mt-1 text-sm ${subtext}`}>
            {t("dashboard.visitHistoryDesc")}
          </p>
          <div className={tableWrapClass}>
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b text-left text-xs font-semibold ${isLight ? "border-slate-200" : "border-white/10"} ${tableHeadClass}`}>
                  <th className="px-4 py-3">{t("dashboard.colTicket")}</th>
                  <th className="px-4 py-3">{t("dashboard.colDepartment")}</th>
                  <th className="px-4 py-3">{t("dashboard.colStatus")}</th>
                  <th className="px-4 py-3">{t("dashboard.colDate")}</th>
                </tr>
              </thead>
              <tbody>
                {pastTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={`border-b last:border-0 ${tableBorderClass}`}
                  >
                    <td className={`px-4 py-3 font-semibold ${tealAccent}`}>
                      {ticket.ticket}
                    </td>
                    <td className={`px-4 py-3 ${tableBodyText}`}>
                      {ticket.department}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          STATUS_COLORS[ticket.status] ?? (isLight ? "bg-slate-100 text-slate-600" : "bg-white/10 text-slate-300")
                        }`}
                      >
                        {t(STATUS_LABELS[ticket.status]) ?? ticket.status}
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${subtext}`}>
                      <span className="flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        {new Date(ticket.registeredAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Prescriptions */}
      <div className="mt-8">
        <div className="flex items-center gap-2">
          <Pill className={`h-5 w-5 ${tealAccent}`} />
          <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
            {t("dashboard.prescriptions")}
          </h2>
        </div>
        <p className={`mt-1 text-sm ${subtext}`}>
          {t("dashboard.prescriptionsDesc")}
        </p>
        {prescriptions.length > 0 ? (
          <div className="mt-4 space-y-3">
            {prescriptions.map((p) => (
              <div
                key={p.id}
                className={cardClass}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-9 w-9 place-items-center rounded-xl ${tealIconBg}`}>
                      <Pill className="h-4 w-4" />
                    </span>
                    <div>
                      <div className={`font-semibold ${headingText}`}>{p.ticketCode}</div>
                      <div className={`text-xs ${subtext}`}>{p.department}</div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      (PRESCRIPTION_STATE_COLORS[p.state] ?? (isLight ? "bg-slate-100 text-slate-600" : "bg-white/10 text-slate-200"))
                    }`}
                  >
                    {t(PRESCRIPTION_STATE_LABELS[p.state]) ?? p.state}
                  </span>
                </div>
                {p.items && p.items.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.items.map((item, idx) => (
                      <span
                        key={idx}
                        className={itemPillClass}
                      >
                        {item.drugName} — {item.dosage}
                      </span>
                    ))}
                  </div>
                )}
                <div className={`mt-2 text-xs ${dateText}`}>
                  {new Date(p.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={emptyCardClass}>
            <Pill className={`mx-auto h-10 w-10 ${emptyIcon}`} />
            <p className={`mt-3 text-sm ${emptyText}`}>{t("dashboard.noPrescriptions")}</p>
            <p className={`mt-1 text-xs ${emptySub}`}>{t("dashboard.noPrescriptionsSub")}</p>
          </div>
        )}
      </div>

      {/* Test Orders */}
      <div className="mt-8">
        <div className="flex items-center gap-2">
          <FlaskConical className={`h-5 w-5 ${tealAccent}`} />
          <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
            {t("dashboard.labOrders")}
          </h2>
        </div>
        <p className={`mt-1 text-sm ${subtext}`}>
          {t("dashboard.labOrdersDesc")}
        </p>
        {testOrders.length > 0 ? (
          <div className="mt-4 space-y-3">
            {testOrders.map((o) => (
              <div
                key={o.id}
                className={cardClass}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-9 w-9 place-items-center rounded-xl ${tealIconBg}`}>
                      <FlaskConical className="h-4 w-4" />
                    </span>
                    <div>
                      <div className={`font-semibold ${headingText}`}>{o.testType}</div>
                      <div className={`text-xs ${subtext}`}>{o.ticketCode} — {o.department}</div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      (TEST_ORDER_STATE_COLORS[o.state] ?? (isLight ? "bg-slate-100 text-slate-600" : "bg-white/10 text-slate-200"))
                    }`}
                  >
                    {t(TEST_ORDER_STATE_LABELS[o.state]) ?? o.state}
                  </span>
                </div>
                {o.notes && (
                  <p className={`mt-3 text-sm ${isLight ? "text-slate-700" : "text-slate-200"}`}>{o.notes}</p>
                )}
                <div className={`mt-2 text-xs ${dateText}`}>
                  {new Date(o.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={emptyCardClass}>
            <FlaskConical className={`mx-auto h-10 w-10 ${emptyIcon}`} />
            <p className={`mt-3 text-sm ${emptyText}`}>{t("dashboard.noTestOrders")}</p>
            <p className={`mt-1 text-xs ${emptySub}`}>{t("dashboard.noTestOrdersSub")}</p>
          </div>
        )}
      </div>

      {/* Feedback history */}
      <div className="mt-8">
        <div className="flex items-center gap-2">
          <MessageSquare className={`h-5 w-5 ${tealAccent}`} />
          <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
            {t("dashboard.feedbackTitle")}
          </h2>
        </div>
        <p className={`mt-1 text-sm ${subtext}`}>
          {t("dashboard.feedbackDesc")}
        </p>
        {feedbackList.length > 0 ? (
          <div className="mt-4 space-y-3">
            {feedbackList.map((f) => (
              <div
                key={f.id}
                className={cardClass}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-9 w-9 place-items-center rounded-xl ${tealIconBg}`}>
                      <Star className="h-4 w-4" />
                    </span>
                    <div>
                      <div className={`font-semibold ${headingText}`}>{f.ticketCode}</div>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s <= f.rating ? "fill-amber-400 text-amber-400" : (isLight ? "text-slate-300" : "text-slate-600")
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={`text-xs ${dateText}`}>
                    {new Date(f.submittedAt).toLocaleDateString()}
                  </div>
                </div>
                {f.categories && f.categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {f.categories.map((cat, idx) => (
                      <span
                        key={idx}
                        className={`rounded-full border px-2.5 py-0.5 text-xs ${isLight ? "border-teal-500/20 bg-teal-500/10 text-teal-700" : "border-teal-400/30 bg-teal-400/10 text-teal-200"}`}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                {f.comment && (
                  <p className={`mt-2 text-sm ${isLight ? "text-slate-700" : "text-slate-200"}`}>{f.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={emptyCardClass}>
            <MessageSquare className={`mx-auto h-10 w-10 ${emptyIcon}`} />
            <p className={`mt-3 text-sm ${emptyText}`}>{t("dashboard.noFeedback")}</p>
            <p className={`mt-1 text-xs ${emptySub}`}>{t("dashboard.noFeedbackSub")}</p>
          </div>
        )}
      </div>

      {/* Notification History */}
      {notifications.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <Bell className={`h-5 w-5 ${tealAccent}`} />
            <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
              {t("dashboard.notificationHistory")}
            </h2>
          </div>
          <p className={`mt-1 text-sm ${subtext}`}>
            {t("dashboard.notificationHistoryDesc")}
          </p>
          <div className={tableWrapClass}>
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b text-left text-xs font-semibold ${isLight ? "border-slate-200" : "border-white/10"} ${tableHeadClass}`}>
                  <th className="px-4 py-3">{t("dashboard.colTicket")}</th>
                  <th className="px-4 py-3">{t("dashboard.colType")}</th>
                  <th className="px-4 py-3">{t("dashboard.colChannel")}</th>
                  <th className="px-4 py-3">{t("dashboard.colStatus")}</th>
                  <th className="px-4 py-3">{t("dashboard.colDate")}</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id} className={`border-b last:border-0 ${tableBorderClass}`}>
                    <td className={`px-4 py-3 font-semibold ${tealAccent}`}>{n.ticket}</td>
                    <td className={`px-4 py-3 ${tableBodyText}`}>{n.type}</td>
                    <td className={`px-4 py-3 ${tableBodyText}`}>{n.channel}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${n.status === "delivered" ? "bg-emerald-500/15 text-emerald-400" : n.status === "failed" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>
                        {n.status}
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${subtext}`}>
                      <span className="flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Department & Priority Breakdown */}
      {Object.keys(departmentBreakdown).length > 0 && (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className={cardClassP6}>
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-5 w-5 ${tealAccent}`} />
              <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
                {t("dashboard.visitsByDept")}
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {Object.entries(departmentBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([dept, count]) => (
                  <div key={dept}>
                    <div className="flex items-center justify-between text-sm">
                      <span className={headingText}>{dept}</span>
                      <span className={subtext}>{count}</span>
                    </div>
                    <div className={`mt-1.5 h-2 overflow-hidden rounded-full ${isLight ? "bg-slate-200" : "bg-white/10"}`}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-300 transition-all"
                        style={{ width: `${(count / maxDeptCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className={cardClassP6}>
            <div className="flex items-center gap-2">
              <Siren className={`h-5 w-5 ${tealAccent}`} />
              <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
                {t("dashboard.priorityBreakdown")}
              </h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(priorityBreakdown).map(([priority, count]) => {
                const meta = PRIORITY_META[priority] ?? PRIORITY_META.green;
                return (
                  <div key={priority} className={`rounded-xl border p-4 text-center ${isLight ? "border-slate-200 bg-white/60" : "border-white/10 bg-white/[0.04]"}`}>
                    <div className={`mx-auto h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                    <div className={`mt-2 font-display text-2xl font-bold ${headingText}`}>{count}</div>
                    <div className={`text-xs ${subtext}`}>{t(meta.labelKey)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Health Tip of the Day */}
      <div className={`mt-8 flex items-start gap-4 rounded-2xl border p-5 ${isLight ? "border-teal-500/20 bg-teal-500/[0.04]" : "border-teal-400/20 bg-teal-400/[0.06]"}`}>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tealIconBg}`}>
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <div className={`text-xs font-bold uppercase tracking-[0.18em] ${tealAccent}`}>{t("dashboard.healthTip")}</div>
          <p className={`mt-1.5 text-sm ${isLight ? "text-slate-700" : "text-slate-200"}`}>{tipOfDay}</p>
        </div>
      </div>

      {/* Security footer */}
      <div className={`mt-6 flex items-center justify-center gap-2 text-xs ${subtext}`}>
        <ShieldCheck className={`h-3.5 w-3.5 ${isLight ? "text-teal-600/80" : "text-teal-400/80"}`} />
        <span>{t("dashboard.securityFooter")}</span>
      </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent = "teal", isLight = false }) {
  const accentColors = isLight
    ? {
        teal: "bg-teal-500/10 text-teal-600",
        amber: "bg-amber-500/10 text-amber-600",
        blue: "bg-blue-500/10 text-blue-600",
        purple: "bg-purple-500/10 text-purple-600",
      }
    : {
        teal: "bg-teal-500/15 text-teal-300",
        amber: "bg-amber-500/15 text-amber-300",
        blue: "bg-blue-500/15 text-blue-300",
        purple: "bg-purple-500/15 text-purple-300",
      };
  return (
    <div className={isLight ? "rounded-2xl border border-slate-200 bg-white/80 p-5" : "rounded-2xl border border-white/10 bg-white/[0.06] p-5"}>
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${accentColors[accent]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className={`font-display text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{value}</div>
          <div className={`text-xs ${isLight ? "text-slate-500" : "text-slate-300"}`}>{label}</div>
        </div>
      </div>
    </div>
  );
}
