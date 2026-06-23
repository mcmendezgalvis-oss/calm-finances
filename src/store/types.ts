export type GroupKey = "income" | "muros" | "debts" | "generosity" | "lifestyle" | "future";

export interface BudgetLine {
  id: string;
  group: GroupKey;
  name: string;
  planned: number;
  real: number;
  linkedShieldId?: string;
  linkedDebtId?: string;
  permanent?: boolean;
}

export interface MonthBudget {
  monthKey: string;
  lines: BudgetLine[];
  closed?: boolean;
  closedAt?: string;
  snapshot?: { lines: BudgetLine[]; closedAt: string };
  /** ID of the auto-generated "Sobrante mes anterior" line that this month created in monthKey+1 (if any) */
  surplusCarryForwardId?: string;
}

export interface ShieldTx {
  id: string;
  date: string;
  type: "deposit" | "withdraw";
  amount: number;
  note?: string;
}

export type ShieldKind = "emergency" | "initial" | "definitive" | "custom";

export interface Shield {
  id: string;
  name: string;
  kind: ShieldKind;
  goal: number;
  balance: number;
  createdAt: string;
  history: ShieldTx[];
  archived?: boolean;
}

export interface DebtAdjustment {
  id: string;
  date: string;
  delta: number;
  note?: string;
}

export interface Debt {
  id: string;
  name: string;
  initialBalance: number;
  minimumPayment: number;
  currentBalance: number;
  paid: boolean;
  createdAt: string;
  paidAt?: string;
  adjustments: DebtAdjustment[];
}

export type TrophyKind =
  | "shield_l1"
  | "shield_l2"
  | "shield_l3"
  | "debt_paid"
  | "under_budget"
  | "income_growth";

export interface Trophy {
  id: string;
  kind: TrophyKind;
  label: string;
  earnedAt: string;
  contextId?: string;
  monthKey?: string;
}

export type UserPlan = "free" | "premium";

export interface Profile {
  name: string;
  plan: UserPlan;
  premiumUntil?: string;
  currency: string;
}

export interface AppState {
  profile: Profile;
  months: Record<string, MonthBudget>;
  shields: Shield[];
  debts: Debt[];
  trophies: Trophy[];
}