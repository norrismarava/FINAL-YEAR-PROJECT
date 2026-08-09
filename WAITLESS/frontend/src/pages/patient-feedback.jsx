import { useEffect, useMemo, useState } from "react";
import {
  Star,
  MessageSquare,
  LoaderCircle,
  CheckCircle2,
  Clock3,
  Send,
  HeartPulse,
  Users,
  Stethoscope,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useOutletContext } from "react-router-dom";

import { usePatientAuth } from "@/auth/PatientAuthProvider";
import {
  fetchPatientTickets,
  fetchPatientProfileCard,
  submitPatientFeedback,
} from "@/services/patientAuthApi";
import { useTranslation } from "@/i18n/useTranslation";

const CATEGORY_META = [
  { key: "waitTime", icon: Clock3 },
  { key: "staffBehaviour", icon: Users },
  { key: "communication", icon: MessageSquare },
  { key: "cleanliness", icon: Sparkles },
  { key: "overall", icon: HeartPulse },
];

export default function PatientFeedbackPage() {
  const { patientUser } = usePatientAuth();
  const { isLight } = useOutletContext() || { isLight: false };
  const { t } = useTranslation();

  const [tickets, setTickets] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState("");
  const [submittedIds, setSubmittedIds] = useState(new Set());

  useEffect(() => {
    Promise.all([fetchPatientTickets(), fetchPatientProfileCard()])
      .then(([tix, profile]) => {
        setTickets(tix);
        setProfileData(profile);
      })
      .catch(() => {
        setTickets([]);
        setProfileData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const completedTickets = useMemo(
    () => tickets.filter((tk) => tk.status === "completed"),
    [tickets]
  );

  const existingFeedback = useMemo(
    () => profileData?.feedback ?? [],
    [profileData]
  );

  const alreadyRatedIds = useMemo(() => {
    const ids = new Set();
    for (const f of existingFeedback) {
      if (f.ticketCode) {
        const tk = completedTickets.find((c) => c.ticket === f.ticketCode);
        if (tk) ids.add(tk.id);
      }
    }
    return ids;
  }, [existingFeedback, completedTickets]);

  const rateableTickets = useMemo(
    () => completedTickets.filter((tk) => !alreadyRatedIds.has(tk.id) && !submittedIds.has(tk.id)),
    [completedTickets, alreadyRatedIds, submittedIds]
  );

  const selectedTicket = useMemo(
    () => rateableTickets.find((tk) => tk.id === selectedTicketId) ?? null,
    [rateableTickets, selectedTicketId]
  );

  const headingText = isLight ? "text-slate-900" : "text-white";
  const subtext = isLight ? "text-slate-500" : "text-slate-300";
  const tealAccent = isLight ? "text-teal-600" : "text-teal-300";
  const tealIconBg = isLight ? "bg-teal-500/10 text-teal-600" : "bg-teal-500/15 text-teal-300";
  const cardClass = isLight
    ? "rounded-2xl border border-slate-200 bg-white/80 p-6"
    : "rounded-2xl border border-white/15 bg-white/[0.06] p-6";
  const inputClass = isLight
    ? "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-teal-500/50 focus:bg-slate-50"
    : "w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm text-white placeholder-slate-400 outline-none transition-colors focus:border-teal-400/50 focus:bg-white/[0.08]";
  const emptyIcon = isLight ? "text-slate-300" : "text-slate-600";
  const emptyText = isLight ? "text-slate-500" : "text-slate-400";
  const emptySub = isLight ? "text-slate-400" : "text-slate-500";
  const emptyCardClass = isLight
    ? "rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-center"
    : "rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center";
  const btnPrimary = "inline-flex h-11 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5 disabled:opacity-60";
  const dividerClass = isLight ? "border-slate-200" : "border-white/10";

  function setRating(catKey, value) {
    setRatings((prev) => ({ ...prev, [catKey]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedTicket) return;
    const overallRating = ratings.overall;
    if (!overallRating || overallRating < 1 || overallRating > 5) {
      toast.error(t("feedback.errorRating"));
      return;
    }
    setSubmitting(true);
    try {
      await submitPatientFeedback(selectedTicket.id, {
        rating: overallRating,
        categories: ratings,
        comment: comment.trim(),
      });
      toast.success(t("feedback.successMsg"));
      setSubmittedIds((prev) => new Set(prev).add(selectedTicket.id));
      setSelectedTicketId(null);
      setRatings({});
      setComment("");
    } catch (err) {
      toast.error(err.message || t("feedback.errorMsg"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <LoaderCircle className={`h-8 w-8 animate-spin ${isLight ? "text-teal-600" : "text-teal-400"}`} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className={`font-display text-2xl font-bold tracking-tight ${headingText}`}>
          {t("feedback.title")}
        </h1>
        <p className={`mt-1 text-sm ${subtext}`}>
          {t("feedback.subtitle")}
        </p>
      </div>

      {/* Intro card */}
      <div className={`mb-6 ${cardClass}`}>
        <div className="flex items-start gap-4">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tealIconBg}`}>
            <MessageSquare className="h-5 w-5" />
          </span>
          <div>
            <div className={`font-semibold ${headingText}`}>{t("feedback.introTitle")}</div>
            <p className={`mt-1 text-sm ${subtext}`}>
              {t("feedback.introDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* Rateable tickets */}
      {rateableTickets.length > 0 ? (
        <div className="mb-6">
          <h2 className={`mb-3 font-display text-lg font-bold tracking-tight ${headingText}`}>
            {t("feedback.rateVisit")}
          </h2>

          {/* Ticket selector */}
          {!selectedTicket && (
            <div className="space-y-3">
              {rateableTickets.map((tk) => (
                <button
                  key={tk.id}
                  onClick={() => setSelectedTicketId(tk.id)}
                  className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors hover:border-teal-400/40 ${
                    isLight ? "border-slate-200 bg-white/60 hover:bg-slate-50" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`grid h-9 w-9 place-items-center rounded-lg ${tealIconBg}`}>
                      <Stethoscope className="h-4 w-4" />
                    </span>
                    <div>
                      <div className={`font-semibold ${tealAccent}`}>{tk.ticket}</div>
                      <div className={`text-xs ${subtext}`}>{tk.department}</div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs ${subtext}`}>
                    <Clock3 className="h-3.5 w-3.5" />
                    {new Date(tk.registeredAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Feedback form for selected ticket */}
          {selectedTicket && (
            <form onSubmit={handleSubmit} className={cardClass}>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`grid h-9 w-9 place-items-center rounded-lg ${tealIconBg}`}>
                    <Stethoscope className="h-4 w-4" />
                  </span>
                  <div>
                    <div className={`font-semibold ${tealAccent}`}>{selectedTicket.ticket}</div>
                    <div className={`text-xs ${subtext}`}>{selectedTicket.department}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTicketId(null);
                    setRatings({});
                    setComment("");
                  }}
                  className={`text-xs font-medium ${subtext} hover:opacity-70`}
                >
                  {t("feedback.cancel")}
                </button>
              </div>

              {/* Category ratings */}
              <div className="space-y-5">
                {CATEGORY_META.map((cat) => {
                  const Icon = cat.icon;
                  const current = ratings[cat.key] ?? 0;
                  return (
                    <div key={cat.key}>
                      <div className={`mb-2 flex items-center gap-2 text-sm font-medium ${headingText}`}>
                        <Icon className={`h-4 w-4 ${tealAccent}`} />
                        {t(`feedback.cat.${cat.key}`)}
                      </div>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(cat.key, star)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-7 w-7 ${
                                star <= current
                                  ? "fill-amber-400 text-amber-400"
                                  : isLight
                                    ? "text-slate-300"
                                    : "text-slate-600"
                              }`}
                            />
                          </button>
                        ))}
                        <span className={`ml-2 text-xs ${subtext}`}>
                          {current > 0 ? t(`feedback.stars.${current}`) : ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              <div className={`my-5 border-t ${dividerClass}`} />

              {/* Comment */}
              <div>
                <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${headingText}`}>
                  <MessageSquare className={`h-4 w-4 ${tealAccent}`} />
                  {t("feedback.commentLabel")}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className={`${inputClass} min-h-[100px] resize-y`}
                  placeholder={t("feedback.commentPlaceholder")}
                  maxLength={500}
                />
                <div className={`mt-1 text-right text-xs ${subtext}`}>
                  {comment.length}/500
                </div>
              </div>

              {/* Submit */}
              <div className="mt-4 flex items-center gap-3">
                <button type="submit" disabled={submitting} className={btnPrimary}>
                  {submitting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {submitting ? t("feedback.submitting") : t("feedback.submit")}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className={`mb-6 ${emptyCardClass}`}>
          <CheckCircle2 className={`mx-auto h-10 w-10 ${emptyIcon}`} />
          <p className={`mt-3 text-sm ${emptyText}`}>{t("feedback.noRateable")}</p>
          <p className={`mt-1 text-xs ${emptySub}`}>{t("feedback.noRateableSub")}</p>
        </div>
      )}

      {/* Past feedback */}
      {existingFeedback.length > 0 && (
        <div className="mt-8">
          <h2 className={`mb-3 font-display text-lg font-bold tracking-tight ${headingText}`}>
            {t("feedback.pastFeedback")}
          </h2>
          <div className="space-y-3">
            {existingFeedback.map((f) => (
              <div key={f.id} className={cardClass}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`grid h-9 w-9 place-items-center rounded-lg ${tealIconBg}`}>
                      <Stethoscope className="h-4 w-4" />
                    </span>
                    <div>
                      <div className={`font-semibold ${tealAccent}`}>{f.ticketCode}</div>
                      <div className={`text-xs ${subtext}`}>
                        {new Date(f.submittedAt || f.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= (f.rating ?? 0)
                            ? "fill-amber-400 text-amber-400"
                            : isLight ? "text-slate-300" : "text-slate-600"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {f.comment && (
                  <p className={`mt-3 text-sm ${isLight ? "text-slate-700" : "text-slate-200"}`}>
                    "{f.comment}"
                  </p>
                )}
                {f.categories && Object.keys(f.categories).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(f.categories).map(([catKey, val]) => {
                      if (!val || val < 1) return null;
                      const meta = CATEGORY_META.find((c) => c.key === catKey);
                      if (!meta) return null;
                      const Icon = meta.icon;
                      return (
                        <span
                          key={catKey}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                            isLight ? "bg-slate-100 text-slate-600" : "bg-white/10 text-slate-300"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          {t(`feedback.cat.${catKey}`)}
                          <span className={tealAccent}>· {val}/5</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security footer */}
      <div className={`mt-6 flex items-center justify-center gap-2 text-xs ${subtext}`}>
        <ShieldCheck className={`h-3.5 w-3.5 ${isLight ? "text-teal-600/80" : "text-teal-400/80"}`} />
        <span>{t("feedback.footer")}</span>
      </div>
    </div>
  );
}
