import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useApp } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import { groupTotals, fmt } from "@/lib/finance";
import { ChartTitleHelp } from "./ChartTitleHelp";

const COLORS = ["#6b8e6b", "#c48a7a", "#8c736d", "#b6cbb5", "#e8b7b1"];

export function IncomeDestinationPie() {
  const { t } = useI18n();
  const months = useApp((s) => s.months);
  const currency = useApp((s) => s.profile.currency);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const mb = months[monthKey];
  const totals = mb ? groupTotals(mb.lines) : null;

  const data = useMemo(() => {
    if (!totals) return [];
    const raw = (["muros", "debts", "generosity", "lifestyle", "future"] as const)
      .map((g, i) => ({ name: t.budget.groups[g], value: totals[g].real, color: COLORS[i] }))
      .filter((d) => d.value > 0);
    const tot = raw.reduce((s, d) => s + d.value, 0) || 1;
    return raw.map((d) => ({ ...d, pct: (d.value / tot) * 100, name: `${d.name} — ${((d.value / tot) * 100).toFixed(1)}%` }));
  }, [totals, t]);

  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i);

  return (
    <section className="bg-white border border-sage-100 rounded-3xl p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <ChartTitleHelp
          title={t.dashboard.destination}
          help="Muestra la distribución exacta de tu dinero en el mes seleccionado. Cada porción representa una misión de tu presupuesto Base Cero."
        />
        <div className="inline-flex items-center gap-1 bg-sage-50 rounded-full p-1 border border-sage-200">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-7 bg-transparent text-xs text-sage-800 outline-none px-2 font-medium"
          >
            {t.months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-7 bg-transparent text-xs text-sage-800 outline-none px-2 font-medium tabular-nums"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-sage-500 italic py-12 text-center">
          {t.dashboard.noHistoryYet}
        </p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" outerRadius={110}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v, currency)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}