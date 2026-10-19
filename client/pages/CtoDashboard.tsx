import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  CircuitBoard,
  ClipboardList,
  Clock3,
  Cpu,
  GitBranch,
  ShieldCheck,
  Target,
  UsersRound,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/medmap/AppShell";
import { cn } from "@/lib/utils";
import {
  CaseManagementCentre,
  TaskManagementCentre,
  TicketManagementCentre,
} from "@/pages/Operations";
import {
  buildOperationsSummary,
  displayEmployeeName,
  isTaskActive,
  useOperationsDashboard,
  type OperationsEmployee,
  type OperationsTask,
} from "@/lib/operations-dashboard";
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
import {
  useProductEngineeringDashboard,
  type ProductEngineeringDashboardData,
} from "@/lib/product-engineering-dashboard";

type CtoScope = DashboardScope & { executiveEmployeeId?: string };

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
  linkHref,
  linkLabel,
  iconBg = "bg-[#e8f8f2]",
  iconColor = "text-[#1b9975]",
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  pillText?: string;
  pillTone?: "mint" | "amber" | "red" | "navy";
  linkHref?: string;
  linkLabel?: string;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <div className="flex items-center gap-2">
          <span className={cn("grid size-8 place-items-center rounded-lg", iconBg, iconColor)}>
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
              pillTone === "navy" && "bg-[#eaf0f8] text-[#2f527a]",
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

function TechWorkloadMetrics({
  summary,
  engineering,
}: {
  summary: ReturnType<typeof buildOperationsSummary>;
  engineering: { data?: ProductEngineeringDashboardData; isPending: boolean; isError: boolean };
}) {
  const openSecurity = engineering.data?.findings.filter(
    (f) => !isResolvedStatus(f.status),
  ).length ?? 0;
  const criticalFindings = engineering.data?.findings.filter(
    (f) =>
      !isResolvedStatus(f.status) &&
      ["critical", "high", "red"].includes((f.severity || f.risk_level || "").toLowerCase()),
  ).length ?? 0;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric
        label="Product backlog"
        value={engineering.isPending ? "…" : String(engineering.data?.items.filter((b) => !isResolvedStatus(b.status)).length ?? 0)}
        detail={engineering.isError ? "Unavailable" : `${engineering.data?.projects.length ?? 0} projects linked`}
        tone={engineering.isError ? "red" : "navy"}
        icon={Boxes}
      />
      <Metric
        label="Engineering tasks"
        value={String(summary.activeTaskCount)}
        detail={`${summary.overdueTaskCount} overdue · ${summary.completedTaskCount} done`}
        tone={summary.overdueTaskCount ? "red" : "mint"}
        icon={CircuitBoard}
      />
      <Metric
        label="Security findings"
        value={engineering.isPending ? "…" : String(openSecurity)}
        detail={criticalFindings ? `${criticalFindings} critical/high` : "Within risk appetite"}
        tone={criticalFindings ? "red" : openSecurity ? "amber" : "mint"}
        icon={ShieldCheck}
      />
      <Metric
        label="Deployments"
        value={engineering.isPending ? "…" : String(engineering.data?.deployments.length ?? 0)}
        detail={`${engineering.data?.releases.length ?? 0} product releases`}
        tone="navy"
        icon={GitBranch}
      />
    </div>
  );
}

type AreaKind = "Product" | "Engineering" | "Security";
function TechAreaCard({
  area,
  data,
  isPending,
  isError,
}: {
  area: AreaKind;
  data: ProductEngineeringDashboardData | undefined;
  isPending: boolean;
  isError: boolean;
}) {
  const config = {
    Product: {
      icon: Boxes,
      desc: "Product strategy, backlog, releases and user feedback.",
      path: "/product",
      metrics: () => [
        {
          label: "Projects",
          value: data?.projects.length ?? 0,
        },
        {
          label: "Backlog items",
          value: data?.items.filter((b) => !isResolvedStatus(b.status)).length ?? 0,
        },
      ],
    },
    Engineering: {
      icon: Cpu,
      desc: "Engineering backlog, deploys, releases and uptime.",
      path: "/engineering",
      metrics: () => [
        {
          label: "Deployments",
          value: data?.deployments.length ?? 0,
        },
        {
          label: "Releases",
          value: data?.releases.length ?? 0,
        },
      ],
    },
    Security: {
      icon: ShieldCheck,
      desc: "Security findings, controls, incidents and reviews.",
      path: "/security",
      metrics: () => [
        {
          label: "Open findings",
          value: data?.findings.filter((f) => !isResolvedStatus(f.status)).length ?? 0,
        },
        {
          label: "Controls",
          value: data?.controls.length ?? 0,
        },
      ],
    },
  } as const;
  const c = config[area];
  const hasAny = c.metrics().some((m) => m.value > 0);
  const state = isPending
    ? "loading"
    : isError
      ? "error"
      : hasAny
        ? "live"
        : "empty";
  const stateLabel =
    state === "loading"
      ? "Loading technology data…"
      : state === "error"
        ? "Unable to load technology data."
        : state === "empty"
          ? "No technology data recorded."
          : "Live records available.";
  const stateClass =
    state === "error"
      ? "text-[#bd504d]"
      : state === "empty"
        ? "text-slate-400"
        : "text-[#1f9d80]";
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "grid size-8 place-items-center rounded-lg",
                area === "Product" && "bg-[#eaf0f8] text-[#2f527a]",
                area === "Engineering" && "bg-[#e4f8f0] text-[#15805f]",
                area === "Security" && "bg-[#ffe9e6] text-[#bf5b56]",
              )}
            >
              <c.icon size={16} />
            </span>
            <h3 className="font-display text-[16px] font-bold text-[#152239]">
              {area}
            </h3>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-400">{c.desc}</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {c.metrics().map((m) => (
          <div key={m.label} className="rounded-xl bg-[#f7f9fb] p-3">
            <p className="text-[10px] font-medium text-slate-400">{m.label}</p>
            <p className="mt-2 font-display text-[22px] font-bold text-[#152239]">
              {state === "loading" ? "…" : state === "error" ? "—" : m.value}
            </p>
          </div>
        ))}
      </div>
      <p className={cn("mt-4 text-[10px] font-semibold", stateClass)}>{stateLabel}</p>
      <Link
        to={c.path}
        className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-[#1c9574]"
      >
        Open {area} Command Centre <ChevronRight size={13} />
      </Link>
    </article>
  );
}

function TechKpis({ scope }: { scope: DashboardScope }) {
  const exec = useExecutiveSummary(scope);
  const { rows, period } = buildKpiRows(exec.kpis.data);
  const techKpis = rows.filter((r) => {
    const name = r.name.toLowerCase();
    return (
      name.includes("system") ||
      name.includes("uptime") ||
      name.includes("tech") ||
      name.includes("deploy") ||
      name.includes("release") ||
      name.includes("security") ||
      name.includes("quality") ||
      name.includes("defect") ||
      name.includes("availability") ||
      name.includes("response") ||
      name.includes("mttr") ||
      name.includes("mtt") ||
      name.includes("product") ||
      name.includes("engineering") ||
      name.includes("sla")
    );
  });
  const display = statusToDisplay;
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <SectionHeader
        icon={Target}
        title="Technology KPIs"
        description="Technology, product, engineering and security-linked KPI targets and actuals."
        pillText={period?.period_name || "Current period"}
        pillTone="navy"
        linkHref="/kpis"
        linkLabel="Open all KPIs"
      />
      <div className="mt-5 space-y-3">
        {exec.kpis.isPending && <StateMessage>Loading technology KPIs…</StateMessage>}
        {exec.kpis.isError && <StateMessage tone="error">Technology KPIs unavailable.</StateMessage>}
        {!exec.kpis.isPending && !exec.kpis.isError && !techKpis.length && !rows.length && (
          <StateMessage>No KPI records are scoped to technology.</StateMessage>
        )}
        {!exec.kpis.isPending && !exec.kpis.isError && !techKpis.length && rows.length && (
          <div className="space-y-3">
            <StateMessage>No explicitly technology-tagged KPIs found. Showing scoped KPIs.</StateMessage>
            {rows.slice(0, 4).map((row) => {
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {techKpis.slice(0, 5).map((row) => {
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
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function MeetingsDeadlines({
  scope,
}: {
  scope: DashboardScope;
}) {
  const dashboard = useOperationsDashboard(scope);
  const deadlines = dashboard.data?.deadlines ?? [];
  const employees = dashboard.data?.employees ?? [];
  const active = deadlines
    .filter((d) => !isResolvedStatus(d.status))
    .sort((a, b) => a.due_at.localeCompare(b.due_at))
    .slice(0, 5);
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <SectionHeader
        icon={CalendarDays}
        title="Meetings & deadlines"
        description="Upcoming scoped deadlines with owner visibility."
        pillText={`${active.length} pending`}
        pillTone={active.some((d) => isOverdueTimestamp(d.due_at, d.status)) ? "red" : "amber"}
        linkHref="/meetings"
        linkLabel="Open Meetings"
      />
      <div className="mt-5 space-y-2">
        {dashboard.isPending && <StateMessage>Loading deadlines…</StateMessage>}
        {dashboard.isError && <StateMessage tone="error">Deadlines unavailable.</StateMessage>}
        {!dashboard.isPending && !dashboard.isError && !active.length && (
          <StateMessage>No scoped deadlines are pending.</StateMessage>
        )}
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

function PeopleList({ scope }: { scope: DashboardScope }) {
  const summary = useExecutiveSummary(scope);
  const employees = summary.people.data?.employees ?? [];
  const active = employees.filter((e) => normaliseStatus(e.employee_status) === "active");
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <SectionHeader
        icon={UsersRound}
        title="Technology team"
        description="Active employees scoped to product, engineering and security departments."
        pillText={`${active.length} active`}
        pillTone="navy"
        linkHref="/people"
        linkLabel="Open People"
      />
      <div className="mt-5 space-y-2">
        {summary.people.isPending && <StateMessage>Loading team directory…</StateMessage>}
        {summary.people.isError && <StateMessage tone="error">Team directory unavailable.</StateMessage>}
        {!summary.people.isPending && !summary.people.isError && !active.length && (
          <StateMessage>No employees are scoped to technology.</StateMessage>
        )}
        {!summary.people.isPending && !summary.people.isError && active.slice(0, 8).map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-[#f8fafc] p-3">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold text-slate-700">
                {`${e.first_name} ${e.last_name}`.trim()}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-slate-400">
                {e.job_title || "Technology team member"}
              </p>
            </div>
            <span className="rounded-full bg-[#e8f8f2] px-2 py-1 text-[10px] font-bold text-[#168465]">Active</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function CtoDashboard({ scope }: { scope: CtoScope }) {
  const techScope: DashboardScope = {
    departmentIds: scope.departmentIds,
    employeeId: scope.executiveEmployeeId,
  };
  const dashboard = useOperationsDashboard(techScope);
  const summary = buildOperationsSummary(dashboard.data);
  const engineering = useProductEngineeringDashboard();
  const alerts = useExecutiveAlerts(techScope);

  const alertRows = (alerts.data ?? []).filter(
    (a) => !isResolvedStatus(a.status),
  );
  const tasks = dashboard.data?.tasks ?? [];
  const activeTasks = tasks
    .filter((t) => isTaskActive(t))
    .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));

  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-5 pb-12 pt-8 sm:px-8 xl:px-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#2f527a]">
              <CircuitBoard size={13} /> Chief Technology Officer · Technology scoped
            </div>
            <h1 className="font-display text-[32px] font-bold tracking-[-0.06em] text-[#152239] sm:text-[39px]">
              Ship product. Secure the platform.
            </h1>
            <p className="mt-2 max-w-[700px] text-[13px] leading-6 text-slate-500">
              Scoped product, engineering, security, technology-KPIs and operational
              work from the authenticated organisation, focused on delivery and
              risk.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/product"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2f527a] px-3.5 py-2.5 text-[11px] font-bold text-white shadow-[0_5px_12px_rgba(20,35,58,.15)] hover:bg-[#233f5f]"
            >
              <Boxes size={15} /> Product
            </Link>
            <Link
              to="/engineering"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1b9975] px-3.5 py-2.5 text-[11px] font-bold text-white shadow-[0_5px_12px_rgba(20,35,58,.15)] hover:bg-[#157f60]"
            >
              <Wrench size={15} /> Engineering
            </Link>
            <Link
              to="/security"
              className="inline-flex items-center gap-2 rounded-xl bg-[#bd504d] px-3.5 py-2.5 text-[11px] font-bold text-white shadow-[0_5px_12px_rgba(20,35,58,.15)] hover:bg-[#a34340]"
            >
              <AlertTriangle size={15} /> Security
            </Link>
            <Link
              to="/operations"
              className="inline-flex items-center gap-2 rounded-xl bg-[#182842] px-3.5 py-2.5 text-[11px] font-bold text-white shadow-[0_5px_12px_rgba(20,35,58,.15)] hover:bg-[#233958]"
            >
              <CheckSquare size={15} /> Tech task centre
            </Link>
          </div>
        </div>

        <div className="mt-7">
          {dashboard.isPending || engineering.isPending ? (
            <StateMessage>Loading technology workload…</StateMessage>
          ) : dashboard.isError || engineering.isError ? (
            <StateMessage tone="error" onRetry={() => { dashboard.refetch(); engineering.refetch(); }}>
              Technology workload could not be loaded.
            </StateMessage>
          ) : (
            <TechWorkloadMetrics summary={summary} engineering={engineering} />
          )}
        </div>

        {alertRows.length > 0 && (
          <div className="mt-5 rounded-2xl border border-[#c9d7ec] bg-[#f7faff] p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
            <SectionHeader
              icon={AlertTriangle}
              title="Technology alerts"
              description="Company alerts scoped to technology departments."
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
          <TechAreaCard area="Product" data={engineering.data} isPending={engineering.isPending} isError={engineering.isError} />
          <TechAreaCard area="Engineering" data={engineering.data} isPending={engineering.isPending} isError={engineering.isError} />
          <TechAreaCard area="Security" data={engineering.data} isPending={engineering.isPending} isError={engineering.isError} />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <TechKpis scope={techScope} />
          <MeetingsDeadlines scope={techScope} />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <TaskManagementCentre scope={techScope} showHeader={true} maxRows={6} />
          <PeopleList scope={techScope} />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <TicketManagementCentre scope={techScope} showHeader={true} maxRows={8} />
          <CaseManagementCentre scope={techScope} showHeader={true} maxRows={8} />
        </div>

        <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200/70 pt-5 text-[10px] text-slate-400 sm:flex-row">
          <span>MedMap Operating System · CTO scoped dashboard</span>
          <span>Product → Engineering → Security → Delivery</span>
        </footer>
      </div>
    </AppShell>
  );
}
