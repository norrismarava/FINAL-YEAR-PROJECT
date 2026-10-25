import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Mail } from "lucide-react";

import doneImage from "@/assets/OTHER/DONE.jpeg";

import {
  AuthButton,
  AuthError,
  AuthInput,
  AuthShell,
} from "@/components/AuthShell";
import { buildApiUrl } from "@/services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(buildApiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset email");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <AuthShell
        eyebrow="Password recovery"
        title="Check your email"
        subtitle={`If ${email} is linked to a WaitLess staff account, a reset link has been created.`}
        footer={
          <Link to="/login" className="inline-flex items-center gap-2 font-semibold text-cyan-100 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        }
      >
        <div className="space-y-5 text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-white shadow-[0_12px_32px_-10px_rgba(34,197,94,0.45)] ring-4 ring-emerald-400/20">
            <img src={doneImage} alt="" className="h-full w-full object-cover" />
          </span>
          <AuthButton type="button" onClick={() => setSubmitted(false)}>
            Send another link
          </AuthButton>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Password recovery"
      title="Reset access"
      subtitle="Enter the email address linked to your staff account and we will prepare a secure reset link."
      footer={
        <Link to="/login" className="inline-flex items-center gap-2 font-semibold text-cyan-100 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      }
    >
      <form noValidate className="space-y-5" onSubmit={handleSubmit}>
        <AuthError icon={AlertCircle} message={error} />
        <AuthInput
          icon={Mail}
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="name@hospital.gov.zw"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <AuthButton type="submit" loading={loading}>
          Send reset link
        </AuthButton>
      </form>
    </AuthShell>
  );
}
