import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es as esLocale, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useI18n } from "@/i18n/I18nProvider";

export function InlineDatePicker({
  date,
  onChange,
  className = "",
}: {
  date: Date;
  onChange: (d: Date) => void;
  className?: string;
}) {
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const locale = lang === "es" ? esLocale : enUS;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={`h-9 justify-start font-normal ${className}`}>
          <CalendarIcon className="mr-2 size-3.5" />
          <span className="tabular-nums text-xs">{format(date, "PP", { locale })}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => { if (d) { onChange(d); setOpen(false); } }}
          locale={locale}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}