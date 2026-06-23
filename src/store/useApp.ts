import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppState, BudgetLine, Debt, DebtAdjustment, GroupKey, MonthBudget,
  ShieldTx, UserPlan,
} from "./types";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const monthKeyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const currentMonthKey = () => monthKeyOf(new Date());

export function emptyMonth(monthKey: string): MonthBudget {
  return { monthKey, lines: [] };
}

interface Actions {
  ensureMonth: (monthKey: string) => MonthBudget;
  addLine: (monthKey: string, group: GroupKey, name?: string) => string;
  updateLine: (monthKey: string, lineId: string, patch: Partial<BudgetLine>) => void;
  removeLine: (monthKey: string, lineId: string) => void;
  copyFromPrevious: (monthKey: string) => void;
  addShield: (name: string, goal: number, kind?: "custom" | "initial" | "definitive") => string;
  removeShield: (id: string) => void;
  shieldDeposit: (id: string, amount: number, note?: string) => void;
  shieldWithdraw: (id: string, amount: number, note?: string) => void;
  addDebt: (input: { name: string; initialBalance: number; minimumPayment: number }) => string;
  removeDebt: (id: string) => void;
  updateDebt: (id: string, patch: Partial<Debt>) => void;
  bankAdjust: (id: string, newBalance: number, note?: string) => void;
  registerDebtPayment: (id: string, amount: number, date?: string, note?: string) => boolean;
  setProfileName: (name: string) => void;
  setPlan: (plan: UserPlan, days?: number) => void;
  redeemCode: (code: string) => boolean;
  resetAll: () => void;
}

export type Store = AppState & Actions;

const initialState: AppState = {
  profile: { name: "", plan: "free", currency: "USD" },
  months: {},
  shields: [],
  debts: [],
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
  for (const shield of state.shields) {
    if (!lines.find((l) => l.linkedShieldId === shield.id)) {
      lines.push({
        id: uid(), group: "future", name: shield.name,
        planned: 0, real: 0, linkedShieldId: shield.id,
      });
    }
  }
  for (const debt of state.debts) {
    if (debt.paid) continue;
    if (!lines.find((l) => l.linkedDebtId === debt.id)) {
      lines.push({
        id: uid(), group: "debts", name: debt.name,
        planned: debt.minimumPayment, real: 0, linkedDebtId: debt.id,
      });
    }
  }
  return { monthKey, lines };
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
            }
            if (before.linkedDebtId) {
              debts = debts.map((dbt) => {
                if (dbt.id !== before.linkedDebtId) return dbt;
                const newBal = Math.max(0, dbt.currentBalance - delta);
                const justPaid = !dbt.paid && newBal === 0 && delta > 0;
                return {
                  ...dbt,
                  currentBalance: newBal,
                  paid: justPaid ? true : dbt.paid,
                  paidAt: justPaid ? new Date().toISOString() : dbt.paidAt,
                };
              });
            }
          }
          return { months: { ...s.months, [monthKey]: { ...month, lines } }, shields, debts };
        });
      },

      removeLine: (monthKey, lineId) => {
        set((s) => {
          const month = s.months[monthKey];
          if (!month) return s;
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

      shieldDeposit: (id, amount, note) =>
        set((s) => ({
          shields: s.shields.map((sh) =>
            sh.id === id
              ? {
                  ...sh,
                  balance: sh.balance + amount,
                  history: [...sh.history, { id: uid(), date: new Date().toISOString(), type: "deposit", amount, note } as ShieldTx],
                }
              : sh,
          ),
        })),

      shieldWithdraw: (id, amount, note) =>
        set((s) => ({
          shields: s.shields.map((sh) =>
            sh.id === id
              ? {
                  ...sh,
                  balance: Math.max(0, sh.balance - amount),
                  history: [...sh.history, { id: uid(), date: new Date().toISOString(), type: "withdraw", amount, note } as ShieldTx],
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

      registerDebtPayment: (id, amount) => {
        let paidOff = false;
        set((s) => ({
          debts: s.debts.map((d) => {
            if (d.id !== id) return d;
            const newBal = Math.max(0, d.currentBalance - amount);
            if (newBal === 0 && !d.paid) paidOff = true;
            return { ...d, currentBalance: newBal, paid: newBal === 0, paidAt: newBal === 0 ? new Date().toISOString() : d.paidAt };
          }),
        }));
        return paidOff;
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