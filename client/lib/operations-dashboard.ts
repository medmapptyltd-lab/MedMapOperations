import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  columns,
  isActiveCompanyAlert,
  isResolvedStatus,
  normaliseStatus,
  parseDeadline,
  parseDepartment,
  parseEmployee,
  parseKpi,
  parseKpiPeriod,
  parseKpiResult,
  parseKpiTarget,
  parseTask,
  parseTicket,
  requiredText,
  selectRelatedRows,
  selectRows,
  text,
  type DashboardScope,
  type DepartmentContext,
  type Deadline,
  type EmployeeContext,
  type Kpi,
  type KpiPeriod,
  type KpiResult,
  type KpiTarget,
  type RawRow,
  type Task,
  type Ticket,
} from "./executive-dashboard";
import { getSupabaseClient } from "./supabase";
import { useSupabaseAuth } from "./supabase-auth";
import {
  useCurrentEmployee,
  useCurrentOrganisation,
} from "./supabase-identity";

// Shared record shapes live in executive-dashboard and are re-exported here so
// existing operations consumers keep their import names.
export type OperationsTask = Task;
export type OperationsTicket = Ticket;
export type OperationsDeadline = Deadline;
export type OperationsEmployee = EmployeeContext;
export type OperationsDepartment = DepartmentContext;
export type OperationsKpi = Kpi;
export type OperationsKpiPeriod = KpiPeriod;
export type OperationsKpiTarget = KpiTarget;
export type OperationsKpiResult = KpiResult;

export type OperationsAlert = {
  id: string;
  organization_id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: string;
  source_type: string | null;
  source_id: string | null;
  status: string;
  starts_at: string;
  expires_at: string | null;
  acknowledged_at: string | null;
  acknowledged_by_employee_id: string | null;
  resolved_at: string | null;
  resolved_by_employee_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OperationsCase = {
  id: string;
  organization_id: string | null;
  subject: string;
  description: string | null;
  priority: string;
  status: string;
  source: string;
  reported_by_employee_id: string | null;
  assigned_to_employee_id: string | null;
  category_id: string | null;
  patient_id: string | null;
  doctor_id: string | null;
  booking_id: string | null;
  customer_type: string | null;
  resolution_summary: string | null;
  internal_notes: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  sla_response_due_at: string | null;
  sla_resolution_due_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OperationsDashboardData = {
  tasks: OperationsTask[];
  tickets: OperationsTicket[];
  deadlines: OperationsDeadline[];
  employees: OperationsEmployee[];
  departments: OperationsDepartment[];
  kpis: OperationsKpi[];
  kpiPeriods: OperationsKpiPeriod[];
  kpiTargets: OperationsKpiTarget[];
  kpiResults: OperationsKpiResult[];
  alerts: OperationsAlert[];
  cases: OperationsCase[];
};

type QueryState = {
  data: OperationsDashboardData | undefined;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
};

function parseAlert(row: RawRow): OperationsAlert {
  return {
    id: requiredText(row, "id"),
    organization_id: requiredText(row, "organization_id"),
    alert_type: requiredText(row, "alert_type"),
    title: requiredText(row, "title"),
    message: requiredText(row, "message"),
    severity: requiredText(row, "severity"),
    source_type: text(row, "source_type"),
    source_id: text(row, "source_id"),
    status: requiredText(row, "status"),
    starts_at: requiredText(row, "starts_at"),
    expires_at: text(row, "expires_at"),
    acknowledged_at: text(row, "acknowledged_at"),
    acknowledged_by_employee_id: text(row, "acknowledged_by_employee_id"),
    resolved_at: text(row, "resolved_at"),
    resolved_by_employee_id: text(row, "resolved_by_employee_id"),
    created_at: requiredText(row, "created_at"),
    updated_at: requiredText(row, "updated_at"),
  };
}

function parseCase(row: RawRow): OperationsCase {
  return {
    id: requiredText(row, "id"),
    organization_id: text(row, "organization_id"),
    subject: requiredText(row, "subject"),
    description: text(row, "description"),
    priority: requiredText(row, "priority"),
    status: requiredText(row, "status"),
    source: requiredText(row, "source"),
    reported_by_employee_id: text(row, "reported_by_employee_id"),
    assigned_to_employee_id: text(row, "assigned_to_employee_id"),
    category_id: text(row, "category_id"),
    patient_id: text(row, "patient_id"),
    doctor_id: text(row, "doctor_id"),
    booking_id: text(row, "booking_id"),
    customer_type: text(row, "customer_type"),
    resolution_summary: text(row, "resolution_summary"),
    internal_notes: text(row, "internal_notes"),
    first_response_at: text(row, "first_response_at"),
    resolved_at: text(row, "resolved_at"),
    closed_at: text(row, "closed_at"),
    sla_response_due_at: text(row, "sla_response_due_at"),
    sla_resolution_due_at: text(row, "sla_resolution_due_at"),
    created_at: requiredText(row, "created_at"),
    updated_at: requiredText(row, "updated_at"),
  };
}

async function fetchOperationsDashboard(
  organizationId: string,
  scope?: DashboardScope,
): Promise<OperationsDashboardData> {
  const [
    taskRows,
    ticketRows,
    deadlineRows,
    employeeRows,
    departmentRows,
    kpiRows,
    periodRows,
    alertRows,
    caseRows,
  ] = await Promise.all([
    selectRows("tasks", columns.tasks, organizationId, scope),
    selectRows("tickets", columns.tickets, organizationId, scope),
    selectRows("deadlines", columns.deadlines, organizationId, scope),
    selectRows("employees", columns.employees, organizationId, scope),
    selectRows("departments", columns.departments, organizationId, scope),
    selectRows("kpis", columns.kpis, organizationId, scope),
    selectRows("kpi_periods", columns.kpiPeriods, organizationId, scope),
    selectRows("company_alerts", columns.companyAlerts, organizationId, scope),
    selectRows("customer_cases", columns.customerCases, organizationId, scope),
  ]);

  const kpis = kpiRows.map(parseKpi);
  const kpiPeriods = periodRows.map(parseKpiPeriod);
  const relationshipFilters = [
    { column: "kpi_id", values: kpis.map((kpi) => kpi.id) },
    { column: "period_id", values: kpiPeriods.map((period) => period.id) },
  ];
  const [targetRows, resultRows] = await Promise.all([
    selectRelatedRows("kpi_targets", columns.kpiTargets, relationshipFilters, scope),
    selectRelatedRows("kpi_results", columns.kpiResults, relationshipFilters, scope),
  ]);

  return {
    tasks: taskRows.map(parseTask),
    tickets: ticketRows.map(parseTicket),
    deadlines: deadlineRows.map(parseDeadline),
    employees: employeeRows.map(parseEmployee),
    departments: departmentRows.map(parseDepartment),
    kpis,
    kpiPeriods,
    kpiTargets: targetRows.map(parseKpiTarget),
    kpiResults: resultRows.map(parseKpiResult),
    alerts: alertRows
      .map(parseAlert)
      .filter((alert) => isActiveCompanyAlert(alert)),
    cases: caseRows.map(parseCase),
  };
}

export type OperationsTicketInput = {
  title: string;
  category: string;
  priority: string;
  reportedBy: string | null;
  assignedTo: string | null;
  departmentId: string | null;
  dueDate: string | null;
  description: string;
};

export function useOperationsTicketActions() {
  const organizationState = useCurrentOrganisation();
  const queryClient = useQueryClient();
  const organizationId = organizationState.organizationId;
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["operations-dashboard"] });

  const createTicket = useMutation({
    mutationFn: async (input: OperationsTicketInput) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient().from("tickets").insert({
        organization_id: organizationId,
        department_id: input.departmentId,
        reported_by: input.reportedBy,
        assigned_to: input.assignedTo,
        kpi_id: null,
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        status: "open",
        due_date: input.dueDate,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateTicket = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient()
        .from("tickets")
        .update({ status })
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteTicket = useMutation({
    mutationFn: async (id: string) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient()
        .from("tickets")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { createTicket, updateTicket, deleteTicket };
}

export function useOperationsDashboard(scope?: DashboardScope): QueryState {
  const { user, loading: authLoading } = useSupabaseAuth();
  const employeeState = useCurrentEmployee();
  const organizationState = useCurrentOrganisation();
  const organizationId = organizationState.organizationId;
  const enabled = Boolean(
    user &&
    !authLoading &&
    employeeState.status === "active" &&
    !organizationState.isLoading &&
    organizationId,
  );
  const serializedScope = [
    scope?.departmentIds?.slice().sort().join(",") ?? "",
    scope?.employeeId ?? "",
  ].join("|");
  const query = useQuery({
    queryKey: [
      "operations-dashboard",
      user?.id ?? null,
      organizationId,
      employeeState.employee?.id ?? null,
      serializedScope,
    ],
    enabled,
    queryFn: () => fetchOperationsDashboard(organizationId!, scope),
    staleTime: 30_000,
  });

  return {
    data: query.data,
    isPending: query.isPending,
    isError: query.isError,
    error:
      query.error instanceof Error
        ? query.error
        : query.error
          ? new Error("The operations data could not be loaded.")
          : null,
    refetch: () => query.refetch().then((result) => result.data),
  };
}

function dateAtEnd(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59`);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function timestamp(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function withinNextDays(date: Date | null, now: Date, days: number) {
  if (!date) return false;
  const end = new Date(now);
  end.setDate(end.getDate() + days);
  return date >= now && date <= end;
}

export function isTaskActive(task: OperationsTask) {
  return !task.completed_at && !isResolvedStatus(task.status);
}

export function isTicketResolved(ticket: OperationsTicket) {
  return Boolean(ticket.resolved_at) || isResolvedStatus(ticket.status);
}

export function isTicketOpen(ticket: OperationsTicket) {
  return !isTicketResolved(ticket);
}

export function isDeadlineActive(deadline: OperationsDeadline) {
  return !isResolvedStatus(deadline.status);
}

export function isTaskOverdue(task: OperationsTask, now = new Date()) {
  if (!isTaskActive(task)) return false;
  const dueDate = dateAtEnd(task.due_date);
  return Boolean(dueDate && dueDate < now);
}

export function isTicketOverdue(ticket: OperationsTicket, now = new Date()) {
  if (!isTicketOpen(ticket)) return false;
  const dueDate = dateAtEnd(ticket.due_date);
  return Boolean(dueDate && dueDate < now);
}

export function isDeadlineOverdue(
  deadline: OperationsDeadline,
  now = new Date(),
) {
  if (!isDeadlineActive(deadline)) return false;
  const dueAt = timestamp(deadline.due_at);
  return Boolean(dueAt && dueAt < now);
}

export function isTaskDueSoon(task: OperationsTask, now = new Date()) {
  return isTaskActive(task) && withinNextDays(dateAtEnd(task.due_date), now, 7);
}

export function isTicketDueSoon(ticket: OperationsTicket, now = new Date()) {
  return (
    isTicketOpen(ticket) && withinNextDays(dateAtEnd(ticket.due_date), now, 7)
  );
}

export function isDeadlineDueSoon(
  deadline: OperationsDeadline,
  now = new Date(),
) {
  return (
    isDeadlineActive(deadline) &&
    withinNextDays(timestamp(deadline.due_at), now, 7)
  );
}

export type OperationsSummary = {
  taskCount: number;
  activeTaskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
  dueSoonTaskCount: number;
  ticketCount: number;
  openTicketCount: number;
  resolvedTicketCount: number;
  overdueTicketCount: number;
  dueSoonTicketCount: number;
  deadlineCount: number;
  activeDeadlineCount: number;
  overdueDeadlineCount: number;
  dueSoonDeadlineCount: number;
  assignedWorkCount: number;
  kpiLinkedWorkCount: number;
  alertCount: number;
};

export function buildOperationsSummary(
  data: OperationsDashboardData | undefined,
  now = new Date(),
): OperationsSummary {
  const tasks = data?.tasks ?? [];
  const tickets = data?.tickets ?? [];
  const deadlines = data?.deadlines ?? [];
  const activeTaskCount = tasks.filter(isTaskActive).length;
  const openTicketCount = tickets.filter(isTicketOpen).length;
  const activeDeadlineCount = deadlines.filter(isDeadlineActive).length;
  return {
    taskCount: tasks.length,
    activeTaskCount,
    completedTaskCount: tasks.filter((task) => !isTaskActive(task)).length,
    overdueTaskCount: tasks.filter((task) => isTaskOverdue(task, now)).length,
    dueSoonTaskCount: tasks.filter((task) => isTaskDueSoon(task, now)).length,
    ticketCount: tickets.length,
    openTicketCount,
    resolvedTicketCount: tickets.filter(isTicketResolved).length,
    overdueTicketCount: tickets.filter((ticket) => isTicketOverdue(ticket, now))
      .length,
    dueSoonTicketCount: tickets.filter((ticket) => isTicketDueSoon(ticket, now))
      .length,
    deadlineCount: deadlines.length,
    activeDeadlineCount,
    overdueDeadlineCount: deadlines.filter((deadline) =>
      isDeadlineOverdue(deadline, now),
    ).length,
    dueSoonDeadlineCount: deadlines.filter((deadline) =>
      isDeadlineDueSoon(deadline, now),
    ).length,
    assignedWorkCount:
      tasks.filter((task) => isTaskActive(task) && task.assigned_to).length +
      tickets.filter((ticket) => isTicketOpen(ticket) && ticket.assigned_to)
        .length +
      deadlines.filter(
        (deadline) => isDeadlineActive(deadline) && deadline.owner_employee_id,
      ).length,
    kpiLinkedWorkCount:
      tasks.filter((task) => isTaskActive(task) && task.kpi_id).length +
      tickets.filter((ticket) => isTicketOpen(ticket) && ticket.kpi_id).length,
    alertCount: data?.alerts.length ?? 0,
  };
}

export type OperationsDepartmentWorkload = {
  id: string;
  name: string;
  activeTasks: number;
  openTickets: number;
  upcomingDeadlines: number;
  overdueWork: number;
};

export function buildDepartmentWorkload(
  data: OperationsDashboardData | undefined,
  now = new Date(),
): OperationsDepartmentWorkload[] {
  if (!data) return [];
  return data.departments
    .filter((department) => department.active)
    .map((department) => {
      const tasks = data.tasks.filter(
        (task) => task.department_id === department.id && isTaskActive(task),
      );
      const tickets = data.tickets.filter(
        (ticket) =>
          ticket.department_id === department.id && isTicketOpen(ticket),
      );
      const deadlines = data.deadlines.filter(
        (deadline) =>
          deadline.department_id === department.id &&
          isDeadlineActive(deadline),
      );
      return {
        id: department.id,
        name: department.name,
        activeTasks: tasks.length,
        openTickets: tickets.length,
        upcomingDeadlines: deadlines.filter((deadline) =>
          isDeadlineDueSoon(deadline, now),
        ).length,
        overdueWork:
          tasks.filter((task) => isTaskOverdue(task, now)).length +
          tickets.filter((ticket) => isTicketOverdue(ticket, now)).length +
          deadlines.filter((deadline) => isDeadlineOverdue(deadline, now))
            .length,
      };
    })
    .filter(
      (department) =>
        department.activeTasks +
          department.openTickets +
          department.upcomingDeadlines >
        0,
    )
    .sort(
      (left, right) =>
        right.activeTasks +
        right.openTickets -
        (left.activeTasks + left.openTickets),
    );
}

export type OperationsEmployeeWorkload = {
  id: string;
  name: string;
  jobTitle: string | null;
  departmentName: string | null;
  activeTasks: number;
  openTickets: number;
  ownedDeadlines: number;
  overdueWork: number;
};

export function buildEmployeeWorkload(
  data: OperationsDashboardData | undefined,
  now = new Date(),
): OperationsEmployeeWorkload[] {
  if (!data) return [];
  const departmentNames = new Map(
    data.departments.map((department) => [department.id, department.name]),
  );
  return data.employees
    .filter(
      (employee) => normaliseStatus(employee.employee_status) === "active",
    )
    .map((employee) => {
      const tasks = data.tasks.filter(
        (task) => task.assigned_to === employee.id && isTaskActive(task),
      );
      const tickets = data.tickets.filter(
        (ticket) => ticket.assigned_to === employee.id && isTicketOpen(ticket),
      );
      const deadlines = data.deadlines.filter(
        (deadline) =>
          deadline.owner_employee_id === employee.id &&
          isDeadlineActive(deadline),
      );
      return {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`.trim(),
        jobTitle: employee.job_title,
        departmentName: employee.department_id
          ? (departmentNames.get(employee.department_id) ?? null)
          : null,
        activeTasks: tasks.length,
        openTickets: tickets.length,
        ownedDeadlines: deadlines.length,
        overdueWork:
          tasks.filter((task) => isTaskOverdue(task, now)).length +
          tickets.filter((ticket) => isTicketOverdue(ticket, now)).length +
          deadlines.filter((deadline) => isDeadlineOverdue(deadline, now))
            .length,
      };
    })
    .filter(
      (employee) =>
        employee.activeTasks + employee.openTickets + employee.ownedDeadlines >
        0,
    )
    .sort(
      (left, right) =>
        right.activeTasks +
        right.openTickets +
        right.ownedDeadlines -
        (left.activeTasks + left.openTickets + left.ownedDeadlines),
    );
}

export type OperationsKpiWorkload = {
  id: string;
  name: string;
  status: string | null;
  periodName: string | null;
  target: number | null;
  actual: number | null;
  activeTasks: number;
  openTickets: number;
};

function currentKpiPeriod(periods: OperationsKpiPeriod[], now = new Date()) {
  const currentDate = now.toISOString().slice(0, 10);
  return (
    periods.find(
      (period) =>
        ["current", "active", "open"].includes(
          normaliseStatus(period.status) ?? "",
        ) &&
        currentDate >= period.start_date &&
        currentDate <= period.end_date,
    ) ??
    periods.find(
      (period) =>
        !isResolvedStatus(period.status) &&
        currentDate >= period.start_date &&
        currentDate <= period.end_date,
    ) ??
    null
  );
}

export function buildKpiWorkload(
  data: OperationsDashboardData | undefined,
  now = new Date(),
): OperationsKpiWorkload[] {
  if (!data) return [];
  const linkedIds = new Set(
    [...data.tasks, ...data.tickets]
      .filter((record) => record.kpi_id)
      .map((record) => record.kpi_id!),
  );
  const kpis = new Map(data.kpis.map((kpi) => [kpi.id, kpi]));
  const period = currentKpiPeriod(data.kpiPeriods, now);
  return [...linkedIds]
    .map((id) => {
      const kpi = kpis.get(id);
      const target = data.kpiTargets.find(
        (candidate) =>
          candidate.kpi_id === id && candidate.period_id === period?.id,
      );
      const result = data.kpiResults.find(
        (candidate) =>
          candidate.kpi_id === id && candidate.period_id === period?.id,
      );
      return {
        id,
        name: kpi?.name || "KPI unavailable",
        status: result?.status || null,
        periodName: period?.period_name ?? null,
        target: target?.target_value ?? null,
        actual: result?.actual_value ?? null,
        activeTasks: data.tasks.filter(
          (task) => task.kpi_id === id && isTaskActive(task),
        ).length,
        openTickets: data.tickets.filter(
          (ticket) => ticket.kpi_id === id && isTicketOpen(ticket),
        ).length,
      };
    })
    .sort(
      (left, right) =>
        right.activeTasks +
        right.openTickets -
        (left.activeTasks + left.openTickets),
    );
}

export function displayEmployeeName(
  employees: OperationsEmployee[],
  employeeId: string | null,
) {
  if (!employeeId) return "Unassigned";
  const employee = employees.find(
    (candidate) =>
      candidate.id === employeeId &&
      normaliseStatus(candidate.employee_status) === "active",
  );
  return employee
    ? `${employee.first_name} ${employee.last_name}`.trim()
    : "Unassigned";
}
