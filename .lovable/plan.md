## Módulo 1: Presupuesto

**`src/views/BudgetView.tsx`**
- "Empezar de cero" (reset Plan / Real): siempre visible cuando `!closed` y la pestaña es `plan` o `real` (ya lo está — verificar que no dependa de otros flags).
- "Copiar plan del mes anterior": ocultarlo apenas se use. Estado local `copiedThisMonth: Record<monthKey, boolean>`. Cuando se pulsa Copiar → set true. Cuando se pulsa "Empezar de cero" (Plan o Real) → set false para ese `monthKey`. La condición actual `isEmpty && hasPrev` se sustituye por `!copiedThisMonth[monthKey] && hasPrev && !closed`.
- Color de fondo dinámico según pestaña: envolver el contenedor principal (o setear en `<AppShell>` vía prop / clase) con `bg-white` (plan), `bg-[#FFF8F8]` (real), `bg-[#F4F9F5]` (diff/balance). Añadir tokens `--tab-bg-plan`, `--tab-bg-real`, `--tab-bg-balance` en `src/styles.css` y aplicar clases utilitarias.

**Campo de Notas por línea (solo pestaña Plan)**
- Añadir `note?: string` en `BudgetLine` (`src/store/types.ts`), columna `note text` en tabla `budget_lines` (migración Supabase + sync en `src/lib/sync.ts`).
- En `src/components/BudgetTable.tsx` renderizar un pequeño `<input>` de nota junto al nombre/categoría cuando `tab === "plan"`. Persistir vía `updateLine(monthKey, id, { note })`.
- Mostrar la nota (solo lectura, tamaño pequeño en gris) también en `real` y `diff` para contexto.

## Módulo 2: Deudas

**Barra bicolor interactiva (`src/views/DebtsView.tsx`)**
- Reemplazar la barra simple por dos segmentos flex: verde sage (pagado = `initial − current`) y clay/wine (por pagar = `current`).
- Envolver cada segmento en `<Tooltip>` con texto "Deuda pagada: X (Y%)" / "Deuda por pagar: X (Y%)".
- Añadir leyenda debajo: dos chips con % pagado y % restante.

**Total histórico de abonos**
- Nueva tarjeta/campo por deuda: `Total de Abonos a la deuda` = suma de **todos** `-a.delta` donde `a.delta < 0` en `d.adjustments` (sin filtrar por nota). Reemplazar el `cashOut` actual que filtra por `"pago"`.

**Control de duplicados al cerrar/reabrir mes (`src/store/useApp.ts`)**
- Etiquetas fijas:
  - `"Abono desde presupuesto"` (source `"budget"`), inyectado desde `updateLine` cuando cambia el `real` de una línea con `linkedDebtId` — ya existe. Verificar que la nota sea siempre exactamente ese literal.
  - `"Abono manual"` (source `"manual"`), usado por `registerDebtPayment`. Actualizar `registerDebtPayment` para forzar `note = "Abono manual"` y `source = "manual"`.
- En `closeMonth` y `reopenMonth`: al recalcular ajustes derivados del mes, filtrar SOLO adjustments con `source === "budget"` (o nota `"Abono desde presupuesto"`) del rango del mes. Para cada línea con `linkedDebtId` del mes:
  - Si `real === 0` → eliminar ese ajuste del mes.
  - Si `real > 0` y el ajuste existe → actualizar delta.
  - Si no existe → crearlo.
- Ajustes con `source !== "budget"` (manuales) quedan intocables — nunca borrar ni modificar.
- Al reabrir, no borrar historial manual; solo revertir/reeditar los `"Abono desde presupuesto"` del mes reabierto.

## Módulo 3: Escudos y Metas

**Tres orígenes protegidos (`src/store/useApp.ts` + `src/store/types.ts`)**
- Extender `ShieldTx.source` a `"manual" | "month-close" | "budget" | "carry"` (donde `"carry"` = sobrante mes anterior). En BD `shield_tx.source text`.
- Notas fijas:
  - `"Aporte desde presupuesto"` (source `"budget"`) — único modificable en cierre/reapertura.
  - `"Aporte manual"` (source `"manual"`) — intocable.
  - `"Sobrante del mes anterior"` (source `"carry"`) — intocable, generado por `closeMonth` cuando la asignación es `{ type: "shield" }` del sobrante.
- Actualizar `shieldDeposit`/`shieldWithdraw` (llamados por el usuario) para forzar `source = "manual"` y `note = "Aporte manual"` cuando no se pase nota.
- En `closeMonth`/`reopenMonth` reconciliar SOLO los tx `source === "budget"` del mes correspondiente (mismo patrón que deudas). Nunca tocar `"manual"` ni `"carry"`.

**Simplificación universal de fechas a "Mes Año"**
- Nuevo helper `src/lib/finance.ts` (o nuevo `src/lib/dates.ts`): `formatMonthYear(date, lang)` → `"Julio 2026"` / `"July 2026"`.
- Reemplazar todas las llamadas `.toLocaleDateString()` en:
  - `src/views/DebtsView.tsx` (historial de ajustes + "as of").
  - `src/views/ShieldsView.tsx` (historial de tx + "as of").
- Formularios manuales: sustituir `InlineDatePicker` (día exacto) por un `MonthYearPicker` (dos selects o un popover con solo mes/año). Al guardar, normalizar la fecha al primer día del mes seleccionado (ISO). Aplicar en:
  - Pago de deuda (`DebtsView` — hoy usa `InlineDatePicker`).
  - Depósito/retiro manual en escudos (`ShieldsView`).
  - Edición inline de fecha en historial.
- Nuevo componente `src/components/MonthYearPicker.tsx`.

## Módulo 4: Dashboard

**Renombrado (`src/i18n/strings.ts` + rutas)**
- `nav.dashboard`: "Mi Calma" → "Dashboard" (ES y EN).
- `head()` de `src/routes/_authenticated/index.tsx`: título a "Dashboard · Finanzas en Calma".

**Limpiar gráficos (`src/views/Dashboard.tsx`)**
- Mantener solo tres, en este orden:
  1. `IncomeDestinationPie` (El destino de mis ingresos).
  2. Evolución mensual (BarChart ingresos vs gastos, ya existe).
  3. `DebtsBarChart` (El derrumbe de las deudas).
- Eliminar del render: `EmergencyFundEvolutionChart`, `GoalsBarChart`.

**Selector de Año + reactividad**
- Añadir un simple `<select>` de año (rango: años con datos + año actual) que controle el gráfico de Evolución y el de Deudas. Reutilizar / adaptar `DashboardPeriodSelector` en modo "solo año" o reemplazar por un selector propio más ligero.
- Asegurar que `DebtsBarChart` derive sus series del store con `useApp(...)` (selectores reactivos) y del prop `year`, sin snapshots memoizados que impidan el rerender cuando cambia `currentBalance` manual. Verificar que use `d.currentBalance` en vivo (no `d.initialBalance − sum(adjustments)`) para el punto "hoy" de la serie.

## Cambios en base de datos (una migración)

```sql
ALTER TABLE public.budget_lines ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE public.shield_tx    ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.debt_adjustments ADD COLUMN IF NOT EXISTS source text;
```
Actualizar `src/lib/sync.ts` para leer/escribir las nuevas columnas.

## Verificación final

- `bun run build` compila.
- Preview:
  - Copiar mes anterior desaparece tras usarse; reaparece al hacer "Empezar de cero".
  - Notas persisten al recargar y no se muestran en Real/Balance como editable.
  - Fondos de pestaña cambian según Plan/Real/Balance.
  - Barra bicolor con tooltips + leyenda de %.
  - Total de abonos suma todo el historial.
  - Cerrar → editar Real → reabrir → cerrar: los `"Abono desde presupuesto"` se actualizan; los `"Abono manual"` no se tocan. Idem para escudos con las 3 fuentes.
  - Fechas en historial y formularios muestran solo "Mes Año".
  - Dashboard renombrado, con 3 gráficos, selector de año reactivo, y el gráfico de deudas se redibuja al editar Saldo Actual.
