# Plan: 7 ajustes de funcionalidad y diseño

## 1. Botones "Empezar de cero" en Presupuesto
En `src/views/BudgetView.tsx` / `src/components/BudgetTable.tsx`:
- Añadir botón "Borrar todo" visible solo cuando la pestaña activa es `plan` o `real` (no en `diff`).
- Al presionar, mostrar confirmación y poner en 0 el campo correspondiente (`planned` o `actual`) de todas las líneas del mes actual — sin borrar categorías ni líneas vinculadas a deudas/escudos.
- Deshabilitar cuando el mes esté cerrado.

## 2. Símbolo de moneda: $ global
- En `src/store/useApp.ts` cambiar la moneda por defecto del perfil a `"USD"` (o a un símbolo `$` universal).
- Migración suave: al hidratar, si `profile.currency === "EUR"` reemplazar por `"USD"`.
- Verificar `src/lib/finance.ts` (`fmt`), `src/lib/pdf.ts` y `src/lib/csv.ts` para asegurar que usan la moneda del perfil (no hardcoded €).
- Revisar `SettingsView` para que el selector siga funcionando pero con `$` como opción principal.

## 3. "Mi Calma" y cierre en negativo
**Recuadro superior en la pestaña `diff`** (`BudgetView.tsx` / `BudgetTable.tsx`):
- Card destacada mostrando el balance neto del mes (ingresos reales − gastos reales).
- Verde (`bg-sage-100`) si ≥ 0; rojo (`bg-blush-100` / clay) si < 0.

**Cierre en negativo** (`src/store/useApp.ts` `closeMonth` + `src/components/CloseMonthDialog.tsx`):
- Quitar el bloqueo actual (`blockedNegative`).
- Permitir cerrar con `allocation: { type: "none" }` y marcar `month.closed = true` con flag `overdrawn: true`.
- Mostrar advertencia clara + texto educativo:
  > "Cerraste el mes sobregirado por $X. Analiza de dónde vino la diferencia: ¿pediste dinero prestado o aumentaste el saldo de tu tarjeta de crédito? Si es así, ve a **Adiós a las Cadenas** y actualiza el saldo de tu deuda."
- Botón directo "Ir a deudas" (link a `/deudas`).
- Añadir strings en `src/i18n/strings.ts`.

## 4. Sobrante + Copiar plantilla pueden convivir
En `BudgetView.tsx`:
- Actualmente el botón "Copiar mes anterior" solo aparece si `isEmpty`. La opción "Arrastrar sobrante" del cierre anterior inserta una línea de ingreso "Sobrante mes anterior", lo cual hace que `isEmpty === false` y oculta el botón copiar.
- Fix: cambiar la condición `isEmpty` para ignorar líneas del sistema (marca `system: true` o `source: "carry"`) al decidir si mostrar "Copiar plantilla".
- Al copiar plantilla, preservar (no duplicar ni borrar) la línea de sobrante ya inyectada.
- Marcar la línea de carry con un flag en el store para identificarla.

## 5. Editar/Borrar en historiales de Deudas y Escudos
En `src/views/DebtsView.tsx` y `src/views/ShieldsView.tsx` (y componentes de historial que rendericen `payments`/`contributions`):
- Añadir iconos ✏️ (Pencil) y 🗑️ (Trash) en cada fila del historial.
- Editar: modal pequeño con fecha + monto.
- Borrar: confirmación → recalcula saldo/total actual.
- En `useApp.ts` añadir acciones `editDebtPayment`, `deleteDebtPayment`, `editShieldContribution`, `deleteShieldContribution` que recalculen balances.

**Inyección automática desde cierre de mes:**
- Verificar que `closeMonth` en el store crea entradas en el historial de la deuda/escudo asignado (marcadas con `source: "month-close"` y `monthKey`).
- Esas entradas deben ser editables/borrables como cualquier otra (con una etiqueta discreta "cierre de mes").

## 6. Reportes: filtros y presupuesto vs real
En `src/views/ReportsView.tsx` y `src/components/PeriodSelector.tsx`:
- **PeriodSelector**: eliminar el modo `custom` completo (o quitar el atajo `last30` y sustituir "Custom" por selección de rango solo por meses). Los modos válidos quedan: `month` y `year`. Actualizar tipos `PeriodMode`.
- Quitar shortcuts `last30`, `thisMonth`, `lastMonth`, `ytd` de UI y de i18n.
- **Reporte Presupuesto vs Real**:
  - Si el rango resuelve a 1 mes → tabla detallada ítem por ítem (comportamiento actual).
  - Si son ≥ 2 meses → mostrar solo totales por mes colapsados (una fila por mes: Plan / Real / Diferencia), con opción de expandir opcional (fuera de alcance si no aplica).

## 7. Rediseño del ícono (PWA + UI)
- Generar nuevo SVG: escudo verde sage con símbolo **$** grande en color vinotinto (`--wine`) centrado. Alternativa considerada: corazón vinotinto con $ dentro; se prefiere el $ directo por legibilidad a 16px.
- Reemplazar:
  - `public/favicon.ico` / `public/favicon.png`
  - `public/icon-192.png` y `public/icon-512.png` (regenerar desde el SVG con `imagegen` para asegurar nitidez y background sólido para maskable).
  - Logo del header en `AppShell.tsx` (usar el SVG inline).
  - `<link rel="icon">` y `apple-touch-icon` en `src/routes/__root.tsx` (ya existentes, se mantienen apuntando a los nuevos archivos).
- El `manifest.webmanifest` ya referencia `/icon-192.png` y `/icon-512.png` → basta con reemplazar los archivos.

---

## Detalles técnicos

- **Store**: nuevos flags `line.source: "carry" | "template" | "user"`, `payment.source: "month-close" | "manual"`, y acciones `resetPlan(monthKey)`, `resetActual(monthKey)`, `editDebtPayment`, `deleteDebtPayment`, `editShieldContribution`, `deleteShieldContribution`.
- **i18n**: nuevos strings en `src/i18n/strings.ts` (ES/EN) para: reset confirm, advertencia sobregiro, tooltip "cierre de mes" en historial.
- **PeriodValue**: quitar campos `from`/`to` y modo `custom`. Actualizar consumidores en `ReportsView.tsx`.
- **QA**: build + probar flujos de cierre positivo/negativo/cero, copiar plantilla con sobrante presente, editar/borrar aportes, filtrar 1 mes vs 3 meses en reporte.
