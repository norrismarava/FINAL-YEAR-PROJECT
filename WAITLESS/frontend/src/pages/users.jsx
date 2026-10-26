import { useCallback, useMemo, useState } from "react";
import { LoaderCircle, Plus, Search, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/auth/AuthProvider";
import { useApiResource } from "@/hooks/useApiResource";
import { CreateStaffUserForm } from "@/pages/staff-register";
import { deleteStaffUser, listStaffUsers } from "@/services/authApi";
import { LoadingPanel } from "@/components/ui/system-loader";

const isBrowser = typeof window !== "undefined";
const EMPTY_LIST = [];

const ROLE_COLORS = {
  admin: "bg-rose-400/15 text-rose-300 ring-rose-300/25",
  dentist: "bg-emerald-400/15 text-emerald-300 ring-emerald-300/25",
  doctor: "bg-teal-400/15 text-teal-300 ring-teal-300/25",
  nurse: "bg-sky-400/15 text-sky-300 ring-sky-300/25",
  pharmacist: "bg-blue-400/15 text-blue-300 ring-blue-300/25",
  "lab-tech": "bg-violet-400/15 text-violet-300 ring-violet-300/25",
  radiologist: "bg-amber-400/15 text-amber-300 ring-amber-300/25",
  receptionist: "bg-cyan-400/15 text-cyan-300 ring-cyan-300/25",
  reception: "bg-cyan-400/15 text-cyan-300 ring-cyan-300/25",
};

function roleLabel(role) {
  return (role ?? "staff")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name) {
  return (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function UsersPage() {
  const { staff: currentStaff } = useAuth();
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deletedIds, setDeletedIds] = useState(() => new Set());
  const [deleteError, setDeleteError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [addedStaff, setAddedStaff] = useState([]);

  const staffLoader = useCallback(() => listStaffUsers(), []);

  const staffQuery = useApiResource(staffLoader, { enabled: isBrowser });

  const staff = useMemo(() => {
    const seen = new Set();
    return [...addedStaff, ...(staffQuery.data?.users ?? EMPTY_LIST)].filter((user) => {
      if (seen.has(user.id)) return false;
      seen.add(user.id);
      return true;
    });
  }, [addedStaff, staffQuery.data]);

  async function handleDelete(user) {
    setDeleteError("");
    setDeleting(user.id);
    try {
      await deleteStaffUser(user.id);
      setDeletedIds((prev) => new Set(prev).add(user.id));
      setAddedStaff((prev) => prev.filter((entry) => entry.id !== user.id));
      setConfirmId(null);
      toast.success(`${user.name ?? user.fullName ?? "User"} deleted successfully.`);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(null);
    }
  }

  const rows = useMemo(() => {
    const source = staff.filter((user) => !deletedIds.has(user.id));
    const q = search.trim().toLowerCase();
    if (!q) return source;
    return source.filter((user) =>
      [user.name ?? user.fullName, user.username, user.email, user.role, user.department]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q)),
    );
  }, [staff, search, deletedIds]);

  return (
    <section className="staff-module-page mx-auto min-h-[calc(100vh-7rem)] w-full max-w-[96rem] px-1 py-6 sm:py-8">
      <header className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:p-8">
        <span className="absolute inset-x-0 top-0 h-0.5 bg-[linear-gradient(90deg,transparent,#14b8a6,transparent)]" />
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="bg-gradient-to-r from-teal-300 to-teal-300 bg-clip-text text-[11px] font-black uppercase tracking-[0.32em] text-transparent">
                Admin
              </span>
              <span className="h-px w-9 bg-gradient-to-l from-transparent to-teal-300/60" />
            </div>
            <h1 className="mt-3 inline-flex items-center gap-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Staff
              <span className="mt-1 h-px w-10 bg-gradient-to-l from-transparent to-teal-300/50" />
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/45 sm:text-base">
              Every registered staff account in the system.
            </p>
          </div>
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-teal-300/20 bg-teal-400/10 text-teal-300">
            <Users className="h-5 w-5" />
          </span>
        </div>

        {/* Count + search + create */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/70">
            <Users className="h-3.5 w-3.5 text-teal-300" />
            {staff.length} staff member{staff.length === 1 ? "" : "s"}
          </span>

          <label className="relative min-w-56 flex-1 sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              type="text"
              placeholder="Search staff…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-full border border-white/10 bg-white/[0.05] pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-teal-300/40"
            />
          </label>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,rgba(15,118,110,0.92),rgba(13,148,136,0.88))] px-4 text-xs font-bold uppercase tracking-[0.08em] text-white transition hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" /> Add staff
          </button>
        </div>
      </header>

      <div className="mt-5">
        {staffQuery.isLoading ? (
          <LoadingPanel title="Loading users" message="Fetching registered accounts." />
        ) : staffQuery.isError ? (
          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-6 text-sm text-rose-300">
            {staffQuery.error.message}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111827] shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.07] text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                  <th className="px-5 py-3.5">User</th>
                  <th className="hidden px-5 py-3.5 md:table-cell">Contact</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="hidden px-5 py-3.5 lg:table-cell">Department</th>
                  <th className="hidden px-5 py-3.5 sm:table-cell">Joined</th>
                  <th className="hidden px-5 py-3.5 xl:table-cell">Last login</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-white/35">
                      {search ? "No users match this search." : "No registered users yet."}
                    </td>
                  </tr>
                ) : (
                  rows.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-white/[0.05] transition-colors last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,rgba(13,148,136,0.55),rgba(34,211,238,0.35))] text-[11px] font-bold text-white">
                            {initials(user.name ?? user.fullName)}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-white">
                              {user.name ?? user.fullName}
                            </div>
                            <div className="truncate text-xs text-white/40">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-5 py-3.5 md:table-cell">
                        <div className="min-w-0">
                          <div className="truncate text-white/75">{user.email || "—"}</div>
                          {user.phone ? (
                            <div className="truncate text-xs text-white/40">{user.phone}</div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ring-1 ring-inset ${
                            ROLE_COLORS[user.role] ?? "bg-white/[0.06] text-white/60 ring-white/15"
                          }`}
                        >
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td className="hidden px-5 py-3.5 text-white/60 lg:table-cell">
                        {user.department || "—"}
                      </td>
                      <td className="hidden px-5 py-3.5 text-white/50 sm:table-cell">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="hidden px-5 py-3.5 text-white/50 xl:table-cell">
                        {formatDate(user.lastLoginAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {user.id === currentStaff?.id ? (
                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/25">
                            You
                          </span>
                        ) : confirmId === user.id ? (
                          <span className="inline-flex items-center gap-1.5">
                            {deleting === user.id ? (
                              <LoaderCircle className="h-4 w-4 animate-spin text-white/40" />
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(user)}
                                  className="rounded-full bg-rose-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-rose-300 ring-1 ring-inset ring-rose-400/30 transition hover:bg-rose-500/25"
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmId(null)}
                                  className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/50 ring-1 ring-inset ring-white/10 transition hover:bg-white/[0.1]"
                                >
                                  Keep
                                </button>
                              </>
                            )}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError("");
                              setConfirmId(user.id);
                            }}
                            title="Delete this account"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/40 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {deleteError ? (
          <p className="mt-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-300">
            {deleteError}
          </p>
        ) : null}
      </div>

      {showCreate ? (
        <div className="fixed inset-0 z-[90] flex overflow-y-auto bg-[#040a12]/70 p-4 backdrop-blur-sm">
          <div className="relative m-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#0d1626] p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-teal-300/80">
                Staff onboarding
              </div>
              <h2 className="mt-1 font-display text-xl font-bold text-white">Create new user</h2>
              <p className="mt-1 text-xs text-white/45">
                They sign in with the temporary password once, then set their own.
              </p>
            </div>
            <CreateStaffUserForm
              onSuccess={(user) => {
                if (user) setAddedStaff((prev) => [user, ...prev]);
                setShowCreate(false);
                staffQuery.refetch();
                toast.success(`${user?.name ?? "Staff member"} created successfully.`);
              }}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
