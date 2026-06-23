import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useApp } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import { fmt, EMERGENCY_FUND_ID } from "@/lib/finance";
import { HScrollChart } from "@/components/HScrollChart";

const PALETTE = ["#6b8e6b", "#c48a7a", "#722F37", "#8c736d", "#b6cbb5", "#e8b7b1", "#94b194"];

export function GoalsBarChart({ year }: { year: number }) {
  const { t, lang } = useI18n();
  const shields = useApp((s) => s.shields).filter((s) => s.id !== EMERGENCY_FUND_ID && !s.archived);
  const currency = useApp((s) => s.profile.currency);

  const data = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      const d = new Date(year, m, 1);
      const start = new Date(year, m, 1).getTime();
      const end = new Date(year, m + 1, 0).getTime() + 86400_000 - 1;
      const row: Record<string, number | string> = {
        month: d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short" }),
      };
      for (const s of shields) {
        let total = 0;
        for (const h of s.history) {
          const ts = new Date(h.date).getTime();
          if (ts >= start && ts <= end) total += h.type === "deposit" ? h.amount : -h.amount;
        }
        row[s.id] = Math.max(0, total);
      }
      return row;
    });
  }, [shields, year, lang]);

  if (shields.length === 0) {
    return (
      <section className="bg-white border border-sage-100 rounded-3xl p-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-wine mb-4">
          {t.emergency.customGoals} · {year}
        </h2>
        <p className="text-sm text-sage-500 italic py-12 text-center">{t.dashboard.noHistoryYet}</p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-sage-100 rounded-3xl p-6">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-wine mb-4">
        {t.emergency.customGoals} · {year}
      </h2>
      <HScrollChart minWidth={Math.max(12 * 70, 360)} height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e8" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b8e6b" }} />
            <YAxis tick={{ fontSize: 11, fill: "#6b8e6b" }} width={56} />
            <Tooltip formatter={(v: number) => fmt(v, currency)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {shields.map((s, i) => (
              <Bar key={s.id} dataKey={s.id} name={s.name} stackId="g" fill={PALETTE[i % PALETTE.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </HScrollChart>
    </section>
  );
}