import { createFileRoute } from "@tanstack/react-router";
import { ReportsView } from "@/views/ReportsView";

export const Route = createFileRoute("/_authenticated/reportes")({
  head: () => ({
    meta: [
      { title: "Reportes · Finanzas en Calma" },
      { name: "description", content: "Descarga reportes detallados de tu presupuesto, deudas y fondos." },
    ],
  }),
  component: ReportsView,
});