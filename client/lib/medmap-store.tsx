export const ticketTypeOptions = [
  "Customer case",
  "Doctor onboarding",
  "Sales & acquisition",
  "Finance approval",
  "Technology incident",
  "Security assessment",
  "People & performance",
  "General operations",
  "Expense reimbursement",
] as const;

export type TicketType = (typeof ticketTypeOptions)[number];
export type TransactionKind = "revenue" | "expense" | "funding";
export type TransactionStatus = "Paid" | "Payable" | "Committed";

export type Transaction = {
  id: string;
  date: string;
  timestamp?: string;
  description: string;
  kind: TransactionKind;
  category: string;
  amount: number;
  status: TransactionStatus;
  owner: string;
  owedTo?: string;
  source?: string;
  notes: string;
};

export type EmployeeDeliverable = {
  id: string;
  title: string;
  cadence: "Weekly" | "Monthly" | "One-off";
  dueDate: string;
  status: "Not started" | "In progress" | "Done" | "Blocked";
  notes: string;
};

export type OrganizationUnit = {
  id: string;
  name: string;
  kind: "Executive" | "Department" | "Team";
  parentId?: string;
  leader: string;
  description: string;
};

export type KPIStatus = "Not set" | "Healthy" | "Attention" | "Critical";
export type KPIPeriod = "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Annual";
export type KPI = {
  id: string;
  name: string;
  department: string;
  owner: string;
  description: string;
  target: number;
  actual: number;
  unit: string;
  period: KPIPeriod;
  startDate: string;
  endDate: string;
  calculationMethod: string;
  thresholds: { green: number; yellow: number; red: number };
  status: KPIStatus;
  notes: string;
  history: { periodStart: string; periodEnd: string; actual: number; target: number; status: KPIStatus; recordedAt: string }[];
};

export type Employee = {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  team: string;
  manager: string;
  executive: string;
  reportingLine: string;
  startDate: string;
  role: "CEO" | "COO" | "CTO" | "Department head" | "Manager" | "Employee";
  employmentStatus: "Active" | "On leave" | "Inactive";
  viewPermissions: string[];
  ticketTypes: TicketType[];
  deliverables: EmployeeDeliverable[];
};

export type Ticket = {
  id: string;
  title: string;
  type: TicketType;
  priority: "Low" | "Normal" | "High" | "Critical";
  status: "Open" | "Assigned" | "In progress" | "Pending" | "Completed" | "Closed";
  requester: string;
  assigneeId: string;
  createdAt: string;
  dueDate: string;
  description: string;
  amount?: number;
  owedTo?: string;
};

export type Meeting = {
  id: string;
  title: string;
  date: string;
  time: string;
  status: "Planned" | "Held" | "Cancelled";
  attendees: string;
  notes: string;
  decisions: string;
  createdAt: string;
  source: "manual" | "medmap.co.za";
};

export type MeetingDeadline = {
  id: string;
  meetingId: string;
  title: string;
  dueDate: string;
  owner: string;
  status: "Open" | "In progress" | "Blocked" | "Done";
  followUp: string;
};

export type TargetPeriod = "Weekly" | "Monthly";
export type DepartmentTarget = {
  id: string;
  department: string;
  metric: string;
  period: TargetPeriod;
  actual: number;
  target: number;
  unit: "count" | "milestone";
  owner: string;
  status: "Not set" | "On track" | "At risk" | "Outstanding";
  notes: string;
};

export type TechnologyWorkItem = {
  id: string;
  title: string;
  status: "Outstanding" | "In progress" | "Done";
  owner: string;
  followUp: string;
};

export const viewPermissionOptions = [
  "Company overview",
  "Financial health",
  "People & performance",
  "Operations & tickets",
  "Patient records",
  "Doctor operations",
  "Technology & security",
  "Risk & governance",
] as const;

export function evaluateKPIStatus(actual: number, target: number, thresholds: { green: number; yellow: number; red: number }): KPIStatus {
  if (target <= 0) return "Not set";
  const achievement = (actual / target) * 100;
  if (achievement >= thresholds.green) return "Healthy";
  if (achievement >= thresholds.yellow) return "Attention";
  return "Critical";
}

export function formatZAR(amount: number) {
  return `R${Math.abs(amount).toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatZARWithSign(amount: number) {
  return `${amount < 0 ? "-" : ""}${formatZAR(amount)}`;
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-ZA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}
