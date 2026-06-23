## Ajustes solicitados

### 1. Lógica financiera de "Adiós a las Cadenas"

**Archivo:** `src/store/useApp.ts` — `registerDebtPayment`
- Registrar el pago en `adjustments` (delta = `-amount`, note = "Pago") **sin** modificar `currentBalance` ni marcar `paid`.
- Devuelve `paidOff = false` siempre. La detección de liquidación se mueve a `bankAdjust`: cuando `newBalance === 0 && !d.paid` → setear `paid: true`, `paidAt`, otorgar trofeo `debt_paid` y disparar bola de nieve.

**Archivo:** `src/views/DebtsView.tsx`
- Handler "Registrar pago": quitar celebración basada en `paidOff`. Mantener toast neutro `− monto`.
- `AdjustDialog`: tras `bankAdjust`, si el nuevo saldo es 0 y la deuda no estaba pagada → confeti + `toast.success(t.debts.celebration)`.

### 2. Tooltip "Capital pagado" en barra de progreso

`src/views/DebtsView.tsx`: envolver la barra en `Tooltip` de `@/components/ui/tooltip` con contenido `Capital pagado a la fecha: {fmt(d.initialBalance - d.currentBalance, currency)}`. Cursor `cursor-help`.

### 3. Total de Efectivo Destinado en historial

`src/views/DebtsView.tsx`: al final del `<ul>`, fila en negrita `Total de Efectivo Destinado: {fmt(sumPagos, currency)}` con `sumPagos = adjustments.filter(a=>a.delta<0).reduce((s,a)=>s+(-a.delta),0)`. Junto al texto, icono `<Info>` con tooltip: "Suma bruta de todos los pagos registrados (incluye capital, intereses y comisiones)."

### 4. Icono (i) junto a "Saldo Actual"

`src/views/DebtsView.tsx`: `<Info className="size-3 text-sage-400" />` junto al label, tooltip: "Este monto debes actualizarlo manualmente cada mes según el estado de cuenta real de tu banco, ya que los pagos incluyen intereses y comisiones que el sistema no calcula automáticamente."

### 5. Gráficas del Dashboard

**5a. `IncomeDestinationPie.tsx`** — leyenda con %: calcular total y transformar `name` a `${name} — ${pct}%` (pct dinámico según mes seleccionado).

**5b. `GoalsBarChart.tsx`** — quitar `stackId` (grouped bars). Cambiar valor por meta al **saldo acumulado** al cierre de cada mes (suma deposits − withdraws hasta `endOfMonth(m)`).

**5c. `DebtsBarChart.tsx`** — saldos vivos acumulativos: por cada deuda y mes, `initial + Σ adjustments.delta` con fecha ≤ fin de mes (0 si la deuda no existía). Mantener `stackId="d"` con leyenda por deuda → escalera descendente; meses sin movimiento heredan el saldo previo automáticamente.

### 6. Tooltips (i) en títulos de gráficas

Nuevo helper `src/components/charts/ChartTitleHelp.tsx` (`{title, help}` → `<h2>` + `Info` + `Tooltip`). Aplicar en:
- `IncomeDestinationPie` — "Muestra la distribución exacta de tu dinero en el mes seleccionado. Cada porción representa una misión de tu presupuesto Base Cero."
- `Dashboard.tsx` (Evolución Mensual) — "Compara tus ingresos totales frente a tus gastos mes a mes. Tu objetivo es mantener siempre la barra de ingresos por encima."
- `EmergencyFundEvolutionChart` — "Visualiza el crecimiento de tu saldo acumulado. Este es tu escudo principal para proteger tu paz financiera ante imprevistos."
- `GoalsBarChart` — "Sigue el progreso acumulativo de tus ahorros con propósito. Observa cómo cada meta crece mes a mes de forma independiente."
- `DebtsBarChart` — "Visualiza el colapso de tu montaña de deudas. Muestra cómo tu saldo real pendiente decrece hacia cero usando el método de Bola de Nieve."

### 7. Saludo dinámico y neutro en Dashboard

**Archivos:** `src/i18n/strings.ts`, `src/views/Dashboard.tsx`
- Reemplazar `t.dashboard.greetingTemplate` por: `"Hola, {name}. Me encanta que estés por aquí..."`.
- `greetingFallback` (cuando no hay nombre en el perfil): `"Hola. Me encanta que estés por aquí..."` (sin marca de género).
- Versión EN equivalente, neutra.
- Variable `{name}` ya proviene de `state.profile.name` → reemplazo con `.replace("{name}", profile.name)` (lógica actual ya soporta esto).

### Archivos

**Modificados:** `src/store/useApp.ts`, `src/views/DebtsView.tsx`, `src/components/charts/IncomeDestinationPie.tsx`, `src/components/charts/GoalsBarChart.tsx`, `src/components/charts/DebtsBarChart.tsx`, `src/components/charts/EmergencyFundEvolutionChart.tsx`, `src/views/Dashboard.tsx`, `src/i18n/strings.ts`.

**Nuevo:** `src/components/charts/ChartTitleHelp.tsx`.

### Notas
- Todos los tooltips usan `Tooltip` de shadcn (`@/components/ui/tooltip`) para accesibilidad táctil.
- No hay cambios en tipos ni migraciones; los pagos previos quedan intactos.