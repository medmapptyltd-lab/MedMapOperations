import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "./supabase";
import { useCurrentEmployee, useCurrentOrganisation } from "./supabase-identity";
import { classifyRoleKind, type RoleKind } from "./role-classify";

export type DepartmentGroup = "operations" | "technology";

export function useGroupDepartmentIds(
  group: DepartmentGroup,
  organizationId: string | null,
) {
  return useQuery({
    queryKey: ["group-department-ids", group, organizationId],
    enabled: Boolean(organizationId),
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await getSupabaseClient()
        .from("departments")
        .select("id")
        .eq("organization_id", organizationId!)
        .eq("department_group", group);
      if (error) throw error;
      return ((data ?? []) as { id: string }[]).map((row) => row.id).filter(Boolean);
    },
  });
}

export type RoleScope = {
  roleKind: RoleKind;
  /** Department ids the role is accountable for (operations/technology group + owned). */
  departmentIds: string[];
  employeeId: string | null;
  /** True when the role's views should be filtered to departmentIds (COO/CTO). */
  isDepartmentScoped: boolean;
  isPending: boolean;
};

/**
 * Resolves the current user's role and the departments their role is accountable
 * for. COO and CTO are scoped to their department group plus any owned
 * departments; every other role sees the whole organisation (empty scope).
 */
export function useRoleScope(): RoleScope {
  const identity = useCurrentEmployee();
  const organisation = useCurrentOrganisation();
  const organizationId =
    organisation.organizationId ?? identity.employee?.organization_id ?? null;

  const { status, employee, roleMeta, isExecutive, ownedDepartmentIds } = identity;

  const roleKind = classifyRoleKind({
    job_title: employee?.job_title ?? null,
    roleName: roleMeta?.name ?? null,
    roleLevel: roleMeta?.role_level ?? null,
    isExecutive,
  });

  const opsGroupQuery = useGroupDepartmentIds("operations", organizationId);
  const techGroupQuery = useGroupDepartmentIds("technology", organizationId);

  const isDepartmentScoped = roleKind === "coo" || roleKind === "cto";
  const groupDepartmentIds = roleKind === "coo"
    ? opsGroupQuery.data ?? []
    : roleKind === "cto"
      ? techGroupQuery.data ?? []
      : [];

  const departmentIds = Array.from(
    new Set([...groupDepartmentIds, ...(ownedDepartmentIds ?? [])]),
  );

  const isPending =
    status === "loading" ||
    (isDepartmentScoped && (opsGroupQuery.isPending || techGroupQuery.isPending));

  return {
    roleKind,
    departmentIds,
    employeeId: employee?.id ?? null,
    isDepartmentScoped,
    isPending,
  };
}
