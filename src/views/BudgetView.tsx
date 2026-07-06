import { useEffect, useMemo, useState } from "react";
import { Copy, Lock, Unlock, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { MonthSelector } from "@/components/MonthSelector";
import { BudgetTable, type BudgetTab } from "@/components/BudgetTable";
import { useApp, currentMonthKey, monthKeyOf } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import { unassigned, fmt, groupTotals } from "@/lib/finance";
import { CloseMonthDialog } from "@/components/CloseMonthDialog";
import { ReopenMonthDialog } from "@/components/ReopenMonthDialog";

function isCarryLineName(name: string) {
  const n = name.trim().toLowerCase();
  return n === "sobrante mes anterior" || n === "previous month surplus" || n === "surplus from previous month";
}

const LAST_MONTH_KEY_STORAGE = "budget:lastMonthKey";

function readInitialMonthKey(): string {
  if (typeof window === "undefined") return currentMonthKey();
  try {
    const saved = window.localStorage.getItem(LAST_MONTH_KEY_STORAGE);
    if (saved && /^\d{4}-\d{2}$/.test(saved)) return saved;
  } catch { /* ignore */ }
  return currentMonthKey();
}

export function BudgetView() {
  const { t } = useI18n();
  const [monthKey, setMonthKey] = useState<string>(() => readInitialMonthKey());
  const ensureMonth = useApp((s) => s.ensureMonth);
  const months = useApp((s) => s.months);
  const copyFromPrevious = useApp((s) => s.copyFromPrevious);
  const resetPlan = useApp((s) => s.resetPlan);
  const resetActual = useApp((s) => s.resetActual);
  const currency = useApp((s) => s.profile.currency);
  const [tab, setTab] = useState<BudgetTab>("plan");
  // Track whether the user has already used "Copy previous" this session for a given month.
  const [copiedByMonth, setCopiedByMonth] = useState<Record<string, boolean>>({});

  useEffect(() => {
    ensureMonth(monthKey);
  }, [monthKey, ensureMonth]);

  useEffect(() => {
    try { window.localStorage.setItem(LAST_MONTH_KEY_STORAGE, monthKey); } catch { /* ignore */ }
  }, [monthKey]);

  const month = months[monthKey] ?? { monthKey, lines: [] };
  const u = unassigned(month);
  const balanced = Math.abs(u) < 0.005;
  const closed = Boolean(month.closed);
  const [closeOpen, setCloseOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);

  // Real balance (income real - expenses real) is what we offer to allocate on close.
  const totals = groupTotals(month.lines);
  const realBalance = totals.income.real - (totals.muros.real + totals.debts.real + totals.generosity.real + totals.lifestyle.real + totals.future.real);

  const prevKey = useMemo(() => {
    const [y, m] = monthKey.split("-").map(Number);
    return monthKeyOf(new Date(y, m - 2, 1));
  }, [monthKey]);
  const hasPrev = !!months[prevKey] && months[prevKey].lines.length > 0;
  const copiedThisMonth = !!copiedByMonth[monthKey];
  // Consider the current month "empty" when every line has 0 planned & 0 real.
  // In that case we always re-offer the "Copy previous" button, even if the
  // session flag says the user already copied at some point (e.g. after reset).
  const isMonthEmpty = month.lines.every((l) => (l.planned ?? 0) === 0 && (l.real ?? 0) === 0);
  const showCopy = hasPrev && !closed && (!copiedThisMonth || isMonthEmpty);

  const overdrawn = Boolean(month.overdrawn);
  const balancePositive = realBalance >= -0.005;
  const balanceZero = Math.abs(realBalance) < 0.005;

  // Per-tab palette. `header` is the resting color of the tab trigger (also
  // the color of the content sheet when active). `border` is a subtle divider
  // color that keeps inactive tabs visually separated from the sheet.
  const tabPalette: Record<BudgetTab, { header: string; border: string }> = {
    plan: { header: "#FFFFFF", border: "#E7E1D8" },
    real: { header: "#FFF8F8", border: "#F1D9D9" },
    diff: { header: "#F4F9F5", border: "#D5E7DA" },
  };
  const activeBg = tabPalette[tab].header;

  return (
    <AppShell>
      <div className="-mx-5 md:-mx-10 -my-6 md:-my-10 px-5 md:px-10 py-6 md:py-10 min-h-full">
      <header className="mb-8">
        <div className="flex flex-wrap gap-4 items-end justify-between">
          <div>
            <h1 className="font-serif text-4xl text-sage-900">{t.budget.title}</h1>
            <p className="text-sm text-sage-600 italic mt-1">{t.tagline}</p>
          </div>
          <MonthSelector monthKey={monthKey} onChange={setMonthKey} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div
            className={`inline-flex items-center gap-3 px-5 py-3 rounded-3xl border transition-colors ${
              balanced
                ? "bg-sage-100 border-sage-200 text-sage-700"
                : u < 0
                ? "bg-blush-100 border-blush-200 text-clay"
                : "bg-white border-sage-200 text-sage-900"
            }`}
          >
            <div className={`size-2.5 rounded-full ${balanced ? "bg-sage-600" : "bg-clay"} ${!balanced ? "animate-pulse" : ""}`} />
            <div>
              <p className="text-[10px] uppercase tracking-widest font-medium">{t.budget.unassigned}</p>
              <p className="font-serif text-2xl leading-none mt-0.5">{fmt(u, currency)}</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-white border border-sage-200 rounded-full text-[11px] font-medium text-sage-600 uppercase tracking-tight italic">
            {t.budget.zeroBased}
          </span>
          {showCopy && (
            <button
              onClick={() => { copyFromPrevious(monthKey); setCopiedByMonth((m) => ({ ...m, [monthKey]: true })); }}
              className="inline-flex items-center gap-2 text-xs px-4 py-2 bg-sage-900 text-sage-50 rounded-full hover:bg-sage-700 transition-colors"
            >
              <Copy className="size-3.5" /> {t.budget.copyPrev}
            </button>
          )}
          <button
            onClick={() => (closed ? setReopenOpen(true) : setCloseOpen(true))}
            className={`inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full transition-colors ${closed ? "bg-blush-100 text-clay hover:bg-blush-200" : "bg-wine text-white hover:opacity-90"}`}
          >
            {closed ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />}
            {closed ? t.closeMonth.reopenBtn : t.closeMonth.closeBtn}
          </button>
          {!closed && (
            <button
              onClick={() => {
                if (!window.confirm(t.budgetReset.confirmAll)) return;
                resetPlan(monthKey);
                resetActual(monthKey);
                // Reset fully re-enables "Copy previous" for this exact month so
                // the user can either type a fresh plan or copy the previous one again.
                setCopiedByMonth((m) => ({ ...m, [monthKey]: false }));
                toast.success(t.budgetReset.doneToast);
              }}
              className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full bg-white border border-sage-200 text-sage-700 hover:bg-sage-50 transition-colors"
            >
              <RotateCcw className="size-3.5" />
              {t.budgetReset.allBtn}
            </button>
          )}
        </div>
        {closed && !overdrawn && (
          <div className="mt-3 text-xs text-sage-600 italic bg-sage-100 border border-sage-200 px-4 py-2 rounded-full inline-block">
            🔒 {t.closeMonth.closed}
          </div>
        )}
        {closed && overdrawn && (
          <div className="mt-3 text-xs text-clay bg-blush-100 border border-blush-200 px-4 py-2 rounded-full inline-flex items-center gap-2">
            <AlertTriangle className="size-3.5" /> {t.closeMonth.overdrawnBadge} · {fmt(realBalance, currency)}
          </div>
        )}
      </header>

      <div
        className="border border-sage-100 rounded-[32px] overflow-hidden shadow-sm transition-colors"
        style={{ backgroundColor: activeBg }}
      >
        <div className="flex gap-1 px-1 pt-1">
          {(["plan", "real", "diff"] as const).map((k) => {
            const active = tab === k;
            const pal = tabPalette[k];
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`flex-1 py-4 text-sm font-medium transition-all rounded-t-2xl ${
                  active
                    ? "text-sage-900 shadow-[0_-1px_0_rgba(0,0,0,0.03)]"
                    : "text-sage-500 hover:text-sage-700"
                }`}
                style={{
                  backgroundColor: pal.header,
                  opacity: active ? 1 : 0.75,
                  borderTop: `1px solid ${pal.border}`,
                  borderLeft: `1px solid ${pal.border}`,
                  borderRight: `1px solid ${pal.border}`,
                  borderBottom: active
                    ? `1px solid ${pal.header}`
                    : `1px solid ${pal.border}`,
                  marginBottom: active ? -1 : 0,
                  position: "relative",
                  zIndex: active ? 2 : 1,
                }}
              >
                {t.budget.tabs[k]}
              </button>
            );
          })}
        </div>

        <div
          className="p-6 md:p-8 transition-colors"
          style={{
            backgroundColor: activeBg,
            borderTop: `1px solid ${tabPalette[tab].border}`,
          }}
        >
          {tab === "diff" && (
            <div
              className={`mb-6 rounded-3xl p-5 border-2 ${
                balancePositive
                  ? "bg-sage-100 border-sage-300"
                  : "bg-blush-100 border-blush-300"
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className={`text-[10px] uppercase tracking-widest font-bold ${balancePositive ? "text-sage-700" : "text-clay"}`}>
                    {t.budgetSummary.myCalmTitle}
                  </p>
                  <p className={`font-serif text-4xl mt-1 tabular-nums ${balancePositive ? "text-sage-900" : "text-clay"}`}>
                    {fmt(realBalance, currency)}
                  </p>
                </div>
                {!balancePositive && <AlertTriangle className="size-6 text-clay shrink-0 mt-1" />}
              </div>
              <p className={`text-xs mt-3 leading-relaxed ${balancePositive ? "text-sage-700" : "text-clay"}`}>
                {balancePositive ? t.budgetSummary.myCalmPositive : t.budgetSummary.myCalmNegative}
              </p>
            </div>
          )}

          <BudgetTable month={month} tab={tab} disabled={closed} />

          {tab === "diff" && (
            <p className="mt-8 pt-6 border-t border-sage-100 text-xs text-sage-500 italic leading-relaxed text-center max-w-xl mx-auto">
              {t.budget.empathy}
            </p>
          )}
        </div>
      </div>

      {closeOpen && (
        <CloseMonthDialog
          monthKey={monthKey}
          balance={realBalance}
          onClose={() => setCloseOpen(false)}
          onClosed={() => setCloseOpen(false)}
        />
      )}
      {reopenOpen && (
        <ReopenMonthDialog
          monthKey={monthKey}
          onClose={() => setReopenOpen(false)}
          onReopened={() => setReopenOpen(false)}
        />
      )}
      </div>
    </AppShell>
  );
}