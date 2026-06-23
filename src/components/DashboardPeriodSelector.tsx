import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

export type DashboardPeriod = {
  year: number;
  month: number; // 1-12 (kept for type compat; year-mode is the source of truth)
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
  const today = new Date();
  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i);

  const step = (dir: -1 | 1) => onChange({ ...value, year: value.year + dir, mode: "year" });

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
        <select
          value={value.year}
          onChange={(e) => onChange({ ...value, year: Number(e.target.value), mode: "year" })}
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
    </div>
  );
}