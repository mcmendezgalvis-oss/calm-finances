import { useState } from "react";
import { Sprout, Shield as ShieldIcon, ArrowRight, X } from "lucide-react";
import { useApp, type SurplusAllocation } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import { fmt, EMERGENCY_FUND_ID } from "@/lib/finance";

export function CloseMonthDialog({
  monthKey,
  balance,
  onClose,
  onClosed,
}: {
  monthKey: string;
  balance: number;
  onClose: () => void;
  onClosed: () => void;
}) {
  const { t } = useI18n();
  const currency = useApp((s) => s.profile.currency);
  const debts = useApp((s) => s.debts).filter((d) => !d.paid);
  const shields = useApp((s) => s.shields).filter((s) => !s.archived);
  const closeMonth = useApp((s) => s.closeMonth);

  const [choice, setChoice] = useState<"debt" | "shield" | "carry" | null>(null);
  const [targetId, setTargetId] = useState<string>(() => debts[0]?.id ?? shields.find((s) => s.id === EMERGENCY_FUND_ID)?.id ?? shields[0]?.id ?? "");
  const [amount, setAmount] = useState(balance.toFixed(2));

  const negative = balance < -0.005;
  const positive = balance > 0.005;

  const submit = () => {
    let allocation: SurplusAllocation = { type: "none" };
    if (positive) {
      const amt = Math.min(balance, parseFloat(amount) || 0);
      if (choice === "debt" && targetId) allocation = { type: "debt", debtId: targetId, amount: amt };
      else if (choice === "shield" && targetId) allocation = { type: "shield", shieldId: targetId, amount: amt };
      else if (choice === "carry") allocation = { type: "carry", amount: amt };
    }
    const res = closeMonth(monthKey, allocation);
    if (res.ok) onClosed();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-sage-900/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-serif text-2xl text-wine">
            {negative ? "⚠️ " : positive ? "🌸 " : "🌿 "}
            {negative
              ? t.closeMonth.confirmClose
              : positive
              ? t.closeMonth.positiveTitle
              : t.closeMonth.zeroTitle}
          </h3>
          <button onClick={onClose} className="text-sage-400 hover:text-sage-700 p-1">
            <X className="size-4" />
          </button>
        </div>

        {negative && (
          <>
            <p className="text-sm text-clay mb-4 leading-relaxed">{t.closeMonth.blockedNegative}</p>
            <p className="text-xs text-sage-500 mb-4">Balance: {fmt(balance, currency)}</p>
            <button onClick={onClose} className="w-full bg-sage-100 text-sage-700 py-2.5 rounded-full font-medium">
              {t.shields.cancel}
            </button>
          </>
        )}

        {!negative && !positive && (
          <>
            <p className="text-sm text-sage-600 mb-4">{t.closeMonth.zeroCopy}</p>
            <button onClick={submit} className="w-full bg-wine text-white py-2.5 rounded-full font-medium">
              {t.closeMonth.confirmClose}
            </button>
          </>
        )}

        {positive && (
          <>
            <p className="text-sm text-sage-600 mb-1">{t.closeMonth.positiveCopy}</p>
            <p className="text-2xl font-serif text-sage-900 mb-4 tabular-nums">{fmt(balance, currency)}</p>

            <div className="space-y-2 mb-4">
              {debts.length > 0 && (
                <button
                  onClick={() => { setChoice("debt"); setTargetId(debts[0].id); }}
                  className={`w-full text-left px-4 py-3 rounded-2xl border flex items-center gap-3 transition ${choice === "debt" ? "border-wine bg-wine-50" : "border-sage-200 hover:bg-sage-50"}`}
                >
                  <Sprout className="size-4 text-wine" />
                  <span className="text-sm text-sage-800">{t.closeMonth.optDebt}</span>
                </button>
              )}
              {shields.length > 0 && (
                <button
                  onClick={() => { setChoice("shield"); setTargetId(shields[0].id); }}
                  className={`w-full text-left px-4 py-3 rounded-2xl border flex items-center gap-3 transition ${choice === "shield" ? "border-wine bg-wine-50" : "border-sage-200 hover:bg-sage-50"}`}
                >
                  <ShieldIcon className="size-4 text-wine" />
                  <span className="text-sm text-sage-800">{t.closeMonth.optShield}</span>
                </button>
              )}
              <button
                onClick={() => setChoice("carry")}
                className={`w-full text-left px-4 py-3 rounded-2xl border flex items-center gap-3 transition ${choice === "carry" ? "border-wine bg-wine-50" : "border-sage-200 hover:bg-sage-50"}`}
              >
                <ArrowRight className="size-4 text-wine" />
                <span className="text-sm text-sage-800">{t.closeMonth.optCarry}</span>
              </button>
            </div>

            {(choice === "debt" || choice === "shield") && (
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-sage-50 rounded-xl px-3 py-2 mb-3 outline-none text-sm"
              >
                {(choice === "debt" ? debts : shields).map((x) => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </select>
            )}

            {choice && (
              <div className="flex gap-2">
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 bg-sage-50 rounded-xl px-3 py-2 outline-none text-sm tabular-nums"
                />
                <button onClick={submit} className="bg-wine text-white px-5 py-2 rounded-full font-medium text-sm">
                  {t.closeMonth.confirmClose}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}