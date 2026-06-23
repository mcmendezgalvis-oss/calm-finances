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

export const EMERGENCY_FUND_ID = "emergency-fund";

export interface EmergencyLevels {
  l1: number;
  l2Min: number;
  l2Max: number;
  l3Min: number;
  l3Max: number;
}

export function emergencyLevels(muros: number): EmergencyLevels {
  return {
    l1: 1000,
    l2Min: muros * 1,
    l2Max: muros * 3,
    l3Min: muros * 3,
    l3Max: muros * 6,
  };
}

export function emergencyLevelReached(balance: number, levels: EmergencyLevels): 0 | 1 | 2 | 3 {
  if (balance >= levels.l3Max && levels.l3Max > 0) return 3;
  if (balance >= levels.l2Max && levels.l2Max > 0) return 2;
  if (balance >= levels.l1) return 1;
  return 0;
}