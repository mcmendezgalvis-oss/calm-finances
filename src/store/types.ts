export type GroupKey = "income" | "muros" | "debts" | "generosity" | "lifestyle" | "future";

export interface BudgetLine {
  id: string;
  group: GroupKey;
  name: string;
  planned: number;
  real: number;
  linkedShieldId?: string;
  linkedDebtId?: string;
}

export interface MonthBudget {
  monthKey: string;
  lines: BudgetLine[];
}

export interface ShieldTx {
  id: string;
  date: string;
  type: "deposit" | "withdraw";
  amount: number;
  note?: string;
}

export type ShieldKind = "initial" | "definitive" | "custom";

export interface Shield {
  id: string;
  name: string;
  kind: ShieldKind;
  goal: number;
  balance: number;
  createdAt: string;
  history: ShieldTx[];
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
}