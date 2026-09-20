import { useEffect } from "react";
import { ArrowRight, Building2, Database, ShieldAlert, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/medmap/AppShell";
import {
  usePeopleOrganisation,
  type OrganisationDepartment,
  type OrganisationEmployee,
  type OrganisationTeam,
} from "@/lib/people-organization-dashboard";

type ModuleKey = "ambassadors" | "sales" | "customer-operations" | "technology" | "risk" | "reports" | "admin" | "organization";

const moduleContent: Record<Exclude<ModuleKey, "organization">, { eyebrow: string; title: string; description: string; owner: string; next: string; links: { label: string; to: string }[] }> = {
  ambassadors: { eyebrow: "Operations · Ambassador Programme", title: "Ambassador cohorts, referrals and monthly performance.", description: "Cohort and commission rules belong here, with monthly tier history preserved. No ambassador activity is shown until real ambassador records are connected.", owner: "COO · Kuhlula Madumo", next: "Awaiting live ambassador records and referral activity.", links: [{ label: "Open COO tickets", to: "/meetings" }, { label: "Open finance", to: "/finance" }] },
  sales: { eyebrow: "Operations · Sales", title: "Sales is separate from ambassador acquisition.", description: "This module will track the doctor upsell pipeline, patient conversion, owners, follow-ups and revenue by stage. Conversion assumptions will be configuration, not permanent facts.", owner: "COO · Kuhlula Madumo", next: "Awaiting live sales leads and conversion records.", links: [{ label: "Open COO tickets", to: "/meetings" }, { label: "Open company KPIs", to: "/kpis" }] },
  "customer-operations": { eyebrow: "Operations · Customer Operations", title: "Cases, SLAs and resolution ownership.", description: "Customer Operations is modelled as cases rather than generic tickets. Case records will include patient/doctor context, response timestamps, SLA, escalation and resolution.", owner: "COO · Kuhlula Madumo", next: "Awaiting live customer case records.", links: [{ label: "Open operations work", to: "/operations" }, { label: "Record a meeting", to: "/meetings" }] },
  technology: { eyebrow: "Technology · Product, Engineering & Security", title: "Technology delivery with blockers visible.", description: "The current CTO delivery queue is connected. Product roadmap, engineering backlog, security findings, infrastructure and AWS migration remain separate records as they are added.", owner: "CTO · Selaelo Princess Langa", next: "Current blockers are shown on Meetings & deadlines and the command centre.", links: [{ label: "Open technology queue", to: "/meetings" }, { label: "Open command centre", to: "/" }] },
  risk: { eyebrow: "Risk & Governance", title: "Risk, compliance and governance actions.", description: "This module will hold the risk register, owners, mitigation, POPIA/PAIA controls, policies, security incidents and overdue governance actions.", owner: "CEO · Ofentse Mashau", next: "Awaiting governed risk and compliance records.", links: [{ label: "Open company KPIs", to: "/kpis" }, { label: "Open technology", to: "/technology" }] },
  reports: { eyebrow: "Reporting", title: "Reports built from connected records.", description: "Daily, weekly and monthly views will be calculated from KPIs, finance, acquisition, cases, tickets and technology records. No report is populated with synthetic production activity.", owner: "CEO · Ofentse Mashau", next: "Awaiting the live MedMap API/database connection.", links: [{ label: "Open company KPIs", to: "/kpis" }, { label: "Open finance", to: "/finance" }] },
  admin: { eyebrow: "Settings · Administration", title: "Controlled business configuration.", description: "Targets, thresholds, commission rules, pricing, probation, dormancy and booking rules should be changed here by authorised users rather than in source code.", owner: "CEO · Ofentse Mashau", next: "Prototype permissions remain local; backend authentication/RBAC is still required for production enforcement.", links: [{ label: "Open company KPIs", to: "/kpis" }, { label: "Open People & goals", to: "/people" }] },
};

function ErrorState() {
  return (
    <p className="rounded-xl border border-[#f0cdca] bg-[#fff8f7] p-4 text-[11px] text-[#a34f4b]">
      Unable to load organisation data.
    </p>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-[#f7f9fb] p-4 text-[11px] text-slate-400">{children}</p>;
}

function employeeName(employee: OrganisationEmployee) {
  return `${employee.first_name} ${employee.last_name}`.trim();
}

function OrganizationPage() {
  const { data, isPending, isError } = usePeopleOrganisation();
  const departments = data?.departments ?? [];
  const employees = data?.employees ?? [];
  const teams = data?.teams ?? [];

  if (isPending) {
    return <OrganizationShell><p className="rounded-xl bg-[#f7f9fb] p-4 text-[11px] text-slate-400">Loading organisation data...</p></OrganizationShell>;
  }

  if (isError) {
    return <OrganizationShell><ErrorState /></OrganizationShell>;
  }

  return (
    <OrganizationShell>
      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Departments" value={String(departments.length)} detail="Backend records" />
        <Summary label="Teams" value={String(teams.length)} detail="Resolved by department" />
        <Summary label="Employees" value={String(employees.length)} detail="Current organisation scope" />
      </div>

      <section className="mt-5 rounded-2xl border border-[#c9d7ec] bg-[#f7faff] p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-[#eaf3ff] text-[#4a87c9]"><Building2 size={16} /></span>
          <div>
            <h2 className="font-display text-[16px] font-bold text-[#152239]">Current Organisation</h2>
            <p className="mt-1 text-[11px] text-slate-500">Departments, teams and employees resolved from the authenticated organisation.</p>
          </div>
        </div>
        {!departments.length ? (
          <div className="mt-5"><EmptyState>No departments are currently recorded.</EmptyState></div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {departments.map((department) => (
              <DepartmentCard
                key={department.id}
                department={department}
                teams={teams.filter((team) => team.department_id === department.id)}
                employees={employees.filter((employee) => employee.department_id === department.id)}
              />
            ))}
          </div>
        )}
      </section>
    </OrganizationShell>
  );
}

function OrganizationShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-5 pb-12 pt-8 sm:px-8 xl:px-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#4a87c9]"><Database size={13} /> Executive · Organisation</div>
            <h1 className="font-display text-[32px] font-bold tracking-[-0.06em] text-[#152239] sm:text-[39px]">The current organisation structure.</h1>
            <p className="mt-2 max-w-[760px] text-[13px] leading-6 text-slate-500">A read-only view of backend departments, teams and employee relationships for the authenticated organisation.</p>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Supabase-backed · organisation scoped</span>
        </div>
        <div className="mt-7">{children}</div>
      </div>
    </AppShell>
  );
}

function DepartmentCard({
  department,
  teams,
  employees,
}: {
  department: OrganisationDepartment;
  teams: OrganisationTeam[];
  employees: OrganisationEmployee[];
}) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#4a87c9]">{department.code}</p>
          <h3 className="mt-1 font-display text-[18px] font-bold tracking-[-0.04em] text-[#152239]">{department.name}</h3>
          {department.department_group && <p className="mt-1 text-[10px] font-semibold text-slate-400">{department.department_group}</p>}
        </div>
        <span className={department.active ? "rounded-full bg-[#e8f8f2] px-2.5 py-1 text-[9px] font-bold text-[#168465]" : "rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-500"}>
          {department.active ? "Active" : "Inactive"}
        </span>
      </div>
      {department.description && <p className="mt-3 text-[11px] leading-5 text-slate-500">{department.description}</p>}

      <div className="mt-5">
        <div className="flex items-center gap-2"><UsersRound size={14} className="text-[#755bc0]" /><p className="text-[11px] font-bold text-slate-700">Teams</p></div>
        {teams.length ? (
          <div className="mt-3 space-y-2">
            {teams.map((team) => <TeamRow key={team.id} team={team} employees={employees.filter((employee) => employee.team_id === team.id)} />)}
          </div>
        ) : <div className="mt-3"><EmptyState>No teams are currently recorded for this department.</EmptyState></div>}
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-2"><UsersRound size={14} className="text-[#1f9d80]" /><p className="text-[11px] font-bold text-slate-700">Employees</p></div>
        {employees.length ? (
          <div className="mt-3 space-y-2">
            {employees.map((employee) => <EmployeeRow key={employee.id} employee={employee} />)}
          </div>
        ) : <div className="mt-3"><EmptyState>No employees are currently recorded in this department.</EmptyState></div>}
      </div>
    </article>
  );
}

function TeamRow({ team, employees }: { team: OrganisationTeam; employees: OrganisationEmployee[] }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-[#f7f9fb] p-3">
      <div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold text-slate-700">{team.name}</p>{team.description && <p className="mt-1 text-[10px] leading-5 text-slate-400">{team.description}</p>}</div><span className="text-[9px] font-bold text-slate-400">{team.active ? "Active" : "Inactive"}</span></div>
      <p className="mt-2 text-[10px] text-slate-400">{employees.length} employee{employees.length === 1 ? "" : "s"}</p>
    </div>
  );
}

function EmployeeRow({ employee }: { employee: OrganisationEmployee }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e7e0ff] text-[9px] font-bold text-[#755bc0]">{employeeName(employee).split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
      <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-bold text-slate-700">{employeeName(employee)}</p><p className="mt-1 text-[10px] text-slate-400">{employee.job_title || employee.role?.name || "Role not provided"}</p>{employee.manager && <p className="mt-1 text-[10px] text-slate-400">Reports to {employeeName(employee.manager)}</p>}</div>
      <span className="shrink-0 text-[9px] font-bold text-slate-400">{employee.employee_status || "Unknown"}</span>
    </div>
  );
}

function LegacyModulePage({ module }: { module: Exclude<ModuleKey, "organization"> }) {
  const content = moduleContent[module];
  return <AppShell><div className="mx-auto max-w-[1200px] px-5 pb-12 pt-8 sm:px-8 xl:px-10"><div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#4a87c9]"><Database size={13} /> {content.eyebrow}</div><h1 className="max-w-[820px] font-display text-[32px] font-bold tracking-[-0.06em] text-[#152239] sm:text-[39px]">{content.title}</h1><p className="mt-3 max-w-[760px] text-[13px] leading-6 text-slate-500">{content.description}</p><div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]"><section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-[#fff2d9] text-[#b3781f]"><ShieldAlert size={16} /></span><h2 className="font-display text-[16px] font-bold text-[#152239]">Current data state</h2></div><p className="mt-3 text-[12px] leading-6 text-slate-500">{content.next}</p><div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-[#f7f9fb] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Accountable owner</p><p className="mt-2 text-[13px] font-bold text-slate-700">{content.owner}</p></div><div className="mt-5 space-y-2">{content.links.map((link) => <Link key={link.to} to={link.to} className="flex items-center justify-between rounded-xl border border-slate-100 bg-[#f7f9fb] px-3 py-3 text-[11px] font-bold text-slate-600 transition hover:border-[#bfe9da] hover:bg-[#f2fcf8]">{link.label}<ArrowRight size={14} className="text-[#1f9d80]" /></Link>)}</div></section></div></div></AppShell>;
}

export default function ModulePage({ module }: { module: ModuleKey }) {
  return module === "organization" ? <OrganizationPage /> : <LegacyModulePage module={module} />;
}

function Summary({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-slate-200/80 bg-white p-4"><p className="text-[10px] text-slate-400">{label}</p><p className="mt-2 font-display text-[25px] font-bold tracking-[-0.06em] text-[#152239]">{value}</p><p className="mt-1 text-[10px] font-semibold text-[#168465]">{detail}</p></div>;
}
