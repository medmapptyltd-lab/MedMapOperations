import { useQuery } from "@tanstack/react-query";
import { useCurrentEmployee, useCurrentOrganisation } from "./supabase-identity";
import { useSupabaseAuth } from "./supabase-auth";
import { getSupabaseClient } from "./supabase";
import { isResolvedStatus, normaliseStatus } from "./executive-dashboard";

export type ProductRoadmap = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  owner_employee_id: string | null;
  status: string;
  start_date: string | null;
  target_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductItem = {
  id: string;
  organization_id: string;
  roadmap_id: string | null;
  title: string;
  description: string | null;
  item_type: string;
  priority: string;
  status: string;
  owner_employee_id: string | null;
  target_release_id: string | null;
  linked_task_id: string | null;
  linked_ticket_id: string | null;
  business_value: string | null;
  acceptance_criteria: string | null;
  target_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductRelease = {
  id: string;
  organization_id: string;
  name: string;
  version: string | null;
  description: string | null;
  status: string;
  release_date: string | null;
  owner_employee_id: string | null;
  release_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductFeedback = {
  id: string;
  organization_id: string;
  product_item_id: string | null;
  source_type: string;
  source_reference: string | null;
  title: string | null;
  feedback: string;
  priority: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EngineeringProject = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  project_type: string;
  status: string;
  priority: string;
  owner_employee_id: string | null;
  product_item_id: string | null;
  linked_task_id: string | null;
  linked_ticket_id: string | null;
  start_date: string | null;
  target_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Deployment = {
  id: string;
  organization_id: string;
  engineering_project_id: string | null;
  product_release_id: string | null;
  environment_id: string | null;
  version: string | null;
  commit_reference: string | null;
  deployment_status: string;
  deployed_by: string | null;
  deployment_started_at: string | null;
  deployment_completed_at: string | null;
  rollback_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SecurityControl = {
  id: string;
  organization_id: string;
  control_code: string | null;
  name: string;
  description: string | null;
  control_type: string;
  status: string;
  owner_employee_id: string | null;
  review_frequency: string | null;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  evidence_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SecurityTest = {
  id: string;
  organization_id: string;
  owner_employee_id: string | null;
  linked_task_id: string | null;
  linked_ticket_id: string | null;
};

export type SecurityFinding = {
  id: string;
  organization_id: string;
  security_test_id: string | null;
  owner_employee_id: string | null;
  linked_task_id: string | null;
  linked_ticket_id: string | null;
  status: string | null;
  severity: string | null;
  risk_level: string | null;
  finding_title: string | null;
};

export type SecurityIncident = {
  id: string;
  organization_id: string;
  owner_employee_id: string | null;
  linked_task_id: string | null;
  linked_ticket_id: string | null;
  status: string | null;
  severity: string | null;
  incident_title: string | null;
};

export type SecurityRemediation = {
  id: string;
  organization_id: string;
  finding_id: string | null;
  owner_employee_id: string | null;
  verified_by: string | null;
  linked_task_id: string | null;
  linked_ticket_id: string | null;
  status: string | null;
};

export type EmployeeReference = {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  employee_status: string;
};

export type OperationalWorkReference = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
};

export type ProductEngineeringDashboardData = {
  roadmaps: ProductRoadmap[];
  items: ProductItem[];
  releases: ProductRelease[];
  feedback: ProductFeedback[];
  projects: EngineeringProject[];
  deployments: Deployment[];
  controls: SecurityControl[];
  securityTests: SecurityTest[];
  findings: SecurityFinding[];
  incidents: SecurityIncident[];
  remediations: SecurityRemediation[];
  employees: EmployeeReference[];
  tasks: OperationalWorkReference[];
  tickets: OperationalWorkReference[];
  optionalErrors: string[];
};

type RawRow = Readonly<Record<string, unknown>>;
type QueryState = {
  data: ProductEngineeringDashboardData | undefined;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
};

const columns = {
  roadmaps:
    "id, organization_id, name, description, owner_employee_id, status, start_date, target_date, created_at, updated_at",
  items:
    "id, organization_id, roadmap_id, title, description, item_type, priority, status, owner_employee_id, target_release_id, linked_task_id, linked_ticket_id, business_value, acceptance_criteria, target_date, created_at, updated_at",
  releases:
    "id, organization_id, name, version, description, status, release_date, owner_employee_id, release_notes, created_at, updated_at",
  feedback:
    "id, organization_id, product_item_id, source_type, source_reference, title, feedback, priority, status, reviewed_by, reviewed_at, created_at, updated_at",
  projects:
    "id, organization_id, name, description, project_type, status, priority, owner_employee_id, product_item_id, linked_task_id, linked_ticket_id, start_date, target_date, completed_at, created_at, updated_at",
  deployments:
    "id, organization_id, engineering_project_id, product_release_id, environment_id, version, commit_reference, deployment_status, deployed_by, deployment_started_at, deployment_completed_at, rollback_reason, notes, created_at, updated_at",
  controls:
    "id, organization_id, control_code, name, description, control_type, status, owner_employee_id, review_frequency, last_reviewed_at, next_review_at, evidence_reference, notes, created_at, updated_at",
  securityTests: "id, organization_id, owner_employee_id, linked_task_id, linked_ticket_id, status, test_type, started_at, completed_at",
  findings:
    "id, organization_id, security_test_id, owner_employee_id, linked_task_id, linked_ticket_id, status, severity, risk_level, finding_title, title",
  incidents:
    "id, organization_id, owner_employee_id, linked_task_id, linked_ticket_id, status, severity, incident_title, title",
  remediations:
    "id, organization_id, finding_id, owner_employee_id, verified_by, linked_task_id, linked_ticket_id, status",
  employees: "id, first_name, last_name, job_title, employee_status",
  tasks: "id, title, status, priority, due_date",
  tickets: "id, title, status, priority, due_date",
} as const;

function isRawRow(value: unknown): value is RawRow {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rawRows(value: unknown): RawRow[] {
  return Array.isArray(value) ? value.filter(isRawRow) : [];
}

function requiredString(row: RawRow, key: string, label: string) {
  const value = row[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is missing ${key}.`);
  }
  return value;
}

function optionalString(row: RawRow, key: string) {
  const value = row[key];
  return value === null || value === undefined ? null : typeof value === "string" ? value : null;
}

function parseRoadmap(row: RawRow): ProductRoadmap {
  return {
    id: requiredString(row, "id", "Product roadmap"),
    organization_id: requiredString(row, "organization_id", "Product roadmap"),
    name: requiredString(row, "name", "Product roadmap"),
    description: optionalString(row, "description"),
    owner_employee_id: optionalString(row, "owner_employee_id"),
    status: requiredString(row, "status", "Product roadmap"),
    start_date: optionalString(row, "start_date"),
    target_date: optionalString(row, "target_date"),
    created_at: requiredString(row, "created_at", "Product roadmap"),
    updated_at: requiredString(row, "updated_at", "Product roadmap"),
  };
}

function parseItem(row: RawRow): ProductItem {
  return {
    id: requiredString(row, "id", "Product item"),
    organization_id: requiredString(row, "organization_id", "Product item"),
    roadmap_id: optionalString(row, "roadmap_id"),
    title: requiredString(row, "title", "Product item"),
    description: optionalString(row, "description"),
    item_type: requiredString(row, "item_type", "Product item"),
    priority: requiredString(row, "priority", "Product item"),
    status: requiredString(row, "status", "Product item"),
    owner_employee_id: optionalString(row, "owner_employee_id"),
    target_release_id: optionalString(row, "target_release_id"),
    linked_task_id: optionalString(row, "linked_task_id"),
    linked_ticket_id: optionalString(row, "linked_ticket_id"),
    business_value: optionalString(row, "business_value"),
    acceptance_criteria: optionalString(row, "acceptance_criteria"),
    target_date: optionalString(row, "target_date"),
    created_at: requiredString(row, "created_at", "Product item"),
    updated_at: requiredString(row, "updated_at", "Product item"),
  };
}

function parseRelease(row: RawRow): ProductRelease {
  return {
    id: requiredString(row, "id", "Product release"),
    organization_id: requiredString(row, "organization_id", "Product release"),
    name: requiredString(row, "name", "Product release"),
    version: optionalString(row, "version"),
    description: optionalString(row, "description"),
    status: requiredString(row, "status", "Product release"),
    release_date: optionalString(row, "release_date"),
    owner_employee_id: optionalString(row, "owner_employee_id"),
    release_notes: optionalString(row, "release_notes"),
    created_at: requiredString(row, "created_at", "Product release"),
    updated_at: requiredString(row, "updated_at", "Product release"),
  };
}

function parseFeedback(row: RawRow): ProductFeedback {
  return {
    id: requiredString(row, "id", "Product feedback"),
    organization_id: requiredString(row, "organization_id", "Product feedback"),
    product_item_id: optionalString(row, "product_item_id"),
    source_type: requiredString(row, "source_type", "Product feedback"),
    source_reference: optionalString(row, "source_reference"),
    title: optionalString(row, "title"),
    feedback: requiredString(row, "feedback", "Product feedback"),
    priority: requiredString(row, "priority", "Product feedback"),
    status: requiredString(row, "status", "Product feedback"),
    reviewed_by: optionalString(row, "reviewed_by"),
    reviewed_at: optionalString(row, "reviewed_at"),
    created_at: requiredString(row, "created_at", "Product feedback"),
    updated_at: requiredString(row, "updated_at", "Product feedback"),
  };
}

function parseProject(row: RawRow): EngineeringProject {
  return {
    id: requiredString(row, "id", "Engineering project"),
    organization_id: requiredString(row, "organization_id", "Engineering project"),
    name: requiredString(row, "name", "Engineering project"),
    description: optionalString(row, "description"),
    project_type: requiredString(row, "project_type", "Engineering project"),
    status: requiredString(row, "status", "Engineering project"),
    priority: requiredString(row, "priority", "Engineering project"),
    owner_employee_id: optionalString(row, "owner_employee_id"),
    product_item_id: optionalString(row, "product_item_id"),
    linked_task_id: optionalString(row, "linked_task_id"),
    linked_ticket_id: optionalString(row, "linked_ticket_id"),
    start_date: optionalString(row, "start_date"),
    target_date: optionalString(row, "target_date"),
    completed_at: optionalString(row, "completed_at"),
    created_at: requiredString(row, "created_at", "Engineering project"),
    updated_at: requiredString(row, "updated_at", "Engineering project"),
  };
}

function parseDeployment(row: RawRow): Deployment {
  return {
    id: requiredString(row, "id", "Deployment"),
    organization_id: requiredString(row, "organization_id", "Deployment"),
    engineering_project_id: optionalString(row, "engineering_project_id"),
    product_release_id: optionalString(row, "product_release_id"),
    environment_id: optionalString(row, "environment_id"),
    version: optionalString(row, "version"),
    commit_reference: optionalString(row, "commit_reference"),
    deployment_status: requiredString(row, "deployment_status", "Deployment"),
    deployed_by: optionalString(row, "deployed_by"),
    deployment_started_at: optionalString(row, "deployment_started_at"),
    deployment_completed_at: optionalString(row, "deployment_completed_at"),
    rollback_reason: optionalString(row, "rollback_reason"),
    notes: optionalString(row, "notes"),
    created_at: requiredString(row, "created_at", "Deployment"),
    updated_at: requiredString(row, "updated_at", "Deployment"),
  };
}

function parseControl(row: RawRow): SecurityControl {
  return {
    id: requiredString(row, "id", "Security control"),
    organization_id: requiredString(row, "organization_id", "Security control"),
    control_code: optionalString(row, "control_code"),
    name: requiredString(row, "name", "Security control"),
    description: optionalString(row, "description"),
    control_type: requiredString(row, "control_type", "Security control"),
    status: requiredString(row, "status", "Security control"),
    owner_employee_id: optionalString(row, "owner_employee_id"),
    review_frequency: optionalString(row, "review_frequency"),
    last_reviewed_at: optionalString(row, "last_reviewed_at"),
    next_review_at: optionalString(row, "next_review_at"),
    evidence_reference: optionalString(row, "evidence_reference"),
    notes: optionalString(row, "notes"),
    created_at: requiredString(row, "created_at", "Security control"),
    updated_at: requiredString(row, "updated_at", "Security control"),
  };
}

function parseSecurityTest(row: RawRow): SecurityTest {
  return {
    id: requiredString(row, "id", "Security test"),
    organization_id: requiredString(row, "organization_id", "Security test"),
    owner_employee_id: optionalString(row, "owner_employee_id"),
    linked_task_id: optionalString(row, "linked_task_id"),
    linked_ticket_id: optionalString(row, "linked_ticket_id"),
  };
}

function parseFinding(row: RawRow): SecurityFinding {
  return {
    id: requiredString(row, "id", "Security finding"),
    organization_id: requiredString(row, "organization_id", "Security finding"),
    security_test_id: optionalString(row, "security_test_id"),
    owner_employee_id: optionalString(row, "owner_employee_id"),
    linked_task_id: optionalString(row, "linked_task_id"),
    linked_ticket_id: optionalString(row, "linked_ticket_id"),
    status: optionalString(row, "status"),
    severity: optionalString(row, "severity"),
    risk_level: optionalString(row, "risk_level"),
    finding_title: optionalString(row, "finding_title") ?? optionalString(row, "title"),
  };
}

function parseIncident(row: RawRow): SecurityIncident {
  return {
    id: requiredString(row, "id", "Security incident"),
    organization_id: requiredString(row, "organization_id", "Security incident"),
    owner_employee_id: optionalString(row, "owner_employee_id"),
    linked_task_id: optionalString(row, "linked_task_id"),
    linked_ticket_id: optionalString(row, "linked_ticket_id"),
    status: optionalString(row, "status"),
    severity: optionalString(row, "severity"),
    incident_title: optionalString(row, "incident_title") ?? optionalString(row, "title"),
  };
}

function parseRemediation(row: RawRow): SecurityRemediation {
  return {
    id: requiredString(row, "id", "Security remediation"),
    organization_id: requiredString(row, "organization_id", "Security remediation"),
    finding_id: optionalString(row, "finding_id"),
    owner_employee_id: optionalString(row, "owner_employee_id"),
    verified_by: optionalString(row, "verified_by"),
    linked_task_id: optionalString(row, "linked_task_id"),
    linked_ticket_id: optionalString(row, "linked_ticket_id"),
    status: optionalString(row, "status"),
  };
}

function parseEmployee(row: RawRow): EmployeeReference {
  return {
    id: requiredString(row, "id", "Employee"),
    first_name: requiredString(row, "first_name", "Employee"),
    last_name: requiredString(row, "last_name", "Employee"),
    job_title: optionalString(row, "job_title"),
    employee_status: requiredString(row, "employee_status", "Employee"),
  };
}

function parseWork(row: RawRow): OperationalWorkReference {
  return {
    id: requiredString(row, "id", "Operational work"),
    title: requiredString(row, "title", "Operational work"),
    status: requiredString(row, "status", "Operational work"),
    priority: requiredString(row, "priority", "Operational work"),
    due_date: optionalString(row, "due_date"),
  };
}

async function selectOrganizationRows(
  table: string,
  selection: string,
  organizationId: string,
) {
  const { data, error } = await getSupabaseClient()
    .from(table)
    .select(selection)
    .eq("organization_id", organizationId);
  if (error) throw error;
  return rawRows(data);
}

async function selectRelatedRows(
  table: string,
  selection: string,
  organizationId: string,
  ids: string[],
) {
  if (!ids.length) return [];
  const { data, error } = await getSupabaseClient()
    .from(table)
    .select(selection)
    .eq("organization_id", organizationId)
    .in("id", ids);
  if (error) throw error;
  return rawRows(data);
}

function unique(values: Array<string | null>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function parseRows<T>(result: PromiseSettledResult<RawRow[]>, parser: (row: RawRow) => T, label: string) {
  if (result.status === "rejected") {
    return { rows: [] as T[], error: `${label} data is unavailable.` };
  }
  try {
    return { rows: result.value.map(parser), error: null };
  } catch {
    return { rows: [] as T[], error: `${label} data contains malformed records.` };
  }
}

async function fetchDashboard(organizationId: string): Promise<ProductEngineeringDashboardData> {
  const baseResults = await Promise.allSettled([
    selectOrganizationRows("product_roadmaps", columns.roadmaps, organizationId),
    selectOrganizationRows("product_items", columns.items, organizationId),
    selectOrganizationRows("product_releases", columns.releases, organizationId),
    selectOrganizationRows("product_feedback", columns.feedback, organizationId),
    selectOrganizationRows("engineering_projects", columns.projects, organizationId),
    selectOrganizationRows("deployments", columns.deployments, organizationId),
    selectOrganizationRows("security_controls", columns.controls, organizationId),
    selectOrganizationRows("security_tests", columns.securityTests, organizationId),
    selectOrganizationRows("security_findings", columns.findings, organizationId),
    selectOrganizationRows("security_incidents", columns.incidents, organizationId),
    selectOrganizationRows("security_remediations", columns.remediations, organizationId),
    selectOrganizationRows("employees", columns.employees, organizationId),
  ]);

  const roadmaps = parseRows(baseResults[0], parseRoadmap, "Product roadmap");
  const items = parseRows(baseResults[1], parseItem, "Product item");
  const releases = parseRows(baseResults[2], parseRelease, "Product release");
  const feedback = parseRows(baseResults[3], parseFeedback, "Product feedback");
  const projects = parseRows(baseResults[4], parseProject, "Engineering project");
  const deployments = parseRows(baseResults[5], parseDeployment, "Deployment");
  const controls = parseRows(baseResults[6], parseControl, "Security control");
  const securityTests = parseRows(baseResults[7], parseSecurityTest, "Security test");
  const findings = parseRows(baseResults[8], parseFinding, "Security finding");
  const incidents = parseRows(baseResults[9], parseIncident, "Security incident");
  const remediations = parseRows(baseResults[10], parseRemediation, "Security remediation");
  const employees = parseRows(baseResults[11], parseEmployee, "Employee");

  const taskIds = unique([
    ...items.rows.map((row) => row.linked_task_id),
    ...projects.rows.map((row) => row.linked_task_id),
    ...securityTests.rows.map((row) => row.linked_task_id),
    ...findings.rows.map((row) => row.linked_task_id),
    ...incidents.rows.map((row) => row.linked_task_id),
    ...remediations.rows.map((row) => row.linked_task_id),
  ]);
  const ticketIds = unique([
    ...items.rows.map((row) => row.linked_ticket_id),
    ...projects.rows.map((row) => row.linked_ticket_id),
    ...securityTests.rows.map((row) => row.linked_ticket_id),
    ...findings.rows.map((row) => row.linked_ticket_id),
    ...incidents.rows.map((row) => row.linked_ticket_id),
    ...remediations.rows.map((row) => row.linked_ticket_id),
  ]);

  const workResults = await Promise.allSettled([
    selectRelatedRows("tasks", columns.tasks, organizationId, taskIds),
    selectRelatedRows("tickets", columns.tickets, organizationId, ticketIds),
  ]);
  const tasks = parseRows(workResults[0], parseWork, "Task");
  const tickets = parseRows(workResults[1], parseWork, "Ticket");

  const optionalErrors = [
    roadmaps.error,
    items.error,
    releases.error,
    feedback.error,
    projects.error,
    deployments.error,
    controls.error,
    securityTests.error,
    findings.error,
    incidents.error,
    remediations.error,
    employees.error,
    tasks.error,
    tickets.error,
  ].filter((value): value is string => Boolean(value));

  return {
    roadmaps: roadmaps.rows,
    items: items.rows,
    releases: releases.rows,
    feedback: feedback.rows,
    projects: projects.rows,
    deployments: deployments.rows,
    controls: controls.rows,
    securityTests: securityTests.rows,
    findings: findings.rows,
    incidents: incidents.rows,
    remediations: remediations.rows,
    employees: employees.rows,
    tasks: tasks.rows,
    tickets: tickets.rows,
    optionalErrors,
  };
}

export function useProductEngineeringDashboard(): QueryState {
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

  const query = useQuery({
    queryKey: ["product-engineering-dashboard", user?.id ?? null, organizationId, employeeState.employee?.id ?? null],
    enabled,
    queryFn: () => fetchDashboard(organizationId!),
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
          ? new Error("The Product, Engineering and Security data could not be loaded.")
          : null,
    refetch: () => query.refetch().then((result) => result.data),
  };
}

export function displayEmployeeName(
  employees: EmployeeReference[],
  employeeId: string | null,
) {
  if (!employeeId) return "Unassigned";
  const employee = employees.find((candidate) => candidate.id === employeeId);
  return employee ? `${employee.first_name} ${employee.last_name}`.trim() : "Employee unavailable";
}

export function displayWorkReference(
  records: OperationalWorkReference[],
  recordId: string | null,
) {
  if (!recordId) return null;
  const record = records.find((candidate) => candidate.id === recordId);
  return record ? `${record.title} · ${record.status}` : recordId;
}

export function isOpenRecord(status: string) {
  return !isResolvedStatus(status);
}

export function isPastDate(value: string | null, status: string | null = null, now = new Date()) {
  if (!value || (status && isResolvedStatus(status))) return false;
  const date = new Date(value.includes("T") ? value : `${value}T23:59:59`);
  return !Number.isNaN(date.valueOf()) && date < now;
}

export function groupValues(values: string[]) {
  return values.reduce<Record<string, number>>((groups, value) => {
    const key = value || "Not provided";
    groups[key] = (groups[key] ?? 0) + 1;
    return groups;
  }, {});
}

export function statusTone(status: string | null | undefined) {
  const value = normaliseStatus(status);
  if (!value) return "neutral" as const;
  if (["critical", "failed", "blocked", "overdue", "rolled back", "rollback"].includes(value)) return "critical" as const;
  if (["attention", "at risk", "warning", "pending", "in progress", "active", "open"].includes(value)) return "attention" as const;
  if (["healthy", "on track", "completed", "complete", "closed", "resolved", "passed", "implemented"].includes(value)) return "healthy" as const;
  return "neutral" as const;
}
