import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useApp } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import { fmt } from "@/lib/finance";
import { HScrollChart } from "@/components/HScrollChart";
import { ChartTitleHelp } from "./ChartTitleHelp";

const PALETTE = ["#722F37", "#c48a7a", "#8c736d", "#6b8e6b", "#e8b7b1", "#b6cbb5", "#94b194"];

export function DebtsBarChart({ year: yearProp }: { year?: number } = {}) {
  const { t, lang } = useI18n();
  const debts = useApp((s) => s.debts);
  const currency = useApp((s) => s.profile.currency);
  const today = new Date();
  const [year, setYear] = useState<number>(yearProp ?? today.getFullYear());
  const years = Array.from({ length: 8 }, (_, i) => today.getFullYear() - 5 + i);
  const currentMonthIdx = today.getFullYear() === year ? today.getMonth() : (year < today.getFullYear() ? 12 : -1);

  const data = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      const d = new Date(year, m, 1);
      const end = new Date(year, m + 1, 0).getTime() + 86400_000 - 1;
      const row: Record<string, number | string> = {
        month: d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short" }),
      };
      for (const dbt of debts) {
        const createdTs = new Date(dbt.createdAt).getTime();
        if (createdTs > end) {
          row[dbt.id] = 0;
          continue;
        }
        // For the current calendar month and future months, reflect the
        // manually-entered "Saldo Actual" live so the chart updates reactively.
        if (m >= currentMonthIdx && currentMonthIdx >= 0) {
          row[dbt.id] = Math.max(0, dbt.currentBalance);
        } else {
          let balance = dbt.initialBalance;
          for (const a of dbt.adjustments) {
            const ts = new Date(a.date).getTime();
            if (ts <= end) balance += a.delta;
          }
          row[dbt.id] = Math.max(0, balance);
        }
      }
      return row;
    });
  }, [debts, year, lang, currentMonthIdx]);

  // Stable color per debt id, then render largest current balance first (base of stack).
  const colorById = useMemo(() => {
    const map = new Map<string, string>();
    debts.forEach((d, i) => map.set(d.id, PALETTE[i % PALETTE.length]));
    return map;
  }, [debts]);
  const renderOrder = useMemo(
    () => [...debts].sort((a, b) => b.currentBalance - a.currentBalance),
    [debts],
  );

  if (debts.length === 0) {
    return (
      <section className="bg-white border border-sage-100 rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <ChartTitleHelp
            title={t.dashboard.debtCurve}
            help="Visualiza el colapso de tu montaña de deudas. Muestra cómo tu saldo real pendiente decrece hacia cero usando el método de Bola de Nieve."
          />
          <YearSelect year={year} years={years} onChange={setYear} />
        </div>
        <p className="text-sm text-sage-500 italic py-12 text-center">{t.dashboard.noHistoryYet}</p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-sage-100 rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <ChartTitleHelp
          title={t.dashboard.debtCurve}
          help="Visualiza el colapso de tu montaña de deudas. Muestra cómo tu saldo real pendiente decrece hacia cero usando el método de Bola de Nieve."
        />
        <YearSelect year={year} years={years} onChange={setYear} />
      </div>
      <HScrollChart minWidth={Math.max(12 * 70, 360)} height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e8" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b8e6b" }} />
            <YAxis tick={{ fontSize: 11, fill: "#6b8e6b" }} width={56} />
            <Tooltip formatter={(v: number) => fmt(v, currency)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {renderOrder.map((d) => (
              <Bar key={d.id} dataKey={d.id} name={d.name} stackId="d" fill={colorById.get(d.id)} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </HScrollChart>
    </section>
  );
}

function YearSelect({ year, years, onChange }: { year: number; years: number[]; onChange: (y: number) => void }) {
  return (
    <select
      value={year}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-8 bg-sage-50 border border-sage-200 rounded-full text-xs text-sage-800 outline-none px-3 font-medium tabular-nums"
      aria-label="Año"
    >
      {years.map((y) => <option key={y} value={y}>{y}</option>)}
    </select>
  );
}