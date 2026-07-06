## Cambios a implementar

### 1. "Empezar de cero" respeta el sobrante del mes anterior
En `src/store/useApp.ts`, dentro de `resetPlan` y `resetActual`, excluir del reseteo las líneas de ingreso cuyo nombre sea "sobrante mes anterior" / "previous month surplus" (misma regla que ya usa `copyFromPrevious`). El resto de líneas se ponen a 0 como hasta ahora.

### 2. Persistencia del mes activo en Presupuesto
En `src/views/BudgetView.tsx`:
- Inicializar `monthKey` desde `localStorage.getItem("budget:lastMonthKey")`, con fallback a `currentMonthKey()`.
- En un `useEffect`, guardar en `localStorage` cada vez que cambia el mes seleccionado.
- La pestaña sigue arrancando siempre en `"plan"` (ya es el valor inicial de `useState<BudgetTab>("plan")`, se confirma que no se persiste).

### 3. Fecha correcta del histórico de deudas al inyectar desde el presupuesto
El bug está en que se guarda `new Date().toISOString()` (hoy real) en vez de la fecha del mes del presupuesto. En `src/store/useApp.ts`:
- Añadir helper `firstOfMonthKeyISO(monthKey)` que devuelve el ISO del día 1 de ese mes.
- En `reconcileBudgetSourceForMonth`, usar esa fecha para los nuevos `DebtAdjustment` y `ShieldTx` con `source: "budget"` (en lugar de `now`).
- En `updateLine`, cuando el cambio proviene de una línea vinculada (`linkedDebtId` / `linkedShieldId`), usar también la fecha del `monthKey` del presupuesto activo, no `new Date()`.
- Los ajustes manuales (registrados desde la vista Deudas/Escudos) siguen usando la fecha real / la fecha que elija el usuario.

### 4. Dashboard: sincronización reactiva de deudas + un selector por gráfico

**Sincronización del gráfico de deudas** (`src/components/charts/DebtsBarChart.tsx`):
- Cambiar el cálculo para que la barra del mes "actual del calendario" y meses futuros muestren `dbt.currentBalance` (el "Saldo Actual" editable), en lugar del saldo reconstruido a partir de `adjustments`. Los meses pasados siguen reconstruyéndose desde `initialBalance + adjustments <= fin de mes`.
- Como `currentBalance` ya está en el store zustand y el componente lo lee vía selector, editarlo en la vista de Deudas provoca re-render inmediato.

**Selectores de año independientes por gráfico**:
- Quitar el `DashboardPeriodSelector` global "sticky" de `src/views/Dashboard.tsx` (y su bloque envolvente).
- `IncomeDestinationPie` ya tiene su propio selector de mes+año — dejarlo como está.
- Añadir en `Dashboard.tsx` un `useState` local `evolutionYear` y renderizar un dropdown de año encima del gráfico de Evolución mensual. Pasar ese año al `useMemo` de `evolutionData`.
- En `DebtsBarChart`, convertir el prop `year` a estado interno (con su propio dropdown de año en la cabecera del `<section>`). Ya no recibirá `year` desde el Dashboard.
- Todos los selectores usan el mismo rango (año actual ±2/±5) para consistencia visual.

### Notas técnicas

- No se toca la base de datos: los cambios de fecha solo afectan al valor `date` guardado en `debt_adjustments` / `shield_tx`, ya soportado por el esquema actual.
- El helper `isCarryLineName` ya existe implícito en `copyFromPrevious`; se extraerá a función reusable dentro del archivo.
- No se altera el layout de tabs ni la lógica de "Copiar mes anterior" / "Empezar de cero" recién ajustada.

### Archivos que se modificarán
- `src/store/useApp.ts`
- `src/views/BudgetView.tsx`
- `src/views/Dashboard.tsx`
- `src/components/charts/DebtsBarChart.tsx`
