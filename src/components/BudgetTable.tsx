import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import { useApp } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import { GROUP_ORDER, groupTotals, fmt } from "@/lib/finance";
import { NumberCell } from "./NumberCell";
import type { GroupKey, MonthBudget } from "@/store/types";

export type BudgetTab = "plan" | "real" | "diff";

export function BudgetTable({
  month, tab,
}: {
  month: MonthBudget;
  tab: BudgetTab;
}) {
  const { t } = useI18n();
  const currency = useApp((s) => s.profile.currency);
  const debts = useApp((s) => s.debts);
  const updateLine = useApp((s) => s.updateLine);
  const removeLine = useApp((s) => s.removeLine);
  const addLine = useApp((s) => s.addLine);

  const grouped = useMemo(() => {
    const map: Record<GroupKey, typeof month.lines> = {
      income: [], muros: [], debts: [], generosity: [], lifestyle: [], future: [],
    };
    for (const l of month.lines) map[l.group].push(l);
    return map;
  }, [month.lines]);

  const totals = groupTotals(month.lines);

  return (
    <div className="space-y-8">
      {GROUP_ORDER.map((g) => {
        const lines = grouped[g];
        const groupTotal = totals[g];
        return (
          <section key={g}>
            <header className="flex items-center justify-between border-b border-sage-100 pb-2 mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-sage-600">
                {t.budget.groups[g]}
              </h3>
              <span className="text-[11px] text-sage-400 font-mono">
                {tab === "real" ? fmt(groupTotal.real, currency) : fmt(groupTotal.planned, currency)}
              </span>
            </header>

            <div className="space-y-1">
              {lines.length === 0 && (
                <p className="text-xs italic text-sage-400 px-2 py-3">—</p>
              )}
              {lines.map((l) => {
                const diff = l.planned - l.real;
                const positive = diff >= 0;
                const linked = l.linkedDebtId
                  ? debts.find((d) => d.id === l.linkedDebtId)
                  : null;
                const belowMin =
                  l.linkedDebtId && linked && tab === "plan" && l.planned < linked.minimumPayment && l.planned >= 0;

                return (
                  <div
                    key={l.id}
                    className="group grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_140px_140px_36px] gap-2 sm:gap-4 items-center px-2 py-1.5 rounded-xl hover:bg-sage-50 transition-colors"
                  >
                    <input
                      value={l.name}
                      onChange={(e) => updateLine(month.monthKey, l.id, { name: e.target.value })}
                      placeholder={t.budget.lineName}
                      className="bg-transparent text-sm text-sage-900 outline-none focus:bg-white focus:ring-1 focus:ring-sage-200 rounded px-2 py-1.5"
                    />

                    {tab === "plan" && (
                      <>
                        <NumberCell
                          value={l.planned}
                          onChange={(n) => updateLine(month.monthKey, l.id, { planned: n })}
                          ariaLabel={t.budget.planned}
                        />
                        <div className="hidden sm:block" />
                      </>
                    )}

                    {tab === "real" && (
                      <>
                        <div className="text-right text-xs text-sage-400 font-mono pr-2 hidden sm:block">
                          {fmt(l.planned, currency)}
                        </div>
                        <NumberCell
                          value={l.real}
                          tone="realidad"
                          onChange={(n) => updateLine(month.monthKey, l.id, { real: n })}
                          ariaLabel={t.budget.real}
                        />
                      </>
                    )}

                    {tab === "diff" && (
                      <>
                        <div className="text-right text-xs text-sage-500 font-mono pr-2 hidden sm:block">
                          {fmt(l.planned, currency)} → {fmt(l.real, currency)}
                        </div>
                        <div
                          className={`text-right text-sm font-medium px-3 py-1.5 rounded-md ${
                            positive
                              ? "bg-sage-100 text-sage-700"
                              : "bg-blush-100 text-clay"
                          }`}
                        >
                          {positive ? "+" : ""}
                          {fmt(diff, currency)}
                        </div>
                      </>
                    )}

                    {tab !== "diff" ? (
                      <button
                        onClick={() => removeLine(month.monthKey, l.id)}
                        className="opacity-0 group-hover:opacity-100 text-sage-300 hover:text-clay p-1"
                        aria-label={t.budget.remove}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    ) : (
                      <div />
                    )}

                    {belowMin && (
                      <p className="col-span-full text-[11px] italic text-clay pl-2 -mt-1">
                        {t.budget.personalizedPlan}
                      </p>
                    )}
                  </div>
                );
              })}

              {tab !== "diff" && (
                <button
                  onClick={() => addLine(month.monthKey, g)}
                  className="text-xs text-sage-500 hover:text-sage-700 px-2 py-2 italic"
                >
                  {t.budget.addLine}
                </button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}