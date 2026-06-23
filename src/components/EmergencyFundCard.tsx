import { useMemo, useState } from "react";
import { Shield as ShieldIcon, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useApp, currentMonthKey } from "@/store/useApp";
import { useI18n } from "@/i18n/I18nProvider";
import { fmt, muros4Total, emergencyLevels, emergencyLevelReached, EMERGENCY_FUND_ID } from "@/lib/finance";
import { celebrateTrophy } from "@/lib/trophies";
import { InlineDatePicker } from "./InlineDatePicker";

export function EmergencyFundCard() {
  const { t, lang } = useI18n();
  const currency = useApp((s) => s.profile.currency);
  const shields = useApp((s) => s.shields);
  const months = useApp((s) => s.months);
  const shieldDeposit = useApp((s) => s.shieldDeposit);
  const shieldWithdraw = useApp((s) => s.shieldWithdraw);
  const trophies = useApp((s) => s.trophies);

  const fund = shields.find((s) => s.id === EMERGENCY_FUND_ID);

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [showHistory, setShowHistory] = useState(false);

  const month = months[currentMonthKey()] ?? { monthKey: currentMonthKey(), lines: [] };
  const muros = muros4Total(month);
  const levels = useMemo(() => emergencyLevels(muros), [muros]);
  const balance = fund?.balance ?? 0;
  const reached = emergencyLevelReached(balance, levels);

  // Target for the active level's bar
  const nextTarget =
    reached === 0 ? levels.l1 :
    reached === 1 ? Math.max(levels.l2Max, levels.l1 + 1) :
    reached === 2 ? Math.max(levels.l3Max, levels.l2Max + 1) :
    levels.l3Max;
  const pct = nextTarget > 0 ? Math.min(1, balance / nextTarget) : 0;

  if (!fund) return null;

  const handleDeposit = () => {
    const n = parseFloat(amount);
    if (!(n > 0)) return;
    const beforeIds = new Set(trophies.map((tr) => tr.id));
    shieldDeposit(fund.id, n, undefined, date.toISOString());
    setAmount("");
    toast.success(`+ ${fmt(n, currency)}`);
    // detect newly added trophies
    setTimeout(() => {
      const after = useApp.getState().trophies;
      const fresh = after.filter((tr) => !beforeIds.has(tr.id));
      fresh.forEach((tr) => celebrateTrophy(tr, lang));
    }, 0);
  };

  const handleWithdraw = () => {
    const n = parseFloat(amount);
    if (!(n > 0)) return;
    if (n > balance) return toast.error("Insuficiente");
    shieldWithdraw(fund.id, n, undefined, date.toISOString());
    setAmount("");
    toast(`− ${fmt(n, currency)}`);
  };

  const milestoneChip = (label: string, target: number, levelIdx: 1 | 2 | 3) => {
    const done = reached >= levelIdx;
    return (
      <div
        key={label}
        className={`flex-1 min-w-[8rem] rounded-2xl border px-3 py-2 ${
          done ? "bg-sage-100 border-sage-300" : "bg-white border-sage-200"
        }`}
      >
        <p className={`text-[10px] uppercase tracking-widest font-semibold ${done ? "text-sage-700" : "text-sage-400"}`}>
          {label}
        </p>
        <p className={`text-sm font-medium tabular-nums mt-0.5 ${done ? "text-sage-900" : "text-sage-500"}`}>
          {target > 0 ? fmt(target, currency) : "—"}
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white border border-wine-100 rounded-3xl p-6 shadow-sm md:col-span-2">
      <div className="flex items-start gap-3 mb-2">
        <div className="size-10 rounded-2xl bg-wine-50 grid place-items-center text-wine shrink-0">
          <ShieldIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-2xl text-wine">{t.emergency.title}</p>
          <p className="text-xs text-sage-600 italic mt-1 leading-relaxed">{t.emergency.intro}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] uppercase tracking-widest text-sage-400">{t.shields.saved}</p>
          <p className="font-serif text-2xl text-sage-900 tabular-nums">{fmt(balance, currency)}</p>
        </div>
      </div>

      <div className="mt-4 h-2 bg-sage-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-wine to-sage-600 transition-all"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <p className="text-[11px] text-sage-500 mt-1 italic">
        {t.emergency.progressTo} {fmt(nextTarget, currency)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {milestoneChip(t.emergency.level1, levels.l1, 1)}
        {milestoneChip(t.emergency.level2, levels.l2Max, 2)}
        {milestoneChip(t.emergency.level3, levels.l3Max, 3)}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <input
          inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="flex-1 min-w-[8rem] text-sm bg-sage-50 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-sage-200 tabular-nums"
        />
        <InlineDatePicker date={date} onChange={setDate} />
        <button
          onClick={handleDeposit}
          className="bg-wine text-white text-xs font-medium px-3 py-2 rounded-full hover:opacity-90 transition inline-flex items-center gap-1"
        >
          <ArrowUp className="size-3.5" /> {t.shields.addFunds}
        </button>
        <button
          onClick={handleWithdraw}
          className="bg-blush-100 text-clay text-xs font-medium px-3 py-2 rounded-full hover:bg-blush-200 transition inline-flex items-center gap-1"
        >
          <ArrowDown className="size-3.5" /> {t.shields.withdraw}
        </button>
      </div>

      {fund.history.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="text-[10px] uppercase tracking-widest text-sage-400 hover:text-wine inline-flex items-center gap-1"
          >
            {t.shields.historyTitle}
            <ChevronDown className={`size-3 transition-transform ${showHistory ? "rotate-180" : ""}`} />
          </button>
          {showHistory && (
            <ul className="mt-2 space-y-1 text-xs">
              {fund.history.slice().reverse().slice(0, 12).map((h) => (
                <li key={h.id} className="flex justify-between text-sage-500">
                  <span>{new Date(h.date).toLocaleDateString()}</span>
                  <span className={h.type === "deposit" ? "text-sage-700" : "text-clay"}>
                    {h.type === "deposit" ? "+" : "−"}{fmt(Math.abs(h.amount), currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}