import React, { Component, Suspense, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { AppShell } from "@/components/medmap/AppShell";
import { useCurrentEmployee } from "@/lib/supabase-identity";
import { useRoleScope } from "@/lib/dashboard-scope";

const CeoDashboard = React.lazy(() =>
  import("./Index").then((m) => ({ default: m.CeoDashboard })),
);
const CooDashboard = React.lazy(() => import("./CooDashboard"));
const CtoDashboard = React.lazy(() => import("./CtoDashboard"));
const EmployeeDashboard = React.lazy(() => import("./EmployeeDashboard"));

function DashboardSkeleton() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-5 pb-12 pt-8 sm:px-8 xl:px-10">
        <div className="animate-pulse space-y-5">
          <div className="h-12 w-1/3 rounded-xl bg-slate-100" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl border border-slate-200 bg-slate-50" />
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="h-72 rounded-2xl border border-slate-200 bg-slate-50" />
            <div className="h-72 rounded-2xl border border-slate-200 bg-slate-50" />
          </div>
          <div className="h-10 rounded-xl bg-slate-100 text-center text-[13px] font-bold text-slate-400">
            Loading your dashboard…
          </div>
        </div>
      </div>
    </AppShell>
  );
}

type DashboardRouterErrorBoundaryProps = {
  fallbackEmployeeId?: string;
  children: React.ReactNode;
};

type DashboardRouterErrorBoundaryState = { error: Error | null };

class DashboardRouterErrorBoundary extends Component<
  DashboardRouterErrorBoundaryProps,
  DashboardRouterErrorBoundaryState
> {
  override state: DashboardRouterErrorBoundaryState = { error: null };
  static getDerivedStateFromError(error: Error): DashboardRouterErrorBoundaryState {
    return { error };
  }
  override componentDidCatch(error: Error) {
    console.warn("[DashboardRouter] ErrorBoundary caught:", error.message);
  }
  override render() {
    if (this.state.error) {
      const EmployeeComponent = EmployeeDashboard;
      const fallbackScope = {
        employeeId: this.props.fallbackEmployeeId ?? "fallback",
      } as const;
      return (
        <Suspense fallback={<DashboardSkeleton />}>
          <EmployeeComponent variant="employee" scope={fallbackScope} />
        </Suspense>
      );
    }
    return this.props.children;
  }
}

export default function DashboardRouter() {
  const identity = useCurrentEmployee();
  const { status, employee } = identity;
  const { roleKind, departmentIds, isPending: scopePending } = useRoleScope();

  const dispatchLoading = status === "loading" || scopePending;

  useEffect(() => {
    if (roleKind && status === "active" && employee?.id) {
      console.debug("[DashboardRouter] role dispatch", {
        employeeId: employee.id,
        roleKind,
        departmentIds,
      });
    }
  }, [roleKind, status, employee?.id, departmentIds]);

  if (status === "no-active-employee" || status === "error") {
    return <Navigate to="/sign-in" replace />;
  }

  if (dispatchLoading || !employee?.id) {
    return <DashboardSkeleton />;
  }

  const executiveScope = { departmentIds, executiveEmployeeId: employee.id };

  const scopeForRole = {
    employeeId: employee.id,
    departmentId: employee.department_id ?? undefined,
    teamId: employee.team_id ?? undefined,
    managerId: employee.manager_id ?? undefined,
  };

  const renderByRole = () => {
    switch (roleKind) {
      case "ceo":
        return <CeoDashboard />;
      case "coo":
        return <CooDashboard scope={executiveScope} />;
      case "cto":
        return <CtoDashboard scope={executiveScope} />;
      case "executive_other":
        return (
          <EmployeeDashboard
            variant="executive_other"
            scope={{ ...scopeForRole, departmentIds }}
          />
        );
      case "department_head":
        return (
          <EmployeeDashboard
            variant="department_head"
            scope={scopeForRole}
          />
        );
      case "manager":
        return (
          <EmployeeDashboard variant="manager" scope={scopeForRole} />
        );
      case "employee":
      default:
        return (
          <EmployeeDashboard variant="employee" scope={scopeForRole} />
        );
    }
  };

  return (
    <DashboardRouterErrorBoundary fallbackEmployeeId={employee?.id}>
      <Suspense fallback={<DashboardSkeleton />}>{renderByRole()}</Suspense>
    </DashboardRouterErrorBoundary>
  );
}
