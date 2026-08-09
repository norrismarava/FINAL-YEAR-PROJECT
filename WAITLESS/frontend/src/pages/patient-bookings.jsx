import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { usePatientAuth } from "@/auth/PatientAuthProvider";
import { useTranslation } from "@/i18n/useTranslation";
import {
  fetchPatientAppointmentMeta,
  fetchPatientAvailableSlots,
  fetchPatientAppointments,
  bookPatientAppointment,
  cancelPatientAppointment,
} from "@/services/patientAuthApi";

const APPT_STATUS_BADGE = {
  pending: "bg-amber-500/15 text-amber-300",
  confirmed: "bg-blue-500/15 text-blue-300",
  "checked-in": "bg-emerald-500/15 text-emerald-300",
  cancelled: "bg-red-500/15 text-red-300",
  completed: "bg-violet-500/15 text-violet-300",
};

const APPT_STATUS_BADGE_LIGHT = {
  pending: "bg-amber-500/10 text-amber-600",
  confirmed: "bg-blue-500/10 text-blue-600",
  "checked-in": "bg-emerald-500/10 text-emerald-600",
  cancelled: "bg-red-500/10 text-red-600",
  completed: "bg-violet-500/10 text-violet-600",
};

export default function PatientBookingsPage() {
  const { patientUser, isPatientAuthenticated, isPatientReady } = usePatientAuth();
  const { t } = useTranslation();
  const { isLight } = useOutletContext() || { isLight: false };

  const [meta, setMeta] = useState(null);
  const [metaLoading, setMetaLoading] = useState(true);

  const [serviceCategory, setServiceCategory] = useState("");
  const [date, setDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [myAppointments, setMyAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);

  const cardClass = isLight
    ? "rounded-2xl border border-slate-200 bg-white/80 p-6"
    : "rounded-2xl border border-white/15 bg-white/[0.06] p-6";
  const headingText = isLight ? "text-slate-900" : "text-white";
  const subtext = isLight ? "text-slate-500" : "text-slate-300";
  const tealAccent = isLight ? "text-teal-600" : "text-teal-300";
  const inputClass = isLight
    ? "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/30"
    : "h-10 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 text-sm text-white outline-none focus:ring-2 focus:ring-teal-400/30";
  const btnPrimary =
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5 disabled:opacity-50";
  const btnSecondary = isLight
    ? "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
    : "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-semibold text-slate-100 transition-colors hover:bg-white/[0.12]";

  useEffect(() => {
    if (!isPatientReady || !isPatientAuthenticated) return;
    setMetaLoading(true);
    fetchPatientAppointmentMeta()
      .then((data) => setMeta(data))
      .catch(() => setMeta(null))
      .finally(() => setMetaLoading(false));
    loadAppointments();
  }, [isPatientReady, isPatientAuthenticated]);

  async function loadAppointments() {
    setAppointmentsLoading(true);
    try {
      const appts = await fetchPatientAppointments();
      setMyAppointments(appts);
    } catch {
      setMyAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  }

  useEffect(() => {
    if (!date || !serviceCategory) {
      setAvailableSlots([]);
      setSelectedSlot("");
      return;
    }
    setSlotsLoading(true);
    setSelectedSlot("");
    fetchPatientAvailableSlots(date, serviceCategory)
      .then((slots) => setAvailableSlots(slots))
      .catch(() => setAvailableSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [date, serviceCategory]);

  async function handleBook(e) {
    e.preventDefault();
    if (!serviceCategory || !date || !selectedSlot) return;
    setSubmitting(true);
    try {
      await bookPatientAppointment({
        serviceCategory,
        date,
        timeSlot: selectedSlot,
        notes: notes.trim(),
      });
      toast.success(t("bookings.bookedSuccess"));
      setServiceCategory("");
      setDate("");
      setSelectedSlot("");
      setNotes("");
      setAvailableSlots([]);
      loadAppointments();
    } catch (err) {
      toast.error(err.message ?? t("bookings.bookFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id) {
    try {
      await cancelPatientAppointment(id);
      toast.success(t("bookings.cancelSuccess"));
      loadAppointments();
    } catch (err) {
      toast.error(err.message ?? t("bookings.cancelFailed"));
    }
  }

  if (!isPatientReady) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <LoaderCircle className="h-8 w-8 animate-spin text-teal-400" />
      </div>
    );
  }

  const serviceCategories = meta?.serviceCategories ?? [];
  const activeAppointments = myAppointments.filter(
    (a) => a.status !== "cancelled" && a.status !== "completed",
  );
  const pastAppointments = myAppointments.filter(
    (a) => a.status === "cancelled" || a.status === "completed",
  );

  return (
    <div className={`px-4 py-8 sm:px-6 lg:px-10 ${isLight ? "text-slate-900" : "text-white"}`}>
      <div className="mx-auto flex w-full max-w-4xl flex-col pb-8">
        <div className="mb-6">
          <h1 className={`font-display text-2xl font-bold tracking-tight ${headingText}`}>
            {t("bookings.title")}
          </h1>
          <p className={`mt-1 text-sm ${subtext}`}>
            {t("bookings.subtitle")}
          </p>
        </div>

        <form onSubmit={handleBook} className={`${cardClass} mb-6`}>
          <div className={`text-[0.7rem] font-bold uppercase tracking-[0.24em] ${tealAccent}`}>
            {t("bookings.newAppointment")}
          </div>
          <h2 className={`mt-2 font-display text-lg font-bold ${headingText}`}>
            {t("bookings.selectSlot")}
          </h2>

          {metaLoading ? (
            <div className={`mt-4 flex items-center gap-2 text-sm ${subtext}`}>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              {t("bookings.loadingServices")}
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={`text-xs font-semibold ${subtext}`}>{t("bookings.serviceCategory")}</label>
                <select
                  value={serviceCategory}
                  onChange={(e) => setServiceCategory(e.target.value)}
                  className={`${inputClass} mt-1`}
                  required
                >
                  <option value="">{t("bookings.selectService")}</option>
                  {serviceCategories.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`text-xs font-semibold ${subtext}`}>{t("bookings.date")}</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className={`${inputClass} mt-1`}
                  required
                />
              </div>
            </div>
          )}

          {date && serviceCategory && (
            <div className="mt-5">
              <label className={`text-xs font-semibold ${subtext}`}>
                {t("bookings.availableSlots")}
              </label>
              {slotsLoading ? (
                <div className={`mt-2 flex items-center gap-2 text-sm ${subtext}`}>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  {t("bookings.checkingAvailability")}
                </div>
              ) : availableSlots.length === 0 ? (
                <p className={`mt-2 text-sm ${subtext}`}>{t("bookings.noSlots")}</p>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.slot}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot.slot)}
                      className={`h-10 rounded-lg border text-sm font-medium transition-all ${
                        !slot.available
                          ? isLight
                            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300 line-through"
                            : "cursor-not-allowed border-white/5 bg-white/[0.02] text-slate-600 line-through"
                          : selectedSlot === slot.slot
                            ? "border-teal-500 bg-teal-500/15 text-teal-700 dark:text-teal-200 ring-2 ring-teal-500/30"
                            : isLight
                              ? "border-slate-200 bg-white text-slate-700 hover:border-teal-400 hover:bg-teal-50"
                              : "border-white/15 bg-white/[0.06] text-slate-100 hover:border-teal-400/50 hover:bg-teal-500/10"
                      }`}
                    >
                      {slot.slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-5">
            <label className={`text-xs font-semibold ${subtext}`}>{t("bookings.notes")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputClass} mt-1 h-20 resize-none`}
              placeholder={t("bookings.notesPlaceholder")}
            />
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || !serviceCategory || !date || !selectedSlot}
              className={btnPrimary}
            >
              {submitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {t("bookings.bookAppointment")}
            </button>
            {selectedSlot && (
              <span className={`text-sm ${subtext}`}>
                {t("bookings.selected")} <span className={`font-semibold ${tealAccent}`}>{selectedSlot}</span>
              </span>
            )}
          </div>
        </form>

        <div className="mb-6">
          <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
            {t("bookings.upcoming")}
          </h2>
          <p className={`mt-1 text-sm ${subtext}`}>
            {t("bookings.upcomingDesc")}
          </p>
          {appointmentsLoading ? (
            <div className={`mt-4 flex items-center gap-2 text-sm ${subtext}`}>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              {t("bookings.loadingAppointments")}
            </div>
          ) : activeAppointments.length === 0 ? (
            <div className={`mt-4 rounded-2xl border p-6 text-center ${isLight ? "border-slate-200 bg-white/60" : "border-white/15 bg-white/[0.06]"}`}>
              <CalendarDays className={`mx-auto h-10 w-10 ${isLight ? "text-slate-300" : "text-slate-600"}`} />
              <p className={`mt-3 text-sm ${isLight ? "text-slate-600" : "text-slate-200"}`}>
                {t("bookings.noUpcoming")}
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {activeAppointments.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  isLight={isLight}
                  onCancel={() => handleCancel(appt.id)}
                />
              ))}
            </div>
          )}
        </div>

        {pastAppointments.length > 0 && (
          <div>
            <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
              {t("bookings.past")}
            </h2>
            <div className="mt-4 space-y-3">
              {pastAppointments.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  isLight={isLight}
                  onCancel={null}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentCard({ appt, isLight, onCancel }) {
  const { t } = useTranslation();
  const badgeClass = isLight
    ? APPT_STATUS_BADGE_LIGHT[appt.status] ?? "bg-slate-100 text-slate-600"
    : APPT_STATUS_BADGE[appt.status] ?? "bg-white/10 text-slate-300";
  const cardClass = isLight
    ? "rounded-2xl border border-slate-200 bg-white/80 p-5"
    : "rounded-2xl border border-white/15 bg-white/[0.06] p-5";
  const headingText = isLight ? "text-slate-900" : "text-white";
  const subtext = isLight ? "text-slate-500" : "text-slate-300";
  const tealAccent = isLight ? "text-teal-600" : "text-teal-300";

  const canCancel = appt.status === "pending" || appt.status === "confirmed";

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-xl ${isLight ? "bg-teal-500/10 text-teal-600" : "bg-teal-500/15 text-teal-300"}`}>
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <div className={`font-semibold ${headingText}`}>{appt.serviceLabel}</div>
            <div className={`flex items-center gap-1.5 text-xs ${subtext}`}>
              <Clock3 className="h-3.5 w-3.5" />
              {appt.date} at {appt.timeSlot}
            </div>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
          {appt.status}
        </span>
      </div>
      {appt.notes && (
        <p className={`mt-3 text-sm ${isLight ? "text-slate-700" : "text-slate-200"}`}>
          "{appt.notes}"
        </p>
      )}
      {canCancel && onCancel && (
        <button
          onClick={onCancel}
          className={`mt-3 inline-flex items-center gap-1.5 text-sm font-medium ${isLight ? "text-red-600 hover:text-red-700" : "text-red-400 hover:text-red-300"}`}
        >
          <XCircle className="h-4 w-4" />
          {t("bookings.cancelAppointment")}
        </button>
      )}
    </div>
  );
}
