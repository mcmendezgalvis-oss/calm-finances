import { useMemo, useState } from "react";
import { Shield as ShieldIcon, ArrowUp, ArrowDown, ChevronDown, Pencil, Check, X, RotateCcw } from "lucide-react";
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
  const override = useApp((s) => s.emergencyLevelsOverride) ?? {};
  const setEmergencyLevelOverride = useApp((s) => s.setEmergencyLevelOverride);

  const fund = shields.find((s) => s.id === EMERGENCY_FUND_ID);

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [showHistory, setShowHistory] = useState(false);

  const month = months[currentMonthKey()] ?? { monthKey: currentMonthKey(), lines: [] };
  const muros = muros4Total(month);
  const baseLevels = useMemo(() => emergencyLevels(muros), [muros]);
  const levels = useMemo(
    () => ({
      ...baseLevels,
      l1: override.l1 ?? baseLevels.l1,
      l2Max: override.l2 ?? baseLevels.l2Max,
      l3Max: override.l3 ?? baseLevels.l3Max,
    }),
    [baseLevels, override.l1, override.l2, override.l3],
  );
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

  const MilestoneChip = ({
    label,
    target,
    levelIdx,
    overrideKey,
    isOverridden,
  }: {
    label: string;
    target: number;
    levelIdx: 1 | 2 | 3;
    overrideKey: "l1" | "l2" | "l3";
    isOverridden: boolean;
  }) => {
    const done = reached >= levelIdx;
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(target > 0 ? String(target) : "");
    const commit = () => {
      const n = parseFloat(value);
      if (!isNaN(n) && n >= 0) setEmergencyLevelOverride(overrideKey, n);
      setEditing(false);
    };
    return (
      <div
        className={`group relative flex-1 min-w-[8rem] rounded-2xl border px-3 py-2 ${
          done ? "bg-sage-100 border-sage-300" : "bg-white border-sage-200"
        }`}
      >
        <p className={`text-[10px] uppercase tracking-widest font-semibold ${done ? "text-sage-700" : "text-sage-400"}`}>
          {label}
        </p>
        {editing ? (
          <div className="mt-0.5 flex items-center gap-1">
            <input
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setEditing(false);
              }}
              autoFocus
              className="w-full text-sm bg-white rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-sage-200 tabular-nums"
            />
            <button onClick={commit} className="text-sage-700 hover:text-sage-900 p-1" aria-label="OK">
              <Check className="size-3.5" />
            </button>
            <button onClick={() => setEditing(false)} className="text-sage-400 hover:text-clay p-1" aria-label="Cancelar">
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="mt-0.5 flex items-center gap-1">
            <button
              onClick={() => {
                setValue(target > 0 ? String(target) : "");
                setEditing(true);
              }}
              className={`text-sm font-medium tabular-nums text-left flex-1 hover:text-wine ${done ? "text-sage-900" : "text-sage-500"}`}
              title="Editar"
            >
              {target > 0 ? fmt(target, currency) : "—"}
            </button>
            <button
              onClick={() => {
                setValue(target > 0 ? String(target) : "");
                setEditing(true);
              }}
              className="opacity-0 group-hover:opacity-100 text-sage-400 hover:text-wine p-0.5"
              aria-label="Editar"
            >
              <Pencil className="size-3" />
            </button>
            {isOverridden && (
              <button
                onClick={() => setEmergencyLevelOverride(overrideKey, null)}
                className="opacity-0 group-hover:opacity-100 text-sage-400 hover:text-wine p-0.5"
                aria-label="Restablecer"
                title="Restablecer al valor por defecto"
              >
                <RotateCcw className="size-3" />
              </button>
            )}
          </div>
        )}
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
        <MilestoneChip label={t.emergency.level1} target={levels.l1} levelIdx={1} overrideKey="l1" isOverridden={override.l1 != null} />
        <MilestoneChip label={t.emergency.level2} target={levels.l2Max} levelIdx={2} overrideKey="l2" isOverridden={override.l2 != null} />
        <MilestoneChip label={t.emergency.level3} target={levels.l3Max} levelIdx={3} overrideKey="l3" isOverridden={override.l3 != null} />
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