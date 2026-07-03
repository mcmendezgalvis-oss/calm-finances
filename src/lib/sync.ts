import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/store/useApp";
import type { AppState, MonthBudget, Shield, Debt, Trophy, BudgetLine, ShieldTx, DebtAdjustment } from "@/store/types";

let currentUserId: string | null = null;
let unsubscribe: (() => void) | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let isHydrating = false;
let migratedAt: string | null = null;

const LOCAL_KEY = "fec.store.v1";

// ---------- LOAD ----------

export async function loadFromSupabase(userId: string) {
  isHydrating = true;
  currentUserId = userId;

  const [profileRes, monthsRes, linesRes, shieldsRes, txRes, debtsRes, adjRes, trophiesRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("months").select("*").eq("user_id", userId),
    supabase.from("budget_lines").select("*").eq("user_id", userId),
    supabase.from("shields").select("*").eq("user_id", userId),
    supabase.from("shield_tx").select("*").eq("user_id", userId),
    supabase.from("debts").select("*").eq("user_id", userId),
    supabase.from("debt_adjustments").select("*").eq("user_id", userId),
    supabase.from("trophies").select("*").eq("user_id", userId),
  ]);

  const profile = profileRes.data;
  migratedAt = profile?.migrated_at ?? null;

  const linesByMonth = new Map<string, BudgetLine[]>();
  for (const l of linesRes.data ?? []) {
    const line: BudgetLine = {
      id: l.id,
      group: l.group as BudgetLine["group"],
      name: l.name,
      planned: Number(l.planned),
      real: Number(l.real),
      linkedShieldId: l.linked_shield_id ?? undefined,
      linkedDebtId: l.linked_debt_id ?? undefined,
      permanent: l.permanent ?? undefined,
    };
    const arr = linesByMonth.get(l.month_key) ?? [];
    arr.push(line);
    linesByMonth.set(l.month_key, arr);
  }

  const months: Record<string, MonthBudget> = {};
  for (const m of monthsRes.data ?? []) {
    months[m.id] = {
      monthKey: m.id,
      lines: linesByMonth.get(m.id) ?? [],
      closed: m.closed,
      closedAt: m.closed_at ?? undefined,
      snapshot: (m.snapshot as MonthBudget["snapshot"]) ?? undefined,
      surplusCarryForwardId: m.surplus_carry_forward_id ?? undefined,
    };
  }

  const txByShield = new Map<string, ShieldTx[]>();
  for (const t of txRes.data ?? []) {
    const tx: ShieldTx = {
      id: t.id,
      date: t.date,
      type: t.type as ShieldTx["type"],
      amount: Number(t.amount),
      note: t.note ?? undefined,
    };
    const arr = txByShield.get(t.shield_id) ?? [];
    arr.push(tx);
    txByShield.set(t.shield_id, arr);
  }

  const shields: Shield[] = (shieldsRes.data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    kind: s.kind as Shield["kind"],
    goal: Number(s.goal),
    balance: Number(s.balance),
    createdAt: s.created_at,
    archived: s.archived,
    history: (txByShield.get(s.id) ?? []).sort((a, b) => a.date.localeCompare(b.date)),
  }));

  const adjByDebt = new Map<string, DebtAdjustment[]>();
  for (const a of adjRes.data ?? []) {
    const adj: DebtAdjustment = {
      id: a.id,
      date: a.date,
      delta: Number(a.delta),
      note: a.note ?? undefined,
    };
    const arr = adjByDebt.get(a.debt_id) ?? [];
    arr.push(adj);
    adjByDebt.set(a.debt_id, arr);
  }

  const debts: Debt[] = (debtsRes.data ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    initialBalance: Number(d.initial_balance),
    minimumPayment: Number(d.minimum_payment),
    currentBalance: Number(d.current_balance),
    paid: d.paid,
    createdAt: d.created_at,
    paidAt: d.paid_at ?? undefined,
    adjustments: (adjByDebt.get(d.id) ?? []).sort((a, b) => a.date.localeCompare(b.date)),
  }));

  const trophies: Trophy[] = (trophiesRes.data ?? []).map((t) => ({
    id: t.id,
    kind: t.kind as Trophy["kind"],
    label: t.label,
    earnedAt: t.earned_at,
    contextId: t.context_id ?? undefined,
    monthKey: t.month_key ?? undefined,
  }));

  useApp.setState({
    profile: {
      name: profile?.name ?? "",
      plan: (profile?.plan as "free" | "premium") ?? "free",
      premiumUntil: profile?.premium_until ?? undefined,
      currency: profile?.currency ?? "EUR",
    },
    months,
    shields,
    debts,
    trophies,
  });

  // Migration from localStorage on first sign-in
  if (!migratedAt && typeof window !== "undefined") {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const local = parsed?.state as Partial<AppState> | undefined;
        const hasData =
          local &&
          ((local.months && Object.keys(local.months).length > 0) ||
            (local.shields && local.shields.length > 0) ||
            (local.debts && local.debts.length > 0));
        if (hasData) {
          // Merge local data into current state (Supabase was empty for new user)
          useApp.setState({
            profile: { ...useApp.getState().profile, ...(local.profile ?? {}) },
            months: local.months ?? {},
            shields: local.shields ?? [],
            debts: local.debts ?? [],
            trophies: local.trophies ?? [],
          });
        }
        window.localStorage.removeItem(LOCAL_KEY);
      } catch {
        /* noop */
      }
    }
    await supabase.from("profiles").update({ migrated_at: new Date().toISOString() }).eq("id", userId);
    migratedAt = new Date().toISOString();
  }

  isHydrating = false;

  // Push migrated data if any changes happened during hydration
  if (typeof window !== "undefined" && !migratedAt) return;
  // trigger initial push if local had data
  schedulePush();
}

// ---------- PUSH (write-through) ----------

let lastSnapshot: AppState | null = null;

function schedulePush() {
  if (!currentUserId || isHydrating) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void pushSnapshot();
  }, 400);
}

async function pushSnapshot() {
  if (!currentUserId) return;
  const userId = currentUserId;
  const state = useApp.getState();

  try {
    // Profile
    if (!lastSnapshot || JSON.stringify(state.profile) !== JSON.stringify(lastSnapshot.profile)) {
      await supabase.from("profiles").update({
        name: state.profile.name,
        plan: state.profile.plan,
        premium_until: state.profile.premiumUntil ?? null,
        currency: state.profile.currency,
        updated_at: new Date().toISOString(),
      }).eq("id", userId);
    }

    // Months
    const monthRows = Object.values(state.months).map((m) => ({
      id: m.monthKey,
      user_id: userId,
      closed: m.closed ?? false,
      closed_at: m.closedAt ?? null,
      snapshot: (m.snapshot ?? null) as never,
      surplus_carry_forward_id: m.surplusCarryForwardId ?? null,
      updated_at: new Date().toISOString(),
    }));
    if (monthRows.length > 0) {
      await supabase.from("months").upsert(monthRows);
    }
    // Delete removed months
    const monthIds = new Set(Object.keys(state.months));
    const prevMonthIds = lastSnapshot ? Object.keys(lastSnapshot.months) : [];
    const monthsToDelete = prevMonthIds.filter((id) => !monthIds.has(id));
    if (monthsToDelete.length > 0) {
      await supabase.from("months").delete().eq("user_id", userId).in("id", monthsToDelete);
    }

    // Lines (rebuild all — cheap for small budgets)
    const lineRows: Array<Record<string, unknown>> = [];
    for (const [mk, m] of Object.entries(state.months)) {
      m.lines.forEach((l, idx) => {
        lineRows.push({
          id: l.id,
          user_id: userId,
          month_key: mk,
          group: l.group,
          name: l.name,
          planned: l.planned,
          real: l.real,
          linked_shield_id: l.linkedShieldId ?? null,
          linked_debt_id: l.linkedDebtId ?? null,
          permanent: l.permanent ?? null,
          sort_order: idx,
          updated_at: new Date().toISOString(),
        });
      });
    }
    const lineIds = new Set(lineRows.map((r) => r.id as string));
    // Delete missing first (respecting FK — must delete before month deletes handled above)
    const prevLineIds = new Set<string>();
    if (lastSnapshot) {
      for (const m of Object.values(lastSnapshot.months)) for (const l of m.lines) prevLineIds.add(l.id);
    }
    const linesToDelete = [...prevLineIds].filter((id) => !lineIds.has(id));
    if (linesToDelete.length > 0) {
      await supabase.from("budget_lines").delete().eq("user_id", userId).in("id", linesToDelete);
    }
    if (lineRows.length > 0) {
      await supabase.from("budget_lines").upsert(lineRows as never);
    }

    // Shields + tx
    const shieldRows = state.shields.map((s) => ({
      id: s.id, user_id: userId, name: s.name, kind: s.kind,
      goal: s.goal, balance: s.balance, created_at: s.createdAt,
      archived: s.archived ?? false, updated_at: new Date().toISOString(),
    }));
    const shieldIds = new Set(shieldRows.map((r) => r.id));
    const prevShieldIds = lastSnapshot ? lastSnapshot.shields.map((s) => s.id) : [];
    const shieldsToDelete = prevShieldIds.filter((id) => !shieldIds.has(id));
    if (shieldsToDelete.length > 0) {
      await supabase.from("shields").delete().eq("user_id", userId).in("id", shieldsToDelete);
    }
    if (shieldRows.length > 0) await supabase.from("shields").upsert(shieldRows);

    const txRows: Array<Record<string, unknown>> = [];
    for (const s of state.shields) for (const t of s.history) {
      txRows.push({
        id: t.id, user_id: userId, shield_id: s.id,
        date: t.date, type: t.type, amount: t.amount, note: t.note ?? null,
      });
    }
    const txIds = new Set(txRows.map((r) => r.id as string));
    const prevTxIds = new Set<string>();
    if (lastSnapshot) for (const s of lastSnapshot.shields) for (const t of s.history) prevTxIds.add(t.id);
    const txToDelete = [...prevTxIds].filter((id) => !txIds.has(id));
    if (txToDelete.length > 0) {
      await supabase.from("shield_tx").delete().eq("user_id", userId).in("id", txToDelete);
    }
    if (txRows.length > 0) await supabase.from("shield_tx").upsert(txRows as never);

    // Debts + adjustments
    const debtRows = state.debts.map((d) => ({
      id: d.id, user_id: userId, name: d.name,
      initial_balance: d.initialBalance, minimum_payment: d.minimumPayment,
      current_balance: d.currentBalance, paid: d.paid,
      created_at: d.createdAt, paid_at: d.paidAt ?? null,
      updated_at: new Date().toISOString(),
    }));
    const debtIds = new Set(debtRows.map((r) => r.id));
    const prevDebtIds = lastSnapshot ? lastSnapshot.debts.map((d) => d.id) : [];
    const debtsToDelete = prevDebtIds.filter((id) => !debtIds.has(id));
    if (debtsToDelete.length > 0) {
      await supabase.from("debts").delete().eq("user_id", userId).in("id", debtsToDelete);
    }
    if (debtRows.length > 0) await supabase.from("debts").upsert(debtRows);

    const adjRows: Array<Record<string, unknown>> = [];
    for (const d of state.debts) for (const a of d.adjustments) {
      adjRows.push({
        id: a.id, user_id: userId, debt_id: d.id,
        date: a.date, delta: a.delta, note: a.note ?? null,
      });
    }
    const adjIds = new Set(adjRows.map((r) => r.id as string));
    const prevAdjIds = new Set<string>();
    if (lastSnapshot) for (const d of lastSnapshot.debts) for (const a of d.adjustments) prevAdjIds.add(a.id);
    const adjToDelete = [...prevAdjIds].filter((id) => !adjIds.has(id));
    if (adjToDelete.length > 0) {
      await supabase.from("debt_adjustments").delete().eq("user_id", userId).in("id", adjToDelete);
    }
    if (adjRows.length > 0) await supabase.from("debt_adjustments").upsert(adjRows as never);

    // Trophies
    const trophyRows = state.trophies.map((t) => ({
      id: t.id, user_id: userId, kind: t.kind, label: t.label,
      earned_at: t.earnedAt, context_id: t.contextId ?? null,
      month_key: t.monthKey ?? null,
    }));
    const trophyIds = new Set(trophyRows.map((r) => r.id));
    const prevTrophyIds = lastSnapshot ? lastSnapshot.trophies.map((t) => t.id) : [];
    const trophiesToDelete = prevTrophyIds.filter((id) => !trophyIds.has(id));
    if (trophiesToDelete.length > 0) {
      await supabase.from("trophies").delete().eq("user_id", userId).in("id", trophiesToDelete);
    }
    if (trophyRows.length > 0) await supabase.from("trophies").upsert(trophyRows);

    lastSnapshot = JSON.parse(JSON.stringify(state));
  } catch (err) {
    console.error("[sync] push failed", err);
  }
}

// ---------- SUBSCRIBE ----------

export function startSync(userId: string) {
  currentUserId = userId;
  lastSnapshot = JSON.parse(JSON.stringify(useApp.getState()));
  if (unsubscribe) unsubscribe();
  unsubscribe = useApp.subscribe(() => {
    schedulePush();
  });
  // Kick off an initial push if we merged local data during hydration
  schedulePush();
}

export function stopSync() {
  if (unsubscribe) unsubscribe();
  unsubscribe = null;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
  currentUserId = null;
  lastSnapshot = null;
  migratedAt = null;
}