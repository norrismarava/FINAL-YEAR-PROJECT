import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Clock3,
  LoaderCircle,
  Mail,
  PhoneCall,
  Search,
  Ticket,
  UserRound,
} from "lucide-react";

import { usePatientAuth } from "@/auth/PatientAuthProvider";
import { fetchPatientTickets } from "@/services/patientAuthApi";
import { useApiResource } from "@/hooks/useApiResource";

const STATUS_LABELS = {
  waiting: "Waiting",
  "in-service": "In service",
  completed: "Completed",
  missed: "Missed",
  recalled: "Recalled",
  transferred: "Transferred",
};

const STATUS_COLORS = {
  waiting: "bg-amber-500/12 text-amber-700",
  "in-service": "bg-blue-500/12 text-blue-700",
  completed: "bg-emerald-500/12 text-emerald-700",
  missed: "bg-red-500/12 text-red-700",
  recalled: "bg-purple-500/12 text-purple-700",
  transferred: "bg-indigo-500/12 text-indigo-700",
};

export default function PatientDashboardPage() {
  const { patientUser, isPatientAuthenticated, isPatientReady, patientLogout } =
    usePatientAuth();

  const loadTickets = useCallback(() => fetchPatientTickets(), []);
  const ticketsQuery = useApiResource(loadTickets, {
    enabled: isPatientReady && isPatientAuthenticated,
  });

  if (!isPatientReady) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex min-h-[40vh] items-center justify-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (!isPatientAuthenticated) {
    return <Navigate to="/patient/login" replace />;
  }

  const tickets = ticketsQuery.data ?? [];
  const activeTickets = tickets.filter(
    (t) => t.status === "waiting" || t.status === "in-service" || t.status === "recalled",
  );
  const pastTickets = tickets.filter(
    (t) => t.status === "completed" || t.status === "missed",
  );

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Welcome card */}
      <div className="surface-panel overflow-hidden rounded-3xl shadow-[0_24px_60px_-30px_rgba(15,118,110,0.22)]">
        <div className="flex flex-col gap-4 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/12 text-primary">
              <UserRound className="h-7 w-7" />
            </span>
            <div>
              <div className="eyebrow">User portal</div>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">
                Welcome, {patientUser.fullName?.split(" ")[0] || "Patient"}
              </h1>
            </div>
          </div>
          <button
            onClick={patientLogout}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Sign out
          </button>
        </div>

        {/* Personal info */}
        <div className="grid gap-4 border-t border-border px-6 py-5 sm:grid-cols-3 sm:px-8">
          <div className="flex items-center gap-2.5 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{patientUser.email}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{patientUser.phone}</span>
          </div>
          {patientUser.dob ? (
            <div className="flex items-center gap-2.5 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{patientUser.dob}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link
          to="/self-register"
          className="surface-panel group flex items-center gap-4 rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/12 text-primary">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="font-semibold text-foreground">Book a queue spot</div>
            <div className="text-xs text-muted-foreground">Get a ticket instantly</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          to="/track"
          className="surface-panel group flex items-center gap-4 rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/12 text-primary">
            <Search className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="font-semibold text-foreground">Track a ticket</div>
            <div className="text-xs text-muted-foreground">Check live position</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          to="/queue"
          className="surface-panel group flex items-center gap-4 rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/12 text-primary">
            <Activity className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="font-semibold text-foreground">Queue board</div>
            <div className="text-xs text-muted-foreground">Live hospital display</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Active tickets */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
          Active tickets
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tickets currently in the queue or being served.
        </p>

        {ticketsQuery.loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading your tickets...
          </div>
        ) : activeTickets.length === 0 ? (
          <div className="mt-4 surface-panel rounded-2xl p-8 text-center">
            <Ticket className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              No active tickets. Book a queue spot to get started.
            </p>
            <Link
              to="/self-register"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl gradient-primary px-5 text-sm font-semibold text-primary-foreground shadow-elegant"
            >
              Book a queue spot
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {activeTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="surface-panel rounded-2xl p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/12 text-primary">
                      <Ticket className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="font-display text-lg font-bold text-primary">
                        {ticket.ticket}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ticket.department}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      STATUS_COLORS[ticket.status] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {STATUS_LABELS[ticket.status] ?? ticket.status}
                  </span>
                </div>
                {ticket.chiefComplaint ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {ticket.chiefComplaint}
                  </p>
                ) : null}
                <Link
                  to={`/track?ticket=${encodeURIComponent(ticket.ticket)}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
                >
                  Track this ticket
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
          <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
            Visit history
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your past hospital visits.
          </p>
          <div className="mt-4 surface-panel overflow-hidden rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground">
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {pastTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="px-4 py-3 font-semibold text-primary">
                      {ticket.ticket}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {ticket.department}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          STATUS_COLORS[ticket.status] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {STATUS_LABELS[ticket.status] ?? ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
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
    </section>
  );
}
