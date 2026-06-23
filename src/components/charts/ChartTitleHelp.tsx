import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ChartTitleHelp({ title, help }: { title: string; help: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-wine">{title}</h2>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Ayuda"
              className="text-sage-400 hover:text-wine transition-colors cursor-help"
            >
              <Info className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
            {help}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}