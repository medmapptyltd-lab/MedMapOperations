import { FormEvent, useMemo, useState } from "react";
import { BarChart3, Plus, Save, Target } from "lucide-react";
import { AppShell } from "@/components/medmap/AppShell";
import { IfPermitted } from "@/components/medmap/IfPermitted";
import { useExecutiveSummary, buildKpiRows, type ExecutiveKpiRow } from "@/lib/executive-dashboard";
import { useKpiMutations, type KpiTargetInput, type KpiResultInput } from "@/lib/crud";
import { cn } from "@/lib/utils";

type KpiSectionState = "loading" | "empty" | "error" | "ready";

function getSectionState<T>(
  isPending: boolean,
  isError: boolean,
  items: readonly T[] | undefined,
): KpiSectionState {
  if (isPending) return "loading";
  if (isError) return "error";
  if (!items || items.length === 0) return "empty";
  return "ready";
}

function LoadingSection() {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto grid size-10 place-items-center rounded-xl bg-slate-100">
        <BarChart3 size={18} className="animate-pulse text-slate-400" />
      </div>
      <p className="mt-3 text-[11px] font-medium text-slate-400">Loading KPI register…</p>
    </div>
  );
}

function ErrorSection({ message }: { message?: string }) {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto grid size-10 place-items-center rounded-xl bg-[#ffe5e3]">
        <Target size={18} className="text-[#bd504d]" />
      </div>
      <p className="mt-3 text-[11px] font-bold text-[#bd504d]">Could not load KPIs</p>
      <p className="mt-1 text-[10px] text-slate-400">{message ?? "Refresh the page and try again."}</p>
    </div>
  );
}

function formatPercentage(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value.toFixed(1)}%`;
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-ZA", { maximumFractionDigits: 2 });
}

function evaluateAchievementStatus(achievement: number | null) {
  if (achievement === null || !Number.isFinite(achievement)) return "unset" as const;
  if (achievement >= 100) return "healthy" as const;
  if (achievement >= 80) return "attention" as const;
  return "critical" as const;
}

function AchievementPill({ achievement }: { achievement: number | null }) {
  const status = evaluateAchievementStatus(achievement);
  return (
    <span
      className={cn(
        "rounded-full px-2 py-1 text-[9px] font-bold",
        status === "healthy" && "bg-[#e8f8f2] text-[#168465]",
        status === "attention" && "bg-[#fff2d9] text-[#9a6419]",
        status === "critical" && "bg-[#ffe5e3] text-[#bd504d]",
        status === "unset" && "bg-slate-100 text-slate-500",
      )}
    >
      {formatPercentage(achievement)}
    </span>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

export default function KPIs() {
  const { kpis: kpisQuery } = useExecutiveSummary();
  const { createTarget, createResult } = useKpiMutations();

  const { rows, period } = useMemo(() => buildKpiRows(kpisQuery.data), [kpisQuery.data]);
  const sectionState = getSectionState(kpisQuery.isPending, kpisQuery.isError, kpisQuery.data?.kpis);

  const [showAddTarget, setShowAddTarget] = useState(false);
  const [showAddResult, setShowAddResult] = useState(false);

  const periods = kpisQuery.data?.periods ?? [];
  const kpis = kpisQuery.data?.kpis ?? [];

  const [targetForm, setTargetForm] = useState<KpiTargetInput>({
    kpiId: kpis[0]?.id ?? "",
    periodId: period?.id ?? periods[0]?.id ?? "",
    targetValue: 0,
    greenThreshold: 100,
    yellowThreshold: 80,
    criticalThreshold: 0,
    notes: "",
  });

  const [resultForm, setResultForm] = useState<KpiResultInput>({
    kpiId: kpis[0]?.id ?? "",
    periodId: period?.id ?? periods[0]?.id ?? "",
    actualValue: 0,
    commentary: "",
    status: "not_started",
  });

  const submitTarget = (event: FormEvent) => {
    event.preventDefault();
    if (!targetForm.kpiId || !targetForm.periodId) return;
    void createTarget.mutateAsync(targetForm);
    setTargetForm((current) => ({ ...current, targetValue: 0, notes: "" }));
    setShowAddTarget(false);
  };

  const submitResult = (event: FormEvent) => {
    event.preventDefault();
    if (!resultForm.kpiId || !resultForm.periodId) return;
    const kpiId = resultForm.kpiId;
    const periodId = resultForm.periodId;
    const targetForKpi = kpisQuery.data?.targets.find(
      (t) => t.kpi_id === kpiId && t.period_id === periodId,
    );
    const calculatedPercentage =
      targetForKpi?.target_value && targetForKpi.target_value > 0
        ? Math.min(999, (resultForm.actualValue / targetForKpi.target_value) * 100)
        : null;
    const status: KpiResultInput["status"] =
      calculatedPercentage === null
        ? "not_started"
        : calculatedPercentage >= (targetForm.greenThreshold ?? 100)
          ? "complete"
          : calculatedPercentage >= (targetForm.yellowThreshold ?? 80)
            ? "yellow"
            : "red";
    void createResult.mutateAsync({
      ...resultForm,
      targetId: targetForKpi?.id ?? null,
      calculatedPercentage,
      status,
    });
    setResultForm((current) => ({ ...current, actualValue: 0, commentary: "" }));
    setShowAddResult(false);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-5 pb-12 pt-8 sm:px-8 xl:px-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#4a87c9]">
              <BarChart3 size={13} /> Company KPIs
            </div>
            <h1 className="font-display text-[32px] font-bold tracking-[-0.06em] text-[#152239] sm:text-[39px]">
              Measure what has an owner.
            </h1>
            <p className="mt-2 max-w-[740px] text-[13px] leading-6 text-slate-500">
              KPIs are reusable records with editable targets, periods and results. Achievement is
              calculated directly from actual divided by target.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start md:self-auto">
            <IfPermitted
              roleKinds={["ceo", "coo", "cto", "executive_other", "department_head", "manager"]}
            >
              <button
                type="button"
                onClick={() => {
                  setShowAddTarget((current) => !current);
                  setShowAddResult(false);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#182842] px-3.5 py-2.5 text-[11px] font-bold text-white shadow-[0_5px_12px_rgba(20,35,58,.15)] hover:bg-[#233958]"
              >
                <Plus size={15} /> Add target
              </button>
            </IfPermitted>
            <IfPermitted
              roleKinds={["ceo", "coo", "cto", "executive_other", "department_head", "manager"]}
            >
              <button
                type="button"
                onClick={() => {
                  setShowAddResult((current) => !current);
                  setShowAddTarget(false);
                }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[11px] font-bold text-slate-600 shadow-sm hover:border-slate-300"
            >
              <Plus size={15} /> Record result
            </button>
            </IfPermitted>
          </div>
        </div>

        {showAddTarget && (
          <form
            onSubmit={submitTarget}
            className="mt-6 rounded-2xl border border-[#c9d7ec] bg-[#f7faff] p-5 sm:p-6"
          >
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#eaf3ff] text-[#4a87c9]">
                <Target size={16} />
              </span>
              <h2 className="font-display text-[16px] font-bold text-[#152239]">
                Create KPI target
              </h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-[10px] font-bold text-slate-500 sm:col-span-2">
                KPI
                <select
                  required
                  value={targetForm.kpiId}
                  onChange={(e) =>
                    setTargetForm((current) => ({ ...current, kpiId: e.target.value }))
                  }
                  className="form-input"
                >
                  <option value="">Select a KPI</option>
                  {kpis.map((kpi) => (
                    <option key={kpi.id} value={kpi.id}>
                      {kpi.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Period
                <select
                  required
                  value={targetForm.periodId}
                  onChange={(e) =>
                    setTargetForm((current) => ({ ...current, periodId: e.target.value }))
                  }
                  className="form-input"
                >
                  <option value="">Select period</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.period_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Target value
                <input
                  type="number"
                  min="0"
                  required
                  value={targetForm.targetValue}
                  onChange={(e) =>
                    setTargetForm((current) => ({
                      ...current,
                      targetValue: Number(e.target.value),
                    }))
                  }
                  className="form-input"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Green ≥ %
                <input
                  type="number"
                  value={targetForm.greenThreshold ?? ""}
                  onChange={(e) =>
                    setTargetForm((current) => ({
                      ...current,
                      greenThreshold: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="form-input"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Yellow ≥ %
                <input
                  type="number"
                  value={targetForm.yellowThreshold ?? ""}
                  onChange={(e) =>
                    setTargetForm((current) => ({
                      ...current,
                      yellowThreshold: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="form-input"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Red ≥ %
                <input
                  type="number"
                  value={targetForm.criticalThreshold ?? ""}
                  onChange={(e) =>
                    setTargetForm((current) => ({
                      ...current,
                      criticalThreshold: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="form-input"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500 sm:col-span-2 lg:col-span-4">
                Notes
                <input
                  value={targetForm.notes ?? ""}
                  onChange={(e) =>
                    setTargetForm((current) => ({ ...current, notes: e.target.value }))
                  }
                  className="form-input"
                  placeholder="Context or calculation method"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#4a87c9] px-4 py-2.5 text-[11px] font-bold text-white"
              >
                <Save size={14} /> Save target
              </button>
            </div>
          </form>
        )}

        {showAddResult && (
          <form
            onSubmit={submitResult}
            className="mt-6 rounded-2xl border border-[#bfe9da] bg-[#f2fcf8] p-5 sm:p-6"
          >
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#e8f8f2] text-[#168465]">
                <BarChart3 size={16} />
              </span>
              <h2 className="font-display text-[16px] font-bold text-[#152239]">
                Record KPI result
              </h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-[10px] font-bold text-slate-500 sm:col-span-2">
                KPI
                <select
                  required
                  value={resultForm.kpiId}
                  onChange={(e) =>
                    setResultForm((current) => ({ ...current, kpiId: e.target.value }))
                  }
                  className="form-input"
                >
                  <option value="">Select a KPI</option>
                  {kpis.map((kpi) => (
                    <option key={kpi.id} value={kpi.id}>
                      {kpi.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Period
                <select
                  required
                  value={resultForm.periodId}
                  onChange={(e) =>
                    setResultForm((current) => ({ ...current, periodId: e.target.value }))
                  }
                  className="form-input"
                >
                  <option value="">Select period</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.period_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Actual value
                <input
                  type="number"
                  min="0"
                  required
                  value={resultForm.actualValue}
                  onChange={(e) =>
                    setResultForm((current) => ({
                      ...current,
                      actualValue: Number(e.target.value),
                    }))
                  }
                  className="form-input"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500 sm:col-span-2 lg:col-span-4">
                Commentary
                <input
                  value={resultForm.commentary ?? ""}
                  onChange={(e) =>
                    setResultForm((current) => ({ ...current, commentary: e.target.value }))
                  }
                  className="form-input"
                  placeholder="How was this number produced?"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#168465] px-4 py-2.5 text-[11px] font-bold text-white"
              >
                <Save size={14} /> Save result
              </button>
            </div>
          </form>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white shadow-[0_5px_20px_rgba(21,36,58,0.035)]">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-[#eaf3ff] text-[#4a87c9]">
                  <BarChart3 size={16} />
                </span>
                <div>
                  <h2 className="font-display text-[16px] font-bold text-[#152239]">
                    KPI register
                  </h2>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {period?.period_name
                      ? `Current period: ${period.period_name}`
                      : "No active KPI period configured"}
                    {" · "}
                    Achievement is actual ÷ target × 100
                  </p>
                </div>
              </div>
            </div>
          </div>

          {sectionState === "loading" && <LoadingSection />}
          {sectionState === "error" && <ErrorSection message={kpisQuery.error?.message} />}
          {sectionState === "empty" && (
            <div className="p-8 text-center">
              <div className="mx-auto grid size-10 place-items-center rounded-xl bg-[#eaf3ff]">
                <Target size={18} className="text-[#4a87c9]" />
              </div>
              <p className="mt-3 text-[11px] font-medium text-slate-500">
                No KPI definitions yet
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Add the first target above once KPIs and periods are seeded in the data model.
              </p>
            </div>
          )}
          {sectionState === "ready" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    <th className="px-5 py-3 font-bold sm:px-6">KPI</th>
                    <th className="px-3 py-3 font-bold">Target</th>
                    <th className="px-3 py-3 font-bold">Actual</th>
                    <th className="px-5 py-3 text-right font-bold sm:px-6">Achievement</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-8 text-center text-[11px] text-slate-400 sm:px-6"
                      >
                        No results for the active period. Add a target or record a result above.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row: ExecutiveKpiRow) => {
                      const achievement =
                        row.target && row.target > 0 && row.actual !== null
                          ? (row.actual / row.target) * 100
                          : null;
                      return (
                        <tr
                          key={row.id}
                          className="border-b border-slate-50 text-[11px] last:border-0 hover:bg-slate-50/70"
                        >
                          <td className="whitespace-nowrap px-5 py-3.5 sm:px-6">
                            <p className="font-bold text-slate-700">{row.name}</p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              {row.unit ?? "unit not set"} · {row.measurementType}
                            </p>
                          </td>
                          <td className="px-3 py-3.5">
                            <p className="font-display text-[13px] font-bold text-[#755bc0]">
                              {formatNumber(row.target)}
                            </p>
                          </td>
                          <td className="px-3 py-3.5">
                            <p className="font-display text-[13px] font-bold text-[#152239]">
                              {formatNumber(row.actual)}
                            </p>
                          </td>
                          <td className="px-5 py-3.5 text-right sm:px-6">
                            <AchievementPill achievement={achievement} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
