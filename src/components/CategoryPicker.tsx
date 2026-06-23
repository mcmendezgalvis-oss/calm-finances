import { useState } from "react";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useI18n } from "@/i18n/I18nProvider";
import { categoriesFor } from "@/lib/categories";
import type { GroupKey } from "@/store/types";

export function CategoryPicker({
  group,
  onPick,
  label,
}: {
  group: GroupKey;
  onPick: (name: string) => void;
  label: string;
}) {
  const { t, lang } = useI18n();
  const cats = categoriesFor(group, lang);
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState("");

  const otherLabel = cats[cats.length - 1];

  const pick = (name: string) => {
    onPick(name);
    setOpen(false);
    setShowCustom(false);
    setCustom("");
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setShowCustom(false); setCustom(""); } }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs text-sage-500 hover:text-wine px-2 py-2 italic transition-colors"
        >
          <Plus className="size-3.5" /> {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <p className="text-[10px] uppercase tracking-widest text-wine font-semibold mb-2">
          {t.categoryPicker.chooseCategory}
        </p>
        {!showCustom ? (
          <ul className="space-y-1 max-h-72 overflow-y-auto">
            {cats.map((c) => {
              const isOther = c === otherLabel;
              return (
                <li key={c}>
                  <button
                    onClick={() => (isOther ? setShowCustom(true) : pick(c))}
                    className="w-full text-left text-sm px-3 py-2 rounded-xl hover:bg-sage-50 text-sage-800 transition-colors"
                  >
                    {c}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-sage-500">
              {t.categoryPicker.customLabel}
            </label>
            <input
              autoFocus
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder={t.categoryPicker.customPlaceholder}
              onKeyDown={(e) => { if (e.key === "Enter" && custom.trim()) pick(custom.trim()); }}
              className="w-full bg-sage-50 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sage-200"
            />
            <button
              onClick={() => { if (custom.trim()) pick(custom.trim()); }}
              className="w-full bg-wine text-white text-sm py-2 rounded-full hover:opacity-90 transition"
            >
              {t.categoryPicker.confirm}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}