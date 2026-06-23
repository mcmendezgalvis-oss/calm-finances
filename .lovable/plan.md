## Ajustes solicitados (9 puntos)

### 1. "+ Crear nueva meta…" en modal de Sobrante
**Archivo:** `src/components/CloseMonthDialog.tsx`
- En el `<select>` de la opción "shield", añadir al final `<option value="__new__">+ Crear nueva meta…</option>`.
- Al elegirla:
  - **Premium**: cerrar el diálogo de cierre, abrir el modal detallado de creación de meta (reutilizar el componente existente en `ShieldsView.tsx`, extraído a `NewShieldDialog.tsx` si está inline). Tras crearla, regresar al flujo: precargar el nuevo shieldId y monto = sobrante, confirmar cierre.
  - **Free**: mostrar inline un input simple (nombre) + botón "Crear y asignar"; llama a `addShield({ name, goal: amount, kind: "custom" })` y continúa con la asignación.
- Comprobar plan con `useApp(s=>s.profile.plan)`. Si Free y ya alcanzó el límite de metas (regla actual), mostrar mensaje y empujar upgrade.

### 2. Stacking por saldo (mayor abajo) en `DebtsBarChart`
**Archivo:** `src/components/charts/DebtsBarChart.tsx`
- Ordenar `debts` por `currentBalance` desc antes del map de `<Bar>`. Recharts apila en orden de declaración (el primero queda en la base), así la deuda mayor queda abajo y la más pequeña arriba ("la cima cae primero").
- Mantener `stackId="d"` y colores estables por `id` (usar índice del array ordenado para PALETTE, o un map id→color para consistencia entre meses).

### 3. Protección en "Copiar presupuesto del mes anterior"
**Archivo:** `src/store/useApp.ts` — `copyFromPrevious`
- Al copiar líneas del mes previo: **excluir** líneas cuyo `name` coincida con la etiqueta "Sobrante mes anterior" (i18n: `t.budget.surplusCarryName` / equivalente actual) o que estén marcadas como auto-carry (si se introduce flag).
- Al insertar en el mes destino: **no** tocar las líneas existentes; si ya existe una "Sobrante mes anterior" en el destino, conservarla intacta y anexar el resto debajo.
- Cubrir lo mismo para ingresos regulares (ya se copian; sólo añadir la exclusión específica del sobrante).

### 4. Barra de progreso de deudas = capital pagado
**Archivo:** `src/views/DebtsView.tsx`
- Cambiar el cálculo del ancho a `pct = clamp01((initialBalance - currentBalance) / initialBalance) * 100`.
- Tooltip ya muestra "Capital pagado" (punto previo aprobado). Verificar coherencia con `initialBalance > 0` (si 0, mostrar 0%).

### 5. Unificación de movimientos en `/reportes`
**Archivo:** `src/views/ReportsView.tsx` (y helpers en `src/lib/finance.ts` si aplica)
- **Detalle por Deuda**: feed cronológico que combine:
  - `debt.adjustments` (pagos manuales con delta<0 y ajustes con delta cualquiera; etiquetar por signo y `note`).
  - Líneas del presupuesto vinculadas (`BudgetLine.linkedDebtId`) con `real > 0` de cada mes cerrado/abierto → registrarlos como evento "Abono desde presupuesto" con fecha = fin del `monthKey`.
- **Movimientos por Fondo**: combinar `shield.history` + líneas con `linkedShieldId` y `real > 0` (depósitos automáticos) + asignaciones de cierre de mes (`CloseMonthDialog` ya genera `ShieldTx`; verificar).
- Ordenar por fecha asc/desc; columnas: Fecha, Tipo, Monto, Nota.

### 6. Selección libre de meses futuros en `/reportes`
**Archivo:** `src/views/ReportsView.tsx` (+ `PeriodSelector.tsx` si limita)
- Eliminar cualquier `max={currentMonthKey()}` o `disabled` por fecha futura en el selector de mes/año. Permitir cualquier mes/año.

### 7. Reportes de meses futuros (proyecciones)
**Archivos:** `src/views/ReportsView.tsx`, `src/lib/pdf.ts`
- Si el `monthKey` seleccionado no existe en `state.months`, construir un mes virtual con líneas vacías y `real = 0` (sin escribir al estado).
- Mostrar tabla con columnas Planificado (del mes solicitado si existe; si no, 0) y Real = $0.00; no colapsar UI.
- En `lib/pdf.ts`: aceptar el mes virtual y renderizar igual. Etiquetar el encabezado del PDF como "Proyección" cuando `monthKey > currentMonthKey()`.

### 8. Exportar CSV en `/reportes`
**Archivos:** `src/views/ReportsView.tsx`, nuevo `src/lib/csv.ts`
- Añadir botón "Exportar CSV" junto a "Descargar PDF".
- `csv.ts`: helper `toCSV(rows, headers)` con escape de comas/comillas/salto de línea (RFC 4180), BOM UTF-8 para Excel.
- Exportar exactamente los datos visibles (mismas filas/orden/filtros) con columnas: Fecha, Tipo, Monto, Nota + fila final "Total" con la suma de Monto.
- Nombre de archivo: `reporte-{seccion}-{monthKey}.csv`.

### 9. Saludo con exclamaciones
**Archivo:** `src/i18n/strings.ts`
- ES: `"¡Hola, {name}! Me encanta que estés por aquí..."` y fallback `"¡Hola! Me encanta que estés por aquí..."`.
- EN equivalente con signos (`"Hi, {name}! ..."`).

### Archivos

**Modificados:** `src/components/CloseMonthDialog.tsx`, `src/components/charts/DebtsBarChart.tsx`, `src/store/useApp.ts`, `src/views/DebtsView.tsx`, `src/views/ReportsView.tsx`, `src/views/ShieldsView.tsx` (extraer/reutilizar diálogo de creación), `src/lib/pdf.ts`, `src/i18n/strings.ts`, posiblemente `src/components/PeriodSelector.tsx`.

**Nuevos:** `src/lib/csv.ts`, posiblemente `src/components/NewShieldDialog.tsx` (si hay que extraerlo desde `ShieldsView`).

### Notas
- Sin cambios en tipos del store (todo se deriva de datos existentes).
- El feed unificado de reportes se computa en memoria al renderizar; no se persisten duplicados.
- Proyecciones no mutan el estado; sólo se renderizan.
