import { useQuery } from "@tanstack/react-query";
import { useSupabaseAuth } from "./supabase-auth";
import { getSupabaseClient } from "./supabase";
import { useCurrentEmployee, useCurrentOrganisation } from "./supabase-identity";

export type DoctorAcquisitionRow = {
  id: string;
  doctor_id: string;
  department_id: string | null;
  owner_employee_id: string | null;
  acquisition_channel: string | null;
  source_detail: string | null;
  status: string;
  contacted_at: string | null;
  enrolled_at: string | null;
  converted_at: string | null;
  lost_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DoctorProfile = {
  id: string;
  first_name: string;
  last_name: string;
  practice_name: string | null;
  email: string | null;
  phone: string | null;
  specialty: string | null;
  city: string | null;
  province: string | null;
  medical_aid_supported: boolean;
  acquisition_source: string | null;
  acquisition_status: string;
  onboarding_date: string | null;
  probation_start_date: string | null;
  probation_end_date: string | null;
  first_1000_campaign: boolean;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AcquisitionEmployee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  department_id: string | null;
  job_title: string | null;
  employee_status: string;
};

export type AcquisitionDepartment = {
  id: string;
  code: string;
  name: string;
  active: boolean;
  department_group: string;
};

export type AcquisitionTask = {
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

export type AcquisitionTicket = {
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

export type AcquisitionKpi = {
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

export type AcquisitionKpiPeriod = {
  id: string;
  organization_id: string | null;
  period_type: string;
  period_name: string;
  start_date: string;
  end_date: string;
  status: string;
};

export type AcquisitionKpiTarget = {
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

export type AcquisitionKpiResult = {
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

export type AcquisitionAlert = {
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
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AcquisitionContactAttempt = {
  id: string;
  doctor_id: string;
  ambassador_id: string | null;
  employee_id: string | null;
  contact_channel: string;
  outcome: string;
  contacted_at: string;
  next_followup_at: string | null;
  notes: string | null;
};

export type AcquisitionAmbassador = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  current_tier: string | null;
};

export type AcquisitionReferral = {
  id: string;
  ambassador_id: string;
  doctor_id: string;
  referral_date: string;
  probation_status: string;
};

export type DoctorAcquisitionRecord = DoctorAcquisitionRow & {
  doctor: DoctorProfile | null;
  owner: AcquisitionEmployee | null;
  department: AcquisitionDepartment | null;
  ambassador: AcquisitionAmbassador | null;
  referralId: string | null;
  contactCount: number;
  lastContactAt: string | null;
  lastContactNote: string | null;
};

export type DoctorAcquisitionDashboardData = {
  acquisitions: DoctorAcquisitionRecord[];
  doctors: DoctorProfile[];
  employees: AcquisitionEmployee[];
  departments: AcquisitionDepartment[];
  tasks: AcquisitionTask[];
  tickets: AcquisitionTicket[];
  kpis: AcquisitionKpi[];
  kpiPeriods: AcquisitionKpiPeriod[];
  kpiTargets: AcquisitionKpiTarget[];
  kpiResults: AcquisitionKpiResult[];
  alerts: AcquisitionAlert[];
  ambassadors: AcquisitionAmbassador[];
  contactAttempts: AcquisitionContactAttempt[];
  optionalErrors: string[];
};

export function displayAmbassadorName(ambassador: AcquisitionAmbassador | null) {
  if (!ambassador) return "Unassigned";
  const name = `${ambassador.first_name} ${ambassador.last_name}`.trim();
  return name || "Unnamed ambassador";
}

type QueryState = {
  data: DoctorAcquisitionDashboardData | undefined;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
};

const columns = {
  doctorAcquisition:
    "id, doctor_id, department_id, owner_employee_id, acquisition_channel, source_detail, status, contacted_at, enrolled_at, converted_at, lost_at, notes, created_at, updated_at",
  doctors:
    "id, first_name, last_name, practice_name, email, phone, specialty, city, province, medical_aid_supported, acquisition_source, acquisition_status, onboarding_date, probation_start_date, probation_end_date, first_1000_campaign, active, notes, created_at, updated_at",
  employees:
    "id, first_name, last_name, email, department_id, job_title, employee_status",
  departments: "id, code, name, active, department_group",
  tasks:
    "id, organization_id, department_id, assigned_to, created_by, kpi_id, title, description, priority, status, progress_percentage, due_date, completed_at, created_at, updated_at",
  tickets:
    "id, organization_id, department_id, reported_by, assigned_to, kpi_id, ticket_number, title, description, category, priority, status, due_date, resolved_at, created_at, updated_at",
  kpis:
    "id, organization_id, department_id, owner_employee_id, name, code, description, category, measurement_type, direction, unit, active",
  kpiPeriods:
    "id, organization_id, period_type, period_name, start_date, end_date, status",
  kpiTargets:
    "id, kpi_id, employee_id, department_id, period_id, target_value, green_threshold, yellow_threshold, critical_threshold, notes",
  kpiResults:
    "id, kpi_id, target_id, employee_id, department_id, period_id, actual_value, calculated_percentage, status, commentary",
  companyAlerts:
    "id, organization_id, alert_type, title, message, severity, source_type, source_id, status, starts_at, expires_at, acknowledged_at, acknowledged_by, resolved_at, resolved_by, created_at, updated_at",
  contactAttempts:
    "id, doctor_id, ambassador_id, employee_id, contact_channel, outcome, contacted_at, next_followup_at, notes",
  ambassadors:
    "id, first_name, last_name, email, phone, status, current_tier",
  ambassadorReferrals:
    "id, ambassador_id, doctor_id, referral_date, probation_status",
} as const;

type UnknownRecord = Record<string, unknown>;

type RelationshipFilter = {
  column: string;
  values: string[];
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): UnknownRecord {
  if (!isRecord(value)) throw new Error("The response row is not an object.");
  return value;
}

function requiredString(row: UnknownRecord, field: string): string {
  const value = row[field];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`The ${field} field is invalid.`);
  }
  return value;
}

function nullableString(row: UnknownRecord, field: string): string | null {
  const value = row[field];
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new Error(`The ${field} field is invalid.`);
  return value;
}

function requiredUuid(row: UnknownRecord, field: string): string {
  const value = requiredString(row, field);
  if (!uuidPattern.test(value)) throw new Error(`The ${field} field is invalid.`);
  return value;
}

function nullableUuid(row: UnknownRecord, field: string): string | null {
  const value = nullableString(row, field);
  if (value === null) return null;
  if (!uuidPattern.test(value)) throw new Error(`The ${field} field is invalid.`);
  return value;
}

function normalizeTimestamp(row: UnknownRecord, field: string): string {
  const value = requiredString(row, field);
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) throw new Error(`The ${field} field is invalid.`);
  return date.toISOString();
}

function nullableTimestamp(row: UnknownRecord, field: string): string | null {
  const value = nullableString(row, field);
  if (value === null) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) throw new Error(`The ${field} field is invalid.`);
  return date.toISOString();
}

function nullableDate(row: UnknownRecord, field: string): string | null {
  const value = nullableString(row, field);
  if (value === null) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`The ${field} field is invalid.`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (
    Number.isNaN(date.valueOf()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error(`The ${field} field is invalid.`);
  }
  return value;
}

function nullableDateOrTimestamp(
  row: UnknownRecord,
  field: string,
): string | null {
  const value = nullableString(row, field);
  if (value === null) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00Z`);
    if (
      Number.isNaN(date.valueOf()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      throw new Error(`The ${field} field is invalid.`);
    }
    return value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) throw new Error(`The ${field} field is invalid.`);
  return date.toISOString();
}

function requiredDate(row: UnknownRecord, field: string): string {
  const value = nullableDate(row, field);
  if (value === null) throw new Error(`The ${field} field is invalid.`);
  return value;
}

function requiredBoolean(row: UnknownRecord, field: string): boolean {
  const value = row[field];
  if (typeof value !== "boolean") throw new Error(`The ${field} field is invalid.`);
  return value;
}

function nullableNumber(row: UnknownRecord, field: string): number | null {
  const value = row[field];
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  throw new Error(`The ${field} field is invalid.`);
}

function parseDoctorAcquisition(row: unknown): DoctorAcquisitionRow {
  const record = asRecord(row);
  return {
    id: requiredUuid(record, "id"),
    doctor_id: requiredUuid(record, "doctor_id"),
    department_id: nullableUuid(record, "department_id"),
    owner_employee_id: nullableUuid(record, "owner_employee_id"),
    acquisition_channel: nullableString(record, "acquisition_channel"),
    source_detail: nullableString(record, "source_detail"),
    status: requiredString(record, "status"),
    contacted_at: nullableTimestamp(record, "contacted_at"),
    enrolled_at: nullableTimestamp(record, "enrolled_at"),
    converted_at: nullableTimestamp(record, "converted_at"),
    lost_at: nullableTimestamp(record, "lost_at"),
    notes: nullableString(record, "notes"),
    created_at: normalizeTimestamp(record, "created_at"),
    updated_at: normalizeTimestamp(record, "updated_at"),
  };
}

function parseDoctor(row: unknown): DoctorProfile {
  const record = asRecord(row);
  return {
    id: requiredUuid(record, "id"),
    first_name: requiredString(record, "first_name"),
    last_name: requiredString(record, "last_name"),
    practice_name: nullableString(record, "practice_name"),
    email: nullableString(record, "email"),
    phone: nullableString(record, "phone"),
    specialty: nullableString(record, "specialty"),
    city: nullableString(record, "city"),
    province: nullableString(record, "province"),
    medical_aid_supported: requiredBoolean(record, "medical_aid_supported"),
    acquisition_source: nullableString(record, "acquisition_source"),
    acquisition_status: requiredString(record, "acquisition_status"),
    onboarding_date: nullableDate(record, "onboarding_date"),
    probation_start_date: nullableDate(record, "probation_start_date"),
    probation_end_date: nullableDate(record, "probation_end_date"),
    first_1000_campaign: requiredBoolean(record, "first_1000_campaign"),
    active: requiredBoolean(record, "active"),
    notes: nullableString(record, "notes"),
    created_at: normalizeTimestamp(record, "created_at"),
    updated_at: normalizeTimestamp(record, "updated_at"),
  };
}

function parseEmployee(row: unknown): AcquisitionEmployee {
  const record = asRecord(row);
  return {
    id: requiredUuid(record, "id"),
    first_name: requiredString(record, "first_name"),
    last_name: requiredString(record, "last_name"),
    email: nullableString(record, "email"),
    department_id: nullableUuid(record, "department_id"),
    job_title: nullableString(record, "job_title"),
    employee_status: requiredString(record, "employee_status"),
  };
}

function parseDepartment(row: unknown): AcquisitionDepartment {
  const record = asRecord(row);
  return {
    id: requiredUuid(record, "id"),
    code: requiredString(record, "code"),
    name: requiredString(record, "name"),
    active: requiredBoolean(record, "active"),
    department_group: requiredString(record, "department_group"),
  };
}

function parseTask(row: unknown): AcquisitionTask {
  const record = asRecord(row);
  return {
    id: requiredUuid(record, "id"),
    organization_id: nullableUuid(record, "organization_id"),
    department_id: nullableUuid(record, "department_id"),
    assigned_to: nullableUuid(record, "assigned_to"),
    created_by: nullableUuid(record, "created_by"),
    kpi_id: nullableUuid(record, "kpi_id"),
    title: requiredString(record, "title"),
    description: nullableString(record, "description"),
    priority: requiredString(record, "priority"),
    status: requiredString(record, "status"),
    progress_percentage: nullableNumber(record, "progress_percentage"),
    due_date: nullableDateOrTimestamp(record, "due_date"),
    completed_at: nullableTimestamp(record, "completed_at"),
    created_at: normalizeTimestamp(record, "created_at"),
    updated_at: normalizeTimestamp(record, "updated_at"),
  };
}

function parseTicket(row: unknown): AcquisitionTicket {
  const record = asRecord(row);
  return {
    id: requiredUuid(record, "id"),
    organization_id: nullableUuid(record, "organization_id"),
    department_id: nullableUuid(record, "department_id"),
    reported_by: nullableUuid(record, "reported_by"),
    assigned_to: nullableUuid(record, "assigned_to"),
    kpi_id: nullableUuid(record, "kpi_id"),
    ticket_number: nullableNumber(record, "ticket_number"),
    title: requiredString(record, "title"),
    description: nullableString(record, "description"),
    category: nullableString(record, "category"),
    priority: requiredString(record, "priority"),
    status: requiredString(record, "status"),
    due_date: nullableDateOrTimestamp(record, "due_date"),
    resolved_at: nullableTimestamp(record, "resolved_at"),
    created_at: normalizeTimestamp(record, "created_at"),
    updated_at: normalizeTimestamp(record, "updated_at"),
  };
}

function parseKpi(row: unknown): AcquisitionKpi {
  const record = asRecord(row);
  return {
    id: requiredUuid(record, "id"),
    organization_id: nullableUuid(record, "organization_id"),
    department_id: nullableUuid(record, "department_id"),
    owner_employee_id: nullableUuid(record, "owner_employee_id"),
    name: requiredString(record, "name"),
    code: requiredString(record, "code"),
    description: nullableString(record, "description"),
    category: nullableString(record, "category"),
    measurement_type: requiredString(record, "measurement_type"),
    direction: requiredString(record, "direction"),
    unit: nullableString(record, "unit"),
    active: requiredBoolean(record, "active"),
  };
}

function parseKpiPeriod(row: unknown): AcquisitionKpiPeriod {
  const record = asRecord(row);
  return {
    id: requiredUuid(record, "id"),
    organization_id: nullableUuid(record, "organization_id"),
    period_type: requiredString(record, "period_type"),
    period_name: requiredString(record, "period_name"),
    start_date: requiredDate(record, "start_date"),
    end_date: requiredDate(record, "end_date"),
    status: requiredString(record, "status"),
  };
}

function parseKpiTarget(row: unknown): AcquisitionKpiTarget {
  const record = asRecord(row);
  return {
    id: requiredUuid(record, "id"),
    kpi_id: requiredUuid(record, "kpi_id"),
    employee_id: nullableUuid(record, "employee_id"),
    department_id: nullableUuid(record, "department_id"),
    period_id: requiredUuid(record, "period_id"),
    target_value: nullableNumber(record, "target_value"),
    green_threshold: nullableNumber(record, "green_threshold"),
    yellow_threshold: nullableNumber(record, "yellow_threshold"),
    critical_threshold: nullableNumber(record, "critical_threshold"),
    notes: nullableString(record, "notes"),
  };
}

function parseKpiResult(row: unknown): AcquisitionKpiResult {
  const record = asRecord(row);
  return {
    id: requiredUuid(record, "id"),
    kpi_id: requiredUuid(record, "kpi_id"),
    target_id: nullableUuid(record, "target_id"),
    employee_id: nullableUuid(record, "employee_id"),
    department_id: nullableUuid(record, "department_id"),
    period_id: requiredUuid(record, "period_id"),
    actual_value: nullableNumber(record, "actual_value"),
    calculated_percentage: nullableNumber(record, "calculated_percentage"),
    status: requiredString(record, "status"),
    commentary: nullableString(record, "commentary"),
  };
}

function parseAlert(row: unknown): AcquisitionAlert {
  const record = asRecord(row);
  return {
    id: requiredUuid(record, "id"),
    organization_id: requiredUuid(record, "organization_id"),
    alert_type: requiredString(record, "alert_type"),
    title: requiredString(record, "title"),
    message: requiredString(record, "message"),
    severity: requiredString(record, "severity"),
    source_type: nullableString(record, "source_type"),
    source_id: nullableString(record, "source_id"),
    status: requiredString(record, "status"),
    starts_at: normalizeTimestamp(record, "starts_at"),
    expires_at: nullableTimestamp(record, "expires_at"),
    acknowledged_at: nullableTimestamp(record, "acknowledged_at"),
    acknowledged_by: nullableString(record, "acknowledged_by"),
    resolved_at: nullableTimestamp(record, "resolved_at"),
    resolved_by: nullableString(record, "resolved_by"),
    created_at: normalizeTimestamp(record, "created_at"),
    updated_at: normalizeTimestamp(record, "updated_at"),
  };
}

function parseContactAttempt(row: unknown): AcquisitionContactAttempt {
  const record = asRecord(row);
  return {
    id: requiredUuid(record, "id"),
    doctor_id: requiredUuid(record, "doctor_id"),
    ambassador_id: nullableUuid(record, "ambassador_id"),
    employee_id: nullableUuid(record, "employee_id"),
    contact_channel: requiredString(record, "contact_channel"),
    outcome: requiredString(record, "outcome"),
    contacted_at: normalizeTimestamp(record, "contacted_at"),
    next_followup_at: nullableTimestamp(record, "next_followup_at"),
    notes: nullableString(record, "notes"),
  };
}

function parseAmbassador(row: unknown): AcquisitionAmbassador {
  const record = asRecord(row);
  return {
    id: requiredUuid(record, "id"),
    first_name: requiredString(record, "first_name"),
    last_name: requiredString(record, "last_name"),
    email: nullableString(record, "email"),
    phone: nullableString(record, "phone"),
    status: requiredString(record, "status"),
    current_tier: nullableString(record, "current_tier"),
  };
}

function parseAmbassadorReferral(row: unknown): AcquisitionReferral {
  const record = asRecord(row);
  return {
    id: requiredUuid(record, "id"),
    ambassador_id: requiredUuid(record, "ambassador_id"),
    doctor_id: requiredUuid(record, "doctor_id"),
    referral_date: requiredDate(record, "referral_date"),
    probation_status: requiredString(record, "probation_status"),
  };
}

function normalizeRows<T>(
  value: unknown,
  parser: (row: unknown) => T,
  label: string,
): T[] {
  if (!Array.isArray(value)) throw new Error(`The ${label} response is invalid.`);
  try {
    return value.map(parser);
  } catch {
    throw new Error(`The ${label} response contains malformed records.`);
  }
}

async function selectRows(
  table: string,
  selection: string,
  organizationId?: string,
  filters: RelationshipFilter[] = [],
): Promise<unknown> {
  if (filters.length && filters.every(({ values }) => values.length === 0)) {
    return [];
  }

  let query = getSupabaseClient().from(table).select(selection);
  if (organizationId) query = query.eq("organization_id", organizationId);
  for (const { column, values } of filters) {
    if (values.length) query = query.in(column, values);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function selectRelatedRows(
  table: string,
  selection: string,
  filters: RelationshipFilter[],
): Promise<unknown> {
  return selectRows(table, selection, undefined, filters);
}

async function selectByAnyRelationship(
  table: string,
  selection: string,
  organizationId: string,
  filters: RelationshipFilter[],
): Promise<unknown> {
  const activeFilters = filters.filter(({ values }) => values.length > 0);
  if (!activeFilters.length) return [];
  const responses = await Promise.all(
    activeFilters.map(({ column, values }) =>
      selectRows(table, selection, organizationId, [{ column, values }]),
    ),
  );
  return responses.flatMap((response) =>
    Array.isArray(response) ? response : [],
  );
}

function uniqueById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

function parseOptionalRows<T extends { id: string }>(
  result: PromiseSettledResult<unknown>,
  parser: (row: unknown) => T,
  label: string,
): { rows: T[]; error: string | null } {
  if (result.status === "rejected") {
    return { rows: [], error: `${label} data is unavailable.` };
  }
  try {
    return {
      rows: uniqueById(normalizeRows(result.value, parser, label)),
      error: null,
    };
  } catch {
    return { rows: [], error: `${label} data contains malformed records.` };
  }
}

function normaliseStatus(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/[_-]+/g, " ") ?? "";
}

function isResolvedStatus(value: string | null | undefined) {
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
  ].includes(normaliseStatus(value));
}

function isActiveAlert(alert: AcquisitionAlert, now = new Date()) {
  if (alert.resolved_at || isResolvedStatus(alert.status)) return false;
  const startsAt = new Date(alert.starts_at);
  const expiresAt = alert.expires_at ? new Date(alert.expires_at) : null;
  if (!Number.isNaN(startsAt.valueOf()) && startsAt > now) return false;
  if (expiresAt && !Number.isNaN(expiresAt.valueOf()) && expiresAt <= now) return false;
  return true;
}

async function fetchDoctorAcquisitionDashboard(
  organizationId: string,
): Promise<DoctorAcquisitionDashboardData> {
  const [acquisitionRows, doctorRows, employeeRows, departmentRows] =
    await Promise.all([
      selectRelatedRows("doctor_acquisition", columns.doctorAcquisition, []),
      selectRows("doctors", columns.doctors, organizationId),
      selectRows("employees", columns.employees, organizationId, [
        { column: "employee_status", values: ["active"] },
      ]),
      selectRows("departments", columns.departments, organizationId),
    ]);

  const acquisitions = normalizeRows(
    acquisitionRows,
    parseDoctorAcquisition,
    "doctor acquisition",
  );
  const doctors = normalizeRows(doctorRows, parseDoctor, "doctor");
  const employees = normalizeRows(employeeRows, parseEmployee, "employee");
  const departments = normalizeRows(
    departmentRows,
    parseDepartment,
    "department",
  );

  const doctorById = new Map(doctors.map((doctor) => [doctor.id, doctor]));
  const employeeById = new Map(
    employees.map((employee) => [employee.id, employee]),
  );
  const departmentById = new Map(
    departments.map((department) => [department.id, department]),
  );
  const records = acquisitions.map((acquisition) => ({
    ...acquisition,
    doctor: doctorById.get(acquisition.doctor_id) ?? null,
    owner: acquisition.owner_employee_id
      ? employeeById.get(acquisition.owner_employee_id) ?? null
      : null,
    department: acquisition.department_id
      ? departmentById.get(acquisition.department_id) ?? null
      : null,
  }));

  const departmentIds = [
    ...new Set(
      records
        .map((record) => record.department_id)
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const ownerIds = [
    ...new Set(
      records
        .map((record) => record.owner_employee_id)
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const doctorIds = [
    ...new Set(records.map((record) => record.doctor_id)),
  ];
  const [
    kpiResult,
    periodResult,
    taskResult,
    ticketResult,
    alertResult,
    contactResult,
    ambassadorResult,
    referralResult,
  ] = await Promise.allSettled([
    selectRows("kpis", columns.kpis, organizationId),
    selectRows("kpi_periods", columns.kpiPeriods, organizationId),
    selectByAnyRelationship(
      "tasks",
      columns.tasks,
      organizationId,
      [
        { column: "department_id", values: departmentIds },
        { column: "assigned_to", values: ownerIds },
      ],
    ),
    selectByAnyRelationship(
      "tickets",
      columns.tickets,
      organizationId,
      [
        { column: "department_id", values: departmentIds },
        { column: "assigned_to", values: ownerIds },
      ],
    ),
    selectRows("company_alerts", columns.companyAlerts, organizationId),
    selectRelatedRows("doctor_contact_attempts", columns.contactAttempts, [
      { column: "doctor_id", values: doctorIds },
    ]),
    selectRows("ambassadors", columns.ambassadors),
    selectRelatedRows("ambassador_referrals", columns.ambassadorReferrals, [
      { column: "doctor_id", values: doctorIds },
    ]),
  ]);

  const kpis = parseOptionalRows(kpiResult, parseKpi, "KPI");
  const periods = parseOptionalRows(periodResult, parseKpiPeriod, "KPI period");
  const tasks = parseOptionalRows(taskResult, parseTask, "task");
  const tickets = parseOptionalRows(ticketResult, parseTicket, "ticket");
  const alerts = parseOptionalRows(alertResult, parseAlert, "company alert");
  const contacts = parseOptionalRows(
    contactResult,
    parseContactAttempt,
    "doctor contact",
  );
  const ambassadors = parseOptionalRows(
    ambassadorResult,
    parseAmbassador,
    "ambassador",
  );
  const referrals = parseOptionalRows(
    referralResult,
    parseAmbassadorReferral,
    "ambassador referral",
  );
  const optionalErrors = [
    kpis.error,
    periods.error,
    tasks.error,
    tickets.error,
    alerts.error,
    contacts.error,
    ambassadors.error,
    referrals.error,
  ].filter((value): value is string => Boolean(value));

  const ambassadorById = new Map(
    ambassadors.rows.map((ambassador) => [ambassador.id, ambassador]),
  );
  const referralByDoctorId = new Map<string, AcquisitionReferral>();
  for (const referral of referrals.rows) {
    if (!referralByDoctorId.has(referral.doctor_id)) {
      referralByDoctorId.set(referral.doctor_id, referral);
    }
  }
  const contactsByDoctorId = new Map<string, AcquisitionContactAttempt[]>();
  for (const contact of contacts.rows) {
    const existing = contactsByDoctorId.get(contact.doctor_id);
    if (existing) existing.push(contact);
    else contactsByDoctorId.set(contact.doctor_id, [contact]);
  }

  const enrichedRecords = records.map((record) => {
    const doctorContacts = contactsByDoctorId.get(record.doctor_id) ?? [];
    const sortedContacts = [...doctorContacts].sort(
      (a, b) => new Date(b.contacted_at).valueOf() - new Date(a.contacted_at).valueOf(),
    );
    const referral = referralByDoctorId.get(record.doctor_id) ?? null;
    return {
      ...record,
      ambassador: referral ? ambassadorById.get(referral.ambassador_id) ?? null : null,
      referralId: referral?.id ?? null,
      contactCount: doctorContacts.length,
      lastContactAt: sortedContacts[0]?.contacted_at ?? null,
      lastContactNote: sortedContacts[0]?.notes ?? null,
    };
  });

  let kpiTargets: AcquisitionKpiTarget[] = [];
  let kpiResults: AcquisitionKpiResult[] = [];
  if (kpis.rows.length && periods.rows.length && !kpis.error && !periods.error) {
    const [targetResult, resultResult] = await Promise.allSettled([
      selectRelatedRows("kpi_targets", columns.kpiTargets, [
        { column: "kpi_id", values: kpis.rows.map((kpi) => kpi.id) },
        { column: "period_id", values: periods.rows.map((period) => period.id) },
      ]),
      selectRelatedRows("kpi_results", columns.kpiResults, [
        { column: "kpi_id", values: kpis.rows.map((kpi) => kpi.id) },
        { column: "period_id", values: periods.rows.map((period) => period.id) },
      ]),
    ]);
    const targets = parseOptionalRows(
      targetResult,
      parseKpiTarget,
      "KPI target",
    );
    const results = parseOptionalRows(
      resultResult,
      parseKpiResult,
      "KPI result",
    );
    kpiTargets = targets.rows;
    kpiResults = results.rows;
    if (targets.error) optionalErrors.push(targets.error);
    if (results.error) optionalErrors.push(results.error);
  }

  return {
    acquisitions: enrichedRecords,
    doctors,
    employees,
    departments,
    tasks: tasks.rows,
    tickets: tickets.rows,
    kpis: kpis.rows,
    kpiPeriods: periods.rows,
    kpiTargets,
    kpiResults,
    alerts: alerts.rows.filter((alert) => isActiveAlert(alert)),
    ambassadors: ambassadors.rows,
    contactAttempts: contacts.rows,
    optionalErrors: [...new Set(optionalErrors)],
  };
}

export function useDoctorAcquisitionDashboard(): QueryState {
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
    queryKey: [
      "doctor-acquisition-dashboard",
      user?.id ?? null,
      organizationId,
      employeeState.employee?.id ?? null,
    ],
    enabled,
    queryFn: () => fetchDoctorAcquisitionDashboard(organizationId!),
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
          ? new Error("The doctor acquisition data could not be loaded.")
          : null,
  };
}

export type AcquisitionSummary = {
  recordCount: number;
  prospectsCount: number;
  contactedCount: number;
  enrolledCount: number;
  convertedCount: number;
  lostCount: number;
  eligibleRecordCount: number;
  contactRate: number | null;
  enrollmentRate: number | null;
  conversionRate: number | null;
  lostRate: number | null;
};

export type AcquisitionBreakdown = {
  label: string;
  count: number;
};

export type AcquisitionChannelSummary = AcquisitionSummary & {
  label: string;
};

export type AcquisitionOwnerWorkload = AcquisitionSummary & {
  id: string | null;
  name: string;
  jobTitle: string | null;
  count: number;
  statuses: AcquisitionBreakdown[];
};

export type AcquisitionOperationalSummary = {
  relatedTaskCount: number;
  openTaskCount: number;
  overdueTaskCount: number;
  relatedTicketCount: number;
  openTicketCount: number;
  overdueTicketCount: number;
};

export type AcquisitionKpiInformation = {
  kpi: AcquisitionKpi;
  period: AcquisitionKpiPeriod | null;
  target: AcquisitionKpiTarget | null;
  result: AcquisitionKpiResult | null;
};

export type AcquisitionTimelineItem = {
  id: string;
  recordId: string;
  doctorName: string;
  event: string;
  occurredAt: string;
  status: string;
};

export type DoctorAcquisitionMetrics = AcquisitionSummary & {
  uniqueDoctorCount: number;
  statuses: AcquisitionBreakdown[];
  channels: AcquisitionChannelSummary[];
  sourceDetails: AcquisitionBreakdown[];
  ownerWorkload: AcquisitionOwnerWorkload[];
  first1000DoctorCount: number;
  first1000ActiveDoctorCount: number;
  first1000AcquisitionCount: number;
  first1000EnrolledCount: number;
  first1000ConvertedCount: number;
  nonFirst1000DoctorCount: number;
};

function displayValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || "Unknown / Unspecified";
}

function countBy(values: string[]): AcquisitionBreakdown[] {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort(
      (left, right) =>
        right.count - left.count || left.label.localeCompare(right.label),
    );
}

function statusCounts(records: DoctorAcquisitionRecord[]) {
  return countBy(records.map((record) => displayValue(record.status)));
}

function rate(numerator: number, denominator: number) {
  return denominator > 0 ? (numerator / denominator) * 100 : null;
}

function summarizeRecords(records: DoctorAcquisitionRecord[]): AcquisitionSummary {
  const prospectsCount = records.filter(
    (record) => normaliseStatus(record.status) === "prospect",
  ).length;
  const contactedCount = records.filter((record) => record.contacted_at !== null).length;
  const enrolledCount = records.filter((record) => record.enrolled_at !== null).length;
  const convertedCount = records.filter((record) => record.converted_at !== null).length;
  const lostCount = records.filter((record) => record.lost_at !== null).length;
  const eligibleRecordCount = records.length;
  return {
    recordCount: records.length,
    prospectsCount,
    contactedCount,
    enrolledCount,
    convertedCount,
    lostCount,
    eligibleRecordCount,
    contactRate: rate(contactedCount, eligibleRecordCount),
    enrollmentRate: rate(enrolledCount, eligibleRecordCount),
    conversionRate: rate(convertedCount, eligibleRecordCount),
    lostRate: rate(lostCount, eligibleRecordCount),
  };
}

function channelSummaries(records: DoctorAcquisitionRecord[]) {
  const groups = new Map<string, DoctorAcquisitionRecord[]>();
  records.forEach((record) => {
    const label = displayValue(record.acquisition_channel);
    const group = groups.get(label) ?? [];
    group.push(record);
    groups.set(label, group);
  });
  return [...groups.entries()]
    .map(([label, group]) => ({ label, ...summarizeRecords(group) }))
    .sort(
      (left, right) =>
        right.recordCount - left.recordCount || left.label.localeCompare(right.label),
    );
}

export function buildDoctorAcquisitionMetrics(
  data: DoctorAcquisitionDashboardData | undefined,
): DoctorAcquisitionMetrics {
  const records = data?.acquisitions ?? [];
  const doctors = data?.doctors ?? [];
  const summary = summarizeRecords(records);
  const doctorIds = new Set(records.map((record) => record.doctor_id));
  const campaignDoctors = doctors.filter((doctor) => doctor.first_1000_campaign);
  const campaignRecords = records.filter(
    (record) => record.doctor?.first_1000_campaign,
  );
  const ownerGroups = new Map<string, DoctorAcquisitionRecord[]>();
  records.forEach((record) => {
    const key = record.owner_employee_id ?? "__unassigned__";
    const group = ownerGroups.get(key) ?? [];
    group.push(record);
    ownerGroups.set(key, group);
  });
  const ownerWorkload = [...ownerGroups.entries()]
    .map(([id, ownerRecords]) => {
      const owner = ownerRecords[0]?.owner;
      const ownerSummary = summarizeRecords(ownerRecords);
      return {
        ...ownerSummary,
        id: id === "__unassigned__" ? null : id,
        name: owner
          ? `${owner.first_name} ${owner.last_name}`.trim()
          : id === "__unassigned__"
            ? "Unassigned"
            : "Owner not available",
        jobTitle: owner?.job_title ?? null,
        count: ownerRecords.length,
        statuses: statusCounts(ownerRecords),
      };
    })
    .sort(
      (left, right) =>
        right.count - left.count || left.name.localeCompare(right.name),
    );

  return {
    ...summary,
    uniqueDoctorCount: doctorIds.size,
    statuses: statusCounts(records),
    channels: channelSummaries(records),
    sourceDetails: countBy(
      records.map((record) => displayValue(record.source_detail)),
    ),
    ownerWorkload,
    first1000DoctorCount: campaignDoctors.length,
    first1000ActiveDoctorCount: campaignDoctors.filter((doctor) => doctor.active)
      .length,
    first1000AcquisitionCount: campaignRecords.length,
    first1000EnrolledCount: campaignRecords.filter(
      (record) => record.enrolled_at !== null,
    ).length,
    first1000ConvertedCount: campaignRecords.filter(
      (record) => record.converted_at !== null,
    ).length,
    nonFirst1000DoctorCount: Math.max(
      doctors.length - campaignDoctors.length,
      0,
    ),
  };
}

function isPastDue(value: string | null, status: string) {
  if (!value || isResolvedStatus(status)) return false;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T23:59:59`)
    : new Date(value);
  return !Number.isNaN(date.valueOf()) && date < new Date();
}

export function buildAcquisitionOperationalSummary(
  data: DoctorAcquisitionDashboardData | undefined,
): AcquisitionOperationalSummary {
  const tasks = data?.tasks ?? [];
  const tickets = data?.tickets ?? [];
  return {
    relatedTaskCount: tasks.length,
    openTaskCount: tasks.filter((task) => !isResolvedStatus(task.status)).length,
    overdueTaskCount: tasks.filter((task) => isPastDue(task.due_date, task.status))
      .length,
    relatedTicketCount: tickets.length,
    openTicketCount: tickets.filter((ticket) => !isResolvedStatus(ticket.status))
      .length,
    overdueTicketCount: tickets.filter((ticket) =>
      isPastDue(ticket.due_date, ticket.status),
    ).length,
  };
}

function periodIsCurrent(period: AcquisitionKpiPeriod, now = new Date()) {
  const currentDate = now.toISOString().slice(0, 10);
  return (
    ["current", "active", "open"].includes(normaliseStatus(period.status)) &&
    currentDate >= period.start_date &&
    currentDate <= period.end_date
  );
}

function selectKpiPeriod(periods: AcquisitionKpiPeriod[]) {
  return (
    periods.find((period) => periodIsCurrent(period)) ??
    [...periods].sort((left, right) =>
      right.start_date.localeCompare(left.start_date),
    )[0] ??
    null
  );
}

export function buildAcquisitionKpiInformation(
  data: DoctorAcquisitionDashboardData | undefined,
): AcquisitionKpiInformation[] {
  const kpis = data?.kpis ?? [];
  const period = selectKpiPeriod(data?.kpiPeriods ?? []);
  return kpis.map((kpi) => ({
    kpi,
    period,
    target: period
      ? data?.kpiTargets.find(
          (target) => target.kpi_id === kpi.id && target.period_id === period.id,
        ) ?? null
      : null,
    result: period
      ? data?.kpiResults.find(
          (result) => result.kpi_id === kpi.id && result.period_id === period.id,
        ) ?? null
      : null,
  }));
}

export function buildAcquisitionTimeline(
  records: DoctorAcquisitionRecord[],
): AcquisitionTimelineItem[] {
  const items: AcquisitionTimelineItem[] = [];
  records.forEach((record) => {
    const doctorName = displayDoctorName(record.doctor);
    const events: Array<[string, string | null]> = [
      ["Record created", record.created_at],
      ["Contact recorded", record.contacted_at],
      ["Enrollment recorded", record.enrolled_at],
      ["Conversion recorded", record.converted_at],
      ["Loss recorded", record.lost_at],
      ["Record updated", record.updated_at],
    ];
    events.forEach(([event, occurredAt], index) => {
      if (!occurredAt) return;
      items.push({
        id: `${record.id}-${index}-${occurredAt}`,
        recordId: record.id,
        doctorName,
        event,
        occurredAt,
        status: record.status,
      });
    });
  });
  return items.sort(
    (left, right) => right.occurredAt.localeCompare(left.occurredAt),
  );
}

export function displayDoctorName(doctor: DoctorProfile | null) {
  if (!doctor) return "Doctor details unavailable";
  return `${doctor.first_name} ${doctor.last_name}`.trim();
}

export function displayEmployeeName(employee: AcquisitionEmployee | null) {
  if (!employee) return "Owner not available";
  return `${employee.first_name} ${employee.last_name}`.trim();
}

export function sortRecentAcquisitions(records: DoctorAcquisitionRecord[]) {
  return [...records].sort((left, right) =>
    right.created_at.localeCompare(left.created_at),
  );
}

export function formatAcquisitionValue(value: number | null, unit: string | null) {
  if (value === null) return "Value unavailable";
  return `${value}${unit ? ` ${unit}` : ""}`;
}
