import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import { FileDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PremiumGate } from "@/components/PremiumGate";
import { useApp, isPremiumNow, monthKeyOf, currentMonthKey } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import { groupTotals, fmt } from "@/lib/finance";
import { generateMonthReport, generateYearReport } from "@/lib/pdf";
import { HScrollChart } from "@/components/HScrollChart";
import { IncomeDestinationPie } from "@/components/charts/IncomeDestinationPie";
import { DebtsBarChart } from "@/components/charts/DebtsBarChart";
import { celebrateTrophy } from "@/lib/trophies";
import { ChartTitleHelp } from "@/components/charts/ChartTitleHelp";

export function Dashboard() {
  const { t, lang } = useI18n();
  const state = useApp();
  const profile = state.profile;
  const ensureMonth = state.ensureMonth;
  const ensureEmergencyFund = state.ensureEmergencyFund;
  const today = new Date();
  const [evolutionYear, setEvolutionYear] = useState<number>(today.getFullYear());
  const evolutionYears = Array.from({ length: 8 }, (_, i) => today.getFullYear() - 5 + i);
  const monthKey = currentMonthKey();
  const currency = profile.currency;

  useEffect(() => {
    ensureEmergencyFund();
    ensureMonth(monthKey);
  }, [monthKey, ensureMonth, ensureEmergencyFund]);

  const evolutionData = useMemo(() => {
    const data: { month: string; income: number; expenses: number }[] = [];
    const ranges: Date[] = Array.from({ length: 12 }, (_, m) => new Date(evolutionYear, m, 1));
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
  }, [state.months, lang, evolutionYear]);

  const premium = isPremiumNow(profile);
  const greeting = profile.name
    ? t.dashboard.greetingTemplate.replace("{name}", profile.name)
    : t.dashboard.greetingFallback;

  const evoMinWidth = Math.max(evolutionData.length * 70, 360);

  // celebrate any pending month-close trophies for current month, once
  useEffect(() => {
    const earned = state.checkMonthClose(monthKey);
    earned.forEach((tr) => celebrateTrophy(tr, lang));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  return (
    <AppShell>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-wine leading-tight max-w-2xl">{greeting}</h1>
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
            onClick={() => generateYearReport(state, evolutionYear)}
            className="inline-flex items-center gap-2 bg-white border border-sage-200 text-sage-700 text-sm px-4 py-2.5 rounded-full hover:bg-sage-50 transition-colors disabled:opacity-40"
          >
            <FileDown className="size-4" /> {t.dashboard.reportYear}
          </button>
        </div>
      </header>

      <IncomeDestinationPie />

      <PremiumGate allowReadOnly>
        <div className="grid grid-cols-1 gap-6">
          <section className="bg-white border border-sage-100 rounded-3xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <ChartTitleHelp
                title={t.dashboard.evolution}
                help="Compara tus ingresos totales frente a tus gastos mes a mes. Tu objetivo es mantener siempre la barra de ingresos por encima."
              />
              <select
                value={evolutionYear}
                onChange={(e) => setEvolutionYear(Number(e.target.value))}
                className="h-8 bg-sage-50 border border-sage-200 rounded-full text-xs text-sage-800 outline-none px-3 font-medium tabular-nums"
                aria-label="Año"
              >
                {evolutionYears.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
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

          <DebtsBarChart />
        </div>
      </PremiumGate>
    </AppShell>
  );
}