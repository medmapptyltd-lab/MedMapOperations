import { useMemo, useState } from "react";
import { ArrowDownRight, Clock3, Ticket, Trash2 } from "lucide-react";
import { useCurrentEmployee } from "@/lib/supabase-identity";
import {
  displayEmployeeName,
  isTicketOverdue,
  useOperationsDashboard,
  useOperationsTicketActions,
} from "@/lib/operations-dashboard";
import { cn } from "@/lib/utils";
import {
  formatLiveDate,
  priorityClass,
  statusClass,
  StateMessage,
} from "@/components/medmap/dashboard-ui";
import {
  WorkState,
  type TaskManagementCentreProps,
  type TicketDraft,
} from "./operations-shared";

export const TICKET_STATUSES = ["open", "in_progress", "blocked", "completed", "cancelled"];

type TicketCentreProps = TaskManagementCentreProps;

export function TicketManagementCentre({ scope, showHeader = true, maxRows }: TicketCentreProps) {
  const dashboard = useOperationsDashboard(scope);
  const employeeState = useCurrentEmployee();
  const ticketActions = useOperationsTicketActions();
  const [filter, setFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<TicketDraft>({
    title: "",
    category: "",
    priority: "",
    reportedBy: "",
    assignedTo: "",
    departmentId: "",
    dueDate: "",
    description: "",
  });
  const data = dashboard.data;
  const tickets = data?.tickets ?? [];
  const ticketStatuses = useMemo(() => {
    const statuses = new Set(tickets.map((ticket) => ticket.status));
    return [
      "All",
      ...TICKET_STATUSES.filter((status) => statuses.has(status)),
      ...[...statuses].filter((status) => !TICKET_STATUSES.includes(status)),
    ];
  }, [tickets]);
  const filteredTickets = useMemo(() => {
    const base = tickets.filter((ticket) => filter === "All" || ticket.status === filter);
    return maxRows ? base.slice(0, maxRows) : base;
  }, [tickets, filter, maxRows]);
  const activeEmployees = (data?.employees ?? []).filter(
    (employee) => employee.employee_status.trim().toLowerCase() === "active",
  );
  const updateDraft = (key: keyof TicketDraft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const submitTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !draft.title.trim() ||
      !draft.category.trim() ||
      !draft.priority.trim() ||
      !draft.description.trim()
    )
      return;
    try {
      await ticketActions.createTicket.mutateAsync({
        title: draft.title.trim(),
        category: draft.category.trim(),
        priority: draft.priority.trim(),
        reportedBy: draft.reportedBy || employeeState.employee?.id || null,
        assignedTo: draft.assignedTo || null,
        departmentId: draft.departmentId || null,
        dueDate: draft.dueDate || null,
        description: draft.description.trim(),
      });
      setDraft({
        title: "",
        category: "",
        priority: "",
        reportedBy: "",
        assignedTo: "",
        departmentId: "",
        dueDate: "",
        description: "",
      });
      setShowAdd(false);
    } catch {
      return;
    }
  };

  const hasAny = filter === "All" || filteredTickets.length > 0 || tickets.length > 0;
  const emptyWhen = filter !== "All" ? !filteredTickets.length : !tickets.length;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_5px_20px_rgba(21,36,58,0.035)]">
      {showHeader && (
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#fff1e9] text-[#d4784f]">
                <Ticket size={16} />
              </span>
              <h2 className="font-display text-[16px] font-bold text-[#152239]">
                Ticket management centre
              </h2>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Live ticket records with backend status, ownership and due dates.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdd((current) => !current)}
              className="inline-flex items-center gap-1 rounded-xl bg-[#182842] px-3 py-1.5 text-[10px] font-bold text-white hover:bg-[#233958]"
            >
              <Ticket size={12} /> {showAdd ? "Hide form" : "Log a ticket"}
            </button>
            <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {ticketStatuses.map((status) => (
                <button
                  type="button"
                  key={status}
                  onClick={() => setFilter(status)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-[10px] font-bold",
                    filter === status
                      ? "bg-white text-[#168465] shadow-sm"
                      : "text-slate-400",
                  )}
                >
                  {status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <form
          onSubmit={submitTicket}
          className="border-b border-slate-100 bg-[#f2fcf8] p-5 sm:p-6"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-[10px] font-bold text-slate-500 sm:col-span-2">
              Title
              <input
                required
                value={draft.title}
                onChange={(event) => updateDraft("title", event.target.value)}
                className="form-input"
                placeholder="What needs to happen?"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500">
              Category
              <input
                required
                value={draft.category}
                onChange={(event) => updateDraft("category", event.target.value)}
                className="form-input"
                placeholder="Operational category"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500">
              Priority
              <input
                required
                value={draft.priority}
                onChange={(event) => updateDraft("priority", event.target.value)}
                className="form-input"
                placeholder="Backend priority"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500">
              Reported by
              <select
                value={draft.reportedBy}
                onChange={(event) => updateDraft("reportedBy", event.target.value)}
                className="form-input"
              >
                <option value="">Current employee</option>
                {activeEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {`${employee.first_name} ${employee.last_name}`.trim()}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-bold text-slate-500">
              Assignee
              <select
                value={draft.assignedTo}
                onChange={(event) => updateDraft("assignedTo", event.target.value)}
                className="form-input"
              >
                <option value="">Unassigned</option>
                {activeEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {`${employee.first_name} ${employee.last_name}`.trim()}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-bold text-slate-500">
              Department
              <select
                value={draft.departmentId}
                onChange={(event) => updateDraft("departmentId", event.target.value)}
                className="form-input"
              >
                <option value="">No department</option>
                {(data?.departments ?? [])
                  .filter((department) => department.active)
                  .map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-[10px] font-bold text-slate-500">
              Due date
              <input
                type="date"
                value={draft.dueDate}
                onChange={(event) => updateDraft("dueDate", event.target.value)}
                className="form-input"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500 sm:col-span-2 lg:col-span-4">
              Description
              <textarea
                required
                value={draft.description}
                onChange={(event) => updateDraft("description", event.target.value)}
                className="form-input min-h-20 resize-y"
                placeholder="Describe the operational work."
              />
            </label>
          </div>
          {ticketActions.createTicket.isError && (
            <div className="mt-4">
              <StateMessage tone="error">
                The ticket could not be created. Check the connection and try again.
              </StateMessage>
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-bold text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={ticketActions.createTicket.isPending}
              className="rounded-xl bg-[#168465] px-4 py-2.5 text-[11px] font-bold text-white hover:bg-[#126b53] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {ticketActions.createTicket.isPending ? "Creating..." : "Create ticket"}
            </button>
          </div>
        </form>
      )}

      <WorkState
        pending={dashboard.isPending}
        error={dashboard.isError}
        empty={emptyWhen}
      >
        No live tickets match this filter.
      </WorkState>
      {hasAny && filteredTickets.length > 0 && !dashboard.isPending && !dashboard.isError && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                <th className="px-5 py-3 font-bold sm:px-6">Ticket</th>
                <th className="px-3 py-3 font-bold">Requester</th>
                <th className="px-3 py-3 font-bold">Owner</th>
                <th className="px-3 py-3 font-bold">Status</th>
                <th className="px-3 py-3 font-bold">Due</th>
                <th className="px-3 py-3 font-bold">Priority</th>
                <th className="px-3 py-3 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-slate-50 text-[11px] last:border-0"
                >
                  <td className="px-5 py-4 sm:px-6">
                    <p className="font-bold text-slate-700">
                      {ticket.title || "Untitled ticket"}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                      <span>
                        {ticket.ticket_number !== null
                          ? `#${ticket.ticket_number}`
                          : "Ticket reference not provided"}
                      </span>
                      {ticket.category ? <span>· {ticket.category}</span> : null}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-slate-500">
                    {displayEmployeeName(data?.employees ?? [], ticket.reported_by)}
                  </td>
                  <td className="px-3 py-4 text-slate-500">
                    {displayEmployeeName(data?.employees ?? [], ticket.assigned_to)}
                  </td>
                  <td className="px-3 py-4">
                    <select
                      value={ticket.status}
                      onChange={(event) =>
                        ticketActions.updateTicket.mutate({
                          id: ticket.id,
                          status: event.target.value,
                        })
                      }
                      className={cn(
                        "rounded-full border-0 px-2 py-1 text-[10px] font-bold outline-none",
                        statusClass(ticket.status),
                      )}
                    >
                      {ticketStatuses
                        .filter((status) => status !== "All")
                        .map((status) => (
                          <option key={status} value={status}>
                            {status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="px-3 py-4 text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={12} />
                      {formatLiveDate(ticket.due_date)}
                      {isTicketOverdue(ticket) ? (
                        <ArrowDownRight size={12} className="text-[#bd504d]" />
                      ) : null}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-[10px] font-bold",
                        priorityClass(ticket.priority),
                      )}
                    >
                      {ticket.priority || "Priority not provided"}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <button
                      type="button"
                      onClick={() => ticketActions.deleteTicket.mutate(ticket.id)}
                      disabled={ticketActions.deleteTicket.isPending}
                      className="rounded-lg p-2 text-slate-400 hover:bg-[#fff0ee] hover:text-[#bd504d] disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Delete ${ticket.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(ticketActions.updateTicket.isError || ticketActions.deleteTicket.isError) && (
        <div className="p-5">
          <StateMessage tone="error">
            The ticket change could not be saved. Check the connection and try again.
          </StateMessage>
        </div>
      )}
    </section>
  );
}
