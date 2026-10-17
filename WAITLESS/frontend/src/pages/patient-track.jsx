import { useCallback, useEffect, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Clock3,
  LoaderCircle,
  MapPin,
  Ticket,
  Users,
} from "lucide-react";

import { usePatientAuth } from "@/auth/PatientAuthProvider";
import { fetchPatientTickets } from "@/services/patientAuthApi";
import { fetchTicketTracking } from "@/services/queueApi";
import { STATUS_META } from "@/services/queueMeta";
import { useApiResource } from "@/hooks/useApiResource";
import { useTranslation } from "@/i18n/useTranslation";

const ACTIVE_STATUSES = ["waiting", "in-service", "recalled", "pre-registered"];

export default function PatientTrackPage() {
  const { isPatientReady, isPatientAuthenticated } = usePatientAuth();
  const { t } = useTranslation();
  const { isLight } = useOutletContext() ?? {};
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedCode = (searchParams.get("ticket") ?? "").trim().toUpperCase();
  const [selectedCode, setSelectedCode] = useState(requestedCode);

  const loadTickets = useCallback(() => fetchPatientTickets(), []);
  const ticketsQuery = useApiResource(loadTickets, {
    enabled: isPatientReady && isPatientAuthenticated,
  });
  const tickets = ticketsQuery.data ?? [];
  const myActive = tickets.filter((t_) => ACTIVE_STATUSES.includes(t_.status));

  // Prefer the code in the URL, else the first active ticket
  const effectiveCode =
    requestedCode || selectedCode || myActive[0]?.ticket || tickets[0]?.ticket || "";

  const loadTracking = useCallback(
    () => fetchTicketTracking(effectiveCode),
    [effectiveCode],
  );
  const trackingQuery = useApiResource(loadTracking, {
    enabled: Boolean(effectiveCode),
  });

  useEffect(() => {
    if (requestedCode) setSelectedCode(requestedCode);
  }, [requestedCode]);

  function pick(code) {
    setSelectedCode(code);
    setSearchParams({ ticket: code });
  }

  const card = isLight
    ? "rounded-2xl border border-slate-200 bg-white/80 p-5"
    : "rounded-2xl border border-border bg-[#0b162a]/90 p-5";
  const heading = isLight ? "text-slate-900" : "text-foreground";
  const sub = isLight ? "text-slate-500" : "text-muted-foreground";
  const accent = isLight ? "text-teal-600" : "text-accent";

  const data = trackingQuery.data;
  const ticket = data?.ticket;
  const queue = data?.queue;

  return (
    <div className={`px-4 py-8 sm:px-6 lg:px-10 ${isLight ? "text-slate-900" : "text-foreground"}`}>
      <div className="mx-auto w-full max-w-5xl">
        <h1 className={`font-display text-2xl font-bold tracking-tight ${heading}`}>
          {t("nav.track")}
        </h1>
        <p className={`mt-1 text-sm ${sub}`}>
          Live position updates for your queue tickets — no code needed.
        </p>

        {/* Ticket picker */}
        {ticketsQuery.isLoading ? (
          <div className={`mt-6 flex items-center gap-2 text-sm ${sub}`}>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading your tickets…
          </div>
        ) : tickets.length === 0 ? (
          <div className={`${card} mt-6 text-center`}>
            <Ticket className={`mx-auto h-10 w-10 ${isLight ? "text-slate-300" : "text-muted-foreground/60"}`} />
            <p className={`mt-3 text-sm ${sub}`}>
              You have no tickets yet. Check in from your dashboard to join a queue.
            </p>
            <Link
              to="/patient/dashboard"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-5 text-sm font-semibold text-white"
            >
              Go to dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {tickets.slice(0, 10).map((tk) => {
              const active = tk.ticket === effectiveCode;
              return (
                <button
                  key={tk.id}
                  type="button"
                  onClick={() => pick(tk.ticket)}
                  className={`flex shrink-0 flex-col rounded-xl border px-4 py-2.5 text-left transition-all ${
                    active
                      ? "border-teal-400/60 bg-teal-500/15 shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)]"
                      : isLight
                        ? "border-slate-200 bg-white/70 hover:border-teal-400/40"
                        : "border-border bg-[#0b162a]/80 hover:border-primary/40"
                  }`}
                >
                  <span className={`font-display text-sm font-bold tracking-wide ${active ? (isLight ? "text-teal-700" : "text-accent") : heading}`}>
                    {tk.ticket}
                  </span>
                  <span className={`text-[11px] ${sub}`}>
                    {tk.department} · {STATUS_META[tk.status]?.label ?? tk.status}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Tracking detail */}
        {effectiveCode ? (
          trackingQuery.isLoading && !data ? (
            <div className={`mt-6 flex items-center gap-2 text-sm ${sub}`}>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Checking live position…
            </div>
          ) : trackingQuery.isError ? (
            <div className={`mt-6 rounded-2xl border px-5 py-6 text-center ${isLight ? "border-red-200 bg-red-50 text-red-600" : "border-red-500/25 bg-red-500/10 text-red-300"}`}>
              {trackingQuery.error.message}
            </div>
          ) : data ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {/* Token + status */}
              <div className={`${card} lg:col-span-1`}>
                <div className={`text-[0.7rem] font-bold uppercase tracking-[0.24em] ${accent}`}>
                  Your token
                </div>
                <div className={`mt-2 font-display text-4xl font-bold tracking-widest ${accent}`}>
                  {ticket.ticket}
                </div>
                <div className={`mt-1 flex items-center gap-1.5 text-sm ${sub}`}>
                  <MapPin className="h-3.5 w-3.5" />
                  {ticket.department}
                </div>
                <span
                  className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    isLight ? "bg-slate-100 text-slate-700" : "bg-white/[0.06] text-foreground/90"
                  }`}
                >
                  {STATUS_META[ticket.status]?.label ?? ticket.status}
                </span>
                {ticket.chiefComplaint ? (
                  <p className={`mt-3 text-xs ${sub}`}>{ticket.chiefComplaint}</p>
                ) : null}
              </div>

              {/* Position */}
              <div className={`${card} lg:col-span-1`}>
                <div className={`text-[0.7rem] font-bold uppercase tracking-[0.24em] ${accent}`}>
                  Queue position
                </div>
                {ticket.status === "waiting" ? (
                  <>
                    <div className={`mt-2 font-display text-4xl font-bold ${heading}`}>
                      {queue.departmentPosition ?? "—"}
                    </div>
                    <div className={`mt-1 flex items-center gap-1.5 text-sm ${sub}`}>
                      <Users className="h-3.5 w-3.5" />
                      {queue.patientsAhead} {queue.patientsAhead === 1 ? "patient" : "patients"} ahead of you
                    </div>
                  </>
                ) : ticket.status === "pre-registered" ? (
                  <p className={`mt-3 text-sm ${sub}`}>
                    Not in the live queue yet — show your token at reception to activate it.
                  </p>
                ) : (
                  <p className={`mt-3 text-sm ${sub}`}>
                    {STATUS_META[ticket.status]?.label ?? ticket.status}
                  </p>
                )}
                <div className={`mt-4 flex items-center gap-1.5 text-xs ${sub}`}>
                  <Clock3 className="h-3.5 w-3.5" />
                  {ticket.status === "waiting"
                    ? `Estimated wait ≈ ${queue.estimatedWaitMinutes} min`
                    : `Waiting in ${ticket.department}: ${queue.totalWaitingInDepartment}`}
                </div>
              </div>

              {/* Now serving */}
              <div className={`${card} lg:col-span-1`}>
                <div className={`text-[0.7rem] font-bold uppercase tracking-[0.24em] ${accent}`}>
                  Now serving · {ticket.department}
                </div>
                <div className="mt-3 space-y-2">
                  {(queue.activeInDepartment ?? []).length === 0 ? (
                    <p className={`text-sm ${sub}`}>No one being served yet.</p>
                  ) : (
                    queue.activeInDepartment.map((entry) => (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 ${isLight ? "border-slate-100 bg-slate-50" : "border-border/60 bg-white/[0.03]"}`}
                      >
                        <span className={`font-display text-sm font-bold tracking-wide ${accent}`}>
                          {entry.ticket}
                        </span>
                        <span className={`text-[11px] uppercase tracking-wider ${sub}`}>
                          {STATUS_META[entry.status]?.label ?? entry.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null
        ) : null}
      </div>
    </div>
  );
}
