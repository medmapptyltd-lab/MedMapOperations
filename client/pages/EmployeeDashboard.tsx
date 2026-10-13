import { Link } from "react-router-dom";
import { useMemo } from "react";
import {
  Briefcase,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  ClipboardList,
  Clock3,
  Crown,
  FolderKanban,
  HardHat,
  Target,
  UsersRound,
} from "lucide-react";
import { AppShell } from "@/components/medmap/AppShell";
import { cn } from "@/lib/utils";
import {
  buildOperationsSummary,
  displayEmployeeName,
  isTaskActive,
  isTaskOverdue,
  useOperationsDashboard,
  type OperationsCase,
  type OperationsDeadline,
  type OperationsEmployee,
  type OperationsTask,
  type OperationsKpiTarget,
  type OperationsKpiResult,
  type OperationsKpi,
  type OperationsKpiPeriod,
} from "@/lib/operations-dashboard";
import { useOperationsTaskActions, useCasesMutations } from "@/lib/crud";
import {
  isOverdueTimestamp,
  isResolvedStatus,
  normaliseStatus,
  type DashboardScope,
} from "@/lib/executive-dashboard";

type EmployeeVariant = "employee" | "department_head" | "manager" | "executive_other";

type EmployeeScope = {
  employeeId: string;
  departmentId?: string;
  departmentIds?: string[];
  teamId?: string;
  managerId?: string;
};

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
  iconBg = "bg-[#eaf3ff]",
  iconColor = "text-[#4a87c9]",
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  pillText?: string;
  pillTone?: "mint" | "amber" | "red" | "navy";
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 sm:items-center">
      <div>
        <div className="flex items-center gap-2">
          <span className={cn("grid size-8 place-items-center rounded-lg", iconBg, iconColor)}>
            <Icon size={16} />
          </span>
          <h2 className="font-display text-[15px] font-bold text-[#152239]">{title}</h2>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">{description}</p>
      </div>
      {pillText ? (
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-bold shrink-0",
            pillTone === "mint" && "bg-[#e8f8f2] text-[#168465]",
            pillTone === "amber" && "bg-[#fff2d9] text-[#9a6419]",
            pillTone === "red" && "bg-[#ffe5e3] text-[#bd504d]",
            pillTone === "navy" && "bg-[#eaf0f8] text-[#2f527a]",
          )}
        >
          {pillText}
        </span>
      ) : null}
    </div>
  );
}

function variantHeader(variant: EmployeeVariant) {
  switch (variant) {
    case "executive_other":
      return {
        eyebrow: "Executive workspace · Owned departments",
        eyebrowClass: "text-[#755bc0]",
        eyebrowIcon: Crown,
        title: "Executive accountability view.",
        subtitle:
          "Owned department aggregates above, personal My-* workstream below. Scope is restricted to departments explicitly assigned to you.",
      };
    case "department_head":
      return {
        eyebrow: "Department head · Team scoped",
        eyebrowClass: "text-[#d4784f]",
        eyebrowIcon: FolderKanban,
        title: "Lead your department. Deliver results.",
        subtitle:
          "Your team's workload aggregates at the top, followed by your personal My-* tasks, cases and KPIs.",
      };
    case "manager":
      return {
        eyebrow: "People manager · Direct reports scoped",
        eyebrowClass: "text-[#b3781f]",
        eyebrowIcon: UsersRound,
        title: "Own your team and your work.",
        subtitle:
          "Team-level summary first, then your personal workstream. All records are scoped to your direct reports and yourself.",
      };
    case "employee":
    default:
      return {
        eyebrow: "My workspace · Personal scope only",
        eyebrowClass: "text-[#1b9975]",
        eyebrowIcon: HardHat,
        title: "My work. My targets. My accountability.",
        subtitle:
          "Personal tasks, cases, deadlines, KPI assignments and team visibility. All records are scoped to your identity.",
      };
  }
}

function AggregateMetrics({
  summary,
  cases,
}: {
  summary: ReturnType<typeof buildOperationsSummary>;
  cases: OperationsCase[];
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
        label="Open team tasks"
        value={String(summary.activeTaskCount)}
        detail={`${summary.overdueTaskCount} overdue · ${summary.dueSoonTaskCount} due soon`}
        tone={summary.overdueTaskCount ? "red" : "mint"}
        icon={CheckSquare}
      />
      <Metric
        label="Open team cases"
        value={String(openCases)}
        detail={slaBreached ? `${slaBreached} SLA-breached` : "Within SLA targets"}
        tone={slaBreached ? "red" : "mint"}
        icon={ClipboardList}
      />
      <Metric
        label="Unresolved deadlines"
        value={String(summary.activeDeadlineCount)}
        detail={`${summary.overdueDeadlineCount} overdue · ${summary.dueSoonDeadlineCount} due soon`}
        tone={summary.overdueDeadlineCount ? "red" : "amber"}
        icon={CalendarDays}
      />
      <Metric
        label="KPI alerts"
        value={String(summary.alertCount)}
        detail="KPI-linked company alerts"
        tone={summary.alertCount ? "amber" : "navy"}
        icon={Target}
      />
    </div>
  );
}

function buildPersonalKpiRows({
  kpis,
  targets,
  results,
  periods,
  employeeId,
}: {
  kpis: OperationsKpi[];
  targets: OperationsKpiTarget[];
  results: OperationsKpiResult[];
  periods: OperationsKpiPeriod[];
  employeeId: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const currentPeriod =
    periods.find(
      (p) =>
        ["current", "active", "open"].includes(normaliseStatus(p.status) ?? "") &&
        p.start_date <= today &&
        p.end_date >= today,
    ) ??
    periods.find(
      (p) => !isResolvedStatus(p.status) && p.start_date <= today && p.end_date >= today,
    ) ??
    null;
  if (!currentPeriod) return { rows: [] as Array<{ id: string; name: string; target: number | null; actual: number | null; status: string; unit: string | null; periodName: string | null }>, period: null as OperationsKpiPeriod | null };
  const rows = targets
    .filter((t) => t.period_id === currentPeriod.id && t.employee_id === employeeId)
    .map((target) => {
      const kpi = kpis.find((k) => k.id === target.kpi_id);
      const result = results.find(
        (r) =>
          r.period_id === currentPeriod.id &&
          (r.target_id === target.id || (!target.id && r.kpi_id === target.kpi_id && r.employee_id === employeeId)),
      );
      return {
        id: target.id,
        name: kpi?.name || "KPI unavailable",
        target: target.target_value ?? null,
        actual: result?.actual_value ?? null,
        status: result?.status || target.notes || "Pending",
        unit: kpi?.unit ?? null,
        periodName: currentPeriod.period_name,
      };
    });
  return { rows, period: currentPeriod };
}

function MyTasks({
  tasks,
  employees,
}: {
  tasks: OperationsTask[];
  employees: OperationsEmployee[];
}) {
  const taskActions = useOperationsTaskActions();
  const TASK_STATUSES_LOCAL = ["not_started", "in_progress", "blocked", "completed", "cancelled"];
  const active = tasks
    .filter((t) => isTaskActive(t))
    .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <SectionHeader
        icon={CheckSquare}
        title="My tasks"
        description="Tasks assigned to you with inline status, progress and ownership updates."
        pillText={`${active.length} active`}
        pillTone={active.some((t) => isTaskOverdue(t)) ? "red" : "mint"}
      />
      <div className="mt-4 space-y-2">
        {!active.length && <StateMessage>You have no active tasks assigned.</StateMessage>}
        {active.slice(0, 8).map((task) => {
          const overdue = isTaskOverdue(task);
          return (
            <div key={task.id} className="rounded-xl border border-slate-100 bg-[#f8fafc] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-slate-700">
                    {task.title || "Untitled task"}
                  </p>
                  {task.description && (
                    <p className="mt-1 truncate text-[10px] text-slate-400">{task.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                    <CalendarDays size={12} /> {formatLiveDate(task.due_date)}
                    <span className="mx-1">·</span>
                    <span>Progress: {task.progress_percentage ?? 0}%</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <select
                    value={task.status}
                    onChange={(e) =>
                      taskActions.updateTaskStatus.mutate({ id: task.id, status: e.target.value as never })
                    }
                    className={cn(
                      "rounded-full border-0 px-2 py-1 text-[10px] font-bold outline-none",
                      statusClass(task.status),
                    )}
                  >
                    {TASK_STATUSES_LOCAL.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                  {overdue && (
                    <span className="rounded-full bg-[#ffe5e3] px-2 py-1 text-[10px] font-bold text-[#bd504d]">
                      Overdue
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Link
        to="/operations"
        className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-[#1c9574]"
      >
        Open Operations for full task centre <ChevronRight size={13} />
      </Link>
    </article>
  );
}

function MyCases({
  cases,
  employees,
}: {
  cases: OperationsCase[];
  employees: OperationsEmployee[];
}) {
  const caseMutations = useCasesMutations();
  const CASE_STATUSES_LOCAL = ["open", "in_progress", "pending_customer", "pending_internal", "escalated", "resolved", "closed", "cancelled"];
  const active = cases.filter(
    (c) => !["resolved", "closed", "cancelled"].includes(c.status.trim().toLowerCase()),
  );
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <SectionHeader
        icon={ClipboardList}
        title="My cases"
        description="Customer cases assigned to you, with resolve and close shortcuts."
        pillText={`${active.length} open`}
        pillTone={active.some((c) => c.sla_response_due_at && isOverdueTimestamp(c.sla_response_due_at, c.status)) ? "red" : "mint"}
        iconBg="bg-[#f5f2ff]"
        iconColor="text-[#755bc0]"
      />
      <div className="mt-4 space-y-2">
        {!active.length && <StateMessage>No customer cases are assigned to you.</StateMessage>}
        {active.slice(0, 6).map((c) => {
          const slaBreach =
            (c.sla_response_due_at && isOverdueTimestamp(c.sla_response_due_at, c.status)) ||
            (c.sla_resolution_due_at && isOverdueTimestamp(c.sla_resolution_due_at, c.status));
          return (
            <div key={c.id} className="rounded-xl border border-slate-100 bg-[#f8fafc] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-slate-700">
                    {c.subject || "Untitled case"}
                  </p>
                  {c.description && (
                    <p className="mt-1 line-clamp-1 text-[10px] text-slate-400">{c.description}</p>
                  )}
                  <p className="mt-1 text-[10px] text-slate-400">
                    Source: {c.source || "Not specified"}
                    {c.customer_type ? ` · Customer: ${c.customer_type}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-[10px] font-bold",
                      priorityClass(c.priority),
                    )}
                  >
                    {c.priority}
                  </span>
                  {slaBreach && (
                    <span className="rounded-full bg-[#ffe5e3] px-2 py-1 text-[10px] font-bold text-[#bd504d]">
                      SLA breach
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={c.status}
                  onChange={(e) =>
                    caseMutations.updateCaseStatus.mutate({
                      id: c.id,
                      status: e.target.value as never,
                    })
                  }
                  className={cn(
                    "rounded-full border-0 px-2 py-1 text-[10px] font-bold outline-none",
                    statusClass(c.status),
                  )}
                >
                  {CASE_STATUSES_LOCAL.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}
                    </option>
                  ))}
                </select>
                {!["resolved", "closed", "cancelled"].includes(c.status) && (
                  <button
                    type="button"
                    onClick={() =>
                      caseMutations.updateCaseStatus.mutate({ id: c.id, status: "resolved" })
                    }
                    disabled={caseMutations.updateCaseStatus.isPending}
                    className="rounded-lg bg-[#e8f8f2] px-2 py-1 text-[10px] font-bold text-[#168465] hover:bg-[#d4f2e6] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Mark resolved
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Link
        to="/customer-operations"
        className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-[#1c9574]"
      >
        Open Customer Operations <ChevronRight size={13} />
      </Link>
    </article>
  );
}

function MyDeadlines({
  deadlines,
  employees,
}: {
  deadlines: OperationsDeadline[];
  employees: OperationsEmployee[];
}) {
  const active = deadlines
    .filter((d) => !isResolvedStatus(d.status))
    .sort((a, b) => a.due_at.localeCompare(b.due_at));
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <SectionHeader
        icon={CalendarDays}
        title="My deadlines"
        description="Owned deadlines sorted by due date, including any linked tasks or tickets."
        pillText={`${active.length} pending`}
        pillTone={active.some((d) => isOverdueTimestamp(d.due_at, d.status)) ? "red" : "amber"}
        iconBg="bg-[#fff2d9]"
        iconColor="text-[#b3781f]"
      />
      <div className="mt-4 space-y-2">
        {!active.length && <StateMessage>No deadlines are owned by you.</StateMessage>}
        {active.slice(0, 6).map((d) => {
          const overdue = isOverdueTimestamp(d.due_at, d.status);
          return (
            <div key={d.id} className="rounded-xl border border-slate-100 bg-[#f8fafc] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-slate-700">{d.title}</p>
                  {d.description && (
                    <p className="mt-1 line-clamp-1 text-[10px] text-slate-400">{d.description}</p>
                  )}
                  <p className="mt-1 text-[10px] text-slate-400">
                    Due {formatLiveDate(d.due_at)}
                    {d.linked_task_id || d.linked_ticket_id ? " · Linked operational record" : " · Standalone deadline"}
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
      <Link
        to="/meetings"
        className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-[#1c9574]"
      >
        Open Meetings & deadlines <ChevronRight size={13} />
      </Link>
    </article>
  );
}

function MyKpis({
  employeeId,
  kpis,
  targets,
  results,
  periods,
}: {
  employeeId: string;
  kpis: OperationsKpi[];
  targets: OperationsKpiTarget[];
  results: OperationsKpiResult[];
  periods: OperationsKpiPeriod[];
}) {
  const { rows, period } = buildPersonalKpiRows({
    kpis,
    targets,
    results,
    periods,
    employeeId,
  });
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <SectionHeader
        icon={Target}
        title="My KPIs"
        description="KPI targets explicitly assigned to your employee identity for the current period."
        pillText={period?.period_name || "Current period"}
        pillTone="navy"
        iconBg="bg-[#eaf0f8]"
        iconColor="text-[#2f527a]"
      />
      <div className="mt-4 space-y-2">
        {!period && <StateMessage>No current KPI period is active.</StateMessage>}
        {period && !rows.length && (
          <StateMessage>No KPI targets are currently assigned to your identity.</StateMessage>
        )}
        {rows.map((row) => {
          const pct =
            row.target && row.actual
              ? Math.min(100, Math.round((row.actual / Math.max(row.target, 0.0001)) * 100))
              : null;
          return (
            <div key={row.id} className="rounded-xl border border-slate-100 bg-[#f8fafc] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-slate-700">{row.name}</p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Target {row.target ?? "—"} · Actual {row.actual ?? "—"}
                    {row.unit ? ` ${row.unit}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-1 text-[10px] font-bold",
                    pct !== null && pct >= 90
                      ? "bg-[#e4f8f0] text-[#15805f]"
                      : pct !== null && pct >= 60
                        ? "bg-[#fff2d9] text-[#9a6419]"
                        : pct !== null
                          ? "bg-[#ffe5e3] text-[#bd504d]"
                          : statusClass(row.status),
                  )}
                >
                  {pct !== null ? `${pct}%` : row.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <Link
        to="/kpis"
        className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-[#1c9574]"
      >
        Open full KPI command centre <ChevronRight size={13} />
      </Link>
    </article>
  );
}

function MyTeam({
  variant,
  myEmployeeId,
  myDepartmentId,
  myDepartmentIds,
  employees,
}: {
  variant: EmployeeVariant;
  myEmployeeId: string;
  myDepartmentId?: string;
  myDepartmentIds?: string[];
  employees: OperationsEmployee[];
}) {
  const active = employees.filter(
    (e) => normaliseStatus(e.employee_status) === "active",
  );
  const teamList = useMemo(() => {
    if (variant === "executive_other") {
      const deptSet = new Set(myDepartmentIds ?? []);
      return active.filter((e) => e.department_id && deptSet.has(e.department_id));
    }
    if (variant === "department_head") {
      return active.filter((e) => e.department_id === myDepartmentId);
    }
    if (variant === "manager") {
      const deptTeam = active.filter((e) => e.department_id === myDepartmentId);
      return deptTeam.length ? deptTeam : active.filter((e) => e.id !== myEmployeeId).slice(0, 10);
    }
    const sameDept = active.filter((e) => e.department_id === myDepartmentId && e.id !== myEmployeeId);
    return sameDept.length ? sameDept : active.filter((e) => e.id !== myEmployeeId).slice(0, 5);
  }, [variant, active, myDepartmentId, myDepartmentIds, myEmployeeId]);
  const scopeLabel =
    variant === "executive_other"
      ? "Owned department members"
      : variant === "department_head"
        ? "Department members"
        : variant === "manager"
          ? "Direct team & department peers"
          : "Department peers";
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <SectionHeader
        icon={UsersRound}
        title="My team"
        description={scopeLabel}
        pillText={`${teamList.length} active`}
        pillTone="mint"
        iconBg="bg-[#e8f8f2]"
        iconColor="text-[#1b9975]"
      />
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {!teamList.length && <StateMessage>No team members are visible within your scope.</StateMessage>}
        {teamList.slice(0, 10).map((e) => (
          <div key={e.id} className="rounded-xl border border-slate-100 bg-[#f8fafc] p-3">
            <div className="flex items-center justify-between gap-3">
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
          </div>
        ))}
      </div>
      <Link
        to="/people"
        className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-[#1c9574]"
      >
        Open People directory <ChevronRight size={13} />
      </Link>
    </article>
  );
}

export default function EmployeeDashboard({
  variant,
  scope,
}: {
  variant: EmployeeVariant;
  scope: EmployeeScope;
}) {
  const header = variantHeader(variant);
  const HeaderIcon = header.eyebrowIcon;
  const personalScope: DashboardScope = { employeeId: scope.employeeId };
  const personal = useOperationsDashboard(personalScope);

  const showAggregates = variant !== "employee";
  const aggregateScope: DashboardScope | null = showAggregates
    ? scope.departmentIds && scope.departmentIds.length
      ? { departmentIds: scope.departmentIds }
      : scope.departmentId
        ? { departmentIds: [scope.departmentId] }
        : null
    : null;
  const aggregate = aggregateScope ? useOperationsDashboard(aggregateScope) : null;

  const personalData = personal.data;
  const myTasks = personalData?.tasks ?? [];
  const myCases = personalData?.cases ?? [];
  const myDeadlines = personalData?.deadlines ?? [];
  const employees = personalData?.employees ?? aggregate?.data?.employees ?? [];
  const kpis = personalData?.kpis ?? [];
  const kpiTargets = personalData?.kpiTargets ?? [];
  const kpiResults = personalData?.kpiResults ?? [];
  const kpiPeriods = personalData?.kpiPeriods ?? [];

  const anyPending = personal.isPending || (aggregate?.isPending ?? false);
  const anyError = personal.isError || (aggregate?.isError ?? false);
  const retryAll = () => {
    personal.refetch();
    aggregate?.refetch();
  };

  const aggregateSummary = aggregate ? buildOperationsSummary(aggregate.data) : null;
  const aggregateCases = aggregate?.data?.cases ?? [];

  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-5 pb-12 pt-8 sm:px-8 xl:px-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className={cn("mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em]", header.eyebrowClass)}>
              <HeaderIcon size={13} /> {header.eyebrow}
            </div>
            <h1 className="font-display text-[30px] font-bold tracking-[-0.06em] text-[#152239] sm:text-[36px]">
              {header.title}
            </h1>
            <p className="mt-2 max-w-[700px] text-[13px] leading-6 text-slate-500">{header.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/operations"
              className="inline-flex items-center gap-2 rounded-xl bg-[#4a87c9] px-3.5 py-2.5 text-[11px] font-bold text-white shadow-[0_5px_12px_rgba(20,35,58,.15)] hover:bg-[#3c6fa8]"
            >
              <CheckSquare size={15} /> My tasks centre
            </Link>
            <Link
              to="/kpis"
              className="inline-flex items-center gap-2 rounded-xl bg-[#182842] px-3.5 py-2.5 text-[11px] font-bold text-white shadow-[0_5px_12px_rgba(20,35,58,.15)] hover:bg-[#233958]"
            >
              <Target size={15} /> Update my KPIs
            </Link>
            <Link
              to="/meetings"
              className="inline-flex items-center gap-2 rounded-xl bg-[#b3781f] px-3.5 py-2.5 text-[11px] font-bold text-white shadow-[0_5px_12px_rgba(20,35,58,.15)] hover:bg-[#956118]"
            >
              <CalendarDays size={15} /> My deadlines
            </Link>
          </div>
        </div>

        {anyPending && (
          <div className="mt-6">
            <StateMessage>Loading your workspace…</StateMessage>
          </div>
        )}
        {anyError && !anyPending && (
          <div className="mt-6">
            <StateMessage tone="error" onRetry={retryAll}>
              Your workspace could not be loaded. Check the connection and try again.
            </StateMessage>
          </div>
        )}

        {showAggregates && !anyPending && !anyError && aggregateSummary && (
          <div className="mt-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#f7f9fb] px-3 py-1 text-[10px] font-bold text-slate-500">
              <Briefcase size={12} /> Aggregate scoped view · Team-level roll-up
            </div>
            <AggregateMetrics summary={aggregateSummary} cases={aggregateCases} />
          </div>
        )}

        {!anyPending && !anyError && (
          <>
            <div className="mt-7 grid gap-5 xl:grid-cols-2">
              <MyTasks tasks={myTasks} employees={employees} />
              <MyCases cases={myCases} employees={employees} />
            </div>
            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <MyDeadlines deadlines={myDeadlines} employees={employees} />
              <MyKpis
                employeeId={scope.employeeId}
                kpis={kpis}
                targets={kpiTargets}
                results={kpiResults}
                periods={kpiPeriods}
              />
            </div>
            <div className="mt-5">
              <MyTeam
                variant={variant}
                myEmployeeId={scope.employeeId}
                myDepartmentId={scope.departmentId}
                myDepartmentIds={scope.departmentIds}
                employees={employees}
              />
            </div>
          </>
        )}

        <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200/70 pt-5 text-[10px] text-slate-400 sm:flex-row">
          <span>MedMap Operating System · Personal workspace · {variant}</span>
          <span>My Tasks → My Cases → My Deadlines → My KPIs → My Team</span>
        </footer>
      </div>
    </AppShell>
  );
}
