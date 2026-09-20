import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  CircleUserRound,
  Mail,
  Phone,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { AppShell } from "@/components/medmap/AppShell";
import {
  usePeopleOrganisation,
  type OrganisationEmployee,
} from "@/lib/people-organization-dashboard";
import { cn } from "@/lib/utils";

function formatDate(value: string | null) {
  if (!value) return "Not provided";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en-ZA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
}

function displayName(employee: OrganisationEmployee) {
  return `${employee.first_name} ${employee.last_name}`.trim();
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-[#f7f9fb] p-4 text-[11px] text-slate-400">
      {children}
    </p>
  );
}

function ErrorState() {
  return (
    <p className="rounded-xl border border-[#f0cdca] bg-[#fff8f7] p-4 text-[11px] text-[#a34f4b]">
      Unable to load organisation data.
    </p>
  );
}

function EmployeeSummary({ employee }: { employee: OrganisationEmployee }) {
  const teamLabel = employee.team?.name ?? employee.team_id ?? "Not provided";
  const departmentLabel =
    employee.department?.name ?? employee.department_id ?? "Not provided";
  const roleLabel = employee.role?.name ?? employee.role_id ?? "Not provided";
  const managerLabel = employee.manager
    ? displayName(employee.manager)
    : employee.manager_id ?? "Not provided";

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e7e0ff] text-[11px] font-bold text-[#755bc0]">
            {displayName(employee)
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#755bc0]">
              Backend employee record
            </p>
            <h2 className="mt-1 font-display text-[22px] font-bold tracking-[-0.04em] text-[#152239]">
              {displayName(employee)}
            </h2>
            <p className="mt-1 text-[12px] text-slate-500">
              {employee.job_title || "Job title not provided"}
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit rounded-full bg-[#e8f8f2] px-2.5 py-1 text-[10px] font-bold text-[#168465]">
          {employee.employee_status || "Status not provided"}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Role" value={roleLabel} icon={BriefcaseBusiness} />
        <Detail label="Department" value={departmentLabel} icon={Building2} />
        <Detail label="Team" value={teamLabel} icon={UsersRound} />
        <Detail label="Manager" value={managerLabel} icon={CircleUserRound} />
        <Detail label="Email" value={employee.email ?? "Not provided"} icon={Mail} />
        <Detail label="Phone" value={employee.phone ?? "Not provided"} icon={Phone} />
        <Detail label="Start date" value={formatDate(employee.start_date)} icon={CircleUserRound} />
        <Detail label="End date" value={formatDate(employee.end_date)} icon={CircleUserRound} />
      </div>

      <div className="mt-5 rounded-xl border border-slate-100 bg-[#f7f9fb] p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-[#4a87c9]" />
          <p className="text-[11px] font-bold text-slate-700">Backend permissions</p>
        </div>
        {employee.permissions.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {employee.permissions.map((permission) => (
              <span
                key={permission.id}
                className="rounded-full bg-white px-2.5 py-1 text-[9px] font-bold text-slate-500"
              >
                {permission.name}
              </span>
            ))}
          </div>
        ) : employee.permissionIds.length ? (
          <p className="mt-2 text-[10px] text-slate-400">
            {employee.permissionIds.length} permission reference
            {employee.permissionIds.length === 1 ? "" : "s"} returned; names are unavailable.
          </p>
        ) : (
          <p className="mt-2 text-[10px] text-slate-400">
            No permission records are currently associated.
          </p>
        )}
      </div>

      <p className="mt-4 text-[10px] leading-5 text-slate-400">
        This directory is read-only in this phase. Employee changes remain governed by backend permissions and policies.
      </p>
    </article>
  );
}

function Detail({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl bg-[#f7f9fb] p-3">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={13} />
        <p className="text-[10px] font-medium">{label}</p>
      </div>
      <p className="mt-2 break-words text-[11px] font-bold text-slate-700">{value}</p>
    </div>
  );
}

export default function People() {
  const { data, isPending, isError } = usePeopleOrganisation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const employees = data?.employees ?? [];

  useEffect(() => {
    if (!employees.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !employees.some((employee) => employee.id === selectedId)) {
      setSelectedId(employees[0].id);
    }
  }, [employees, selectedId]);

  const selected = employees.find((employee) => employee.id === selectedId) ?? null;
  const activeEmployees = employees.filter((employee) =>
    employee.employee_status.toLowerCase() === "active",
  ).length;

  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-5 pb-12 pt-8 sm:px-8 xl:px-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#755bc0]">
              <CircleUserRound size={13} /> People & organisation
            </div>
            <h1 className="font-display text-[32px] font-bold tracking-[-0.06em] text-[#152239] sm:text-[39px]">
              The current employee directory.
            </h1>
            <p className="mt-2 max-w-[740px] text-[13px] leading-6 text-slate-500">
              Employee, role, department, team and reporting information returned for the authenticated organisation.
            </p>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">
            Supabase-backed · organisation scoped
          </span>
        </div>

        {isPending ? (
          <p className="mt-7 rounded-xl bg-[#f7f9fb] p-4 text-[11px] text-slate-400">
            Loading organisation data...
          </p>
        ) : isError ? (
          <div className="mt-7">
            <ErrorState />
          </div>
        ) : (
          <>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <Summary label="Employees" value={String(employees.length)} detail="Backend records" />
              <Summary label="Active employees" value={String(activeEmployees)} detail="Current employee status" />
              <Summary label="Departments" value={String(data?.departments.length ?? 0)} detail="Organisation records" />
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(280px,.7fr)_minmax(0,1.3fr)]">
              <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_5px_20px_rgba(21,36,58,0.035)]">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <p className="text-[12px] font-bold text-slate-700">Employee directory</p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {employees.length} backend employee record{employees.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="grid size-8 place-items-center rounded-lg bg-[#f1edff] text-[#755bc0]">
                    <UsersRound size={15} />
                  </span>
                </div>
                <div className="mt-4 space-y-1.5">
                  {employees.map((employee) => (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => setSelectedId(employee.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl p-2 text-left transition",
                        selected?.id === employee.id
                          ? "bg-[#f1edff]"
                          : "hover:bg-slate-50",
                      )}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e7e0ff] text-[10px] font-bold text-[#755bc0]">
                        {displayName(employee)
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-bold text-slate-700">
                          {displayName(employee)}
                        </span>
                        <span className="mt-1 block truncate text-[10px] text-slate-400">
                          {employee.job_title || employee.role?.name || "Role not provided"}
                        </span>
                      </span>
                      <span className="shrink-0 text-[9px] font-bold text-slate-400">
                        {employee.employee_status || "Unknown"}
                      </span>
                    </button>
                  ))}
                  {!employees.length && (
                    <EmptyState>No employees are currently recorded.</EmptyState>
                  )}
                </div>
              </section>

              {selected ? (
                <EmployeeSummary employee={selected} />
              ) : (
                <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
                  <EmptyState>No employees are currently recorded.</EmptyState>
                </section>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Summary({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className="mt-2 font-display text-[25px] font-bold tracking-[-0.06em] text-[#152239]">{value}</p>
      <p className="mt-1 text-[10px] font-semibold text-[#168465]">{detail}</p>
    </div>
  );
}
