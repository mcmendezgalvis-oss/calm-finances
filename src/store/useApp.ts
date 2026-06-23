import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppState, BudgetLine, Debt, DebtAdjustment, GroupKey, MonthBudget,
  ShieldTx, Trophy, TrophyKind, UserPlan,
} from "./types";
import { EMERGENCY_FUND_ID, emergencyLevels, emergencyLevelReached, groupTotals, muros4Total } from "@/lib/finance";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const monthKeyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const currentMonthKey = () => monthKeyOf(new Date());

export function emptyMonth(monthKey: string): MonthBudget {
  return { monthKey, lines: [] };
}

interface Actions {
  ensureMonth: (monthKey: string) => MonthBudget;
  ensureEmergencyFund: () => void;
  addLine: (monthKey: string, group: GroupKey, name?: string) => string;
  updateLine: (monthKey: string, lineId: string, patch: Partial<BudgetLine>) => void;
  removeLine: (monthKey: string, lineId: string) => void;
  copyFromPrevious: (monthKey: string) => void;
  addShield: (name: string, goal: number, kind?: "custom" | "initial" | "definitive") => string;
  removeShield: (id: string) => void;
  shieldDeposit: (id: string, amount: number, note?: string, date?: string) => void;
  shieldWithdraw: (id: string, amount: number, note?: string, date?: string) => void;
  addDebt: (input: { name: string; initialBalance: number; minimumPayment: number }) => string;
  removeDebt: (id: string) => void;
  updateDebt: (id: string, patch: Partial<Debt>) => void;
  bankAdjust: (id: string, newBalance: number, note?: string) => void;
  registerDebtPayment: (id: string, amount: number, date?: string, note?: string) => boolean;
  setProfileName: (name: string) => void;
  setPlan: (plan: UserPlan, days?: number) => void;
  redeemCode: (code: string) => boolean;
  awardTrophy: (kind: TrophyKind, label: string, contextId?: string, monthKey?: string) => Trophy | null;
  checkMonthClose: (monthKey: string) => Trophy[];
  resetAll: () => void;
}

export type Store = AppState & Actions;

const initialState: AppState = {
  profile: { name: "", plan: "free", currency: "USD" },
  months: {},
  shields: [],
  debts: [],
  trophies: [],
};

const REDEEM_CODES = new Set(["CALMA2026", "FINANZAS30", "RUTACOMPLETA"]);

function previousMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return monthKeyOf(d);
}

function syncLinkedLines(state: AppState, monthKey: string): MonthBudget {
  const month = state.months[monthKey] ?? emptyMonth(monthKey);
  const lines = [...month.lines];
  // Dedupe linked lines defensively
  const seenShield = new Set<string>();
  const seenDebt = new Set<string>();
  const cleaned: BudgetLine[] = [];
  for (const l of lines) {
    if (l.linkedShieldId) {
      if (seenShield.has(l.linkedShieldId)) continue;
      seenShield.add(l.linkedShieldId);
    }
    if (l.linkedDebtId) {
      if (seenDebt.has(l.linkedDebtId)) continue;
      seenDebt.add(l.linkedDebtId);
    }
    cleaned.push(l);
  }
  for (const shield of state.shields) {
    if (!seenShield.has(shield.id)) {
      cleaned.push({
        id: uid(), group: "future", name: shield.name,
        planned: 0, real: 0, linkedShieldId: shield.id,
        permanent: shield.id === EMERGENCY_FUND_ID,
      });
      seenShield.add(shield.id);
    } else if (shield.id === EMERGENCY_FUND_ID) {
      // Ensure permanence flag on existing line
      const idx = cleaned.findIndex((l) => l.linkedShieldId === EMERGENCY_FUND_ID);
      if (idx >= 0 && !cleaned[idx].permanent) cleaned[idx] = { ...cleaned[idx], permanent: true };
    }
  }
  // Snowball order: active debts sorted by current balance asc
  const activeDebts = state.debts.filter((d) => !d.paid).sort((a, b) => a.currentBalance - b.currentBalance);
  for (const debt of activeDebts) {
    if (!seenDebt.has(debt.id)) {
      cleaned.push({
        id: uid(), group: "debts", name: debt.name,
        planned: debt.minimumPayment, real: 0, linkedDebtId: debt.id,
      });
      seenDebt.add(debt.id);
    }
  }
  // Reorder debt lines per snowball
  const order = new Map(activeDebts.map((d, i) => [d.id, i]));
  cleaned.sort((a, b) => {
    if (a.linkedDebtId && b.linkedDebtId) {
      return (order.get(a.linkedDebtId) ?? 99) - (order.get(b.linkedDebtId) ?? 99);
    }
    return 0;
  });
  return { monthKey, lines: cleaned };
}

export const useApp = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,

      ensureMonth: (monthKey) => {
        const state = get();
        const existing = state.months[monthKey];
        if (existing) {
          const synced = syncLinkedLines(state, monthKey);
          if (synced.lines.length !== existing.lines.length) {
            set({ months: { ...state.months, [monthKey]: synced } });
            return synced;
          }
          return existing;
        }
        const fresh = syncLinkedLines(state, monthKey);
        set({ months: { ...state.months, [monthKey]: fresh } });
        return fresh;
      },

      ensureEmergencyFund: () => {
        const s = get();
        if (s.shields.find((sh) => sh.id === EMERGENCY_FUND_ID)) return;
        set({
          shields: [
            ...s.shields,
            {
              id: EMERGENCY_FUND_ID,
              name: "Fondo de Emergencia",
              kind: "emergency",
              goal: 1000,
              balance: 0,
              createdAt: new Date().toISOString(),
              history: [],
            },
          ],
        });
      },

      addLine: (monthKey, group, name = "") => {
        const id = uid();
        set((s) => {
          const month = s.months[monthKey] ?? emptyMonth(monthKey);
          return {
            months: {
              ...s.months,
              [monthKey]: { ...month, lines: [...month.lines, { id, group, name, planned: 0, real: 0 }] },
            },
          };
        });
        return id;
      },

      updateLine: (monthKey, lineId, patch) => {
        set((s) => {
          const month = s.months[monthKey];
          if (!month) return s;
          const before = month.lines.find((l) => l.id === lineId);
          const lines = month.lines.map((l) => (l.id === lineId ? { ...l, ...patch } : l));
          let shields = s.shields;
          let debts = s.debts;
          let trophies = s.trophies;

          if (before && patch.real !== undefined && patch.real !== before.real) {
            const delta = patch.real - before.real;
            if (before.linkedShieldId) {
              shields = shields.map((sh) =>
                sh.id === before.linkedShieldId
                  ? {
                      ...sh,
                      balance: sh.balance + delta,
                      history: [
                        ...sh.history,
                        { id: uid(), date: new Date().toISOString(), type: "deposit", amount: delta, note: "Aporte desde presupuesto" } as ShieldTx,
                      ],
                    }
                  : sh,
              );
              if (before.linkedShieldId === EMERGENCY_FUND_ID) {
                const muros = muros4Total(month);
                const levels = emergencyLevels(muros);
                const fund = shields.find((sh) => sh.id === EMERGENCY_FUND_ID);
                if (fund) {
                  const reached = emergencyLevelReached(fund.balance, levels);
                  trophies = maybeAwardShieldTrophy(trophies, reached);
                }
              }
            }
            if (before.linkedDebtId) {
              debts = debts.map((dbt) => {
                if (dbt.id !== before.linkedDebtId) return dbt;
                const newBal = Math.max(0, dbt.currentBalance - delta);
                const justPaid = !dbt.paid && newBal === 0 && delta > 0;
                if (justPaid) {
                  trophies = maybeAward(trophies, "debt_paid", `Liberaste: ${dbt.name}`, dbt.id);
                }
                return {
                  ...dbt,
                  currentBalance: newBal,
                  paid: justPaid ? true : dbt.paid,
                  paidAt: justPaid ? new Date().toISOString() : dbt.paidAt,
                };
              });
            }
          }
          return { months: { ...s.months, [monthKey]: { ...month, lines } }, shields, debts, trophies };
        });
      },

      removeLine: (monthKey, lineId) => {
        set((s) => {
          const month = s.months[monthKey];
          if (!month) return s;
          const target = month.lines.find((l) => l.id === lineId);
          if (target?.permanent) return s; // protect permanent (Emergency Fund) line
          return { months: { ...s.months, [monthKey]: { ...month, lines: month.lines.filter((l) => l.id !== lineId) } } };
        });
      },

      copyFromPrevious: (monthKey) => {
        set((s) => {
          const prev = s.months[previousMonthKey(monthKey)];
          if (!prev) return s;
          const lines: BudgetLine[] = prev.lines.map((l) => ({ ...l, id: uid(), real: 0 }));
          return { months: { ...s.months, [monthKey]: { monthKey, lines } } };
        });
      },

      addShield: (name, goal, kind = "custom") => {
        const id = uid();
        set((s) => ({
          shields: [
            ...s.shields,
            { id, name, kind, goal, balance: 0, createdAt: new Date().toISOString(), history: [] },
          ],
        }));
        return id;
      },

      removeShield: (id) => set((s) => ({ shields: s.shields.filter((sh) => sh.id !== id) })),

      shieldDeposit: (id, amount, note, date) =>
        set((s) => {
          const shields = s.shields.map((sh) =>
            sh.id === id
              ? {
                  ...sh,
                  balance: sh.balance + amount,
                  history: [...sh.history, { id: uid(), date: date ?? new Date().toISOString(), type: "deposit", amount, note } as ShieldTx],
                }
              : sh,
          );
          let trophies = s.trophies;
          if (id === EMERGENCY_FUND_ID) {
            const monthKey = currentMonthKey();
            const month = s.months[monthKey] ?? emptyMonth(monthKey);
            const muros = muros4Total(month);
            const fund = shields.find((sh) => sh.id === EMERGENCY_FUND_ID);
            if (fund) {
              const reached = emergencyLevelReached(fund.balance, emergencyLevels(muros));
              trophies = maybeAwardShieldTrophy(trophies, reached);
            }
          }
          return { shields, trophies };
        }),

      shieldWithdraw: (id, amount, note, date) =>
        set((s) => ({
          shields: s.shields.map((sh) =>
            sh.id === id
              ? {
                  ...sh,
                  balance: Math.max(0, sh.balance - amount),
                  history: [...sh.history, { id: uid(), date: date ?? new Date().toISOString(), type: "withdraw", amount, note } as ShieldTx],
                }
              : sh,
          ),
        })),

      addDebt: ({ name, initialBalance, minimumPayment }) => {
        const id = uid();
        set((s) => ({
          debts: [
            ...s.debts,
            {
              id, name, initialBalance, minimumPayment,
              currentBalance: initialBalance, paid: false,
              createdAt: new Date().toISOString(), adjustments: [],
            },
          ],
        }));
        return id;
      },

      removeDebt: (id) => set((s) => ({ debts: s.debts.filter((d) => d.id !== id) })),

      updateDebt: (id, patch) =>
        set((s) => ({ debts: s.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),

      bankAdjust: (id, newBalance, note) =>
        set((s) => ({
          debts: s.debts.map((d) => {
            if (d.id !== id) return d;
            const delta = newBalance - d.currentBalance;
            return {
              ...d,
              currentBalance: newBalance,
              paid: newBalance === 0,
              adjustments: [
                ...d.adjustments,
                { id: uid(), date: new Date().toISOString(), delta, note } as DebtAdjustment,
              ],
            };
          }),
        })),

      registerDebtPayment: (id, amount, date, note) => {
        let paidOff = false;
        let paidName = "";
        set((s) => {
          const debts = s.debts.map((d) => {
            if (d.id !== id) return d;
            const newBal = Math.max(0, d.currentBalance - amount);
            if (newBal === 0 && !d.paid) { paidOff = true; paidName = d.name; }
            return {
              ...d,
              currentBalance: newBal,
              paid: newBal === 0,
              paidAt: newBal === 0 ? new Date().toISOString() : d.paidAt,
              adjustments: [
                ...d.adjustments,
                { id: uid(), date: date ?? new Date().toISOString(), delta: -amount, note: note ?? "Pago" } as DebtAdjustment,
              ],
            };
          });
          const trophies = paidOff
            ? maybeAward(s.trophies, "debt_paid", `Liberaste: ${paidName}`, id)
            : s.trophies;
          return { debts, trophies };
        });
        return paidOff;
      },

      awardTrophy: (kind, label, contextId, monthKey) => {
        const s = get();
        const next = maybeAward(s.trophies, kind, label, contextId, monthKey);
        if (next === s.trophies) return null;
        const newTrophy = next[next.length - 1];
        set({ trophies: next });
        return newTrophy;
      },

      checkMonthClose: (monthKey) => {
        const s = get();
        const month = s.months[monthKey];
        if (!month) return [];
        const t = groupTotals(month.lines);
        const earned: Trophy[] = [];
        const expensesGroups = ["muros", "debts", "generosity", "lifestyle", "future"] as const;
        const plannedExp = expensesGroups.reduce((sum, g) => sum + t[g].planned, 0);
        const realExp = expensesGroups.reduce((sum, g) => sum + t[g].real, 0);
        let trophies = s.trophies;
        if (plannedExp > 0 && realExp > 0 && realExp < plannedExp) {
          const before = trophies;
          trophies = maybeAward(trophies, "under_budget", `Gastaste menos en ${monthKey}`, undefined, monthKey);
          if (trophies !== before) earned.push(trophies[trophies.length - 1]);
        }
        const [y, m] = monthKey.split("-").map(Number);
        const prevKey = `${m === 1 ? y - 1 : y}-${String(m === 1 ? 12 : m - 1).padStart(2, "0")}`;
        const prev = s.months[prevKey];
        if (prev) {
          const tp = groupTotals(prev.lines);
          if (t.income.real > 0 && tp.income.real > 0 && t.income.real > tp.income.real) {
            const before = trophies;
            trophies = maybeAward(trophies, "income_growth", `Ingresos al alza vs ${prevKey}`, undefined, monthKey);
            if (trophies !== before) earned.push(trophies[trophies.length - 1]);
          }
        }
        if (trophies !== s.trophies) set({ trophies });
        return earned;
      },

      setProfileName: (name) => set((s) => ({ profile: { ...s.profile, name } })),

      setPlan: (plan, days) =>
        set((s) => ({
          profile: {
            ...s.profile,
            plan,
            premiumUntil: plan === "premium" && days
              ? new Date(Date.now() + days * 86400_000).toISOString()
              : undefined,
          },
        })),

      redeemCode: (code) => {
        if (!REDEEM_CODES.has(code.trim().toUpperCase())) return false;
        get().setPlan("premium", 30);
        return true;
      },

      resetAll: () => set({ ...initialState }),
    }),
    { name: "fec.store.v1" },
  ),
);

export function isPremiumNow(profile: { plan: UserPlan; premiumUntil?: string }) {
  if (profile.plan !== "premium") return false;
  if (!profile.premiumUntil) return true;
  return new Date(profile.premiumUntil).getTime() > Date.now();
}

export function daysLeft(profile: { premiumUntil?: string }) {
  if (!profile.premiumUntil) return 0;
  const ms = new Date(profile.premiumUntil).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400_000));
}