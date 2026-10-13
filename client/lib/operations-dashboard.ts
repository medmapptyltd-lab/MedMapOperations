import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  isActiveCompanyAlert,
  isResolvedStatus,
  normaliseStatus,
  type DashboardScope,
} from "./executive-dashboard";
import { getSupabaseClient } from "./supabase";
import { useSupabaseAuth } from "./supabase-auth";
import {
  useCurrentEmployee,
  useCurrentOrganisation,
} from "./supabase-identity";

export type OperationsTask = {
  id: string;
  organization_id: string | null;
  department_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  kpi_id: string | null;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  progress_percentage: number | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OperationsTicket = {
  id: string;
  organization_id: string | null;
  department_id: string | null;
  reported_by: string | null;
  assigned_to: string | null;
  kpi_id: string | null;
  ticket_number: number | null;
  title: string;
  description: string | null;
  category: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OperationsDeadline = {
  id: string;
  organization_id: string | null;
  department_id: string | null;
  owner_employee_id: string | null;
  title: string;
  description: string | null;
  due_at: string;
  priority: string;
  status: string;
  linked_task_id: string | null;
  linked_ticket_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OperationsEmployee = {
  id: string;
  organization_id: string | null;
  first_name: string;
  last_name: string;
  job_title: string | null;
  department_id: string | null;
  employee_status: string;
};

export type OperationsDepartment = {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  description: string | null;
  department_group: string;
  active: boolean;
};

export type OperationsKpi = {
  id: string;
  organization_id: string | null;
  department_id: string | null;
  owner_employee_id: string | null;
  name: string;
  code: string;
  description: string | null;
  category: string | null;
  measurement_type: string;
  direction: string;
  unit: string | null;
  active: boolean;
};

export type OperationsKpiPeriod = {
  id: string;
  organization_id: string | null;
  period_type: string;
  period_name: string;
  start_date: string;
  end_date: string;
  status: string;
};

export type OperationsKpiTarget = {
  id: string;
  kpi_id: string;
  employee_id: string | null;
  department_id: string | null;
  period_id: string;
  target_value: number | null;
  green_threshold: number | null;
  yellow_threshold: number | null;
  critical_threshold: number | null;
  notes: string | null;
};

export type OperationsKpiResult = {
  id: string;
  kpi_id: string;
  target_id: string | null;
  employee_id: string | null;
  department_id: string | null;
  period_id: string;
  actual_value: number | null;
  calculated_percentage: number | null;
  status: string;
  commentary: string | null;
};

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

type RawRow = Readonly<Record<string, unknown>>;

type QueryState = {
  data: OperationsDashboardData | undefined;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
};

const columns = {
  tasks:
    "id, organization_id, department_id, assigned_to, created_by, kpi_id, title, description, priority, status, progress_percentage, due_date, completed_at, created_at, updated_at",
  tickets:
    "id, organization_id, department_id, reported_by, assigned_to, kpi_id, ticket_number, title, description, category, priority, status, due_date, resolved_at, created_at, updated_at",
  deadlines:
    "id, organization_id, department_id, owner_employee_id, title, description, due_at, priority, status, linked_task_id, linked_ticket_id, created_at, updated_at",
  employees:
    "id, organization_id, first_name, last_name, job_title, department_id, employee_status",
  departments:
    "id, organization_id, code, name, description, department_group, active",
  kpis: "id, organization_id, department_id, owner_employee_id, name, code, description, category, measurement_type, direction, unit, active",
  kpiPeriods:
    "id, organization_id, period_type, period_name, start_date, end_date, status",
  kpiTargets:
    "id, kpi_id, employee_id, department_id, period_id, target_value, green_threshold, yellow_threshold, critical_threshold, notes",
  kpiResults:
    "id, kpi_id, target_id, employee_id, department_id, period_id, actual_value, calculated_percentage, status, commentary",
  companyAlerts:
    "id, organization_id, alert_type, title, message, severity, source_type, source_id, status, starts_at, expires_at, acknowledged_at, acknowledged_by_employee_id, resolved_at, resolved_by_employee_id, created_at, updated_at",
  customerCases:
    "id, organization_id, subject, description, priority, status, source, reported_by_employee_id, assigned_to_employee_id, category_id, patient_id, doctor_id, booking_id, customer_type, resolution_summary, internal_notes, first_response_at, resolved_at, closed_at, sla_response_due_at, sla_resolution_due_at, created_at, updated_at",
} as const;

function isRawRow(value: unknown): value is RawRow {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rawRows(value: unknown): RawRow[] {
  return Array.isArray(value) ? value.filter(isRawRow) : [];
}

function text(row: RawRow, key: string): string | null {
  const value = row[key];
  return typeof value === "string" ? value : null;
}

function requiredText(row: RawRow, key: string): string {
  return text(row, key) ?? "";
}

function numberValue(row: RawRow, key: string): number | null {
  const value = row[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function booleanValue(row: RawRow, key: string): boolean {
  return row[key] === true;
}

const operationsScopeColumns: Record<
  string,
  { department?: string; employee?: string }
> = {
  tasks: { department: "department_id", employee: "assigned_to" },
  tickets: { department: "department_id", employee: "assigned_to" },
  deadlines: { department: "department_id", employee: "owner_employee_id" },
  employees: { department: "department_id" },
  departments: {},
  kpis: { department: "department_id", employee: "owner_employee_id" },
  kpi_periods: {},
  company_alerts: { department: "department_id" },
  customer_cases: { department: "department_id", employee: "assigned_to_employee_id" },
  kpi_targets: { department: "department_id", employee: "employee_id" },
  kpi_results: { department: "department_id", employee: "employee_id" },
};

function applyOperationsScope(
  query: ReturnType<ReturnType<typeof getSupabaseClient>["from"]>["select"] extends () => infer Q ? Q : never,
  table: string,
  scope?: DashboardScope,
) {
  const cols = operationsScopeColumns[table];
  if (!scope || !cols) return query;
  let q = query;
  if (cols.department && scope.departmentIds?.length) {
    q = q.in(cols.department, scope.departmentIds) as typeof q;
  }
  if (cols.employee && scope.employeeId) {
    q = q.eq(cols.employee, scope.employeeId) as typeof q;
  }
  return q;
}

async function selectOrganizationRows(
  table: string,
  selection: string,
  organizationId: string,
  scope?: DashboardScope,
): Promise<RawRow[]> {
  const base = getSupabaseClient()
    .from(table)
    .select(selection)
    .eq("organization_id", organizationId);
  const scoped = applyOperationsScope(base as never, table, scope);
  const { data, error } = await scoped;
  if (error) throw error;
  return rawRows(data);
}

async function selectRelatedRows(
  table: string,
  selection: string,
  filters: { column: string; values: string[] }[],
  scope?: DashboardScope,
): Promise<RawRow[]> {
  if (filters.some(({ values }) => values.length === 0)) return [];
  let query = getSupabaseClient().from(table).select(selection) as ReturnType<
    ReturnType<typeof getSupabaseClient>["from"]
  >["select"] extends () => infer Q ? Q : never;
  for (const { column, values } of filters) query = query.in(column, values) as typeof query;
  const scoped = applyOperationsScope(query as never, table, scope);
  const { data, error } = await scoped;
  if (error) throw error;
  return rawRows(data);
}

function parseTask(row: RawRow): OperationsTask {
  return {
    id: requiredText(row, "id"),
    organization_id: text(row, "organization_id"),
    department_id: text(row, "department_id"),
    assigned_to: text(row, "assigned_to"),
    created_by: text(row, "created_by"),
    kpi_id: text(row, "kpi_id"),
    title: requiredText(row, "title"),
    description: text(row, "description"),
    priority: requiredText(row, "priority"),
    status: requiredText(row, "status"),
    progress_percentage: numberValue(row, "progress_percentage"),
    due_date: text(row, "due_date"),
    completed_at: text(row, "completed_at"),
    created_at: requiredText(row, "created_at"),
    updated_at: requiredText(row, "updated_at"),
  };
}

function parseTicket(row: RawRow): OperationsTicket {
  return {
    id: requiredText(row, "id"),
    organization_id: text(row, "organization_id"),
    department_id: text(row, "department_id"),
    reported_by: text(row, "reported_by"),
    assigned_to: text(row, "assigned_to"),
    kpi_id: text(row, "kpi_id"),
    ticket_number: numberValue(row, "ticket_number"),
    title: requiredText(row, "title"),
    description: text(row, "description"),
    category: text(row, "category"),
    priority: requiredText(row, "priority"),
    status: requiredText(row, "status"),
    due_date: text(row, "due_date"),
    resolved_at: text(row, "resolved_at"),
    created_at: requiredText(row, "created_at"),
    updated_at: requiredText(row, "updated_at"),
  };
}

function parseDeadline(row: RawRow): OperationsDeadline {
  return {
    id: requiredText(row, "id"),
    organization_id: text(row, "organization_id"),
    department_id: text(row, "department_id"),
    owner_employee_id: text(row, "owner_employee_id"),
    title: requiredText(row, "title"),
    description: text(row, "description"),
    due_at: requiredText(row, "due_at"),
    priority: requiredText(row, "priority"),
    status: requiredText(row, "status"),
    linked_task_id: text(row, "linked_task_id"),
    linked_ticket_id: text(row, "linked_ticket_id"),
    created_at: requiredText(row, "created_at"),
    updated_at: requiredText(row, "updated_at"),
  };
}

function parseEmployee(row: RawRow): OperationsEmployee {
  return {
    id: requiredText(row, "id"),
    organization_id: text(row, "organization_id"),
    first_name: requiredText(row, "first_name"),
    last_name: requiredText(row, "last_name"),
    job_title: text(row, "job_title"),
    department_id: text(row, "department_id"),
    employee_status: requiredText(row, "employee_status"),
  };
}

function parseDepartment(row: RawRow): OperationsDepartment {
  return {
    id: requiredText(row, "id"),
    organization_id: text(row, "organization_id"),
    code: requiredText(row, "code"),
    name: requiredText(row, "name"),
    description: text(row, "description"),
    department_group: requiredText(row, "department_group"),
    active: booleanValue(row, "active"),
  };
}

function parseKpi(row: RawRow): OperationsKpi {
  return {
    id: requiredText(row, "id"),
    organization_id: text(row, "organization_id"),
    department_id: text(row, "department_id"),
    owner_employee_id: text(row, "owner_employee_id"),
    name: requiredText(row, "name"),
    code: requiredText(row, "code"),
    description: text(row, "description"),
    category: text(row, "category"),
    measurement_type: requiredText(row, "measurement_type"),
    direction: requiredText(row, "direction"),
    unit: text(row, "unit"),
    active: booleanValue(row, "active"),
  };
}

function parseKpiPeriod(row: RawRow): OperationsKpiPeriod {
  return {
    id: requiredText(row, "id"),
    organization_id: text(row, "organization_id"),
    period_type: requiredText(row, "period_type"),
    period_name: requiredText(row, "period_name"),
    start_date: requiredText(row, "start_date"),
    end_date: requiredText(row, "end_date"),
    status: requiredText(row, "status"),
  };
}

function parseKpiTarget(row: RawRow): OperationsKpiTarget {
  return {
    id: requiredText(row, "id"),
    kpi_id: requiredText(row, "kpi_id"),
    employee_id: text(row, "employee_id"),
    department_id: text(row, "department_id"),
    period_id: requiredText(row, "period_id"),
    target_value: numberValue(row, "target_value"),
    green_threshold: numberValue(row, "green_threshold"),
    yellow_threshold: numberValue(row, "yellow_threshold"),
    critical_threshold: numberValue(row, "critical_threshold"),
    notes: text(row, "notes"),
  };
}

function parseKpiResult(row: RawRow): OperationsKpiResult {
  return {
    id: requiredText(row, "id"),
    kpi_id: requiredText(row, "kpi_id"),
    target_id: text(row, "target_id"),
    employee_id: text(row, "employee_id"),
    department_id: text(row, "department_id"),
    period_id: requiredText(row, "period_id"),
    actual_value: numberValue(row, "actual_value"),
    calculated_percentage: numberValue(row, "calculated_percentage"),
    status: requiredText(row, "status"),
    commentary: text(row, "commentary"),
  };
}

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
    selectOrganizationRows("tasks", columns.tasks, organizationId, scope),
    selectOrganizationRows("tickets", columns.tickets, organizationId, scope),
    selectOrganizationRows("deadlines", columns.deadlines, organizationId, scope),
    selectOrganizationRows("employees", columns.employees, organizationId, scope),
    selectOrganizationRows("departments", columns.departments, organizationId, scope),
    selectOrganizationRows("kpis", columns.kpis, organizationId, scope),
    selectOrganizationRows("kpi_periods", columns.kpiPeriods, organizationId, scope),
    selectOrganizationRows(
      "company_alerts",
      columns.companyAlerts,
      organizationId,
      scope,
    ),
    selectOrganizationRows(
      "customer_cases",
      columns.customerCases,
      organizationId,
      scope,
    ),
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
        status: "Open",
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
