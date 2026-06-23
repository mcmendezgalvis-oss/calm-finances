import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

export type DashboardPeriod = {
  year: number;
  month: number; // 1-12
  mode: "month" | "year";
};

export function DashboardPeriodSelector({
  value,
  onChange,
}: {
  value: DashboardPeriod;
  onChange: (v: DashboardPeriod) => void;
}) {
  const { t } = useI18n();
  const months = t.months;
  const today = new Date();
  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i);

  const step = (dir: -1 | 1) => {
    if (value.mode === "month") {
      const d = new Date(value.year, value.month - 1 + dir, 1);
      onChange({ ...value, year: d.getFullYear(), month: d.getMonth() + 1 });
    } else {
      onChange({ ...value, year: value.year + dir });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-1 bg-white border border-sage-200 rounded-full p-1">
        <button
          onClick={() => step(-1)}
          className="size-8 grid place-items-center rounded-full hover:bg-sage-50 text-sage-700"
          aria-label={t.dashboardPeriod.prev}
        >
          <ChevronLeft className="size-4" />
        </button>
        {value.mode === "month" && (
          <select
            value={value.month}
            onChange={(e) => onChange({ ...value, month: Number(e.target.value) })}
            className="h-8 bg-transparent text-sm text-sage-800 outline-none px-1 font-medium tabular-nums"
          >
            {months.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        )}
        <select
          value={value.year}
          onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
          className="h-8 bg-transparent text-sm text-sage-800 outline-none px-1 font-medium tabular-nums"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button
          onClick={() => step(1)}
          className="size-8 grid place-items-center rounded-full hover:bg-sage-50 text-sage-700"
          aria-label={t.dashboardPeriod.next}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="inline-flex rounded-full bg-sage-50 p-1 border border-sage-200 text-xs">
        <button
          onClick={() => onChange({ ...value, mode: "month" })}
          className={`px-3 py-1.5 rounded-full ${value.mode === "month" ? "bg-wine text-white" : "text-sage-600"}`}
        >
          {t.reports.period.month}
        </button>
        <button
          onClick={() => onChange({ ...value, mode: "year" })}
          className={`px-3 py-1.5 rounded-full ${value.mode === "year" ? "bg-wine text-white" : "text-sage-600"}`}
        >
          {t.reports.period.year}
        </button>
      </div>
    </div>
  );
}