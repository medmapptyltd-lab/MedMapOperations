import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "./supabase";
import { useSupabaseAuth } from "./supabase-auth";
import { useCurrentEmployee, useCurrentOrganisation } from "./supabase-identity";

export type Ambassador = {
  id: string;
  employee_id: string | null;
  cohort_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  active_referred_doctors: number;
  current_tier: string | null;
  created_at: string;
  updated_at: string;
};

export type AmbassadorCohort = {
  id: string;
  name: string;
  cohort_month: string;
  target_ambassadors: number;
  target_doctors: number;
  probation_booking_target: number;
  post_probation_booking_target: number;
  status: string;
  created_at: string;
};

export type AmbassadorReferral = {
  id: string;
  ambassador_id: string;
  doctor_id: string;
  cohort_id: string | null;
  referral_date: string;
  probation_start_date: string | null;
  probation_end_date: string | null;
  probation_status: string;
  probation_booking_target: number;
  post_probation_booking_target: number;
};

export type AmbassadorActivity = {
  id: string;
  organization_id: string;
  ambassador_id: string;
  cohort_id: string | null;
  activity_type: string;
  activity_date: string;
  doctor_id: string | null;
  outcome: string | null;
  notes: string | null;
  created_at: string;
};

export type AmbassadorTier = {
  id: string;
  name: string;
  minimum_active_doctors: number;
  maximum_active_doctors: number | null;
  commission_percentage: number;
  active: boolean;
  created_at: string;
};

export type AmbassadorCommissionPeriod = {
  id: string;
  organization_id: string;
  ambassador_id: string;
  performance_period_id: string;
  tier_id: string | null;
  active_referred_doctors: number;
  commission_percentage: number;
  eligible_revenue: number;
  commission_amount: number;
  status: string;
  calculated_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AmbassadorCommission = {
  id: string;
  ambassador_id: string;
  ambassador_tier_id: string | null;
  revenue_id: string | null;
  commission_period: string;
  revenue_amount: number;
  commission_percentage: number;
  commission_amount: number;
  status: string;
  created_at: string;
};

export type AmbassadorPerformance = {
  id: string;
  organization_id: string;
  ambassador_id: string;
  cohort_id: string | null;
  performance_period_id: string;
  active_referred_doctors: number;
  total_referred_doctors: number;
  probation_doctors: number;
  probation_green_doctors: number;
  probation_yellow_doctors: number;
  probation_critical_doctors: number;
  total_bookings: number;
  probation_bookings: number;
  post_probation_bookings: number;
  qualifying_booking_target: number;
  post_probation_booking_target: number;
  tier_id: string | null;
  tier_percentage: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AmbassadorPerformancePeriod = {
  id: string;
  organization_id: string;
  period_start: string;
  period_end: string;
  period_name: string;
  status: string;
  created_at: string;
};

export type AmbassadorProbationReview = {
  id: string;
  organization_id: string;
  ambassador_id: string;
  doctor_id: string;
  cohort_id: string | null;
  review_period_id: string | null;
  probation_start_date: string | null;
  probation_end_date: string | null;
  booking_count: number;
  target_bookings: number;
  status: string;
  outcome: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AmbassadorBooking = {
  id: string;
  patient_id: string;
  doctor_id: string;
  patient_membership_id: string | null;
  ambassador_referral_id: string | null;
  booking_date: string;
  status: string;
  booking_type: string;
  gross_amount: number;
  cancellation_fee: number;
  net_amount: number;
  account_credit_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AmbassadorDoctor = {
  id: string;
  organization_id: string | null;
  first_name: string;
  last_name: string;
  practice_name: string | null;
  email: string | null;
  specialty: string | null;
  city: string | null;
  province: string | null;
  first_1000_campaign: boolean;
  active: boolean;
};

export type AmbassadorRecord = Ambassador & {
  cohort: AmbassadorCohort | null;
};

export type AmbassadorReferralRecord = AmbassadorReferral & {
  ambassador: Ambassador | null;
  cohort: AmbassadorCohort | null;
  doctor: AmbassadorDoctor | null;
  bookingCount: number;
  review: AmbassadorProbationReview | null;
};

export type AmbassadorPerformanceRecord = {
  ambassador: Ambassador;
  cohort: AmbassadorCohort | null;
  performance: AmbassadorPerformance | null;
  commissionPeriod: AmbassadorCommissionPeriod | null;
  tier: AmbassadorTier | null;
};

export type AmbassadorActivityRecord = AmbassadorActivity & {
  ambassador: Ambassador | null;
  doctor: AmbassadorDoctor | null;
};

export type AmbassadorDashboardData = {
  ambassadors: AmbassadorRecord[];
  cohorts: AmbassadorCohort[];
  referrals: AmbassadorReferralRecord[];
  activities: AmbassadorActivityRecord[];
  tiers: AmbassadorTier[];
  commissionPeriods: AmbassadorCommissionPeriod[];
  commissions: AmbassadorCommission[];
  performance: AmbassadorPerformance[];
  performancePeriods: AmbassadorPerformancePeriod[];
  probationReviews: AmbassadorProbationReview[];
  bookings: AmbassadorBooking[];
  doctors: AmbassadorDoctor[];
  currentPerformancePeriod: AmbassadorPerformancePeriod | null;
  optionalErrors: string[];
};

type QueryState = {
  data: AmbassadorDashboardData | undefined;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
};

type RawRecord = Record<string, unknown>;

type RowParser<T> = (value: unknown) => T;

const columns = {
  ambassadors:
    "id, employee_id, cohort_id, first_name, last_name, email, phone, status, start_date, end_date, active_referred_doctors, current_tier, created_at, updated_at",
  cohorts:
    "id, name, cohort_month, target_ambassadors, target_doctors, probation_booking_target, post_probation_booking_target, status, created_at",
  referrals:
    "id, ambassador_id, doctor_id, cohort_id, referral_date, probation_start_date, probation_end_date, probation_status, probation_booking_target, post_probation_booking_target",
  activities:
    "id, organization_id, ambassador_id, cohort_id, activity_type, activity_date, doctor_id, outcome, notes, created_at",
  tiers:
    "id, name, minimum_active_doctors, maximum_active_doctors, commission_percentage, active, created_at",
  commissionPeriods:
    "id, organization_id, ambassador_id, performance_period_id, tier_id, active_referred_doctors, commission_percentage, eligible_revenue, commission_amount, status, calculated_at, approved_at, paid_at, notes, created_at, updated_at",
  commissions:
    "id, ambassador_id, ambassador_tier_id, revenue_id, commission_period, revenue_amount, commission_percentage, commission_amount, status, created_at",
  performance:
    "id, organization_id, ambassador_id, cohort_id, performance_period_id, active_referred_doctors, total_referred_doctors, probation_doctors, probation_green_doctors, probation_yellow_doctors, probation_critical_doctors, total_bookings, probation_bookings, post_probation_bookings, qualifying_booking_target, post_probation_booking_target, tier_id, tier_percentage, notes, created_at, updated_at",
  performancePeriods:
    "id, organization_id, period_start, period_end, period_name, status, created_at",
  probationReviews:
    "id, organization_id, ambassador_id, doctor_id, cohort_id, review_period_id, probation_start_date, probation_end_date, booking_count, target_bookings, status, outcome, reviewed_by, reviewed_at, notes, created_at, updated_at",
  bookings:
    "id, patient_id, doctor_id, patient_membership_id, ambassador_referral_id, booking_date, status, booking_type, gross_amount, cancellation_fee, net_amount, account_credit_amount, notes, created_at, updated_at",
  doctors:
    "id, organization_id, first_name, last_name, practice_name, email, specialty, city, province, first_1000_campaign, active",
} as const;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function record(value: unknown): RawRecord {
  if (!isRecord(value)) throw new Error("The response row is not an object.");
  return value;
}

function requiredString(row: RawRecord, field: string): string {
  const value = row[field];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`The ${field} field is invalid.`);
  }
  return value;
}

function nullableString(row: RawRecord, field: string): string | null {
  const value = row[field];
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new Error(`The ${field} field is invalid.`);
  return value;
}

function requiredUuid(row: RawRecord, field: string): string {
  const value = requiredString(row, field);
  if (!uuidPattern.test(value)) throw new Error(`The ${field} field is invalid.`);
  return value;
}

function nullableUuid(row: RawRecord, field: string): string | null {
  const value = nullableString(row, field);
  if (value === null) return null;
  if (!uuidPattern.test(value)) throw new Error(`The ${field} field is invalid.`);
  return value;
}

function requiredNumber(row: RawRecord, field: string): number {
  const value = numericValue(row[field]);
  if (value === null) throw new Error(`The ${field} field is invalid.`);
  return value;
}

function nullableNumber(row: RawRecord, field: string): number | null {
  return numericValue(row[field]);
}

function numericValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  throw new Error("A numeric response field is invalid.");
}

function requiredDate(row: RawRecord, field: string): string {
  const value = nullableDate(row, field);
  if (value === null) throw new Error(`The ${field} field is invalid.`);
  return value;
}

function nullableDate(row: RawRecord, field: string): string | null {
  const value = nullableString(row, field);
  if (value === null) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`The ${field} field is invalid.`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`The ${field} field is invalid.`);
  }
  return value;
}

function requiredTimestamp(row: RawRecord, field: string): string {
  const value = nullableTimestamp(row, field);
  if (value === null) throw new Error(`The ${field} field is invalid.`);
  return value;
}

function nullableTimestamp(row: RawRecord, field: string): string | null {
  const value = nullableString(row, field);
  if (value === null) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) throw new Error(`The ${field} field is invalid.`);
  return date.toISOString();
}

function requiredInteger(row: RawRecord, field: string): number {
  const value = requiredNumber(row, field);
  if (!Number.isInteger(value)) throw new Error(`The ${field} field is invalid.`);
  return value;
}

function nullableInteger(row: RawRecord, field: string): number | null {
  const value = nullableNumber(row, field);
  if (value !== null && !Number.isInteger(value)) {
    throw new Error(`The ${field} field is invalid.`);
  }
  return value;
}

function requiredBoolean(row: RawRecord, field: string): boolean {
  const value = row[field];
  if (typeof value !== "boolean") throw new Error(`The ${field} field is invalid.`);
  return value;
}

function parseAmbassador(value: unknown): Ambassador {
  const row = record(value);
  return {
    id: requiredUuid(row, "id"),
    employee_id: nullableUuid(row, "employee_id"),
    cohort_id: nullableUuid(row, "cohort_id"),
    first_name: requiredString(row, "first_name"),
    last_name: requiredString(row, "last_name"),
    email: nullableString(row, "email"),
    phone: nullableString(row, "phone"),
    status: requiredString(row, "status"),
    start_date: nullableDate(row, "start_date"),
    end_date: nullableDate(row, "end_date"),
    active_referred_doctors: requiredInteger(row, "active_referred_doctors"),
    current_tier: nullableString(row, "current_tier"),
    created_at: requiredTimestamp(row, "created_at"),
    updated_at: requiredTimestamp(row, "updated_at"),
  };
}

function parseCohort(value: unknown): AmbassadorCohort {
  const row = record(value);
  return {
    id: requiredUuid(row, "id"),
    name: requiredString(row, "name"),
    cohort_month: requiredDate(row, "cohort_month"),
    target_ambassadors: requiredInteger(row, "target_ambassadors"),
    target_doctors: requiredInteger(row, "target_doctors"),
    probation_booking_target: requiredInteger(row, "probation_booking_target"),
    post_probation_booking_target: requiredInteger(
      row,
      "post_probation_booking_target",
    ),
    status: requiredString(row, "status"),
    created_at: requiredTimestamp(row, "created_at"),
  };
}

function parseReferral(value: unknown): AmbassadorReferral {
  const row = record(value);
  return {
    id: requiredUuid(row, "id"),
    ambassador_id: requiredUuid(row, "ambassador_id"),
    doctor_id: requiredUuid(row, "doctor_id"),
    cohort_id: nullableUuid(row, "cohort_id"),
    referral_date: requiredDate(row, "referral_date"),
    probation_start_date: nullableDate(row, "probation_start_date"),
    probation_end_date: nullableDate(row, "probation_end_date"),
    probation_status: requiredString(row, "probation_status"),
    probation_booking_target: requiredInteger(row, "probation_booking_target"),
    post_probation_booking_target: requiredInteger(
      row,
      "post_probation_booking_target",
    ),
  };
}

function parseActivity(value: unknown): AmbassadorActivity {
  const row = record(value);
  return {
    id: requiredUuid(row, "id"),
    organization_id: requiredUuid(row, "organization_id"),
    ambassador_id: requiredUuid(row, "ambassador_id"),
    cohort_id: nullableUuid(row, "cohort_id"),
    activity_type: requiredString(row, "activity_type"),
    activity_date: requiredTimestamp(row, "activity_date"),
    doctor_id: nullableUuid(row, "doctor_id"),
    outcome: nullableString(row, "outcome"),
    notes: nullableString(row, "notes"),
    created_at: requiredTimestamp(row, "created_at"),
  };
}

function parseTier(value: unknown): AmbassadorTier {
  const row = record(value);
  return {
    id: requiredUuid(row, "id"),
    name: requiredString(row, "name"),
    minimum_active_doctors: requiredInteger(row, "minimum_active_doctors"),
    maximum_active_doctors: nullableInteger(row, "maximum_active_doctors"),
    commission_percentage: requiredNumber(row, "commission_percentage"),
    active: requiredBoolean(row, "active"),
    created_at: requiredTimestamp(row, "created_at"),
  };
}

function parseCommissionPeriod(value: unknown): AmbassadorCommissionPeriod {
  const row = record(value);
  return {
    id: requiredUuid(row, "id"),
    organization_id: requiredUuid(row, "organization_id"),
    ambassador_id: requiredUuid(row, "ambassador_id"),
    performance_period_id: requiredUuid(row, "performance_period_id"),
    tier_id: nullableUuid(row, "tier_id"),
    active_referred_doctors: requiredInteger(row, "active_referred_doctors"),
    commission_percentage: requiredNumber(row, "commission_percentage"),
    eligible_revenue: requiredNumber(row, "eligible_revenue"),
    commission_amount: requiredNumber(row, "commission_amount"),
    status: requiredString(row, "status"),
    calculated_at: nullableTimestamp(row, "calculated_at"),
    approved_at: nullableTimestamp(row, "approved_at"),
    paid_at: nullableTimestamp(row, "paid_at"),
    notes: nullableString(row, "notes"),
    created_at: requiredTimestamp(row, "created_at"),
    updated_at: requiredTimestamp(row, "updated_at"),
  };
}

function parseCommission(value: unknown): AmbassadorCommission {
  const row = record(value);
  return {
    id: requiredUuid(row, "id"),
    ambassador_id: requiredUuid(row, "ambassador_id"),
    ambassador_tier_id: nullableUuid(row, "ambassador_tier_id"),
    revenue_id: nullableUuid(row, "revenue_id"),
    commission_period: requiredDate(row, "commission_period"),
    revenue_amount: requiredNumber(row, "revenue_amount"),
    commission_percentage: requiredNumber(row, "commission_percentage"),
    commission_amount: requiredNumber(row, "commission_amount"),
    status: requiredString(row, "status"),
    created_at: requiredTimestamp(row, "created_at"),
  };
}

function parsePerformance(value: unknown): AmbassadorPerformance {
  const row = record(value);
  return {
    id: requiredUuid(row, "id"),
    organization_id: requiredUuid(row, "organization_id"),
    ambassador_id: requiredUuid(row, "ambassador_id"),
    cohort_id: nullableUuid(row, "cohort_id"),
    performance_period_id: requiredUuid(row, "performance_period_id"),
    active_referred_doctors: requiredInteger(row, "active_referred_doctors"),
    total_referred_doctors: requiredInteger(row, "total_referred_doctors"),
    probation_doctors: requiredInteger(row, "probation_doctors"),
    probation_green_doctors: requiredInteger(row, "probation_green_doctors"),
    probation_yellow_doctors: requiredInteger(row, "probation_yellow_doctors"),
    probation_critical_doctors: requiredInteger(
      row,
      "probation_critical_doctors",
    ),
    total_bookings: requiredInteger(row, "total_bookings"),
    probation_bookings: requiredInteger(row, "probation_bookings"),
    post_probation_bookings: requiredInteger(row, "post_probation_bookings"),
    qualifying_booking_target: requiredInteger(row, "qualifying_booking_target"),
    post_probation_booking_target: requiredInteger(
      row,
      "post_probation_booking_target",
    ),
    tier_id: nullableUuid(row, "tier_id"),
    tier_percentage: nullableNumber(row, "tier_percentage"),
    notes: nullableString(row, "notes"),
    created_at: requiredTimestamp(row, "created_at"),
    updated_at: requiredTimestamp(row, "updated_at"),
  };
}

function parsePerformancePeriod(value: unknown): AmbassadorPerformancePeriod {
  const row = record(value);
  return {
    id: requiredUuid(row, "id"),
    organization_id: requiredUuid(row, "organization_id"),
    period_start: requiredDate(row, "period_start"),
    period_end: requiredDate(row, "period_end"),
    period_name: requiredString(row, "period_name"),
    status: requiredString(row, "status"),
    created_at: requiredTimestamp(row, "created_at"),
  };
}

function parseProbationReview(value: unknown): AmbassadorProbationReview {
  const row = record(value);
  return {
    id: requiredUuid(row, "id"),
    organization_id: requiredUuid(row, "organization_id"),
    ambassador_id: requiredUuid(row, "ambassador_id"),
    doctor_id: requiredUuid(row, "doctor_id"),
    cohort_id: nullableUuid(row, "cohort_id"),
    review_period_id: nullableUuid(row, "review_period_id"),
    probation_start_date: nullableDate(row, "probation_start_date"),
    probation_end_date: nullableDate(row, "probation_end_date"),
    booking_count: requiredInteger(row, "booking_count"),
    target_bookings: requiredInteger(row, "target_bookings"),
    status: requiredString(row, "status"),
    outcome: nullableString(row, "outcome"),
    reviewed_by: nullableUuid(row, "reviewed_by"),
    reviewed_at: nullableTimestamp(row, "reviewed_at"),
    notes: nullableString(row, "notes"),
    created_at: requiredTimestamp(row, "created_at"),
    updated_at: requiredTimestamp(row, "updated_at"),
  };
}

function parseBooking(value: unknown): AmbassadorBooking {
  const row = record(value);
  return {
    id: requiredUuid(row, "id"),
    patient_id: requiredUuid(row, "patient_id"),
    doctor_id: requiredUuid(row, "doctor_id"),
    patient_membership_id: nullableUuid(row, "patient_membership_id"),
    ambassador_referral_id: nullableUuid(row, "ambassador_referral_id"),
    booking_date: requiredTimestamp(row, "booking_date"),
    status: requiredString(row, "status"),
    booking_type: requiredString(row, "booking_type"),
    gross_amount: requiredNumber(row, "gross_amount"),
    cancellation_fee: requiredNumber(row, "cancellation_fee"),
    net_amount: requiredNumber(row, "net_amount"),
    account_credit_amount: requiredNumber(row, "account_credit_amount"),
    notes: nullableString(row, "notes"),
    created_at: requiredTimestamp(row, "created_at"),
    updated_at: requiredTimestamp(row, "updated_at"),
  };
}

function parseDoctor(value: unknown): AmbassadorDoctor {
  const row = record(value);
  return {
    id: requiredUuid(row, "id"),
    organization_id: nullableUuid(row, "organization_id"),
    first_name: requiredString(row, "first_name"),
    last_name: requiredString(row, "last_name"),
    practice_name: nullableString(row, "practice_name"),
    email: nullableString(row, "email"),
    specialty: nullableString(row, "specialty"),
    city: nullableString(row, "city"),
    province: nullableString(row, "province"),
    first_1000_campaign: requiredBoolean(row, "first_1000_campaign"),
    active: requiredBoolean(row, "active"),
  };
}

function normalizeRows<T>(value: unknown, parser: RowParser<T>, label: string): T[] {
  if (!Array.isArray(value)) throw new Error(`The ${label} response is invalid.`);
  try {
    return value.map(parser);
  } catch {
    throw new Error(`The ${label} response contains malformed records.`);
  }
}

function deduplicate<T extends { id: string }>(rows: T[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

async function selectRows(
  table: string,
  selection: string,
  organizationId?: string,
): Promise<unknown> {
  let query = getSupabaseClient().from(table).select(selection);
  if (organizationId) query = query.eq("organization_id", organizationId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

function parseSettled<T extends { id: string }>(
  result: PromiseSettledResult<unknown>,
  parser: RowParser<T>,
  label: string,
): { rows: T[]; error: string | null } {
  if (result.status === "rejected") {
    return { rows: [], error: `${label} data is unavailable.` };
  }
  try {
    return { rows: deduplicate(normalizeRows(result.value, parser, label)), error: null };
  } catch {
    return { rows: [], error: `${label} data contains malformed records.` };
  }
}

function requiredSettled<T>(
  result: PromiseSettledResult<unknown>,
  parser: RowParser<T>,
  label: string,
): T[] {
  if (result.status === "rejected") {
    throw new Error(`${label} data could not be loaded.`);
  }
  return normalizeRows(result.value, parser, label);
}

function normaliseStatus(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/[_-]+/g, " ") ?? "";
}

function isCurrentPeriod(period: AmbassadorPerformancePeriod, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const status = normaliseStatus(period.status);
  return (
    ["current", "active", "open"].includes(status) &&
    today >= period.period_start &&
    today <= period.period_end
  );
}

function selectCurrentPeriod(periods: AmbassadorPerformancePeriod[]) {
  return (
    periods.find((period) => isCurrentPeriod(period)) ??
    [...periods].sort((left, right) =>
      right.period_start.localeCompare(left.period_start),
    )[0] ??
    null
  );
}

function latestBy<T>(rows: T[], getKey: (row: T) => string, getDate: (row: T) => string) {
  const latest = new Map<string, T>();
  rows.forEach((row) => {
    const key = getKey(row);
    const current = latest.get(key);
    if (!current || getDate(row).localeCompare(getDate(current)) > 0) {
      latest.set(key, row);
    }
  });
  return latest;
}

async function fetchAmbassadorDashboard(
  organizationId: string,
): Promise<AmbassadorDashboardData> {
  const [
    ambassadorResult,
    cohortResult,
    referralResult,
    doctorResult,
    activityResult,
    tierResult,
    commissionPeriodResult,
    commissionResult,
    performanceResult,
    performancePeriodResult,
    reviewResult,
    bookingResult,
  ] = await Promise.allSettled([
    selectRows("ambassadors", columns.ambassadors),
    selectRows("ambassador_cohorts", columns.cohorts),
    selectRows("ambassador_referrals", columns.referrals),
    selectRows("doctors", columns.doctors, organizationId),
    selectRows("ambassador_activities", columns.activities, organizationId),
    selectRows("ambassador_tiers", columns.tiers),
    selectRows(
      "ambassador_commission_periods",
      columns.commissionPeriods,
      organizationId,
    ),
    selectRows("ambassador_commissions", columns.commissions),
    selectRows("ambassador_performance", columns.performance, organizationId),
    selectRows(
      "ambassador_performance_periods",
      columns.performancePeriods,
      organizationId,
    ),
    selectRows("ambassador_probation_reviews", columns.probationReviews, organizationId),
    selectRows("bookings", columns.bookings),
  ]);

  const ambassadors = requiredSettled(ambassadorResult, parseAmbassador, "ambassador");
  const cohortsResult = parseSettled(cohortResult, parseCohort, "ambassador cohort");
  const referrals = requiredSettled(referralResult, parseReferral, "ambassador referral");
  const doctorsResult = parseSettled(doctorResult, parseDoctor, "doctor");
  const doctors = doctorsResult.rows;

  const cohortUnavailable = cohortsResult.error || cohortsResult.rows.length === 0;
  if (process.env.NODE_ENV !== "production" && cohortUnavailable) {
    console.warn(
      "ambassador_cohorts: RLS enabled with no explicit policies and no organization_id column → returning default-deny empty (safe). Schema alteration not applied per FR10 gate.",
    );
  }
  const cohorts = cohortUnavailable ? [] : cohortsResult.rows;

  const activities = parseSettled(activityResult, parseActivity, "ambassador activity");
  const tiersResult = parseSettled(tierResult, parseTier, "ambassador tier");
  const tierUnavailable = tiersResult.error || tiersResult.rows.length === 0;
  if (process.env.NODE_ENV !== "production" && tierUnavailable) {
    console.warn(
      "ambassador_tiers: RLS enabled with no explicit policies and no organization_id column → returning default-deny empty (safe). Schema alteration not applied per FR10 gate.",
    );
  }
  const tiers = tierUnavailable ? { rows: [], error: tiersResult.error } : tiersResult;
  const commissionPeriods = parseSettled(
    commissionPeriodResult,
    parseCommissionPeriod,
    "ambassador commission period",
  );
  const commissions = parseSettled(
    commissionResult,
    parseCommission,
    "ambassador commission",
  );
  const performance = parseSettled(
    performanceResult,
    parsePerformance,
    "ambassador performance",
  );
  const performancePeriods = parseSettled(
    performancePeriodResult,
    parsePerformancePeriod,
    "ambassador performance period",
  );
  const probationReviews = parseSettled(
    reviewResult,
    parseProbationReview,
    "ambassador probation review",
  );
  const bookings = parseSettled(bookingResult, parseBooking, "booking");
  const optionalErrors = [
    doctorsResult.error,
    activities.error,
    tiers.error,
    commissionPeriods.error,
    commissions.error,
    performance.error,
    performancePeriods.error,
    probationReviews.error,
    bookings.error,
    cohortsResult.error,
    cohortUnavailable
      ? "Cohort reference data not currently available for this organisation. Schema change intentionally not applied per Phase 7 gate (no explicit authenticated-access requirement proven)."
      : null,
    tierUnavailable
      ? "Tiers reference data not currently available for this organisation. Schema change intentionally not applied per Phase 7 gate (no explicit authenticated-access requirement proven)."
      : null,
  ].filter((value): value is string => Boolean(value));

  const ambassadorById = new Map(ambassadors.map((ambassador) => [ambassador.id, ambassador]));
  const cohortById = new Map(cohorts.map((cohort) => [cohort.id, cohort]));
  const doctorById = new Map(doctors.map((doctor) => [doctor.id, doctor]));
  const bookingCounts = new Map<string, number>();
  bookings.rows.forEach((booking) => {
    if (booking.ambassador_referral_id) {
      bookingCounts.set(
        booking.ambassador_referral_id,
        (bookingCounts.get(booking.ambassador_referral_id) ?? 0) + 1,
      );
    }
  });
  const latestReviews = latestBy(
    probationReviews.rows,
    (review) => `${review.ambassador_id}:${review.doctor_id}`,
    (review) => review.updated_at,
  );
  const referralRecords = referrals.map((referral) => ({
    ...referral,
    ambassador: ambassadorById.get(referral.ambassador_id) ?? null,
    cohort: referral.cohort_id ? cohortById.get(referral.cohort_id) ?? null : null,
    doctor: doctorById.get(referral.doctor_id) ?? null,
    bookingCount: bookingCounts.get(referral.id) ?? 0,
    review: latestReviews.get(`${referral.ambassador_id}:${referral.doctor_id}`) ?? null,
  }));
  const ambassadorRecords = ambassadors.map((ambassador) => ({
    ...ambassador,
    cohort: ambassador.cohort_id
      ? cohortById.get(ambassador.cohort_id) ?? null
      : null,
  }));
  const currentPerformancePeriod = selectCurrentPeriod(performancePeriods.rows);
  const performanceForPeriod = currentPerformancePeriod
    ? performance.rows.filter(
        (row) => row.performance_period_id === currentPerformancePeriod.id,
      )
    : [];
  const commissionPeriodsForPeriod = currentPerformancePeriod
    ? commissionPeriods.rows.filter(
        (row) => row.performance_period_id === currentPerformancePeriod.id,
      )
    : [];
  const performanceByAmbassador = latestBy(
    performanceForPeriod,
    (row) => row.ambassador_id,
    (row) => row.updated_at,
  );
  const commissionPeriodByAmbassador = latestBy(
    commissionPeriodsForPeriod,
    (row) => row.ambassador_id,
    (row) => row.updated_at,
  );
  const tierById = new Map(tiers.rows.map((tier) => [tier.id, tier]));
  const performanceRecords = ambassadors.map((ambassador) => {
    const currentPerformance = performanceByAmbassador.get(ambassador.id) ?? null;
    const commissionPeriod = commissionPeriodByAmbassador.get(ambassador.id) ?? null;
    const tierId =
      commissionPeriod?.tier_id ?? currentPerformance?.tier_id ?? null;
    return {
      ambassador,
      cohort: ambassador.cohort_id
        ? cohortById.get(ambassador.cohort_id) ?? null
        : null,
      performance: currentPerformance,
      commissionPeriod,
      tier: tierId ? tierById.get(tierId) ?? null : null,
    };
  });
  const activityRecords = activities.rows
    .map((activity) => ({
      ...activity,
      ambassador: ambassadorById.get(activity.ambassador_id) ?? null,
      doctor: activity.doctor_id ? doctorById.get(activity.doctor_id) ?? null : null,
    }))
    .sort((left, right) => right.activity_date.localeCompare(left.activity_date));

  return {
    ambassadors: ambassadorRecords,
    cohorts,
    referrals: referralRecords,
    activities: activityRecords,
    tiers: tiers.rows,
    commissionPeriods: commissionPeriods.rows,
    commissions: commissions.rows,
    performance: performance.rows,
    performancePeriods: performancePeriods.rows,
    probationReviews: probationReviews.rows,
    bookings: bookings.rows,
    doctors,
    currentPerformancePeriod,
    optionalErrors: [...new Set(optionalErrors)],
  };
}

export function useAmbassadorDashboard(): QueryState {
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
      "ambassador-dashboard",
      user?.id ?? null,
      employeeState.employee?.id ?? null,
      organizationId,
    ],
    enabled,
    queryFn: () => fetchAmbassadorDashboard(organizationId!),
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
          ? new Error("The Ambassador Programme data could not be loaded.")
          : null,
  };
}

export type AmbassadorCohortSummary = AmbassadorCohort & {
  actualAmbassadors: number;
  actualDoctors: number;
  ambassadorProgress: number | null;
  doctorProgress: number | null;
};

export type AmbassadorProbationRecord = AmbassadorReferralRecord & {
  bookingCount: number;
  targetBookings: number;
  postProbationTarget: number | null;
  status: string;
  outcome: string | null;
  daysRemaining: number | null;
};

export type AmbassadorDashboardMetrics = {
  totalAmbassadors: number;
  activeAmbassadors: number;
  totalReferredDoctors: number;
  activeReferredDoctors: number | null;
  totalBookingsAttributed: number | null;
  probationDoctors: number | null;
  greenProbation: number | null;
  yellowProbation: number | null;
  criticalProbation: number | null;
  eligibleRevenue: number | null;
  commissionAmount: number | null;
  doctorsAtPostProbationTarget: number | null;
  first1000Acquired: number;
  ambassadorAttributedFirst1000: number;
  cohortSummaries: AmbassadorCohortSummary[];
  performanceRecords: AmbassadorPerformanceRecord[];
  probationRecords: AmbassadorProbationRecord[];
};

function isActiveAmbassador(status: string) {
  return ["active", "approved", "enrolled", "in progress"].includes(
    normaliseStatus(status),
  );
}

function progress(actual: number, target: number) {
  return target > 0 ? Math.min((actual / target) * 100, 100) : null;
}

function daysRemaining(endDate: string | null) {
  if (!endDate) return null;
  const end = new Date(`${endDate}T23:59:59Z`);
  if (Number.isNaN(end.valueOf())) return null;
  return Math.ceil((end.valueOf() - Date.now()) / 86_400_000);
}

function classifyProbation(bookingCount: number, target: number, status: string) {
  if (status.trim()) {
    const normalized = normaliseStatus(status);
    if (!["pending", "in progress", "active", "probation"].includes(normalized)) {
      return status;
    }
  }
  if (bookingCount >= target) return "Green";
  if (bookingCount >= Math.max(target - 5, 0)) return "Yellow";
  return "Critical";
}

export function buildAmbassadorMetrics(
  data: AmbassadorDashboardData | undefined,
): AmbassadorDashboardMetrics {
  const empty: AmbassadorDashboardMetrics = {
    totalAmbassadors: 0,
    activeAmbassadors: 0,
    totalReferredDoctors: 0,
    activeReferredDoctors: null,
    totalBookingsAttributed: null,
    probationDoctors: null,
    greenProbation: null,
    yellowProbation: null,
    criticalProbation: null,
    eligibleRevenue: null,
    commissionAmount: null,
    doctorsAtPostProbationTarget: null,
    first1000Acquired: 0,
    ambassadorAttributedFirst1000: 0,
    cohortSummaries: [],
    performanceRecords: [],
    probationRecords: [],
  };
  if (!data) return empty;

  const referrals = data.referrals;
  const performanceRecords = data.ambassadors.map((ambassador) => {
    const performance = data.performance
      .filter(
        (row) =>
          data.currentPerformancePeriod !== null &&
          row.ambassador_id === ambassador.id &&
          row.performance_period_id === data.currentPerformancePeriod.id,
      )
      .sort((left, right) => right.updated_at.localeCompare(left.updated_at))[0] ?? null;
    const commissionPeriod = data.commissionPeriods
      .filter(
        (row) =>
          data.currentPerformancePeriod !== null &&
          row.ambassador_id === ambassador.id &&
          row.performance_period_id === data.currentPerformancePeriod.id,
      )
      .sort((left, right) => right.updated_at.localeCompare(left.updated_at))[0] ?? null;
    const tierId = commissionPeriod?.tier_id ?? performance?.tier_id ?? null;
    return {
      ambassador,
      cohort: ambassador.cohort,
      performance,
      commissionPeriod,
      tier: tierId
        ? data.tiers.find((tier) => tier.id === tierId) ?? null
        : null,
    };
  });
  const probationRecords = referrals.map((referral) => {
    const review = referral.review;
    const targetBookings = review?.target_bookings ?? referral.probation_booking_target;
    return {
      ...referral,
      bookingCount: review?.booking_count ?? referral.bookingCount,
      targetBookings,
      postProbationTarget: referral.post_probation_booking_target,
      status: review
        ? review.status
        : classifyProbation(
            referral.bookingCount,
            targetBookings,
            referral.probation_status,
          ),
      outcome: review?.outcome ?? null,
      daysRemaining: daysRemaining(
        review?.probation_end_date ?? referral.probation_end_date,
      ),
    };
  });
  const performanceRows = performanceRecords
    .map((row) => row.performance)
    .filter((row): row is AmbassadorPerformance => row !== null);
  const commissionRows = performanceRecords
    .map((row) => row.commissionPeriod)
    .filter((row): row is AmbassadorCommissionPeriod => row !== null);
  const referralDoctorIds = new Set(referrals.map((referral) => referral.doctor_id));
  const campaignReferrals = referrals.filter(
    (referral) => referral.doctor?.first_1000_campaign,
  );
  const attributedBookings = data.bookings.filter(
    (booking) => booking.ambassador_referral_id !== null,
  );
  const hasPerformance = performanceRows.length > 0;
  const hasBookingData = attributedBookings.length > 0 || hasPerformance;
  const hasCommissionData = commissionRows.length > 0;
  const probationCount = hasPerformance
    ? performanceRows.reduce((total, row) => total + row.probation_doctors, 0)
    : probationRecords.filter((row) => {
        const status = normaliseStatus(row.status);
        return ["pending", "in progress", "active", "probation", "yellow", "green", "critical"].includes(status);
      }).length;
  const greenCount = hasPerformance
    ? performanceRows.reduce((total, row) => total + row.probation_green_doctors, 0)
    : probationRecords.filter((row) => normaliseStatus(row.status) === "green").length;
  const yellowCount = hasPerformance
    ? performanceRows.reduce((total, row) => total + row.probation_yellow_doctors, 0)
    : probationRecords.filter((row) => normaliseStatus(row.status) === "yellow").length;
  const criticalCount = hasPerformance
    ? performanceRows.reduce((total, row) => total + row.probation_critical_doctors, 0)
    : probationRecords.filter((row) => normaliseStatus(row.status) === "critical").length;
  const cohortSummaries = data.cohorts.map((cohort) => {
    const cohortAmbassadors = data.ambassadors.filter(
      (ambassador) => ambassador.cohort_id === cohort.id,
    );
    const cohortDoctors = new Set(
      referrals
        .filter(
          (referral) =>
            (referral.cohort_id ?? referral.ambassador?.cohort_id) === cohort.id,
        )
        .map((referral) => referral.doctor_id),
    );
    return {
      ...cohort,
      actualAmbassadors: cohortAmbassadors.length,
      actualDoctors: cohortDoctors.size,
      ambassadorProgress: progress(
        cohortAmbassadors.length,
        cohort.target_ambassadors,
      ),
      doctorProgress: progress(cohortDoctors.size, cohort.target_doctors),
    };
  });

  return {
    ...empty,
    totalAmbassadors: data.ambassadors.length,
    activeAmbassadors: data.ambassadors.filter((ambassador) =>
      isActiveAmbassador(ambassador.status),
    ).length,
    totalReferredDoctors: referralDoctorIds.size,
    activeReferredDoctors: hasPerformance
      ? performanceRows.reduce((total, row) => total + row.active_referred_doctors, 0)
      : new Set(
          referrals
            .filter((referral) => referral.doctor?.active)
            .map((referral) => referral.doctor_id),
        ).size,
    totalBookingsAttributed: hasBookingData
      ? hasPerformance
        ? performanceRows.reduce((total, row) => total + row.total_bookings, 0)
        : attributedBookings.length
      : null,
    probationDoctors: hasBookingData ? probationCount : null,
    greenProbation: hasBookingData ? greenCount : null,
    yellowProbation: hasBookingData ? yellowCount : null,
    criticalProbation: hasBookingData ? criticalCount : null,
    eligibleRevenue: hasCommissionData
      ? commissionRows.reduce((total, row) => total + row.eligible_revenue, 0)
      : null,
    commissionAmount: hasCommissionData
      ? commissionRows.reduce((total, row) => total + row.commission_amount, 0)
      : null,
    doctorsAtPostProbationTarget:
      hasBookingData && probationRecords.length
        ? probationRecords.filter(
            (row) =>
              row.postProbationTarget !== null &&
              row.bookingCount >= row.postProbationTarget,
          ).length
        : null,
    first1000Acquired: new Set(
      data.doctors
        .filter((doctor) => doctor.first_1000_campaign)
        .map((doctor) => doctor.id),
    ).size,
    ambassadorAttributedFirst1000: new Set(
      campaignReferrals.map((referral) => referral.doctor_id),
    ).size,
    cohortSummaries,
    performanceRecords,
    probationRecords,
  };
}

export function formatAmbassadorName(ambassador: Ambassador | null) {
  if (!ambassador) return "Ambassador unavailable";
  return `${ambassador.first_name} ${ambassador.last_name}`.trim();
}

export function formatDoctorName(doctor: AmbassadorDoctor | null) {
  if (!doctor) return "Doctor unavailable";
  return `${doctor.first_name} ${doctor.last_name}`.trim();
}

export function formatMoney(value: number | null) {
  if (value === null) return "Unavailable";
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentage(value: number | null) {
  return value === null ? "Unavailable" : `${value.toFixed(1)}%`;
}
