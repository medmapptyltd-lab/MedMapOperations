import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getSupabaseClient } from "./supabase";
import { useSupabaseAuth } from "./supabase-auth";

export type EmployeeRecord = {
  id: string;
  auth_user_id: string | null;
  organization_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role_id: string | null;
  department_id: string | null;
  team_id: string | null;
  manager_id: string | null;
  job_title: string | null;
  employee_status: string;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CurrentEmployee = EmployeeRecord & {
  permissionIds: string[];
  isExecutive: boolean | null;
};

export type RoleMeta = {
  id: string;
  name: string | null;
  role_level: string | null;
} | null;

export type DepartmentMeta = {
  id: string;
  name: string | null;
  department_group: string | null;
} | null;

export type CurrentEmployeeState = {
  employee: CurrentEmployee | null;
  permissionIds: string[];
  isExecutive: boolean | null;
  roleMeta: RoleMeta;
  deptMeta: DepartmentMeta;
  ownedDepartmentIds: string[];
  status: "loading" | "unauthenticated" | "active" | "no-active-employee" | "error";
  isLoading: boolean;
  isUnauthenticated: boolean;
  hasNoActiveEmployee: boolean;
  permissionsLoading: boolean;
  permissionsResolved: boolean;
  roleResolved: boolean;
  departmentResolved: boolean;
  rlsQuerySuccessful: boolean;
  error: Error | null;
};

export type OrganizationRecord = {
  id: string;
  name: string | null;
};

export type CurrentOrganisationState = {
  organization: OrganizationRecord | null;
  organizationId: string | null;
  status: "loading" | "unauthenticated" | "active" | "no-organization" | "error";
  isLoading: boolean;
  isUnauthenticated: boolean;
  hasNoOrganization: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
};

const employeeColumns = [
  "id",
  "auth_user_id",
  "organization_id",
  "first_name",
  "last_name",
  "email",
  "phone",
  "role_id",
  "department_id",
  "team_id",
  "manager_id",
  "job_title",
  "employee_status",
  "start_date",
  "end_date",
  "notes",
  "created_at",
  "updated_at",
].join(", ");

function asError(error: unknown) {
  return error instanceof Error ? error : new Error("The identity lookup could not be completed.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseOrganizationRecord(value: unknown, organizationId: string): OrganizationRecord {
  if (!isRecord(value)) throw new Error("The organisation record is not an object.");
  const id = value.id;
  if (typeof id !== "string" || id !== organizationId) {
    throw new Error("The organisation record ID does not match the resolved organisation.");
  }
  return { id, name: null };
}

export function useCurrentEmployee(): CurrentEmployeeState {
  const { user, loading: authLoading } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      queryClient.removeQueries({ queryKey: ["current-employee"] });
      queryClient.removeQueries({ queryKey: ["current-employee-permissions"] });
      queryClient.removeQueries({ queryKey: ["current-employee-executive"] });
    }
  }, [queryClient, userId]);

  const employeeQuery = useQuery({
    queryKey: ["current-employee", userId],
    enabled: Boolean(userId) && !authLoading,
    queryFn: async () => {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("employees")
        .select(employeeColumns)
        .eq("auth_user_id", userId!)
        .eq("employee_status", "active")
        .maybeSingle();

      if (error) throw error;
      return data ? (data as unknown as EmployeeRecord) : null;
    },
  });

  const employee = employeeQuery.data;

  const permissionsQuery = useQuery({
    queryKey: ["current-employee-permissions", userId, employee?.id ?? null],
    enabled: Boolean(userId && employee?.id),
    queryFn: async () => {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("employee_permissions")
        .select("permission_id")
        .eq("employee_id", employee!.id);

      if (error) throw error;
      return (data ?? []).map((permission) => permission.permission_id as string);
    },
  });

  const executiveQuery = useQuery({
    queryKey: ["current-employee-executive", userId, employee?.id ?? null],
    enabled: Boolean(userId && employee?.id),
    queryFn: async () => {
      const client = getSupabaseClient();
      const { data, error } = await client.rpc("current_user_is_executive");
      if (error) throw error;
      return Boolean(data);
    },
  });

  const roleQuery = useQuery({
    queryKey: ["role-by-id", employee?.role_id ?? null],
    enabled: Boolean(employee?.role_id),
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("roles")
        .select("id,name,role_level")
        .eq("id", employee!.role_id!)
        .maybeSingle();
      if (error) {
        console.warn("[role-by-id] lookup failed", error.message);
        return null;
      }
      if (!data) return null;
      return {
        id: data.id as string,
        name: (data.name as string | null) ?? null,
        role_level: (data.role_level as string | null) ?? null,
      };
    },
  });

  const deptQuery = useQuery({
    queryKey: ["department-by-id", employee?.department_id ?? null],
    enabled: Boolean(employee?.department_id),
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("departments")
        .select("id,name,department_group")
        .eq("id", employee!.department_id!)
        .maybeSingle();
      if (error) {
        console.warn("[department-by-id] lookup failed", error.message);
        return null;
      }
      if (!data) return null;
      return {
        id: data.id as string,
        name: (data.name as string | null) ?? null,
        department_group: (data.department_group as string | null) ?? null,
      };
    },
  });

  const oversightQuery = useQuery({
    queryKey: ["my-owned-departments", employee?.id ?? null],
    enabled: Boolean(employee?.id) && executiveQuery.data === true,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const client = getSupabaseClient();
      const { data, error } = await client
        .from("department_oversight")
        .select("department_id")
        .eq("executive_employee_id", employee!.id);
      if (error) {
        console.warn("[my-owned-departments] lookup failed", error.message);
        return [];
      }
      return ((data ?? []) as { department_id: string }[]).map((row) => row.department_id).filter(Boolean);
    },
  });

  const isUnauthenticated = !authLoading && !userId;
  const hasNoActiveEmployee = Boolean(userId) && employeeQuery.isSuccess && !employee;
  const metaLoading =
    (employee?.role_id ? roleQuery.isPending : false) ||
    (employee?.department_id ? deptQuery.isPending : false) ||
    (executiveQuery.data === true ? oversightQuery.isPending : false);
  const isLoading = authLoading || (Boolean(userId) && employeeQuery.isPending) || metaLoading;
  const status = isLoading
    ? "loading"
    : isUnauthenticated
      ? "unauthenticated"
      : employeeQuery.isError
        ? "error"
        : hasNoActiveEmployee
          ? "no-active-employee"
          : "active";

  const permissionIds = permissionsQuery.data ?? [];
  const currentEmployee = employee
    ? {
        ...employee,
        permissionIds,
        isExecutive: executiveQuery.data ?? null,
      }
    : null;

  const roleMeta = employee?.role_id ? (roleQuery.data ?? null) : null;
  const deptMeta = employee?.department_id ? (deptQuery.data ?? null) : null;
  const ownedDepartmentIds = executiveQuery.data === true ? (oversightQuery.data ?? []) : [];

  return {
    employee: currentEmployee,
    permissionIds,
    isExecutive: executiveQuery.data ?? null,
    roleMeta,
    deptMeta,
    ownedDepartmentIds,
    status,
    isLoading,
    isUnauthenticated,
    hasNoActiveEmployee,
    permissionsLoading: permissionsQuery.isPending,
    permissionsResolved: Boolean(employee?.id) && permissionsQuery.isSuccess,
    roleResolved: Boolean(employee?.role_id),
    departmentResolved: Boolean(employee?.department_id),
    rlsQuerySuccessful: employeeQuery.isSuccess && Boolean(employee),
    error: employeeQuery.error ? asError(employeeQuery.error) : null,
  };
}

export function useCurrentOrganisation(): CurrentOrganisationState {
  const { user, loading: authLoading } = useSupabaseAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) queryClient.removeQueries({ queryKey: ["current-organization"] });
  }, [queryClient, userId]);

  const organizationQuery = useQuery({
    queryKey: ["current-organization", userId],
    enabled: Boolean(userId) && !authLoading,
    queryFn: async () => {
      const client = getSupabaseClient();
      const { data: organizationId, error: organizationIdError } = await client.rpc("current_organization_id");
      if (organizationIdError) throw organizationIdError;
      if (organizationId === null) return null;
      if (typeof organizationId !== "string" || !organizationId.trim()) {
        throw new Error("The resolved organisation ID is invalid.");
      }

      const { data, error } = await client
        .from("organizations")
        .select("id")
        .eq("id", organizationId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      parseOrganizationRecord(data, organizationId);
      return { id: data.id, record: { id: data.id, name: null } };
    },
  });

  const isUnauthenticated = !authLoading && !userId;
  const hasNoOrganization = Boolean(userId) && organizationQuery.isSuccess && !organizationQuery.data;
  const isLoading = authLoading || (Boolean(userId) && organizationQuery.isPending);

  return {
    organization: organizationQuery.data?.record ?? null,
    organizationId: organizationQuery.data?.id ?? null,
    status: isLoading
      ? "loading"
      : isUnauthenticated
        ? "unauthenticated"
        : organizationQuery.isError
          ? "error"
          : hasNoOrganization
            ? "no-organization"
            : "active",
    isLoading,
    isUnauthenticated,
    hasNoOrganization,
    error: organizationQuery.error ? asError(organizationQuery.error) : null,
    refetch: () => organizationQuery.refetch().then((result) => result.data),
  };
}
