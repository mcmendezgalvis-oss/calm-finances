import { CalendarIcon } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { formatMonthYear, firstOfMonthISO } from "@/lib/dates";

/**
 * Month + Year picker. Value/onChange operate on Date pinned to the 1st of the month.
 * Renders as two compact selects.
 */
export function MonthYearPicker({
  date,
  onChange,
  className = "",
}: {
  date: Date;
  onChange: (d: Date) => void;
  className?: string;
}) {
  const { t, lang } = useI18n();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const today = new Date();
  const years = Array.from({ length: 8 }, (_, i) => today.getFullYear() - 5 + i);
  return (
    <div className={`inline-flex items-center gap-1 h-9 bg-white border border-sage-200 rounded-full px-3 ${className}`}>
      <CalendarIcon className="size-3.5 text-sage-500" />
      <select
        value={month}
        onChange={(e) => onChange(new Date(firstOfMonthISO(year, Number(e.target.value))))}
        className="bg-transparent text-xs outline-none pr-1 tabular-nums"
        aria-label={t.historyRow.date}
      >
        {t.months.map((m, i) => (
          <option key={i} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => onChange(new Date(firstOfMonthISO(Number(e.target.value), month)))}
        className="bg-transparent text-xs outline-none tabular-nums"
        aria-label="Año"
      >
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      <span className="sr-only">{formatMonthYear(date, lang)}</span>
    </div>
  );
}