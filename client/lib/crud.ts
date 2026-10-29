import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient } from "./supabase";
import { useCurrentOrganisation } from "./supabase-identity";
import type { OrganisationEmployee } from "./people-organization-dashboard";

function useOrgScopedInvalidate() {
  const queryClient = useQueryClient();
  return (prefixes: Array<string | readonly unknown[]>) => {
    for (const prefix of prefixes) {
      void queryClient.invalidateQueries({
        queryKey: Array.isArray(prefix) ? (prefix as readonly unknown[]) : [prefix],
      });
    }
  };
}

export type KpiTargetInput = {
  kpiId: string;
  periodId: string;
  targetValue: number;
  departmentId?: string | null;
  employeeId?: string | null;
  greenThreshold?: number | null;
  yellowThreshold?: number | null;
  criticalThreshold?: number | null;
  notes?: string | null;
};

export type KpiResultInput = {
  kpiId: string;
  periodId: string;
  targetId?: string | null;
  actualValue: number;
  calculatedPercentage?: number | null;
  status?: "green" | "yellow" | "red" | "not_started" | "complete";
  departmentId?: string | null;
  employeeId?: string | null;
  commentary?: string | null;
  recordedBy?: string | null;
};

export function useKpiMutations() {
  const organizationState = useCurrentOrganisation();
  const organizationId = organizationState.organizationId;
  const invalidate = useOrgScopedInvalidate();

  const createTarget = useMutation({
    mutationFn: async (input: KpiTargetInput) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient().from("kpi_targets").insert({
        kpi_id: input.kpiId,
        period_id: input.periodId,
        target_value: input.targetValue,
        department_id: input.departmentId ?? null,
        employee_id: input.employeeId ?? null,
        green_threshold: input.greenThreshold ?? null,
        yellow_threshold: input.yellowThreshold ?? null,
        critical_threshold: input.criticalThreshold ?? null,
        notes: input.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () =>
      invalidate(["executive-dashboard", "operations-dashboard", "kpis", "kpi-register"]),
  });

  const updateTarget = useMutation({
    mutationFn: async ({ id, targetValue, notes }: { id: string; targetValue?: number; notes?: string | null }) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const patch: Partial<{ target_value: number; notes: string | null }> = {};
      if (targetValue !== undefined) patch.target_value = targetValue;
      if (notes !== undefined) patch.notes = notes;
      const { error } = await getSupabaseClient()
        .from("kpi_targets")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      invalidate(["executive-dashboard", "operations-dashboard", "kpis", "kpi-register"]),
  });

  const createResult = useMutation({
    mutationFn: async (input: KpiResultInput) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient().from("kpi_results").insert({
        kpi_id: input.kpiId,
        period_id: input.periodId,
        target_id: input.targetId ?? null,
        actual_value: input.actualValue,
        calculated_percentage: input.calculatedPercentage ?? null,
        status: input.status ?? "not_started",
        department_id: input.departmentId ?? null,
        employee_id: input.employeeId ?? null,
        commentary: input.commentary ?? null,
        recorded_by: input.recordedBy ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () =>
      invalidate(["executive-dashboard", "operations-dashboard", "kpis", "kpi-register"]),
  });

  const updateResult = useMutation({
    mutationFn: async ({ id, actualValue, calculatedPercentage, status, commentary }: { id: string; actualValue?: number; calculatedPercentage?: number | null; status?: KpiResultInput["status"]; commentary?: string | null }) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const patch: Partial<{ actual_value: number; calculated_percentage: number | null; status: KpiResultInput["status"]; commentary: string | null }> = {};
      if (actualValue !== undefined) patch.actual_value = actualValue;
      if (calculatedPercentage !== undefined) patch.calculated_percentage = calculatedPercentage;
      if (status !== undefined) patch.status = status;
      if (commentary !== undefined) patch.commentary = commentary;
      const { error } = await getSupabaseClient()
        .from("kpi_results")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      invalidate(["executive-dashboard", "operations-dashboard", "kpis", "kpi-register"]),
  });

  return { createTarget, updateTarget, createResult, updateResult };
}

export type RevenueInput = {
  revenueDate?: string;
  revenueType: string;
  amount: number;
  currency?: string;
  status?: "pending" | "recognized" | "refunded" | "reversed";
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
  description?: string | null;
};

export type ExpenseInput = {
  expenseDate: string;
  amount: number;
  description: string;
  currency?: string;
  financialPeriodId?: string | null;
  expenseCategoryId?: string | null;
  subcategory?: string | null;
  merchant?: string | null;
  paymentMethod?: string | null;
  referenceNumber?: string | null;
  vatAmount?: number | null;
  vatInclusive?: boolean;
  paidByType?: "company" | "founder" | "employee" | "other";
  paidByEmployeeId?: string | null;
  reimbursementStatus?: "not_applicable" | "pending" | "approved" | "partially_reimbursed" | "reimbursed" | "declined";
  notes?: string | null;
  createdBy?: string | null;
};

export function useFinanceMutations() {
  const organizationState = useCurrentOrganisation();
  const organizationId = organizationState.organizationId;
  const invalidate = useOrgScopedInvalidate();

  const createRevenue = useMutation({
    mutationFn: async (input: RevenueInput) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient().from("revenue").insert({
        organization_id: organizationId,
        revenue_date: input.revenueDate ?? new Date().toISOString().slice(0, 10),
        revenue_type: input.revenueType,
        amount: input.amount,
        currency: input.currency ?? "ZAR",
        status: input.status ?? "recognized",
        source_entity_type: input.sourceEntityType ?? null,
        source_entity_id: input.sourceEntityId ?? null,
        description: input.description ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidate(["executive-dashboard", "finance"]),
  });

  const updateRevenue = useMutation({
    mutationFn: async ({ id, amount, status, description }: { id: string; amount?: number; status?: RevenueInput["status"]; description?: string | null }) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const patch: Partial<{ amount: number; status: RevenueInput["status"]; description: string | null }> = {};
      if (amount !== undefined) patch.amount = amount;
      if (status !== undefined) patch.status = status;
      if (description !== undefined) patch.description = description;
      const { error } = await getSupabaseClient()
        .from("revenue")
        .update(patch)
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(["executive-dashboard", "finance"]),
  });

  const deleteRevenue = useMutation({
    mutationFn: async (id: string) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient()
        .from("revenue")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(["executive-dashboard", "finance"]),
  });

  const createExpense = useMutation({
    mutationFn: async (input: ExpenseInput) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient().from("expenses").insert({
        organization_id: organizationId,
        financial_period_id: input.financialPeriodId ?? null,
        expense_category_id: input.expenseCategoryId ?? null,
        expense_date: input.expenseDate,
        description: input.description,
        amount: input.amount,
        currency: input.currency ?? "ZAR",
        paid_by_type: input.paidByType ?? "company",
        paid_by_employee_id: input.paidByEmployeeId ?? null,
        subcategory: input.subcategory ?? null,
        merchant: input.merchant ?? null,
        payment_method: input.paymentMethod ?? null,
        reference_number: input.referenceNumber ?? null,
        vat_amount: input.vatAmount ?? null,
        vat_inclusive: input.vatInclusive ?? true,
        reimbursement_status: input.reimbursementStatus ?? "not_applicable",
        notes: input.notes ?? null,
        created_by: input.createdBy ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidate(["executive-dashboard", "finance"]),
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, amount, description, approvalStatus, reimbursementStatus }: { id: string; amount?: number; description?: string; approvalStatus?: "pending" | "approved" | "rejected"; reimbursementStatus?: ExpenseInput["reimbursementStatus"] }) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const patch: Partial<{ amount: number; description: string; approval_status: "pending" | "approved" | "rejected"; reimbursement_status: ExpenseInput["reimbursementStatus"] }> = {};
      if (amount !== undefined) patch.amount = amount;
      if (description !== undefined) patch.description = description;
      if (approvalStatus !== undefined) patch.approval_status = approvalStatus;
      if (reimbursementStatus !== undefined) patch.reimbursement_status = reimbursementStatus;
      const { error } = await getSupabaseClient()
        .from("expenses")
        .update(patch)
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(["executive-dashboard", "finance"]),
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient()
        .from("expenses")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(["executive-dashboard", "finance"]),
  });

  return { createRevenue, updateRevenue, deleteRevenue, createExpense, updateExpense, deleteExpense };
}

export type EmployeeInput = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  roleId?: string | null;
  departmentId?: string | null;
  teamId?: string | null;
  managerId?: string | null;
  jobTitle?: string | null;
  employeeStatus?: "active" | "inactive" | "on_leave" | "terminated";
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
};

export function usePeopleMutations() {
  const organizationState = useCurrentOrganisation();
  const organizationId = organizationState.organizationId;
  const invalidate = useOrgScopedInvalidate();

  const createEmployee = useMutation({
    mutationFn: async (input: EmployeeInput): Promise<{ id: string }> => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { data, error } = await getSupabaseClient()
        .from("employees")
        .insert({
          organization_id: organizationId,
          auth_user_id: null,
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email ?? null,
          phone: input.phone ?? null,
          role_id: input.roleId ?? null,
          department_id: input.departmentId ?? null,
          team_id: input.teamId ?? null,
          manager_id: input.managerId ?? null,
          job_title: input.jobTitle ?? null,
          employee_status: input.employeeStatus ?? "active",
          start_date: input.startDate ?? null,
          end_date: input.endDate ?? null,
          notes: input.notes ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return { id: (data as { id: string }).id };
    },
    onSuccess: () => invalidate(["people-organisation", "executive-dashboard", "operations-dashboard"]),
  });

  const updateEmployee = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Omit<EmployeeInput, "firstName" | "lastName"> & { firstName?: string; lastName?: string }> }) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const mapped: Record<string, unknown> = {};
      if (patch.firstName !== undefined) mapped.first_name = patch.firstName;
      if (patch.lastName !== undefined) mapped.last_name = patch.lastName;
      if (patch.email !== undefined) mapped.email = patch.email;
      if (patch.phone !== undefined) mapped.phone = patch.phone;
      if (patch.roleId !== undefined) mapped.role_id = patch.roleId;
      if (patch.departmentId !== undefined) mapped.department_id = patch.departmentId;
      if (patch.teamId !== undefined) mapped.team_id = patch.teamId;
      if (patch.managerId !== undefined) mapped.manager_id = patch.managerId;
      if (patch.jobTitle !== undefined) mapped.job_title = patch.jobTitle;
      if (patch.employeeStatus !== undefined) mapped.employee_status = patch.employeeStatus;
      if (patch.startDate !== undefined) mapped.start_date = patch.startDate;
      if (patch.endDate !== undefined) mapped.end_date = patch.endDate;
      if (patch.notes !== undefined) mapped.notes = patch.notes;
      const { error } = await getSupabaseClient()
        .from("employees")
        .update(mapped)
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(["people-organisation", "executive-dashboard", "operations-dashboard"]),
  });

  const inactivateEmployee = useMutation({
    mutationFn: async ({ id, endDate }: { id: string; endDate?: string | null }) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient()
        .from("employees")
        .update({
          employee_status: "inactive" as const,
          end_date: endDate ?? new Date().toISOString().slice(0, 10),
        })
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(["people-organisation", "executive-dashboard", "operations-dashboard"]),
  });

  return { createEmployee, updateEmployee, inactivateEmployee };
}

export type TaskInput = {
  title: string;
  description?: string | null;
  priority?: "low" | "medium" | "high" | "critical";
  status?: "not_started" | "in_progress" | "blocked" | "completed" | "cancelled";
  assignedTo?: string | null;
  createdBy?: string | null;
  departmentId?: string | null;
  kpiId?: string | null;
  dueDate?: string | null;
  progressPercentage?: number;
};

export function useOperationsTaskActions() {
  const organizationState = useCurrentOrganisation();
  const organizationId = organizationState.organizationId;
  const invalidate = useOrgScopedInvalidate();

  const createTask = useMutation({
    mutationFn: async (input: TaskInput) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient().from("tasks").insert({
        organization_id: organizationId,
        department_id: input.departmentId ?? null,
        assigned_to: input.assignedTo ?? null,
        created_by: input.createdBy ?? null,
        kpi_id: input.kpiId ?? null,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? "medium",
        status: input.status ?? "not_started",
        progress_percentage: input.progressPercentage ?? 0,
        due_date: input.dueDate ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidate(["operations-dashboard", "executive-dashboard"]),
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, status, completedAt }: { id: string; status: TaskInput["status"]; completedAt?: string | null }) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const patch: Partial<{ status: TaskInput["status"]; completed_at: string | null; progress_percentage: number }> = { status };
      if (status === "completed") {
        patch.completed_at = completedAt ?? new Date().toISOString();
        patch.progress_percentage = 100;
      } else {
        patch.completed_at = null;
      }
      const { error } = await getSupabaseClient()
        .from("tasks")
        .update(patch)
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(["operations-dashboard", "executive-dashboard"]),
  });

  const updateTaskProgress = useMutation({
    mutationFn: async ({ id, progressPercentage }: { id: string; progressPercentage: number }) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const clamped = Math.max(0, Math.min(100, progressPercentage));
      const { error } = await getSupabaseClient()
        .from("tasks")
        .update({ progress_percentage: clamped })
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(["operations-dashboard", "executive-dashboard"]),
  });

  const updateTaskAssignee = useMutation({
    mutationFn: async ({ id, assignedTo }: { id: string; assignedTo: string | null }) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient()
        .from("tasks")
        .update({ assigned_to: assignedTo })
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(["operations-dashboard", "executive-dashboard"]),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient()
        .from("tasks")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(["operations-dashboard", "executive-dashboard"]),
  });

  return { createTask, updateTaskStatus, updateTaskProgress, updateTaskAssignee, deleteTask };
}

export type CaseInput = {
  subject: string;
  description?: string | null;
  priority?: "low" | "medium" | "high" | "critical";
  status?: "open" | "in_progress" | "pending_customer" | "pending_internal" | "escalated" | "resolved" | "closed" | "cancelled";
  source?: "internal" | "phone" | "email" | "whatsapp" | "web" | "app" | "social" | "referral" | "other";
  reportedByEmployeeId?: string | null;
  assignedToEmployeeId?: string | null;
  categoryId?: string | null;
  patientId?: string | null;
  doctorId?: string | null;
  bookingId?: string | null;
  customerType?: "patient" | "doctor" | "ambassador" | "other" | null;
  resolutionSummary?: string | null;
  internalNotes?: string | null;
  slaResponseDueAt?: string | null;
  slaResolutionDueAt?: string | null;
};

export function useCasesMutations() {
  const organizationState = useCurrentOrganisation();
  const organizationId = organizationState.organizationId;
  const invalidate = useOrgScopedInvalidate();

  const createCase = useMutation({
    mutationFn: async (input: CaseInput): Promise<{ id: string }> => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { data, error } = await getSupabaseClient()
        .from("customer_cases")
        .insert({
          organization_id: organizationId,
          subject: input.subject,
          description: input.description ?? null,
          priority: input.priority ?? "medium",
          status: input.status ?? "open",
          source: input.source ?? "internal",
          reported_by_employee_id: input.reportedByEmployeeId ?? null,
          assigned_to_employee_id: input.assignedToEmployeeId ?? null,
          category_id: input.categoryId ?? null,
          patient_id: input.patientId ?? null,
          doctor_id: input.doctorId ?? null,
          booking_id: input.bookingId ?? null,
          customer_type: input.customerType ?? null,
          resolution_summary: input.resolutionSummary ?? null,
          internal_notes: input.internalNotes ?? null,
          sla_response_due_at: input.slaResponseDueAt ?? null,
          sla_resolution_due_at: input.slaResolutionDueAt ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return { id: (data as { id: string }).id };
    },
    onSuccess: () => invalidate(["operations-dashboard", "executive-dashboard", "cases"]),
  });

  const updateCaseStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CaseInput["status"] }) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const now = new Date().toISOString();
      const patch: Partial<{
        status: CaseInput["status"];
        first_response_at: string | null;
        resolved_at: string | null;
        closed_at: string | null;
      }> = { status };
      if (status === "in_progress" || status === "pending_customer" || status === "pending_internal" || status === "escalated") {
        patch.first_response_at = now;
      }
      if (status === "resolved" || status === "closed") {
        patch.resolved_at = now;
      }
      if (status === "closed") {
        patch.closed_at = now;
      }
      const { error } = await getSupabaseClient()
        .from("customer_cases")
        .update(patch)
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(["operations-dashboard", "executive-dashboard", "cases"]),
  });

  const updateCase = useMutation({
    mutationFn: async ({
      id,
      subject,
      description,
      priority,
      assignedToEmployeeId,
      resolutionSummary,
      internalNotes,
    }: {
      id: string;
      subject?: string;
      description?: string | null;
      priority?: CaseInput["priority"];
      assignedToEmployeeId?: string | null;
      resolutionSummary?: string | null;
      internalNotes?: string | null;
    }) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const patch: Record<string, unknown> = {};
      if (subject !== undefined) patch.subject = subject;
      if (description !== undefined) patch.description = description;
      if (priority !== undefined) patch.priority = priority;
      if (assignedToEmployeeId !== undefined) patch.assigned_to_employee_id = assignedToEmployeeId;
      if (resolutionSummary !== undefined) patch.resolution_summary = resolutionSummary;
      if (internalNotes !== undefined) patch.internal_notes = internalNotes;
      const { error } = await getSupabaseClient()
        .from("customer_cases")
        .update(patch)
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(["operations-dashboard", "executive-dashboard", "cases"]),
  });

  const deleteCase = useMutation({
    mutationFn: async (id: string) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient()
        .from("customer_cases")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(["operations-dashboard", "executive-dashboard", "cases"]),
  });

  return { createCase, updateCaseStatus, updateCase, deleteCase };
}

export type MeetingInput = {
  title: string;
  meetingType?: "executive" | "department" | "one_on_one" | "project" | "sales" | "operations" | "customer_ops" | "technical" | "security" | "other";
  meetingDate: string;
  durationMinutes?: number | null;
  location?: string | null;
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
  chairEmployeeId?: string | null;
  createdBy?: string | null;
  departmentId?: string | null;
  summary?: string | null;
  notes?: string | null;
};

export function useMeetingsMutations() {
  const organizationState = useCurrentOrganisation();
  const organizationId = organizationState.organizationId;
  const invalidate = useOrgScopedInvalidate();

  const createMeeting = useMutation({
    mutationFn: async (input: MeetingInput): Promise<{ id: string }> => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { data, error } = await getSupabaseClient()
        .from("meetings")
        .insert({
          organization_id: organizationId,
          department_id: input.departmentId ?? null,
          title: input.title,
          meeting_type: input.meetingType ?? "other",
          meeting_date: input.meetingDate,
          duration_minutes: input.durationMinutes ?? null,
          location: input.location ?? null,
          status: input.status ?? "scheduled",
          chair_employee_id: input.chairEmployeeId ?? null,
          created_by: input.createdBy ?? null,
          summary: input.summary ?? null,
          notes: input.notes ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return { id: (data as { id: string }).id };
    },
    onSuccess: () => invalidate(["meetings", "executive-dashboard"]),
  });

  const updateMeeting = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Omit<MeetingInput, "title"> & { title?: string }> }) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const mapped: Record<string, unknown> = {};
      if (patch.title !== undefined) mapped.title = patch.title;
      if (patch.meetingType !== undefined) mapped.meeting_type = patch.meetingType;
      if (patch.meetingDate !== undefined) mapped.meeting_date = patch.meetingDate;
      if (patch.durationMinutes !== undefined) mapped.duration_minutes = patch.durationMinutes;
      if (patch.location !== undefined) mapped.location = patch.location;
      if (patch.status !== undefined) mapped.status = patch.status;
      if (patch.chairEmployeeId !== undefined) mapped.chair_employee_id = patch.chairEmployeeId;
      if (patch.departmentId !== undefined) mapped.department_id = patch.departmentId;
      if (patch.summary !== undefined) mapped.summary = patch.summary;
      if (patch.notes !== undefined) mapped.notes = patch.notes;
      const { error } = await getSupabaseClient()
        .from("meetings")
        .update(mapped)
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(["meetings", "executive-dashboard"]),
  });

  const deleteMeeting = useMutation({
    mutationFn: async (id: string) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient()
        .from("meetings")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(["meetings", "executive-dashboard"]),
  });

  return { createMeeting, updateMeeting, deleteMeeting };
}

export type DeadlineInput = {
  title: string;
  dueAt: string;
  description?: string | null;
  priority?: "low" | "medium" | "high" | "critical";
  status?: "open" | "completed" | "overdue" | "cancelled";
  ownerEmployeeId?: string | null;
  departmentId?: string | null;
  linkedTaskId?: string | null;
  linkedTicketId?: string | null;
};

export function useDeadlinesMutations() {
  const organizationState = useCurrentOrganisation();
  const organizationId = organizationState.organizationId;
  const invalidate = useOrgScopedInvalidate();

  const createDeadline = useMutation({
    mutationFn: async (input: DeadlineInput) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient().from("deadlines").insert({
        organization_id: organizationId,
        department_id: input.departmentId ?? null,
        owner_employee_id: input.ownerEmployeeId ?? null,
        title: input.title,
        description: input.description ?? null,
        due_at: input.dueAt,
        priority: input.priority ?? "medium",
        status: input.status ?? "open",
        linked_task_id: input.linkedTaskId ?? null,
        linked_ticket_id: input.linkedTicketId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidate(["operations-dashboard", "executive-dashboard", "meetings"]),
  });

  const updateDeadline = useMutation({
    mutationFn: async ({ id, status, dueAt, title }: { id: string; status?: DeadlineInput["status"]; dueAt?: string; title?: string }) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const patch: Record<string, unknown> = {};
      if (status !== undefined) patch.status = status;
      if (dueAt !== undefined) patch.due_at = dueAt;
      if (title !== undefined) patch.title = title;
      const { error } = await getSupabaseClient()
        .from("deadlines")
        .update(patch)
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(["operations-dashboard", "executive-dashboard", "meetings"]),
  });

  const deleteDeadline = useMutation({
    mutationFn: async (id: string) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient()
        .from("deadlines")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(["operations-dashboard", "executive-dashboard", "meetings"]),
  });

  return { createDeadline, updateDeadline, deleteDeadline };
}

export type DoctorPipelineInput = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  specialty?: string | null;
  practiceName?: string | null;
  city?: string | null;
  province?: string | null;
  acquisitionChannel?: string | null;
  sourceDetail?: string | null;
  ownerEmployeeId?: string | null;
  first1000Campaign?: boolean;
  notes?: string | null;
};

const acquisitionStatusToDoctorStatus: Record<string, string> = {
  prospect: "prospect",
  contacted: "contacted",
  interested: "interested",
  enrolled: "enrolled",
  converted: "active",
  lost: "lost",
};

export function useDoctorPipelineMutations() {
  const organizationState = useCurrentOrganisation();
  const organizationId = organizationState.organizationId;
  const invalidate = useOrgScopedInvalidate();

  const createPipelineEntry = useMutation({
    mutationFn: async (input: DoctorPipelineInput): Promise<{ doctorId: string }> => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("doctors")
        .insert({
          organization_id: organizationId,
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email ?? null,
          phone: input.phone ?? null,
          specialty: input.specialty ?? null,
          practice_name: input.practiceName ?? null,
          city: input.city ?? null,
          province: input.province ?? null,
          acquisition_source: input.acquisitionChannel ?? null,
          acquisition_status: "prospect",
          first_1000_campaign: input.first1000Campaign ?? false,
          notes: input.notes ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      const doctorId = (data as { id: string }).id;
      const { error: acquisitionError } = await client.from("doctor_acquisition").insert({
        doctor_id: doctorId,
        status: "prospect",
        acquisition_channel: input.acquisitionChannel ?? null,
        source_detail: input.sourceDetail ?? null,
        owner_employee_id: input.ownerEmployeeId ?? null,
      });
      if (acquisitionError) throw acquisitionError;
      return { doctorId };
    },
    onSuccess: () =>
      invalidate(["doctor-acquisition-dashboard", "operations-dashboard", "executive-dashboard"]),
  });

  const updateAcquisitionStatus = useMutation({
    mutationFn: async ({
      id,
      doctorId,
      status,
    }: {
      id: string;
      doctorId: string;
      status: string;
    }) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const client = getSupabaseClient();
      const now = new Date().toISOString();
      const patch: Record<string, unknown> = { status, updated_at: now };
      if (status === "contacted") patch.contacted_at = now;
      if (status === "enrolled") patch.enrolled_at = now;
      if (status === "converted") patch.converted_at = now;
      if (status === "lost") patch.lost_at = now;
      const { error } = await client.from("doctor_acquisition").update(patch).eq("id", id);
      if (error) throw error;
      const { error: doctorError } = await client
        .from("doctors")
        .update({
          acquisition_status: acquisitionStatusToDoctorStatus[status] ?? status,
          updated_at: now,
        })
        .eq("id", doctorId)
        .eq("organization_id", organizationId);
      if (doctorError) throw doctorError;
    },
    onSuccess: () =>
      invalidate(["doctor-acquisition-dashboard", "operations-dashboard", "executive-dashboard"]),
  });

  const logContactAttempt = useMutation({
    mutationFn: async ({
      doctorId,
      channel,
      outcome,
      notes,
    }: {
      doctorId: string;
      channel: string;
      outcome: string;
      notes?: string | null;
    }) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient().from("doctor_contact_attempts").insert({
        organization_id: organizationId,
        doctor_id: doctorId,
        contact_channel: channel,
        outcome,
        notes: notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidate(["doctor-acquisition-dashboard"]),
  });

  const assignAmbassador = useMutation({
    mutationFn: async ({
      doctorId,
      ambassadorId,
    }: {
      doctorId: string;
      ambassadorId: string;
    }) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const client = getSupabaseClient();
      const { data: existing, error: readError } = await client
        .from("ambassador_referrals")
        .select("id")
        .eq("doctor_id", doctorId)
        .limit(1);
      if (readError) throw readError;
      const referralId = Array.isArray(existing) && existing.length
        ? (existing[0] as { id: string }).id
        : null;
      if (referralId) {
        const { error } = await client
          .from("ambassador_referrals")
          .update({ ambassador_id: ambassadorId })
          .eq("id", referralId);
        if (error) throw error;
      } else {
        const { error } = await client.from("ambassador_referrals").insert({
          ambassador_id: ambassadorId,
          doctor_id: doctorId,
          probation_status: "not_started",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => invalidate(["doctor-acquisition-dashboard", "ambassadors"]),
  });

  return { createPipelineEntry, updateAcquisitionStatus, logContactAttempt, assignAmbassador };
}

export type AmbassadorInput = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  status?: "prospect" | "active" | "inactive" | "completed" | "terminated";
  cohortId?: string | null;
  startDate?: string | null;
  currentTier?: string | null;
};

export function useAmbassadorMutations() {
  const organizationState = useCurrentOrganisation();
  const organizationId = organizationState.organizationId;
  const invalidate = useOrgScopedInvalidate();

  const createAmbassador = useMutation({
    mutationFn: async (input: AmbassadorInput) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient().from("ambassadors").insert({
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email ?? null,
        phone: input.phone ?? null,
        status: input.status ?? "active",
        cohort_id: input.cohortId ?? null,
        start_date: input.startDate ?? null,
        current_tier: input.currentTier ?? "Bronze",
      });
      if (error) throw error;
    },
    onSuccess: () => invalidate(["ambassadors"]),
  });

  const updateAmbassador = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<AmbassadorInput>;
    }) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const mapped: Record<string, unknown> = {};
      if (patch.firstName !== undefined) mapped.first_name = patch.firstName;
      if (patch.lastName !== undefined) mapped.last_name = patch.lastName;
      if (patch.email !== undefined) mapped.email = patch.email;
      if (patch.phone !== undefined) mapped.phone = patch.phone;
      if (patch.status !== undefined) mapped.status = patch.status;
      if (patch.cohortId !== undefined) mapped.cohort_id = patch.cohortId;
      if (patch.startDate !== undefined) mapped.start_date = patch.startDate;
      if (patch.currentTier !== undefined) mapped.current_tier = patch.currentTier;
      if (!Object.keys(mapped).length) return;
      const { error } = await getSupabaseClient()
        .from("ambassadors")
        .update(mapped)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(["ambassadors"]),
  });

  const deleteAmbassador = useMutation({
    mutationFn: async (id: string) => {
      if (!organizationId) throw new Error("Organisation is not available.");
      const { error } = await getSupabaseClient().from("ambassadors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(["ambassadors"]),
  });

  return { createAmbassador, updateAmbassador, deleteAmbassador };
}

export type { OrganisationEmployee };
