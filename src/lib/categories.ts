import type { GroupKey } from "@/store/types";

type Catalog = Record<GroupKey, { es: string[]; en: string[] }>;

// Last entry should always be the "Other" sentinel (handled in UI).
export const CATEGORIES: Catalog = {
  income: {
    es: ["Salario", "Freelance", "Bonos", "Inversiones", "Otros"],
    en: ["Salary", "Freelance", "Bonuses", "Investments", "Other"],
  },
  muros: {
    es: ["Vivienda / Renta", "Hipoteca", "Servicios", "Internet / Teléfono", "Comida", "Transporte esencial", "Otros"],
    en: ["Housing / Rent", "Mortgage", "Utilities", "Internet / Phone", "Groceries", "Essential transport", "Other"],
  },
  debts: {
    es: ["Tarjeta de crédito", "Préstamo personal", "Auto", "Estudios", "Otros"],
    en: ["Credit card", "Personal loan", "Car", "Student", "Other"],
  },
  generosity: {
    es: ["Diezmo", "Ofrenda", "Donaciones", "Regalos", "Otros"],
    en: ["Tithe", "Offering", "Donations", "Gifts", "Other"],
  },
  lifestyle: {
    es: ["Restaurantes", "Entretenimiento", "Ropa", "Suscripciones", "Cuidado personal", "Hobbies", "Otros"],
    en: ["Dining out", "Entertainment", "Clothing", "Subscriptions", "Self-care", "Hobbies", "Other"],
  },
  future: {
    es: ["Retiro", "Inversiones", "Metas de ahorro", "Educación", "Otros"],
    en: ["Retirement", "Investments", "Savings goals", "Education", "Other"],
  },
};

export function categoriesFor(group: GroupKey, lang: "es" | "en"): string[] {
  return CATEGORIES[group][lang];
}