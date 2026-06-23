import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useApp, monthKeyOf } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import { fmt, EMERGENCY_FUND_ID, emergencyLevels, muros4Total } from "@/lib/finance";
import { HScrollChart } from "@/components/HScrollChart";

export function EmergencyFundEvolutionChart({ year }: { year: number }) {
  const { t, lang } = useI18n();
  const shields = useApp((s) => s.shields);
  const months = useApp((s) => s.months);
  const currency = useApp((s) => s.profile.currency);

  const fund = shields.find((s) => s.id === EMERGENCY_FUND_ID);

  const data = useMemo(() => {
    if (!fund) return [];
    return Array.from({ length: 12 }, (_, m) => {
      const d = new Date(year, m, 1);
      const end = new Date(year, m + 1, 0).getTime();
      let bal = 0;
      for (const h of fund.history) {
        if (new Date(h.date).getTime() <= end) {
          bal += h.type === "deposit" ? h.amount : -h.amount;
        }
      }
      return {
        month: d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short" }),
        balance: Math.max(0, bal),
      };
    });
  }, [fund, year, lang]);

  const refMonth = months[monthKeyOf(new Date())];
  const muros = refMonth ? muros4Total(refMonth) : 0;
  const levels = emergencyLevels(muros);

  if (!fund) return null;

  return (
    <section className="bg-white border border-sage-100 rounded-3xl p-6">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-wine mb-4">
        {t.emergency.title} · {year}
      </h2>
      <HScrollChart minWidth={Math.max(12 * 70, 360)} height={240}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="efGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#722F37" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#722F37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e8" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b8e6b" }} />
            <YAxis tick={{ fontSize: 11, fill: "#6b8e6b" }} width={56} />
            <Tooltip formatter={(v: number) => fmt(v, currency)} />
            {levels.l1 > 0 && <ReferenceLine y={levels.l1} stroke="#c48a7a" strokeDasharray="3 3" label={{ value: "L1", position: "right", fontSize: 10, fill: "#c48a7a" }} />}
            {levels.l2Max > 0 && <ReferenceLine y={levels.l2Max} stroke="#8c736d" strokeDasharray="3 3" label={{ value: "L2", position: "right", fontSize: 10, fill: "#8c736d" }} />}
            {levels.l3Max > 0 && <ReferenceLine y={levels.l3Max} stroke="#6b8e6b" strokeDasharray="3 3" label={{ value: "L3", position: "right", fontSize: 10, fill: "#6b8e6b" }} />}
            <Area dataKey="balance" stroke="#722F37" strokeWidth={2} fill="url(#efGrad)" type="monotone" />
          </AreaChart>
        </ResponsiveContainer>
      </HScrollChart>
    </section>
  );
}