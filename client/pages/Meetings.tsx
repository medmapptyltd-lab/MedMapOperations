import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Pencil,
  Plus,
  Save,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/medmap/AppShell";
import { IfPermitted } from "@/components/medmap/IfPermitted";
import { useOperationsDashboard } from "@/lib/operations-dashboard";
import { normaliseStatus, isResolvedStatus } from "@/lib/executive-dashboard";
import {
  useMeetingsMutations,
  useDeadlinesMutations,
  type MeetingInput,
  type DeadlineInput,
} from "@/lib/crud";
import { getSupabaseClient } from "@/lib/supabase";
import { useCurrentOrganisation } from "@/lib/supabase-identity";
import { cn } from "@/lib/utils";

type SectionState = "loading" | "empty" | "error" | "ready";

function getSectionState<T>(
  isPending: boolean,
  isError: boolean,
  items: readonly T[] | undefined,
): SectionState {
  if (isPending) return "loading";
  if (isError) return "error";
  if (!items || items.length === 0) return "empty";
  return "ready";
}

type MeetingRow = {
  id: string;
  organization_id: string | null;
  department_id: string | null;
  title: string;
  meeting_type: string;
  meeting_date: string;
  duration_minutes: number | null;
  location: string | null;
  status: string;
  chair_employee_id: string | null;
  created_by: string | null;
  summary: string | null;
  notes: string | null;
};

function parseMeetingRow(row: Record<string, unknown>): MeetingRow {
  return {
    id: typeof row.id === "string" ? row.id : "",
    organization_id: typeof row.organization_id === "string" ? row.organization_id : null,
    department_id: typeof row.department_id === "string" ? row.department_id : null,
    title: typeof row.title === "string" ? row.title : "",
    meeting_type: typeof row.meeting_type === "string" ? row.meeting_type : "other",
    meeting_date: typeof row.meeting_date === "string" ? row.meeting_date : "",
    duration_minutes: typeof row.duration_minutes === "number" ? row.duration_minutes : null,
    location: typeof row.location === "string" ? row.location : null,
    status: typeof row.status === "string" ? row.status : "scheduled",
    chair_employee_id: typeof row.chair_employee_id === "string" ? row.chair_employee_id : null,
    created_by: typeof row.created_by === "string" ? row.created_by : null,
    summary: typeof row.summary === "string" ? row.summary : null,
    notes: typeof row.notes === "string" ? row.notes : null,
  };
}

function useMeetingsQuery() {
  const organizationState = useCurrentOrganisation();
  const organizationId = organizationState.organizationId;
  return useQuery({
    queryKey: ["meetings", organizationId],
    enabled: Boolean(organizationId && !organizationState.isLoading),
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await getSupabaseClient()
        .from("meetings")
        .select(
          "id, organization_id, department_id, title, meeting_type, meeting_date, duration_minutes, location, status, chair_employee_id, created_by, summary, notes",
        )
        .eq("organization_id", organizationId);
      if (error) throw error;
      return (Array.isArray(data) ? data : [])
        .filter((row) => typeof row === "object" && row !== null)
        .map((row) => parseMeetingRow(row as Record<string, unknown>));
    },
    staleTime: 30_000,
  });
}

function SectionLoading({ label }: { label: string }) {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto grid size-10 place-items-center rounded-xl bg-slate-100">
        <CalendarDays size={18} className="animate-pulse text-slate-400" />
      </div>
      <p className="mt-3 text-[11px] font-medium text-slate-400">Loading {label}…</p>
    </div>
  );
}

function SectionError({ label, message }: { label: string; message?: string }) {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto grid size-10 place-items-center rounded-xl bg-[#ffe5e3]">
        <Target size={18} className="text-[#bd504d]" />
      </div>
      <p className="mt-3 text-[11px] font-bold text-[#bd504d]">Could not load {label}</p>
      <p className="mt-1 text-[10px] text-slate-400">
        {message ?? "Refresh the page and try again."}
      </p>
    </div>
  );
}

function SectionEmpty({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto grid size-10 place-items-center rounded-xl bg-slate-50">
        <ClipboardCheck size={18} className="text-slate-400" />
      </div>
      <p className="mt-3 text-[11px] font-medium text-slate-500">No {label} yet</p>
      <p className="mt-1 text-[10px] text-slate-400">{hint}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_5px_20px_rgba(21,36,58,0.035)]">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-slate-400">{label}</p>
        <Icon size={16} className="text-[#755bc0]" />
      </div>
      <p className="mt-2 font-display text-[23px] font-bold tracking-[-0.06em] text-[#152239]">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold text-[#755bc0]">{detail}</p>
    </div>
  );
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

const today = () => new Date().toISOString().slice(0, 10);

const emptyMeeting: MeetingInput = {
  title: "",
  meetingType: "operations",
  meetingDate: today(),
  durationMinutes: 60,
  location: "",
  status: "scheduled",
  summary: "",
  notes: "",
};

export default function Meetings() {
  const meetingsQuery = useMeetingsQuery();
  const operationsQuery = useOperationsDashboard();
  const { createMeeting, updateMeeting, deleteMeeting } = useMeetingsMutations();
  const { createDeadline, updateDeadline, deleteDeadline } = useDeadlinesMutations();

  const meetings = meetingsQuery.data ?? [];
  const deadlines = operationsQuery.data?.deadlines ?? [];
  const employees = operationsQuery.data?.employees ?? [];
  const departments = operationsQuery.data?.departments ?? [];

  const openDeadlines = useMemo(
    () =>
      deadlines
        .filter((deadline) => !isResolvedStatus(deadline.status))
        .sort((a, b) => a.due_at.localeCompare(b.due_at)),
    [deadlines],
  );

  const meetingsState = getSectionState(
    meetingsQuery.isPending,
    meetingsQuery.isError,
    meetings,
  );
  const deadlinesState = getSectionState(
    operationsQuery.isPending,
    operationsQuery.isError,
    deadlines,
  );

  const [meetingForm, setMeetingForm] = useState<MeetingInput>(emptyMeeting);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [deadlineForm, setDeadlineForm] = useState<DeadlineInput>({
    title: "",
    dueAt: today(),
    description: "",
    priority: "medium",
    status: "open",
    ownerEmployeeId: employees[0]?.id ?? null,
    departmentId: departments[0]?.id ?? null,
  });

  const submitMeeting = (event: FormEvent) => {
    event.preventDefault();
    if (!meetingForm.title.trim()) return;
    if (editingMeetingId) {
      void updateMeeting.mutateAsync({ id: editingMeetingId, patch: meetingForm });
    } else {
      void createMeeting.mutateAsync(meetingForm);
    }
    setMeetingForm({ ...emptyMeeting, meetingDate: meetingForm.meetingDate });
    setEditingMeetingId(null);
  };

  const startEditingMeeting = (meeting: MeetingRow) => {
    setEditingMeetingId(meeting.id);
    setMeetingForm({
      title: meeting.title,
      meetingType: (meeting.meeting_type as MeetingInput["meetingType"]) ?? "other",
      meetingDate: meeting.meeting_date,
      durationMinutes: meeting.duration_minutes ?? undefined,
      location: meeting.location ?? undefined,
      status: (meeting.status as MeetingInput["status"]) ?? "scheduled",
      summary: meeting.summary ?? undefined,
      notes: meeting.notes ?? undefined,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitDeadline = (event: FormEvent) => {
    event.preventDefault();
    if (!deadlineForm.title.trim()) return;
    void createDeadline.mutateAsync(deadlineForm);
    setDeadlineForm((current) => ({
      ...current,
      title: "",
      description: "",
    }));
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-5 pb-12 pt-8 sm:px-8 xl:px-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#755bc0]">
              <CalendarDays size={13} /> Meetings & accountability
            </div>
            <h1 className="font-display text-[32px] font-bold tracking-[-0.06em] text-[#152239] sm:text-[39px]">
              Turn meetings into owned outcomes.
            </h1>
            <p className="mt-2 max-w-[720px] text-[13px] leading-6 text-slate-500">
              Record the conversation and keep every deadline that comes out of it visible until it
              has an accountable owner.
            </p>
          </div>
          <IfPermitted
            roleKinds={["ceo", "coo", "cto", "executive_other", "department_head", "manager"]}
          >
            <a
              href="#record"
              className="inline-flex items-center gap-2 self-start rounded-xl bg-[#182842] px-3.5 py-2.5 text-[11px] font-bold text-white shadow-[0_5px_12px_rgba(20,35,58,.15)] hover:bg-[#233958] md:self-auto"
            >
              <Plus size={15} /> Record a meeting
            </a>
          </IfPermitted>
        </div>

        <section className="mt-7 grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Meeting records"
            value={String(meetings.length)}
            detail={operationsQuery.isPending ? "…" : "From Supabase meetings table"}
            icon={FileText}
          />
          <SummaryCard
            label="Open deadlines"
            value={String(openDeadlines.length)}
            detail="Need an owner or follow-up"
            icon={ClipboardCheck}
          />
          <SummaryCard
            label="Team members"
            value={String(employees.filter((e) => normaliseStatus(e.employee_status) === "active").length)}
            detail="Active employees"
            icon={CheckCircle2}
          />
        </section>

        <section
          id="record"
          className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(310px,.9fr)]"
        >
          <form
            onSubmit={submitMeeting}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-[#eaf3ff] text-[#4a87c9]">
                    <CalendarDays size={16} />
                  </span>
                  <h2 className="font-display text-[16px] font-bold text-[#152239]">
                    {editingMeetingId ? "Edit meeting record" : "Record a meeting"}
                  </h2>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Capture the conversation while it is fresh. Decisions can be converted into
                  deadlines alongside.
                </p>
              </div>
              {editingMeetingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingMeetingId(null);
                    setMeetingForm(emptyMeeting);
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50"
                  aria-label="Cancel editing"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-[10px] font-bold text-slate-500 sm:col-span-2">
                Meeting title
                <input
                  required
                  value={meetingForm.title}
                  onChange={(e) =>
                    setMeetingForm((current) => ({
                      ...current,
                      title: e.target.value,
                    }))
                  }
                  className="form-input"
                  placeholder="e.g. Weekly operating review"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Date
                <input
                  required
                  type="date"
                  value={meetingForm.meetingDate}
                  onChange={(e) =>
                    setMeetingForm((current) => ({
                      ...current,
                      meetingDate: e.target.value,
                    }))
                  }
                  className="form-input"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Duration (min)
                <input
                  type="number"
                  min="0"
                  value={meetingForm.durationMinutes ?? ""}
                  onChange={(e) =>
                    setMeetingForm((current) => ({
                      ...current,
                      durationMinutes: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }))
                  }
                  className="form-input"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Type
                <select
                  value={meetingForm.meetingType}
                  onChange={(e) =>
                    setMeetingForm((current) => ({
                      ...current,
                      meetingType: e.target.value as MeetingInput["meetingType"],
                    }))
                  }
                  className="form-input"
                >
                  <option value="executive">Executive</option>
                  <option value="department">Department</option>
                  <option value="one_on_one">1:1</option>
                  <option value="project">Project</option>
                  <option value="operations">Operations</option>
                  <option value="customer_ops">Customer ops</option>
                  <option value="technical">Technical</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Location
                <input
                  value={meetingForm.location ?? ""}
                  onChange={(e) =>
                    setMeetingForm((current) => ({
                      ...current,
                      location: e.target.value,
                    }))
                  }
                  className="form-input"
                  placeholder="Zoom, Boardroom…"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500 sm:col-span-2">
                Record / notes
                <textarea
                  value={meetingForm.notes ?? ""}
                  onChange={(e) =>
                    setMeetingForm((current) => ({
                      ...current,
                      notes: e.target.value,
                    }))
                  }
                  className="form-input min-h-28 resize-y"
                  placeholder="What was discussed?"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500 sm:col-span-2">
                Decisions and summary
                <textarea
                  value={meetingForm.summary ?? ""}
                  onChange={(e) =>
                    setMeetingForm((current) => ({
                      ...current,
                      summary: e.target.value,
                    }))
                  }
                  className="form-input min-h-20 resize-y"
                  placeholder="What was agreed?"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Record status
                <select
                  value={meetingForm.status}
                  onChange={(e) =>
                    setMeetingForm((current) => ({
                      ...current,
                      status: e.target.value as MeetingInput["status"],
                    }))
                  }
                  className="form-input"
                >
                  <option value="scheduled">Planned</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Held</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <div className="flex items-end">
                <IfPermitted
                  roleKinds={["ceo", "coo", "cto", "executive_other", "department_head", "manager"]}
                >
                  <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#4a87c9] px-3.5 py-2.5 text-[11px] font-bold text-white hover:bg-[#376fa9]">
                    <Save size={14} /> {editingMeetingId ? "Update record" : "Save meeting"}
                  </button>
                </IfPermitted>
              </div>
            </div>
          </form>

          <form
            onSubmit={submitDeadline}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6"
          >
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#fff2d9] text-[#b3781f]">
                <ClipboardCheck size={16} />
              </span>
              <h2 className="font-display text-[16px] font-bold text-[#152239]">
                Add a deadline
              </h2>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Make the owner, date and follow-up explicit.
            </p>
            <div className="mt-5 space-y-3">
              <label className="block text-[10px] font-bold text-slate-500">
                Deadline
                <input
                  required
                  value={deadlineForm.title}
                  onChange={(e) =>
                    setDeadlineForm((current) => ({
                      ...current,
                      title: e.target.value,
                    }))
                  }
                  className="form-input"
                  placeholder="What must happen?"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-[10px] font-bold text-slate-500">
                  Due date
                  <input
                    required
                    type="date"
                    value={deadlineForm.dueAt}
                    onChange={(e) =>
                      setDeadlineForm((current) => ({
                        ...current,
                        dueAt: e.target.value,
                      }))
                    }
                    className="form-input"
                  />
                </label>
                <label className="block text-[10px] font-bold text-slate-500">
                  Priority
                  <select
                    value={deadlineForm.priority}
                    onChange={(e) =>
                      setDeadlineForm((current) => ({
                        ...current,
                        priority: e.target.value as DeadlineInput["priority"],
                      }))
                    }
                    className="form-input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </label>
              </div>
              <label className="block text-[10px] font-bold text-slate-500">
                Owner
                <select
                  value={deadlineForm.ownerEmployeeId ?? ""}
                  onChange={(e) =>
                    setDeadlineForm((current) => ({
                      ...current,
                      ownerEmployeeId: e.target.value || null,
                    }))
                  }
                  className="form-input"
                >
                  <option value="">Unassigned</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[10px] font-bold text-slate-500">
                Department
                <select
                  value={deadlineForm.departmentId ?? ""}
                  onChange={(e) =>
                    setDeadlineForm((current) => ({
                      ...current,
                      departmentId: e.target.value || null,
                    }))
                  }
                  className="form-input"
                >
                  <option value="">No department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[10px] font-bold text-slate-500">
                Follow-up details
                <textarea
                  value={deadlineForm.description ?? ""}
                  onChange={(e) =>
                    setDeadlineForm((current) => ({
                      ...current,
                      description: e.target.value,
                    }))
                  }
                  className="form-input min-h-24 resize-y"
                  placeholder="Evidence, next check-in or dependency"
                />
              </label>
              <IfPermitted
                roleKinds={["ceo", "coo", "cto", "executive_other", "department_head", "manager"]}
              >
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#b3781f] px-3.5 py-2.5 text-[11px] font-bold text-white hover:bg-[#925f13]"
                >
                  <Plus size={14} /> Add deadline
                </button>
              </IfPermitted>
            </div>
          </form>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_5px_20px_rgba(21,36,58,0.035)]">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#e8f8f2] text-[#168465]">
                <CheckCircle2 size={16} />
              </span>
              <div>
                <h2 className="font-display text-[16px] font-bold text-[#152239]">
                  Upcoming deadlines
                </h2>
                <p className="mt-1 text-[11px] text-slate-400">
                  The accountability queue generated from the deadlines table.
                </p>
              </div>
            </div>
          </div>
          {deadlinesState === "loading" && <SectionLoading label="deadlines" />}
          {deadlinesState === "error" && (
            <SectionError label="deadlines" message={operationsQuery.error?.message} />
          )}
          {deadlinesState === "empty" && (
            <SectionEmpty
              label="open deadlines"
              hint="Add the first deadline using the form above."
            />
          )}
          {deadlinesState === "ready" && (
            <div className="divide-y divide-slate-100">
              {openDeadlines.length === 0 ? (
                <p className="p-8 text-center text-[11px] text-slate-400">
                  No open deadlines. Every item is resolved.
                </p>
              ) : (
                openDeadlines.map((deadline) => {
                  const ownerName = (() => {
                    if (!deadline.owner_employee_id) return "Unassigned";
                    const employee = employees.find(
                      (candidate) => candidate.id === deadline.owner_employee_id,
                    );
                    return employee
                      ? `${employee.first_name} ${employee.last_name}`.trim()
                      : "Unassigned";
                  })();
                  return (
                    <div
                      key={deadline.id}
                      className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1.2fr)_150px_160px_auto] sm:items-center sm:px-6"
                    >
                      <div>
                        <p className="text-[11px] font-bold text-slate-700">{deadline.title}</p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {deadline.priority} priority
                          {deadline.description ? ` · ${deadline.description}` : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                          Due
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-600">
                          {formatDate(deadline.due_at)}
                        </p>
                      </div>
                      <div className="min-w-[140px]">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                          Owner
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-600">
                          {ownerName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={deadline.status}
                          onChange={(e) =>
                            void updateDeadline.mutateAsync({
                              id: deadline.id,
                              status: e.target.value as DeadlineInput["status"],
                            })
                          }
                          className={cn(
                            "rounded-full border-0 px-2.5 py-1.5 text-[10px] font-bold outline-none",
                            deadline.status === "completed"
                              ? "bg-[#e8f8f2] text-[#168465]"
                              : deadline.status === "overdue"
                                ? "bg-[#ffe5e3] text-[#bd504d]"
                                : "bg-[#fff2d9] text-[#9a6419]",
                          )}
                        >
                          <option value="open">Open</option>
                          <option value="completed">Done</option>
                          <option value="overdue">Blocked</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => void deleteDeadline.mutateAsync(deadline.id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-[#fff0ee] hover:text-[#bd504d]"
                          aria-label={`Delete ${deadline.title}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_5px_20px_rgba(21,36,58,0.035)]">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#eaf3ff] text-[#4a87c9]">
                <FileText size={16} />
              </span>
              <div>
                <h2 className="font-display text-[16px] font-bold text-[#152239]">
                  Meeting records
                </h2>
                <p className="mt-1 text-[11px] text-slate-400">
                  Every record remains editable and traceable to the meetings table.
                </p>
              </div>
            </div>
          </div>
          {meetingsState === "loading" && <SectionLoading label="meeting records" />}
          {meetingsState === "error" && (
            <SectionError label="meeting records" message={meetingsQuery.error?.message} />
          )}
          {meetingsState === "empty" && (
            <SectionEmpty
              label="meeting records"
              hint="Use the form above to create the first one."
            />
          )}
          {meetingsState === "ready" && (
            <div className="divide-y divide-slate-100">
              {[...meetings]
                .sort((a, b) => b.meeting_date.localeCompare(a.meeting_date))
                .map((meeting) => (
                  <article key={meeting.id} className="p-5 sm:px-6">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[12px] font-bold text-slate-700">
                            {meeting.title}
                          </h3>
                          <span
                            className={cn(
                              "rounded-full px-2 py-1 text-[10px] font-bold",
                              meeting.status === "completed"
                                ? "bg-[#e8f8f2] text-[#168465]"
                                : meeting.status === "cancelled"
                                  ? "bg-[#ffe5e3] text-[#bd504d]"
                                  : "bg-[#eaf3ff] text-[#4a87c9]",
                            )}
                          >
                            {meeting.status === "scheduled"
                              ? "Planned"
                              : meeting.status === "in_progress"
                                ? "In progress"
                                : meeting.status === "completed"
                                  ? "Held"
                                  : "Cancelled"}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500">
                            {meeting.meeting_type.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {formatDate(meeting.meeting_date)}
                          {meeting.duration_minutes
                            ? ` · ${meeting.duration_minutes} min`
                            : ""}
                          {meeting.location ? ` · ${meeting.location}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEditingMeeting(meeting)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                          aria-label={`Edit ${meeting.title}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete ${meeting.title}?`)) {
                              void deleteMeeting.mutateAsync(meeting.id);
                            }
                          }}
                          className="rounded-lg p-2 text-slate-400 hover:bg-[#fff0ee] hover:text-[#bd504d]"
                          aria-label={`Delete ${meeting.title}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {meeting.notes && (
                      <p className="mt-3 whitespace-pre-wrap text-[11px] leading-5 text-slate-500">
                        {meeting.notes}
                      </p>
                    )}
                    {meeting.summary && (
                      <p className="mt-3 rounded-xl bg-[#f7f9fb] p-3 text-[11px] leading-5 text-slate-500">
                        <span className="font-bold text-slate-700">Decisions:</span>{" "}
                        {meeting.summary}
                      </p>
                    )}
                  </article>
                ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
