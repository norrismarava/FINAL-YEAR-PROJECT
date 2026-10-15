import { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  PhoneCall,
  CalendarDays,
  ShieldCheck,
  Save,
  LoaderCircle,
  IdCard,
  Heart,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Clock3,
  Activity,
  Siren,
} from "lucide-react";
import { toast } from "sonner";

import { useOutletContext } from "react-router-dom";
import { usePatientAuth } from "@/auth/PatientAuthProvider";
import { ProfilePhotoPicker } from "@/components/ProfilePhotoPicker";
import {
  fetchPatientProfileCard,
  updatePatientProfile,
  changePatientPassword,
  uploadPatientAvatar,
} from "@/services/patientAuthApi";
import { resolveProfileImageUrl } from "@/utils/profileImage";
import { useTranslation } from "@/i18n/useTranslation";

const GENDER_OPTIONS = [
  { value: "male", labelKey: "profile.genderMale" },
  { value: "female", labelKey: "profile.genderFemale" },
  { value: "other", labelKey: "profile.genderOther" },
  { value: "unknown", labelKey: "profile.genderUnknown" },
];

export default function PatientProfilePage() {
  const { patientUser, updatePatientAvatar } = usePatientAuth();
  const { isLight } = useOutletContext() || { isLight: false };
  const { t } = useTranslation();
  const [avatarPreview, setAvatarPreview] = useState(() =>
    resolveProfileImageUrl(patientUser?.avatarUrl),
  );
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationalId: "",
    dob: "",
    gender: "unknown",
  });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    fetchPatientProfileCard()
      .then((data) => {
        setProfileData(data);
        const acct = data?.account;
        if (acct) {
          setForm({
            fullName: acct.fullName ?? "",
            email: acct.email ?? "",
            phone: acct.phone ?? "",
            nationalId: acct.nationalId ?? "",
            dob: acct.dob ?? "",
            gender: acct.gender ?? "unknown",
          });
        }
      })
      .catch(() => setProfileData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setAvatarPreview(resolveProfileImageUrl(patientUser?.avatarUrl));
  }, [patientUser?.avatarUrl]);

  async function handleAvatarChange({ base64, dataUrl }) {
    const previousAvatar = avatarPreview;
    setAvatarPreview(dataUrl);
    try {
      const response = await uploadPatientAvatar(base64);
      updatePatientAvatar(response.avatarUrl);
      setAvatarPreview(resolveProfileImageUrl(response.avatarUrl));
      toast.success("Profile photo updated");
    } catch (err) {
      setAvatarPreview(previousAvatar);
      throw err;
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await updatePatientProfile(form);
      setSaved(true);
      toast.success(t("profile.updateSuccess"));
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(err.message || t("profile.updateFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) return;
    if (pwForm.newPassword.length < 6) {
      toast.error(t("profile.passwordTooShort"));
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error(t("profile.passwordMismatch"));
      return;
    }
    setPwSaving(true);
    try {
      await changePatientPassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success(t("profile.passwordSuccess"));
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.message || t("profile.passwordFailed"));
    } finally {
      setPwSaving(false);
    }
  }

  const profileCompleteness = (() => {
    const fields = ["fullName", "email", "phone", "dob", "nationalId", "gender"];
    const filled = fields.filter((f) => {
      const val = form[f];
      return val && val !== "unknown" && String(val).trim().length > 0;
    });
    return Math.round((filled.length / fields.length) * 100);
  })();

  const clinicalProfile = profileData?.profile;
  const accountInfo = profileData?.account;

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
  const labelClass = isLight
    ? "mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600"
    : "mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300";
  const labelIcon = isLight ? "text-teal-600/80" : "text-teal-400/80";
  const infoRowClass = isLight
    ? "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
    : "rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3";
  const infoLabelClass = isLight
    ? "text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
    : "text-xs font-semibold uppercase tracking-[0.14em] text-slate-400";
  const infoValueClass = isLight
    ? "mt-1 text-sm font-medium text-slate-900"
    : "mt-1 text-sm font-medium text-slate-100";
  const metaLabelClass = isLight
    ? "text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
    : "text-xs font-semibold uppercase tracking-[0.14em] text-slate-400";
  const metaValueClass = isLight ? "mt-1 text-sm text-slate-700" : "mt-1 text-sm text-slate-200";
  const dividerClass = isLight ? "border-slate-200" : "border-white/10";
  const progressBg = isLight ? "bg-slate-200" : "bg-white/10";

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
      <div className="mb-8 flex items-center gap-5">
        <ProfilePhotoPicker
          value={avatarPreview}
          initials={patientInitials(form.fullName || patientUser?.fullName)}
          onImageReady={handleAvatarChange}
          label="Change profile photo"
          cropSource={patientUser?.avatarUrl}
          size="compact"
          showHint={false}
        />
        <div>
          <h1 className={`font-display text-2xl font-bold tracking-tight ${headingText}`}>
            {t("profile.title")}
          </h1>
          <p className={`mt-1 text-sm ${subtext}`}>
            {t("profile.subtitle")}
          </p>
          <p className={`mt-1.5 text-xs ${subtext}`}>
            Tap the photo to upload or reposition your picture.
          </p>
        </div>
      </div>

      {/* Profile completeness */}
      <div className={`mb-6 ${cardClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${tealIconBg}`}>
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <div className={`font-semibold ${headingText}`}>{t("profile.completeness")}</div>
              <div className={`text-xs ${subtext}`}>
                {t("profile.completenessDesc")}
              </div>
            </div>
          </div>
          <span className={`font-display text-2xl font-bold ${tealAccent}`}>
            {profileCompleteness}%
          </span>
        </div>
        <div className={`mt-4 h-2 overflow-hidden rounded-full ${progressBg}`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-300 transition-all"
            style={{ width: `${profileCompleteness}%` }}
          />
        </div>
      </div>

      {/* Hospital-linked profile info (read-only) */}
      {clinicalProfile && (
        <div className={`mb-6 ${cardClass}`}>
          <div className="mb-4 flex items-center gap-2">
            <Heart className={`h-5 w-5 ${tealAccent}`} />
            <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
              {t("profile.hospitalRecord")}
            </h2>
            {clinicalProfile.patientCategory && clinicalProfile.patientCategory !== "General" && (
              <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${isLight ? "bg-teal-500/10 text-teal-700" : "bg-teal-500/15 text-teal-300"}`}>
                {clinicalProfile.patientCategory}
              </span>
            )}
          </div>
          <p className={`mb-4 text-xs ${subtext}`}>
            {t("profile.hospitalRecordDesc")}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow label={t("profile.patientNumber")} value={clinicalProfile.patientNumber} infoRowClass={infoRowClass} infoLabelClass={infoLabelClass} infoValueClass={infoValueClass} />
            <InfoRow label={t("profile.patientName")} value={clinicalProfile.patientName} infoRowClass={infoRowClass} infoLabelClass={infoLabelClass} infoValueClass={infoValueClass} />
            <InfoRow label={t("profile.category")} value={clinicalProfile.patientCategory ?? "General"} infoRowClass={infoRowClass} infoLabelClass={infoLabelClass} infoValueClass={infoValueClass} />
            <InfoRow label={t("profile.dob")} value={clinicalProfile.dob ?? "N/A"} infoRowClass={infoRowClass} infoLabelClass={infoLabelClass} infoValueClass={infoValueClass} />
            <InfoRow label={t("profile.gender")} value={clinicalProfile.gender ?? "N/A"} infoRowClass={infoRowClass} infoLabelClass={infoLabelClass} infoValueClass={infoValueClass} />
            <InfoRow label={t("profile.phone")} value={clinicalProfile.phone} infoRowClass={infoRowClass} infoLabelClass={infoLabelClass} infoValueClass={infoValueClass} />
          </div>
          {profileData?.stats && (
            <div className={`mt-4 grid grid-cols-3 gap-3 border-t ${dividerClass} pt-4`}>
              <div className="text-center">
                <div className={`font-display text-xl font-bold ${tealAccent}`}>{profileData.stats.totalVisits}</div>
                <div className={`text-xs ${subtext}`}>{t("profile.totalVisits")}</div>
              </div>
              <div className="text-center">
                <div className={`font-display text-xl font-bold ${tealAccent}`}>{profileData.stats.completedVisits}</div>
                <div className={`text-xs ${subtext}`}>{t("profile.completed")}</div>
              </div>
              <div className="text-center">
                <div className={`font-display text-xl font-bold ${tealAccent}`}>{profileData.stats.triageEvents}</div>
                <div className={`text-xs ${subtext}`}>{t("profile.triageEvents")}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editable account form */}
      <form onSubmit={handleSave} className={cardClass}>
        <div className="mb-6 flex items-center gap-2">
          <UserRound className={`h-5 w-5 ${tealAccent}`} />
          <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
            {t("profile.accountInfo")}
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Full name */}
          <Field label={t("profile.fullName")} icon={UserRound} labelClass={labelClass} labelIcon={labelIcon}>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              className={inputClass}
              placeholder={t("profile.fullNamePlaceholder")}
            />
          </Field>

          {/* Email */}
          <Field label={t("profile.email")} icon={Mail} labelClass={labelClass} labelIcon={labelIcon}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className={inputClass}
              placeholder={t("profile.emailPlaceholder")}
            />
          </Field>

          {/* Phone */}
          <Field label={t("profile.phoneLabel")} icon={PhoneCall} labelClass={labelClass} labelIcon={labelIcon}>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className={inputClass}
              placeholder={t("profile.phonePlaceholder")}
            />
          </Field>

          {/* National ID */}
          <Field label={t("profile.nationalId")} icon={IdCard} labelClass={labelClass} labelIcon={labelIcon}>
            <input
              type="text"
              value={form.nationalId}
              onChange={(e) => updateField("nationalId", e.target.value)}
              className={inputClass}
              placeholder={t("profile.nationalIdPlaceholder")}
            />
          </Field>

          {/* DOB */}
          <Field label={t("profile.dobLabel")} icon={CalendarDays} labelClass={labelClass} labelIcon={labelIcon}>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => updateField("dob", e.target.value)}
              className={inputClass}
            />
          </Field>

          {/* Gender */}
          <Field label={t("profile.genderLabel")} labelClass={labelClass} labelIcon={labelIcon}>
            <select
              value={form.gender}
              onChange={(e) => updateField("gender", e.target.value)}
              className={inputClass}
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className={isLight ? "bg-white text-slate-900" : "bg-[#04141f] text-white"}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Account meta (read-only) */}
        <div className={`mt-6 border-t ${dividerClass} pt-5`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className={metaLabelClass}>
                {t("profile.username")}
              </div>
              <div className={metaValueClass}>
                {accountInfo?.username ?? patientUser?.username ?? "N/A"}
              </div>
            </div>
            <div>
              <div className={metaLabelClass}>
                {t("profile.memberSince")}
              </div>
              <div className={metaValueClass}>
                {accountInfo?.createdAt
                  ? new Date(accountInfo.createdAt).toLocaleDateString()
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? t("profile.saving") : saved ? t("profile.saved") : t("profile.saveChanges")}
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className={`mt-6 ${cardClass}`}>
        <div className="mb-6 flex items-center gap-2">
          <KeyRound className={`h-5 w-5 ${tealAccent}`} />
          <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
            {t("profile.changePassword")}
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("profile.currentPassword")} icon={Lock} labelClass={labelClass} labelIcon={labelIcon}>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                className={inputClass}
                placeholder={t("profile.currentPasswordPlaceholder")}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <div></div>
          <Field label={t("profile.newPassword")} icon={Lock} labelClass={labelClass} labelIcon={labelIcon}>
            <input
              type={showPw ? "text" : "password"}
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
              className={inputClass}
              placeholder={t("profile.newPasswordPlaceholder")}
              required
            />
          </Field>
          <Field label={t("profile.confirmPassword")} icon={Lock} labelClass={labelClass} labelIcon={labelIcon}>
            <input
              type={showPw ? "text" : "password"}
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              className={inputClass}
              placeholder={t("profile.confirmPasswordPlaceholder")}
              required
            />
          </Field>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <button
            type="submit"
            disabled={pwSaving}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.5)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {pwSaving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            {pwSaving ? t("profile.changing") : t("profile.changePasswordBtn")}
          </button>
        </div>
      </form>

      {/* Account Security Info */}
      <div className={`mt-6 ${cardClass}`}>
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className={`h-5 w-5 ${tealAccent}`} />
          <h2 className={`font-display text-lg font-bold tracking-tight ${headingText}`}>
            {t("profile.accountSecurity")}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className={infoRowClass}>
            <div className={infoLabelClass}>{t("profile.username")}</div>
            <div className={infoValueClass}>{accountInfo?.username ?? patientUser?.username ?? "N/A"}</div>
          </div>
          <div className={infoRowClass}>
            <div className={infoLabelClass}>{t("profile.memberSince")}</div>
            <div className={infoValueClass}>
              {accountInfo?.createdAt ? new Date(accountInfo.createdAt).toLocaleDateString() : "N/A"}
            </div>
          </div>
          <div className={infoRowClass}>
            <div className={infoLabelClass}>{t("profile.lastLogin")}</div>
            <div className={infoValueClass}>
              {accountInfo?.lastLoginAt ? new Date(accountInfo.lastLoginAt).toLocaleString() : "N/A"}
            </div>
          </div>
        </div>
        <div className={`mt-4 flex items-center gap-2 border-t ${dividerClass} pt-4 text-xs ${subtext}`}>
          <ShieldCheck className={`h-3.5 w-3.5 ${isLight ? "text-teal-600/80" : "text-teal-400/80"}`} />
          {t("profile.securityNote")}
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children, labelClass, labelIcon }) {
  return (
    <div>
      <label className={labelClass}>
        {Icon && <Icon className={`h-3.5 w-3.5 ${labelIcon}`} />}
        {label}
      </label>
      {children}
    </div>
  );
}

function InfoRow({ label, value, infoRowClass, infoLabelClass, infoValueClass }) {
  return (
    <div className={infoRowClass}>
      <div className={infoLabelClass}>
        {label}
      </div>
      <div className={infoValueClass}>{value ?? "N/A"}</div>
    </div>
  );
}

function patientInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "WL";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
