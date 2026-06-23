import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";

export function MonthSelector({
  monthKey,
  onChange,
}: {
  monthKey: string;
  onChange: (next: string) => void;
}) {
  const { t } = useI18n();
  const [y, m] = monthKey.split("-").map(Number);
  const label = `${t.months[m - 1]} ${y}`;

  const shift = (delta: number) => {
    const d = new Date(y, m - 1 + delta, 1);
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <div className="inline-flex items-center gap-1 bg-white border border-sage-200 rounded-full p-1">
      <button onClick={() => shift(-1)} className="p-2 rounded-full hover:bg-sage-100 text-sage-600">
        <ChevronLeft className="size-4" />
      </button>
      <span className="px-3 text-sm text-sage-900 font-medium min-w-[140px] text-center">{label}</span>
      <button onClick={() => shift(1)} className="p-2 rounded-full hover:bg-sage-100 text-sage-600">
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}