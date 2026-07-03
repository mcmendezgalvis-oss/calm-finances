import { format } from "date-fns";
import { es as esLocale, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/I18nProvider";

export type PeriodMode = "month" | "year";

export interface PeriodValue {
  mode: PeriodMode;
  monthKey?: string; // YYYY-MM
  year?: number;
}

function toMonthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function PeriodSelector({
  value,
  onChange,
}: {
  value: PeriodValue;
  onChange: (v: PeriodValue) => void;
}) {
  const { lang, t } = useI18n();
  const locale = lang === "es" ? esLocale : enUS;

  const today = new Date();
  // Allow selecting future months (proyecciones) as well as recent history.
  // Range: 24 months back through 24 months forward.
  const months = Array.from({ length: 49 }, (_, i) => {
    const offset = i - 24; // -24..+24, negative = past, positive = future
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    return { key: toMonthKey(d), label: format(d, "MMM yyyy", { locale }) };
  }).reverse(); // newest/future first
  const years = Array.from({ length: 7 }, (_, i) => today.getFullYear() + 2 - i); // +2 .. -4

  const setMode = (mode: PeriodMode) => {
    if (mode === "month") onChange({ mode, monthKey: value.monthKey ?? months[0].key });
    else onChange({ mode, year: value.year ?? today.getFullYear() });
  };

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-full bg-sage-50 p-1 border border-sage-200 text-xs">
        {(["month", "year"] as PeriodMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "px-4 py-1.5 rounded-full transition-colors",
              value.mode === m ? "bg-wine text-white" : "text-sage-600 hover:text-sage-900",
            )}
          >
            {t.reports.period[m]}
          </button>
        ))}
      </div>

      {value.mode === "month" && (
        <select
          value={value.monthKey ?? months[0].key}
          onChange={(e) => onChange({ mode: "month", monthKey: e.target.value })}
          className="h-11 w-full sm:w-64 rounded-xl border border-sage-200 bg-white px-3 text-sm"
        >
          {months.map((m) => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
      )}

      {value.mode === "year" && (
        <select
          value={value.year ?? today.getFullYear()}
          onChange={(e) => onChange({ mode: "year", year: Number(e.target.value) })}
          className="h-11 w-full sm:w-64 rounded-xl border border-sage-200 bg-white px-3 text-sm"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      )}
    </div>
  );
}