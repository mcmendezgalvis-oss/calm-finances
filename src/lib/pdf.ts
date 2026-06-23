import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AppState, MonthBudget } from "@/store/types";
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