import { useMemo, useState } from "react";
import { FileDown, FileText, FileSpreadsheet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PremiumGate } from "@/components/PremiumGate";
import { PeriodSelector, type PeriodValue } from "@/components/PeriodSelector";
import { useApp, currentMonthKey } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import { groupTotals, fmt } from "@/lib/finance";
import { downloadCSV } from "@/lib/csv";
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

  const { from, to } = periodToRange(period);
  const currency = state.profile.currency;

  // Helpers for the unified movement feeds (debt and shield).
  type Mv = { date: string; type: string; amount: number; note: string; sortTs: number; signed: number };

  const buildDebtMovements = useMemo(() => (debtId: string): Mv[] => {
    const debt = state.debts.find((d) => d.id === debtId);
    if (!debt) return [];
    const out: Mv[] = [];
    for (const a of debt.adjustments) {
      out.push({
        date: new Date(a.date).toLocaleDateString(),
        type: a.delta < 0 ? "Pago / abono" : "Ajuste banco",
        amount: a.delta,
        note: a.note ?? "",
        sortTs: new Date(a.date).getTime(),
        signed: a.delta,
      });
    }
    for (const [k, m] of Object.entries(state.months)) {
      for (const l of m.lines) {
        if (l.linkedDebtId !== debtId) continue;
        const real = l.real || 0;
        if (real <= 0) continue;
        const [y, mm] = k.split("-").map(Number);
        const d = new Date(y, mm, 0);
        out.push({
          date: d.toLocaleDateString(),
          type: "Abono desde presupuesto",
          amount: -real,
          note: `Mes ${k}`,
          sortTs: d.getTime(),
          signed: -real,
        });
      }
    }
    return out.sort((a, b) => a.sortTs - b.sortTs);
  }, [state.debts, state.months]);

  const buildShieldMovements = useMemo(() => (shieldId: string): Mv[] => {
    const sh = state.shields.find((s) => s.id === shieldId);
    if (!sh) return [];
    const out: Mv[] = [];
    for (const h of sh.history) {
      const signed = h.type === "deposit" ? h.amount : -h.amount;
      out.push({
        date: new Date(h.date).toLocaleDateString(),
        type: h.type === "deposit" ? "Aporte" : "Retiro",
        amount: signed,
        note: h.note ?? "",
        sortTs: new Date(h.date).getTime(),
        signed,
      });
    }
    // Linked budget contributions in any month (already create ShieldTx entries via updateLine,
    // so they should already exist in history). Avoid double-counting by skipping budget-linked
    // lines unless not yet reflected in history (best-effort: do not add to prevent duplicates).
    return out.sort((a, b) => a.sortTs - b.sortTs);
  }, [state.shields]);

  // Build preview table per report type, including TOTAL row.
  const preview = (() => {
    if (kind === "budget") {
      const keys: string[] = [];
      const start = new Date(from.getFullYear(), from.getMonth(), 1);
      const end = new Date(to.getFullYear(), to.getMonth(), 1);
      while (start <= end) {
        keys.push(`${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`);
        start.setMonth(start.getMonth() + 1);
      }
      const rows: { label: string; planned: number; real: number }[] = [];
      let tp = 0, tr = 0;
      const currKey = currentMonthKey();
      for (const k of keys) {
        const m = state.months[k];
        const isFuture = k > currKey;
        if (!m) {
          // Future projection with no plan yet — still show a row with zeros.
          if (isFuture) rows.push({ label: `${k} (proyección)`, planned: 0, real: 0 });
          continue;
        }
        const g = groupTotals(m.lines);
        const planned = (["muros","debts","generosity","lifestyle","future"] as const).reduce((s, k2) => s + g[k2].planned, 0);
        const real = isFuture
          ? 0
          : (["muros","debts","generosity","lifestyle","future"] as const).reduce((s, k2) => s + g[k2].real, 0);
        rows.push({ label: isFuture ? `${k} (proyección)` : k, planned, real });
        tp += planned; tr += real;
      }
      return { cols: ["Mes", "Plan", "Real"], rows: rows.map((r) => [r.label, fmt(r.planned, currency), fmt(r.real, currency)]), totals: ["TOTAL", fmt(tp, currency), fmt(tr, currency)] };
    }
    if (kind === "debt" && debtId) {
      const debt = state.debts.find((d) => d.id === debtId);
      if (!debt) return null;
      const tFrom = from.getTime(); const tTo = to.getTime() + 86400_000;
      const mvs = buildDebtMovements(debtId).filter((m) => m.sortTs >= tFrom && m.sortTs <= tTo);
      const total = mvs.reduce((s, m) => s + m.signed, 0);
      return {
        cols: ["Fecha", "Tipo", "Monto", "Nota"],
        rows: mvs.map((m) => [m.date, m.type, (m.signed >= 0 ? "+" : "") + fmt(m.signed, currency), m.note]),
        totals: ["TOTAL", "", (total >= 0 ? "+" : "") + fmt(total, currency), ""],
      };
    }
    if (kind === "shield" && shieldId) {
      const sh = state.shields.find((s) => s.id === shieldId);
      if (!sh) return null;
      const tFrom = from.getTime(); const tTo = to.getTime() + 86400_000;
      const mvs = buildShieldMovements(shieldId).filter((m) => m.sortTs >= tFrom && m.sortTs <= tTo);
      const total = mvs.reduce((s, m) => s + m.signed, 0);
      return {
        cols: ["Fecha", "Tipo", "Monto", "Nota"],
        rows: mvs.map((m) => [m.date, m.type, (m.signed >= 0 ? "+" : "") + fmt(m.signed, currency), m.note]),
        totals: ["TOTAL", "", (total >= 0 ? "+" : "") + fmt(total, currency), ""],
      };
    }
    return null;
  })();

  const onDownloadCSV = () => {
    if (!preview) return;
    const rows: (string | number)[][] = [preview.cols, ...preview.rows, preview.totals];
    const tag = kind === "budget" ? "presupuesto" : kind === "debt" ? "deuda" : "fondo";
    const stamp = period.mode === "month" ? (period.monthKey ?? "") : period.mode === "year" ? String(period.year ?? "") : `${period.from?.toISOString().slice(0,10)}_${period.to?.toISOString().slice(0,10)}`;
    downloadCSV(`reporte-${tag}-${stamp}.csv`, rows);
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

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onDownload}
              disabled={(kind === "debt" && !debtId) || (kind === "shield" && !shieldId)}
              className="inline-flex items-center gap-2 bg-wine text-white text-sm px-6 py-3 rounded-full font-medium hover:opacity-90 transition disabled:opacity-40"
            >
              <FileDown className="size-4" /> {t.reports.download}
            </button>
            <button
              onClick={onDownloadCSV}
              disabled={!preview || preview.rows.length === 0}
              className="inline-flex items-center gap-2 bg-sage-900 text-sage-50 text-sm px-6 py-3 rounded-full font-medium hover:bg-sage-700 transition disabled:opacity-40"
            >
              <FileSpreadsheet className="size-4" /> Exportar CSV
            </button>
          </div>
        </div>

        {preview && (
          <div className="bg-white border border-sage-100 rounded-3xl p-6 mt-6 max-w-3xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-wine border-b border-wine/15">
                  {preview.cols.map((c) => (
                    <th key={c} className="text-left font-semibold py-2 px-2">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.length === 0 ? (
                  <tr><td colSpan={preview.cols.length} className="text-center text-sage-500 italic py-6">{t.reports.noData}</td></tr>
                ) : preview.rows.map((r, i) => (
                  <tr key={i} className="border-b border-sage-50">
                    {r.map((c, j) => <td key={j} className="py-2 px-2 tabular-nums text-sage-700">{c}</td>)}
                  </tr>
                ))}
              </tbody>
              {preview.rows.length > 0 && (
                <tfoot>
                  <tr className="font-bold bg-sage-50 border-t-2 border-wine">
                    {preview.totals.map((c, j) => (
                      <td key={j} className="py-2 px-2 tabular-nums text-wine">{c}</td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </PremiumGate>
    </AppShell>
  );
}