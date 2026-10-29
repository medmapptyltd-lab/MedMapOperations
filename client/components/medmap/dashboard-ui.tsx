import { Link } from "react-router-dom";
import {
  AlertCircle as AlertIcon,
  CalendarDays as CalendarIcon,
  ChevronRight,
  Target as TargetIcon,
  UsersRound as UsersIcon,
} from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  isOverdueTimestamp,
  isResolvedStatus,
  normaliseStatus,
  statusToDisplay,
  useExecutiveSummary,
  type CompanyAlert,
  type DashboardScope,
  type ExecutiveKpiRow,
} from "@/lib/executive-dashboard";
import {
  displayEmployeeName,
  useOperationsDashboard,
} from "@/lib/operations-dashboard";

export type Tone = "mint" | "red" | "amber" | "navy";

const toneIcon: Record<Tone, string> = {
  mint: "bg-[#e8f8f2] text-[#1b9975]",
  red: "bg-[#ffe9e6] text-[#bf5b56]",
  amber: "bg-[#fff2d9] text-[#b3781f]",
  navy: "bg-[#eaf0f8] text-[#2f527a]",
};

const toneDot: Record<Tone, string> = {
  mint: "bg-[#36ac87]",
  red: "bg-[#da6560]",
  amber: "bg-[#e0a03a]",
  navy: "bg-[#4a87c9]",
};

export function formatLiveDate(value: string | null | undefined) {
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

export function priorityClass(priority: string | null | undefined) {
  const value = (priority ?? "").trim().toLowerCase();
  if (["critical", "urgent"].includes(value)) return "bg-[#ffe5e3] text-[#bd504d]";
  if (["high"].includes(value)) return "bg-[#fff2d9] text-[#9a6419]";
  if (["normal", "medium"].includes(value)) return "bg-[#eaf3ff] text-[#4a87c9]";
  return "bg-slate-100 text-slate-500";
}

export function statusClass(status: string | null | undefined) {
  const value = (status ?? "").trim().toLowerCase();
  if (isResolvedStatus(status ?? "")) return "bg-[#e8f8f2] text-[#168465]";
  if (
    ["critical", "blocked", "failed", "overdue", "cancelled", "closed"].includes(value)
  )
    return "bg-[#ffe5e3] text-[#bd504d]";
  if (
    ["pending", "pending_customer", "pending_internal", "at risk", "warning"].includes(value)
  )
    return "bg-[#fff2d9] text-[#9a6419]";
  if (
    ["assigned", "in progress", "started", "in_progress", "escalated", "open"].includes(value)
  )
    return "bg-[#f1edff] text-[#755bc0]";
  return "bg-slate-100 text-slate-500";
}

export function caseStatusClass(status: string | null | undefined) {
  const value = (status ?? "").trim().toLowerCase();
  if (["resolved", "closed"].includes(value)) return "bg-[#e8f8f2] text-[#168465]";
  if (["cancelled"].includes(value)) return "bg-[#ffe5e3] text-[#bd504d]";
  if (["pending_customer", "pending_internal"].includes(value))
    return "bg-[#fff2d9] text-[#9a6419]";
  if (["escalated", "in_progress", "open"].includes(value))
    return "bg-[#f1edff] text-[#755bc0]";
  return "bg-slate-100 text-slate-500";
}

export type MetricProps = {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
  icon: ElementType;
  onClick?: () => void;
};

export function Metric({ label, value, detail, tone, icon: Icon, onClick }: MetricProps) {
  const content = (
    <>
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "grid size-9 place-items-center rounded-xl",
            toneIcon[tone],
          )}
        >
          <Icon size={17} />
        </span>
        <span className={cn("size-1.5 rounded-full", toneDot[tone])} />
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
    </>
  );
  const className =
    "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_5px_20px_rgba(21,36,58,0.035)]";
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(className, "text-left")}>
        {content}
      </button>
    );
  }
  return <div className={className}>{content}</div>;
}

export function StateMessage({
  children,
  tone = "empty",
  onRetry,
}: {
  children: ReactNode;
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

export function SectionHeader({
  icon: Icon,
  title,
  description,
  pillText,
  pillTone = "mint",
  linkHref,
  linkLabel,
  iconBg = "bg-[#fff1e9]",
  iconColor = "text-[#d4784f]",
}: {
  icon: ElementType;
  title: string;
  description: string;
  pillText?: string;
  pillTone?: Tone;
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

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6",
        className,
      )}
    >
      {children}
    </article>
  );
}

export function KpiRow({ row }: { row: ExecutiveKpiRow }) {
  const tone = statusToDisplay(row.status);
  return (
    <div className="rounded-xl border border-slate-100 bg-[#f8fafc] p-3">
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
          {row.calculatedPercentage !== null
            ? `${Math.round(row.calculatedPercentage)}%`
            : row.status || "Pending"}
        </span>
      </div>
    </div>
  );
}

export function KpiCard({
  title,
  description,
  pillText,
  pillTone = "mint",
  rows,
  isLoading,
  isError,
  emptyText,
  note,
  linkHref = "/kpis",
  linkLabel = "Open KPIs",
}: {
  title: string;
  description: string;
  pillText: string;
  pillTone?: Tone;
  rows: ExecutiveKpiRow[];
  isLoading: boolean;
  isError: boolean;
  emptyText: string;
  note?: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <Card>
      <SectionHeader
        icon={TargetIcon}
        title={title}
        description={description}
        pillText={pillText}
        pillTone={pillTone}
        linkHref={linkHref}
        linkLabel={linkLabel}
        iconBg="bg-[#eaf0f8]"
        iconColor="text-[#2f527a]"
      />
      <div className="mt-5 space-y-3">
        {isLoading && <StateMessage>Loading KPI snapshot…</StateMessage>}
        {isError && <StateMessage tone="error">KPI snapshot unavailable.</StateMessage>}
        {!isLoading && !isError && !rows.length && <StateMessage>{emptyText}</StateMessage>}
        {!isLoading && !isError && note && !rows.length && (
          <StateMessage>{note}</StateMessage>
        )}
        {!isLoading && !isError && note && rows.length > 0 && (
          <StateMessage>{note}</StateMessage>
        )}
        {!isLoading &&
          !isError &&
          rows.slice(0, 5).map((row) => <KpiRow key={row.id} row={row} />)}
      </div>
    </Card>
  );
}

export function PeopleCard({
  scope,
  title,
  description,
  emptyText,
  pillTone = "mint",
  jobFallback = "Active team member",
}: {
  scope: DashboardScope;
  title: string;
  description: string;
  emptyText: string;
  pillTone?: Tone;
  jobFallback?: string;
}) {
  const summary = useExecutiveSummary(scope);
  const employees = summary.people.data?.employees ?? [];
  const active = employees.filter((e) => normaliseStatus(e.employee_status) === "active");
  return (
    <Card>
      <SectionHeader
        icon={UsersIcon}
        title={title}
        description={description}
        pillText={`${active.length} active`}
        pillTone={pillTone}
        linkHref="/people"
        linkLabel="Open People"
        iconBg="bg-[#e8f8f2]"
        iconColor="text-[#1b9975]"
      />
      <div className="mt-5 space-y-2">
        {summary.people.isPending && <StateMessage>Loading team directory…</StateMessage>}
        {summary.people.isError && (
          <StateMessage tone="error">Team directory unavailable.</StateMessage>
        )}
        {!summary.people.isPending && !summary.people.isError && !active.length && (
          <StateMessage>{emptyText}</StateMessage>
        )}
        {!summary.people.isPending &&
          !summary.people.isError &&
          active.slice(0, 8).map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-[#f8fafc] p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-slate-700">
                  {`${e.first_name} ${e.last_name}`.trim()}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-slate-400">
                  {e.job_title || jobFallback}
                </p>
              </div>
              <span className="rounded-full bg-[#e8f8f2] px-2 py-1 text-[10px] font-bold text-[#168465]">
                Active
              </span>
            </div>
          ))}
      </div>
    </Card>
  );
}

export function DeadlinesCard({
  scope,
  title = "Meetings & deadlines",
  description = "Upcoming scoped deadlines with owner visibility.",
}: {
  scope: DashboardScope;
  title?: string;
  description?: string;
}) {
  const dashboard = useOperationsDashboard(scope);
  const deadlines = dashboard.data?.deadlines ?? [];
  const employees = dashboard.data?.employees ?? [];
  const active = deadlines
    .filter((d) => !isResolvedStatus(d.status))
    .sort((a, b) => a.due_at.localeCompare(b.due_at))
    .slice(0, 5);
  return (
    <Card>
      <SectionHeader
        icon={CalendarIcon}
        title={title}
        description={description}
        pillText={`${active.length} pending`}
        pillTone={active.some((d) => isOverdueTimestamp(d.due_at, d.status)) ? "red" : "amber"}
        linkHref="/meetings"
        linkLabel="Open Meetings"
        iconBg="bg-[#fff2d9]"
        iconColor="text-[#b3781f]"
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
                    {displayEmployeeName(employees as never, d.owner_employee_id)} ·{" "}
                    {formatLiveDate(d.due_at)}
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
    </Card>
  );
}

export function AlertsCard({
  title,
  description,
  alerts,
}: {
  title: string;
  description: string;
  alerts: CompanyAlert[];
}) {
  if (!alerts.length) return null;
  return (
    <div className="rounded-2xl border border-[#c9d7ec] bg-[#f7faff] p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <SectionHeader
        icon={AlertIcon}
        title={title}
        description={description}
        pillText={`${alerts.length} active`}
        pillTone="amber"
        iconBg="bg-[#fff2d9]"
        iconColor="text-[#b3781f]"
      />
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {alerts.slice(0, 4).map((a) => (
          <div key={a.id} className="rounded-xl border border-slate-100 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-bold text-slate-700">
                {a.title || "Company alert"}
              </p>
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
  );
}
