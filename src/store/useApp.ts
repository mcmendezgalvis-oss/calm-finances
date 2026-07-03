import { create } from "zustand";
import type {
  AppState, BudgetLine, Debt, DebtAdjustment, GroupKey, MonthBudget,
  ShieldTx, Trophy, TrophyKind, UserPlan,
} from "./types";
import { EMERGENCY_FUND_ID, emergencyLevels, emergencyLevelReached, groupTotals, muros4Total } from "@/lib/finance";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const monthKeyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const currentMonthKey = () => monthKeyOf(new Date());

export function nextMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return monthKeyOf(new Date(y, m, 1));
}

export type SurplusAllocation =
  | { type: "none" }
  | { type: "carry"; amount: number }
  | { type: "debt"; debtId: string; amount: number }
  | { type: "shield"; shieldId: string; amount: number };

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
  resetPlan: (monthKey: string) => void;
  resetActual: (monthKey: string) => void;
  addShield: (name: string, goal: number, kind?: "custom" | "initial" | "definitive") => string | null;
  removeShield: (id: string, options?: { force?: boolean }) => boolean;
  archiveShield: (id: string) => void;
  shieldHasClosedHistory: (id: string) => boolean;
  renameShield: (id: string, name: string) => boolean;
  shieldDeposit: (id: string, amount: number, note?: string, date?: string) => void;
  shieldWithdraw: (id: string, amount: number, note?: string, date?: string) => void;
  editShieldTx: (shieldId: string, txId: string, patch: { amount?: number; date?: string; note?: string }) => void;
  deleteShieldTx: (shieldId: string, txId: string) => void;
  addDebt: (input: { name: string; initialBalance: number; minimumPayment: number }) => string | null;
  removeDebt: (id: string) => void;
  updateDebt: (id: string, patch: Partial<Debt>) => void;
  bankAdjust: (id: string, newBalance: number, note?: string) => void;
  registerDebtPayment: (id: string, amount: number, date?: string, note?: string) => boolean;
  editDebtAdjustment: (debtId: string, adjId: string, patch: { delta?: number; date?: string; note?: string }) => void;
  deleteDebtAdjustment: (debtId: string, adjId: string) => void;
  setProfileName: (name: string) => void;
  setPlan: (plan: UserPlan, days?: number) => void;
  redeemCode: (code: string) => boolean;
  awardTrophy: (kind: TrophyKind, label: string, contextId?: string, monthKey?: string) => Trophy | null;
  checkMonthClose: (monthKey: string) => Trophy[];
  closeMonth: (monthKey: string, allocation: SurplusAllocation) => { ok: boolean; reason?: string };
  reopenMonth: (monthKey: string, mode: "continue" | "restore") => { ok: boolean; reason?: string; notice?: string };
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

function trophyKey(kind: TrophyKind, contextId?: string, monthKey?: string) {
  return `${kind}::${contextId ?? ""}::${monthKey ?? ""}`;
}

function maybeAward(
  trophies: Trophy[],
  kind: TrophyKind,
  label: string,
  contextId?: string,
  monthKey?: string,
): Trophy[] {
  const key = trophyKey(kind, contextId, monthKey);
  if (trophies.some((t) => trophyKey(t.kind, t.contextId, t.monthKey) === key)) return trophies;
  return [
    ...trophies,
    {
      id: uid(),
      kind,
      label,
      earnedAt: new Date().toISOString(),
      contextId,
      monthKey,
    },
  ];
}

function maybeAwardShieldTrophy(trophies: Trophy[], reached: 0 | 1 | 2 | 3): Trophy[] {
  let out = trophies;
  if (reached >= 1) out = maybeAward(out, "shield_l1", "Escudo Inicial completado", EMERGENCY_FUND_ID);
  if (reached >= 2) out = maybeAward(out, "shield_l2", "Nivel 2: 1–3 meses de gastos", EMERGENCY_FUND_ID);
  if (reached >= 3) out = maybeAward(out, "shield_l3", "Nivel 3: 3–6 meses de gastos", EMERGENCY_FUND_ID);
  return out;
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
    if (shield.archived && shield.id !== EMERGENCY_FUND_ID) continue;
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
                        { id: uid(), date: new Date().toISOString(), type: delta >= 0 ? "deposit" : "withdraw", amount: Math.abs(delta), note: "Aporte desde presupuesto", source: "budget" } as ShieldTx,
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
                  adjustments: [
                    ...dbt.adjustments,
                    { id: uid(), date: new Date().toISOString(), delta: -delta, note: "Abono desde presupuesto", source: "budget" } as DebtAdjustment,
                  ],
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
          const existing = s.months[monthKey];
          const existingLines = existing?.lines ?? [];
          // Names of "carry surplus" lines to never copy from prev (in any language).
          const isCarryName = (name: string) => {
            const n = name.trim().toLowerCase();
            return n === "sobrante mes anterior" || n === "previous month surplus" || n === "surplus from previous month";
          };
          // Existing linked targets and carry lines in destination must be preserved as-is.
          const existingLinkedShield = new Set(
            existingLines.filter((l) => l.linkedShieldId).map((l) => l.linkedShieldId as string),
          );
          const existingLinkedDebt = new Set(
            existingLines.filter((l) => l.linkedDebtId).map((l) => l.linkedDebtId as string),
          );
          const existingHasCarry = existingLines.some((l) => l.group === "income" && isCarryName(l.name));
          const copied: BudgetLine[] = [];
          for (const l of prev.lines) {
            // Skip the previous month's surplus carry line — it doesn't belong here.
            if (l.group === "income" && isCarryName(l.name)) continue;
            // Don't re-copy a carry line if destination already has one.
            if (existingHasCarry && l.group === "income" && isCarryName(l.name)) continue;
            // Don't duplicate linked goal/debt lines that already exist in destination.
            if (l.linkedShieldId && existingLinkedShield.has(l.linkedShieldId)) continue;
            if (l.linkedDebtId && existingLinkedDebt.has(l.linkedDebtId)) continue;
            copied.push({ ...l, id: uid(), real: 0 });
          }
          const merged: BudgetLine[] = [...existingLines, ...copied];
          return { months: { ...s.months, [monthKey]: { monthKey, lines: merged, ...(existing ? { closed: existing.closed, closedAt: existing.closedAt, snapshot: existing.snapshot, surplusCarryForwardId: existing.surplusCarryForwardId } : {}) } } };
        });
      },

      resetPlan: (monthKey) =>
        set((s) => {
          const month = s.months[monthKey];
          if (!month || month.closed) return s;
          const lines = month.lines.map((l) => ({ ...l, planned: 0 }));
          return { months: { ...s.months, [monthKey]: { ...month, lines } } };
        }),

      resetActual: (monthKey) =>
        set((s) => {
          const month = s.months[monthKey];
          if (!month || month.closed) return s;
          const lines = month.lines.map((l) => ({ ...l, real: 0 }));
          return { months: { ...s.months, [monthKey]: { ...month, lines } } };
        }),

      addShield: (name, goal, kind = "custom") => {
        const trimmed = name.trim();
        if (!trimmed) return null;
        const s = get();
        const exists = s.shields.some(
          (sh) => !sh.archived && sh.name.trim().toLowerCase() === trimmed.toLowerCase(),
        );
        if (exists) return null;
        const id = uid();
        set({
          shields: [
            ...s.shields,
            { id, name: trimmed, kind, goal, balance: 0, createdAt: new Date().toISOString(), history: [] },
          ],
        });
        return id;
      },

      shieldHasClosedHistory: (id) => {
        const s = get();
        for (const m of Object.values(s.months)) {
          if (!m.closed) continue;
          for (const l of m.lines) {
            if (l.linkedShieldId === id && (l.real || 0) > 0) return true;
          }
        }
        return false;
      },

      renameShield: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return false;
        const s = get();
        const dup = s.shields.some(
          (sh) => sh.id !== id && !sh.archived && sh.name.trim().toLowerCase() === trimmed.toLowerCase(),
        );
        if (dup) return false;
        set({
          shields: s.shields.map((sh) => (sh.id === id ? { ...sh, name: trimmed } : sh)),
          months: Object.fromEntries(
            Object.entries(s.months).map(([k, m]) => [
              k,
              { ...m, lines: m.lines.map((l) => (l.linkedShieldId === id ? { ...l, name: trimmed } : l)) },
            ]),
          ),
        });
        return true;
      },

      removeShield: (id, options) => {
        if (id === EMERGENCY_FUND_ID) return false;
        const s = get();
        const hasClosed = (() => {
          for (const m of Object.values(s.months)) {
            if (!m.closed) continue;
            for (const l of m.lines) if (l.linkedShieldId === id && (l.real || 0) > 0) return true;
          }
          return false;
        })();
        if (hasClosed && !options?.force) return false;
        set({
          shields: s.shields.filter((sh) => sh.id !== id),
          months: Object.fromEntries(
            Object.entries(s.months).map(([k, m]) => {
              // Remove linked lines only from open months (or all if force)
              if (m.closed && !options?.force) return [k, m];
              return [k, { ...m, lines: m.lines.filter((l) => l.linkedShieldId !== id) }];
            }),
          ),
        });
        return true;
      },

      archiveShield: (id) => {
        if (id === EMERGENCY_FUND_ID) return;
        set((s) => ({
          shields: s.shields.map((sh) => (sh.id === id ? { ...sh, archived: true } : sh)),
          // Strip linked lines from open/future months only
          months: Object.fromEntries(
            Object.entries(s.months).map(([k, m]) => {
              if (m.closed) return [k, m];
              return [k, { ...m, lines: m.lines.filter((l) => l.linkedShieldId !== id) }];
            }),
          ),
        }));
      },

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

      editShieldTx: (shieldId, txId, patch) =>
        set((s) => {
          const shields = s.shields.map((sh) => {
            if (sh.id !== shieldId) return sh;
            let balance = sh.balance;
            const history = sh.history.map((h) => {
              if (h.id !== txId) return h;
              const oldSigned = h.type === "deposit" ? h.amount : -h.amount;
              const nextAmount = patch.amount !== undefined ? Math.max(0, patch.amount) : h.amount;
              const newSigned = h.type === "deposit" ? nextAmount : -nextAmount;
              balance = Math.max(0, balance - oldSigned + newSigned);
              return {
                ...h,
                amount: nextAmount,
                date: patch.date ?? h.date,
                note: patch.note ?? h.note,
              };
            });
            return { ...sh, balance, history };
          });
          return { shields };
        }),

      deleteShieldTx: (shieldId, txId) =>
        set((s) => {
          const shields = s.shields.map((sh) => {
            if (sh.id !== shieldId) return sh;
            const tx = sh.history.find((h) => h.id === txId);
            if (!tx) return sh;
            const signed = tx.type === "deposit" ? tx.amount : -tx.amount;
            return {
              ...sh,
              balance: Math.max(0, sh.balance - signed),
              history: sh.history.filter((h) => h.id !== txId),
            };
          });
          return { shields };
        }),

      addDebt: ({ name, initialBalance, minimumPayment }) => {
        const trimmed = name.trim();
        if (!trimmed) return null;
        const s = get();
        const dup = s.debts.some(
          (d) => d.name.trim().toLowerCase() === trimmed.toLowerCase(),
        );
        if (dup) return null;
        const id = uid();
        set({
          debts: [
            ...s.debts,
            {
              id, name: trimmed, initialBalance, minimumPayment,
              currentBalance: initialBalance, paid: false,
              createdAt: new Date().toISOString(), adjustments: [],
            },
          ],
        });
        return id;
      },

      removeDebt: (id) => set((s) => ({ debts: s.debts.filter((d) => d.id !== id) })),

      updateDebt: (id, patch) =>
        set((s) => ({ debts: s.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),

      bankAdjust: (id, newBalance, note) => {
        let paidOff = false;
        let paidName = "";
        set((s) => {
          const debts = s.debts.map((d) => {
            if (d.id !== id) return d;
            const delta = newBalance - d.currentBalance;
            if (newBalance === 0 && !d.paid) { paidOff = true; paidName = d.name; }
            return {
              ...d,
              currentBalance: newBalance,
              paid: newBalance === 0,
              paidAt: newBalance === 0 && !d.paid ? new Date().toISOString() : d.paidAt,
              adjustments: [
                ...d.adjustments,
                { id: uid(), date: new Date().toISOString(), delta, note } as DebtAdjustment,
              ],
            };
          });
          const trophies = paidOff
            ? maybeAward(s.trophies, "debt_paid", `Liberaste: ${paidName}`, id)
            : s.trophies;
          return { debts, trophies };
        });
        return;
      },

      registerDebtPayment: (id, amount, date, note) => {
        // Solo registra el pago en el historial. NO modifica currentBalance ni paid.
        // El usuario actualiza el saldo manualmente vía bankAdjust según su estado de cuenta.
        set((s) => ({
          debts: s.debts.map((d) => {
            if (d.id !== id) return d;
            return {
              ...d,
              adjustments: [
                ...d.adjustments,
                { id: uid(), date: date ?? new Date().toISOString(), delta: -amount, note: note ?? "Pago" } as DebtAdjustment,
              ],
            };
          }),
        }));
        return false;
      },

      editDebtAdjustment: (debtId, adjId, patch) =>
        set((s) => ({
          debts: s.debts.map((d) => {
            if (d.id !== debtId) return d;
            return {
              ...d,
              adjustments: d.adjustments.map((a) =>
                a.id === adjId
                  ? {
                      ...a,
                      delta: patch.delta !== undefined ? patch.delta : a.delta,
                      date: patch.date ?? a.date,
                      note: patch.note ?? a.note,
                    }
                  : a,
              ),
            };
          }),
        })),

      deleteDebtAdjustment: (debtId, adjId) =>
        set((s) => ({
          debts: s.debts.map((d) =>
            d.id === debtId ? { ...d, adjustments: d.adjustments.filter((a) => a.id !== adjId) } : d,
          ),
        })),

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

      closeMonth: (monthKey, allocation) => {
        const s = get();
        const month = s.months[monthKey];
        if (!month) return { ok: false, reason: "no-month" };
        if (month.closed) return { ok: false, reason: "already-closed" };
        const closedAt = new Date().toISOString();
        let months = { ...s.months };
        let surplusCarryForwardId: string | undefined = undefined;
        let shields = s.shields;
        let debts = s.debts;

        // Compute real balance to know if the month is overdrawn.
        const totals = groupTotals(month.lines);
        const realBalance = totals.income.real
          - (totals.muros.real + totals.debts.real + totals.generosity.real + totals.lifestyle.real + totals.future.real);
        const overdrawn = realBalance < -0.005;

        if (allocation.type === "carry" && allocation.amount > 0) {
          const nKey = nextMonthKey(monthKey);
          const next = months[nKey] ?? emptyMonth(nKey);
          const lineId = uid();
          surplusCarryForwardId = lineId;
          months[nKey] = {
            ...next,
            lines: [
              ...next.lines,
              { id: lineId, group: "income", name: "Sobrante mes anterior", planned: allocation.amount, real: allocation.amount },
            ],
          };
        } else if (allocation.type === "debt" && allocation.amount > 0) {
          debts = debts.map((d) => {
            if (d.id !== allocation.debtId) return d;
            const newBal = Math.max(0, d.currentBalance - allocation.amount);
            return {
              ...d,
              currentBalance: newBal,
              paid: newBal === 0 || d.paid,
              paidAt: newBal === 0 && !d.paid ? closedAt : d.paidAt,
              adjustments: [
                ...d.adjustments,
                { id: uid(), date: closedAt, delta: -allocation.amount, note: "Sobrante de cierre de mes", source: "month-close" } as DebtAdjustment,
              ],
            };
          });
        } else if (allocation.type === "shield" && allocation.amount > 0) {
          shields = shields.map((sh) =>
            sh.id === allocation.shieldId
              ? {
                  ...sh,
                  balance: sh.balance + allocation.amount,
                  history: [...sh.history, { id: uid(), date: closedAt, type: "deposit", amount: allocation.amount, note: "Sobrante de cierre de mes", source: "month-close" } as ShieldTx],
                }
              : sh,
          );
        }

        months[monthKey] = {
          ...month,
          closed: true,
          closedAt,
          overdrawn,
          snapshot: { lines: month.lines.map((l) => ({ ...l })), closedAt },
          surplusCarryForwardId,
        };
        set({ months, shields, debts });
        get().checkMonthClose(monthKey);
        return { ok: true };
      },

      reopenMonth: (monthKey, mode) => {
        const s = get();
        const month = s.months[monthKey];
        if (!month || !month.closed) return { ok: false, reason: "not-closed" };
        let notice: string | undefined;
        let months = { ...s.months };

        // Carry-forward reversal
        if (month.surplusCarryForwardId) {
          const nKey = nextMonthKey(monthKey);
          const next = months[nKey];
          if (next) {
            if (next.closed) {
              return { ok: false, reason: "next-closed", notice: `No puedes reabrir este mes: el sobrante ya fue trasladado a ${nKey} y ese mes también está cerrado. Reabre primero el mes siguiente.` };
            }
            const carry = next.lines.find((l) => l.id === month.surplusCarryForwardId);
            if (carry) {
              if ((carry.real || 0) > 0 && carry.planned !== carry.real) {
                // user edited 'real' manually — preserve real, zero planned
                months[nKey] = {
                  ...next,
                  lines: next.lines.map((l) => (l.id === carry.id ? { ...l, planned: 0 } : l)),
                };
                notice = "El sobrante en el mes siguiente fue ajustado: se mantuvo el valor real que ya habías registrado.";
              } else {
                months[nKey] = { ...next, lines: next.lines.filter((l) => l.id !== carry.id) };
              }
            }
          }
        }

        const reopened: MonthBudget = {
          ...month,
          closed: false,
          closedAt: undefined,
          surplusCarryForwardId: undefined,
          lines: mode === "restore" && month.snapshot ? month.snapshot.lines.map((l) => ({ ...l })) : month.lines,
        };
        months[monthKey] = reopened;
        set({ months });
        return { ok: true, notice };
      },
    }),
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