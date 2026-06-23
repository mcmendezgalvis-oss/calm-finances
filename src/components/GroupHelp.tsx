import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useI18n } from "@/i18n/I18nProvider";
import type { GroupKey } from "@/store/types";

export function GroupHelp({ group }: { group: GroupKey }) {
  const { t } = useI18n();
  const text = t.groupHelp[group];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Ayuda"
          className="text-sage-400 hover:text-wine transition-colors p-0.5"
        >
          <HelpCircle className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-w-xs text-xs text-sage-700 leading-relaxed" align="start">
        {text}
      </PopoverContent>
    </Popover>
  );
}