import { useCallback } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Activity,
  LoaderCircle,
  MonitorSpeaker,
  Ticket,
  Timer,
  Users,
} from "lucide-react";

import { usePatientAuth } from "@/auth/PatientAuthProvider";
import { fetchPatientTickets } from "@/services/patientAuthApi";
import { fetchQueueBoard } from "@/services/queueApi";
import { DEPARTMENTS } from "@/services/queueMeta";
import { useApiResource } from "@/hooks/useApiResource";
import { useTranslation } from "@/i18n/useTranslation";

export default function PatientQueueBoardPage() {
  const { isPatientReady, isPatientAuthenticated } = usePatientAuth();
  const { t } = useTranslation();
  const { isLight } = useOutletContext() ?? {};

  const loadBoard = useCallback(() => fetchQueueBoard(), []);
  const boardQuery = useApiResource(loadBoard, {
    enabled: isPatientReady && isPatientAuthenticated,
  });

  const loadMine = useCallback(() => fetchPatientTickets(), []);
  const mineQuery = useApiResource(loadMine, {
    enabled: isPatientReady && isPatientAuthenticated,
  });

  const card = isLight
    ? "rounded-2xl border border-slate-200 bg-white/80 p-5"
    : "rounded-2xl border border-border bg-[#0b162a]/90 p-5";
  const heading = isLight ? "text-slate-900" : "text-foreground";
  const sub = isLight ? "text-slate-500" : "text-muted-foreground";
  const accent = isLight ? "text-teal-600" : "text-accent";
  const innerCard = isLight
    ? "rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3"
    : "rounded-xl border border-border/70 bg-[#0e1a33]/80 px-3.5 py-3";

  const board = boardQuery.data;
  const nowServing = board?.nowServing ?? [];
  const waiting = board?.waiting ?? [];
  const departmentETAs = board?.departmentETAs ?? {};
  const myTickets = mineQuery.data ?? [];
  const myActiveCodes = new Set(
    myTickets
      .filter((tk) => ["waiting", "in-service", "called", "recalled"].includes(tk.status))
      .map((tk) => tk.ticket),
  );

  return (
    <div className={`px-4 py-8 sm:px-6 lg:px-10 ${isLight ? "text-slate-900" : "text-foreground"}`}>
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className={`font-display text-2xl font-bold tracking-tight ${heading}`}>
              {t("nav.queueBoard")}
            </h1>
            <p className={`mt-1 text-sm ${sub}`}>
              The same live board shown in the waiting area — right from your account.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              isLight ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
            }`}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live{board?.lastUpdatedAt ? ` · ${new Date(board.lastUpdatedAt).toLocaleTimeString()}` : ""}
          </span>
        </div>

        {boardQuery.isLoading ? (
          <div className={`mt-10 flex items-center justify-center gap-2 ${sub}`}>
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Loading the live board…
          </div>
        ) : boardQuery.isError ? (
          <div className={`mt-6 ${card}`}>
            <p className={sub}>Could not load the queue board right now. Please try again in a moment.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {DEPARTMENTS.map((dept) => {
              const serving = nowServing.filter((tk) => tk.department === dept);
              const queue = waiting.filter((tk) => tk.department === dept);
              const eta = departmentETAs[dept]?.etaMinutes;
              return (
                <div key={dept} className={card}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`grid h-9 w-9 place-items-center rounded-xl ${isLight ? "bg-teal-500/10 text-teal-600" : "bg-accent/15 text-accent"}`}>
                        <MonitorSpeaker className="h-4 w-4" />
                      </span>
                      <h2 className={`text-sm font-bold ${heading}`}>{dept}</h2>
                    </div>
                    {eta != null ? (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${sub}`}>
                        <Timer className="h-3.5 w-3.5" />
                        ~{eta} min wait
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-2.5">
                    <div className={innerCard}>
                      <div className={`text-[0.65rem] font-bold uppercase tracking-[0.18em] ${accent}`}>
                        Now serving
                      </div>
                      {serving.length ? (
                        <div className="mt-1.5 space-y-1">
                          {serving.slice(0, 3).map((tk) => (
                            <div key={tk.id} className="flex items-center justify-between gap-2">
                              <span className={`font-display text-lg font-bold tracking-wider ${heading} ${myActiveCodes.has(tk.ticket) ? "underline decoration-emerald-400 decoration-2 underline-offset-4" : ""}`}>
                                {tk.ticket}
                              </span>
                              <span className={`text-[0.65rem] font-bold uppercase tracking-wider ${tk.status === "called" ? "text-amber-400" : "text-emerald-400"}`}>
                                {tk.status === "called" ? "Called" : "In service"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={`mt-1.5 text-xs ${sub}`}>No one being served right now.</p>
                      )}
                    </div>

                    <div className={`flex items-center justify-between ${innerCard}`}>
                      <span className={`inline-flex items-center gap-1.5 text-xs ${sub}`}>
                        <Users className="h-3.5 w-3.5" />
                        In line
                      </span>
                      <span className={`text-sm font-bold ${heading}`}>{queue.length}</span>
                    </div>

                    {queue.length ? (
                      <div className={`flex items-center justify-between ${innerCard}`}>
                        <span className={`inline-flex items-center gap-1.5 text-xs ${sub}`}>
                          <Ticket className="h-3.5 w-3.5" />
                          Next up
                        </span>
                        <span className={`text-sm font-bold tracking-wider ${myActiveCodes.has(queue[0].ticket) ? "text-emerald-400" : heading}`}>
                          {queue[0].ticket}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={`mt-6 flex items-center gap-3 ${card}`}>
          <Activity className={`h-4 w-4 shrink-0 ${accent}`} />
          <p className={`text-xs leading-5 ${sub}`}>
            Waiting area screens keep working for visitors without accounts — yours updates live here too.{" "}
            <Link to="/patient/track" className={`font-semibold ${accent} hover:underline`}>
              Track your own ticket
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
