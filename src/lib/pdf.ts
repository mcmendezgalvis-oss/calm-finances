import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AppState } from "@/store/types";
import { GROUP_ORDER, groupTotals } from "./finance";

const GROUP_LABELS: Record<string, string> = {
  income: "Ingresos",
  muros: "Los 4 Muros",
  debts: "Pago de Deudas",
  generosity: "Generosidad",
  lifestyle: "Estilo de Vida",
  future: "Inversión y Futuro",
};

function fmt(n: number, currency = "USD") {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n); }
  catch { return `$${n.toFixed(2)}`; }
}

export function generateMonthReport(state: AppState, monthKey: string) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const currency = state.profile.currency;
  const month = state.months[monthKey] ?? { monthKey, lines: [] };
  const [y, m] = monthKey.split("-").map(Number);
  const monthName = new Date(y, m - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(45, 58, 45);
  doc.setFontSize(24);
  doc.text("Finanzas en Calma", 40, 60);
  doc.setFontSize(12);
  doc.setTextColor(107, 142, 107);
  doc.text(`Reporte de ${monthName}`, 40, 80);

  // Budget summary table
  const totals = groupTotals(month.lines);
  const rows: (string | number)[][] = [];
  for (const g of GROUP_ORDER) {
    rows.push([
      { content: GROUP_LABELS[g], styles: { fontStyle: "bold", textColor: [45, 58, 45], fillColor: [232, 240, 232] } } as never,
      "",
      "",
      "",
    ]);
    const groupLines = month.lines.filter((l) => l.group === g);
    for (const l of groupLines) {
      const diff = l.planned - l.real;
      rows.push([
        `  ${l.name || "—"}`,
        fmt(l.planned, currency),
        fmt(l.real, currency),
        (diff >= 0 ? "+" : "") + fmt(diff, currency),
      ]);
    }
    rows.push([
      "  Subtotal",
      fmt(totals[g].planned, currency),
      fmt(totals[g].real, currency),
      "",
    ]);
  }

  autoTable(doc, {
    startY: 110,
    head: [["Categoría", "Plan", "Real", "Diferencia"]],
    body: rows,
    styles: { font: "helvetica", fontSize: 9, textColor: [60, 60, 60] },
    headStyles: { fillColor: [45, 58, 45], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 250, 248] },
    margin: { left: 40, right: 40 },
  });

  // Snowball
  const debts = state.debts;
  const cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 30;
  doc.setFontSize(16);
  doc.setTextColor(45, 58, 45);
  doc.text("Adiós a las Cadenas", 40, cursorY);
  autoTable(doc, {
    startY: cursorY + 10,
    head: [["Deuda", "Inicial", "Actual", "Mínimo", "Estado"]],
    body: debts.map((d) => [
      d.name,
      fmt(d.initialBalance, currency),
      fmt(d.currentBalance, currency),
      fmt(d.minimumPayment, currency),
      d.paid ? "Pagada" : "Activa",
    ]),
    styles: { font: "helvetica", fontSize: 9 },
    headStyles: { fillColor: [196, 138, 122], textColor: 255 },
    margin: { left: 40, right: 40 },
  });

  // Shields
  const cy2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 30;
  doc.setFontSize(16);
  doc.text("Mis Escudos", 40, cy2);
  autoTable(doc, {
    startY: cy2 + 10,
    head: [["Escudo", "Meta", "Ahorrado", "% Avance"]],
    body: state.shields.map((s) => [
      s.name,
      fmt(s.goal, currency),
      fmt(s.balance, currency),
      s.goal > 0 ? `${Math.round((s.balance / s.goal) * 100)}%` : "—",
    ]),
    styles: { font: "helvetica", fontSize: 9 },
    headStyles: { fillColor: [107, 142, 107], textColor: 255 },
    margin: { left: 40, right: 40 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(140, 115, 109);
    doc.text(
      "La tranquilidad financiera se construye paso a paso.",
      pageW / 2,
      doc.internal.pageSize.getHeight() - 30,
      { align: "center" },
    );
  }

  doc.save(`Finanzas-en-Calma-${monthKey}.pdf`);
}

export function generateYearReport(state: AppState, year: number) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const currency = state.profile.currency;
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(24);
  doc.setTextColor(45, 58, 45);
  doc.text("Finanzas en Calma", 40, 60);
  doc.setFontSize(12);
  doc.setTextColor(107, 142, 107);
  doc.text(`Resumen del año ${year}`, 40, 80);

  const rows: (string | number)[][] = [];
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, "0")}`;
    const month = state.months[key];
    if (!month) continue;
    const t = groupTotals(month.lines);
    const income = t.income.real || t.income.planned;
    const spent = (["muros","debts","generosity","lifestyle","future"] as const)
      .reduce((s, g) => s + (t[g].real || 0), 0);
    rows.push([
      new Date(year, m - 1, 1).toLocaleDateString("es-ES", { month: "long" }),
      fmt(income, currency),
      fmt(spent, currency),
      fmt(income - spent, currency),
    ]);
  }

  autoTable(doc, {
    startY: 110,
    head: [["Mes", "Ingresos", "Gastos", "Diferencia"]],
    body: rows,
    styles: { font: "helvetica", fontSize: 10 },
    headStyles: { fillColor: [45, 58, 45], textColor: 255 },
    margin: { left: 40, right: 40 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(140, 115, 109);
    doc.text(
      "La tranquilidad financiera se construye paso a paso.",
      pageW / 2,
      doc.internal.pageSize.getHeight() - 30,
      { align: "center" },
    );
  }

  doc.save(`Finanzas-en-Calma-${year}.pdf`);
}

function header(doc: jsPDF, title: string, subtitle: string) {
  doc.setFont("helvetica", "normal");
  doc.setTextColor(114, 47, 55); // wine
  doc.setFontSize(22);
  doc.text("Finanzas en Calma", 40, 60);
  doc.setFontSize(14);
  doc.setTextColor(45, 58, 45);
  doc.text(title, 40, 84);
  doc.setFontSize(10);
  doc.setTextColor(140, 115, 109);
  doc.text(subtitle, 40, 100);
}

function footer(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(140, 115, 109);
    doc.text("La tranquilidad financiera se construye paso a paso.", pageW / 2, doc.internal.pageSize.getHeight() - 30, { align: "center" });
  }
}

function monthsInRange(from: Date, to: Date): string[] {
  const out: string[] = [];
  const d = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (d <= end) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

export function generateBudgetVsRealReport(state: AppState, from: Date, to: Date, label: string) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const currency = state.profile.currency;
  header(doc, "Presupuesto vs Real", label);

  const keys = monthsInRange(from, to);
  const currKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const rows: (string | number)[][] = [];
  let totPlanned = 0, totReal = 0, totDiff = 0;
  for (const key of keys) {
    const m = state.months[key];
    const isFuture = key > currKey;
    const monthLabel = isFuture ? `${key} (proyección)` : key;
    if (!m) {
      if (isFuture) rows.push([monthLabel, "—", fmt(0, currency), fmt(0, currency), fmt(0, currency)]);
      continue;
    }
    const t = groupTotals(m.lines);
    for (const g of GROUP_ORDER) {
      const realVal = isFuture ? 0 : t[g].real;
      const diff = g === "income" ? realVal - t[g].planned : t[g].planned - realVal;
      rows.push([monthLabel, g, fmt(t[g].planned, currency), fmt(realVal, currency), (diff >= 0 ? "+" : "") + fmt(diff, currency)]);
      totPlanned += t[g].planned; totReal += realVal; totDiff += diff;
    }
  }
  if (rows.length === 0) rows.push(["—", "Sin datos", "", "", ""]);
  else rows.push([
    { content: "TOTAL", styles: { fontStyle: "bold", fillColor: [232, 240, 232], textColor: [114, 47, 55] } } as never,
    { content: "", styles: { fillColor: [232, 240, 232] } } as never,
    { content: fmt(totPlanned, currency), styles: { fontStyle: "bold", fillColor: [232, 240, 232], textColor: [114, 47, 55] } } as never,
    { content: fmt(totReal, currency), styles: { fontStyle: "bold", fillColor: [232, 240, 232], textColor: [114, 47, 55] } } as never,
    { content: (totDiff >= 0 ? "+" : "") + fmt(totDiff, currency), styles: { fontStyle: "bold", fillColor: [232, 240, 232], textColor: [114, 47, 55] } } as never,
  ]);
  autoTable(doc, {
    startY: 120,
    head: [["Mes", "Rubro", "Plan", "Real", "Diferencia"]],
    body: rows,
    styles: { font: "helvetica", fontSize: 9 },
    headStyles: { fillColor: [114, 47, 55], textColor: 255 },
    margin: { left: 40, right: 40 },
  });
  footer(doc);
  doc.save(`Presupuesto-vs-Real-${Date.now()}.pdf`);
}

export function generateDebtDetailReport(state: AppState, debtId: string, from: Date, to: Date, label: string) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const currency = state.profile.currency;
  const debt = state.debts.find((d) => d.id === debtId);
  if (!debt) return;
  header(doc, `Deuda: ${debt.name}`, label);

  doc.setFontSize(10);
  doc.setTextColor(45, 58, 45);
  doc.text(`Saldo inicial: ${fmt(debt.initialBalance, currency)}    Saldo actual: ${fmt(debt.currentBalance, currency)}    Mínimo: ${fmt(debt.minimumPayment, currency)}`, 40, 120);

  const tFrom = from.getTime();
  const tTo = to.getTime() + 86400_000;
  type Mv = { ts: number; date: string; type: string; signed: number; note: string };
  const mvs: Mv[] = [];
  for (const a of debt.adjustments) {
    const ts = new Date(a.date).getTime();
    mvs.push({ ts, date: new Date(a.date).toLocaleDateString(), type: a.delta < 0 ? "Pago / abono" : "Ajuste banco", signed: a.delta, note: a.note ?? "" });
  }
  for (const [k, mo] of Object.entries(state.months)) {
    for (const l of mo.lines) {
      if (l.linkedDebtId !== debtId) continue;
      const real = l.real || 0;
      if (real <= 0) continue;
      const [y, mm] = k.split("-").map(Number);
      const d = new Date(y, mm, 0);
      mvs.push({ ts: d.getTime(), date: d.toLocaleDateString(), type: "Abono desde presupuesto", signed: -real, note: `Mes ${k}` });
    }
  }
  const filtered = mvs.filter((m) => m.ts >= tFrom && m.ts <= tTo).sort((a, b) => a.ts - b.ts);
  const rows: (string | number | Record<string, unknown>)[][] = filtered.map((m) => [m.date, m.type, (m.signed >= 0 ? "+" : "") + fmt(m.signed, currency), m.note]);
  const totalDelta = filtered.reduce((s, m) => s + m.signed, 0);
  if (rows.length === 0) rows.push(["—", "Sin movimientos", "", ""]);
  else rows.push([
    { content: "TOTAL", styles: { fontStyle: "bold", fillColor: [232, 240, 232], textColor: [114, 47, 55] } } as never,
    { content: "", styles: { fillColor: [232, 240, 232] } } as never,
    { content: (totalDelta >= 0 ? "+" : "") + fmt(totalDelta, currency), styles: { fontStyle: "bold", fillColor: [232, 240, 232], textColor: [114, 47, 55] } } as never,
    { content: "", styles: { fillColor: [232, 240, 232] } } as never,
  ]);
  autoTable(doc, {
    startY: 140,
    head: [["Fecha", "Tipo", "Monto", "Nota"]],
    body: rows,
    styles: { font: "helvetica", fontSize: 9 },
    headStyles: { fillColor: [114, 47, 55], textColor: 255 },
    margin: { left: 40, right: 40 },
  });
  footer(doc);
  doc.save(`Deuda-${debt.name}-${Date.now()}.pdf`);
}

export function generateShieldMovementsReport(state: AppState, shieldId: string, from: Date, to: Date, label: string) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const currency = state.profile.currency;
  const shield = state.shields.find((s) => s.id === shieldId);
  if (!shield) return;
  header(doc, `Escudo: ${shield.name}`, label);

  doc.setFontSize(10);
  doc.setTextColor(45, 58, 45);
  doc.text(`Meta: ${fmt(shield.goal, currency)}    Saldo actual: ${fmt(shield.balance, currency)}`, 40, 120);

  const tFrom = from.getTime();
  const tTo = to.getTime() + 86400_000;
  const rows = shield.history
    .filter((h) => { const ts = new Date(h.date).getTime(); return ts >= tFrom && ts <= tTo; })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((h) => [
      new Date(h.date).toLocaleDateString(),
      h.type === "deposit" ? "Aporte" : "Retiro",
      (h.type === "deposit" ? "+" : "−") + fmt(h.amount, currency),
      h.note ?? "",
    ]);
  const totalNet = shield.history
    .filter((h) => { const ts = new Date(h.date).getTime(); return ts >= tFrom && ts <= tTo; })
    .reduce((s, h) => s + (h.type === "deposit" ? h.amount : -h.amount), 0);
  if (rows.length === 0) rows.push(["—", "Sin movimientos", "", ""]);
  else rows.push([
    { content: "TOTAL", styles: { fontStyle: "bold", fillColor: [232, 240, 232], textColor: [114, 47, 55] } } as never,
    { content: "", styles: { fillColor: [232, 240, 232] } } as never,
    { content: (totalNet >= 0 ? "+" : "−") + fmt(Math.abs(totalNet), currency), styles: { fontStyle: "bold", fillColor: [232, 240, 232], textColor: [114, 47, 55] } } as never,
    { content: "", styles: { fillColor: [232, 240, 232] } } as never,
  ]);
  autoTable(doc, {
    startY: 140,
    head: [["Fecha", "Tipo", "Monto", "Nota"]],
    body: rows,
    styles: { font: "helvetica", fontSize: 9 },
    headStyles: { fillColor: [107, 142, 107], textColor: 255 },
    margin: { left: 40, right: 40 },
  });
  footer(doc);
  doc.save(`Fondo-${shield.name}-${Date.now()}.pdf`);
}