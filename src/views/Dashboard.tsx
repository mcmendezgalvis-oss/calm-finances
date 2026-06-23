import { useEffect, useMemo, useState } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, Legend,
  AreaChart, Area,
} from "recharts";
import { FileDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PremiumGate } from "@/components/PremiumGate";
import { useApp, isPremiumNow, monthKeyOf } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import { groupTotals, fmt } from "@/lib/finance";
import { generateMonthReport, generateYearReport } from "@/lib/pdf";
import { DashboardPeriodSelector, type DashboardPeriod } from "@/components/DashboardPeriodSelector";
import { HScrollChart } from "@/components/HScrollChart";
import { celebrateTrophy } from "@/lib/trophies";

const COLORS = ["#6b8e6b", "#c48a7a", "#8c736d", "#b6cbb5", "#e8b7b1", "#94b194"];

export function Dashboard() {
  const { t, lang } = useI18n();
  const state = useApp();
  const profile = state.profile;
  const ensureMonth = state.ensureMonth;
  const checkMonthClose = state.checkMonthClose;
  const today = new Date();
  const [period, setPeriod] = useState<DashboardPeriod>({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    mode: "month",
  });
  const monthKey = `${period.year}-${String(period.month).padStart(2, "0")}`;

  useEffect(() => { ensureMonth(monthKey); }, [monthKey, ensureMonth]);

  // Awarding month-close trophies when viewing past months with data
  useEffect(() => {
    const earned = checkMonthClose(monthKey);
    earned.forEach((tr) => celebrateTrophy(tr, lang));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  const month = state.months[monthKey] ?? { monthKey, lines: [] };
  const totals = groupTotals(month.lines);
  const currency = profile.currency;

  const donutData = useMemo(() => {
    return (["muros","debts","generosity","lifestyle","future"] as const)
      .map((g, i) => ({ name: t.budget.groups[g], value: totals[g].real, color: COLORS[i] }))
      .filter((d) => d.value > 0);
  }, [totals, t]);

  const evolutionData = useMemo(() => {
    const data: { month: string; income: number; expenses: number }[] = [];
    const ranges: Date[] = period.mode === "year"
      ? Array.from({ length: 12 }, (_, m) => new Date(period.year, m, 1))
      : Array.from({ length: 6 }, (_, i) => new Date(period.year, period.month - 1 - (5 - i), 1));
    for (const d of ranges) {
      const key = monthKeyOf(d);
      const mb = state.months[key];
      const t2 = mb ? groupTotals(mb.lines) : null;
      data.push({
        month: d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short" }),
        income: t2?.income.real || 0,
        expenses: t2 ? (t2.muros.real + t2.debts.real + t2.generosity.real + t2.lifestyle.real + t2.future.real) : 0,
      });
    }
    return data;
  }, [state.months, lang, period]);

  const debtBars = useMemo(() => {
    const active = state.debts.filter((d) => !d.paid).sort((a, b) => a.currentBalance - b.currentBalance);
    const paid = state.debts.filter((d) => d.paid);
    return [...active, ...paid].map((d, i) => ({
      label: `D${i + 1}`,
      name: d.name,
      current: d.currentBalance,
      tag: `D${i + 1}=${fmt(d.currentBalance, currency)}${d.paid ? " ✓" : ""}`,
    }));
  }, [state.debts, currency]);

  const shieldsGrowthData = useMemo(() => {
    const ranges: Date[] = period.mode === "year"
      ? Array.from({ length: 12 }, (_, m) => new Date(period.year, m, 1))
      : Array.from({ length: 6 }, (_, i) => new Date(period.year, period.month - 1 - (5 - i), 1));
    const buckets: { month: string; total: number }[] = [];
    for (const d of ranges) {
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime();
      const total = state.shields.reduce((sum, s) => {
        let bal = 0;
        for (const h of s.history) {
          if (new Date(h.date).getTime() <= end) {
            bal += h.type === "deposit" ? h.amount : -h.amount;
          }
        }
        return sum + Math.max(0, bal);
      }, 0);
      buckets.push({
        month: d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short" }),
        total,
      });
    }
    if (buckets.every((b) => b.total === 0)) {
      const now = state.shields.reduce((s, sh) => s + sh.balance, 0);
      if (buckets.length) buckets[buckets.length - 1].total = now;
    }
    return buckets;
  }, [state.shields, lang, period]);

  const premium = isPremiumNow(profile);
  const greeting = profile.name ? `${t.dashboard.greeting}, ${profile.name}.` : `${t.dashboard.greeting}.`;

  const evoMinWidth = Math.max(evolutionData.length * 70, 360);
  const shieldMinWidth = Math.max(shieldsGrowthData.length * 70, 360);
  const debtMinHeight = Math.max(220, debtBars.length * 44);

  return (
    <AppShell>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl text-wine">{greeting}</h1>
          <p className="text-sm text-sage-600 italic mt-2">{t.tagline}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            disabled={!premium}
            onClick={() => generateMonthReport(state, monthKey)}
            className="inline-flex items-center gap-2 bg-sage-900 text-sage-50 text-sm px-4 py-2.5 rounded-full hover:bg-sage-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileDown className="size-4" /> {t.dashboard.reportMonth}
          </button>
          <button
            disabled={!premium}
            onClick={() => generateYearReport(state, period.year)}
            className="inline-flex items-center gap-2 bg-white border border-sage-200 text-sage-700 text-sm px-4 py-2.5 rounded-full hover:bg-sage-50 transition-colors disabled:opacity-40"
          >
            <FileDown className="size-4" /> {t.dashboard.reportYear}
          </button>
        </div>
      </header>

      <div className="sticky top-0 z-20 -mx-5 md:-mx-10 px-5 md:px-10 py-3 mb-6 bg-sage-50/90 backdrop-blur border-y border-sage-100">
        <DashboardPeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Always-free donut */}
      <section className="bg-white border border-sage-100 rounded-3xl p-6 mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-wine mb-4">
          {t.dashboard.destination}
        </h2>
        {donutData.length === 0 ? (
          <p className="text-sm text-sage-500 italic py-12 text-center">
            Aún sin gastos registrados este mes.
          </p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v, currency)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <PremiumGate allowReadOnly>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border border-sage-100 rounded-3xl p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-wine mb-4">
              {t.dashboard.evolution}
            </h2>
            <HScrollChart minWidth={evoMinWidth} height={240}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e8" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b8e6b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b8e6b" }} width={48} />
                  <Tooltip formatter={(v: number) => fmt(v, currency)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="income" name={t.dashboard.income} fill="#6b8e6b" radius={[6,6,0,0]} />
                  <Bar dataKey="expenses" name={t.dashboard.expenses} fill="#c48a7a" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </HScrollChart>
          </section>

          <section className="bg-white border border-sage-100 rounded-3xl p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-wine mb-4">
              {t.dashboard.debtCurve}
            </h2>
            {debtBars.length === 0 ? (
              <p className="text-sm text-sage-500 italic py-12 text-center">{t.dashboard.noHistoryYet}</p>
            ) : (
              <HScrollChart minWidth={420} height={debtMinHeight}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={debtBars} layout="vertical" margin={{ left: 16, right: 96 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e8" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#6b8e6b" }} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "#722F37", fontWeight: 600 }} width={36} />
                    <Tooltip formatter={(v: number) => fmt(v, currency)} labelFormatter={(l, p) => (p && p[0] && (p[0] as { payload?: { name?: string } }).payload?.name) || String(l)} />
                    <Bar dataKey="current" fill="#722F37" radius={[0, 6, 6, 0]}>
                      <LabelList dataKey="tag" position="right" style={{ fontSize: 11, fill: "#722F37", fontWeight: 600 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </HScrollChart>
            )}
          </section>

          <section className="bg-white border border-sage-100 rounded-3xl p-6 lg:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-wine mb-4">
              {t.dashboard.shieldsGrowth}
            </h2>
            <HScrollChart minWidth={shieldMinWidth} height={240}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={shieldsGrowthData}>
                  <defs>
                    <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6b8e6b" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6b8e6b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8f0e8" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b8e6b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b8e6b" }} width={48} />
                  <Tooltip formatter={(v: number) => fmt(v, currency)} />
                  <Area dataKey="total" stroke="#6b8e6b" strokeWidth={2} fill="url(#shieldGrad)" type="monotone" />
                </AreaChart>
              </ResponsiveContainer>
            </HScrollChart>
          </section>
        </div>
      </PremiumGate>
    </AppShell>
  );
}