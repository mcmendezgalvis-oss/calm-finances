import type { BudgetLine, GroupKey, MonthBudget } from "@/store/types";

export const GROUP_ORDER: GroupKey[] = ["income", "muros", "debts", "generosity", "lifestyle", "future"];

/**
 * Difference between plan and reality, with semantics that match the user's intent:
 * - Income: real - planned (positive = exceeded, negative = shortfall)
 * - Expenses: planned - real (positive = saved, negative = overspent)
 */
export function lineDiff(line: { group: GroupKey; planned: number; real: number }): number {
  if (line.group === "income") return (line.real || 0) - (line.planned || 0);
  return (line.planned || 0) - (line.real || 0);
}

export function groupDiff(group: GroupKey, planned: number, real: number): number {
  if (group === "income") return real - planned;
  return planned - real;
}

export function groupTotals(lines: BudgetLine[]) {
  const totals = Object.fromEntries(
    GROUP_ORDER.map((g) => [g, { planned: 0, real: 0 }]),
  ) as Record<GroupKey, { planned: number; real: number }>;
  for (const l of lines) {
    totals[l.group].planned += l.planned || 0;
    totals[l.group].real += l.real || 0;
  }
  return totals;
}

export function unassigned(month: MonthBudget) {
  const t = groupTotals(month.lines);
  const income = t.income.planned;
  const allocated = (["muros","debts","generosity","lifestyle","future"] as GroupKey[])
    .reduce((s, g) => s + t[g].planned, 0);
  return income - allocated;
}

export function fmt(n: number, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

export function muros4Total(month: MonthBudget) {
  return month.lines
    .filter((l) => l.group === "muros")
    .reduce((s, l) => s + (l.real || l.planned || 0), 0);
}