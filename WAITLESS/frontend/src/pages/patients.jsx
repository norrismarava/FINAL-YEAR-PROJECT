import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Search, Users } from "lucide-react";

import { useApiResource } from "@/hooks/useApiResource";
import { searchPatientDirectory } from "@/services/authApi";
import { LoadingPanel } from "@/components/ui/system-loader";

const isBrowser = typeof window !== "undefined";
const EMPTY_LIST = [];

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const query = useApiResource(
    () => searchPatientDirectory(debounced),
    { enabled: isBrowser, deps: [debounced] },
  );

  const entries = useMemo(
    () => query.data?.patients ?? query.data ?? EMPTY_LIST,
    [query.data],
  );

  return (
    <section className="space-y-5">
      <header className="surface-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-teal-300">
            Patient records
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
            Patients directory
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Every registered patient profile and account. Search by name,
            phone, national ID, or WL-P number.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/50 focus:outline-none"
          />
        </div>
      </header>

      <div className="surface-card overflow-hidden rounded-2xl">
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4 text-sm font-semibold text-slate-300">
          <Users className="h-4 w-4 text-teal-300" />
          {entries.length} patient{entries.length === 1 ? "" : "s"}
        </div>

        {query.isLoading ? (
          <LoadingPanel
            compact
            className="px-5 py-8"
            message="Loading the patient directory."
            surface={false}
            title="Fetching patients"
          />
        ) : query.isError ? (
          <div className="px-5 py-6 text-sm text-red-300">
            {query.error.message}
          </div>
        ) : entries.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th className="px-5 py-3">Patient #</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Gender</th>
                  <th className="px-5 py-3">National ID</th>
                  <th className="px-5 py-3">Last visit</th>
                  <th className="px-5 py-3">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {entries.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.03]">
                    <td className="px-5 py-3 font-mono font-semibold text-teal-300">
                      {p.patientNumber ?? "—"}
                    </td>
                    <td className="px-5 py-3 font-medium text-white">
                      {p.name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-300">
                      {p.phone ?? "—"}
                    </td>
                    <td className="px-5 py-3 capitalize text-slate-300">
                      {p.gender ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-300">
                      {p.nationalId ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {formatDate(p.lastVisitAt)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          p.kind === "account"
                            ? "bg-sky-400/15 text-sky-300"
                            : "bg-emerald-400/15 text-emerald-300"
                        }`}
                      >
                        {p.kind === "account" ? "Account" : "Profile"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-sm text-slate-400">
            {debounced
              ? "No patients match this search."
              : "No patients registered yet."}
          </div>
        )}
      </div>
    </section>
  );
}
