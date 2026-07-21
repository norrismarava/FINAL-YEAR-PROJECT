import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LoaderCircle,
  MessageCircle,
  PhoneCall,
  Search,
  Ticket,
  UserRound,
} from "lucide-react";

import { DEPARTMENTS } from "@/services/queueMeta";
import { selfRegisterPatient } from "@/services/queueApi";
import { useLiveRefresh } from "@/context/LiveRefreshContext";

const INITIAL_FORM = {
  fullName: "",
  phone: "",
  dept: "OPD",
  chiefComplaint: "",
  notificationConsent: true,
  whatsApp: true,
};

export default function SelfRegisterPage() {
  const navigate = useNavigate();
  const { refreshLiveData } = useLiveRefresh();
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

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

  if (success) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="surface-panel overflow-hidden rounded-3xl p-8 text-center shadow-[0_24px_60px_-30px_rgba(15,118,110,0.22)] sm:p-10">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500/12 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="mt-6 eyebrow">You're in the queue</div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Your ticket has been issued
          </h1>

          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary-soft/40 px-6 py-4">
            <Ticket className="h-6 w-6 text-primary" />
            <span className="font-display text-3xl font-bold tracking-wide text-primary">
              {success.ticket}
            </span>
          </div>

          <p className="mt-5 max-w-md mx-auto text-sm leading-6 text-muted-foreground">
            Save your ticket code. You'll receive WhatsApp updates as your
            position changes. Present this code at the service desk when called.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to={`/track?ticket=${encodeURIComponent(success.ticket)}`}
              className="inline-flex h-12 items-center gap-2 rounded-xl gradient-primary px-6 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5"
            >
              Track your ticket
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => {
                setSuccess(null);
                setForm(INITIAL_FORM);
              }}
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Register another patient
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="surface-panel overflow-hidden rounded-3xl shadow-[0_24px_60px_-30px_rgba(15,118,110,0.22)]">
        {/* Header */}
        <div className="border-b border-border bg-gradient-to-br from-primary-soft/50 to-transparent px-6 py-7 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/12 text-primary">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div>
              <div className="eyebrow">Patient self-service</div>
              <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground">
                Book your spot in the queue
              </h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Fill in your details to get a ticket number. You'll see your live
            queue position and receive updates on your phone.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5 px-6 py-7 sm:px-8" onSubmit={handleSubmit}>
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          {/* Full name */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">
              Full name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                placeholder="e.g. Tendai Mukamuri"
                className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">
              Phone number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <PhoneCall className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="e.g. 077 123 4567"
                className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Used for WhatsApp queue notifications.
            </p>
          </div>

          {/* Department */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={form.dept}
              onChange={(e) => updateField("dept", e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Chief complaint */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">
              Reason for visit
            </label>
            <textarea
              value={form.chiefComplaint}
              onChange={(e) => updateField("chiefComplaint", e.target.value)}
              placeholder="Briefly describe your symptoms or reason for visiting"
              rows={3}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Notification consent */}
          <div className="flex items-start gap-3 rounded-xl bg-primary-soft/30 px-4 py-3.5">
            <input
              type="checkbox"
              id="notificationConsent"
              checked={form.notificationConsent}
              onChange={(e) => {
                updateField("notificationConsent", e.target.checked);
                updateField("whatsApp", e.target.checked);
              }}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <label htmlFor="notificationConsent" className="text-sm leading-5 text-foreground">
              <span className="flex items-center gap-1.5 font-semibold">
                <MessageCircle className="h-3.5 w-3.5 text-primary" />
                Send me WhatsApp updates
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Get notified when it's almost your turn.
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl gradient-primary px-6 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
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

          <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
            <Link
              to="/track"
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary/80"
            >
              <Search className="h-3.5 w-3.5" />
              Track an existing ticket
            </Link>
            <span className="text-border">|</span>
            <Link
              to="/queue"
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary/80"
            >
              <Clock3 className="h-3.5 w-3.5" />
              View queue board
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
