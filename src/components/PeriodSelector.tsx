import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es as esLocale, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useI18n } from "@/i18n/I18nProvider";

export type PeriodMode = "month" | "year" | "custom";

export interface PeriodValue {
  mode: PeriodMode;
  monthKey?: string; // YYYY-MM
  year?: number;
  from?: Date;
  to?: Date;
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
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);

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
    else if (mode === "year") onChange({ mode, year: value.year ?? today.getFullYear() });
    else onChange({ mode, from: value.from ?? new Date(today.getFullYear(), today.getMonth(), 1), to: value.to ?? today });
  };

  const setShortcut = (key: "last30" | "thisMonth" | "lastMonth" | "ytd") => {
    const now = new Date();
    let from: Date; let to = now;
    if (key === "last30") { from = new Date(now.getTime() - 30 * 86400_000); }
    else if (key === "thisMonth") { from = new Date(now.getFullYear(), now.getMonth(), 1); }
    else if (key === "lastMonth") {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0);
    } else { from = new Date(now.getFullYear(), 0, 1); }
    onChange({ mode: "custom", from, to });
  };

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-full bg-sage-50 p-1 border border-sage-200 text-xs">
        {(["month", "year", "custom"] as PeriodMode[]).map((m) => (
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

      {value.mode === "custom" && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {(["last30", "thisMonth", "lastMonth", "ytd"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setShortcut(k)}
                className="px-3 py-1.5 text-xs rounded-full bg-wine-50 text-wine border border-wine-100 hover:bg-wine-100 transition-colors"
              >
                {t.reports.shortcuts[k]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Popover open={openFrom} onOpenChange={setOpenFrom}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-12 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 size-4" />
                  <span className="text-xs uppercase tracking-widest text-sage-500 mr-2">{t.reports.from}</span>
                  <span className="tabular-nums">{value.from ? format(value.from, "PP", { locale }) : "—"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                <Calendar mode="single" selected={value.from} onSelect={(d) => { if (d) { onChange({ ...value, from: d, to: value.to && value.to < d ? d : value.to }); setOpenFrom(false); } }} locale={locale} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Popover open={openTo} onOpenChange={setOpenTo}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-12 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 size-4" />
                  <span className="text-xs uppercase tracking-widest text-sage-500 mr-2">{t.reports.to}</span>
                  <span className="tabular-nums">{value.to ? format(value.to, "PP", { locale }) : "—"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                <Calendar mode="single" selected={value.to} onSelect={(d) => { if (d) { onChange({ ...value, to: d }); setOpenTo(false); } }} disabled={(d) => (value.from ? d < value.from : false)} locale={locale} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          {value.from && value.to && (
            <p className="text-xs text-sage-500 italic">
              {format(value.from, "PPP", { locale })} – {format(value.to, "PPP", { locale })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}