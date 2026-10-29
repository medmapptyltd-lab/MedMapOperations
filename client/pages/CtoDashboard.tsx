import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Boxes,
  CheckSquare,
  ChevronRight,
  CircuitBoard,
  Cpu,
  GitBranch,
  ShieldCheck,
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
  useOperationsDashboard,
} from "@/lib/operations-dashboard";
import {
  buildKpiRows,
  isResolvedStatus,
  useExecutiveAlerts,
  useExecutiveSummary,
  type DashboardScope,
} from "@/lib/executive-dashboard";
import {
  useProductEngineeringDashboard,
  type ProductEngineeringDashboardData,
} from "@/lib/product-engineering-dashboard";
import {
  AlertsCard,
  Card,
  DeadlinesCard,
  KpiCard,
  Metric,
  PeopleCard,
  StateMessage,
} from "@/components/medmap/dashboard-ui";

type CtoScope = DashboardScope & { executiveEmployeeId?: string };

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
        { label: "Projects", value: data?.projects.length ?? 0 },
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
        { label: "Deployments", value: data?.deployments.length ?? 0 },
        { label: "Releases", value: data?.releases.length ?? 0 },
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
        { label: "Controls", value: data?.controls.length ?? 0 },
      ],
    },
  } as const;
  const c = config[area];
  const hasAny = c.metrics().some((m) => m.value > 0);
  const state = isPending ? "loading" : isError ? "error" : hasAny ? "live" : "empty";
  const stateLabel =
    state === "loading"
      ? "Loading technology data…"
      : state === "error"
        ? "Unable to load technology data."
        : state === "empty"
          ? "No technology data recorded."
          : "Live records available.";
  const stateClass =
    state === "error" ? "text-[#bd504d]" : state === "empty" ? "text-slate-400" : "text-[#1f9d80]";
  return (
    <Card>
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
            <h3 className="font-display text-[16px] font-bold text-[#152239]">{area}</h3>
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
    </Card>
  );
}

const TECH_KPI_KEYWORDS = [
  "system",
  "uptime",
  "tech",
  "deploy",
  "release",
  "security",
  "quality",
  "defect",
  "availability",
  "response",
  "mttr",
  "mtt",
  "product",
  "engineering",
  "sla",
];

export default function CtoDashboard({ scope }: { scope: CtoScope }) {
  const techScope: DashboardScope = {
    departmentIds: scope.departmentIds,
    employeeId: scope.executiveEmployeeId,
  };
  const dashboard = useOperationsDashboard(techScope);
  const summary = buildOperationsSummary(dashboard.data);
  const engineering = useProductEngineeringDashboard();
  const exec = useExecutiveSummary(techScope);
  const alerts = useExecutiveAlerts(techScope);

  const alertRows = (alerts.data ?? []).filter((a) => !isResolvedStatus(a.status));

  const { rows: kpiRows, period: kpiPeriod } = buildKpiRows(exec.kpis.data);
  const techKpis = kpiRows.filter((r) => {
    const name = r.name.toLowerCase();
    return TECH_KPI_KEYWORDS.some((keyword) => name.includes(keyword));
  });
  const kpiCardRows = techKpis.length ? techKpis : kpiRows.slice(0, 4);
  const kpiNote = techKpis.length
    ? undefined
    : kpiRows.length
      ? "No explicitly technology-tagged KPIs found. Showing scoped KPIs."
      : undefined;

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
            <StateMessage
              tone="error"
              onRetry={() => {
                dashboard.refetch();
                engineering.refetch();
              }}
            >
              Technology workload could not be loaded.
            </StateMessage>
          ) : (
            <TechWorkloadMetrics summary={summary} engineering={engineering} />
          )}
        </div>

        <div className="mt-5">
          <AlertsCard
            title="Technology alerts"
            description="Company alerts scoped to technology departments."
            alerts={alertRows}
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          <TechAreaCard area="Product" data={engineering.data} isPending={engineering.isPending} isError={engineering.isError} />
          <TechAreaCard area="Engineering" data={engineering.data} isPending={engineering.isPending} isError={engineering.isError} />
          <TechAreaCard area="Security" data={engineering.data} isPending={engineering.isPending} isError={engineering.isError} />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <KpiCard
            title="Technology KPIs"
            description="Technology, product, engineering and security-linked KPI targets and actuals."
            pillText={kpiPeriod?.period_name || "Current period"}
            pillTone="navy"
            rows={kpiCardRows}
            isLoading={exec.kpis.isPending}
            isError={exec.kpis.isError}
            emptyText="No KPI records are scoped to technology."
            note={kpiNote}
            linkLabel="Open all KPIs"
          />
          <DeadlinesCard
            scope={techScope}
            description="Upcoming scoped deadlines with owner visibility."
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <TaskManagementCentre scope={techScope} showHeader={true} maxRows={6} />
          <PeopleCard
            scope={techScope}
            title="Technology team"
            description="Active employees scoped to product, engineering and security departments."
            emptyText="No employees are scoped to technology."
            pillTone="navy"
            jobFallback="Technology team member"
          />
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
