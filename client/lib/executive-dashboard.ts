import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "./supabase";
import { useSupabaseAuth } from "./supabase-auth";
import { useCurrentOrganisation } from "./supabase-identity";

export type CompanyAlert = {
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
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Deadline = {
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

export type DepartmentContext = {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  description: string | null;
  department_group: string;
  active: boolean;
};

export type EmployeeContext = {
  id: string;
  organization_id: string | null;
  first_name: string;
  last_name: string;
  job_title: string | null;
  department_id: string | null;
  employee_status: string;
};

export type KpiPeriod = {
  id: string;
  organization_id: string | null;
  period_type: string;
  period_name: string;
  start_date: string;
  end_date: string;
  status: string;
};

export type Kpi = {
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

export type KpiTarget = {
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

export type KpiResult = {
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

export type Revenue = {
  id: string;
  organization_id: string | null;
  revenue_date: string;
  revenue_type: string;
  source_entity_type: string | null;
  source_entity_id: string | null;
  amount: number | null;
  currency: string;
  status: string;
  description: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  organization_id: string;
  financial_period_id: string | null;
  expense_date: string;
  description: string;
  amount: number | null;
  currency: string;
  paid_by_type: string;
  paid_by_employee_id: string | null;
  reimbursement_status: string;
  reimbursement_amount: number | null;
  approval_status: string;
  is_historical: boolean;
  requires_review: boolean;
  created_at: string;
  updated_at: string;
};

export type FinancialPeriod = {
  id: string;
  organization_id: string;
  period_name: string;
  period_start: string;
  period_end: string;
  status: string;
  notes: string | null;
};

export type Task = {
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

export type Ticket = {
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

export type PeopleData = {
  employees: EmployeeContext[];
  departments: DepartmentContext[];
};

export type OperationsData = {
  deadlines: Deadline[];
  tasks: Task[];
  tickets: Ticket[];
};

export type KpiData = {
  kpis: Kpi[];
  targets: KpiTarget[];
  results: KpiResult[];
  periods: KpiPeriod[];
};

export type FinanceData = {
  revenue: Revenue[];
  expenses: Expense[];
  periods: FinancialPeriod[];
};

type RawRow = Readonly<Record<string, unknown>>;

type QueryState<T> = {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
};

const columns = {
  companyAlerts:
    "id, organization_id, alert_type, title, message, severity, source_type, source_id, status, starts_at, expires_at, acknowledged_at, resolved_at, created_at, updated_at",
  deadlines:
    "id, organization_id, department_id, owner_employee_id, title, description, due_at, priority, status, linked_task_id, linked_ticket_id, created_at, updated_at",
  departments:
    "id, organization_id, code, name, description, department_group, active",
  employees:
    "id, organization_id, first_name, last_name, job_title, department_id, employee_status",
  kpiPeriods:
    "id, organization_id, period_type, period_name, start_date, end_date, status",
  kpis: "id, organization_id, department_id, owner_employee_id, name, code, description, category, measurement_type, direction, unit, active",
  kpiTargets:
    "id, kpi_id, employee_id, department_id, period_id, target_value, green_threshold, yellow_threshold, critical_threshold, notes",
  kpiResults:
    "id, kpi_id, target_id, employee_id, department_id, period_id, actual_value, calculated_percentage, status, commentary",
  revenue:
    "id, organization_id, revenue_date, revenue_type, source_entity_type, source_entity_id, amount, currency, status, description, created_at",
  expenses:
    "id, organization_id, financial_period_id, expense_date, description, amount, currency, paid_by_type, paid_by_employee_id, reimbursement_status, reimbursement_amount, approval_status, is_historical, requires_review, created_at, updated_at",
  financialPeriods:
    "id, organization_id, period_name, period_start, period_end, status, notes",
  tasks:
    "id, organization_id, department_id, assigned_to, created_by, kpi_id, title, description, priority, status, progress_percentage, due_date, completed_at, created_at, updated_at",
  tickets:
    "id, organization_id, department_id, reported_by, assigned_to, kpi_id, ticket_number, title, description, category, priority, status, due_date, resolved_at, created_at, updated_at",
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

export type DashboardScope = {
  departmentIds?: string[];
  employeeId?: string;
};

type TableScopeColumnMap = Record<
  string,
  { department?: string; employee?: string }
>;

const scopeColumnsByTable: TableScopeColumnMap = {
  employees: { department: "department_id" },
  departments: {},
  deadlines: { department: "department_id", employee: "owner_employee_id" },
  tasks: { department: "department_id", employee: "assigned_to" },
  tickets: { department: "department_id", employee: "assigned_to" },
  kpis: { department: "department_id", employee: "owner_employee_id" },
  kpi_periods: {},
  kpi_targets: { department: "department_id", employee: "employee_id" },
  kpi_results: { department: "department_id", employee: "employee_id" },
  revenue: { department: "department_id" },
  expenses: { department: "department_id" },
  financial_periods: {},
  company_alerts: { department: "department_id" },
};

function applyScopeToQuery(
  queryBuilder: unknown,
  table: string,
  scope?: DashboardScope,
): unknown {
  const columns = scopeColumnsByTable[table];
  if (!scope || !columns) return queryBuilder;
  let q: any = queryBuilder;
  if (columns.department && scope.departmentIds && scope.departmentIds.length) {
    q = q.in(columns.department, scope.departmentIds);
  }
  if (columns.employee && scope.employeeId) {
    q = q.eq(columns.employee, scope.employeeId);
  }
  return q;
}

async function selectRows(
  table: string,
  selection: string,
  organizationId: string,
  scope?: DashboardScope,
): Promise<RawRow[]> {
  const base = getSupabaseClient()
    .from(table)
    .select(selection)
    .eq("organization_id", organizationId);
  const scoped = applyScopeToQuery(base, table, scope) as any;
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
  let query: any = getSupabaseClient().from(table).select(selection);
  for (const { column, values } of filters) {
    query = query.in(column, values);
  }
  const scoped = applyScopeToQuery(query, table, scope) as any;
  const { data, error } = await scoped;
  if (error) throw error;
  return rawRows(data);
}

function parseCompanyAlert(row: RawRow): CompanyAlert {
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
    resolved_at: text(row, "resolved_at"),
    created_at: requiredText(row, "created_at"),
    updated_at: requiredText(row, "updated_at"),
  };
}

function parseDeadline(row: RawRow): Deadline {
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

function parseDepartment(row: RawRow): DepartmentContext {
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

function parseEmployee(row: RawRow): EmployeeContext {
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

function parseKpiPeriod(row: RawRow): KpiPeriod {
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

function parseKpi(row: RawRow): Kpi {
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

function parseKpiTarget(row: RawRow): KpiTarget {
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

function parseKpiResult(row: RawRow): KpiResult {
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

function parseRevenue(row: RawRow): Revenue {
  return {
    id: requiredText(row, "id"),
    organization_id: text(row, "organization_id"),
    revenue_date: requiredText(row, "revenue_date"),
    revenue_type: requiredText(row, "revenue_type"),
    source_entity_type: text(row, "source_entity_type"),
    source_entity_id: text(row, "source_entity_id"),
    amount: numberValue(row, "amount"),
    currency: requiredText(row, "currency").toUpperCase(),
    status: requiredText(row, "status"),
    description: text(row, "description"),
    created_at: requiredText(row, "created_at"),
  };
}

function parseExpense(row: RawRow): Expense {
  return {
    id: requiredText(row, "id"),
    organization_id: requiredText(row, "organization_id"),
    financial_period_id: text(row, "financial_period_id"),
    expense_date: requiredText(row, "expense_date"),
    description: requiredText(row, "description"),
    amount: numberValue(row, "amount"),
    currency: requiredText(row, "currency").toUpperCase(),
    paid_by_type: requiredText(row, "paid_by_type"),
    paid_by_employee_id: text(row, "paid_by_employee_id"),
    reimbursement_status: requiredText(row, "reimbursement_status"),
    reimbursement_amount: numberValue(row, "reimbursement_amount"),
    approval_status: requiredText(row, "approval_status"),
    is_historical: booleanValue(row, "is_historical"),
    requires_review: booleanValue(row, "requires_review"),
    created_at: requiredText(row, "created_at"),
    updated_at: requiredText(row, "updated_at"),
  };
}

function parseFinancialPeriod(row: RawRow): FinancialPeriod {
  return {
    id: requiredText(row, "id"),
    organization_id: requiredText(row, "organization_id"),
    period_name: requiredText(row, "period_name"),
    period_start: requiredText(row, "period_start"),
    period_end: requiredText(row, "period_end"),
    status: requiredText(row, "status"),
    notes: text(row, "notes"),
  };
}

function parseTask(row: RawRow): Task {
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

function parseTicket(row: RawRow): Ticket {
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

async function fetchPeople(organizationId: string, scope?: DashboardScope): Promise<PeopleData> {
  const [employees, departments] = await Promise.all([
    selectRows("employees", columns.employees, organizationId, scope),
    selectRows("departments", columns.departments, organizationId, scope),
  ]);
  return {
    employees: employees.map(parseEmployee),
    departments: departments.map(parseDepartment),
  };
}

async function fetchOperations(
  organizationId: string,
  scope?: DashboardScope,
): Promise<OperationsData> {
  const [deadlines, tasks, tickets] = await Promise.all([
    selectRows("deadlines", columns.deadlines, organizationId, scope),
    selectRows("tasks", columns.tasks, organizationId, scope),
    selectRows("tickets", columns.tickets, organizationId, scope),
  ]);
  return {
    deadlines: deadlines.map(parseDeadline),
    tasks: tasks.map(parseTask),
    tickets: tickets.map(parseTicket),
  };
}

async function fetchKpis(organizationId: string, scope?: DashboardScope): Promise<KpiData> {
  const [kpiRows, periodRows] = await Promise.all([
    selectRows("kpis", columns.kpis, organizationId, scope),
    selectRows("kpi_periods", columns.kpiPeriods, organizationId, scope),
  ]);
  const kpis = kpiRows.map(parseKpi);
  const periods = periodRows.map(parseKpiPeriod);
  const relationshipFilters = [
    { column: "kpi_id", values: kpis.map((kpi) => kpi.id) },
    { column: "period_id", values: periods.map((period) => period.id) },
  ];
  const [targetRows, resultRows] = await Promise.all([
    selectRelatedRows("kpi_targets", columns.kpiTargets, relationshipFilters, scope),
    selectRelatedRows("kpi_results", columns.kpiResults, relationshipFilters, scope),
  ]);
  return {
    kpis,
    targets: targetRows.map(parseKpiTarget),
    results: resultRows.map(parseKpiResult),
    periods,
  };
}

async function fetchFinance(organizationId: string, scope?: DashboardScope): Promise<FinanceData> {
  const [revenue, expenses, periods] = await Promise.all([
    selectRows("revenue", columns.revenue, organizationId, scope),
    selectRows("expenses", columns.expenses, organizationId, scope),
    selectRows("financial_periods", columns.financialPeriods, organizationId, scope),
  ]);
  return {
    revenue: revenue.map(parseRevenue),
    expenses: expenses.map(parseExpense),
    periods: periods.map(parseFinancialPeriod),
  };
}

async function fetchAlerts(organizationId: string, scope?: DashboardScope): Promise<CompanyAlert[]> {
  const rows = await selectRows(
    "company_alerts",
    columns.companyAlerts,
    organizationId,
    scope,
  );
  return rows
    .map(parseCompanyAlert)
    .filter((alert) => isActiveCompanyAlert(alert));
}

function useExecutiveQuery<T>(
  scope: string,
  fetcher: (organizationId: string, dashboardScope?: DashboardScope) => Promise<T>,
  dashboardScope?: DashboardScope,
): QueryState<T> {
  const { user, loading: authLoading } = useSupabaseAuth();
  const organizationState = useCurrentOrganisation();
  const organizationId = organizationState.organizationId;
  const enabled = Boolean(
    user && !authLoading && !organizationState.isLoading && organizationId,
  );

  const serializedDashboardScope = [
    dashboardScope?.departmentIds?.slice().sort().join(",") ?? "",
    dashboardScope?.employeeId ?? "",
  ].join("|");

  const query = useQuery({
    queryKey: [
      "executive-dashboard",
      scope,
      user?.id ?? null,
      organizationId,
      serializedDashboardScope,
    ],
    enabled,
    queryFn: () => fetcher(organizationId!, dashboardScope),
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
          ? new Error("The dashboard data could not be loaded.")
          : null,
    refetch: () => query.refetch().then((result) => result.data),
  };
}

export function useExecutiveAlerts(dashboardScope?: DashboardScope) {
  return useExecutiveQuery("alerts", fetchAlerts, dashboardScope);
}

export function useExecutiveSummary(dashboardScope?: DashboardScope) {
  const people = useExecutiveQuery("people", fetchPeople, dashboardScope);
  const operations = useExecutiveQuery("operations", fetchOperations, dashboardScope);
  const kpis = useExecutiveQuery("kpis", fetchKpis, dashboardScope);
  const finance = useExecutiveQuery("finance", fetchFinance, dashboardScope);
  return { people, operations, kpis, finance };
}

export function normaliseStatus(status: string | null | undefined) {
  return status?.trim().toLowerCase().replace(/[_-]+/g, " ") ?? null;
}

export function isResolvedStatus(status: string | null | undefined) {
  return [
    "completed",
    "complete",
    "closed",
    "done",
    "resolved",
    "remediated",
    "cancelled",
    "canceled",
    "expired",
    "dismissed",
  ].includes(normaliseStatus(status) ?? "");
}

export function isActiveCompanyAlert(alert: CompanyAlert, now = new Date()) {
  if (alert.resolved_at || isResolvedStatus(alert.status)) return false;
  const startsAt = new Date(alert.starts_at);
  const expiresAt = alert.expires_at ? new Date(alert.expires_at) : null;
  if (!Number.isNaN(startsAt.valueOf()) && startsAt > now) return false;
  if (expiresAt && !Number.isNaN(expiresAt.valueOf()) && expiresAt <= now)
    return false;
  return true;
}

export function isOverdueTimestamp(
  value: string | null,
  status: string | null | undefined,
  now = new Date(),
) {
  if (!value || isResolvedStatus(status)) return false;
  const dueAt = new Date(value);
  return !Number.isNaN(dueAt.valueOf()) && dueAt < now;
}

export function isOverdueDate(
  value: string | null,
  status: string | null | undefined,
  now = new Date(),
) {
  if (!value || isResolvedStatus(status)) return false;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDate = new Date(`${value}T23:59:59`);
  return !Number.isNaN(dueDate.valueOf()) && dueDate < today;
}

function periodContainsDate(
  startDate: string,
  endDate: string,
  date = new Date(),
) {
  const currentDate = date.toISOString().slice(0, 10);
  return currentDate >= startDate && currentDate <= endDate;
}

function isUsablePeriodStatus(status: string) {
  return !["closed", "complete", "completed", "cancelled", "canceled"].includes(
    normaliseStatus(status) ?? "",
  );
}

export function findCurrentKpiPeriod(periods: KpiPeriod[], now = new Date()) {
  return (
    periods.find(
      (period) =>
        ["current", "active", "open"].includes(
          normaliseStatus(period.status) ?? "",
        ) && periodContainsDate(period.start_date, period.end_date, now),
    ) ??
    periods.find(
      (period) =>
        isUsablePeriodStatus(period.status) &&
        periodContainsDate(period.start_date, period.end_date, now),
    ) ??
    null
  );
}

export type ExecutiveKpiRow = {
  id: string;
  name: string;
  unit: string | null;
  measurementType: string;
  direction: string;
  target: number | null;
  actual: number | null;
  calculatedPercentage: number | null;
  status: string;
  periodName: string | null;
  ownerEmployeeId: string | null;
  commentary: string | null;
};

export function buildKpiRows(data: KpiData | undefined, now = new Date()): {
  rows: ExecutiveKpiRow[];
  period: KpiPeriod | null;
} {
  if (!data) return { rows: [], period: null };
  const period = findCurrentKpiPeriod(data.periods, now);
  if (!period) return { rows: [], period: null };

  const activeKpis = data.kpis.filter((kpi) => kpi.active);
  const rows = activeKpis.map((kpi) => {
    const target = data.targets.find(
      (candidate) =>
        candidate.kpi_id === kpi.id && candidate.period_id === period.id,
    );
    const result = data.results.find(
      (candidate) =>
        candidate.period_id === period.id &&
        (candidate.target_id === target?.id ||
          (!target && candidate.kpi_id === kpi.id)),
    );
    return {
      id: kpi.id,
      name: kpi.name,
      unit: kpi.unit,
      measurementType: kpi.measurement_type,
      direction: kpi.direction,
      target: target?.target_value ?? null,
      actual: result?.actual_value ?? null,
      calculatedPercentage: result?.calculated_percentage ?? null,
      status: result?.status ?? "",
      periodName: period.period_name,
      ownerEmployeeId: kpi.owner_employee_id,
      commentary: result?.commentary ?? null,
    };
  });
  return { rows, period };
}

type MoneyBuckets = Record<string, number>;

export type ExecutiveFinanceSummary = {
  revenue: MoneyBuckets;
  expenses: MoneyBuckets;
  netPosition: MoneyBuckets;
  expenseByPaidType: Record<string, MoneyBuckets>;
  recognizedRevenueRecords: number;
  expenseRecords: number;
  periodName: string | null;
};

function addMoney(
  buckets: MoneyBuckets,
  currency: string,
  amount: number | null,
) {
  if (!currency || amount === null) return;
  buckets[currency] = (buckets[currency] ?? 0) + amount;
}

function currentFinancialPeriod(periods: FinancialPeriod[], now = new Date()) {
  return (
    periods.find(
      (period) =>
        ["current", "active", "open"].includes(
          normaliseStatus(period.status) ?? "",
        ) &&
        period.period_start <= now.toISOString().slice(0, 10) &&
        period.period_end >= now.toISOString().slice(0, 10),
    ) ?? null
  );
}

function inFinancialPeriod(date: string, period: FinancialPeriod | null) {
  return !period || (date >= period.period_start && date <= period.period_end);
}

export function buildFinanceSummary(
  data: FinanceData | undefined,
): ExecutiveFinanceSummary {
  if (!data) {
    return {
      revenue: {},
      expenses: {},
      netPosition: {},
      expenseByPaidType: {},
      recognizedRevenueRecords: 0,
      expenseRecords: 0,
      periodName: null,
    };
  }

  const period = currentFinancialPeriod(data.periods);
  const recognizedRevenue = data.revenue.filter(
    (row) =>
      ["recognized", "recognised"].includes(
        normaliseStatus(row.status) ?? "",
      ) && inFinancialPeriod(row.revenue_date, period),
  );
  const expenses = data.expenses.filter((row) =>
    inFinancialPeriod(row.expense_date, period),
  );
  const revenueBuckets: MoneyBuckets = {};
  const expenseBuckets: MoneyBuckets = {};
  const expenseByPaidType: Record<string, MoneyBuckets> = {};

  recognizedRevenue.forEach((row) =>
    addMoney(revenueBuckets, row.currency, row.amount),
  );
  expenses.forEach((row) => {
    addMoney(expenseBuckets, row.currency, row.amount);
    const paidType = row.paid_by_type || "Not specified";
    expenseByPaidType[paidType] ??= {};
    addMoney(expenseByPaidType[paidType], row.currency, row.amount);
  });

  const netPosition: MoneyBuckets = {};
  for (const currency of new Set([
    ...Object.keys(revenueBuckets),
    ...Object.keys(expenseBuckets),
  ])) {
    netPosition[currency] =
      (revenueBuckets[currency] ?? 0) - (expenseBuckets[currency] ?? 0);
  }

  return {
    revenue: revenueBuckets,
    expenses: expenseBuckets,
    netPosition,
    expenseByPaidType,
    recognizedRevenueRecords: recognizedRevenue.length,
    expenseRecords: expenses.length,
    periodName: period?.period_name ?? null,
  };
}

export function formatMoneyBuckets(buckets: MoneyBuckets) {
  const entries = Object.entries(buckets);
  if (!entries.length) return "Awaiting live data";
  return entries
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([currency, amount]) => {
      try {
        return new Intl.NumberFormat("en-ZA", {
          style: "currency",
          currency,
          maximumFractionDigits: 2,
        }).format(amount);
      } catch {
        return `${currency} ${amount.toLocaleString("en-ZA", {
          maximumFractionDigits: 2,
        })}`;
      }
    })
    .join(" · ");
}

export function formatExpensePaidTypes(
  expenseByPaidType: Record<string, MoneyBuckets>,
) {
  const entries = Object.entries(expenseByPaidType);
  if (!entries.length) return "No expense records";
  return entries
    .map(([paidType, amounts]) => `${paidType}: ${formatMoneyBuckets(amounts)}`)
    .join(" · ");
}

export function statusToDisplay(status: string | null | undefined) {
  const normalised = normaliseStatus(status);
  if (!normalised) return null;
  if (["healthy", "good", "on track", "ok", "green"].includes(normalised))
    return "healthy" as const;
  if (["critical", "blocked", "red", "failed", "overdue"].includes(normalised))
    return "critical" as const;
  if (
    [
      "attention",
      "at risk",
      "warning",
      "yellow",
      "in progress",
      "open",
      "pending",
    ].includes(normalised)
  )
    return "attention" as const;
  return null;
}
