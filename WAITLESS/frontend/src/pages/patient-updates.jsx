import { useCallback } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  FlaskConical,
  LoaderCircle,
  Pill,
  Ticket,
} from "lucide-react";

import { usePatientAuth } from "@/auth/PatientAuthProvider";
import { fetchPatientProfileCard } from "@/services/patientAuthApi";
import { useApiResource } from "@/hooks/useApiResource";
import { useTranslation } from "@/i18n/useTranslation";

const TYPE_META = {
  "queue-registered": { icon: Ticket, tone: "bg-cyan-500/15 text-cyan-300" },
  "queue-called": { icon: Bell, tone: "bg-amber-500/15 text-amber-300" },
  "queue-missed": { icon: Bell, tone: "bg-red-500/15 text-red-300" },
  "queue-transfer": { icon: Ticket, tone: "bg-indigo-500/15 text-indigo-300" },
  "prescription-ready": { icon: Pill, tone: "bg-emerald-500/15 text-emerald-300" },
  "test-result.ready": { icon: FlaskConical, tone: "bg-purple-500/15 text-purple-300" },
  default: { icon: Bell, tone: "bg-blue-500/15 text-blue-300" },
};

function toneFor(type, isLight) {
  const meta = TYPE_META[type] ?? TYPE_META.default;
  if (isLight) {
    return {
      ...meta,
      tone: meta.tone.replace(/15/g, "10").replace(/-300/g, "-600"),
    };
  }
  return meta;
}

function formatWhen(value) {
  if (!value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  const diffMs = Date.now() - dt.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function PatientUpdatesPage() {
  const { isPatientReady, isPatientAuthenticated } = usePatientAuth();
  const { t } = useTranslation();
  const { isLight } = useOutletContext() ?? {};

  const loadProfile = useCallback(() => fetchPatientProfileCard(), []);
  const profileQuery = useApiResource(loadProfile, {
    enabled: isPatientReady && isPatientAuthenticated,
  });

  const card = isLight
    ? "rounded-2xl border border-slate-200 bg-white/80 p-5"
    : "rounded-2xl border border-border bg-[#0b162a]/90 p-5";
  const heading = isLight ? "text-slate-900" : "text-foreground";
  const sub = isLight ? "text-slate-500" : "text-muted-foreground";

  const notifications = profileQuery.data?.notifications ?? [];
  const appointments = profileQuery.data?.upcomingAppointments ?? [];

  return (
    <div className={`px-4 py-8 sm:px-6 lg:px-10 ${isLight ? "text-slate-900" : "text-foreground"}`}>
      <div className="mx-auto w-full max-w-4xl">
        <h1 className={`font-display text-2xl font-bold tracking-tight ${heading}`}>
          {t("nav.updates")}
        </h1>
        <p className={`mt-1 text-sm ${sub}`}>
          Everything happening with your visits — calls, results, prescriptions and upcoming appointments.
        </p>

        {profileQuery.isLoading ? (
          <div className={`mt-10 flex items-center justify-center gap-2 ${sub}`}>
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Loading your updates…
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {appointments.length ? (
              <div>
                <div className={`text-[0.7rem] font-bold uppercase tracking-[0.24em] ${isLight ? "text-teal-600" : "text-accent"}`}>
                  Upcoming appointments
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {appointments.map((appt) => (
                    <div key={appt.id} className={card}>
                      <div className="flex items-center gap-3">
                        <span className={`grid h-10 w-10 place-items-center rounded-xl ${isLight ? "bg-teal-500/10 text-teal-600" : "bg-accent/15 text-accent"}`}>
                          <CalendarDays className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <div className={`truncate text-sm font-semibold ${heading}`}>
                            {appt.department ?? "Hospital visit"}
                          </div>
                          <div className={`text-xs ${sub}`}>
                            {appt.appointmentDate
                              ? new Date(appt.appointmentDate).toLocaleString(undefined, {
                                  weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                                })
                              : "Date to be confirmed"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <div className={`text-[0.7rem] font-bold uppercase tracking-[0.24em] ${isLight ? "text-teal-600" : "text-accent"}`}>
                Activity
              </div>
              {notifications.length ? (
                <div className="mt-3 space-y-3">
                  {notifications.map((n) => {
                    const meta = toneFor(n.type, isLight);
                    const Icon = meta.icon;
                    return (
                      <div key={n.id} className={`flex items-start gap-4 ${card}`}>
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${meta.tone}`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className={`text-sm font-semibold ${heading}`}>{n.title}</div>
                            <div className={`text-[11px] ${sub}`}>{formatWhen(n.createdAt)}</div>
                          </div>
                          <p className={`mt-1 text-sm leading-6 ${sub}`}>{n.message}</p>
                          {n.ticket ? (
                            <span className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${isLight ? "bg-slate-100 text-slate-600" : "bg-white/[0.06] text-muted-foreground"}`}>
                              <Ticket className="h-3 w-3" />
                              {n.ticket}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`mt-3 ${card} text-center`}>
                  <Bell className={`mx-auto h-8 w-8 ${isLight ? "text-slate-300" : "text-muted-foreground/60"}`} />
                  <p className={`mt-3 text-sm font-semibold ${heading}`}>Nothing new yet</p>
                  <p className={`mt-1 text-sm ${sub}`}>
                    When staff update your tickets, appointments or prescriptions, it will appear here automatically.
                  </p>
                  <Link
                    to="/patient/dashboard"
                    className={`mt-4 inline-flex h-10 items-center rounded-xl px-5 text-sm font-semibold ${
                      isLight
                        ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                        : "border border-border/70 bg-background/60 text-foreground hover:bg-white/[0.08]"
                    }`}
                  >
                    Back to dashboard
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
