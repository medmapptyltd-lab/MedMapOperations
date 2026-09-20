import { useQuery } from "@tanstack/react-query";
import { useSupabaseAuth } from "./supabase-auth";
import { getSupabaseClient } from "./supabase";
import { useCurrentOrganisation } from "./supabase-identity";

export type OrganisationDepartment = {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description: string | null;
  department_group: string | null;
  active: boolean;
};

export type OrganisationTeam = {
  id: string;
  department_id: string | null;
  name: string;
  description: string | null;
  active: boolean;
};

export type OrganisationRole = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
};

export type OrganisationPermission = {
  id: string;
  name: string;
  description: string | null;
};

export type OrganisationEmployee = {
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
  role: OrganisationRole | null;
  department: OrganisationDepartment | null;
  team: OrganisationTeam | null;
  manager: OrganisationEmployee | null;
  permissionIds: string[];
  permissions: OrganisationPermission[];
};

type EmployeePermission = {
  employee_id: string;
  permission_id: string;
};

export type PeopleOrganisationData = {
  organizationId: string;
  employees: OrganisationEmployee[];
  departments: OrganisationDepartment[];
  teams: OrganisationTeam[];
};

type QueryState = {
  data: PeopleOrganisationData | undefined;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
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
].join(", ");

const departmentColumns =
  "id, organization_id, code, name, description, department_group, active";
const teamColumns = "id, department_id, name, description, active";
const roleColumns = "id, name, description, active";
const permissionColumns = "id, name, description";

function rows<T>(value: unknown) {
  return (Array.isArray(value) ? value : []) as T[];
}

async function fetchPeopleOrganisation(
  organizationId: string,
): Promise<PeopleOrganisationData> {
  const client = getSupabaseClient();
  const [departmentsResult, employeesResult] = await Promise.all([
    client
      .from("departments")
      .select(departmentColumns)
      .eq("organization_id", organizationId),
    client
      .from("employees")
      .select(employeeColumns)
      .eq("organization_id", organizationId),
  ]);

  if (departmentsResult.error) throw departmentsResult.error;
  if (employeesResult.error) throw employeesResult.error;

  const departments = rows<OrganisationDepartment>(departmentsResult.data);
  const employees = rows<Omit<OrganisationEmployee, "role" | "department" | "team" | "manager" | "permissionIds" | "permissions">>(employeesResult.data);
  const departmentIds = departments.map((department) => department.id);
  const employeeIds = employees.map((employee) => employee.id);
  const roleIds = employees.flatMap((employee) =>
    employee.role_id ? [employee.role_id] : [],
  );
  const permissionLinksResult = employeeIds.length
    ? await client
        .from("employee_permissions")
        .select("employee_id, permission_id")
        .in("employee_id", employeeIds)
    : { data: [], error: null };

  if (permissionLinksResult.error) throw permissionLinksResult.error;

  const permissionLinks = rows<EmployeePermission>(permissionLinksResult.data);
  const permissionIds = [...new Set(permissionLinks.map((link) => link.permission_id))];
  const [teamsResult, rolesResult, permissionsResult] = await Promise.all([
    departmentIds.length
      ? client
          .from("teams")
          .select(teamColumns)
          .in("department_id", departmentIds)
      : Promise.resolve({ data: [], error: null }),
    roleIds.length
      ? client
          .from("roles")
          .select(roleColumns)
          .in("id", [...new Set(roleIds)])
      : Promise.resolve({ data: [], error: null }),
    permissionIds.length
      ? client
          .from("permissions")
          .select(permissionColumns)
          .in("id", permissionIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (teamsResult.error) throw teamsResult.error;
  if (rolesResult.error) throw rolesResult.error;
  if (permissionsResult.error) throw permissionsResult.error;

  const teams = rows<OrganisationTeam>(teamsResult.data);
  const roles = rows<OrganisationRole>(rolesResult.data);
  const permissions = rows<OrganisationPermission>(permissionsResult.data);
  const departmentById = new Map(departments.map((department) => [department.id, department]));
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const roleById = new Map(roles.map((role) => [role.id, role]));
  const permissionById = new Map(permissions.map((permission) => [permission.id, permission]));
  const employeeById = new Map(employees.map((employee) => [employee.id, employee]));
  const permissionsByEmployee = new Map<string, string[]>();

  for (const link of permissionLinks) {
    const current = permissionsByEmployee.get(link.employee_id) ?? [];
    current.push(link.permission_id);
    permissionsByEmployee.set(link.employee_id, current);
  }

  const resolvedEmployees = employees.map((employee) => {
    const employeePermissionIds = permissionsByEmployee.get(employee.id) ?? [];
    return {
      ...employee,
      role: employee.role_id ? roleById.get(employee.role_id) ?? null : null,
      department: employee.department_id
        ? departmentById.get(employee.department_id) ?? null
        : null,
      team: employee.team_id ? teamById.get(employee.team_id) ?? null : null,
      manager: employee.manager_id
        ? (employeeById.get(employee.manager_id) as OrganisationEmployee | undefined) ?? null
        : null,
      permissionIds: employeePermissionIds,
      permissions: employeePermissionIds.flatMap((permissionId) => {
        const permission = permissionById.get(permissionId);
        return permission ? [permission] : [];
      }),
    } satisfies OrganisationEmployee;
  });

  const resolvedById = new Map(resolvedEmployees.map((employee) => [employee.id, employee]));
  return {
    organizationId,
    departments,
    teams,
    employees: resolvedEmployees.map((employee) => ({
      ...employee,
      manager: employee.manager_id ? resolvedById.get(employee.manager_id) ?? null : null,
    })),
  };
}

export function usePeopleOrganisation(): QueryState {
  const { user, loading: authLoading } = useSupabaseAuth();
  const organisationState = useCurrentOrganisation();
  const organizationId = organisationState.organizationId;
  const enabled = Boolean(
    user &&
      !authLoading &&
      !organisationState.isLoading &&
      !organisationState.error &&
      organizationId,
  );
  const query = useQuery({
    queryKey: ["people-organisation", user?.id ?? null, organizationId],
    enabled,
    queryFn: () => fetchPeopleOrganisation(organizationId!),
    staleTime: 30_000,
  });
  const error = organisationState.error ?? (query.error instanceof Error ? query.error : null);

  return {
    data: query.data,
    isPending: authLoading || organisationState.isLoading || (enabled && query.isPending),
    isError: Boolean(error),
    error,
  };
}
