# Plan: Refinamientos profundos de Presupuesto, Escudos, Deudas, Reportes, Gamificación y Dashboard

Aplico ocho cambios coordinados manteniendo la estética botánica minimalista (vino #722F37 + salvia) y la lógica local-first ya existente.

## 1. Selector de categorías al "Agregar línea"

Reemplazar el botón "Agregar línea" en `BudgetTable.tsx` por un flujo con `Select` (shadcn) con categorías predefinidas por grupo + opción "Otros" (input libre).

- Crear `src/lib/categories.ts` con catálogos por grupo (ES/EN):
  - **4 Muros**: Vivienda/Renta, Hipoteca, Servicios, Internet/Teléfono, Comida, Transporte esencial, Otros.
  - **Generosidad**: Diezmo, Ofrenda, Donaciones, Regalos, Otros.
  - **Estilo de vida**: Restaurantes, Entretenimiento, Ropa, Suscripciones, Cuidado personal, Hobbies, Otros.
  - **Inversión y Futuro**: Retiro, Inversiones, Metas de ahorro, Educación, Otros.
  - **Ingresos**: Salario, Freelance, Bonos, Inversiones, Otros.
- Nuevo `CategoryPicker.tsx` (Popover + Select + input "Otros") que al confirmar crea la línea y enfoca automáticamente el campo monto (`ref` + `requestAnimationFrame` → `input.focus()`).

## 2. Fondo de Emergencia unificado

Refactor de `ShieldsView.tsx` y `useApp.ts`:

- Garantizar un único escudo seed `kind: "emergency"` con `id` estable `emergency-fund`, creado al inicializar el store si no existe.
- Tarjeta con **3 niveles**:
  ```
  Nivel 1 · Escudo Inicial       $1,000 fijo
  Nivel 2 · 1–3 meses de gastos  muros4Total × 1..3
  Nivel 3 · 3–6 meses de gastos  muros4Total × 3..6
  ```
  Barra de progreso continua + 3 hitos visuales. Texto bajo el título:
  > "Tu refugio crece por etapas: primero $1,000 de tranquilidad, luego 1–3 meses de gastos esenciales, y finalmente 3–6 meses para vivir en calma."
- Metas personalizadas siguen disponibles debajo.

## 3. Línea permanente "Fondo de Emergencia" en Inversión y Futuro

En `syncLinkedLines()` asegurar que siempre exista la línea con `linkedShieldId === 'emergency-fund'` en `future`, marcada `permanent: true` (nuevo flag en `BudgetLine`) — `removeLine` la ignora y no se renderiza el botón de basura.

## 4. Bola de Nieve y Coaching

- `DebtsView.tsx`: ordenar por `currentBalance` asc (pagadas al final). Banner card con icono `Sprout`: *"Ataca la deuda menor y mantén el pago mínimo en las demás hasta liberarla."*
- `syncLinkedLines`: ordenar las líneas `linkedDebtId` por saldo ascendente.
- Cada tarjeta de deuda:
  ```
  Saldo Actual:       (label sm gris)
  $1,234.56           (cifra grande)
  al 23 jun 2026      (última adjustment o createdAt)
  ```

## 5. Iconos de ayuda (?) por rubro

Nuevo `GroupHelp.tsx`: `HelpCircle` salvia size-3.5 junto a cada título → `Popover` con copy educativo (ES + EN en `strings.ts`):
- **4 Muros**, **Generosidad**, **Estilo de vida**, **Inversión y Futuro** según copy provisto.
- **Pago de Deudas** con nota explícita sobre la hipoteca: *"…La hipoteca no se incluye aquí; ese pago va en 'Vivienda' dentro de los 4 Muros, ya que es tu refugio esencial."*

## 6. Totales en Reportes (vista + PDF)

- `ReportsView.tsx`: fila final `font-bold`, fondo `bg-sage-50`, borde superior vino, sumando cada columna numérica visible.
- `src/lib/pdf.ts`: en los 3 generadores y en el export "Mi Calma", fila TOTAL con `setFillColor` salvia claro + `setFont(..., 'bold')` sobre el rango filtrado.

## 7. Gamificación / Logros

- Tipo `Trophy` en `store/types.ts`: `{ id, kind: "shield_l1"|"shield_l2"|"shield_l3"|"debt_paid"|"under_budget"|"income_growth", label, earnedAt, contextId?, monthKey? }`.
- `useApp.ts`: `trophies: Trophy[]` + `awardTrophy()` idempotente (`kind+contextId+monthKey`).
- Disparadores:
  - cambio de balance del Fondo de Emergencia → niveles 1/2/3.
  - liberación de deuda en `registerDebtPayment`/`updateLine`.
  - `checkMonthClose(monthKey)`: gasto real < planeado → `under_budget`; ingresos mes > mes-1 → `income_growth`.
- Notificación: `sonner` + confeti (`canvas-confetti`).
- Nueva vista `/logros` (`TrophiesView.tsx`): "Salón de la Fama" — grid de medallas por tipo.

## 8. Dashboard: Selector global + scroll horizontal en gráficas

### 8a. Selector global Mes/Año (fuente única de verdad)

- En `Dashboard.tsx`, reemplazar el toggle actual `periodMode` por un `DashboardPeriodSelector` sticky en el header (debajo del título):
  ```
  [◀]  [Junio ▾] [2026 ▾]  [▶]    [ Mes | Año ]
  ```
  - Dos `Select` (shadcn) para mes y año + flechas `ChevronLeft`/`ChevronRight` para avanzar/retroceder.
  - Toggle a la derecha para alternar entre vista **Mes** (datos del mes elegido) y **Año** (resumen anual del año elegido).
- Estado elevado en `Dashboard` con `useState<{ year, month, mode }>` y pasado por contexto local (`DashboardPeriodContext`) o props directas a:
  - tarjetas de KPIs (ingresos, gastos, balance),
  - dona de distribución de ingresos,
  - barras de evolución,
  - barras de deudas y de escudos.
- Todos los cálculos (`groupTotals`, `monthBuckets`, etc.) leen del periodo del contexto — eliminar selectores duplicados existentes en componentes hijos.
- En vista **Año**, los componentes reciben los 12 monthKeys del año elegido; en vista **Mes**, solo el monthKey activo + ventana de 6 meses previos para contexto.

### 8b. Scroll horizontal mobile-first en gráficas

Crear `src/components/HScrollChart.tsx` — wrapper reutilizable:

```tsx
<div className="relative -mx-4 sm:mx-0">
  <div className="overflow-x-auto overscroll-x-contain snap-x snap-mandatory
                  scroll-px-4 px-4 [scrollbar-width:thin]
                  [&::-webkit-scrollbar]:h-1.5">
    <div style={{ minWidth: months.length * 56 }} className="snap-start">
      {children}
    </div>
  </div>
</div>
```

- Aplicado a las 3 gráficas afectadas en `Dashboard.tsx`:
  - **Evolución Mensual** (barras agrupadas): 56–64 px por mes, eje X dentro del scroll, eje Y fijo a la izquierda con un `<div sticky left-0 bg-card>` para legibilidad.
  - **Derrumbe de Deudas** (barras horizontales): scroll vertical si hay >6 deudas; mantiene scroll horizontal solo si la vista anual genera columnas por mes.
  - **Crecimiento de Escudos** (barras por mes): mismo wrapper, `snap-x` por columna.
- Touch-friendly: `overscroll-behavior-x: contain` evita pull-to-refresh accidental; `scroll-snap-type: x mandatory` da feedback táctil; barras de scroll discretas con tema salvia.
- Eje X (etiquetas de meses) renderizado **dentro** del contenedor con scroll, no fuera, para mantener alineación. Eje Y queda fijo con `position: sticky; left: 0; z-index: 1`.
- Indicadores sutiles `‹ ›` al borde si hay overflow (detectado con `ResizeObserver` simple).

## Archivos

**Nuevos**
- `src/lib/categories.ts`
- `src/components/CategoryPicker.tsx`
- `src/components/GroupHelp.tsx`
- `src/components/EmergencyFundCard.tsx`
- `src/components/DashboardPeriodSelector.tsx`
- `src/components/HScrollChart.tsx`
- `src/lib/trophies.ts`
- `src/views/TrophiesView.tsx`
- `src/routes/logros.tsx`

**Modificados**
- `src/store/types.ts` (Shield kind "emergency", BudgetLine.permanent, Trophy)
- `src/store/useApp.ts` (seed emergency fund, snowball order, trophies + awardTrophy, línea permanente)
- `src/components/BudgetTable.tsx` (CategoryPicker, GroupHelp, bloquear borrar línea permanente)
- `src/views/ShieldsView.tsx` (EmergencyFundCard + secciones personalizadas)
- `src/views/DebtsView.tsx` (orden snowball, banner coaching, label "Saldo Actual / al [fecha]")
- `src/views/Dashboard.tsx` (período global, HScrollChart en las 3 gráficas, eje Y sticky)
- `src/views/ReportsView.tsx` (filas TOTAL)
- `src/lib/pdf.ts` (filas TOTAL en 3 reportes + Mi Calma)
- `src/components/AppShell.tsx` (entrada "Logros")
- `src/i18n/strings.ts` (textos de ayuda, coaching, niveles, trofeos, categorías, selector de periodo)

**Dependencias**: `bun add canvas-confetti @types/canvas-confetti`

## Notas técnicas
- `syncLinkedLines` deduplica por `linkedShieldId`/`linkedDebtId` → no se generan duplicados al cambiar de mes.
- Umbrales de niveles 2/3 se recalculan en vivo desde `muros4Total(mesActual)`.
- `awardTrophy` idempotente evita spam de confeti en re-renders.
- El selector global del Dashboard NO afecta a `/presupuesto` (que mantiene su propio `MonthSelector`); solo es fuente de verdad dentro de Dashboard.
- `HScrollChart` no rompe SSR: el `ResizeObserver` se monta en `useEffect`.
- Migración local del store v1: si no existe `emergency-fund`, se crea silenciosamente sin romper datos previos.
