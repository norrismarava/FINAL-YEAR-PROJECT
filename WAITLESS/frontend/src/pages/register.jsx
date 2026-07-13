import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ClipboardPlus,
  LoaderCircle,
  MessageCircle,
  ShieldCheck,
  User,
} from "lucide-react";

import { DEPARTMENTS, PATIENT_CATEGORIES } from "@/services/queueMeta";
import { fetchQueueMeta, registerPatient } from "@/services/queueApi";
import { useLiveRefresh } from "@/context/LiveRefreshContext";
import { useApiAction, useApiResource } from "@/hooks/useApiResource";

const isBrowser = typeof window !== "undefined";
const INITIAL_FORM = {
  fullName: "",
  nationalId: "",
  dob: "",
  gender: "female",
  phone: "",
  address: "",
  patientCategory: "walk-in",
  nextOfKinName: "",
  nextOfKinPhone: "",
  dept: "OPD",
  chiefComplaint: "",
  notificationConsent: true,
  whatsApp: true,
};

export default function RegisterPage() {
  const { refreshLiveData } = useLiveRefresh();
  const [submitted, setSubmitted] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const loadMeta = useCallback(() => fetchQueueMeta(), []);
  const metaQuery = useApiResource(loadMeta, { enabled: isBrowser });

  const registerMutation = useApiAction(registerPatient, {
    onSuccess: (ticket) => {
      setSubmitted(ticket);
      refreshLiveData();
    },
  });

  const departments = metaQuery.data?.departments ?? DEPARTMENTS;
  const patientCategories =
    metaQuery.data?.patientCategories?.map((category) => ({
      value: category,
      label: PATIENT_CATEGORIES.find((entry) => entry.value === category)?.label ?? category,
    })) ?? PATIENT_CATEGORIES;

  function submit(event) {
    event.preventDefault();
    registerMutation.mutate(form);
  }

  if (submitted) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="surface-panel p-8 sm:p-10">
          <div className="text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-priority-green text-priority-green-foreground shadow-elegant">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <div className="eyebrow mt-6">Ticket issued</div>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              You are in the queue
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {submitted.patientName} has been registered successfully and routed into
              the live hospital flow.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="surface-panel-dark flex flex-col justify-between p-6 text-center">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-foreground/70">
                  Digital ticket
                </div>
                <div className="mt-4 font-display text-6xl font-bold tracking-tight text-primary-foreground sm:text-7xl">
                  {submitted.ticket}
                </div>
                <div className="mt-3 text-sm text-primary-foreground/80">
                  Routed to {submitted.department}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/12 bg-white/10 px-4 py-4 text-left text-sm text-primary-foreground/80">
                Use this code on the patient tracker to see live queue position,
                department movement, and recorded notifications.
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard
                icon={ClipboardPlus}
                title="Queue placement"
                body="The ticket is now visible on the live queue board and the staff dashboard."
              />
              <InfoCard
                icon={ShieldCheck}
                title="Department routing"
                body={`The patient has been routed into ${submitted.department} and will follow triage-aware ordering from there.`}
              />
              <InfoCard
                icon={MessageCircle}
                title={submitted.whatsApp ? "WhatsApp active" : "Walk-in mode"}
                body={
                  submitted.whatsApp
                    ? "Registration, near-turn, and call-up alerts can be delivered to the linked phone number."
                    : "No WhatsApp alerts are active for this patient, so queue updates stay on the board and staff console."
                }
              />
              <InfoCard
                icon={User}
                title="Next step"
                body="Keep the ticket code handy to track progress at any time from the patient view."
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setSubmitted(null);
                setForm(INITIAL_FORM);
              }}
              className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Register another
            </button>
            <Link
              to={`/track?ticket=${encodeURIComponent(submitted.ticket)}`}
              className="rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant"
            >
              Track my ticket
            </Link>
            <Link
              to="/queue"
              className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              View queue board
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <aside className="surface-panel-dark p-6 sm:p-8">
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-foreground/70">
            Registration flow
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Patient onboarding desk
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-primary-foreground/82 sm:text-base">
            Capture the patient once, generate a live ticket instantly, and push them
            into the triage-aware queue without handwritten registers or lost places.
          </p>

          <div className="mt-8 space-y-3">
            <FlowStep
              number="01"
              title="Capture essentials"
              body="Demographics, route, and visit reason are collected in one pass."
            />
            <FlowStep
              number="02"
              title="Issue queue ticket"
              body="A digital ticket is generated immediately and synced to the live board."
            />
            <FlowStep
              number="03"
              title="Open notification channel"
              body="WhatsApp-enabled patients can receive registration, near-turn, and call alerts."
            />
          </div>

          <div className="mt-8 rounded-2xl border border-white/12 bg-white/10 p-4">
            <div className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary-foreground/80" />
              <div>
                <div className="font-semibold text-primary-foreground">
                  Patient communication
                </div>
                <p className="mt-1 text-sm leading-6 text-primary-foreground/80">
                  Turn on WhatsApp when a reachable mobile number is available so the
                  system can reduce crowding around the waiting area.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <form onSubmit={submit} className="surface-panel p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Registration form</div>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Register a new patient
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                This takes about a minute. The patient receives a queue ticket and is
                visible to staff immediately after submission.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-soft/70 px-3 py-1.5 text-xs font-semibold text-primary">
              <User className="h-3.5 w-3.5" />
              Front desk ready
            </span>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Full name" required>
              <input
                required
                value={form.fullName}
                onChange={(event) =>
                  setForm({ ...form, fullName: event.target.value })
                }
                className="input-base"
                placeholder="e.g. Tariro Moyo"
              />
            </Field>

            <Field label="National ID">
              <input
                value={form.nationalId}
                onChange={(event) =>
                  setForm({ ...form, nationalId: event.target.value })
                }
                className="input-base"
                placeholder="63-1234567-A-12"
              />
            </Field>

            <Field label="Date of birth">
              <input
                type="date"
                value={form.dob}
                onChange={(event) => setForm({ ...form, dob: event.target.value })}
                className="input-base"
              />
            </Field>

            <Field label="Gender">
              <select
                value={form.gender}
                onChange={(event) =>
                  setForm({ ...form, gender: event.target.value })
                }
                className="input-base"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </Field>

            <Field label="Patient category">
              <select
                value={form.patientCategory}
                onChange={(event) =>
                  setForm({ ...form, patientCategory: event.target.value })
                }
                className="input-base"
              >
                {patientCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Mobile / WhatsApp">
              <input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                className="input-base"
                placeholder="+263 77 123 4567"
              />
            </Field>

            <Field label="Residential area">
              <input
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
                className="input-base"
                placeholder="e.g. Chinhoyi, Cold Stream"
              />
            </Field>

            <Field label="Next of kin name">
              <input
                value={form.nextOfKinName}
                onChange={(event) =>
                  setForm({ ...form, nextOfKinName: event.target.value })
                }
                className="input-base"
                placeholder="Emergency contact full name"
              />
            </Field>

            <Field label="Next of kin phone">
              <input
                value={form.nextOfKinPhone}
                onChange={(event) =>
                  setForm({ ...form, nextOfKinPhone: event.target.value })
                }
                className="input-base"
                placeholder="+263 77 000 0000"
              />
            </Field>

            <Field label="Department">
              <select
                value={form.dept}
                onChange={(event) => setForm({ ...form, dept: event.target.value })}
                className="input-base"
              >
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Chief complaint" full>
              <textarea
                rows={4}
                value={form.chiefComplaint}
                onChange={(event) =>
                  setForm({ ...form, chiefComplaint: event.target.value })
                }
                className="input-base resize-none"
                placeholder="Briefly describe the reason for visit"
              />
            </Field>
          </div>

          <label className="surface-panel-muted mt-6 flex items-start gap-3 px-4 py-4 text-sm">
            <input
              type="checkbox"
              checked={form.notificationConsent}
              onChange={(event) =>
                setForm({
                  ...form,
                  notificationConsent: event.target.checked,
                  whatsApp: event.target.checked ? form.whatsApp : false,
                })
              }
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>
              <span className="font-semibold">Patient consents to queue notifications</span>
              <span className="mt-1 block text-muted-foreground">
                Capture consent before sending WhatsApp or web queue updates to the
                patient phone number.
              </span>
            </span>
          </label>

          <label
            className={`surface-panel-muted mt-3 flex items-start gap-3 px-4 py-4 text-sm ${
              form.notificationConsent ? "" : "opacity-60"
            }`}
          >
            <input
              type="checkbox"
              checked={form.whatsApp}
              disabled={!form.notificationConsent}
              onChange={(event) =>
                setForm({ ...form, whatsApp: event.target.checked })
              }
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>
              <span className="font-semibold">Use WhatsApp for queue alerts</span>
              <span className="mt-1 block text-muted-foreground">
                Registration, near-turn, missed-turn, and call-up alerts help patients
                wait more comfortably and reduce crowding around the service point.
              </span>
            </span>
          </label>

          {registerMutation.isError && (
            <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {registerMutation.error.message}
            </div>
          )}

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
          >
            {registerMutation.isPending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Issuing ticket...
              </>
            ) : (
              "Issue digital ticket"
            )}
          </button>
        </form>
      </div>
    </section>
  );
}

function FlowStep({ number, title, body }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-foreground/65">
        Step {number}
      </div>
      <div className="mt-1 font-display text-lg font-bold text-primary-foreground">
        {title}
      </div>
      <p className="mt-1 text-sm leading-6 text-primary-foreground/80">{body}</p>
    </div>
  );
}

function InfoCard({ icon: Icon, title, body }) {
  return (
    <div className="surface-panel-muted px-4 py-4">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="mt-4 font-display text-lg font-bold tracking-tight">{title}</div>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function Field({ label, children, required, full }) {
  return (
    <label className={`flex flex-col gap-2 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}
