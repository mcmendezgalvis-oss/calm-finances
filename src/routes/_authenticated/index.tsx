import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/views/Dashboard";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Finanzas en Calma" },
      { name: "description", content: "Tu dashboard de paz: presupuesto, escudos y bola de nieve, en un solo lugar." },
      { property: "og:title", content: "Dashboard · Finanzas en Calma" },
    ],
  }),
  component: Dashboard,
});
