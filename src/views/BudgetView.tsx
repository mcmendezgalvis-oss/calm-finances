import { useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MonthSelector } from "@/components/MonthSelector";
import { BudgetTable, type BudgetTab } from "@/components/BudgetTable";
import { useApp, currentMonthKey, monthKeyOf } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import { unassigned, fmt } from "@/lib/finance";

export function BudgetView() {
  const { t } = useI18n();
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const ensureMonth = useApp((s) => s.ensureMonth);
  const months = useApp((s) => s.months);
  const copyFromPrevious = useApp((s) => s.copyFromPrevious);
  const currency = useApp((s) => s.profile.currency);
  const [tab, setTab] = useState<BudgetTab>("plan");

  useEffect(() => {
    ensureMonth(monthKey);
  }, [monthKey, ensureMonth]);

  const month = months[monthKey] ?? { monthKey, lines: [] };
  const u = unassigned(month);
  const balanced = Math.abs(u) < 0.005;

  const prevKey = useMemo(() => {
    const [y, m] = monthKey.split("-").map(Number);
    return monthKeyOf(new Date(y, m - 2, 1));
  }, [monthKey]);
  const hasPrev = !!months[prevKey] && months[prevKey].lines.length > 0;
  const isEmpty = month.lines.filter((l) => !l.linkedDebtId && !l.linkedShieldId).length === 0;

  return (
    <AppShell>
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
          {isEmpty && hasPrev && (
            <button
              onClick={() => copyFromPrevious(monthKey)}
              className="inline-flex items-center gap-2 text-xs px-4 py-2 bg-sage-900 text-sage-50 rounded-full hover:bg-sage-700 transition-colors"
            >
              <Copy className="size-3.5" /> {t.budget.copyPrev}
            </button>
          )}
        </div>
      </header>

      <div className="bg-white border border-sage-100 rounded-[32px] overflow-hidden shadow-sm">
        <div className="flex border-b border-sage-100">
          {(["plan", "real", "diff"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex-1 py-5 text-sm font-medium transition-colors ${
                tab === k
                  ? "border-b-2 border-sage-900 text-sage-900"
                  : "text-sage-400 hover:text-sage-600"
              }`}
            >
              {t.budget.tabs[k]}
            </button>
          ))}
        </div>

        <div className="p-6 md:p-8">
          <BudgetTable month={month} tab={tab} />

          {tab === "diff" && (
            <p className="mt-8 pt-6 border-t border-sage-100 text-xs text-sage-500 italic leading-relaxed text-center max-w-xl mx-auto">
              {t.budget.empathy}
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}