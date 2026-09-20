import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileWarning,
  GitBranch,
  Layers3,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/medmap/AppShell";
import { cn } from "@/lib/utils";
import {
  useCurrentOrganisation,
  type OrganizationRecord,
} from "@/lib/supabase-identity";
import {
  buildFinanceSummary,
  buildKpiRows,
  formatMoneyBuckets,
  isOverdueDate,
  isResolvedStatus,
  normaliseStatus,
  statusToDisplay,
  useExecutiveAlerts,
  useExecutiveSummary,
  type Task,
  type Ticket,
} from "@/lib/executive-dashboard";
import {
  useProductEngineeringDashboard,
  type ProductEngineeringDashboardData,
} from "@/lib/product-engineering-dashboard";

type Status = "healthy" | "attention" | "critical";
type WorkRecord = Task | Ticket;

type Metric = {
  label: string;
  value: string;
  change: string;
  helper: string;
  status: Status;
  icon: React.ElementType;
};

function StatusPill({ status, label }: { status: Status; label?: string }) {
  const content =
    label ??
    (status === "healthy"
      ? "Healthy"
      : status === "attention"
        ? "Needs action"
        : "Critical");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold",
        status === "healthy" && "bg-[#e4f8f0] text-[#15805f]",
        status === "attention" && "bg-[#fff2d9] text-[#9a6419]",
        status === "critical" && "bg-[#ffe5e3] text-[#bd504d]",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "healthy" && "bg-[#25a879]",
          status === "attention" && "bg-[#e0a03a]",
          status === "critical" && "bg-[#da6560]",
        )}
      />
      {content}
    </span>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon;
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_5px_20px_rgba(21,36,58,0.035)]">
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "grid size-9 place-items-center rounded-xl",
            metric.status === "healthy"
              ? "bg-[#e8f8f2] text-[#1b9975]"
              : metric.status === "critical"
                ? "bg-[#ffe9e6] text-[#bf5b56]"
                : "bg-[#fff3dd] text-[#b87720]",
          )}
        >
          <Icon size={17} />
        </span>
        <span
          className={cn(
            "size-1.5 rounded-full",
            metric.status === "healthy"
              ? "bg-[#36ac87]"
              : metric.status === "critical"
                ? "bg-[#da6560]"
                : "bg-[#e0a03a]",
          )}
        />
      </div>
      <p className="mt-4 text-[12px] font-medium text-slate-500">
        {metric.label}
      </p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="font-display text-[27px] font-bold tracking-[-0.05em] text-[#152239]">
          {metric.value}
        </p>
        <span
          className={cn(
            "mb-1 flex items-center gap-0.5 text-right text-[10px] font-bold",
            metric.status === "healthy"
              ? "text-[#209b76]"
              : metric.status === "critical"
                ? "text-[#bd504d]"
                : "text-[#b3781f]",
          )}
        >
          {metric.status === "healthy" ? (
            <ArrowUpRight size={13} />
          ) : (
            <ArrowDownRight size={13} />
          )}
          {metric.change}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-slate-400">{metric.helper}</p>
    </div>
  );
}

function formatOrganisationName(organization: OrganizationRecord | null) {
  const name = organization?.name;
  return typeof name === "string" && name.trim()
    ? name
    : "Authenticated organisation";
}

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

function ErrorState({
  message = "This section could not be loaded.",
}: {
  message?: string;
}) {
  return (
    <p className="rounded-xl border border-[#f0cdca] bg-[#fff8f7] p-3 text-[11px] leading-5 text-[#a34f4b]">
      {message} Try again after the connection is available.
    </p>
  );
}

function LoadingState() {
  return (
    <p className="rounded-xl bg-[#f7f9fb] p-3 text-[11px] text-slate-400">
      Loading live data...
    </p>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-[#f7f9fb] p-3 text-[11px] text-slate-400">
      {children}
    </p>
  );
}

function RecordState({
  pending,
  error,
  empty,
  children,
}: {
  pending: boolean;
  error: boolean;
  empty: boolean;
  children: React.ReactNode;
}) {
  if (pending) return <LoadingState />;
  if (error) return <ErrorState />;
  if (empty) return <EmptyState>No live records are available.</EmptyState>;
  return <>{children}</>;
}

type ExecutiveArea = {
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  metrics: { label: string; value: number }[];
  state: "loading" | "error" | "empty" | "live";
};

type ExecutiveActivity = {
  id: string;
  area: "Product" | "Engineering" | "Security";
  label: string;
  timestamp: string;
};

function areaState(
  isPending: boolean,
  hasError: boolean,
  metrics: { value: number }[],
): ExecutiveArea["state"] {
  if (isPending) return "loading";
  if (hasError) return "error";
  return metrics.some((metric) => metric.value > 0) ? "live" : "empty";
}

function buildRecentActivity(
  data: ProductEngineeringDashboardData,
): ExecutiveActivity[] {
  return [
    ...data.releases.map((release) => ({
      id: `release-${release.id}`,
      area: "Product" as const,
      label: `Release · ${release.name}`,
      timestamp: release.updated_at || release.created_at,
    })),
    ...data.deployments.map((deployment) => ({
      id: `deployment-${deployment.id}`,
      area: "Engineering" as const,
      label: `Deployment · ${deployment.version || deployment.id}`,
      timestamp:
        deployment.deployment_completed_at ||
        deployment.deployment_started_at ||
        deployment.updated_at,
    })),
    ...data.projects.map((project) => ({
      id: `project-${project.id}`,
      area: "Engineering" as const,
      label: `Project · ${project.name}`,
      timestamp: project.updated_at || project.created_at,
    })),
    ...data.feedback.map((feedback) => ({
      id: `feedback-${feedback.id}`,
      area: "Product" as const,
      label: `Feedback · ${feedback.title || feedback.id}`,
      timestamp: feedback.updated_at || feedback.created_at,
    })),
    ...data.controls
      .filter((control) => control.last_reviewed_at)
      .map((control) => ({
        id: `control-${control.id}`,
        area: "Security" as const,
        label: `Control reviewed · ${control.name}`,
        timestamp: control.last_reviewed_at!,
      })),
  ]
    .filter((activity) => !Number.isNaN(new Date(activity.timestamp).valueOf()))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 6);
}

function ExecutiveAreaCard({ area }: { area: ExecutiveArea }) {
  const Icon = area.icon;
  const stateLabel =
    area.state === "loading"
      ? "Loading executive data..."
      : area.state === "error"
        ? "Unable to load executive data."
        : area.state === "empty"
          ? "No operational data recorded."
          : "Live records available.";
  const stateClass =
    area.state === "error"
      ? "text-[#bd504d]"
      : area.state === "empty"
        ? "text-slate-400"
        : "text-[#1f9d80]";

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-[#eaf3ff] text-[#4a87c9]">
              <Icon size={16} />
            </span>
            <h3 className="font-display text-[16px] font-bold text-[#152239]">
              {area.title}
            </h3>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-400">
            {area.description}
          </p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {area.metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl bg-[#f7f9fb] p-3">
            <p className="text-[10px] font-medium text-slate-400">
              {metric.label}
            </p>
            <p className="mt-2 font-display text-[22px] font-bold text-[#152239]">
              {area.state === "loading" ? "..." : area.state === "error" ? "—" : metric.value}
            </p>
          </div>
        ))}
      </div>
      <p className={cn("mt-4 text-[10px] font-semibold", stateClass)}>
        {stateLabel}
      </p>
      <Link
        to={area.path}
        className="mt-4 inline-flex items-center gap-1 text-[10px] font-bold text-[#1c9574]"
      >
        Open {area.title} Command Centre <ChevronRight size={13} />
      </Link>
    </article>
  );
}

function WorkSummary({ records }: { records: WorkRecord[] }) {
  const open = records.filter(
    (record) => !isResolvedStatus(record.status),
  ).length;
  const inProgress = records.filter((record) =>
    ["in progress", "assigned", "started"].includes(
      normaliseStatus(record.status) ?? "",
    ),
  ).length;
  const completed = records.filter((record) =>
    isResolvedStatus(record.status),
  ).length;
  const overdue = records.filter((record) =>
    isOverdueDate(record.due_date, record.status),
  ).length;
  return { open, inProgress, completed, overdue };
}

export default function Index() {
  const organisationState = useCurrentOrganisation();
  const { people, operations, kpis, finance } = useExecutiveSummary();
  const alerts = useExecutiveAlerts();
  const technologyDashboard = useProductEngineeringDashboard();
  const organisationName = formatOrganisationName(
    organisationState.organization,
  );
  const employeeRows = people.data?.employees ?? [];
  const departmentRows = people.data?.departments ?? [];
  const employeeNames = new Map(
    employeeRows.map((employee) => [
      employee.id,
      `${employee.first_name} ${employee.last_name}`.trim(),
    ]),
  );
  const financeSummary = buildFinanceSummary(finance.data);
  const { rows: kpiRows, period: kpiPeriod } = buildKpiRows(kpis.data);
  const kpiResults = kpiRows.filter((row) => row.actual !== null);
  const deadlineRows = (operations.data?.deadlines ?? [])
    .filter((deadline) => !isResolvedStatus(deadline.status))
    .sort((a, b) => a.due_at.localeCompare(b.due_at));
  const taskRows = operations.data?.tasks ?? [];
  const ticketRows = operations.data?.tickets ?? [];
  const workRows: WorkRecord[] = [...taskRows, ...ticketRows];
  const workSummary = WorkSummary({ records: workRows });
  const alertRows = (alerts.data ?? []).filter(
    (alert) => !isResolvedStatus(alert.status),
  );
  const activeEmployeeCount = employeeRows.filter(
    (employee) => normaliseStatus(employee.employee_status) === "active",
  ).length;
  const openWorkValue = operations.isPending
    ? "Loading..."
    : operations.isError
      ? "Unavailable"
      : String(workSummary.open);
  const technologyData = technologyDashboard.data;
  const technologyError =
    technologyDashboard.isError || Boolean(technologyData?.optionalErrors.length);
  const productMetrics = [
    { label: "Roadmaps", value: technologyData?.roadmaps.length ?? 0 },
    { label: "Backlog", value: technologyData?.items.length ?? 0 },
    { label: "Releases", value: technologyData?.releases.length ?? 0 },
    { label: "Feedback", value: technologyData?.feedback.length ?? 0 },
  ];
  const engineeringMetrics = [
    { label: "Projects", value: technologyData?.projects.length ?? 0 },
    { label: "Deployments", value: technologyData?.deployments.length ?? 0 },
    { label: "Releases", value: technologyData?.releases.length ?? 0 },
    { label: "Work links", value: technologyData ? technologyData.tasks.length + technologyData.tickets.length : 0 },
  ];
  const securityMetrics = [
    { label: "Controls", value: technologyData?.controls.length ?? 0 },
    { label: "Tests", value: technologyData?.securityTests.length ?? 0 },
    { label: "Findings", value: technologyData?.findings.length ?? 0 },
    { label: "Incidents", value: technologyData?.incidents.length ?? 0 },
    { label: "Remediations", value: technologyData?.remediations.length ?? 0 },
  ];
  const executiveAreas: ExecutiveArea[] = [
    {
      title: "Product",
      description: "Roadmaps, backlog, releases and feedback from the live organisation scope.",
      path: "/product",
      icon: Boxes,
      metrics: productMetrics,
      state: areaState(technologyDashboard.isPending, technologyError, productMetrics),
    },
    {
      title: "Engineering",
      description: "Projects, deployments and linked operational work from the live backend.",
      path: "/engineering",
      icon: GitBranch,
      metrics: engineeringMetrics,
      state: areaState(technologyDashboard.isPending, technologyError, engineeringMetrics),
    },
    {
      title: "Security",
      description: "Controls, tests, findings, incidents and remediation records only.",
      path: "/security",
      icon: ShieldCheck,
      metrics: securityMetrics,
      state: areaState(technologyDashboard.isPending, technologyError, securityMetrics),
    },
  ];
  const recentActivity = technologyData ? buildRecentActivity(technologyData) : [];
  const metrics: Metric[] = [
    {
      label: "Recorded revenue",
      value: financeSummary.recognizedRevenueRecords
        ? formatMoneyBuckets(financeSummary.revenue)
        : "Awaiting live data",
      change: financeSummary.recognizedRevenueRecords
        ? "recorded"
        : "no records",
      helper: financeSummary.periodName
        ? `Finance · ${financeSummary.periodName}`
        : "Finance · current backend records",
      status: financeSummary.recognizedRevenueRecords ? "healthy" : "attention",
      icon: WalletCards,
    },
    {
      label: "Active employees",
      value: people.isPending
        ? "Loading..."
        : people.isError
          ? "Unavailable"
          : employeeRows.length
            ? String(activeEmployeeCount)
            : "Awaiting live data",
      change: people.isError ? "data unavailable" : "live records",
      helper: "Employees · authenticated organisation scope",
      status: people.isError
        ? "critical"
        : activeEmployeeCount
          ? "healthy"
          : "attention",
      icon: UsersRound,
    },
    {
      label: "Departments",
      value: people.isPending
        ? "Loading..."
        : people.isError
          ? "Unavailable"
          : departmentRows.length
            ? String(departmentRows.length)
            : "Awaiting live data",
      change: people.isError ? "data unavailable" : "live records",
      helper: "Departments · authenticated organisation scope",
      status: people.isError
        ? "critical"
        : departmentRows.length
          ? "healthy"
          : "attention",
      icon: Target,
    },
    {
      label: "Open work",
      value: workRows.length ? openWorkValue : "Awaiting live data",
      change: operations.isError
        ? "data unavailable"
        : workRows.length
          ? `${workSummary.overdue} overdue`
          : "no records",
      helper: "Tasks and tickets · live backend records",
      status: operations.isError
        ? "critical"
        : workSummary.overdue
          ? "critical"
          : "attention",
      icon: Layers3,
    },
    {
      label: "KPI actuals",
      value: kpis.isPending
        ? "Loading..."
        : kpis.isError
          ? "Unavailable"
          : kpiResults.length
            ? String(kpiResults.length)
            : "Awaiting live data",
      change: kpis.isError ? "data unavailable" : "current period records",
      helper: kpiPeriod?.period_name
        ? `KPIs · ${kpiPeriod.period_name}`
        : "KPIs · current period records",
      status: kpis.isError
        ? "critical"
        : kpiResults.length
          ? "healthy"
          : "attention",
      icon: Clock3,
    },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-5 pb-12 pt-8 sm:px-8 xl:px-10">
        <section id="overview" className="scroll-mt-24">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#1b9975]">
                <Sparkles size={13} /> Executive command centre
              </div>
              <h1 className="font-display text-[32px] font-bold tracking-[-0.06em] text-[#152239] sm:text-[39px]">
                Live operating visibility for {organisationName}.
              </h1>
              <p className="mt-2 max-w-[760px] text-[13px] leading-6 text-slate-500">
                This view reads the authenticated organisation’s records through
                Supabase RLS. Empty or unsupported backend areas remain explicit
                instead of being replaced with demo performance.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-[11px] text-slate-400 sm:block">
                Live Supabase view · RLS enforced
              </span>
              <Link
                to="/meetings"
                className="inline-flex items-center gap-2 rounded-xl bg-[#182842] px-3.5 py-2.5 text-[11px] font-bold text-white shadow-[0_5px_12px_rgba(20,35,58,.15)] transition hover:bg-[#233958]"
              >
                <Plus size={15} /> Open operating cadence
              </Link>
            </div>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-[#c9d7ec] bg-[#f7faff] p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-[#eaf3ff] text-[#4a87c9]">
                  <Target size={16} />
                </span>
                <h2 className="font-display text-[16px] font-bold text-[#152239]">
                  Organisation and people status
                </h2>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Verified organisation-scoped records available to the
                authenticated command centre.
              </p>
            </div>
            <StatusPill
              status={
                people.isError
                  ? "critical"
                  : people.isPending
                    ? "attention"
                    : "healthy"
              }
              label={
                people.isError
                  ? "Data unavailable"
                  : people.isPending
                    ? "Loading"
                    : "RLS connected"
              }
            />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Organisation context
              </p>
              <p className="mt-2 font-display text-[22px] font-bold text-[#152239]">
                {organisationName}
              </p>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">
                Resolved through the authenticated employee relationship.
              </p>
            </div>
            <div className="rounded-xl bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Active employees
              </p>
              <p className="mt-2 font-display text-[25px] font-bold text-[#152239]">
                {people.isPending
                  ? "Loading..."
                  : people.isError
                    ? "Unavailable"
                    : employeeRows.length
                      ? String(activeEmployeeCount)
                      : "Awaiting live data"}
              </p>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">
                Derived from employee status values returned by the backend.
              </p>
            </div>
            <div className="rounded-xl bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Departments
              </p>
              <p className="mt-2 font-display text-[25px] font-bold text-[#152239]">
                {people.isPending
                  ? "Loading..."
                  : people.isError
                    ? "Unavailable"
                    : departmentRows.length
                      ? String(departmentRows.length)
                      : "Awaiting live data"}
              </p>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">
                Department records visible through the current organisation
                scope.
              </p>
            </div>
          </div>
        </section>

        <section id="governance" className="mt-5">
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-[#fff2d9] text-[#b3781f]">
                    <CircleAlert size={16} />
                  </span>
                  <h2 className="font-display text-[16px] font-bold text-[#152239]">
                    Live alert centre
                  </h2>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Company alerts returned through the authenticated data path.
                </p>
              </div>
              <span className="rounded-full bg-[#fff2d9] px-2.5 py-1 text-[10px] font-bold text-[#9a6419]">
                {alerts.isPending
                  ? "..."
                  : alerts.isError
                    ? "!"
                    : alertRows.length}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <RecordState
                pending={alerts.isPending}
                error={alerts.isError}
                empty={
                  !alerts.isPending && !alerts.isError && !alertRows.length
                }
              >
                {alertRows.slice(0, 4).map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-xl border border-slate-100 bg-[#f8fafc] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[11px] font-bold text-slate-700">
                        {alert.title || "Company alert"}
                      </p>
                      <StatusPill
                        status={statusToDisplay(alert.status) ?? "attention"}
                        label={alert.status || "Alert"}
                      />
                    </div>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">
                      {alert.message || "No alert detail provided."}
                    </p>
                  </div>
                ))}
              </RecordState>
            </div>
          </article>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-[#fff2d9] text-[#b3781f]">
                    <FileWarning size={16} />
                  </span>
                  <h2 className="font-display text-[16px] font-bold text-[#152239]">
                    Deadlines and work queue
                  </h2>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Live deadlines, tasks and tickets. Nothing is substituted from
                  the local demo store.
                </p>
              </div>
              <span className="rounded-full bg-[#fff2d9] px-2.5 py-1 text-[10px] font-bold text-[#9a6419]">
                {operations.isPending
                  ? "..."
                  : operations.isError
                    ? "!"
                    : `${workSummary.open} open`}
              </span>
            </div>
            <RecordState
              pending={operations.isPending}
              error={operations.isError}
              empty={
                !operations.isPending &&
                !operations.isError &&
                !deadlineRows.length &&
                !workRows.length
              }
            >
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-[#f7f9fb] p-3.5">
                  <p className="text-[10px] font-medium text-slate-400">
                    Tasks and tickets
                  </p>
                  <p className="mt-2 font-display text-[22px] font-bold text-[#152239]">
                    {workSummary.open}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {`${workSummary.inProgress} in progress · ${workSummary.completed} completed · ${workSummary.overdue} overdue`}
                  </p>
                </div>
                <div className="rounded-xl bg-[#f7f9fb] p-3.5">
                  <p className="text-[10px] font-medium text-slate-400">
                    Upcoming deadlines
                  </p>
                  <p className="mt-2 font-display text-[22px] font-bold text-[#152239]">
                    {deadlineRows.length}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {deadlineRows.length
                      ? "Open deadline records"
                      : "No upcoming deadlines"}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {deadlineRows.slice(0, 4).map((deadline) => (
                  <div
                    key={deadline.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#eef4fb] text-[#5488be]">
                      <CalendarDays size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-slate-700">
                        {deadline.title || "Deadline"}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {formatLiveDate(deadline.due_at)}
                        {deadline.owner_employee_id &&
                        employeeNames.get(deadline.owner_employee_id)
                          ? ` · ${employeeNames.get(deadline.owner_employee_id)}`
                          : ""}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {deadline.status || "Status not provided"}
                    </span>
                  </div>
                ))}
              </div>
            </RecordState>
          </article>

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-[#eaf3ff] text-[#4a87c9]">
                    <Clock3 size={16} />
                  </span>
                  <h2 className="font-display text-[16px] font-bold text-[#152239]">
                    KPI summary
                  </h2>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Targets, actuals and statuses only where the KPI relationships
                  provide them.
                </p>
              </div>
              <Link
                to="/kpis"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4a87c9]"
              >
                Open KPIs <ChevronRight size={14} />
              </Link>
            </div>
            <RecordState
              pending={kpis.isPending}
              error={kpis.isError}
              empty={!kpis.isPending && !kpis.isError && !kpiResults.length}
            >
              {kpiResults.length ? (
                <div className="mt-4 space-y-2">
                  {kpiRows.slice(0, 5).map((kpi) => {
                    const displayStatus = statusToDisplay(kpi.status);
                    const variance =
                      kpi.actual !== null && kpi.target !== null
                        ? kpi.actual - kpi.target
                        : null;
                    return (
                      <div
                        key={kpi.id}
                        className="rounded-xl border border-slate-100 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-bold text-slate-700">
                              {kpi.name}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              {kpi.periodName ?? "Period not provided"}
                              {kpi.ownerEmployeeId &&
                              employeeNames.get(kpi.ownerEmployeeId)
                                ? ` · ${employeeNames.get(kpi.ownerEmployeeId)}`
                                : ""}
                            </p>
                          </div>
                          {displayStatus ? (
                            <StatusPill
                              status={displayStatus}
                              label={kpi.status || undefined}
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Status not provided
                            </span>
                          )}
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                          <span className="rounded-lg bg-[#f7f9fb] p-2 text-slate-500">
                            Target
                            <strong className="mt-1 block text-[12px] text-slate-700">
                              {kpi.target ?? "—"}
                            </strong>
                          </span>
                          <span className="rounded-lg bg-[#f7f9fb] p-2 text-slate-500">
                            Actual
                            <strong className="mt-1 block text-[12px] text-slate-700">
                              {kpi.actual ?? "—"}
                            </strong>
                          </span>
                          <span className="rounded-lg bg-[#f7f9fb] p-2 text-slate-500">
                            Variance
                            <strong className="mt-1 block text-[12px] text-slate-700">
                              {variance ?? "—"}
                            </strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState>No KPI results for this period.</EmptyState>
              )}
            </RecordState>
          </article>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-[#e8f8f2] text-[#1b9975]">
                  <WalletCards size={16} />
                </span>
                <h2 className="font-display text-[16px] font-bold text-[#152239]">
                  Financial reality
                </h2>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Only revenue and expense records returned by the current backend
                period are shown.
              </p>
            </div>
            <Link
              to="/finance"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1c9574]"
            >
              Open financial ledger <ChevronRight size={14} />
            </Link>
          </div>
          <RecordState
            pending={finance.isPending}
            error={finance.isError}
            empty={
              !finance.isPending &&
              !finance.isError &&
              !financeSummary.recognizedRevenueRecords &&
              !financeSummary.expenseRecords
            }
          >
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <FinanceValue
                label="Recorded revenue"
                value={
                  financeSummary.recognizedRevenueRecords
                    ? formatMoneyBuckets(financeSummary.revenue)
                    : "Awaiting live data"
                }
              />
              <FinanceValue
                label="Company expenses"
                value={
                  financeSummary.expenseRecords
                    ? formatMoneyBuckets(financeSummary.expenses)
                    : "Awaiting live data"
                }
                tone="negative"
              />
              <FinanceValue
                label="Operating position"
                value={
                  financeSummary.recognizedRevenueRecords ||
                  financeSummary.expenseRecords
                    ? formatMoneyBuckets(financeSummary.netPosition)
                    : "Awaiting live data"
                }
                tone="negative"
              />
            </div>
          </RecordState>
        </section>

        <section className="mt-5 rounded-2xl border border-[#c9d7ec] bg-[#f7faff] p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-[#eaf3ff] text-[#4a87c9]"><Layers3 size={16} /></span>
                <h2 className="font-display text-[16px] font-bold text-[#152239]">CEO technology integration</h2>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-400">A concise executive aggregation of the live Product, Engineering and Security command centres.</p>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">Organisation-scoped · RLS enforced</span>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {executiveAreas.map((area) => (
              <ExecutiveAreaCard key={area.title} area={area} />
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-[#eaf3ff] text-[#4a87c9]"><Layers3 size={16} /></span>
                <h2 className="font-display text-[16px] font-bold text-[#152239]">Technology delivery and security</h2>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-400">Open the live Product, Engineering and Security command centres for detailed operational records.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Link to="/product" className="rounded-xl border border-slate-100 bg-[#f7f9fb] p-4 transition hover:border-[#bfe9da] hover:bg-[#f2fcf8]"><p className="text-[11px] font-bold text-slate-700">Product</p><p className="mt-1 text-[10px] leading-5 text-slate-400">Roadmaps, backlog, releases and feedback.</p><span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#1c9574]">Open Product <ChevronRight size={13} /></span></Link>
            <Link to="/engineering" className="rounded-xl border border-slate-100 bg-[#f7f9fb] p-4 transition hover:border-[#bfe9da] hover:bg-[#f2fcf8]"><p className="text-[11px] font-bold text-slate-700">Engineering</p><p className="mt-1 text-[10px] leading-5 text-slate-400">Projects, operational links and deployments.</p><span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#1c9574]">Open Engineering <ChevronRight size={13} /></span></Link>
            <Link to="/security" className="rounded-xl border border-slate-100 bg-[#f7f9fb] p-4 transition hover:border-[#bfe9da] hover:bg-[#f2fcf8]"><p className="text-[11px] font-bold text-slate-700">Security</p><p className="mt-1 text-[10px] leading-5 text-slate-400">Controls, tests, findings and remediation.</p><span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#1c9574]">Open Security <ChevronRight size={13} /></span></Link>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-[#e8f8f2] text-[#1b9975]"><Clock3 size={16} /></span>
            <div>
              <h2 className="font-display text-[16px] font-bold text-[#152239]">Recent operational activity</h2>
              <p className="mt-1 text-[11px] text-slate-400">Recent records with reliable timestamps from the authenticated organisation scope.</p>
            </div>
          </div>
          {technologyDashboard.isPending ? (
            <div className="mt-4"><LoadingState /></div>
          ) : technologyError ? (
            <div className="mt-4"><ErrorState message="Unable to load executive data." /></div>
          ) : recentActivity.length ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-[#f7f9fb] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold text-slate-700">{activity.label}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{activity.area}</p>
                  </div>
                  <time className="shrink-0 text-[10px] text-slate-400">{formatLiveDate(activity.timestamp)}</time>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4"><EmptyState>No recent operational activity recorded.</EmptyState></div>
          )}
        </section>

        <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200/70 pt-5 text-[10px] text-slate-400 sm:flex-row">
          <span>MedMap Operating System · Supabase-backed command centre</span>
          <span>Live data → Evidence → Status → Action</span>
        </footer>
      </div>
    </AppShell>
  );
}

function FinanceValue({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "negative";
}) {
  return (
    <div className="rounded-xl bg-[#f7f9fb] p-3.5">
      <p className="text-[10px] font-medium text-slate-400">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-[22px] font-bold",
          tone === "negative" ? "text-[#c1514d]" : "text-[#152239]",
        )}
      >
        {value}
      </p>
    </div>
  );
}
