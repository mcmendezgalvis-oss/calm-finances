## Plan: Refinamientos de Escudos, Cierre de Mes, Dashboard y Saludo personalizado (v2)

Incorpora las 3 correcciones de blindspots solicitadas. Mantiene la estética vino + salvia y la lógica local-first.

### 1. Mis Escudos · UX y nomenclatura

- Renombrar título a **"Mis escudos y metas"** (`ShieldsView.tsx`, `AppShell.tsx`, `strings.ts`).
- CTA `+ Crear Nuevo Escudo` → **`+ Crear Nueva Meta`** en todos los lugares.
- En el modal de creación: campo **Nombre obligatorio** (`required` + validación). Placeholders: *"Viaje a Europa", "Mantenimiento Casa", "Fondo Universidad"*.
- Conceptualmente: único "escudo" = Fondo de Emergencia. El resto = **Metas**.

### 2. Eliminación de seeds de ejemplo

- Estado inicial vacío en `useApp.ts` salvo el `emergency-fund` creado por `ensureEmergencyFund()`.
- Migración v2 idempotente: shields seed `"initial"`/`"definitive"` sin historial → eliminados. Con historial → preservados como `"custom"`.

### 3. Eliminación de metas personalizadas — con protección de historial (BLINDSPOT #2 RESUELTO)

- Icono `Trash2` sutil en cada card de meta personalizada (NO en Fondo de Emergencia).
- **Regla de protección**: antes de habilitar el botón, el sistema calcula si existe alguna **línea vinculada** (`linkedShieldId === id`) en un **mes cerrado** (`month.closed === true`) con `real > 0`.
  - **Si NO hay aportes en meses cerrados**: botón habilitado → diálogo de confirmación shadcn (*"¿Estás segura de que deseas eliminar esta meta? Esta acción no se puede deshacer."*) → al confirmar, `removeShield(id)` borra el escudo y **solo elimina líneas vinculadas en meses abiertos o futuros** (`!month.closed`). Toast: *"Meta eliminada. Las líneas en meses cerrados se preservaron en tu historial."*
  - **Si SÍ hay aportes en meses cerrados**: botón de basura se reemplaza por un menú con dos opciones:
    1. **Archivar meta** (default sugerida): marca `shield.archived = true`. La meta deja de aparecer en selects de presupuesto y en la sección activa de Escudos. Aparece colapsada en "Metas archivadas" al final de la vista. Las líneas en meses pasados permanecen intactas. Las líneas en meses abiertos/futuros se eliminan.
    2. **Eliminar permanentemente** (oculta tras `AlertDialog` con doble confirmación + texto: *"Esta meta tiene aportes en meses cerrados. Eliminarla alterará tu historial. ¿Continuar de todos modos?"*).
- Nuevo campo en `types.ts`: `Shield.archived?: boolean`.

### 4. Cierre de mes (toggle con snapshot) — con reversión del sobrante (BLINDSPOT #1 RESUELTO)

- Estado por mes: `closed?: boolean`, `closedAt?: string`, `snapshot?: { lines: BudgetLine[]; closedAt: string }`, `surplusCarryForwardId?: string` (id de la línea "Sobrante mes anterior" creada en el mes siguiente, si aplica).
- Botón **"Cerrar mes" / "Reabrir mes"** en la cabecera de **Mi Calma** (`BudgetView.tsx`).
- **Cerrar**:
  - Si `balance < 0`: alerta amable + bloquea cierre. Texto: *"¡Atención! Tu presupuesto está en negativo…"* con sugerencias contextuales.
  - Si `balance > 0`: modal **Asignación de sobrante** con 3 acciones (Pagar deuda / Guardar en escudo / Pasar al próximo mes). Si elige pasar al próximo mes, crea una línea `income` en `monthKey+1` llamada *"Sobrante mes anterior"* y guarda su id en `surplusCarryForwardId` del mes que se cierra.
  - Si `balance === 0`: cierre directo.
  - Guarda snapshot de `lines`.
- **Reabrir** (BLINDSPOT #1):
  - Pregunta *"¿Quieres continuar desde el último estado o restaurar la versión guardada?"* — ambas opciones desbloquean edición.
  - **Reversión automática del carry-forward**: al reabrir, si `surplusCarryForwardId` existe, el sistema busca esa línea en el `monthKey+1` y la **elimina**. Si el mes siguiente ya está cerrado también, muestra alerta bloqueante: *"No puedes reabrir este mes porque el sobrante ya fue trasladado a [mes siguiente] y ese mes también está cerrado. Reabre primero el mes siguiente."*. Si el siguiente está abierto pero la línea ya fue editada manualmente (`real > 0`), se respeta `real` pero se ajusta `planned` a 0 y se notifica al usuario.
  - Después de reabrir y editar, al volver a cerrar, se vuelve a ofrecer el modal de asignación con el nuevo balance.
- **Bloqueo de edición** cuando `closed === true`: inputs de "Mi Realidad" `disabled`, sin botones de añadir/borrar línea. Banner: *"Mes cerrado · Reabre el toggle para editar."*.
- Trigger de trofeo `under_budget` se evalúa solo dentro de `closeMonth()`.

### 5. Flujo Free/Premium al crear desde presupuesto

- Escudos sigue **solo Premium** (mantener `PremiumGate`).
- En `BudgetTable.tsx` al añadir línea en grupo `future`:
  - `premium`: toast *"¡Excelente intención! Vamos a configurar los detalles de tu meta."* + `router.navigate({ to: "/escudos" })`. NO crea la línea.
  - `free`: crea línea simple, sin redirección.
- Misma lógica para grupo `debts` → `/deudas`.

### 6. Trazabilidad e integridad referencial

- `shieldDeposit/shieldWithdraw` siempre escriben `note` con origen (`"Desde Mi Realidad"` / `"Desde Mis Escudos"`).
- Pagos en líneas con `linkedDebtId` desde Mi Realidad ejecutan `registerDebtPayment(id, delta, "Desde Mi Realidad")` automáticamente.
- Liquidación de deuda ($0): confeti + `awardTrophy("debt_paid")` + redistribución de `minimumPayment` a la siguiente deuda con ajuste *"Ajuste por efecto bola de nieve"*.
- **No duplicados** (case-insensitive) en `addShield`, `addDebt`, renames.
- **Rename cascada**: actualiza `line.name` en todos los meses vinculados.

### 7. Dashboard · Selector y gráficas (BLINDSPOT #3 RESUELTO)

- **Header**: solo selector de **Año** (`ChevronLeft`/`ChevronRight` + `Select` de años). Eliminado el toggle mes/año del global.
- **Scroll horizontal visible** en todas las gráficas mensuales (`HScrollChart` con `[&::-webkit-scrollbar]:h-2` y `bg-sage-100`).
- **"El destino de mis ingresos"**: pastel **circular completo** (no dona), leyenda lateral con categorías de salida (4 Muros, Generosidad, Estilo de vida, Inversión y Futuro, Deudas). **Selector propio mes+año** (default = actual), independiente del header.
- **Gráficas separadas para escudo y metas** (BLINDSPOT #3):
  - **`EmergencyFundEvolutionChart.tsx`** — gráfica de **área** exclusiva del Fondo de Emergencia. Eje X = 12 meses del año seleccionado, eje Y = balance acumulado. Línea de hito horizontal en cada nivel ($1,000, 1–3 meses, 3–6 meses).
  - **`GoalsBarChart.tsx`** — barras verticales para **metas personalizadas únicamente** (excluye `emergency-fund`). Eje Y = monto, eje X = meses del año; un color distinto por meta; leyenda inferior con nombres.
- **`DebtsBarChart.tsx`** — barras verticales por mes para deudas activas; un color por deuda; leyenda inferior.

### 8. Saludo personalizado

- Reemplazar saludo del Dashboard por:
  > **"Hola, {profile.name}. Me encanta que estés por aquí — vamos a ponerle intención a nuestro dinero."**
- Si `profile.name` está vacío: *"Hola, bienvenida. Me encanta que estés por aquí…"*. Texto en `strings.ts → t.dashboard.greeting(name)`.

### 9. Archivos

**Nuevos**
- `src/components/CloseMonthDialog.tsx`
- `src/components/ReopenMonthDialog.tsx`
- `src/components/DeleteGoalDialog.tsx` (con variantes: confirmación simple, archivar, eliminación permanente bloqueada)
- `src/components/charts/IncomeDestinationPie.tsx`
- `src/components/charts/EmergencyFundEvolutionChart.tsx`
- `src/components/charts/GoalsBarChart.tsx`
- `src/components/charts/DebtsBarChart.tsx`

**Modificados**
- `src/store/types.ts` (`MonthBudget.closed`, `closedAt`, `snapshot`, `surplusCarryForwardId`; `Shield.archived`)
- `src/store/useApp.ts` (`closeMonth`, `reopenMonth` con reversión de carry-forward, `removeShield` con protección de meses cerrados, `archiveShield`, validaciones de duplicados, rename cascada, snowball auto)
- `src/views/ShieldsView.tsx` (rename CTA, modal nombre obligatorio, papelera/archivar condicional, sección "Metas archivadas")
- `src/views/BudgetView.tsx` (toggle cerrar/reabrir, banner mes cerrado, `disabled` propagado)
- `src/components/BudgetTable.tsx` (free/premium redirect en `future`/`debts`, deshabilitar cuando cerrado)
- `src/views/Dashboard.tsx` (selector solo año, saludo, integración gráficas nuevas)
- `src/components/DashboardPeriodSelector.tsx` (solo año, scroll visible)
- `src/components/HScrollChart.tsx` (barra visible salvia)
- `src/i18n/strings.ts` (CTAs, copys de cierre/reapertura, archivar, saludo, leyendas)
- `src/components/AppShell.tsx` (nav "Mis escudos y metas")

**Sin dependencias nuevas** (`recharts` ya disponible).

### Notas técnicas

- `surplusCarryForwardId` es el contrato de seguridad para la reversión del sobrante; al borrarse la línea en mes+1, el `Number(planned)` y `Number(real)` se eliminan en bloque para no dejar residuos.
- La protección de meses cerrados al borrar metas valida `month.closed && line.real > 0` para considerar el aporte "real" (un `planned` huérfano no protege).
- `Shield.archived` filtra de selects, leyendas de gráficas y totales activos, pero las líneas históricas siguen calculando totales pasados correctamente.
- Migración v2 corre una vez en `ensureEmergencyFund()`.
- Snapshots viven en `localStorage` (~JSON ligero).
- Toast Free→Premium con `duration: 4500` antes del navigate.
