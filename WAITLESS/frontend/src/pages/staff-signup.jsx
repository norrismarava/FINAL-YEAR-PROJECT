import { Link } from "react-router-dom";
import { useState } from "react";
import {
  CheckCircle2,
  ClipboardPlus,
  LoaderCircle,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";

import staffSignupBackground from "@/assets/try2.png";

const INITIAL_FORM = {
  fullName: "",
  email: "",
  department: "",
  role: "nurse",
  employeeId: "",
  phone: "",
};

const DEPARTMENTS = [
  "OPD",
  "Pharmacy",
  "Laboratory",
  "Radiology",
  "OI Clinic",
  "Casualty",
];

const ROLES = [
  { value: "nurse", label: "Nurse" },
  { value: "doctor", label: "Doctor" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "lab-tech", label: "Lab Technician" },
  { value: "radiologist", label: "Radiologist" },
  { value: "receptionist", label: "Receptionist" },
  { value: "admin", label: "Administrator" },
];

export default function StaffSignupPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  function submit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <section 
        className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8"
        style={{
          backgroundImage: `url(${staffSignupBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="surface-panel p-8 sm:p-10">
          <div className="text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-priority-green text-priority-green-foreground shadow-elegant">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <div className="eyebrow mt-6">Registration complete</div>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Staff account created
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {form.fullName} has been successfully registered in the WaitLess system.
              They can now access the dashboard and queue management tools.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <InfoCard
              icon={ShieldCheck}
              title="Access granted"
              body={`Staff member can now log in with ${form.email} and access ${form.department} operations.`}
            />
            <InfoCard
              icon={Stethoscope}
              title="Role assigned"
              body={`${ROLES.find(r => r.value === form.role)?.label} privileges have been configured for this account.`}
            />
            <InfoCard
              icon={ClipboardPlus}
              title="Department sync"
              body={`The account is linked to ${form.department} and will receive relevant queue updates.`}
            />
            <InfoCard
              icon={User}
              title="Next steps"
              body="The staff member should log in to complete their profile setup and begin using the system."
            />
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setSubmitted(false);
                setForm(INITIAL_FORM);
              }}
              className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Register another staff member
            </button>
            <Link
              to="/admin/dashboard"
              className="rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      style={{
        backgroundImage: `url(${staffSignupBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <aside className="surface-panel-dark p-6 sm:p-8">
          <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-foreground/70">
            Staff onboarding
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Hospital staff registration
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-primary-foreground/82 sm:text-base">
            Add new team members to the WaitLess system. Grant access to queue management,
            patient tracking, and department operations.
          </p>

          <div className="mt-8 space-y-3">
            <FlowStep
              number="01"
              title="Staff details"
              body="Capture name, contact information, and employee identification."
            />
            <FlowStep
              number="02"
              title="Department assignment"
              body="Link the staff member to their primary department for queue access."
            />
            <FlowStep
              number="03"
              title="Role configuration"
              body="Assign appropriate permissions based on their clinical or administrative role."
            />
          </div>

          <div className="mt-8 rounded-2xl border border-white/12 bg-white/10 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary-foreground/80" />
              <div>
                <div className="font-semibold text-primary-foreground">
                  System access
                </div>
                <p className="mt-1 text-sm leading-6 text-primary-foreground/80">
                  Staff members will have secure access to patient queues, triage consoles,
                  and department-specific operations based on their assigned role.
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
                Register staff member
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Complete the form below to create a new staff account with appropriate
                system access.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary-soft/70 px-3 py-1.5 text-xs font-semibold text-primary">
              <User className="h-3.5 w-3.5" />
              Staff registration
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
                placeholder="e.g. Dr. Sarah Chenaka"
              />
            </Field>

            <Field label="Email address" required>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                className="input-base"
                placeholder="sarah.chenaka@hospital.gov.zw"
              />
            </Field>

            <Field label="Employee ID" required>
              <input
                required
                value={form.employeeId}
                onChange={(event) =>
                  setForm({ ...form, employeeId: event.target.value })
                }
                className="input-base"
                placeholder="e.g. EMP-2024-0142"
              />
            </Field>

            <Field label="Phone number">
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                className="input-base"
                placeholder="+263 77 123 4567"
              />
            </Field>

            <Field label="Department" required>
              <select
                required
                value={form.department}
                onChange={(event) =>
                  setForm({ ...form, department: event.target.value })
                }
                className="input-base"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Role" required>
              <select
                required
                value={form.role}
                onChange={(event) =>
                  setForm({ ...form, role: event.target.value })
                }
                className="input-base"
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <button
            type="submit"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5"
          >
            <ClipboardPlus className="h-4 w-4" />
            Create staff account
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

function Field({ label, children, required }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}
