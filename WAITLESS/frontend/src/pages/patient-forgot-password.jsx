import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, ArrowRight, AtSign, CheckCircle2 } from "lucide-react";

import { PatientAuthShell } from "@/components/PatientAuthShell";
import { requestPatientPasswordReset } from "@/services/patientAuthApi";
import { useTranslation } from "@/i18n/useTranslation";

export default function PatientForgotPasswordPage() {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError(t("forgot.errorIdentifier"));
      return;
    }

    setLoading(true);
    try {
      await requestPatientPasswordReset(identifier.trim());
      setSubmitted(true);
    } catch (err) {
      setError(err.message || t("forgot.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  const backLink = (
    <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-teal-300 hover:text-teal-200">
      <ArrowLeft className="h-3 w-3" />
      {t("forgot.backToLogin")}
    </Link>
  );

  if (submitted) {
    return (
      <PatientAuthShell
        eyebrow={t("forgot.eyebrow")}
        title={t("forgot.sentTitle")}
        subtitle={t("forgot.sentSubtitle")}
        footer={backLink}
      >
        <div className="space-y-4 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-teal-500/15 text-teal-300">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-6 text-sm font-semibold text-white transition hover:bg-white/[0.09]"
          >
            {t("forgot.sendAnother")}
          </button>
        </div>
      </PatientAuthShell>
    );
  }

  return (
    <PatientAuthShell
      eyebrow={t("forgot.eyebrow")}
      title={t("forgot.title")}
      subtitle={t("forgot.subtitle")}
      footer={backLink}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-white">
            {t("forgot.identifier")}
          </label>
          <div className="relative">
            <AtSign className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={t("forgot.identifierPlaceholder")}
              autoComplete="username"
              className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            t("forgot.sending")
          ) : (
            <>
              {t("forgot.submit")}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </PatientAuthShell>
  );
}
