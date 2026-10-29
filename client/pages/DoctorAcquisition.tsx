import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Plus,
  Send,
  Stethoscope,
  Target,
  Ticket,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/medmap/AppShell";
import { IfPermitted } from "@/components/medmap/IfPermitted";
import { useDoctorPipelineMutations } from "@/lib/crud";
import {
  buildAcquisitionKpiInformation,
  buildAcquisitionOperationalSummary,
  buildAcquisitionTimeline,
  buildDoctorAcquisitionMetrics,
  displayAmbassadorName,
  displayDoctorName,
  displayEmployeeName,
  sortRecentAcquisitions,
  useDoctorAcquisitionDashboard,
  type AcquisitionAmbassador,
  type AcquisitionBreakdown,
  type AcquisitionChannelSummary,
  type AcquisitionKpiInformation,
  type AcquisitionOwnerWorkload,
  type AcquisitionTimelineItem,
  type DoctorAcquisitionRecord,
} from "@/lib/doctor-acquisition-dashboard";
import { cn } from "@/lib/utils";

const PIPELINE_WRITE_ROLES = [
  "ceo",
  "coo",
  "cto",
  "executive_other",
  "department_head",
  "manager",
] as const;

const PIPELINE_STATUS_OPTIONS = [
  "prospect",
  "contacted",
  "interested",
  "enrolled",
  "converted",
  "lost",
] as const;

const CONTACT_CHANNEL_OPTIONS = [
  "email",
  "phone",
  "whatsapp",
  "sms",
  "linkedin",
  "in_person",
  "other",
] as const;

const CONTACT_OUTCOME_OPTIONS = [
  "attempted",
  "connected",
  "no_answer",
  "callback_requested",
  "interested",
  "not_interested",
  "enrolled",
  "wrong_contact",
  "other",
] as const;

function humaniseOption(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatLiveDate(value: string | null) {
  if (!value) return "Date not provided";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en-ZA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
}

function formatPercent(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function formatKpiValue(value: number | null, unit: string | null) {
  if (value === null) return "Unavailable";
  return `${value}${unit ? ` ${unit}` : ""}`;
}

function statusClass(status: string) {
  const value = status.trim().toLowerCase();
  if (
    ["converted", "enrolled", "active", "complete", "completed", "resolved"].includes(
      value,
    )
  ) {
    return "bg-[#e8f8f2] text-[#168465]";
  }
  if (["lost", "inactive", "closed", "cancelled", "canceled"].includes(value)) {
    return "bg-[#ffe5e3] text-[#bd504d]";
  }
  if (["contacted", "in progress", "assigned", "open"].includes(value)) {
    return "bg-[#f1edff] text-[#755bc0]";
  }
  return "bg-[#fff2d9] text-[#9a6419]";
}

function isResolvedStatus(status: string) {
  return [
    "completed",
    "complete",
    "closed",
    "done",
    "resolved",
    "remediated",
    "cancelled",
    "canceled",
    "expired",
    "dismissed",
  ].includes(status.trim().toLowerCase().replace(/[_-]+/g, " "));
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

function Metric({
  label,
  value,
  detail,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "mint" | "blue" | "amber" | "red" | "purple";
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_5px_20px_rgba(21,36,58,0.035)]">
      <span
        className={cn(
          "grid size-9 place-items-center rounded-xl",
          tone === "mint" && "bg-[#e8f8f2] text-[#1b9975]",
          tone === "blue" && "bg-[#eaf3ff] text-[#4a87c9]",
          tone === "amber" && "bg-[#fff2d9] text-[#b3781f]",
          tone === "red" && "bg-[#ffe9e6] text-[#bf5b56]",
          tone === "purple" && "bg-[#f1edff] text-[#755bc0]",
        )}
      >
        <Icon size={17} />
      </span>
      <p className="mt-4 text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 font-display text-[26px] font-bold tracking-[-0.06em] text-[#152239]">
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
  icon: typeof Activity;
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
          <h2 className="font-display text-[16px] font-bold text-[#152239]">
            {title}
          </h2>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function BreakdownList({ rows }: { rows: AcquisitionBreakdown[] }) {
  if (!rows.length) return <StateMessage>No live values are available.</StateMessage>;
  return (
    <div className="space-y-2">
      {rows.slice(0, 8).map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f9fb] px-3 py-2.5"
        >
          <span className="truncate text-[11px] font-medium text-slate-600">
            {row.label}
          </span>
          <span className="shrink-0 font-display text-[17px] font-bold text-[#152239]">
            {row.count}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChannelTable({ channels }: { channels: AcquisitionChannelSummary[] }) {
  if (!channels.length) return <StateMessage>No channel data is available.</StateMessage>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-[10px]">
        <thead className="text-[9px] uppercase tracking-[0.12em] text-slate-400">
          <tr>
            <th className="pb-2 font-bold">Channel</th>
            <th className="pb-2 text-right font-bold">Records</th>
            <th className="pb-2 text-right font-bold">Contacted</th>
            <th className="pb-2 text-right font-bold">Enrolled</th>
            <th className="pb-2 text-right font-bold">Converted</th>
            <th className="pb-2 text-right font-bold">Lost</th>
            <th className="pb-2 text-right font-bold">Conversion</th>
          </tr>
        </thead>
        <tbody>
          {channels.slice(0, 8).map((channel) => (
            <tr key={channel.label} className="border-t border-slate-100">
              <td className="max-w-[180px] truncate py-3 font-semibold text-slate-600">
                {channel.label}
              </td>
              <td className="py-3 text-right font-bold text-[#152239]">{channel.recordCount}</td>
              <td className="py-3 text-right text-slate-500">{channel.contactedCount}</td>
              <td className="py-3 text-right text-slate-500">{channel.enrolledCount}</td>
              <td className="py-3 text-right text-slate-500">{channel.convertedCount}</td>
              <td className="py-3 text-right text-slate-500">{channel.lostCount}</td>
              <td className="py-3 text-right font-semibold text-[#168465]">
                {formatPercent(channel.conversionRate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OwnerCard({ owner }: { owner: AcquisitionOwnerWorkload }) {
  return (
    <div className="rounded-xl bg-[#f7f9fb] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold text-slate-700">{owner.name}</p>
          <p className="mt-1 truncate text-[10px] text-slate-400">
            {owner.jobTitle || "Acquisition owner"}
          </p>
        </div>
        <span className="font-display text-[19px] font-bold text-[#152239]">{owner.count}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-slate-400">
        <span>{owner.prospectsCount} prospects</span>
        <span>{owner.contactedCount} contacted</span>
        <span>{owner.convertedCount} converted</span>
      </div>
      <p className="mt-2 text-[10px] text-slate-400">
        {owner.statuses.map((status) => `${status.label}: ${status.count}`).join(" · ")}
      </p>
    </div>
  );
}

function CampaignSummary({
  total,
  active,
  acquisitions,
  enrolled,
  converted,
  notMarked,
}: {
  total: number;
  active: number;
  acquisitions: number;
  enrolled: number;
  converted: number;
  notMarked: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[
        ["Campaign doctors", total],
        ["Active doctors", active],
        ["Acquisition records", acquisitions],
        ["Enrolled records", enrolled],
        ["Converted records", converted],
        ["Not marked", notMarked],
      ].map(([label, value]) => (
        <div key={label} className="rounded-xl bg-[#f7f9fb] px-3 py-3">
          <p className="text-[10px] leading-4 text-slate-500">{label}</p>
          <strong className="mt-1 block font-display text-[21px] text-[#152239]">{value}</strong>
        </div>
      ))}
    </div>
  );
}

function DoctorRow({ record }: { record: DoctorAcquisitionRecord }) {
  const doctor = record.doctor;
  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="py-3 pr-4">
        <p className="font-bold text-slate-700">{displayDoctorName(doctor)}</p>
        <p className="mt-1 text-slate-400">
          {doctor?.practice_name || doctor?.specialty || "Practice details unavailable"}
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-[9px] text-slate-400">
          {doctor?.email && (
            <span className="inline-flex items-center gap-1"><Mail size={11} />{doctor.email}</span>
          )}
          {doctor?.phone && (
            <span className="inline-flex items-center gap-1"><Phone size={11} />{doctor.phone}</span>
          )}
        </div>
      </td>
      <td className="py-3 pr-4 text-slate-500">
        <p>{doctor?.specialty || "Specialty not provided"}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-slate-400">
          <MapPin size={11} />{doctor?.city || doctor?.province || "Location not provided"}
        </p>
      </td>
      <td className="py-3 pr-4 text-slate-500">
        <p>{record.acquisition_channel?.trim() || "Unknown / Unspecified"}</p>
        <p className="mt-1 text-slate-400">{record.source_detail?.trim() || "Source detail not provided"}</p>
      </td>
      <td className="py-3 pr-4 text-slate-500">{displayEmployeeName(record.owner)}</td>
      <td className="py-3 pr-4">
        <span className={cn("inline-flex rounded-full px-2 py-1 text-[9px] font-bold", statusClass(record.status))}>
          {record.status}
        </span>
        <p className="mt-2 text-[9px] text-slate-400">
          {doctor?.first_1000_campaign ? "First-1000" : "Standard pipeline"}
          {doctor?.active === false ? " · Inactive doctor" : ""}
        </p>
      </td>
      <td className="whitespace-nowrap py-3 text-right text-slate-400">{formatLiveDate(record.updated_at)}</td>
    </tr>
  );
}

function TimelineRow({ item }: { item: AcquisitionTimelineItem }) {
  return (
    <div className="flex gap-3 border-b border-slate-100 py-3 last:border-0">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#eaf3ff] text-[#4a87c9]">
        <CircleDot size={14} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-700">{item.event}</p>
        <p className="mt-1 truncate text-[10px] text-slate-400">{item.doctorName}</p>
      </div>
      <div className="ml-auto shrink-0 text-right">
        <p className="text-[10px] text-slate-500">{formatLiveDate(item.occurredAt)}</p>
        <span className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold", statusClass(item.status))}>
          {item.status}
        </span>
      </div>
    </div>
  );
}

function KpiRow({ information }: { information: AcquisitionKpiInformation }) {
  const target = information.target?.target_value ?? null;
  const result = information.result?.actual_value ?? null;
  return (
    <div className="rounded-xl bg-[#f7f9fb] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold text-slate-700">{information.kpi.name}</p>
          <p className="mt-1 text-[10px] text-slate-400">{information.kpi.code} · {information.period?.period_name || "No KPI period available"}</p>
        </div>
        <span className={cn("inline-flex rounded-full px-2 py-1 text-[9px] font-bold", information.result ? statusClass(information.result.status) : "bg-slate-100 text-slate-500")}>
          {information.result ? information.result.status : "No result"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded-lg bg-white px-2.5 py-2">
          <span className="block text-slate-400">Target</span>
          <strong className="mt-1 block text-slate-700">{information.target ? formatKpiValue(target, information.kpi.unit) : "No target"}</strong>
        </div>
        <div className="rounded-lg bg-white px-2.5 py-2">
          <span className="block text-slate-400">Actual result</span>
          <strong className="mt-1 block text-slate-700">{information.result ? formatKpiValue(result, information.kpi.unit) : "No result"}</strong>
        </div>
      </div>
      {information.result?.commentary && (
        <p className="mt-2 text-[10px] leading-4 text-slate-400">{information.result.commentary}</p>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700 outline-none focus:border-[#755bc0]";

function AddDoctorForm() {
  const { createPipelineEntry } = useDoctorPipelineMutations();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const empty = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialty: "",
    practiceName: "",
    city: "",
    acquisitionChannel: "email",
    notes: "",
  };
  const [form, setForm] = useState(empty);

  const update =
    (key: keyof typeof empty) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    void createPipelineEntry
      .mutateAsync({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        specialty: form.specialty.trim() || null,
        practiceName: form.practiceName.trim() || null,
        city: form.city.trim() || null,
        acquisitionChannel: form.acquisitionChannel || null,
        notes: form.notes.trim() || null,
      })
      .then(() => {
        setForm(empty);
        setOpen(false);
      })
      .catch((submitError: unknown) => {
        setError(submitError instanceof Error ? submitError.message : "The doctor could not be added.");
      });
  };

  return (
    <div className="rounded-xl border border-slate-200/80 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-slate-700">Add a doctor to the pipeline</p>
          <p className="mt-1 text-[10px] text-slate-400">
            New entries start in the prospect state so the team can work them through to enrolment.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#f1edff] px-3 py-2 text-[10px] font-bold text-[#755bc0] hover:bg-[#e8e1ff]"
        >
          <Plus size={12} /> {open ? "Close" : "Add doctor"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-3 grid gap-2 sm:grid-cols-2">
          <input className={inputClass} placeholder="First name" value={form.firstName} onChange={update("firstName")} />
          <input className={inputClass} placeholder="Last name" value={form.lastName} onChange={update("lastName")} />
          <input className={inputClass} placeholder="Email" value={form.email} onChange={update("email")} />
          <input className={inputClass} placeholder="Phone" value={form.phone} onChange={update("phone")} />
          <input className={inputClass} placeholder="Specialty" value={form.specialty} onChange={update("specialty")} />
          <input className={inputClass} placeholder="Practice name" value={form.practiceName} onChange={update("practiceName")} />
          <input className={inputClass} placeholder="City" value={form.city} onChange={update("city")} />
          <select className={inputClass} value={form.acquisitionChannel} onChange={update("acquisitionChannel")}>
            {CONTACT_CHANNEL_OPTIONS.map((channel) => (
              <option key={channel} value={channel}>
                {humaniseOption(channel)}
              </option>
            ))}
          </select>
          <textarea
            className={cn(inputClass, "sm:col-span-2")}
            rows={2}
            placeholder="Notes"
            value={form.notes}
            onChange={update("notes")}
          />
          {error && <p className="text-[10px] text-[#bd504d] sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={createPipelineEntry.isPending}
              className="inline-flex items-center gap-1 rounded-lg bg-[#755bc0] px-4 py-2 text-[10px] font-bold text-white hover:bg-[#674fb0] disabled:opacity-60"
            >
              <Plus size={12} /> {createPipelineEntry.isPending ? "Saving..." : "Save prospect"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function PipelineRow({
  record,
  ambassadors,
}: {
  record: DoctorAcquisitionRecord;
  ambassadors: AcquisitionAmbassador[];
}) {
  const { updateAcquisitionStatus, logContactAttempt, assignAmbassador } = useDoctorPipelineMutations();
  const doctor = record.doctor;
  const [logging, setLogging] = useState(false);
  const [channel, setChannel] = useState<string>(CONTACT_CHANNEL_OPTIONS[0]);
  const [outcome, setOutcome] = useState<string>(CONTACT_OUTCOME_OPTIONS[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const changeStatus = (status: string) => {
    setError(null);
    void updateAcquisitionStatus
      .mutateAsync({ id: record.id, doctorId: record.doctor_id, status })
      .catch((changeError: unknown) => {
        setError(changeError instanceof Error ? changeError.message : "Status could not be updated.");
      });
  };

  const changeAmbassador = (ambassadorId: string) => {
    if (!ambassadorId) return;
    setError(null);
    void assignAmbassador
      .mutateAsync({ doctorId: record.doctor_id, ambassadorId })
      .catch((changeError: unknown) => {
        setError(changeError instanceof Error ? changeError.message : "Ambassador could not be assigned.");
      });
  };

  const submitLog = () => {
    setError(null);
    void logContactAttempt
      .mutateAsync({ doctorId: record.doctor_id, channel, outcome, notes: note.trim() || null })
      .then(() => {
        setLogging(false);
        setNote("");
        setOutcome(CONTACT_OUTCOME_OPTIONS[0]);
      })
      .catch((logError: unknown) => {
        setError(logError instanceof Error ? logError.message : "The contact attempt could not be logged.");
      });
  };

  return (
    <>
      <tr className="border-t border-slate-100 align-top">
        <td className="py-3 pr-4">
          <p className="font-bold text-slate-700">{displayDoctorName(doctor)}</p>
          <p className="mt-1 text-slate-400">{doctor?.practice_name || doctor?.specialty || "Practice details unavailable"}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[9px] text-slate-400">
            {doctor?.email && <span className="inline-flex items-center gap-1"><Mail size={11} />{doctor.email}</span>}
            {doctor?.phone && <span className="inline-flex items-center gap-1"><Phone size={11} />{doctor.phone}</span>}
          </div>
        </td>
        <td className="py-3 pr-4">
          <select
            value={record.status}
            onChange={(event) => changeStatus(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-600 outline-none focus:border-[#755bc0]"
          >
            {PIPELINE_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{humaniseOption(status)}</option>
            ))}
          </select>
          <p className="mt-2 text-[9px] text-slate-400">Source: {record.acquisition_channel ? humaniseOption(record.acquisition_channel) : "Unspecified"}</p>
        </td>
        <td className="py-3 pr-4">
          <select
            value={record.ambassador?.id ?? ""}
            onChange={(event) => changeAmbassador(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-600 outline-none focus:border-[#755bc0]"
          >
            <option value="">Unassigned</option>
            {ambassadors.map((ambassador) => (
              <option key={ambassador.id} value={ambassador.id}>{displayAmbassadorName(ambassador)}</option>
            ))}
          </select>
          <p className="mt-2 text-[9px] text-slate-400">{record.ambassador ? "Ambassador assigned" : "No ambassador assigned"}</p>
        </td>
        <td className="py-3 pr-4 text-slate-500">
          <p className="font-semibold text-slate-600">{record.contactCount} contact{record.contactCount === 1 ? "" : "s"}</p>
          <p className="mt-1 text-[9px] text-slate-400">{record.lastContactAt ? formatLiveDate(record.lastContactAt) : "No contact logged"}</p>
          {record.lastContactNote && <p className="mt-1 line-clamp-2 text-[9px] text-slate-400">{record.lastContactNote}</p>}
        </td>
        <td className="py-3">
          <button
            type="button"
            onClick={() => setLogging((value) => !value)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:border-[#bfe9da] hover:bg-[#f2fcf8]"
          >
            <Send size={11} /> Log contact
          </button>
        </td>
      </tr>
      {logging && (
        <tr className="border-t border-slate-100 bg-[#f9fbfd]">
          <td colSpan={5} className="px-3 py-3">
            <div className="grid gap-2 sm:grid-cols-4">
              <select className={inputClass} value={channel} onChange={(event) => setChannel(event.target.value)}>
                {CONTACT_CHANNEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>{humaniseOption(option)}</option>
                ))}
              </select>
              <select className={inputClass} value={outcome} onChange={(event) => setOutcome(event.target.value)}>
                {CONTACT_OUTCOME_OPTIONS.map((option) => (
                  <option key={option} value={option}>{humaniseOption(option)}</option>
                ))}
              </select>
              <input className={cn(inputClass, "sm:col-span-2")} placeholder="What happened? e.g. sent intro email" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
            {error && <p className="mt-2 text-[10px] text-[#bd504d]">{error}</p>}
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={submitLog}
                disabled={logContactAttempt.isPending}
                className="inline-flex items-center gap-1 rounded-lg bg-[#755bc0] px-3 py-1.5 text-[10px] font-bold text-white hover:bg-[#674fb0] disabled:opacity-60"
              >
                <Send size={11} /> {logContactAttempt.isPending ? "Saving..." : "Save contact"}
              </button>
              <button type="button" onClick={() => setLogging(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-500">
                Cancel
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DoctorPipelineSection({
  records,
  ambassadors,
}: {
  records: DoctorAcquisitionRecord[];
  ambassadors: AcquisitionAmbassador[];
}) {
  return (
    <Section
      title="Doctor pipeline"
      description="Your working pipeline of doctors. Add prospects, move them through the stages, log every contact and record the ambassador who referred them."
      icon={Target}
    >
      <IfPermitted roleKinds={[...PIPELINE_WRITE_ROLES]}>
        <AddDoctorForm />
      </IfPermitted>
      {records.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[10px]">
            <thead className="text-[9px] uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="pb-2 font-bold">Doctor</th>
                <th className="pb-2 font-bold">Stage</th>
                <th className="pb-2 font-bold">Ambassador</th>
                <th className="pb-2 font-bold">Contact history</th>
                <th className="pb-2 font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <PipelineRow key={record.id} record={record} ambassadors={ambassadors} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-3">
          <StateMessage>No doctors in the pipeline yet. Add the first prospect above.</StateMessage>
        </div>
      )}
    </Section>
  );
}

function ContactActivityList({ attempts }: { attempts: import("@/lib/doctor-acquisition-dashboard").AcquisitionContactAttempt[] }) {
  if (!attempts.length) return <StateMessage>No contact activity has been logged yet.</StateMessage>;
  const recent = [...attempts].sort((a, b) => new Date(b.contacted_at).valueOf() - new Date(a.contacted_at).valueOf());
  return (
    <div className="space-y-2">
      {recent.slice(0, 8).map((attempt) => (
        <div key={attempt.id} className="flex items-start justify-between gap-3 rounded-xl bg-[#f7f9fb] px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-600">
              {humaniseOption(attempt.contact_channel)} · {humaniseOption(attempt.outcome)}
            </p>
            {attempt.notes && <p className="mt-1 truncate text-[10px] text-slate-400">{attempt.notes}</p>}
          </div>
          <span className="shrink-0 text-[10px] text-slate-400">{formatLiveDate(attempt.contacted_at)}</span>
        </div>
      ))}
    </div>
  );
}

export default function DoctorAcquisition() {
  const dashboard = useDoctorAcquisitionDashboard();
  const data = dashboard.data;
  const metrics = buildDoctorAcquisitionMetrics(data);
  const operations = buildAcquisitionOperationalSummary(data);
  const kpiInformation = buildAcquisitionKpiInformation(data);
  const timeline = buildAcquisitionTimeline(data?.acquisitions ?? []);
  const recentRecords = sortRecentAcquisitions(data?.acquisitions ?? []);
  const optionalErrors = data?.optionalErrors ?? [];
  const tasksUnavailable = optionalErrors.some((error) => error.startsWith("task "));
  const ticketsUnavailable = optionalErrors.some((error) => error.startsWith("ticket "));
  const kpisUnavailable = optionalErrors.some((error) => error.startsWith("KPI"));
  const alertsUnavailable = optionalErrors.some((error) => error.startsWith("company alert"));

  return (
    <AppShell>
      <div className="mx-auto max-w-[1480px] px-5 pb-12 pt-8 sm:px-8 xl:px-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#b3781f]">
              <Stethoscope size={13} /> Operations · Doctor Acquisition
            </div>
            <h1 className="max-w-[980px] font-display text-[32px] font-bold tracking-[-0.06em] text-[#152239] sm:text-[39px]">
              Doctor acquisition, with a source for every enrolment.
            </h1>
            <p className="mt-2 max-w-[820px] text-[13px] leading-6 text-slate-500">
              Live acquisition records, doctor context, ownership, operational follow-up and conversion milestones from the authenticated organisation.
            </p>
          </div>
          <div className="rounded-2xl border border-[#cfeee2] bg-[#f0fbf6] px-4 py-3 text-[10px] text-[#247e65]">
            <p className="font-bold uppercase tracking-[0.12em]">Live pipeline</p>
            <p className="mt-1">Leads and contact history are scoped to your organisation by Supabase RLS.</p>
          </div>
        </div>

        {dashboard.isPending && (
          <div className="mt-5"><StateMessage>Loading live doctor acquisition data...</StateMessage></div>
        )}
        {dashboard.isError && (
          <div className="mt-5"><StateMessage tone="error">Doctor acquisition data could not be loaded. Try again after the connection is available.</StateMessage></div>
        )}

        {data && !dashboard.isError && (
          <>
            {optionalErrors.length > 0 && (
              <div className="mt-5">
                <StateMessage tone="warning">
                  Core acquisition data is available. Some optional panels are unavailable: {optionalErrors.join(" ")}
                </StateMessage>
              </div>
            )}
            {!metrics.recordCount && (
              <div className="mt-5"><StateMessage>No doctor acquisition records yet. Related operational and KPI panels will populate when supported records exist.</StateMessage></div>
            )}

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <Metric label="Total records" value={String(metrics.recordCount)} detail={`${metrics.uniqueDoctorCount} unique doctors represented`} tone="blue" icon={Stethoscope} />
              <Metric label="Prospects" value={String(metrics.prospectsCount)} detail="Records with prospect status" tone="amber" icon={CircleDot} />
              <Metric label="Contacted" value={String(metrics.contactedCount)} detail={`${formatPercent(metrics.contactRate)} of records`} tone="purple" icon={Activity} />
              <Metric label="Enrolled" value={String(metrics.enrolledCount)} detail={`${formatPercent(metrics.enrollmentRate)} of records`} tone="mint" icon={CheckCircle2} />
              <Metric label="Converted" value={String(metrics.convertedCount)} detail={`${formatPercent(metrics.conversionRate)} of records`} tone="mint" icon={Target} />
              <Metric label="Lost" value={String(metrics.lostCount)} detail={`${formatPercent(metrics.lostRate)} of records`} tone="red" icon={AlertTriangle} />
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
              <DoctorPipelineSection records={recentRecords} ambassadors={data.ambassadors} />
              <Section title="Recent contact activity" description="Every contact attempt logged against a pipeline doctor." icon={Send}>
                <ContactActivityList attempts={data.contactAttempts} />
              </Section>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <Section title="Acquisition channels" description="Actual channel values with milestone counts and conversion rates. No channel is ranked as best or worst." icon={BarChart3}>
                <ChannelTable channels={metrics.channels} />
              </Section>
              <Section title="Pipeline status" description="Actual doctor_acquisition.status values returned by the organisation." icon={CircleDot}>
                <BreakdownList rows={metrics.statuses} />
              </Section>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-3">
              <Section title="Owner workload" description="Acquisition records grouped by their existing owner_employee_id relationship." icon={Users}>
                <div className="space-y-2">
                  {metrics.ownerWorkload.length ? metrics.ownerWorkload.slice(0, 8).map((owner) => <OwnerCard key={owner.id ?? "unassigned"} owner={owner} />) : <StateMessage>No owner workload is available.</StateMessage>}
                </div>
              </Section>
              <Section title="First-1000 campaign" description="Factual campaign flags from related doctors. No target is invented." icon={CalendarDays}>
                <CampaignSummary total={metrics.first1000DoctorCount} active={metrics.first1000ActiveDoctorCount} acquisitions={metrics.first1000AcquisitionCount} enrolled={metrics.first1000EnrolledCount} converted={metrics.first1000ConvertedCount} notMarked={metrics.nonFirst1000DoctorCount} />
              </Section>
              <Section title="Source detail" description="Recorded source_detail values, including a display fallback for missing values." icon={MapPin}>
                <BreakdownList rows={metrics.sourceDetails} />
              </Section>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <Section title="Doctor and acquisition records" description="Recent records with doctor context, contact details, source, owner and campaign status." icon={Stethoscope}>
                {recentRecords.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px] text-left text-[10px]">
                      <thead className="text-[9px] uppercase tracking-[0.12em] text-slate-400">
                        <tr><th className="pb-2 font-bold">Doctor</th><th className="pb-2 font-bold">Practice context</th><th className="pb-2 font-bold">Source</th><th className="pb-2 font-bold">Owner</th><th className="pb-2 font-bold">Status</th><th className="pb-2 text-right font-bold">Updated</th></tr>
                      </thead>
                      <tbody>{recentRecords.slice(0, 12).map((record) => <DoctorRow key={record.id} record={record} />)}</tbody>
                    </table>
                  </div>
                ) : <StateMessage>No doctor acquisition records yet.</StateMessage>}
              </Section>
              <Section title="Acquisition timeline" description="Chronological events derived only from stored acquisition timestamps." icon={Clock3}>
                {timeline.length ? timeline.slice(0, 10).map((item) => <TimelineRow key={item.id} item={item} />) : <StateMessage>No stored acquisition timestamps are available.</StateMessage>}
              </Section>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <Section title="Operational follow-up" description="Tasks and tickets matched through existing department or assigned-owner relationships; no acquisition foreign key is assumed." icon={Ticket}>
                {tasksUnavailable || ticketsUnavailable ? (
                  <StateMessage tone="warning">{tasksUnavailable ? "Task data is unavailable." : ""}{tasksUnavailable && ticketsUnavailable ? " " : ""}{ticketsUnavailable ? "Ticket data is unavailable." : ""}</StateMessage>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-[#f7f9fb] p-3"><p className="text-[10px] text-slate-400">Related tasks</p><strong className="mt-1 block font-display text-[24px] text-[#152239]">{operations.relatedTaskCount}</strong><p className="mt-1 text-[10px] text-slate-400">{operations.openTaskCount} open · {operations.overdueTaskCount} overdue</p></div>
                    <div className="rounded-xl bg-[#f7f9fb] p-3"><p className="text-[10px] text-slate-400">Related tickets</p><strong className="mt-1 block font-display text-[24px] text-[#152239]">{operations.relatedTicketCount}</strong><p className="mt-1 text-[10px] text-slate-400">{operations.openTicketCount} open · {operations.overdueTicketCount} overdue</p></div>
                    <div className="sm:col-span-2 space-y-2">
                      {[...(data.tasks.filter((task) => !isResolvedStatus(task.status)).map((task) => ({ id: task.id, title: task.title, status: task.status, due: task.due_date, kind: "Task" }))), ...(data.tickets.filter((ticket) => !isResolvedStatus(ticket.status)).map((ticket) => ({ id: ticket.id, title: ticket.title, status: ticket.status, due: ticket.due_date, kind: "Ticket" })))]
                        .slice(0, 6)
                        .map((item) => <div key={`${item.kind}-${item.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5"><div className="min-w-0"><p className="truncate text-[11px] font-semibold text-slate-600">{item.title}</p><p className="mt-1 text-[10px] text-slate-400">{item.kind} · due {formatLiveDate(item.due)}</p></div><span className={cn("shrink-0 rounded-full px-2 py-1 text-[9px] font-bold", statusClass(item.status))}>{item.status}</span></div>)}
                      {!data.tasks.some((task) => !isResolvedStatus(task.status)) && !data.tickets.some((ticket) => !isResolvedStatus(ticket.status)) && <StateMessage>No open related tasks or tickets.</StateMessage>}
                    </div>
                  </div>
                )}
              </Section>
              <Section title="KPI information" description="Existing organisation KPIs with relationship-scoped periods, targets and results. Missing values are not converted to zero." icon={Target}>
                {kpisUnavailable ? <StateMessage tone="warning">KPI data is unavailable.</StateMessage> : kpiInformation.length ? <div className="space-y-2">{kpiInformation.slice(0, 6).map((information) => <KpiRow key={information.kpi.id} information={information} />)}</div> : <StateMessage>No organisation KPI information is available.</StateMessage>}
              </Section>
            </div>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <Section title="Active company alerts" description="Existing active alerts visible to the authenticated organisation." icon={AlertTriangle}>
                {alertsUnavailable ? <StateMessage tone="warning">Company alert data is unavailable.</StateMessage> : data.alerts.length ? <div className="space-y-2">{data.alerts.slice(0, 6).map((alert) => <div key={alert.id} className="rounded-xl border border-slate-100 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold text-slate-700">{alert.title}</p><p className="mt-1 text-[10px] leading-5 text-slate-500">{alert.message}</p></div><span className={cn("shrink-0 rounded-full px-2 py-1 text-[9px] font-bold", statusClass(alert.severity))}>{alert.severity}</span></div><p className="mt-2 text-[9px] text-slate-400">{formatLiveDate(alert.starts_at)} · {alert.status}</p></div>)}</div> : <StateMessage>No active company alerts.</StateMessage>}
              </Section>
              <Section title="Source and scope" description="How this command centre relates to the existing security model." icon={CheckCircle2}>
                <div className="space-y-2 text-[11px] leading-5 text-slate-500">
                  <p className="rounded-xl bg-[#f7f9fb] p-3">Acquisition records are selected without an organization_id filter because that column does not exist. Supabase RLS scopes them through doctor_acquisition.doctor_id → doctors.organization_id.</p>
                  <p className="rounded-xl bg-[#f7f9fb] p-3">Doctors, employees, departments, tasks, tickets, KPIs, periods and alerts are selected with the authenticated organisation context. KPI targets and results are filtered only through their KPI and period relationships.</p>
                  <p className="rounded-xl bg-[#f7f9fb] p-3">The doctor pipeline lets permitted roles add prospects, move them through the acquisition stages, log every contact attempt and assign a referring ambassador. Those writes are limited to the doctor pipeline tables and stay inside the organisation.</p>
                </div>
              </Section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
