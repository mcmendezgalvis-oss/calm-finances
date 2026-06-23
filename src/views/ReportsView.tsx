import { useState } from "react";
import { FileDown, FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PremiumGate } from "@/components/PremiumGate";
import { PeriodSelector, type PeriodValue } from "@/components/PeriodSelector";
import { useApp } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import {
  generateBudgetVsRealReport,
  generateDebtDetailReport,
  generateShieldMovementsReport,
} from "@/lib/pdf";

type ReportKind = "budget" | "debt" | "shield";

function periodToRange(p: PeriodValue): { from: Date; to: Date; label: string } {
  if (p.mode === "month" && p.monthKey) {
    const [y, m] = p.monthKey.split("-").map(Number);
    const from = new Date(y, m - 1, 1);
    const to = new Date(y, m, 0);
    return { from, to, label: `${from.toLocaleDateString(undefined, { month: "long", year: "numeric" })}` };
  }
  if (p.mode === "year" && p.year) {
    return { from: new Date(p.year, 0, 1), to: new Date(p.year, 11, 31), label: `Año ${p.year}` };
  }
  const from = p.from ?? new Date();
  const to = p.to ?? new Date();
  return { from, to, label: `${from.toLocaleDateString()} – ${to.toLocaleDateString()}` };
}

export function ReportsView() {
  const { t } = useI18n();
  const state = useApp();
  const today = new Date();
  const [kind, setKind] = useState<ReportKind>("budget");
  const [period, setPeriod] = useState<PeriodValue>({
    mode: "month",
    monthKey: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
  });
  const [debtId, setDebtId] = useState<string>(state.debts[0]?.id ?? "");
  const [shieldId, setShieldId] = useState<string>(state.shields[0]?.id ?? "");

  const onDownload = () => {
    const { from, to, label } = periodToRange(period);
    if (kind === "budget") generateBudgetVsRealReport(state, from, to, label);
    if (kind === "debt" && debtId) generateDebtDetailReport(state, debtId, from, to, label);
    if (kind === "shield" && shieldId) generateShieldMovementsReport(state, shieldId, from, to, label);
  };

  const reportTypes: { key: ReportKind; label: string }[] = [
    { key: "budget", label: t.reports.typeBudget },
    { key: "debt", label: t.reports.typeDebt },
    { key: "shield", label: t.reports.typeShield },
  ];

  return (
    <AppShell>
      <header className="mb-8">
        <h1 className="font-serif text-4xl text-wine flex items-center gap-3">
          <FileText className="size-7" /> {t.reports.title}
        </h1>
        <p className="text-sm text-sage-600 italic mt-1">{t.reports.subtitle}</p>
      </header>

      <PremiumGate>
        <div className="bg-white border border-sage-100 rounded-3xl p-6 space-y-6 max-w-3xl">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-wine font-semibold mb-2">{t.reports.type}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {reportTypes.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setKind(r.key)}
                  className={`text-sm text-left px-4 py-3 rounded-2xl border transition-colors ${
                    kind === r.key ? "bg-wine text-white border-wine" : "bg-sage-50 border-sage-200 text-sage-700 hover:bg-sage-100"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {kind === "debt" && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-wine font-semibold mb-2">{t.reports.selectEntity}</p>
              <select
                value={debtId}
                onChange={(e) => setDebtId(e.target.value)}
                className="h-11 w-full sm:w-72 rounded-xl border border-sage-200 bg-white px-3 text-sm"
              >
                {state.debts.length === 0 && <option value="">—</option>}
                {state.debts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}

          {kind === "shield" && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-wine font-semibold mb-2">{t.reports.selectEntity}</p>
              <select
                value={shieldId}
                onChange={(e) => setShieldId(e.target.value)}
                className="h-11 w-full sm:w-72 rounded-xl border border-sage-200 bg-white px-3 text-sm"
              >
                {state.shields.length === 0 && <option value="">—</option>}
                {state.shields.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <p className="text-[10px] uppercase tracking-widest text-wine font-semibold mb-2">{t.reports.period.month} / {t.reports.period.year} / {t.reports.period.custom}</p>
            <PeriodSelector value={period} onChange={setPeriod} />
          </div>

          <button
            onClick={onDownload}
            disabled={(kind === "debt" && !debtId) || (kind === "shield" && !shieldId)}
            className="inline-flex items-center gap-2 bg-wine text-white text-sm px-6 py-3 rounded-full font-medium hover:opacity-90 transition disabled:opacity-40"
          >
            <FileDown className="size-4" /> {t.reports.download}
          </button>
        </div>
      </PremiumGate>
    </AppShell>
  );
}