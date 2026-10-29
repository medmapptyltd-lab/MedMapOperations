import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  CheckSquare,
  ClipboardList,
  Clock3,
  LifeBuoy,
  Link2,
  Ticket,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { AppShell } from "@/components/medmap/AppShell";
import { isResolvedStatus } from "@/lib/executive-dashboard";
import { useCurrentEmployee } from "@/lib/supabase-identity";
import {
  buildDepartmentWorkload,
  buildEmployeeWorkload,
  buildKpiWorkload,
  buildOperationsSummary,
  displayEmployeeName,
  isTicketOverdue,
  useOperationsDashboard,
  useOperationsTicketActions,
} from "@/lib/operations-dashboard";
import { useOperationsTaskActions, useCasesMutations, type TaskInput, type CaseInput } from "@/lib/crud";
import { cn } from "@/lib/utils";
import {
  caseStatusClass,
  formatLiveDate,
  Metric,
  priorityClass,
  StateMessage,
  statusClass,
} from "@/components/medmap/dashboard-ui";
import {
  AlertList,
  CASE_CUSTOMER_TYPES,
  CASE_PRIORITIES,
  CASE_SOURCES,
  CASE_STATUSES,
  DeadlineList,
  DepartmentWorkload,
  EmployeeWorkload,
  KpiWorkload,
  TASK_STATUSES,
  TaskList,
  WorkBreakdown,
  WorkState,
  type CaseDraft,
  type TaskDraft,
  type TicketDraft,
} from "@/components/medmap/operations/operations-shared";
import { TICKET_STATUSES } from "@/components/medmap/operations/TicketManagementCentre";

export { TaskManagementCentre } from "@/components/medmap/operations/TaskManagementCentre";
export { TicketManagementCentre } from "@/components/medmap/operations/TicketManagementCentre";
export { CaseManagementCentre } from "@/components/medmap/operations/CaseManagementCentre";
export type { TaskManagementCentreProps } from "@/components/medmap/operations/operations-shared";

export default function Operations() {
  const dashboard = useOperationsDashboard();
  const employeeState = useCurrentEmployee();
  const ticketActions = useOperationsTicketActions();
  const taskActions = useOperationsTaskActions();
  const caseMutations = useCasesMutations();
  const [showAdd, setShowAdd] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddCase, setShowAddCase] = useState(false);
  const [filter, setFilter] = useState("All");
  const [taskFilter, setTaskFilter] = useState("All");
  const [caseFilter, setCaseFilter] = useState("All");
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
  const [taskDraft, setTaskDraft] = useState<TaskDraft>({
    title: "",
    description: "",
    priority: "medium",
    assignedTo: "",
    departmentId: "",
    dueDate: "",
    progressPercentage: "0",
  });
  const [caseDraft, setCaseDraft] = useState<CaseDraft>({
    subject: "",
    description: "",
    priority: "medium",
    status: "open",
    source: "internal",
    assignedToEmployeeId: "",
    reportedByEmployeeId: "",
    customerType: "",
    resolutionSummary: "",
    internalNotes: "",
  });
  const data = dashboard.data;
  const summary = buildOperationsSummary(data);
  const departmentWorkload = buildDepartmentWorkload(data);
  const employeeWorkload = buildEmployeeWorkload(data);
  const kpiWorkload = buildKpiWorkload(data);
  const ticketStatuses = useMemo(() => {
    const statuses = new Set(
      data?.tickets.map((ticket) => ticket.status) ?? [],
    );
    return [
      "All",
      ...TICKET_STATUSES.filter((status) => statuses.has(status)),
      ...[...statuses].filter((status) => !TICKET_STATUSES.includes(status)),
    ];
  }, [data?.tickets]);

  const tasks = data?.tasks ?? [];
  const cases = data?.cases ?? [];

  const taskStatuses = useMemo(() => {
    const statuses = new Set(tasks.map((task) => task.status));
    return ["All", ...TASK_STATUSES.filter((s) => statuses.has(s)), ...[...statuses].filter((s) => !TASK_STATUSES.includes(s))];
  }, [tasks]);

  const caseStatusOptions = useMemo(() => {
    const statuses = new Set(cases.map((c) => c.status));
    return ["All", ...CASE_STATUSES.filter((s) => statuses.has(s)), ...[...statuses].filter((s) => !CASE_STATUSES.includes(s))];
  }, [cases]);

  const filteredTickets = (data?.tickets ?? []).filter(
    (ticket) => filter === "All" || ticket.status === filter,
  );

  const filteredTasks = tasks.filter(
    (task) => taskFilter === "All" || task.status === taskFilter,
  );

  const filteredCases = cases.filter(
    (c) => caseFilter === "All" || c.status === caseFilter,
  );

  const activeEmployees = (data?.employees ?? []).filter(
    (employee) => employee.employee_status.trim().toLowerCase() === "active",
  );
  const updateDraft = (key: keyof TicketDraft, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const updateTaskDraft = (key: keyof TaskDraft, value: string) =>
    setTaskDraft((current) => ({ ...current, [key]: value }));
  const updateCaseDraft = (key: keyof CaseDraft, value: string) =>
    setCaseDraft((current) => ({ ...current, [key]: value }));

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

  const submitTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!taskDraft.title.trim()) return;
    try {
      await taskActions.createTask.mutateAsync({
        title: taskDraft.title.trim(),
        description: taskDraft.description.trim() || null,
        priority: (taskDraft.priority as "low" | "medium" | "high" | "critical") || "medium",
        assignedTo: taskDraft.assignedTo || null,
        createdBy: employeeState.employee?.id || null,
        departmentId: taskDraft.departmentId || null,
        dueDate: taskDraft.dueDate || null,
        progressPercentage: Number(taskDraft.progressPercentage) || 0,
      });
      setTaskDraft({
        title: "",
        description: "",
        priority: "medium",
        assignedTo: "",
        departmentId: "",
        dueDate: "",
        progressPercentage: "0",
      });
      setShowAddTask(false);
    } catch {
      return;
    }
  };

  const submitCase = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!caseDraft.subject.trim() || !caseDraft.description.trim()) return;
    try {
      await caseMutations.createCase.mutateAsync({
        subject: caseDraft.subject.trim(),
        description: caseDraft.description.trim() || null,
        priority: (caseDraft.priority as "low" | "medium" | "high" | "critical") || "medium",
        status: (caseDraft.status as CaseInput["status"]) || "open",
        source: (caseDraft.source as CaseInput["source"]) || "internal",
        assignedToEmployeeId: caseDraft.assignedToEmployeeId || null,
        reportedByEmployeeId: caseDraft.reportedByEmployeeId || employeeState.employee?.id || null,
        customerType: (caseDraft.customerType as CaseInput["customerType"]) || null,
        resolutionSummary: caseDraft.resolutionSummary.trim() || null,
        internalNotes: caseDraft.internalNotes.trim() || null,
      });
      setCaseDraft({
        subject: "",
        description: "",
        priority: "medium",
        status: "open",
        source: "internal",
        assignedToEmployeeId: "",
        reportedByEmployeeId: "",
        customerType: "",
        resolutionSummary: "",
        internalNotes: "",
      });
      setShowAddCase(false);
    } catch {
      return;
    }
  };

  const activeTasks = tasks
    .filter((task) => !isResolvedStatus(task.status) && !task.completed_at)
    .sort((left, right) =>
      (left.due_date ?? "9999").localeCompare(right.due_date ?? "9999"),
    );
  const upcomingDeadlines = (data?.deadlines ?? [])
    .filter((deadline) => !isResolvedStatus(deadline.status))
    .sort((left, right) => left.due_at.localeCompare(right.due_at));

  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-5 pb-12 pt-8 sm:px-8 xl:px-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#d4784f]">
              <LifeBuoy size={13} /> Operations & accountability
            </div>
            <h1 className="font-display text-[32px] font-bold tracking-[-0.06em] text-[#152239] sm:text-[39px]">
              Make every piece of work accountable.
            </h1>
            <p className="mt-2 max-w-[700px] text-[13px] leading-6 text-slate-500">
              Live operational work from the authenticated organisation, with
              tasks, tickets, deadlines and ownership kept separate and
              traceable.
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
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 self-start rounded-xl bg-[#182842] px-3.5 py-2.5 text-[11px] font-bold text-white shadow-[0_5px_12px_rgba(20,35,58,.15)] hover:bg-[#233958] md:self-auto"
            >
              <Ticket size={15} /> Log a ticket
            </button>
          </div>
        </div>

        {showAdd && (
          <form
            onSubmit={submitTicket}
            className="mt-5 rounded-2xl border border-[#bfe9da] bg-[#f2fcf8] p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-white text-[#168465]">
                    <Ticket size={16} />
                  </span>
                  <h2 className="font-display text-[16px] font-bold text-[#152239]">
                    Log company ticket
                  </h2>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  Create a live ticket using the verified operational fields.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white"
                aria-label="Close ticket form"
              >
                Close
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                  onChange={(event) =>
                    updateDraft("category", event.target.value)
                  }
                  className="form-input"
                  placeholder="Operational category"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Priority
                <input
                  required
                  value={draft.priority}
                  onChange={(event) =>
                    updateDraft("priority", event.target.value)
                  }
                  className="form-input"
                  placeholder="Backend priority"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Reported by
                <select
                  value={draft.reportedBy}
                  onChange={(event) =>
                    updateDraft("reportedBy", event.target.value)
                  }
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
                  onChange={(event) =>
                    updateDraft("assignedTo", event.target.value)
                  }
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
                  onChange={(event) =>
                    updateDraft("departmentId", event.target.value)
                  }
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
                  onChange={(event) =>
                    updateDraft("dueDate", event.target.value)
                  }
                  className="form-input"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500 sm:col-span-2 lg:col-span-4">
                Description
                <textarea
                  required
                  value={draft.description}
                  onChange={(event) =>
                    updateDraft("description", event.target.value)
                  }
                  className="form-input min-h-20 resize-y"
                  placeholder="Describe the operational work."
                />
              </label>
            </div>
            {ticketActions.createTicket.isError && (
              <div className="mt-4">
                <StateMessage tone="error">
                  The ticket could not be created. Check the connection and try
                  again.
                </StateMessage>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                disabled={ticketActions.createTicket.isPending}
                className="rounded-xl bg-[#168465] px-4 py-2.5 text-[11px] font-bold text-white hover:bg-[#126b53] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {ticketActions.createTicket.isPending
                  ? "Creating..."
                  : "Create ticket"}
              </button>
            </div>
          </form>
        )}

        {showAddTask && (
          <form
            onSubmit={submitTask}
            className="mt-5 rounded-2xl border border-[#c8dcf5] bg-[#f2f7ff] p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-white text-[#4a87c9]">
                    <CheckSquare size={16} />
                  </span>
                  <h2 className="font-display text-[16px] font-bold text-[#152239]">
                    Create operational task
                  </h2>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  Create a live task with owner, progress tracking and due date.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTask(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white"
                aria-label="Close task form"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-[10px] font-bold text-slate-500 sm:col-span-2">
                Task title *
                <input
                  required
                  value={taskDraft.title}
                  onChange={(event) => updateTaskDraft("title", event.target.value)}
                  className="form-input"
                  placeholder="What needs to be completed?"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Priority
                <select
                  value={taskDraft.priority}
                  onChange={(event) => updateTaskDraft("priority", event.target.value)}
                  className="form-input"
                >
                  {["low", "medium", "high", "critical"].map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Progress %
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taskDraft.progressPercentage}
                  onChange={(event) => updateTaskDraft("progressPercentage", event.target.value)}
                  className="form-input"
                  placeholder="0"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Assignee
                <select
                  value={taskDraft.assignedTo}
                  onChange={(event) => updateTaskDraft("assignedTo", event.target.value)}
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
                  value={taskDraft.departmentId}
                  onChange={(event) => updateTaskDraft("departmentId", event.target.value)}
                  className="form-input"
                >
                  <option value="">No department</option>
                  {(data?.departments ?? [])
                    .filter((d) => d.active)
                    .map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
              </label>
              <label className="text-[10px] font-bold text-slate-500 lg:col-span-2">
                Due date
                <input
                  type="date"
                  value={taskDraft.dueDate}
                  onChange={(event) => updateTaskDraft("dueDate", event.target.value)}
                  className="form-input"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500 sm:col-span-2 lg:col-span-4">
                Description
                <textarea
                  value={taskDraft.description}
                  onChange={(event) => updateTaskDraft("description", event.target.value)}
                  className="form-input min-h-20 resize-y"
                  placeholder="Task details and acceptance criteria."
                />
              </label>
            </div>
            {taskActions.createTask.isError && (
              <div className="mt-4">
                <StateMessage tone="error">
                  The task could not be created. Check the connection and try again.
                </StateMessage>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddTask(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-bold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={taskActions.createTask.isPending}
                className="rounded-xl bg-[#4a87c9] px-4 py-2.5 text-[11px] font-bold text-white hover:bg-[#3c6fa8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {taskActions.createTask.isPending ? "Creating..." : "Create task"}
              </button>
            </div>
          </form>
        )}

        {showAddCase && (
          <form
            onSubmit={submitCase}
            className="mt-5 rounded-2xl border border-[#dcd4ff] bg-[#f5f2ff] p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-white text-[#755bc0]">
                    <ClipboardList size={16} />
                  </span>
                  <h2 className="font-display text-[16px] font-bold text-[#152239]">
                    Log customer case
                  </h2>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  Create a customer case with status tracking, ownership and resolution notes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCase(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white"
                aria-label="Close case form"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-[10px] font-bold text-slate-500 sm:col-span-2">
                Subject *
                <input
                  required
                  value={caseDraft.subject}
                  onChange={(event) => updateCaseDraft("subject", event.target.value)}
                  className="form-input"
                  placeholder="Case subject line"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Priority
                <select
                  value={caseDraft.priority}
                  onChange={(event) => updateCaseDraft("priority", event.target.value)}
                  className="form-input"
                >
                  {CASE_PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Status
                <select
                  value={caseDraft.status}
                  onChange={(event) => updateCaseDraft("status", event.target.value)}
                  className="form-input"
                >
                  {CASE_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                  ))}
                </select>
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Source
                <select
                  value={caseDraft.source}
                  onChange={(event) => updateCaseDraft("source", event.target.value)}
                  className="form-input"
                >
                  {CASE_SOURCES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Customer type
                <select
                  value={caseDraft.customerType}
                  onChange={(event) => updateCaseDraft("customerType", event.target.value)}
                  className="form-input"
                >
                  <option value="">Not specified</option>
                  {CASE_CUSTOMER_TYPES.map((ct) => (
                    <option key={ct} value={ct}>{ct.charAt(0).toUpperCase() + ct.slice(1)}</option>
                  ))}
                </select>
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Reported by
                <select
                  value={caseDraft.reportedByEmployeeId}
                  onChange={(event) => updateCaseDraft("reportedByEmployeeId", event.target.value)}
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
                Assigned to
                <select
                  value={caseDraft.assignedToEmployeeId}
                  onChange={(event) => updateCaseDraft("assignedToEmployeeId", event.target.value)}
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
              <label className="text-[10px] font-bold text-slate-500 sm:col-span-2 lg:col-span-4">
                Description *
                <textarea
                  required
                  value={caseDraft.description}
                  onChange={(event) => updateCaseDraft("description", event.target.value)}
                  className="form-input min-h-20 resize-y"
                  placeholder="Full case description and customer context."
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500 sm:col-span-2 lg:col-span-2">
                Resolution summary
                <textarea
                  value={caseDraft.resolutionSummary}
                  onChange={(event) => updateCaseDraft("resolutionSummary", event.target.value)}
                  className="form-input min-h-16 resize-y"
                  placeholder="Resolution details (for resolved/closed cases)."
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500 sm:col-span-2 lg:col-span-2">
                Internal notes
                <textarea
                  value={caseDraft.internalNotes}
                  onChange={(event) => updateCaseDraft("internalNotes", event.target.value)}
                  className="form-input min-h-16 resize-y"
                  placeholder="Private internal notes — not customer-facing."
                />
              </label>
            </div>
            {caseMutations.createCase.isError && (
              <div className="mt-4">
                <StateMessage tone="error">
                  The case could not be created. Check the connection and try again.
                </StateMessage>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddCase(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-bold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={caseMutations.createCase.isPending}
                className="rounded-xl bg-[#755bc0] px-4 py-2.5 text-[11px] font-bold text-white hover:bg-[#5f47a5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {caseMutations.createCase.isPending ? "Creating..." : "Create case"}
              </button>
            </div>
          </form>
        )}

        <WorkState
          pending={dashboard.isPending}
          error={dashboard.isError}
          empty={!data}
        >
          No live operational data is available.
        </WorkState>

        {data && !dashboard.isError && (
          <>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <Metric
                label="Open work"
                value={String(
                  summary.activeTaskCount +
                    summary.openTicketCount +
                    summary.activeDeadlineCount,
                )}
                detail={`${summary.overdueTaskCount + summary.overdueTicketCount + summary.overdueDeadlineCount} overdue`}
                tone={
                  summary.overdueTaskCount +
                  summary.overdueTicketCount +
                  summary.overdueDeadlineCount
                    ? "red"
                    : "mint"
                }
                icon={Ticket}
                onClick={() =>
                  document
                    .getElementById("open-work")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              />
              <Metric
                label="Assigned"
                value={String(summary.assignedWorkCount)}
                detail="Live task, ticket and deadline owners"
                tone="navy"
                icon={Users}
                onClick={() =>
                  document
                    .getElementById("assigned-work")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              />
              <Metric
                label="KPI-linked work"
                value={String(summary.kpiLinkedWorkCount)}
                detail="Tasks and tickets with KPI references"
                tone="amber"
                icon={Link2}
              />
            </div>

            <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg bg-[#fff1e9] text-[#d4784f]">
                      <Clock3 size={16} />
                    </span>
                    <h2 className="font-display text-[16px] font-bold text-[#152239]">
                      Operational status
                    </h2>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    Counts are derived from live task, ticket and deadline
                    records.
                  </p>
                </div>
                <span className="rounded-full bg-[#e8f8f2] px-2.5 py-1 text-[10px] font-bold text-[#168465]">
                  {summary.alertCount} active alerts
                </span>
              </div>
              <WorkBreakdown summary={summary} />
            </section>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <DepartmentWorkload rows={departmentWorkload} />
              <div id="assigned-work" className="scroll-mt-24">
                <EmployeeWorkload rows={employeeWorkload} />
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <TaskList tasks={activeTasks} employees={data.employees} />
              <DeadlineList
                deadlines={upcomingDeadlines}
                employees={data.employees}
              />
            </div>

            <div className="mt-5">
              <KpiWorkload rows={kpiWorkload} />
            </div>

            <div className="mt-5">
              <AlertList alerts={data.alerts} />
            </div>

            <section
              id="open-work"
              className="mt-5 scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white shadow-[0_5px_20px_rgba(21,36,58,0.035)]"
            >
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg bg-[#e4edfc] text-[#4a87c9]">
                      <CheckSquare size={16} />
                    </span>
                    <h2 className="font-display text-[16px] font-bold text-[#152239]">
                      Task management centre
                    </h2>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    Live operational tasks with status, assignee and progress tracking.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                  {taskStatuses.map((status) => (
                    <button
                      type="button"
                      key={status}
                      onClick={() => setTaskFilter(status)}
                      className={cn(
                        "rounded-md px-2.5 py-1.5 text-[10px] font-bold",
                        taskFilter === status
                          ? "bg-white text-[#4a87c9] shadow-sm"
                          : "text-slate-400",
                      )}
                    >
                      {status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
              <WorkState
                pending={dashboard.isPending}
                error={dashboard.isError}
                empty={!filteredTasks.length}
              >
                No live tasks match this filter.
              </WorkState>
              {filteredTasks.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                        <th className="px-5 py-3 font-bold sm:px-6">Task</th>
                        <th className="px-3 py-3 font-bold">Assignee</th>
                        <th className="px-3 py-3 font-bold">Status</th>
                        <th className="px-3 py-3 font-bold">Progress</th>
                        <th className="px-3 py-3 font-bold">Due</th>
                        <th className="px-3 py-3 font-bold">Priority</th>
                        <th className="px-3 py-3 font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((task) => (
                        <tr
                          key={task.id}
                          className="border-b border-slate-50 text-[11px] last:border-0"
                        >
                          <td className="px-5 py-4 sm:px-6">
                            <p className="font-bold text-slate-700">
                              {task.title || "Untitled task"}
                            </p>
                            {task.description && (
                              <p className="mt-1 text-[10px] text-slate-400 line-clamp-1">
                                {task.description}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-4">
                            <select
                              value={task.assigned_to ?? ""}
                              onChange={(event) =>
                                taskActions.updateTaskAssignee.mutate({
                                  id: task.id,
                                  assignedTo: event.target.value || null,
                                })
                              }
                              className="form-input !py-1 text-[10px]"
                            >
                              <option value="">Unassigned</option>
                              {activeEmployees.map((employee) => (
                                <option key={employee.id} value={employee.id}>
                                  {`${employee.first_name} ${employee.last_name}`.trim()}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-4">
                            <select
                              value={task.status}
                              onChange={(event) =>
                                taskActions.updateTaskStatus.mutate({
                                  id: task.id,
                                  status: event.target.value as TaskInput["status"],
                                })
                              }
                              className={cn(
                                "rounded-full border-0 px-2 py-1 text-[10px] font-bold outline-none",
                                statusClass(task.status),
                              )}
                            >
                              {TASK_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-4 text-slate-500">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={task.progress_percentage ?? 0}
                                onChange={(event) =>
                                  taskActions.updateTaskProgress.mutate({
                                    id: task.id,
                                    progressPercentage: Number(event.target.value),
                                  })
                                }
                                className="form-input !py-1 !w-20 text-[10px]"
                              />
                              <span className="text-[10px] font-bold">%</span>
                            </div>
                          </td>
                          <td className="px-3 py-4 text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Clock3 size={12} />
                              {formatLiveDate(task.due_date)}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <span
                              className={cn(
                                "rounded-full px-2 py-1 text-[10px] font-bold",
                                priorityClass(task.priority),
                              )}
                            >
                              {task.priority || "Priority not provided"}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                taskActions.deleteTask.mutate(task.id)
                              }
                              disabled={taskActions.deleteTask.isPending}
                              className="rounded-lg p-2 text-slate-400 hover:bg-[#fff0ee] hover:text-[#bd504d] disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Delete ${task.title}`}
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
              {(taskActions.updateTaskStatus.isError ||
                taskActions.updateTaskProgress.isError ||
                taskActions.updateTaskAssignee.isError ||
                taskActions.deleteTask.isError) && (
                <div className="p-5">
                  <StateMessage tone="error">
                    The task change could not be saved. Check the connection and try again.
                  </StateMessage>
                </div>
              )}
            </section>

            <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_5px_20px_rgba(21,36,58,0.035)]">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg bg-[#fff1e9] text-[#d4784f]">
                      <Ticket size={16} />
                    </span>
                    <h2 className="font-display text-[16px] font-bold text-[#152239]">
                      Central ticket engine
                    </h2>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    Live ticket records with backend status, ownership and due
                    dates.
                  </p>
                </div>
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
                            {ticket.category ? (
                              <span>· {ticket.category}</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-slate-500">
                          {displayEmployeeName(
                            data.employees,
                            ticket.reported_by,
                          )}
                        </td>
                        <td className="px-3 py-4 text-slate-500">
                          {displayEmployeeName(
                            data.employees,
                            ticket.assigned_to,
                          )}
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
                              <ArrowDownRight
                                size={12}
                                className="text-[#bd504d]"
                              />
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
                            onClick={() =>
                              ticketActions.deleteTicket.mutate(ticket.id)
                            }
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
              {(ticketActions.updateTicket.isError ||
                ticketActions.deleteTicket.isError) && (
                <div className="p-5">
                  <StateMessage tone="error">
                    The ticket change could not be saved. Check the connection
                    and try again.
                  </StateMessage>
                </div>
              )}
              {!filteredTickets.length && (
                <p className="p-8 text-center text-[11px] text-slate-400">
                  No live tickets match this filter.
                </p>
              )}
            </section>

            <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_5px_20px_rgba(21,36,58,0.035)]">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg bg-[#ece7ff] text-[#755bc0]">
                      <ClipboardList size={16} />
                    </span>
                    <h2 className="font-display text-[16px] font-bold text-[#152239]">
                      Customer case centre
                    </h2>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    Live customer cases with status, assignment and resolution tracking.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                  {caseStatusOptions.map((status) => (
                    <button
                      type="button"
                      key={status}
                      onClick={() => setCaseFilter(status)}
                      className={cn(
                        "rounded-md px-2.5 py-1.5 text-[10px] font-bold",
                        caseFilter === status
                          ? "bg-white text-[#755bc0] shadow-sm"
                          : "text-slate-400",
                      )}
                    >
                      {status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
              <WorkState
                pending={dashboard.isPending}
                error={dashboard.isError}
                empty={!filteredCases.length}
              >
                No live customer cases match this filter.
              </WorkState>
              {filteredCases.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                        <th className="px-5 py-3 font-bold sm:px-6">Case</th>
                        <th className="px-3 py-3 font-bold">Assigned to</th>
                        <th className="px-3 py-3 font-bold">Priority</th>
                        <th className="px-3 py-3 font-bold">Status</th>
                        <th className="px-3 py-3 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCases.map((c) => (
                        <tr
                          key={c.id}
                          className="border-b border-slate-50 text-[11px] last:border-0 align-top"
                        >
                          <td className="px-5 py-4 sm:px-6">
                            <p className="font-bold text-slate-700">
                              {c.subject || "Untitled case"}
                            </p>
                            {c.description && (
                              <p className="mt-1 text-[10px] text-slate-400 line-clamp-2 max-w-md">
                                {c.description}
                              </p>
                            )}
                            {c.resolution_summary && (
                              <p className="mt-2 text-[10px] text-[#168465] line-clamp-2 max-w-md">
                                Resolution: {c.resolution_summary}
                              </p>
                            )}
                            {c.internal_notes && (
                              <p className="mt-1 text-[10px] text-slate-500 line-clamp-1 max-w-md italic">
                                Internal: {c.internal_notes}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-4">
                            <select
                              value={c.assigned_to_employee_id ?? ""}
                              onChange={(event) =>
                                caseMutations.updateCase.mutate({
                                  id: c.id,
                                  assignedToEmployeeId: event.target.value || null,
                                })
                              }
                              className="form-input !py-1 text-[10px]"
                            >
                              <option value="">Unassigned</option>
                              {activeEmployees.map((employee) => (
                                <option key={employee.id} value={employee.id}>
                                  {`${employee.first_name} ${employee.last_name}`.trim()}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-4">
                            <span
                              className={cn(
                                "inline-block rounded-full px-2 py-1 text-[10px] font-bold",
                                priorityClass(c.priority),
                              )}
                            >
                              {c.priority || "Priority not provided"}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <select
                              value={c.status}
                              onChange={(event) =>
                                caseMutations.updateCaseStatus.mutate({
                                  id: c.id,
                                  status: event.target.value as CaseInput["status"],
                                })
                              }
                              className={cn(
                                "rounded-full border-0 px-2 py-1 text-[10px] font-bold outline-none",
                                caseStatusClass(c.status),
                              )}
                            >
                              {CASE_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status.replace("_", " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-1">
                              {c.status !== "resolved" && c.status !== "closed" && c.status !== "cancelled" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    caseMutations.updateCaseStatus.mutate({
                                      id: c.id,
                                      status: "resolved",
                                    })
                                  }
                                  disabled={caseMutations.updateCaseStatus.isPending}
                                  className="rounded-lg bg-[#e8f8f2] px-2 py-1 text-[10px] font-bold text-[#168465] hover:bg-[#d4f2e6] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Resolve
                                </button>
                              )}
                              {c.status !== "closed" && c.status !== "cancelled" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    caseMutations.updateCaseStatus.mutate({
                                      id: c.id,
                                      status: "closed",
                                    })
                                  }
                                  disabled={caseMutations.updateCaseStatus.isPending}
                                  className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Close
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  caseMutations.deleteCase.mutate(c.id)
                                }
                                disabled={caseMutations.deleteCase.isPending}
                                className="rounded-lg p-2 text-slate-400 hover:bg-[#fff0ee] hover:text-[#bd504d] disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={`Delete case ${c.subject}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {(caseMutations.updateCaseStatus.isError ||
                caseMutations.updateCase.isError ||
                caseMutations.deleteCase.isError) && (
                <div className="p-5">
                  <StateMessage tone="error">
                    The case change could not be saved. Check the connection and try again.
                  </StateMessage>
                </div>
              )}
            </section>
          </>
        )}

        <footer className="mt-8 flex flex-col justify-between gap-2 border-t border-slate-200/70 pt-5 text-[10px] text-slate-400 sm:flex-row">
          <span>
            MedMap Operating System · Supabase-backed operations centre
          </span>
          <span>Live work → Ownership → Status → Action</span>
        </footer>
      </div>
    </AppShell>
  );
}
