import { useMemo, useState } from "react";
import { ClipboardList, Trash2 } from "lucide-react";
import { useCurrentEmployee } from "@/lib/supabase-identity";
import { useOperationsDashboard } from "@/lib/operations-dashboard";
import { useCasesMutations, type CaseInput } from "@/lib/crud";
import { cn } from "@/lib/utils";
import {
  caseStatusClass,
  priorityClass,
  StateMessage,
} from "@/components/medmap/dashboard-ui";
import {
  WorkState,
  CASE_CUSTOMER_TYPES,
  CASE_PRIORITIES,
  CASE_SOURCES,
  CASE_STATUSES,
  type CaseDraft,
  type TaskManagementCentreProps,
} from "./operations-shared";

type CaseCentreProps = TaskManagementCentreProps;

export function CaseManagementCentre({ scope, showHeader = true, maxRows }: CaseCentreProps) {
  const dashboard = useOperationsDashboard(scope);
  const employeeState = useCurrentEmployee();
  const caseMutations = useCasesMutations();
  const [caseFilter, setCaseFilter] = useState("All");
  const [showAddCase, setShowAddCase] = useState(false);
  const [caseDraft, setCaseDraft] = useState<CaseDraft>({
    subject: "",
    description: "",
    priority: "medium",
    status: "open",
    source: "internal",
    assignedToEmployeeId: "",
    reportedByEmployeeId: "",
    customerType: "",
    resolutionSummary: "",
    internalNotes: "",
  });
  const data = dashboard.data;
  const cases = data?.cases ?? [];
  const caseStatusOptions = useMemo(() => {
    const statuses = new Set(cases.map((c) => c.status));
    return [
      "All",
      ...CASE_STATUSES.filter((s) => statuses.has(s)),
      ...[...statuses].filter((s) => !CASE_STATUSES.includes(s)),
    ];
  }, [cases]);
  const filteredCases = useMemo(() => {
    const base = cases.filter((c) => caseFilter === "All" || c.status === caseFilter);
    return maxRows ? base.slice(0, maxRows) : base;
  }, [cases, caseFilter, maxRows]);
  const activeEmployees = (data?.employees ?? []).filter(
    (employee) => employee.employee_status.trim().toLowerCase() === "active",
  );
  const updateCaseDraft = (key: keyof CaseDraft, value: string) =>
    setCaseDraft((current) => ({ ...current, [key]: value }));

  const submitCase = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!caseDraft.subject.trim() || !caseDraft.description.trim()) return;
    try {
      await caseMutations.createCase.mutateAsync({
        subject: caseDraft.subject.trim(),
        description: caseDraft.description.trim() || null,
        priority: (caseDraft.priority as "low" | "medium" | "high" | "critical") || "medium",
        status: (caseDraft.status as CaseInput["status"]) || "open",
        source: (caseDraft.source as CaseInput["source"]) || "internal",
        assignedToEmployeeId: caseDraft.assignedToEmployeeId || null,
        reportedByEmployeeId: caseDraft.reportedByEmployeeId || employeeState.employee?.id || null,
        customerType: (caseDraft.customerType as CaseInput["customerType"]) || null,
        resolutionSummary: caseDraft.resolutionSummary.trim() || null,
        internalNotes: caseDraft.internalNotes.trim() || null,
      });
      setCaseDraft({
        subject: "",
        description: "",
        priority: "medium",
        status: "open",
        source: "internal",
        assignedToEmployeeId: "",
        reportedByEmployeeId: "",
        customerType: "",
        resolutionSummary: "",
        internalNotes: "",
      });
      setShowAddCase(false);
    } catch {
      return;
    }
  };

  const hasAny = caseFilter === "All" || filteredCases.length > 0 || cases.length > 0;
  const emptyWhen = caseFilter !== "All" ? !filteredCases.length : !cases.length;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_5px_20px_rgba(21,36,58,0.035)]">
      {showHeader && (
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#ece7ff] text-[#755bc0]">
                <ClipboardList size={16} />
              </span>
              <h2 className="font-display text-[16px] font-bold text-[#152239]">
                Case management centre
              </h2>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Live customer cases with status, assignment and resolution tracking.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddCase((current) => !current)}
              className="inline-flex items-center gap-1 rounded-xl bg-[#755bc0] px-3 py-1.5 text-[10px] font-bold text-white hover:bg-[#5f47a5]"
            >
              <ClipboardList size={12} /> {showAddCase ? "Hide form" : "New case"}
            </button>
            <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {caseStatusOptions.map((status) => (
                <button
                  type="button"
                  key={status}
                  onClick={() => setCaseFilter(status)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-[10px] font-bold",
                    caseFilter === status
                      ? "bg-white text-[#755bc0] shadow-sm"
                      : "text-slate-400",
                  )}
                >
                  {status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAddCase && (
        <form
          onSubmit={submitCase}
          className="border-b border-slate-100 bg-[#f5f2ff] p-5 sm:p-6"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-[10px] font-bold text-slate-500 sm:col-span-2">
              Subject *
              <input
                required
                value={caseDraft.subject}
                onChange={(event) => updateCaseDraft("subject", event.target.value)}
                className="form-input"
                placeholder="Case subject line"
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500">
              Priority
              <select
                value={caseDraft.priority}
                onChange={(event) => updateCaseDraft("priority", event.target.value)}
                className="form-input"
              >
                {CASE_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-bold text-slate-500">
              Status
              <select
                value={caseDraft.status}
                onChange={(event) => updateCaseDraft("status", event.target.value)}
                className="form-input"
              >
                {CASE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-bold text-slate-500">
              Source
              <select
                value={caseDraft.source}
                onChange={(event) => updateCaseDraft("source", event.target.value)}
                className="form-input"
              >
                {CASE_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-bold text-slate-500">
              Customer type
              <select
                value={caseDraft.customerType}
                onChange={(event) => updateCaseDraft("customerType", event.target.value)}
                className="form-input"
              >
                <option value="">Not specified</option>
                {CASE_CUSTOMER_TYPES.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct.charAt(0).toUpperCase() + ct.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-bold text-slate-500">
              Reported by
              <select
                value={caseDraft.reportedByEmployeeId}
                onChange={(event) => updateCaseDraft("reportedByEmployeeId", event.target.value)}
                className="form-input"
              >
                <option value="">Current employee</option>
                {activeEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {`${employee.first_name} ${employee.last_name}`.trim()}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-bold text-slate-500">
              Assigned to
              <select
                value={caseDraft.assignedToEmployeeId}
                onChange={(event) => updateCaseDraft("assignedToEmployeeId", event.target.value)}
                className="form-input"
              >
                <option value="">Unassigned</option>
                {activeEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {`${employee.first_name} ${employee.last_name}`.trim()}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-bold text-slate-500 sm:col-span-2 lg:col-span-4">
              Description *
              <textarea
                required
                value={caseDraft.description}
                onChange={(event) => updateCaseDraft("description", event.target.value)}
                className="form-input min-h-20 resize-y"
                placeholder="Full case description and customer context."
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500 sm:col-span-2 lg:col-span-2">
              Resolution summary
              <textarea
                value={caseDraft.resolutionSummary}
                onChange={(event) => updateCaseDraft("resolutionSummary", event.target.value)}
                className="form-input min-h-16 resize-y"
                placeholder="Resolution details (for resolved/closed cases)."
              />
            </label>
            <label className="text-[10px] font-bold text-slate-500 sm:col-span-2 lg:col-span-2">
              Internal notes
              <textarea
                value={caseDraft.internalNotes}
                onChange={(event) => updateCaseDraft("internalNotes", event.target.value)}
                className="form-input min-h-16 resize-y"
                placeholder="Private internal notes — not customer-facing."
              />
            </label>
          </div>
          {caseMutations.createCase.isError && (
            <div className="mt-4">
              <StateMessage tone="error">
                The case could not be created. Check the connection and try again.
              </StateMessage>
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddCase(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-bold text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={caseMutations.createCase.isPending}
              className="rounded-xl bg-[#755bc0] px-4 py-2.5 text-[11px] font-bold text-white hover:bg-[#5f47a5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {caseMutations.createCase.isPending ? "Creating..." : "Create case"}
            </button>
          </div>
        </form>
      )}

      <WorkState
        pending={dashboard.isPending}
        error={dashboard.isError}
        empty={emptyWhen}
      >
        No live customer cases match this filter.
      </WorkState>
      {hasAny && filteredCases.length > 0 && !dashboard.isPending && !dashboard.isError && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                <th className="px-5 py-3 font-bold sm:px-6">Case</th>
                <th className="px-3 py-3 font-bold">Assigned to</th>
                <th className="px-3 py-3 font-bold">Priority</th>
                <th className="px-3 py-3 font-bold">Status</th>
                <th className="px-3 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-50 text-[11px] last:border-0 align-top"
                >
                  <td className="px-5 py-4 sm:px-6">
                    <p className="font-bold text-slate-700">
                      {c.subject || "Untitled case"}
                    </p>
                    {c.description && (
                      <p className="mt-1 text-[10px] text-slate-400 line-clamp-2 max-w-md">
                        {c.description}
                      </p>
                    )}
                    {c.resolution_summary && (
                      <p className="mt-2 text-[10px] text-[#168465] line-clamp-2 max-w-md">
                        Resolution: {c.resolution_summary}
                      </p>
                    )}
                    {c.internal_notes && (
                      <p className="mt-1 text-[10px] text-slate-500 line-clamp-1 max-w-md italic">
                        Internal: {c.internal_notes}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <select
                      value={c.assigned_to_employee_id ?? ""}
                      onChange={(event) =>
                        caseMutations.updateCase.mutate({
                          id: c.id,
                          assignedToEmployeeId: event.target.value || null,
                        })
                      }
                      className="form-input !py-1 text-[10px]"
                    >
                      <option value="">Unassigned</option>
                      {activeEmployees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {`${employee.first_name} ${employee.last_name}`.trim()}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-1 text-[10px] font-bold",
                        priorityClass(c.priority),
                      )}
                    >
                      {c.priority || "Priority not provided"}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <select
                      value={c.status}
                      onChange={(event) =>
                        caseMutations.updateCaseStatus.mutate({
                          id: c.id,
                          status: event.target.value as CaseInput["status"],
                        })
                      }
                      className={cn(
                        "rounded-full border-0 px-2 py-1 text-[10px] font-bold outline-none",
                        caseStatusClass(c.status),
                      )}
                    >
                      {CASE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ").replace(/\b\w/g, (ch) => ch.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-1">
                      {c.status !== "resolved" &&
                        c.status !== "closed" &&
                        c.status !== "cancelled" && (
                          <button
                            type="button"
                            onClick={() =>
                              caseMutations.updateCaseStatus.mutate({
                                id: c.id,
                                status: "resolved",
                              })
                            }
                            disabled={caseMutations.updateCaseStatus.isPending}
                            className="rounded-lg bg-[#e8f8f2] px-2 py-1 text-[10px] font-bold text-[#168465] hover:bg-[#d4f2e6] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Resolve
                          </button>
                        )}
                      {c.status !== "closed" && c.status !== "cancelled" && (
                        <button
                          type="button"
                          onClick={() =>
                            caseMutations.updateCaseStatus.mutate({
                              id: c.id,
                              status: "closed",
                            })
                          }
                          disabled={caseMutations.updateCaseStatus.isPending}
                          className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Close
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => caseMutations.deleteCase.mutate(c.id)}
                        disabled={caseMutations.deleteCase.isPending}
                        className="rounded-lg p-2 text-slate-400 hover:bg-[#fff0ee] hover:text-[#bd504d] disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Delete case ${c.subject}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(caseMutations.updateCaseStatus.isError ||
        caseMutations.updateCase.isError ||
        caseMutations.deleteCase.isError) && (
        <div className="p-5">
          <StateMessage tone="error">
            The case change could not be saved. Check the connection and try again.
          </StateMessage>
        </div>
      )}
    </section>
  );
}
