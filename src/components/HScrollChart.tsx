import { ReactNode } from "react";

/**
 * Mobile-first horizontal scroll wrapper for charts.
 * Set minWidth to ensure all data points are visible even on narrow viewports.
 */
export function HScrollChart({
  minWidth,
  height,
  children,
}: {
  minWidth: number;
  height: number;
  children: ReactNode;
}) {
  return (
    <div
      className="overflow-x-auto overscroll-x-contain snap-x snap-mandatory [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-sage-200 [&::-webkit-scrollbar-thumb]:rounded-full"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div style={{ minWidth, height }} className="snap-start">
        {children}
      </div>
    </div>
  );
}