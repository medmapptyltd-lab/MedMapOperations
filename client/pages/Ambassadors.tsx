import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Coins,
  Layers3,
  Plus,
  ShieldCheck,
  Stethoscope,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/medmap/AppShell";
import { IfPermitted } from "@/components/medmap/IfPermitted";
import { useAmbassadorMutations } from "@/lib/crud";
import {
  buildAmbassadorMetrics,
  formatAmbassadorName,
  formatDoctorName,
  formatMoney,
  formatPercentage,
  useAmbassadorDashboard,
  type AmbassadorActivityRecord,
  type AmbassadorCohort,
  type AmbassadorCohortSummary,
  type AmbassadorPerformanceRecord,
  type AmbassadorProbationRecord,
  type AmbassadorRecord,
  type AmbassadorTier,
} from "@/lib/ambassador-dashboard";
import { cn } from "@/lib/utils";

const AMBASSADOR_MANAGE_ROLES = ["ceo", "coo"] as const;
const AMBASSADOR_STATUS_OPTIONS = [
  "prospect",
  "active",
  "inactive",
  "completed",
  "terminated",
] as const;

function formatDate(value: string | null) {
  if (!value) return "Not provided";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00Z`);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMetric(value: number | null) {
  return value === null ? "—" : String(value);
}

function normaliseStatus(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/[_-]+/g, " ") ?? "";
}

function statusClass(value: string | null | undefined) {
  const status = normaliseStatus(value);
  if (["green", "active", "approved", "paid", "completed", "complete", "resolved"].includes(status)) {
    return "bg-[#e8f8f2] text-[#168465]";
  }
  if (["critical", "concern", "cancelled", "canceled", "failed", "rejected"].includes(status)) {
    return "bg-[#ffe5e3] text-[#bd504d]";
  }
  if (["yellow", "pending", "in progress", "open", "calculated", "approved"].includes(status)) {
    return "bg-[#fff2d9] text-[#94651d]";
  }
  return "bg-[#eef2f7] text-slate-500";
}

function StateMessage({
  children,
  tone = "empty",
}: {
  children: React.ReactNode;
  tone?: "empty" | "error" | "warning";
}) {
  return (
    <p
      className={cn(
        "rounded-xl p-3 text-[11px] leading-5",
        tone === "error"
          ? "border border-[#f0cdca] bg-[#fff8f7] text-[#a34f4b]"
          : tone === "warning"
            ? "border border-[#f4dfb3] bg-[#fffaf0] text-[#94651d]"
            : "bg-[#f7f9fb] text-slate-400",
      )}
    >
      {children}
    </p>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  tone: "blue" | "mint" | "amber" | "red" | "purple";
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_5px_20px_rgba(21,36,58,0.035)]">
      <span
        className={cn(
          "grid size-9 place-items-center rounded-xl",
          tone === "blue" && "bg-[#eaf3ff] text-[#4a87c9]",
          tone === "mint" && "bg-[#e8f8f2] text-[#1b9975]",
          tone === "amber" && "bg-[#fff2d9] text-[#b3781f]",
          tone === "red" && "bg-[#ffe9e6] text-[#bf5b56]",
          tone === "purple" && "bg-[#f1edff] text-[#755bc0]",
        )}
      >
        <Icon size={17} />
      </span>
      <p className="mt-4 text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 font-display text-[25px] font-bold tracking-[-0.06em] text-[#152239]">
        {value}
      </p>
      <p className="mt-1 text-[10px] text-slate-400">{detail}</p>
    </div>
  );
}

function Section({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(21,36,58,0.035)] sm:p-6",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#eaf3ff] text-[#4a87c9]">
          <Icon size={16} />
        </span>
        <div>
          <h2 className="font-display text-[16px] font-bold text-[#152239]">{title}</h2>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ProgressBar({ value }: { value: number | null }) {
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-[#4a87c9] transition-all"
        style={{ width: `${Math.min(Math.max(value ?? 0, 0), 100)}%` }}
      />
    </div>
  );
}

function CohortRow({ cohort }: { cohort: AmbassadorCohortSummary }) {
  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="py-3 pr-4">
        <p className="font-bold text-slate-700">{cohort.name}</p>
        <p className="mt-1 text-slate-400">{formatDate(cohort.cohort_month)}</p>
      </td>
      <td className="py-3 pr-4">
        <span className={cn("rounded-full px-2 py-1 text-[9px] font-bold", statusClass(cohort.status))}>
          {cohort.status}
        </span>
      </td>
      <td className="py-3 pr-4 text-slate-500">
        <strong className="text-slate-700">{cohort.actualAmbassadors}</strong> / {cohort.target_ambassadors}
        <ProgressBar value={cohort.ambassadorProgress} />
      </td>
      <td className="py-3 pr-4 text-slate-500">
        <strong className="text-slate-700">{cohort.actualDoctors}</strong> / {cohort.target_doctors}
        <ProgressBar value={cohort.doctorProgress} />
      </td>
      <td className="py-3 pr-4 text-slate-500">{cohort.probation_booking_target}</td>
      <td className="py-3 text-slate-500">{cohort.post_probation_booking_target}</td>
    </tr>
  );
}

function PerformanceRow({ row }: { row: AmbassadorPerformanceRecord }) {
  const performance = row.performance;
  const commission = row.commissionPeriod;
  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="py-3 pr-4">
        <p className="font-bold text-slate-700">{formatAmbassadorName(row.ambassador)}</p>
        <p className="mt-1 text-slate-400">{row.ambassador.email || "Email not provided"}</p>
      </td>
      <td className="py-3 pr-4 text-slate-500">{row.cohort?.name || "Cohort not assigned"}</td>
      <td className="py-3 pr-4">
        <span className={cn("rounded-full px-2 py-1 text-[9px] font-bold", statusClass(row.ambassador.status))}>
          {row.ambassador.status}
        </span>
      </td>
      <td className="py-3 pr-4 text-slate-500">
        {performance ? performance.total_referred_doctors : row.ambassador.active_referred_doctors}
        <span className="block text-[9px] text-slate-400">
          {performance ? `${performance.active_referred_doctors} active` : "Active count from ambassador record"}
        </span>
      </td>
      <td className="py-3 pr-4 text-slate-500">{performance?.total_bookings ?? "Unavailable"}</td>
      <td className="py-3 pr-4 text-slate-500">{performance?.probation_doctors ?? "Unavailable"}</td>
      <td className="py-3 pr-4 text-[#168465]">{performance?.probation_green_doctors ?? "Unavailable"}</td>
      <td className="py-3 pr-4 text-[#94651d]">{performance?.probation_yellow_doctors ?? "Unavailable"}</td>
      <td className="py-3 pr-4 text-[#bd5a55]">{performance?.probation_critical_doctors ?? "Unavailable"}</td>
      <td className="py-3 pr-4 text-slate-500">{row.tier?.name || row.ambassador.current_tier || "Unavailable"}</td>
      <td className="py-3 pr-4 text-slate-500">
        {commission
          ? formatPercentage(commission.commission_percentage)
          : performance?.tier_percentage !== null && performance?.tier_percentage !== undefined
            ? formatPercentage(performance.tier_percentage)
            : row.tier
              ? formatPercentage(row.tier.commission_percentage)
              : "Unavailable"}
      </td>
      <td className="py-3 pr-4 text-slate-500">{commission ? formatMoney(commission.eligible_revenue) : "Unavailable"}</td>
      <td className="py-3 pr-4 text-slate-500">{commission ? formatMoney(commission.commission_amount) : "Unavailable"}</td>
      <td className="py-3 text-slate-500">
        {commission ? <span className={cn("rounded-full px-2 py-1 text-[9px] font-bold", statusClass(commission.status))}>{commission.status}</span> : "Unavailable"}
      </td>
    </tr>
  );
}

function ProbationRow({ row }: { row: AmbassadorProbationRecord }) {
  const days = row.daysRemaining;
  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="py-3 pr-4 font-semibold text-slate-700">{formatAmbassadorName(row.ambassador)}</td>
      <td className="py-3 pr-4">
        <p className="font-semibold text-slate-600">{formatDoctorName(row.doctor)}</p>
        <p className="mt-1 text-[9px] text-slate-400">{row.doctor?.practice_name || "Practice not provided"}</p>
      </td>
      <td className="py-3 pr-4 text-slate-500">{formatDate(row.referral_date)}</td>
      <td className="py-3 pr-4 text-slate-500">{formatDate(row.probation_start_date)}</td>
      <td className="py-3 pr-4 text-slate-500">{formatDate(row.probation_end_date)}</td>
      <td className="py-3 pr-4 text-slate-500">{row.bookingCount}</td>
      <td className="py-3 pr-4 text-slate-500">{row.targetBookings}</td>
      <td className="py-3 pr-4">
        <span className={cn("rounded-full px-2 py-1 text-[9px] font-bold", statusClass(row.status))}>{row.status}</span>
        {row.outcome && <span className="mt-1 block text-[9px] text-slate-400">{row.outcome}</span>}
      </td>
      <td className="py-3 pr-4 text-slate-500">{days === null ? "Unavailable" : days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}</td>
      <td className="py-3 text-slate-500">{row.postProbationTarget ?? "Unavailable"}</td>
    </tr>
  );
}

function ActivityRow({ activity }: { activity: AmbassadorActivityRecord }) {
  return (
    <div className="flex gap-3 border-b border-slate-100 py-3 last:border-0">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#f1edff] text-[#755bc0]">
        <Activity size={14} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-700">{activity.activity_type}</p>
        <p className="mt-1 truncate text-[10px] text-slate-400">
          {formatAmbassadorName(activity.ambassador)} · {activity.doctor ? formatDoctorName(activity.doctor) : "No doctor linked"}
        </p>
        {(activity.outcome || activity.notes) && <p className="mt-1 text-[10px] leading-4 text-slate-500">{activity.outcome || activity.notes}</p>}
      </div>
      <p className="ml-auto shrink-0 text-right text-[10px] text-slate-400">{formatDate(activity.activity_date)}</p>
    </div>
  );
}

const ambassadorInputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700 outline-none focus:border-[#755bc0]";

function humaniseStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function AddAmbassadorForm({
  cohorts,
  tiers,
}: {
  cohorts: AmbassadorCohort[];
  tiers: AmbassadorTier[];
}) {
  const { createAmbassador } = useAmbassadorMutations();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const empty = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    status: "active",
    cohortId: "",
    currentTier: tiers[0]?.name ?? "Bronze",
    startDate: "",
  };
  const [form, setForm] = useState(empty);

  const update =
    (key: keyof typeof empty) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    void createAmbassador
      .mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        status: form.status as (typeof AMBASSADOR_STATUS_OPTIONS)[number],
        cohortId: form.cohortId || null,
        currentTier: form.currentTier || null,
        startDate: form.startDate || null,
      })
      .then(() => {
        setForm(empty);
        setOpen(false);
      })
      .catch((submitError: unknown) => {
        setError(submitError instanceof Error ? submitError.message : "The ambassador could not be added.");
      });
  };

  return (
    <div className="rounded-xl border border-slate-200/80 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-slate-700">Add and manage ambassadors</p>
          <p className="mt-1 text-[10px] text-slate-400">
            CEO and COO can onboard ambassadors, set their cohort, tier and status.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#f1edff] px-3 py-2 text-[10px] font-bold text-[#755bc0] hover:bg-[#e8e1ff]"
        >
          <Plus size={12} /> {open ? "Close" : "Add ambassador"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <input className={ambassadorInputClass} placeholder="First name" value={form.firstName} onChange={update("firstName")} />
          <input className={ambassadorInputClass} placeholder="Last name" value={form.lastName} onChange={update("lastName")} />
          <input className={ambassadorInputClass} placeholder="Email" value={form.email} onChange={update("email")} />
          <input className={ambassadorInputClass} placeholder="Phone" value={form.phone} onChange={update("phone")} />
          <select className={ambassadorInputClass} value={form.status} onChange={update("status")}>
            {AMBASSADOR_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{humaniseStatus(status)}</option>
            ))}
          </select>
          <select className={ambassadorInputClass} value={form.cohortId} onChange={update("cohortId")}>
            <option value="">No cohort</option>
            {cohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>{cohort.name}</option>
            ))}
          </select>
          <select className={ambassadorInputClass} value={form.currentTier} onChange={update("currentTier")}>
            {(tiers.length ? tiers.map((tier) => tier.name) : ["Bronze"]).map((tier) => (
              <option key={tier} value={tier}>{tier}</option>
            ))}
          </select>
          <input className={ambassadorInputClass} type="date" value={form.startDate} onChange={update("startDate")} />
          {error && <p className="text-[10px] text-[#bd504d] sm:col-span-2 lg:col-span-3">{error}</p>}
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={createAmbassador.isPending}
              className="inline-flex items-center gap-1 rounded-lg bg-[#755bc0] px-4 py-2 text-[10px] font-bold text-white hover:bg-[#674fb0] disabled:opacity-60"
            >
              <Plus size={12} /> {createAmbassador.isPending ? "Saving..." : "Save ambassador"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function AmbassadorManageRow({
  record,
  cohorts,
  tiers,
}: {
  record: AmbassadorRecord;
  cohorts: AmbassadorCohort[];
  tiers: AmbassadorTier[];
}) {
  const { updateAmbassador, deleteAmbassador } = useAmbassadorMutations();
  const [error, setError] = useState<string | null>(null);
  const tierNames = tiers.length ? tiers.map((tier) => tier.name) : ["Bronze"];

  const patch = (values: Parameters<typeof updateAmbassador.mutateAsync>[0]["patch"]) => {
    setError(null);
    void updateAmbassador
      .mutateAsync({ id: record.id, patch: values })
      .catch((updateError: unknown) => {
        setError(updateError instanceof Error ? updateError.message : "The ambassador could not be updated.");
      });
  };

  const remove = () => {
    setError(null);
    void deleteAmbassador.mutateAsync(record.id).catch((deleteError: unknown) => {
      setError(deleteError instanceof Error ? deleteError.message : "The ambassador could not be removed.");
    });
  };

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="py-3 pr-4">
        <p className="font-bold text-slate-700">{formatAmbassadorName(record)}</p>
        <p className="mt-1 text-slate-400">{record.email || "Email not provided"}</p>
        <p className="mt-1 text-[9px] text-slate-400">{record.phone || "Phone not provided"}</p>
      </td>
      <td className="py-3 pr-4">
        <select
          value={record.status}
          onChange={(event) => patch({ status: event.target.value as (typeof AMBASSADOR_STATUS_OPTIONS)[number] })}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-600 outline-none focus:border-[#755bc0]"
        >
          {AMBASSADOR_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{humaniseStatus(status)}</option>
          ))}
        </select>
      </td>
      <td className="py-3 pr-4">
        <select
          value={record.cohort_id ?? ""}
          onChange={(event) => patch({ cohortId: event.target.value || null })}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-600 outline-none focus:border-[#755bc0]"
        >
          <option value="">No cohort</option>
          {cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>{cohort.name}</option>
          ))}
        </select>
      </td>
      <td className="py-3 pr-4">
        <select
          value={record.current_tier ?? ""}
          onChange={(event) => patch({ currentTier: event.target.value || null })}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-600 outline-none focus:border-[#755bc0]"
        >
          {tierNames.map((tier) => (
            <option key={tier} value={tier}>{tier}</option>
          ))}
        </select>
      </td>
      <td className="py-3 pr-4 text-slate-500">{record.active_referred_doctors}</td>
      <td className="py-3 pr-4 text-slate-500">{formatDate(record.start_date)}</td>
      <td className="py-3">
        <button
          type="button"
          onClick={remove}
          title="Remove ambassador"
          className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:border-[#f0cdca] hover:bg-[#fff8f7] hover:text-[#bd504d]"
        >
          <Trash2 size={12} />
        </button>
        {error && <p className="mt-2 max-w-[160px] text-[9px] text-[#bd504d]">{error}</p>}
      </td>
    </tr>
  );
}

export default function Ambassadors() {
  const dashboard = useAmbassadorDashboard();
  const data = dashboard.data;
  const metrics = buildAmbassadorMetrics(data);
  const currentCommissionPeriods = data?.currentPerformancePeriod
    ? data.commissionPeriods.filter(
        (period) =>
          period.performance_period_id === data.currentPerformancePeriod!.id,
      )
    : [];
  const optionalErrors = data?.optionalErrors ?? [];
  const coreEmpty = data && metrics.totalAmbassadors === 0 && metrics.totalReferredDoctors === 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-[1540px] px-5 pb-12 pt-8 sm:px-8 xl:px-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#755bc0]">
              <Users size={13} /> Operations · Ambassador Programme
            </div>
            <h1 className="max-w-[1000px] font-display text-[32px] font-bold tracking-[-0.06em] text-[#152239] sm:text-[39px]">
              Ambassador performance, cohort by cohort.
            </h1>
            <p className="mt-2 max-w-[850px] text-[13px] leading-6 text-slate-500">
              Live ambassador referrals, probation outcomes, attributed bookings and database-driven commission performance for the authenticated organisation.
            </p>
          </div>
          <div className="rounded-2xl border border-[#dcd3f6] bg-[#fbfaff] px-4 py-3 text-[10px] text-[#755bc0]">
            <p className="font-bold uppercase tracking-[0.12em]">Managed programme</p>
            <p className="mt-1">CEO and COO can add and manage ambassadors; stored performance stays authoritative.</p>
          </div>
        </div>

        {dashboard.isPending && <div className="mt-5"><StateMessage>Loading live Ambassador Programme data...</StateMessage></div>}
        {dashboard.isError && <div className="mt-5"><StateMessage tone="error">Ambassador Programme data could not be loaded. Check the production connection and RLS visibility.</StateMessage></div>}

        {data && !dashboard.isError && (
          <>
            {optionalErrors.length > 0 && (
              <div className="mt-5"><StateMessage tone="warning">Core Ambassador data is available. Some optional sections are unavailable: {optionalErrors.join(" ")}</StateMessage></div>
            )}
            {coreEmpty && <div className="mt-5"><StateMessage>No live Ambassador or referral records are available for this organisation yet.</StateMessage></div>}

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              <MetricCard label="Total Ambassadors" value={String(metrics.totalAmbassadors)} detail={`${metrics.activeAmbassadors} active`} icon={Users} tone="purple" />
              <MetricCard label="Active Ambassadors" value={String(metrics.activeAmbassadors)} detail="Configured active status" icon={CheckCircle2} tone="mint" />
              <MetricCard label="Referred Doctors" value={String(metrics.totalReferredDoctors)} detail={`${formatMetric(metrics.activeReferredDoctors)} active`} icon={Stethoscope} tone="blue" />
              <MetricCard label="Attributed Bookings" value={formatMetric(metrics.totalBookingsAttributed)} detail="Referral-linked records only" icon={CalendarDays} tone="amber" />
              <MetricCard label="Probation Doctors" value={formatMetric(metrics.probationDoctors)} detail="Current performance data" icon={Clock3} tone="purple" />
              <MetricCard label="Green Probation" value={formatMetric(metrics.greenProbation)} detail="Configured review status" icon={CheckCircle2} tone="mint" />
              <MetricCard label="Yellow Probation" value={formatMetric(metrics.yellowProbation)} detail="Configured review status" icon={AlertTriangle} tone="amber" />
              <MetricCard label="Critical Probation" value={formatMetric(metrics.criticalProbation)} detail="Configured review status" icon={AlertTriangle} tone="red" />
              <MetricCard label="Eligible Revenue" value={formatMoney(metrics.eligibleRevenue)} detail="Current commission period" icon={Coins} tone="blue" />
              <MetricCard label="Commission Amount" value={formatMoney(metrics.commissionAmount)} detail="Stored commission value" icon={Coins} tone="red" />
              <MetricCard label="50-Booking Threshold" value={formatMetric(metrics.doctorsAtPostProbationTarget)} detail="Uses configured post-probation target" icon={Target} tone="mint" />
              <MetricCard label="First-1000 Doctors" value={String(metrics.ambassadorAttributedFirst1000)} detail={`${metrics.first1000Acquired} flagged doctors visible`} icon={Award} tone="purple" />
            </div>

            <div className="mt-5">
              <IfPermitted roleKinds={[...AMBASSADOR_MANAGE_ROLES]}>
                <Section title="Manage ambassadors" description="Onboard new ambassadors and update their cohort, tier and status. Available to the CEO and COO." icon={Users}>
                  <AddAmbassadorForm cohorts={data.cohorts} tiers={data.tiers} />
                  {data.ambassadors.length ? (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full min-w-[900px] text-left text-[10px]">
                        <thead className="text-[9px] uppercase tracking-[0.12em] text-slate-400">
                          <tr><th className="pb-2 font-bold">Ambassador</th><th className="pb-2 font-bold">Status</th><th className="pb-2 font-bold">Cohort</th><th className="pb-2 font-bold">Tier</th><th className="pb-2 font-bold">Referred doctors</th><th className="pb-2 font-bold">Joined</th><th className="pb-2 font-bold">Action</th></tr>
                        </thead>
                        <tbody>{data.ambassadors.map((record) => <AmbassadorManageRow key={record.id} record={record} cohorts={data.cohorts} tiers={data.tiers} />)}</tbody>
                      </table>
                    </div>
                  ) : <div className="mt-3"><StateMessage>No ambassadors yet. Add the first ambassador above.</StateMessage></div>}
                </Section>
              </IfPermitted>
            </div>

            <div className="mt-5">
              <Section title="Cohort command centre" description="Actual cohort records, configured targets, and counts from ambassador and referral relationships." icon={Layers3}>
                {metrics.cohortSummaries.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-[10px]">
                      <thead className="text-[9px] uppercase tracking-[0.12em] text-slate-400">
                        <tr><th className="pb-2 font-bold">Cohort</th><th className="pb-2 font-bold">Status</th><th className="pb-2 font-bold">Ambassadors</th><th className="pb-2 font-bold">Doctors</th><th className="pb-2 font-bold">Probation target</th><th className="pb-2 font-bold">Post-probation target</th></tr>
                      </thead>
                      <tbody>{metrics.cohortSummaries.map((cohort) => <CohortRow key={cohort.id} cohort={cohort} />)}</tbody>
                    </table>
                  </div>
                ) : <StateMessage>No cohort records are available.</StateMessage>}
              </Section>
            </div>

            <div className="mt-5">
              <Section title="Ambassador performance" description={`Latest records for ${data.currentPerformancePeriod?.period_name || "the latest available performance period"}. Historical periods are not silently summed into current metrics.`} icon={BarChart3}>
                {metrics.performanceRecords.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1450px] text-left text-[10px]">
                      <thead className="text-[9px] uppercase tracking-[0.12em] text-slate-400">
                        <tr><th className="pb-2 font-bold">Ambassador</th><th className="pb-2 font-bold">Cohort</th><th className="pb-2 font-bold">Status</th><th className="pb-2 font-bold">Referred doctors</th><th className="pb-2 font-bold">Bookings</th><th className="pb-2 font-bold">Probation</th><th className="pb-2 font-bold">Green</th><th className="pb-2 font-bold">Yellow</th><th className="pb-2 font-bold">Critical</th><th className="pb-2 font-bold">Tier</th><th className="pb-2 font-bold">Commission %</th><th className="pb-2 font-bold">Eligible revenue</th><th className="pb-2 font-bold">Commission</th><th className="pb-2 font-bold">Status</th></tr>
                      </thead>
                      <tbody>{metrics.performanceRecords.map((row) => <PerformanceRow key={row.ambassador.id} row={row} />)}</tbody>
                    </table>
                  </div>
                ) : <StateMessage>No Ambassador performance records are available.</StateMessage>}
              </Section>
            </div>

            <div className="mt-5">
              <Section title="Probation monitor" description="Referral-linked doctors with configured probation dates, targets, reviews, and booking attribution." icon={ShieldCheck}>
                {metrics.probationRecords.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1160px] text-left text-[10px]">
                      <thead className="text-[9px] uppercase tracking-[0.12em] text-slate-400">
                        <tr><th className="pb-2 font-bold">Ambassador</th><th className="pb-2 font-bold">Doctor</th><th className="pb-2 font-bold">Referral date</th><th className="pb-2 font-bold">Probation start</th><th className="pb-2 font-bold">Probation end</th><th className="pb-2 font-bold">Bookings</th><th className="pb-2 font-bold">Target</th><th className="pb-2 font-bold">Status</th><th className="pb-2 font-bold">Days remaining</th><th className="pb-2 font-bold">Post-probation</th></tr>
                      </thead>
                      <tbody>{metrics.probationRecords.slice(0, 40).map((row) => <ProbationRow key={row.id} row={row} />)}</tbody>
                    </table>
                  </div>
                ) : <StateMessage>No Ambassador referral probation records are available.</StateMessage>}
              </Section>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <Section title="Commission monitor" description={`Stored commission period values for ${data.currentPerformancePeriod?.period_name || "the latest available period"}. No replacement frontend commission calculation is applied.`} icon={Coins}>
                {currentCommissionPeriods.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-[10px]">
                      <thead className="text-[9px] uppercase tracking-[0.12em] text-slate-400"><tr><th className="pb-2 font-bold">Ambassador</th><th className="pb-2 font-bold">Active doctors</th><th className="pb-2 font-bold">Tier</th><th className="pb-2 font-bold">Commission %</th><th className="pb-2 font-bold">Eligible revenue</th><th className="pb-2 font-bold">Commission</th><th className="pb-2 font-bold">Status</th><th className="pb-2 font-bold">Paid at</th></tr></thead>
                      <tbody>{currentCommissionPeriods.map((period) => { const ambassador = data.ambassadors.find((row) => row.id === period.ambassador_id); const tier = period.tier_id ? data.tiers.find((row) => row.id === period.tier_id) : null; return <tr key={period.id} className="border-t border-slate-100"><td className="py-3 pr-4 font-semibold text-slate-700">{formatAmbassadorName(ambassador || null)}</td><td className="py-3 pr-4 text-slate-500">{period.active_referred_doctors}</td><td className="py-3 pr-4 text-slate-500">{tier?.name || "Unavailable"}</td><td className="py-3 pr-4 text-slate-500">{formatPercentage(period.commission_percentage)}</td><td className="py-3 pr-4 text-slate-500">{formatMoney(period.eligible_revenue)}</td><td className="py-3 pr-4 text-slate-500">{formatMoney(period.commission_amount)}</td><td className="py-3 pr-4"><span className={cn("rounded-full px-2 py-1 text-[9px] font-bold", statusClass(period.status))}>{period.status}</span></td><td className="py-3 text-slate-500">{formatDate(period.paid_at)}</td></tr>; })}</tbody>
                    </table>
                  </div>
                ) : <StateMessage>No stored commission-period records are available.</StateMessage>}
                {data.commissions.length > 0 && <p className="mt-3 rounded-xl bg-[#f7f9fb] p-3 text-[10px] leading-5 text-slate-400">{data.commissions.length} standalone commission record{data.commissions.length === 1 ? "" : "s"} loaded. These records are retained as history and are not mixed into current-period totals.</p>}
              </Section>
              <Section title="Commission tiers" description="Active tiers loaded dynamically from ambassador_tiers; names and percentages are not hard-coded." icon={Award}>
                {data.tiers.filter((tier) => tier.active).length ? <div className="space-y-2">{data.tiers.filter((tier) => tier.active).map((tier) => <div key={tier.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f9fb] px-3 py-3"><div><p className="text-[11px] font-bold text-slate-700">{tier.name}</p><p className="mt-1 text-[10px] text-slate-400">{tier.minimum_active_doctors}–{tier.maximum_active_doctors ?? "No upper limit"} active referred doctors</p></div><strong className="font-display text-[20px] text-[#755bc0]">{formatPercentage(tier.commission_percentage)}</strong></div>)}</div> : <StateMessage>No active commission tiers are available.</StateMessage>}
              </Section>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <Section title="Recent Ambassador activity" description="Newest records from ambassador_activities, with linked doctor context where available." icon={Activity}>
                {data.activities.length ? <div>{data.activities.slice(0, 12).map((activity) => <ActivityRow key={activity.id} activity={activity} />)}</div> : <StateMessage>No Ambassador activities are available.</StateMessage>}
              </Section>
              <Section title="First-1000 campaign context" description="Uses the existing doctors.first_1000_campaign flag and verified referral attribution. A target is not invented when none is stored." icon={Target}>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl bg-[#f7f9fb] p-3"><p className="text-[10px] text-slate-400">Flagged doctors visible</p><strong className="mt-1 block font-display text-[24px] text-[#152239]">{metrics.first1000Acquired}</strong></div>
                  <div className="rounded-xl bg-[#f7f9fb] p-3"><p className="text-[10px] text-slate-400">Ambassador-attributed</p><strong className="mt-1 block font-display text-[24px] text-[#152239]">{metrics.ambassadorAttributedFirst1000}</strong></div>
                  <div className="rounded-xl bg-[#f7f9fb] p-3"><p className="text-[10px] text-slate-400">Remaining target</p><strong className="mt-1 block text-[13px] text-slate-600">Not stored</strong></div>
                </div>
                <p className="mt-3 text-[10px] leading-5 text-slate-400">Attribution uses ambassador_referrals.doctor_id and does not infer ownership from names, email addresses, cohorts, or free-text acquisition sources.</p>
              </Section>
            </div>

            <div className="mt-5">
              <Section title="Data scope and read boundary" description="Existing production relationships are used as supplied; no schema or policy assumptions are added in the frontend." icon={CheckCircle2}>
                <div className="grid gap-2 text-[11px] leading-5 text-slate-500 md:grid-cols-3">
                  <p className="rounded-xl bg-[#f7f9fb] p-3">Organisation-owned reads use the authenticated organisation context for activities, commission periods, performance, performance periods, probation reviews, and doctors.</p>
                  <p className="rounded-xl bg-[#f7f9fb] p-3">Ambassadors, referrals, commissions, cohorts, tiers, and bookings are read without an invented organization_id filter and rely on their verified relationship-scoped RLS.</p>
                  <p className="rounded-xl bg-[#f7f9fb] p-3">The CEO and COO can add, update and remove ambassadors from this page. Ambassadors and referrals are read without an invented organization_id filter and rely on their verified relationship-scoped RLS. Performance and commission values are never recalculated here.</p>
                </div>
              </Section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
