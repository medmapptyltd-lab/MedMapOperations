import { useCurrentEmployee } from "@/lib/supabase-identity";
import { classifyRoleKind } from "@/lib/role-classify";

export type RoleGate = {
  permissionKeys?: string[];
  roleKinds?: ReturnType<typeof classifyRoleKind>[];
  executiveOnly?: boolean;
  fallback?: React.ReactNode;
};

export function IfPermitted(
  props: RoleGate & { children: React.ReactNode },
) {
  const {
    permissionKeys,
    roleKinds,
    executiveOnly,
    fallback = null,
    children,
  } = props;
  const state = useCurrentEmployee();
  if (state.status !== "active") return <>{fallback}</>;
  if (state.isExecutive === true) return <>{children}</>;
  if (executiveOnly) return <>{fallback}</>;
  if (roleKinds && state.roleMeta?.name && state.employee) {
    const kind = classifyRoleKind({
      job_title: state.employee.job_title ?? null,
      roleName: state.roleMeta?.name ?? null,
      roleLevel: state.roleMeta?.role_level ?? null,
      isExecutive: state.isExecutive,
    });
    if (!roleKinds.includes(kind)) return <>{fallback}</>;
  }
  if (permissionKeys?.length) {
    const hasAll = permissionKeys.every((pk) => state.permissionIds.includes(pk));
    if (!hasAll) return <>{fallback}</>;
  }
  return <>{children}</>;
}
