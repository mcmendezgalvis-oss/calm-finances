
# Plan de actualización · Finanzas en Calma

Refinamiento integral sobre el MVP actual. Mantiene el sistema de diseño (salvia + arcilla + serif) y añade el acento vino como color de jerarquía para títulos de rubros. Toda la lógica sigue en `localStorage` (Zustand), sin backend.

---

## 1. Estética femenina minimalista

- Token `--wine: #722F37` (+ derivados 50/100) en `src/styles.css` `@theme`.
- `text-wine` en títulos de rubro y encabezados de sección (4 Muros, Deudas, Generosidad, Estilo de vida, Futuro, Ingresos; tarjetas de Escudos, Deudas, Dashboard, Reportes).
- Iconografía lucide fina: Ingresos `Sparkles`, 4 Muros `Home`, Deudas `Link2Off`, Generosidad `HandHeart`, Estilo de vida `Flower2`, Futuro `Sprout`; Escudos `Shield`, Reportes `FileText`.
- Móvil: `NumberCell` más ancho (min 9rem, `text-base`, `tabular-nums`); fila del presupuesto con cifra en una segunda línea bajo el nombre en <640px para evitar truncado.

## 2. Lógica Plan vs Realidad

- Helper `lineDiff(line)` en `src/lib/finance.ts`:
  - **Ingresos**: `real − planned` (negativo = faltó ingreso → rojo/vino).
  - **Gastos**: `planned − real` (positivo = ahorré → salvia).
- Aplicado en pestaña Mi Calma y totales por grupo.

## 3. Dashboard

- Selector global de periodo: `Mes actual` / `Todo el año`.
- **Destino de Ingresos** (dona): 5 grupos de gasto + ahorrado, leyenda con % y monto.
- **Evolución mensual**: barras Plan vs Real, color según desviación.
- **Derrumbe de deudas**: barras horizontales ascendentes con etiqueta `D1=$5,000`; pill `SALDADA` al llegar a 0 y reordenamiento automático.
- **Escudos**: barras verticales por mes con leyenda de color por escudo.
- Scroll horizontal `snap-x` de 12 meses cuando el modo es "Todo el año".

## 4. Escudos y Deudas

- Historial desplegable (`HistoryTable` compartido) por escudo y deuda.
- Edición inline siempre disponible de `initialBalance`, `currentBalance`, `minimumPayment`.
- Aportes/pagos con selector de día/mes/año (datepicker shadcn con `pointer-events-auto`), default = hoy.
- Trazabilidad: `totalPaid(debtId)` = Σ ajustes negativos (capital + intereses).
- Desde el presupuesto NO se crean entidades (ver punto 7).

## 5. Sección Reportes (`/reportes`)

- Nueva ruta + vista, entrada en `AppShell`.
- Tipos: `Presupuesto vs Real`, `Detalle por Deuda`, `Movimientos por Fondo`.
- Periodo: meses individuales (multi-select), año completo, o rango custom.
- Selector de entidad para reportes de deuda/fondo.
- Descarga PDF (ampliar `src/lib/pdf.ts` con tres builders).
- Protegido por `PremiumGate`.

## 6. Usabilidad móvil del rango custom (NUEVO)

- `PeriodSelector` con tres modos (meses / año / custom). En modo custom:
  - Dos campos `Desde` / `Hasta` apilados verticalmente en mobile, lado a lado ≥640px.
  - Botón grande (`h-12`, área táctil ≥44px) que abre un `Popover` con `Calendar` shadcn, `pointer-events-auto`, `numberOfMonths={1}` en mobile y `{2}` en desktop.
  - Atajos rápidos: `Últimos 30 días`, `Este mes`, `Mes pasado`, `Año en curso` como chips encima del calendario para evitar tap-tap en flechas.
  - Validación: `hasta ≥ desde`; resumen legible debajo (`1 ene – 31 mar 2026`).
  - Inputs nativos `<input type="date">` como fallback accesible bajo el botón en mobile (oculto visualmente, sincronizado) para teclados nativos cuando el usuario lo prefiera.

## 7. Guía de flujo Premium (NUEVO matiz)

- Cuando el usuario intenta vincular una línea del presupuesto a una deuda/escudo que aún no existe:
  - **No** se muestra como error ni bloqueo.
  - Toast `sonner` con tono cálido (ícono `Sparkles`/`Heart`), copy educativo:
    - ES: *"Primero demos forma a este [escudo/deuda] con calma. Te llevo a su sección para configurarlo y luego volverá a aparecer aquí."*
    - EN: *"Let's shape this [shield/debt] with calm first. I'll take you to its section so we can set it up — it'll show up here afterwards."*
  - Botón de acción en el toast: `Ir a Escudos` / `Ir a Deudas` (navega y mantiene el contexto del mes activo).
  - Si ya existen entidades creadas, sí se permite **vincular** desde el presupuesto vía dropdown (no crear).
  - Mismo patrón en cualquier CTA "+ Nueva deuda/escudo" que aparezca fuera de sus vistas dedicadas.

---

## Archivos

**Nuevos**
- `src/routes/reportes.tsx`, `src/views/ReportsView.tsx`
- `src/components/HistoryTable.tsx`
- `src/components/DatePicker.tsx` (popover + calendar + fallback nativo)
- `src/components/PeriodSelector.tsx` (mes / año / custom con atajos)
- `src/components/LinkEntityToast.tsx` (helper para toast educativo)

**Modificados**
- `src/styles.css` (tokens wine)
- `src/lib/finance.ts` (`lineDiff`, helpers de periodo)
- `src/lib/pdf.ts` (3 nuevos reportes)
- `src/store/useApp.ts` (edición libre de deuda, aportes con fecha, `totalPaid`)
- `src/components/BudgetTable.tsx`, `NumberCell.tsx`, `AppShell.tsx`
- `src/views/Dashboard.tsx`, `ShieldsView.tsx`, `DebtsView.tsx`
- `src/i18n/strings.ts` (copys ES/EN: reportes, periodos, historial, SALDADA, toast educativo)

Sin cambios de modelo: `src/store/types.ts` ya soporta `adjustments`, `history` y fechas; el `localStorage` actual sigue siendo compatible.

¿Procedo a implementar?
