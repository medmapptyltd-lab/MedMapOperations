import { FormEvent, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Landmark,
  Plus,
  ReceiptText,
  Save,
  Trash2,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/medmap/AppShell";
import { IfPermitted } from "@/components/medmap/IfPermitted";
import { useExecutiveSummary } from "@/lib/executive-dashboard";
import { useFinanceMutations, type RevenueInput, type ExpenseInput } from "@/lib/crud";
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

function StatCard({
  label,
  value,
  detail,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "mint" | "red" | "amber" | "navy";
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_5px_20px_rgba(21,36,58,0.035)]">
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "grid size-9 place-items-center rounded-xl",
            tone === "mint" && "bg-[#e8f8f2] text-[#1b9975]",
            tone === "red" && "bg-[#ffe9e6] text-[#bf5b56]",
            tone === "amber" && "bg-[#fff2d9] text-[#b3781f]",
            tone === "navy" && "bg-[#eaf0f8] text-[#2f527a]",
          )}
        >
          <Icon size={17} />
        </span>
        <span
          className={cn(
            "size-1.5 rounded-full",
            tone === "mint"
              ? "bg-[#36ac87]"
              : tone === "red"
                ? "bg-[#da6560]"
                : tone === "amber"
                  ? "bg-[#e0a03a]"
                  : "bg-[#4a87c9]",
          )}
        />
      </div>
      <p className="mt-4 text-[11px] font-medium text-slate-500">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-[26px] font-bold tracking-[-0.06em]",
          tone === "red" ? "text-[#c1514d]" : "text-[#152239]",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] text-slate-400">{detail}</p>
    </div>
  );
}

function SectionLoading({ label }: { label: string }) {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto grid size-10 place-items-center rounded-xl bg-slate-100">
        <ReceiptText size={18} className="animate-pulse text-slate-400" />
      </div>
      <p className="mt-3 text-[11px] font-medium text-slate-400">Loading {label}…</p>
    </div>
  );
}

function SectionError({ label, message }: { label: string; message?: string }) {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto grid size-10 place-items-center rounded-xl bg-[#ffe5e3]">
        <CircleDollarSign size={18} className="text-[#bd504d]" />
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
        <Landmark size={18} className="text-slate-400" />
      </div>
      <p className="mt-3 text-[11px] font-medium text-slate-500">No {label} yet</p>
      <p className="mt-1 text-[10px] text-slate-400">{hint}</p>
    </div>
  );
}

function formatZAR(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "R 0.00";
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(value);
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

export default function Finance() {
  const { finance: financeQuery } = useExecutiveSummary();
  const {
    createRevenue,
    deleteRevenue,
    createExpense,
    deleteExpense,
  } = useFinanceMutations();

  const revenue = financeQuery.data?.revenue ?? [];
  const expenses = financeQuery.data?.expenses ?? [];

  const totals = useMemo(() => {
    const totalRevenue = revenue.reduce(
      (sum, row) => sum + (row.amount ?? 0),
      0,
    );
    const totalExpenses = expenses.reduce(
      (sum, row) => sum + (row.amount ?? 0),
      0,
    );
    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      net: totalRevenue - totalExpenses,
    };
  }, [revenue, expenses]);

  const revenueState = getSectionState(
    financeQuery.isPending,
    financeQuery.isError,
    revenue,
  );
  const expensesState = getSectionState(
    financeQuery.isPending,
    financeQuery.isError,
    expenses,
  );

  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const [revenueForm, setRevenueForm] = useState<RevenueInput>({
    revenueDate: today(),
    revenueType: "Service",
    amount: 0,
    currency: "ZAR",
    status: "recognized",
    description: "",
  });

  const [expenseForm, setExpenseForm] = useState<ExpenseInput>({
    expenseDate: today(),
    amount: 0,
    description: "",
    currency: "ZAR",
    subcategory: "",
    merchant: "",
    paidByType: "company",
    notes: "",
  });

  const submitRevenue = (event: FormEvent) => {
    event.preventDefault();
    if (revenueForm.amount <= 0 || !revenueForm.revenueType.trim()) return;
    void createRevenue.mutateAsync(revenueForm);
    setRevenueForm((current) => ({
      ...current,
      amount: 0,
      description: "",
    }));
    setShowAddRevenue(false);
  };

  const submitExpense = (event: FormEvent) => {
    event.preventDefault();
    if (expenseForm.amount <= 0 || !expenseForm.description.trim()) return;
    void createExpense.mutateAsync(expenseForm);
    setExpenseForm((current) => ({
      ...current,
      amount: 0,
      description: "",
      merchant: "",
      notes: "",
    }));
    setShowAddExpense(false);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1440px] px-5 pb-12 pt-8 sm:px-8 xl:px-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#bf5b56]">
              <CircleDollarSign size={13} /> Financial health
            </div>
            <h1 className="font-display text-[32px] font-bold tracking-[-0.06em] text-[#152239] sm:text-[39px]">
              The money view, without the blur.
            </h1>
            <p className="mt-2 max-w-[700px] text-[13px] leading-6 text-slate-500">
              A dated management ledger that keeps revenue and expenses distinct. The current
              operating position is calculated directly from recorded rows.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <IfPermitted roleKinds={["ceo", "executive_other", "coo"]}>
              <button
                type="button"
                onClick={() => {
                  setShowAddRevenue((current) => !current);
                  setShowAddExpense(false);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#182842] px-3.5 py-2.5 text-[11px] font-bold text-white shadow-[0_5px_12px_rgba(20,35,58,.15)] hover:bg-[#233958]"
              >
                <Plus size={15} /> Add revenue
              </button>
            </IfPermitted>
            <IfPermitted roleKinds={["ceo", "executive_other", "coo"]}>
              <button
                type="button"
                onClick={() => {
                  setShowAddExpense((current) => !current);
                  setShowAddRevenue(false);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[11px] font-bold text-slate-600 shadow-sm hover:border-slate-300"
              >
                <Plus size={15} /> Add expense
              </button>
            </IfPermitted>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Recorded revenue"
            value={formatZAR(totals.revenue)}
            detail={`${revenue.length} revenue record${revenue.length === 1 ? "" : "s"}`}
            tone="mint"
            icon={ArrowUpRight}
          />
          <StatCard
            label="Company expenses"
            value={formatZAR(totals.expenses)}
            detail={`${expenses.length} expense row${expenses.length === 1 ? "" : "s"}`}
            tone="red"
            icon={ArrowDownRight}
          />
          <StatCard
            label="Operating position"
            value={`${totals.net < 0 ? "-" : ""}${formatZAR(Math.abs(totals.net)).replace(/^R\s?/, "R ")}`}
            detail="Revenue less all recorded expenses"
            tone={totals.net < 0 ? "red" : "mint"}
            icon={WalletCards}
          />
          <StatCard
            label="Net margin"
            value={
              totals.revenue > 0
                ? `${Math.max(0, Math.min(999, (totals.net / totals.revenue) * 100)).toFixed(1)}%`
                : "—"
            }
            detail="Net ÷ recorded revenue"
            tone="navy"
            icon={ReceiptText}
          />
        </div>

        {showAddRevenue && (
          <form
            onSubmit={submitRevenue}
            className="mt-6 rounded-2xl border border-[#bfe9da] bg-[#f2fcf8] p-5 sm:p-6"
          >
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#e8f8f2] text-[#168465]">
                <ArrowUpRight size={16} />
              </span>
              <h2 className="font-display text-[16px] font-bold text-[#152239]">
                Record revenue
              </h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-[10px] font-bold text-slate-500">
                Date
                <input
                  type="date"
                  required
                  value={revenueForm.revenueDate}
                  onChange={(e) =>
                    setRevenueForm((current) => ({
                      ...current,
                      revenueDate: e.target.value,
                    }))
                  }
                  className="form-input"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Revenue type
                <input
                  required
                  value={revenueForm.revenueType}
                  onChange={(e) =>
                    setRevenueForm((current) => ({
                      ...current,
                      revenueType: e.target.value,
                    }))
                  }
                  className="form-input"
                  placeholder="e.g. Service, Commission"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Amount (ZAR)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={revenueForm.amount || ""}
                  onChange={(e) =>
                    setRevenueForm((current) => ({
                      ...current,
                      amount: Number(e.target.value),
                    }))
                  }
                  className="form-input"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Status
                <select
                  value={revenueForm.status}
                  onChange={(e) =>
                    setRevenueForm((current) => ({
                      ...current,
                      status: e.target.value as RevenueInput["status"],
                    }))
                  }
                  className="form-input"
                >
                  <option value="recognized">Recognized</option>
                  <option value="pending">Pending</option>
                  <option value="refunded">Refunded</option>
                  <option value="reversed">Reversed</option>
                </select>
              </label>
              <label className="text-[10px] font-bold text-slate-500 sm:col-span-2 lg:col-span-4">
                Description
                <input
                  value={revenueForm.description ?? ""}
                  onChange={(e) =>
                    setRevenueForm((current) => ({
                      ...current,
                      description: e.target.value,
                    }))
                  }
                  className="form-input"
                  placeholder="e.g. October consulting retainer"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#168465] px-4 py-2.5 text-[11px] font-bold text-white"
              >
                <Save size={14} /> Save revenue
              </button>
            </div>
          </form>
        )}

        {showAddExpense && (
          <form
            onSubmit={submitExpense}
            className="mt-6 rounded-2xl border border-[#f0cdca] bg-[#fff8f7] p-5 sm:p-6"
          >
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#ffe9e6] text-[#bf5b56]">
                <ArrowDownRight size={16} />
              </span>
              <h2 className="font-display text-[16px] font-bold text-[#152239]">
                Record expense
              </h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-[10px] font-bold text-slate-500">
                Date
                <input
                  type="date"
                  required
                  value={expenseForm.expenseDate}
                  onChange={(e) =>
                    setExpenseForm((current) => ({
                      ...current,
                      expenseDate: e.target.value,
                    }))
                  }
                  className="form-input"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Amount (ZAR)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={expenseForm.amount || ""}
                  onChange={(e) =>
                    setExpenseForm((current) => ({
                      ...current,
                      amount: Number(e.target.value),
                    }))
                  }
                  className="form-input"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Merchant
                <input
                  value={expenseForm.merchant ?? ""}
                  onChange={(e) =>
                    setExpenseForm((current) => ({
                      ...current,
                      merchant: e.target.value,
                    }))
                  }
                  className="form-input"
                  placeholder="e.g. AWS, Payroll"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Subcategory
                <input
                  value={expenseForm.subcategory ?? ""}
                  onChange={(e) =>
                    setExpenseForm((current) => ({
                      ...current,
                      subcategory: e.target.value,
                    }))
                  }
                  className="form-input"
                  placeholder="Salaries, Hosting…"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500 sm:col-span-2 lg:col-span-4">
                Description
                <input
                  required
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm((current) => ({
                      ...current,
                      description: e.target.value,
                    }))
                  }
                  className="form-input"
                  placeholder="e.g. October salaries payable"
                />
              </label>
              <label className="text-[10px] font-bold text-slate-500">
                Paid by
                <select
                  value={expenseForm.paidByType}
                  onChange={(e) =>
                    setExpenseForm((current) => ({
                      ...current,
                      paidByType: e.target.value as ExpenseInput["paidByType"],
                    }))
                  }
                  className="form-input"
                >
                  <option value="company">Company</option>
                  <option value="founder">Founder</option>
                  <option value="employee">Employee</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="text-[10px] font-bold text-slate-500 sm:col-span-2 lg:col-span-3">
                Notes
                <input
                  value={expenseForm.notes ?? ""}
                  onChange={(e) =>
                    setExpenseForm((current) => ({
                      ...current,
                      notes: e.target.value,
                    }))
                  }
                  className="form-input"
                  placeholder="Approval context or reference"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#bf5b56] px-4 py-2.5 text-[11px] font-bold text-white"
              >
                <Save size={14} /> Save expense
              </button>
            </div>
          </form>
        )}

        <section className="mt-6 rounded-2xl border border-slate-200/80 bg-white shadow-[0_5px_20px_rgba(21,36,58,0.035)]">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-[#e8f8f2] text-[#168465]">
                  <ArrowUpRight size={16} />
                </span>
                <h2 className="font-display text-[16px] font-bold text-[#152239]">
                  Revenue records
                </h2>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Recognized and pending revenue, newest first.
              </p>
            </div>
            <div className="text-[11px] font-bold text-[#168465]">
              Total {formatZAR(totals.revenue)}
            </div>
          </div>
          {revenueState === "loading" && <SectionLoading label="revenue" />}
          {revenueState === "error" && (
            <SectionError label="revenue" message={financeQuery.error?.message} />
          )}
          {revenueState === "empty" && (
            <SectionEmpty
              label="revenue records"
              hint="Click Add revenue to record the first inflow."
            />
          )}
          {revenueState === "ready" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    <th className="px-5 py-3 font-bold sm:px-6">Date</th>
                    <th className="px-3 py-3 font-bold">Description</th>
                    <th className="px-3 py-3 font-bold">Type</th>
                    <th className="px-3 py-3 font-bold">Status</th>
                    <th className="px-3 py-3 text-right font-bold">Amount</th>
                    <th className="px-5 py-3 text-right font-bold sm:px-6">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {[...revenue]
                    .sort((a, b) => b.revenue_date.localeCompare(a.revenue_date))
                    .map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-slate-50 text-[11px] last:border-0 hover:bg-slate-50/70"
                      >
                        <td className="whitespace-nowrap px-5 py-3.5 text-slate-500 sm:px-6">
                          {formatDate(row.revenue_date)}
                        </td>
                        <td className="px-3 py-3.5">
                          <p className="font-bold text-slate-700">
                            {row.description ?? row.revenue_type}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">{row.id}</p>
                        </td>
                        <td className="px-3 py-3.5 text-slate-500">{row.revenue_type}</td>
                        <td className="px-3 py-3.5">
                          <span
                            className={cn(
                              "rounded-full px-2 py-1 text-[9px] font-bold",
                              row.status === "recognized"
                                ? "bg-[#e8f8f2] text-[#168465]"
                                : row.status === "pending"
                                  ? "bg-[#fff2d9] text-[#9a6419]"
                                  : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-right font-display font-bold text-[#168465]">
                          +{formatZAR(row.amount)}
                        </td>
                        <td className="px-5 py-3.5 text-right sm:px-6">
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete this revenue record (${formatZAR(row.amount)})?`,
                                )
                              ) {
                                void deleteRevenue.mutateAsync(row.id);
                              }
                            }}
                            className="rounded-lg p-2 text-slate-400 hover:bg-[#fff0ee] hover:text-[#bd504d]"
                            aria-label="Delete revenue"
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
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200/80 bg-white shadow-[0_5px_20px_rgba(21,36,58,0.035)]">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-[#ffe9e6] text-[#bf5b56]">
                  <ArrowDownRight size={16} />
                </span>
                <h2 className="font-display text-[16px] font-bold text-[#152239]">
                  Expense records
                </h2>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                All outflows, newest first. Totals match the summary cards above.
              </p>
            </div>
            <div className="text-[11px] font-bold text-[#bd504d]">
              Total {formatZAR(totals.expenses)}
            </div>
          </div>
          {expensesState === "loading" && <SectionLoading label="expenses" />}
          {expensesState === "error" && (
            <SectionError label="expenses" message={financeQuery.error?.message} />
          )}
          {expensesState === "empty" && (
            <SectionEmpty
              label="expense records"
              hint="Click Add expense to record the first outflow."
            />
          )}
          {expensesState === "ready" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    <th className="px-5 py-3 font-bold sm:px-6">Date</th>
                    <th className="px-3 py-3 font-bold">Description</th>
                    <th className="px-3 py-3 font-bold">Merchant</th>
                    <th className="px-3 py-3 font-bold">Paid by</th>
                    <th className="px-3 py-3 text-right font-bold">Amount</th>
                    <th className="px-5 py-3 text-right font-bold sm:px-6">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {[...expenses]
                    .sort((a, b) => b.expense_date.localeCompare(a.expense_date))
                    .map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-slate-50 text-[11px] last:border-0 hover:bg-slate-50/70"
                      >
                        <td className="whitespace-nowrap px-5 py-3.5 text-slate-500 sm:px-6">
                          {formatDate(row.expense_date)}
                        </td>
                        <td className="px-3 py-3.5">
                          <p className="font-bold text-slate-700">{row.description}</p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {row.approval_status} approval · {row.reimbursement_status}
                          </p>
                        </td>
                        <td className="px-3 py-3.5 text-slate-500">
                          {row.requires_review ? "Review" : "—"}
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-600">
                            {row.paid_by_type}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-right font-display font-bold text-[#bd504d]">
                          -{formatZAR(row.amount)}
                        </td>
                        <td className="px-5 py-3.5 text-right sm:px-6">
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete this expense record (${formatZAR(row.amount)})?`,
                                )
                              ) {
                                void deleteExpense.mutateAsync(row.id);
                              }
                            }}
                            className="rounded-lg p-2 text-slate-400 hover:bg-[#fff0ee] hover:text-[#bd504d]"
                            aria-label="Delete expense"
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
        </section>
      </div>
    </AppShell>
  );
}
