import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Layers3,
  Link2,
  Ticket,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatLiveDate,
  priorityClass,
  statusClass,
  StateMessage,
} from "@/components/medmap/dashboard-ui";
import {
  buildDepartmentWorkload,
  buildOperationsSummary,
  displayEmployeeName,
  useOperationsDashboard,
  type OperationsDeadline,
  type OperationsEmployee,
  type OperationsEmployeeWorkload,
  type OperationsKpiWorkload,
  type OperationsTask,
} from "@/lib/operations-dashboard";

export type TaskDraft = {
  title: string;
  description: string;
  priority: string;
  assignedTo: string;
  departmentId: string;
  dueDate: string;
  progressPercentage: string;
};

export type CaseDraft = {
  subject: string;
  description: string;
  priority: string;
  status: string;
  source: string;
  assignedToEmployeeId: string;
  reportedByEmployeeId: string;
  customerType: string;
  resolutionSummary: string;
  internalNotes: string;
};

export function WorkState({
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
  if (pending)
    return <StateMessage>Loading live operational data...</StateMessage>;
  if (error)
    return (
      <StateMessage tone="error">
        This operational section could not be loaded. Try again after the
        connection is available.
      </StateMessage>
    );
  if (empty) return <StateMessage>{children}</StateMessage>;
  return null;
}

export function WorkBreakdown({
  summary,
}: {
  summary: ReturnType<typeof buildOperationsSummary>;
}) {
  return (
    <div className="mt-5 grid gap-3 md:grid-cols-3">
      <div className="rounded-xl bg-[#f7f9fb] p-3.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-medium text-slate-400">Tasks</p>
          <CheckCircle2 size={15} className="text-[#168465]" />
        </div>
        <p className="mt-2 font-display text-[22px] font-bold text-[#152239]">
          {summary.activeTaskCount}
        </p>
        <p className="mt-1 text-[10px] text-slate-400">
          {summary.completedTaskCount} completed · {summary.dueSoonTaskCount}{" "}
          due soon · {summary.overdueTaskCount} overdue
        </p>
      </div>
      <div className="rounded-xl bg-[#f7f9fb] p-3.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-medium text-slate-400">Tickets</p>
          <Ticket size={15} className="text-[#d4784f]" />
        </div>
        <p className="mt-2 font-display text-[22px] font-bold text-[#152239]">
          {summary.openTicketCount}
        </p>
        <p className="mt-1 text-[10px] text-slate-400">
          {summary.resolvedTicketCount} resolved · {summary.dueSoonTicketCount}{" "}
          due soon · {summary.overdueTicketCount} overdue
        </p>
      </div>
      <div className="rounded-xl bg-[#f7f9fb] p-3.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-medium text-slate-400">Deadlines</p>
          <CalendarClock size={15} className="text-[#b3781f]" />
        </div>
        <p className="mt-2 font-display text-[22px] font-bold text-[#152239]">
          {summary.activeDeadlineCount}
        </p>
        <p className="mt-1 text-[10px] text-slate-400">
          {summary.dueSoonDeadlineCount} due soon ·{" "}
          {summary.overdueDeadlineCount} overdue
        </p>
      </div>
    </div>
  );
}

export function DepartmentWorkload({
  rows,
}: {
  rows: ReturnType<typeof buildDepartmentWorkload>;
}) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-[#eaf3ff] text-[#4a87c9]">
          <Layers3 size={16} />
        </span>
        <h2 className="font-display text-[16px] font-bold text-[#152239]">
          Department workload
        </h2>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        Active tasks, open tickets and near-term deadlines by live department.
      </p>
      {rows.length ? (
        <div className="mt-4 space-y-2">
          {rows.slice(0, 6).map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-slate-100 bg-[#f8fafc] p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold text-slate-700">
                  {row.name}
                </p>
                {row.overdueWork ? (
                  <span className="rounded-full bg-[#ffe5e3] px-2 py-1 text-[10px] font-bold text-[#bd504d]">
                    {row.overdueWork} overdue
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                {row.activeTasks} active tasks · {row.openTickets} open tickets
                · {row.upcomingDeadlines} due soon
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <StateMessage>
            No active department workload is available.
          </StateMessage>
        </div>
      )}
    </article>
  );
}

export function EmployeeWorkload({ rows }: { rows: OperationsEmployeeWorkload[] }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-[#e8f8f2] text-[#1b9975]">
          <Users size={16} />
        </span>
        <h2 className="font-display text-[16px] font-bold text-[#152239]">
          Employee workload
        </h2>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        Live active employees with assigned operational work.
      </p>
      {rows.length ? (
        <div className="mt-4 space-y-2">
          {rows.slice(0, 6).map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-slate-100 bg-[#f8fafc] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-slate-700">
                    {row.name}
                  </p>
                  <p className="mt-1 truncate text-[10px] text-slate-400">
                    {row.jobTitle || row.departmentName || "Active employee"}
                  </p>
                </div>
                {row.overdueWork ? (
                  <span className="rounded-full bg-[#ffe5e3] px-2 py-1 text-[10px] font-bold text-[#bd504d]">
                    {row.overdueWork} overdue
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                {row.activeTasks} tasks · {row.openTickets} tickets ·{" "}
                {row.ownedDeadlines} deadlines
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <StateMessage>No active employee workload is available.</StateMessage>
        </div>
      )}
    </article>
  );
}

export function KpiWorkload({ rows }: { rows: OperationsKpiWorkload[] }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-[#fff2d9] text-[#b3781f]">
          <Link2 size={16} />
        </span>
        <h2 className="font-display text-[16px] font-bold text-[#152239]">
          KPI-linked work
        </h2>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        Operational tasks and tickets linked to live KPI relationships.
      </p>
      {rows.length ? (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {rows.slice(0, 6).map((row) => (
            <div key={row.id} className="rounded-xl bg-[#f7f9fb] p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-bold text-slate-700">
                  {row.name}
                </p>
                {row.status ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-[10px] font-bold",
                      statusClass(row.status),
                    )}
                  >
                    {row.status}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-[10px] text-slate-400">
                {row.activeTasks} active tasks · {row.openTickets} open tickets
                {row.periodName ? ` · ${row.periodName}` : ""}
              </p>
              {row.target !== null || row.actual !== null ? (
                <p className="mt-1 text-[10px] text-slate-500">
                  Target {row.target ?? "—"} · Actual {row.actual ?? "—"}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <StateMessage>
            No KPI-linked operational work is available.
          </StateMessage>
        </div>
      )}
    </article>
  );
}

export function AlertList({
  alerts,
}: {
  alerts: NonNullable<
    ReturnType<typeof useOperationsDashboard>["data"]
  >["alerts"];
}) {
  return (
    <article className="rounded-2xl border border-[#c9d7ec] bg-[#f7faff] p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-[#fff2d9] text-[#b3781f]">
            <AlertCircle size={16} />
          </span>
          <h2 className="font-display text-[16px] font-bold text-[#152239]">
            Operational alerts
          </h2>
        </div>
        <span className="rounded-full bg-[#fff2d9] px-2.5 py-1 text-[10px] font-bold text-[#9a6419]">
          {alerts.length}
        </span>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        Active company alerts returned through the authenticated data path.
      </p>
      {alerts.length ? (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {alerts.slice(0, 4).map((alert) => (
            <div
              key={alert.id}
              className="rounded-xl border border-slate-100 bg-white p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-bold text-slate-700">
                  {alert.title || "Company alert"}
                </p>
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-[10px] font-bold",
                    statusClass(alert.severity || alert.status),
                  )}
                >
                  {alert.severity || alert.status || "Alert"}
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-5 text-slate-400">
                {alert.message || "No alert detail provided."}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <StateMessage>
            No active operational alerts are available.
          </StateMessage>
        </div>
      )}
    </article>
  );
}

export function TaskList({
  tasks,
  employees,
}: {
  tasks: OperationsTask[];
  employees: OperationsEmployee[];
}) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-[#eaf3ff] text-[#4a87c9]">
          <CheckCircle2 size={16} />
        </span>
        <h2 className="font-display text-[16px] font-bold text-[#152239]">
          Active tasks
        </h2>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        Live task records with current owners, progress and due dates.
      </p>
      {tasks.length ? (
        <div className="mt-4 space-y-2">
          {tasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className="rounded-xl border border-slate-100 bg-[#f8fafc] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-slate-700">
                    {task.title || "Untitled task"}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {displayEmployeeName(employees, task.assigned_to)}
                    {task.due_date
                      ? ` · due ${formatLiveDate(task.due_date)}`
                      : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-1 text-[10px] font-bold",
                    statusClass(task.status),
                  )}
                >
                  {task.status || "Status not provided"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-400">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-bold",
                    priorityClass(task.priority),
                  )}
                >
                  {task.priority || "Priority not provided"}
                </span>
                {task.progress_percentage !== null
                  ? `${task.progress_percentage}% complete`
                  : "Progress not provided"}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <StateMessage>
            No active operational tasks are available.
          </StateMessage>
        </div>
      )}
    </article>
  );
}

export function DeadlineList({
  deadlines,
  employees,
}: {
  deadlines: OperationsDeadline[];
  employees: OperationsEmployee[];
}) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-[#fff2d9] text-[#b3781f]">
          <CalendarClock size={16} />
        </span>
        <h2 className="font-display text-[16px] font-bold text-[#152239]">
          Upcoming deadlines
        </h2>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">
        Live deadlines sorted by their backend due time.
      </p>
      {deadlines.length ? (
        <div className="mt-4 space-y-2">
          {deadlines.slice(0, 5).map((deadline) => (
            <div
              key={deadline.id}
              className="rounded-xl border border-slate-100 bg-[#f8fafc] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-slate-700">
                    {deadline.title || "Untitled deadline"}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {displayEmployeeName(employees, deadline.owner_employee_id)}{" "}
                    · {formatLiveDate(deadline.due_at)}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-1 text-[10px] font-bold",
                    statusClass(deadline.status),
                  )}
                >
                  {deadline.status || "Status not provided"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-400">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-bold",
                    priorityClass(deadline.priority),
                  )}
                >
                  {deadline.priority || "Priority not provided"}
                </span>
                {deadline.linked_task_id || deadline.linked_ticket_id ? (
                  <span>Linked operational record</span>
                ) : (
                  <span>No linked record</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <StateMessage>No upcoming deadlines are available.</StateMessage>
        </div>
      )}
    </article>
  );
}

export type TicketDraft = {
  title: string;
  category: string;
  priority: string;
  reportedBy: string;
  assignedTo: string;
  departmentId: string;
  dueDate: string;
  description: string;
};

export const TASK_STATUSES = ["not_started", "in_progress", "blocked", "completed", "cancelled"];
export const CASE_STATUSES = ["open", "in_progress", "pending_customer", "pending_internal", "escalated", "resolved", "closed", "cancelled"];
export const CASE_PRIORITIES = ["low", "medium", "high", "critical"];
export const CASE_SOURCES = ["internal", "phone", "email", "whatsapp", "web", "app", "social", "referral", "other"];
export const CASE_CUSTOMER_TYPES = ["patient", "doctor", "ambassador", "other"];

export type TaskManagementCentreProps = {
  scope?: Parameters<typeof useOperationsDashboard>[0];
  showHeader?: boolean;
  maxRows?: number;
};
