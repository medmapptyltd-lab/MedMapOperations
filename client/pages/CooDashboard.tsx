import { Link } from "react-router-dom";
import { useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  ClipboardList,
  Clock3,
  LifeBuoy,
  Link2,
  Sparkles,
  Target,
  Users,
  UsersRound,
} from "lucide-react";
import { AppShell } from "@/components/medmap/AppShell";
import { cn } from "@/lib/utils";
import { TaskManagementCentre } from "@/pages/Operations";
import {
  buildDepartmentWorkload,
  buildEmployeeWorkload,
  buildKpiWorkload,
  buildOperationsSummary,
  displayEmployeeName,
  isTaskActive,
  isTaskOverdue,
  useOperationsDashboard,
  type OperationsCase,
  type OperationsEmployee,
  type OperationsTask,
} from "@/lib/operations-dashboard";
import { useOperationsTaskActions, useCasesMutations } from "@/lib/crud";
import {
  buildKpiRows,
  isOverdueTimestamp,
  isResolvedStatus,
  normaliseStatus,
  statusToDisplay,
  useExecutiveAlerts,
  useExecutiveSummary,
  type DashboardScope,
} from "@/lib/executive-dashboard";

type CooScope = DashboardScope & { executiveEmployeeId?: string };

type Tone = "mint" | "red" | "amber" | "navy";

type MetricProps = {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
  icon: React.ElementType;
};

function formatLiveDate(value: string | null) {
  if (!value) return "Date not provided";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en-ZA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
}

function priorityClass(priority: string) {
  const value = priority.trim().toLowerCase();
  if (["critical", "urgent"].includes(value)) return "bg-[#ffe5e3] text-[#bd504d]";
  if (["high"].includes(value)) return "bg-[#fff2d9] text-[#9a6419]";
  if (["normal", "medium"].includes(value)) return "bg-[#eaf3ff] text-[#4a87c9]";
  return "bg-slate-100 text-slate-500";
}

function statusClass(status: string) {
  const value = status.trim().toLowerCase();
  if (isResolvedStatus(status)) return "bg-[#e8f8f2] text-[#168465]";
  if (["critical", "blocked", "failed", "overdue", "cancelled", "closed"].includes(value))
    return "bg-[#ffe5e3] text-[#bd504d]";
  if (["pending", "pending_customer", "pending_internal", "at risk", "warning"].includes(value))
    return "bg-[#fff2d9] text-[#9a6419]";
  if (["assigned", "in progress", "started", "in_progress", "escalated", "open"].includes(value))
    return "bg-[#f1edff] text-[#755bc0]";
  return "bg-slate-100 text-slate-500";
}

function caseStatusClass(status: string) {
  const value = status.trim().toLowerCase();
  if (["resolved", "closed"].includes(value)) return "bg-[#e8f8f2] text-[#168465]";
  if (["cancelled"].includes(value)) return "bg-[#ffe5e3] text-[#bd504d]";
  if (["pending_customer", "pending_internal"].includes(value)) return "bg-[#fff2d9] text-[#9a6419]";
  if (["escalated", "in_progress", "open"].includes(value)) return "bg-[#f1edff] text-[#755bc0]";
  return "bg-slate-100 text-slate-500";
}

function Metric({ label, value, detail, tone, icon: Icon }: MetricProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_5px_20px_rgba(21,36,58,0.035)]">
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "grid size-9 place-items-center rounded-xl",
            tone === "mint" && "bg-[#e8f8f2] text-[#1b9975]",
            tone === "red" && "bg-[#ffe9e6] text-[#bf5b56]",
            tone === "amber" && "bg-[#fff2d9] text-[#b3781f]",
            tone === "navy" && "bg-[#eaf0f8] text-[#2f527a]",
          )}
        >
          <Icon size={17} />
        </span>
        <span
          className={cn(
            "size-1.5 rounded-full",
            tone === "mint"
              ? "bg-[#36ac87]"
              : tone === "red"
                ? "bg-[#da6560]"
                : tone === "amber"
                  ? "bg-[#e0a03a]"
                  : "bg-[#4a87c9]",
          )}
        />
      </div>
      <p className="mt-4 text-[11px] font-medium text-slate-500">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-[26px] font-bold tracking-[-0.06em]",
          tone === "red" ? "text-[#c1514d]" : "text-[#152239]",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] text-slate-400">{detail}</p>
    </div>
  );
}

function StateMessage({
  children,
  tone = "empty",
  onRetry,
}: {
  children: React.ReactNode;
  tone?: "empty" | "error";
  onRetry?: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-3 text-[11px] leading-5",
        tone === "error"
          ? "border border-[#f0cdca] bg-[#fff8f7] text-[#a34f4b]"
          : "bg-[#f7f9fb] text-slate-400",
      )}
    >
      <p>{children}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-lg bg-[#bd504d] px-3 py-1.5 text-[10px] font-bold text-white hover:bg-[#a34f4b]"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  pillText,
  pillTone = "mint",
  linkHref,
  linkLabel,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  pillText?: string;
  pillTone?: "mint" | "amber" | "red";
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-[#fff1e9] text-[#d4784f]">
            <Icon size={16} />
          </span>
          <h2 className="font-display text-[16px] font-bold text-[#152239]">{title}</h2>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        {pillText ? (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-bold",
              pillTone === "mint" && "bg-[#e8f8f2] text-[#168465]",
              pillTone === "amber" && "bg-[#fff2d9] text-[#9a6419]",
              pillTone === "red" && "bg-[#ffe5e3] text-[#bd504d]",
            )}
          >
            {pillText}
          </span>
        ) : null}
        {linkHref && linkLabel ? (
          <Link
            to={linkHref}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1c9574]"
          >
            {linkLabel} <ChevronRight size={13} />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function OperationsWorkload({
  summary,
  tasks,
  cases,
  deadlines,
}: {
  summary: ReturnType<typeof buildOperationsSummary>;
  tasks: OperationsTask[];
  cases: OperationsCase[];
  deadlines: NonNullable<
    ReturnType<typeof useOperationsDashboard>["data"]
  >["deadlines"];
}) {
  const openCases = cases.filter(
    (c) => !["resolved", "closed", "cancelled"].includes(c.status.trim().toLowerCase()),
  ).length;
  const slaBreached = cases.filter((c) =>
    (c.sla_response_due_at &&
      !["resolved", "closed", "cancelled"].includes(c.status.trim().toLowerCase()) &&
      isOverdueTimestamp(c.sla_response_due_at, c.status)) ||
    (c.sla_resolution_due_at &&
      !["resolved", "closed", "cancelled"].includes(c.status.trim().toLowerCase()) &&
      isOverdueTimestamp(c.sla_resolution_due_at, c.status)),
  ).length;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric
        label="Open tasks"
        value={String(summary.activeTaskCount)}
        detail={`${summary.overdueTaskCount} overdue · ${summary.dueSoonTaskCount} due soon`}
        tone={summary.overdueTaskCount ? "red" : "mint"}
        icon={CheckSquare}
      />
      <Metric
        label="Open cases"
        value={String(openCases)}
        detail={slaBreached ? `${slaBreached} SLA-breached` : "Within SLA targets"}
        tone={slaBreached ? "red" : "mint"}
        icon={ClipboardList}
      />
      <Metric
        label="Active deadlines"
        value={String(summary.activeDeadlineCount)}
        detail={`${summary.overdueDeadlineCount} overdue · ${summary.dueSoonDeadlineCount} due soon`}
        tone={summary.overdueDeadlineCount ? "red" : "amber"}
        icon={CalendarDays}
      />
      <Metric
        label="Alerts"
        value={String(summary.alertCount)}
        detail="Company-wide operational signals"
        tone={summary.alertCount ? "amber" : "navy"}
        icon={AlertCircle}
      />
    </div>
  );
}

function ActiveCasesList({
  cases,
  employees,
}: {
  cases: OperationsCase[];
  employees: OperationsEmployee[];
}) {
  const [caseFilter, setCaseFilter] = useState("All");
  const CASE_STATUSES = ["open", "in_progress", "pending_customer", "pending_internal", "escalated", "resolved", "closed", "cancelled"];
  const caseStatuses = ["All", ...CASE_STATUSES];
  const filtered = caseFilter === "All" ? cases : cases.filter((c) => c.status === caseFilter);
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_5px_20px_rgba(21,36,58,0.035)]">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <SectionHeader
          icon={ClipboardList}
          title="Customer operations"
          description="Live customer cases with status and assignment visibility."
          linkHref="/customer-operations"
          linkLabel="Open Customer Operations"
        />
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {caseStatuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setCaseFilter(s)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-[10px] font-bold",
                caseFilter === s ? "bg-white text-[#755bc0] shadow-sm" : "text-slate-400",
              )}
            >
              {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5 sm:p-6">
        {!filtered.length ? (
          <StateMessage>No customer cases match this filter.</StateMessage>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                  <th className="pb-3 font-bold">Case</th>
                  <th className="px-3 pb-3 font-bold">Assigned</th>
                  <th className="px-3 pb-3 font-bold">Priority</th>
                  <th className="px-3 pb-3 font-bold">Status</th>
                  <th className="px-3 pb-3 font-bold">SLA</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 6).map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 text-[11px] last:border-0">
                    <td className="py-3 pr-3">
                      <p className="font-bold text-slate-700">{c.subject || "Untitled case"}</p>
                      <p className="mt-1 text-[10px] text-slate-400 line-clamp-1">
                        {c.description || "No description provided."}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-slate-500">
                      {displayEmployeeName(employees, c.assigned_to_employee_id)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-1 text-[10px] font-bold",
                          priorityClass(c.priority),
                        )}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-1 text-[10px] font-bold",
                          caseStatusClass(c.status),
                        )}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {c.sla_resolution_due_at ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock3 size={12} /> {formatLiveDate(c.sla_resolution_due_at)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">No SLA</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function PipelineSummary({
  label,
  icon: Icon,
  path,
  countLabel,
  countValue,
  tone = "navy",
  detail,
}: {
  label: string;
  icon: React.ElementType;
  path: string;
  countLabel: string;
  countValue: string;
  tone?: "navy" | "mint" | "amber" | "red";
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "grid size-8 place-items-center rounded-lg",
                tone === "navy" && "bg-[#eaf0f8] text-[#2f527a]",
                tone === "mint" && "bg-[#e8f8f2] text-[#1b9975]",
                tone === "amber" && "bg-[#fff2d9] text-[#b3781f]",
                tone === "red" && "bg-[#ffe9e6] text-[#bf5b56]",
              )}
            >
              <Icon size={16} />
            </span>
            <h3 className="font-display text-[14px] font-bold text-[#152239]">{label}</h3>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">{detail}</p>
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-[#f7f9fb] p-3">
        <p className="text-[10px] font-medium text-slate-400">{countLabel}</p>
        <p className="mt-1 font-display text-[22px] font-bold text-[#152239]">{countValue}</p>
      </div>
      <Link
        to={path}
        className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-[#1c9574]"
      >
        Open {label} <ChevronRight size={13} />
      </Link>
    </article>
  );
}

function KpiSummary({ scope }: { scope: DashboardScope }) {
  const summary = useExecutiveSummary(scope);
  const { people, kpis } = summary;
  const { rows: kpiRows, period: kpiPeriod } = buildKpiRows(kpis.data);
  const display = statusToDisplay;
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <SectionHeader
        icon={Target}
        title="KPI snapshot"
        description="Live KPI targets and actuals for operations-owned measures."
        pillText={kpiPeriod?.period_name || "Current period"}
        linkHref="/kpis"
        linkLabel="Open KPIs"
      />
      <div className="mt-5 space-y-3">
        {kpis.isPending && <StateMessage>Loading KPI snapshot…</StateMessage>}
        {kpis.isError && <StateMessage tone="error">KPI snapshot unavailable.</StateMessage>}
        {!kpis.isPending && !kpis.isError && !kpiRows.length && (
          <StateMessage>No KPI records are scoped to operations.</StateMessage>
        )}
        {!kpis.isPending && !kpis.isError && kpiRows.length > 0 && (
          kpiRows.slice(0, 5).map((row) => {
            const tone = display(row.status);
            return (
              <div key={row.id} className="rounded-xl border border-slate-100 bg-[#f8fafc] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold text-slate-700">{row.name}</p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Target {row.target ?? "—"} · Actual {row.actual ?? "—"}
                      {row.unit ? ` ${row.unit}` : ""}
                    </p>
                  </div>
                  {tone ? (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-1 text-[10px] font-bold",
                        tone === "healthy" && "bg-[#e4f8f0] text-[#15805f]",
                        tone === "attention" && "bg-[#fff2d9] text-[#9a6419]",
                        tone === "critical" && "bg-[#ffe5e3] text-[#bd504d]",
                      )}
                    >
                      {row.calculatedPercentage !== null ? `${Math.round(row.calculatedPercentage)}%` : row.status || "Pending"}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}

function PeopleList({ scope }: { scope: DashboardScope }) {
  const summary = useExecutiveSummary(scope);
  const employees = summary.people.data?.employees ?? [];
  const active = employees.filter((e) => normaliseStatus(e.employee_status) === "active");
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <SectionHeader
        icon={UsersRound}
        title="Operations team"
        description="Active employees scoped to operations and owned departments."
        pillText={`${active.length} active`}
        linkHref="/people"
        linkLabel="Open People"
      />
      <div className="mt-5 space-y-2">
        {summary.people.isPending && <StateMessage>Loading team directory…</StateMessage>}
        {summary.people.isError && <StateMessage tone="error">Team directory unavailable.</StateMessage>}
        {!summary.people.isPending && !summary.people.isError && !active.length && (
          <StateMessage>No employees are scoped to operations.</StateMessage>
        )}
        {!summary.people.isPending && !summary.people.isError && active.slice(0, 8).map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-[#f8fafc] p-3">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold text-slate-700">
                {`${e.first_name} ${e.last_name}`.trim()}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-slate-400">
                {e.job_title || "Active team member"}
              </p>
            </div>
            <span className="rounded-full bg-[#e8f8f2] px-2 py-1 text-[10px] font-bold text-[#168465]">Active</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function MeetingsDeadlines({
  scope,
  deadlines,
}: {
  scope: DashboardScope;
  deadlines: NonNullable<
    ReturnType<typeof useOperationsDashboard>["data"]
  >["deadlines"];
}) {
  const active = deadlines
    .filter((d) => !isResolvedStatus(d.status))
    .sort((a, b) => a.due_at.localeCompare(b.due_at))
    .slice(0, 5);
  const employees = useOperationsDashboard(scope).data?.employees ?? [];
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <SectionHeader
        icon={CalendarDays}
        title="Meetings & deadlines"
        description="Upcoming owned deadlines sorted by due time."
        pillText={`${active.length} pending`}
        pillTone={active.some((d) => isOverdueTimestamp(d.due_at, d.status)) ? "red" : "amber"}
        linkHref="/meetings"
        linkLabel="Open Meetings"
      />
      <div className="mt-5 space-y-2">
        {!active.length && <StateMessage>No scoped deadlines are pending.</StateMessage>}
        {active.map((d) => {
          const overdue = isOverdueTimestamp(d.due_at, d.status);
          return (
            <div key={d.id} className="rounded-xl border border-slate-100 bg-[#f8fafc] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-slate-700">{d.title}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {displayEmployeeName(employees as never, d.owner_employee_id)} · {formatLiveDate(d.due_at)}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-1 text-[10px] font-bold",
                    overdue ? "bg-[#ffe5e3] text-[#bd504d]" : statusClass(d.status),
                  )}
                >
                  {overdue ? "Overdue" : d.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function MakeIntervalAlert({ caseError }: { caseError: unknown }) {
  const show =
    caseError instanceof Error && caseError.message.includes("make_interval");
  if (!show) return null;
  return (
    <div className="mb-5 rounded-2xl border border-[#f0cdca] bg-[#fff8f7] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#bd504d]" />
        <div>
          <p className="text-[12px] font-bold text-[#8a3935]">
            Database blocker: New case SLA trigger
          </p>
          <p className="mt-1 text-[11px] leading-5 text-[#a34f4b]">
            Case creation is currently blocked by a Postgres type mismatch in the
            SLA trigger. A database administrator must cast the numeric SLA-hours
            column to integer inside the trigger body. Until then case writes will
            surface this error. Existing cases remain readable.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CooDashboard({ scope }: { scope: CooScope }) {
  const opsScope: DashboardScope = {
    departmentIds: scope.departmentIds,
    employeeId: scope.executiveEmployeeId,
  };
  const dashboard = useOperationsDashboard(opsScope);
  const exec = useExecutiveSummary(opsScope);
  const alerts = useExecutiveAlerts(opsScope);
  const taskActions = useOperationsTaskActions();
  const caseMutations = useCasesMutations();
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddCase, setShowAddCase] = useState(false);

  const data = dashboard.data;
  const summary = buildOperationsSummary(data);
  const departmentWorkload = buildDepartmentWorkload(data);
  const employeeWorkload = buildEmployeeWorkload(data);
  const kpiWorkload = buildKpiWorkload(data);
  const employees = data?.employees ?? [];
  const tasks = data?.tasks ?? [];
  const cases = data?.cases ?? [];
  const deadlines = data?.deadlines ?? [];
  const alertRows = (alerts.data ?? []).filter(
    (a) => !isResolvedStatus(a.status),
  );
  const activeTasks = tasks
    .filter((t) => isTaskActive(t))
    .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t)).length;

  const activeEmployees = employees.filter(
    (e) => normaliseStatus(e.employee_status) === "active",
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-5 pb-12 pt-8 sm:px-8 xl:px-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#d4784f]">
              <Briefcase size={13} /> Chief Operating Officer · Operations scoped
            </div>
            <h1 className="font-display text-[32px] font-bold tracking-[-0.06em] text-[#152239] sm:text-[39px]">
              Run operations. Deliver accountability.
            </h1>
            <p className="mt-2 max-w-[700px] text-[13px] leading-6 text-slate-500">
              Scoped operations, customer-operations, sales, doctor-acquisition,
              ambassador, meetings and KPI workloads from the authenticated
              organisation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddTask(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4a87c9] px-3.5 py-2.5 text-[11px] font-bold text-white shadow-[0_5px_12px_rgba(20,35,58,.15)] hover:bg-[#3c6fa8]"
            >
              <CheckSquare size={15} /> New task
            </button>
            <button
              onClick={() => setShowAddCase(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#755bc0] px-3.5 py-2.5 text-[11px] font-bold text-white shadow-[0_5px_12px_rgba(20,35,58,.15)] hover:bg-[#5f47a5]"
            >
              <ClipboardList size={15} /> New case
            </button>
            <Link
              to="/meetings"
              className="inline-flex items-center gap-2 rounded-xl bg-[#182842] px-3.5 py-2.5 text-[11px] font-bold text-white shadow-[0_5px_12px_rgba(20,35,58,.15)] hover:bg-[#233958]"
            >
              <CalendarDays size={15} /> Meetings & deadlines
            </Link>
          </div>
        </div>

        <MakeIntervalAlert caseError={caseMutations.createCase.error} />

        <div className="mt-7">
          {dashboard.isPending || exec.operations.isPending ? (
            <StateMessage>Loading operations workload…</StateMessage>
          ) : dashboard.isError || exec.operations.isError ? (
            <StateMessage tone="error" onRetry={() => { dashboard.refetch(); exec.operations.refetch(); }}>
              Operations workload could not be loaded.
            </StateMessage>
          ) : (
            <OperationsWorkload
              summary={summary}
              tasks={activeTasks}
              cases={cases}
              deadlines={deadlines}
            />
          )}
        </div>

        {alertRows.length > 0 && (
          <div className="mt-5 rounded-2xl border border-[#c9d7ec] bg-[#f7faff] p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
            <SectionHeader
              icon={AlertCircle}
              title="Operations alerts"
              description="Company signals scoped to operations departments."
              pillText={`${alertRows.length} active`}
              pillTone="amber"
            />
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {alertRows.slice(0, 4).map((a) => (
                <div key={a.id} className="rounded-xl border border-slate-100 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[11px] font-bold text-slate-700">{a.title || "Company alert"}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-[10px] font-bold",
                        statusClass(a.severity || a.status),
                      )}
                    >
                      {a.severity || a.status || "Alert"}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] leading-5 text-slate-400">
                    {a.message || "No alert detail provided."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          <PipelineSummary
            label="Sales pipeline"
            icon={Sparkles}
            path="/sales"
            countLabel="Scoped records"
            countValue={exec.people.isPending ? "…" : String(departmentWorkload.length)}
            detail="Sales department activity, opportunities and conversions."
            tone="mint"
          />
          <PipelineSummary
            label="Doctor acquisition"
            icon={Users}
            path="/doctor-acquisition"
            countLabel="Active pipeline"
            countValue={exec.people.isPending ? "…" : String(employeeWorkload.filter((e) => e.jobTitle?.toLowerCase().includes("doctor") || e.jobTitle?.toLowerCase().includes("clinical")).length)}
            detail="Doctor onboarding, credentialling and network growth."
            tone="navy"
          />
          <PipelineSummary
            label="Ambassador programme"
            icon={UsersRound}
            path="/ambassadors"
            countLabel="Cohort activity"
            countValue={exec.people.isPending ? "…" : String(summary.kpiLinkedWorkCount)}
            detail="Ambassador cohorts, tiers and community performance."
            tone="amber"
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <KpiSummary scope={opsScope} />
          <MeetingsDeadlines scope={opsScope} deadlines={deadlines} />
        </div>

        <div className="mt-5">
          <ActiveCasesList cases={cases} employees={employees} />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
            <SectionHeader
              icon={Target}
              title="Department workload"
              description="Active tasks, tickets and deadlines per scoped department."
              linkHref="/operations"
              linkLabel="Open Operations"
            />
            <div className="mt-4 space-y-2">
              {!departmentWorkload.length && <StateMessage>No department workload is available.</StateMessage>}
              {departmentWorkload.slice(0, 6).map((row) => (
                <div key={row.id} className="rounded-xl border border-slate-100 bg-[#f8fafc] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-bold text-slate-700">{row.name}</p>
                    {row.overdueWork ? (
                      <span className="rounded-full bg-[#ffe5e3] px-2 py-1 text-[10px] font-bold text-[#bd504d]">
                        {row.overdueWork} overdue
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {row.activeTasks} active tasks · {row.upcomingDeadlines} due soon
                  </p>
                </div>
              ))}
            </div>
          </section>
          <PeopleList scope={opsScope} />
        </div>

        <div className="mt-5">
          <TaskManagementCentre scope={opsScope} showHeader={true} maxRows={8} />
        </div>

        <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200/70 pt-5 text-[10px] text-slate-400 sm:flex-row">
          <span>MedMap Operating System · COO scoped dashboard</span>
          <span>Operations → Customer ops → Pipeline → People</span>
        </footer>
      </div>
    </AppShell>
  );
}
