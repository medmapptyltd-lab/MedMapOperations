import { useMemo, useState } from "react";
import { CheckSquare, Clock3, Trash2 } from "lucide-react";
import { useCurrentEmployee } from "@/lib/supabase-identity";
import { useOperationsDashboard } from "@/lib/operations-dashboard";
import { useOperationsTaskActions } from "@/lib/crud";
import { cn } from "@/lib/utils";
import {
  formatLiveDate,
  priorityClass,
  statusClass,
  StateMessage,
} from "@/components/medmap/dashboard-ui";
import { WorkState, type TaskManagementCentreProps } from "./operations-shared";

export type { TaskManagementCentreProps } from "./operations-shared";

export function TaskManagementCentre({ scope, showHeader = true, maxRows }: TaskManagementCentreProps) {
  const dashboard = useOperationsDashboard(scope);
  const employeeState = useCurrentEmployee();
  const taskActions = useOperationsTaskActions();
  const [taskFilter, setTaskFilter] = useState("All");
  const data = dashboard.data;
  const tasks = data?.tasks ?? [];
  const TASK_STATUSES_LOCAL = ["not_started", "in_progress", "blocked", "completed", "cancelled"];
  const taskStatuses = useMemo(() => {
    const statuses = new Set(tasks.map((task) => task.status));
    return ["All", ...TASK_STATUSES_LOCAL.filter((s) => statuses.has(s)), ...[...statuses].filter((s) => !TASK_STATUSES_LOCAL.includes(s))];
  }, [tasks]);
  const filteredTasks = useMemo(() => {
    const base = tasks.filter((task) => taskFilter === "All" || task.status === taskFilter);
    return maxRows ? base.slice(0, maxRows) : base;
  }, [tasks, taskFilter, maxRows]);
  const activeEmployees = (data?.employees ?? []).filter(
    (employee) => employee.employee_status.trim().toLowerCase() === "active",
  );
  const hasAny = taskFilter === "All" || filteredTasks.length > 0 || tasks.length > 0;
  const emptyWhen = taskFilter !== "All" ? !filteredTasks.length : !tasks.length;
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_5px_20px_rgba(21,36,58,0.035)]">
      {showHeader && (
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#e4edfc] text-[#4a87c9]">
                <CheckSquare size={16} />
              </span>
              <h2 className="font-display text-[16px] font-bold text-[#152239]">
                Task management centre
              </h2>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Live operational tasks with status, assignee and progress tracking.
            </p>
          </div>
          <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            {taskStatuses.map((status) => (
              <button
                type="button"
                key={status}
                onClick={() => setTaskFilter(status)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[10px] font-bold",
                  taskFilter === status
                    ? "bg-white text-[#4a87c9] shadow-sm"
                    : "text-slate-400",
                )}
              >
                {status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      )}
      <WorkState
        pending={dashboard.isPending}
        error={dashboard.isError}
        empty={emptyWhen}
      >
        No live tasks match this filter.
      </WorkState>
      {hasAny && filteredTasks.length > 0 && !dashboard.isPending && !dashboard.isError && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                <th className="px-5 py-3 font-bold sm:px-6">Task</th>
                <th className="px-3 py-3 font-bold">Assignee</th>
                <th className="px-3 py-3 font-bold">Status</th>
                <th className="px-3 py-3 font-bold">Progress</th>
                <th className="px-3 py-3 font-bold">Due</th>
                <th className="px-3 py-3 font-bold">Priority</th>
                <th className="px-3 py-3 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-slate-50 text-[11px] last:border-0"
                >
                  <td className="px-5 py-4 sm:px-6">
                    <p className="font-bold text-slate-700">
                      {task.title || "Untitled task"}
                    </p>
                    {task.description && (
                      <p className="mt-1 text-[10px] text-slate-400 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <select
                      value={task.assigned_to ?? ""}
                      onChange={(event) =>
                        taskActions.updateTaskAssignee.mutate({
                          id: task.id,
                          assignedTo: event.target.value || null,
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
                    <select
                      value={task.status}
                      onChange={(event) =>
                        taskActions.updateTaskStatus.mutate({
                          id: task.id,
                          status: event.target.value as never,
                        })
                      }
                      className={cn(
                        "rounded-full border-0 px-2 py-1 text-[10px] font-bold outline-none",
                        statusClass(task.status),
                      )}
                    >
                      {TASK_STATUSES_LOCAL.map((status) => (
                        <option key={status} value={status}>
                          {status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-4 text-slate-500">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={task.progress_percentage ?? 0}
                        onChange={(event) =>
                          taskActions.updateTaskProgress.mutate({
                            id: task.id,
                            progressPercentage: Number(event.target.value),
                          })
                        }
                        className="form-input !py-1 !w-20 text-[10px]"
                      />
                      <span className="text-[10px] font-bold">%</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 size={12} />
                      {formatLiveDate(task.due_date)}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-[10px] font-bold",
                        priorityClass(task.priority),
                      )}
                    >
                      {task.priority || "Priority not provided"}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <button
                      type="button"
                      onClick={() => taskActions.deleteTask.mutate(task.id)}
                      disabled={taskActions.deleteTask.isPending}
                      className="rounded-lg p-2 text-slate-400 hover:bg-[#fff0ee] hover:text-[#bd504d] disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Delete ${task.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(taskActions.updateTaskStatus.isError ||
        taskActions.updateTaskProgress.isError ||
        taskActions.updateTaskAssignee.isError ||
        taskActions.deleteTask.isError) && (
        <div className="p-5">
          <StateMessage tone="error">
            The task change could not be saved. Check the connection and try again.
          </StateMessage>
        </div>
      )}
    </section>
  );
}
