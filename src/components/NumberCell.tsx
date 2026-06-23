import { forwardRef, useEffect, useState } from "react";

/** Spreadsheet-style numeric input. Editable, currency-formatted on blur. */
type NumberCellProps = {
  value: number;
  onChange: (n: number) => void;
  className?: string;
  tone?: "default" | "realidad";
  ariaLabel?: string;
};

export const NumberCell = forwardRef<HTMLInputElement, NumberCellProps>(function NumberCell(
  { value, onChange, className = "", tone = "default", ariaLabel },
  ref,
) {
  const [draft, setDraft] = useState(value === 0 ? "" : value.toString());
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(value === 0 ? "" : value.toString());
  }, [value, focused]);

  return (
    <input
      ref={ref}
      inputMode="decimal"
      value={focused ? draft : value === 0 ? "" : value.toFixed(2)}
      aria-label={ariaLabel}
      onFocus={(e) => {
        setFocused(true);
        setDraft(value === 0 ? "" : value.toString());
        e.target.select();
      }}
      onChange={(e) => {
        const v = e.target.value.replace(/[^0-9.,-]/g, "").replace(",", ".");
        setDraft(v);
        const n = parseFloat(v);
        if (!isNaN(n)) onChange(n);
        else if (v === "" || v === "-") onChange(0);
      }}
      onBlur={() => setFocused(false)}
      placeholder="0.00"
      className={`w-full text-right text-sm font-medium rounded-md px-2 py-1.5 outline-none focus:ring-2 focus:ring-sage-300 transition-all ${
        tone === "realidad"
          ? "cell-realidad text-sage-900 placeholder:text-clay/40"
          : "bg-transparent text-sage-900 hover:bg-sage-50 focus:bg-white border border-transparent focus:border-sage-200"
      } min-w-[6.5rem] sm:min-w-[8rem] tabular-nums ${className}`}
    />
  );
});