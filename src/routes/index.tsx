import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/pages/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mi Calma · Finanzas en Calma" },
      { name: "description", content: "Tu dashboard de paz: presupuesto, escudos y bola de nieve, en un solo lugar." },
      { property: "og:title", content: "Mi Calma · Finanzas en Calma" },
    ],
  }),
  component: Dashboard,
});
