import { describe, it, expect } from "vitest";
import { cn } from "./utils";
import {
  evaluateKPIStatus,
  formatZAR,
  formatZARWithSign,
  formatDate,
} from "./medmap-store";
import {
  isResolvedStatus,
  isOverdueDate,
  normaliseStatus,
  statusToDisplay,
  buildKpiRows as executiveBuildKpiRows,
} from "./executive-dashboard";
import { classifyRoleKind, type RoleKind } from "./role-classify";

type ExecutiveKpiRow = {
  id: string;
  name: string;
  unit: string | null;
  target: number | null;
  actual: number | null;
  calculatedPercentage: number | null;
};

function buildKpiRows(
  data: {
    kpis: unknown[];
    targets: unknown[];
    results: unknown[];
    periods: unknown[];
  },
  now?: Date,
): { rows: ExecutiveKpiRow[] } {
  return executiveBuildKpiRows(data as never, now) as { rows: ExecutiveKpiRow[] };
}

function makeKpi(overrides: Partial<{
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
}> = {}) {
  return {
    id: overrides.id ?? "kpi-001",
    organization_id: overrides.organization_id ?? "org-001",
    department_id: overrides.department_id ?? null,
    owner_employee_id: overrides.owner_employee_id ?? null,
    name: overrides.name ?? "Active doctors",
    code: overrides.code ?? "KPI-001",
    description: overrides.description ?? null,
    category: overrides.category ?? null,
    measurement_type: overrides.measurement_type ?? "number",
    direction: overrides.direction ?? "higher",
    unit: overrides.unit ?? null,
    active: overrides.active ?? true,
  };
}

function makeKpiPeriod(overrides: Partial<{
  id: string;
  organization_id: string | null;
  period_type: string;
  period_name: string;
  start_date: string;
  end_date: string;
  status: string;
}> = {}) {
  return {
    id: overrides.id ?? "period-001",
    organization_id: overrides.organization_id ?? "org-001",
    period_type: overrides.period_type ?? "Monthly",
    period_name: overrides.period_name ?? "2026-09",
    start_date: overrides.start_date ?? "2026-09-01",
    end_date: overrides.end_date ?? "2026-09-30",
    status: overrides.status ?? "Current",
  };
}

function makeKpiTarget(overrides: Partial<{
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
}> = {}) {
  return {
    id: overrides.id ?? "target-001",
    kpi_id: overrides.kpi_id ?? "kpi-001",
    employee_id: overrides.employee_id ?? null,
    department_id: overrides.department_id ?? null,
    period_id: overrides.period_id ?? "period-001",
    target_value: overrides.target_value ?? 100,
    green_threshold: overrides.green_threshold ?? 100,
    yellow_threshold: overrides.yellow_threshold ?? 80,
    critical_threshold: overrides.critical_threshold ?? 0,
    notes: overrides.notes ?? null,
  };
}

function makeKpiResult(overrides: Partial<{
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
}> = {}) {
  return {
    id: overrides.id ?? "result-001",
    kpi_id: overrides.kpi_id ?? "kpi-001",
    target_id: overrides.target_id ?? "target-001",
    employee_id: overrides.employee_id ?? null,
    department_id: overrides.department_id ?? null,
    period_id: overrides.period_id ?? "period-001",
    actual_value: overrides.actual_value ?? 85,
    calculated_percentage: overrides.calculated_percentage ?? 85,
    status: overrides.status ?? "On track",
    commentary: overrides.commentary ?? null,
  };
}

describe("cn utility", () => {
  it("merges classes", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("omits falsy conditions", () => {
    expect(cn("base", false && "x", 0, null, undefined)).toBe("base");
  });
});

describe("evaluateKPIStatus (KPI helper)", () => {
  it("returns Not set when target is zero or negative", () => {
    expect(evaluateKPIStatus(50, 0, { green: 100, yellow: 80, red: 0 })).toBe("Not set");
    expect(evaluateKPIStatus(50, -10, { green: 100, yellow: 80, red: 0 })).toBe("Not set");
  });
  it("returns Healthy when achievement meets or exceeds green threshold", () => {
    expect(evaluateKPIStatus(100, 100, { green: 100, yellow: 80, red: 0 })).toBe("Healthy");
    expect(evaluateKPIStatus(120, 100, { green: 100, yellow: 80, red: 0 })).toBe("Healthy");
  });
  it("returns Attention when achievement between yellow and green", () => {
    expect(evaluateKPIStatus(85, 100, { green: 100, yellow: 80, red: 0 })).toBe("Attention");
  });
  it("returns Critical when below yellow threshold", () => {
    expect(evaluateKPIStatus(40, 100, { green: 100, yellow: 80, red: 0 })).toBe("Critical");
  });
});

describe("formatZAR / formatZARWithSign", () => {
  it("formats ZAR without decimals", () => {
    const v = formatZAR(1234);
    expect(v.startsWith("R")).toBe(true);
    expect(v.replace(/\s/g, "").replace(/\u00A0/g, "")).toMatch(/R1[, ]?234/);
    expect(formatZAR(0)).toBe("R0");
  });
  it("strips sign for absolute ZAR value", () => {
    expect(formatZAR(-99)).toBe("R99");
  });
  it("formatZARWithSign prepends minus sign", () => {
    expect(formatZARWithSign(-700)).toBe("-R700");
    expect(formatZARWithSign(700)).toBe("R700");
  });
});

describe("formatDate", () => {
  it("formats date YYYY-MM-DD to en-ZA medium", () => {
    expect(formatDate("2026-09-01")).toMatch(/1?Sep.*2026|Sep 2026/i);
  });
});

describe("normaliseStatus", () => {
  it("trims and lowercases and converts underscores and hyphens to spaces", () => {
    expect(normaliseStatus("In_Progress")).toBe("in progress");
    expect(normaliseStatus("  Green  ")).toBe("green");
    expect(normaliseStatus("OPEN-TASK")).toBe("open task");
    expect(normaliseStatus(null)).toBeNull();
    expect(normaliseStatus(undefined)).toBeNull();
  });
});

describe("isResolvedStatus", () => {
  it("resolves a wide set of terminal status tokens", () => {
    expect(isResolvedStatus("Resolved")).toBe(true);
    expect(isResolvedStatus("Closed")).toBe(true);
    expect(isResolvedStatus("done")).toBe(true);
    expect(isResolvedStatus("COMPLETED")).toBe(true);
    expect(isResolvedStatus("remediated")).toBe(true);
    expect(isResolvedStatus("dismissed")).toBe(true);
    expect(isResolvedStatus("cancelled")).toBe(true);
    expect(isResolvedStatus("Canceled")).toBe(true);
    expect(isResolvedStatus("expired")).toBe(true);
    expect(isResolvedStatus("complete")).toBe(true);
  });
  it("does not consider open statuses resolved", () => {
    expect(isResolvedStatus("Open")).toBe(false);
    expect(isResolvedStatus("In progress")).toBe(false);
    expect(isResolvedStatus("")).toBe(false);
    expect(isResolvedStatus(null)).toBe(false);
    expect(isResolvedStatus(undefined)).toBe(false);
  });
});

describe("isOverdueDate", () => {
  it("is false for resolved records regardless of date", () => {
    expect(isOverdueDate("2000-01-01", "Closed")).toBe(false);
    expect(isOverdueDate("2000-01-01", "Resolved")).toBe(false);
  });
  it("is false when no due date", () => {
    expect(isOverdueDate(null, "Open")).toBe(false);
  });
  it("is true for open past-due dates", () => {
    expect(isOverdueDate("2000-01-01", "Open")).toBe(true);
  });
  it("is false for open future dates", () => {
    expect(isOverdueDate("2999-12-31", "Open")).toBe(false);
  });
});

describe("statusToDisplay", () => {
  it("maps known codes to labels", () => {
    expect(statusToDisplay("green")).toBe("healthy");
    expect(statusToDisplay("yellow")).toBe("attention");
    expect(statusToDisplay("red")).toBe("critical");
    expect(statusToDisplay("unknown")).toBeNull();
    expect(statusToDisplay(null)).toBeNull();
  });
});

describe("buildKpiRows shape", () => {
  it("joins kpis / targets / results by period", () => {
    const today = new Date("2026-09-15T10:00:00Z");
    const rows = buildKpiRows(
      {
        kpis: [makeKpi()],
        targets: [makeKpiTarget()],
        results: [makeKpiResult()],
        periods: [makeKpiPeriod()],
      },
      today,
    );
    expect(rows.rows).toHaveLength(1);
    const row = rows.rows[0];
    expect(row.name).toBe("Active doctors");
    expect(row.target).toBe(100);
    expect(row.actual).toBe(85);
    expect(typeof row.calculatedPercentage).toBe("number");
  });

  it("skips kpis entirely when no period is current", () => {
    const rows = buildKpiRows({
      kpis: [makeKpi()],
      targets: [makeKpiTarget()],
      results: [makeKpiResult()],
      periods: [],
    });
    expect(rows.rows).toHaveLength(0);
  });
});

describe("classifyRoleKind", () => {
  it("classifies CEO by job_title", () => {
    expect(classifyRoleKind({ job_title: "Chief Executive Officer" })).toBe("ceo" as RoleKind);
  });
  it("classifies COO by job_title", () => {
    expect(classifyRoleKind({ job_title: "Chief Operating Officer" })).toBe("coo" as RoleKind);
  });
  it("classifies CTO by job_title", () => {
    expect(classifyRoleKind({ job_title: "Chief Technology Officer" })).toBe("cto" as RoleKind);
  });
  it("falls back to roleName when job_title is null", () => {
    expect(classifyRoleKind({ job_title: null, roleName: "Chief Executive Officer" })).toBe("ceo" as RoleKind);
    expect(classifyRoleKind({ job_title: null, roleName: "Chief Operating Officer" })).toBe("coo" as RoleKind);
    expect(classifyRoleKind({ job_title: null, roleName: "Chief Technology Officer" })).toBe("cto" as RoleKind);
  });
  it("classifies executive_other when roleLevel=executive AND isExecutive=true", () => {
    expect(
      classifyRoleKind({
        roleLevel: "executive",
        isExecutive: true,
        job_title: "Head of Strategic Projects",
      }),
    ).toBe("executive_other" as RoleKind);
  });
  it("NEVER classifies executive_other when isExecutive=false even when roleLevel=executive", () => {
    expect(classifyRoleKind({ roleLevel: "executive", isExecutive: false })).toBe("employee" as RoleKind);
  });
  it("classifies department_head by roleLevel", () => {
    expect(
      classifyRoleKind({ roleLevel: "department_head", job_title: "Head of People" }),
    ).toBe("department_head" as RoleKind);
  });
  it("classifies manager by roleLevel", () => {
    expect(classifyRoleKind({ roleLevel: "manager" })).toBe("manager" as RoleKind);
  });
  it("classifies plain employee by roleLevel=employee", () => {
    expect(
      classifyRoleKind({ job_title: "Clinical Support", roleLevel: "employee" }),
    ).toBe("employee" as RoleKind);
  });
  it("default fail-closed returns employee for ambiguous/empty", () => {
    expect(classifyRoleKind({ job_title: null, roleLevel: null, isExecutive: null })).toBe("employee" as RoleKind);
    expect(classifyRoleKind({})).toBe("employee" as RoleKind);
  });
  it("keyword matching is case-insensitive", () => {
    expect(classifyRoleKind({ job_title: "chief OPERATING officer" })).toBe("coo" as RoleKind);
    expect(classifyRoleKind({ job_title: "CHIEF EXECUTIVE OFFICER" })).toBe("ceo" as RoleKind);
    expect(classifyRoleKind({ job_title: "Chief Technology Officer (CTO)" })).toBe("cto" as RoleKind);
  });
  it("priority order: job_title wins over roleLevel for C-suite titles", () => {
    expect(
      classifyRoleKind({
        roleLevel: "executive",
        isExecutive: true,
        job_title: "Chief Operating Officer",
      }),
    ).toBe("coo" as RoleKind);
  });
  it("priority order: executive_other needs BOTH roleLevel=executive AND isExecutive=true", () => {
    expect(classifyRoleKind({ roleLevel: "executive", isExecutive: null })).toBe("employee" as RoleKind);
    expect(classifyRoleKind({ isExecutive: true })).toBe("employee" as RoleKind);
  });
});
