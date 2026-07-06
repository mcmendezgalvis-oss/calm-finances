import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useApp } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import { fmt } from "@/lib/finance";
import { ChartTitleHelp } from "./ChartTitleHelp";

const PALETTE = ["#722F37", "#c48a7a", "#8c736d", "#6b8e6b", "#e8b7b1", "#b6cbb5", "#94b194"];

export function DebtsBarChart() {
  const { t } = useI18n();
  const debts = useApp((s) => s.debts);
  const currency = useApp((s) => s.profile.currency);

  const { data, total } = useMemo(() => {
    const rows = debts
      .map((d, i) => ({
        id: d.id,
        name: d.name,
        value: Math.max(0, d.currentBalance),
        color: PALETTE[i % PALETTE.length],
      }))
      .filter((d) => d.value > 0);
    const total = rows.reduce((s, d) => s + d.value, 0);
    return { data: rows, total };
  }, [debts]);

  const help =
    "Distribución de tu deuda viva actual. Cada porción refleja el 'Saldo Actual' de cada deuda y se actualiza en tiempo real.";

  if (data.length === 0 || total === 0) {
    return (
      <section className="bg-white border border-sage-100 rounded-3xl p-6">
        <ChartTitleHelp title={t.dashboard.debtCurve} help={help} />
        <p className="text-sm text-sage-500 italic py-12 text-center">{t.dashboard.noHistoryYet}</p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-sage-100 rounded-3xl p-6">
      <ChartTitleHelp title={t.dashboard.debtCurve} help={help} />
      <div className="h-80 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
              label={({ name, percent }) =>
                `${name} — ${((percent ?? 0) * 100).toFixed(1)}%`
              }
              labelLine={{ stroke: "#8c736d" }}
            >
              {data.map((d) => (
                <Cell key={d.id} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, _n, item) => {
                const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0";
                return [`${fmt(v, currency)} (${pct}%)`, item?.payload?.name ?? ""];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(_value, entry) => {
                const p = entry?.payload as { name?: string; value?: number } | undefined;
                return `${p?.name ?? ""} — ${fmt(p?.value ?? 0, currency)}`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-sage-500 text-center mt-3 tabular-nums">
        Total deuda viva: <span className="font-semibold text-sage-800">{fmt(total, currency)}</span>
      </p>
    </section>
  );
}