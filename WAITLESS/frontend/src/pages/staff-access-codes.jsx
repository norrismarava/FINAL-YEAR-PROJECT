import { AuthShell } from "@/components/AuthShell";
import { AccessCodePanel } from "@/pages/staff-register";

export default function StaffAccessCodesPage() {
  return (
    <AuthShell
      eyebrow="Staff onboarding"
      title="Staff access codes"
      subtitle="Generate a one-time invite code so a staff member can create their own account."
    >
      <AccessCodePanel standalone />
    </AuthShell>
  );
}
