export type Lang = "es" | "en";

type DictShape = {
  appName: string;
  tagline: string;
  nav: Record<"dashboard" | "budget" | "shields" | "debts" | "settings", string>;
  budget: {
    title: string; tabs: { plan: string; real: string; diff: string };
    unassigned: string; assignNow: string; zeroBased: string; copyPrev: string;
    addLine: string; addCategoryLine: string; planned: string; real: string;
    difference: string; empathy: string; lineName: string;
    groups: Record<"income"|"muros"|"debts"|"generosity"|"lifestyle"|"future", string>;
    personalizedPlan: string; remove: string;
  };
  shields: Record<string, string>;
  debts: Record<string, string>;
  dashboard: Record<string, string>;
  settings: Record<string, string>;
  paywall: Record<string, string>;
  pwa: Record<string, string>;
  common: Record<string, string>;
  reports: {
    title: string;
    subtitle: string;
    period: Record<"month" | "year" | "custom", string>;
    shortcuts: Record<"last30" | "thisMonth" | "lastMonth" | "ytd", string>;
    from: string;
    to: string;
    type: string;
    typeBudget: string;
    typeDebt: string;
    typeShield: string;
    selectEntity: string;
    download: string;
    noData: string;
    history: string;
  };
  toasts: {
    goConfigureDebt: string;
    goConfigureShield: string;
    goButtonDebts: string;
    goButtonShields: string;
  };
  months: string[];
};

export const dict: Record<Lang, DictShape> = {
  es: {
    appName: "Finanzas en Calma",
    tagline: "Tu paz financiera comienza con una intención clara.",
    nav: {
      dashboard: "Mi Calma",
      budget: "Presupuesto",
      shields: "Mis Escudos",
      debts: "Adiós a las Cadenas",
      settings: "Ajustes",
    },
    budget: {
      title: "Presupuesto",
      tabs: { plan: "Mi Plan", real: "Mi Realidad", diff: "Mi Calma" },
      unassigned: "Dinero Sin Asignar",
      assignNow: "Asignar ahora",
      zeroBased: "Base Cero",
      copyPrev: "Copiar el plan del mes anterior",
      addLine: "+ Agregar línea",
      addCategoryLine: "+ Agregar línea",
      planned: "Planeado",
      real: "Real",
      difference: "Diferencia",
      empathy: "Este número no es bueno ni malo, es solo información clara para empezar a tomar el control con calma.",
      lineName: "Nombre",
      groups: {
        income: "Tus Ingresos",
        muros: "Los 4 Muros",
        debts: "Pago de Deudas",
        generosity: "Generosidad",
        lifestyle: "Estilo de Vida y Otros",
        future: "Inversión y Futuro",
      },
      personalizedPlan: "Plan personalizado para este mes",
      remove: "Quitar",
    },
    shields: {
      title: "Mis Escudos",
      subtitle: "Tu refugio en cada estación.",
      initial: "Escudo Inicial",
      initialDesc: "Un primer fondo de paz: $1,000 USD",
      definitive: "Escudo Definitivo",
      definitiveDesc: "De 3 a 6 meses de Los 4 Muros",
      definitiveLocked: "Completa tu Escudo Inicial y paga tus deudas para desbloquearlo.",
      add: "+ Crear Nuevo Escudo",
      addFunds: "Agregar fondos",
      withdraw: "Utilizar dinero del Escudo",
      goal: "Meta",
      saved: "Ahorrado",
      complete: "Completado",
      target: "Meta",
      historyTitle: "Historial",
      shieldCreatedToast: "¡Listo! Hemos agregado tu nuevo Escudo al presupuesto de este mes para que puedas asignarle dinero con intención.",
      newShieldName: "Nombre del escudo",
      newShieldGoal: "Meta ($)",
      create: "Crear escudo",
      cancel: "Cancelar",
      confirmDelete: "¿Eliminar este escudo? Sus aportes seguirán registrados en tu presupuesto.",
    },
    debts: {
      title: "Adiós a las Cadenas",
      subtitle: "Una a la vez, con calma.",
      add: "+ Registrar deuda",
      myTarget: "Mi Blanco Actual",
      paid: "Pagada",
      name: "Nombre",
      initial: "Saldo Inicial",
      min: "Pago Mínimo",
      current: "Saldo Actual",
      bankAdjust: "Ajuste con el Banco",
      bankAdjustDesc: "Actualiza el saldo según tu estado de cuenta (intereses, cargos, etc.)",
      adjustSave: "Guardar ajuste",
      newAmount: "Nuevo saldo",
      create: "Agregar deuda",
      celebration: "¡Una cadena menos! Su pago mínimo se sumará a tu siguiente blanco.",
      confirmDelete: "¿Eliminar esta deuda?",
    },
    dashboard: {
      title: "Mi Dashboard de Paz",
      greeting: "Hola",
      destination: "El Destino de mis Ingresos",
      evolution: "Evolución Mensual",
      debtCurve: "El Derrumbe de las Deudas",
      shieldsGrowth: "Crecimiento de mis Escudos",
      income: "Ingresos",
      expenses: "Gastos",
      noHistoryYet: "Aún no hay suficiente historia. Sigue registrando con calma.",
      downloadReport: "Descargar Reporte en Calma (PDF)",
      reportMonth: "Reporte del mes actual",
      reportYear: "Resumen del año financiero",
    },
    settings: {
      title: "Ajustes",
      profile: "Tu Perfil",
      name: "Nombre",
      language: "Idioma",
      redeem: "Canjear código de regalo",
      redeemDesc: "Si tienes el código de tu libro, ingresa aquí para activar tus 30 días.",
      redeemPlaceholder: "Tu código",
      redeemBtn: "Activar 30 días",
      currentPlan: "Plan actual",
      planFree: "Cimientos (gratis)",
      planPremium: "Ruta Completa",
      premiumBannerActive: "Disfrutando de tus 30 días de regalo de la Ruta Completa — quedan {days} días",
      resetAll: "Borrar todos mis datos",
      resetConfirm: "Esto borrará permanentemente tus presupuestos, escudos y deudas. ¿Continuar?",
      currency: "Moneda",
    },
    paywall: {
      title: "Ruta Completa a la Libertad",
      copy: "¡Estás haciendo un trabajo maravilloso con tu presupuesto! Para empezar a derrumbar tus deudas con el método Bola de Nieve y activar todos tus Escudos Protectores, desbloquea la Ruta Completa a la Libertad Financiera.",
      activate: "Activar mi código de regalo",
      close: "Volver al presupuesto",
      readOnly: "Modo solo lectura",
    },
    pwa: {
      banner: "Lleva tu calma a todas partes. Añade esta app a tu pantalla de inicio.",
      install: "Instalar",
      iosStep1: "Toca",
      iosStep2: "Compartir",
      iosStep3: "y luego \"Agregar a la pantalla de inicio\".",
      dismiss: "Ahora no",
    },
    common: {
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      total: "Total",
      amount: "Monto",
      note: "Nota",
    },
    reports: {
      title: "Reportes en Calma",
      subtitle: "Descarga tu historia financiera en el formato que necesitas.",
      period: { month: "Mes", year: "Año", custom: "Personalizado" },
      shortcuts: { last30: "Últimos 30 días", thisMonth: "Este mes", lastMonth: "Mes pasado", ytd: "Año en curso" },
      from: "Desde",
      to: "Hasta",
      type: "Tipo de reporte",
      typeBudget: "Presupuesto vs Real",
      typeDebt: "Detalle por Deuda",
      typeShield: "Movimientos por Fondo",
      selectEntity: "Selecciona",
      download: "Descargar PDF",
      noData: "Aún no hay datos para el periodo seleccionado.",
      history: "Historial",
    },
    toasts: {
      goConfigureDebt: "Primero demos forma a esta deuda con calma. Te llevamos a Adiós a las Cadenas para configurarla y luego volverá a aparecer aquí.",
      goConfigureShield: "Primero demos forma a este escudo con calma. Te llevamos a Mis Escudos para configurarlo y luego volverá a aparecer aquí.",
      goButtonDebts: "Ir a Deudas",
      goButtonShields: "Ir a Escudos",
    },
    months: [
      "Enero","Febrero","Marzo","Abril","Mayo","Junio",
      "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
    ],
  },
  en: {
    appName: "Finance in Calm",
    tagline: "Your financial peace begins with a clear intention.",
    nav: {
      dashboard: "My Calm",
      budget: "Budget",
      shields: "My Shields",
      debts: "Goodbye to Chains",
      settings: "Settings",
    },
    budget: {
      title: "Budget",
      tabs: { plan: "My Plan", real: "My Reality", diff: "My Calm" },
      unassigned: "Money to Assign",
      assignNow: "Assign now",
      zeroBased: "Zero-Based",
      copyPrev: "Copy last month's plan",
      addLine: "+ Add line",
      addCategoryLine: "+ Add line",
      planned: "Planned",
      real: "Real",
      difference: "Difference",
      empathy: "This number is not good or bad — it's just clear information to start taking control with calm.",
      lineName: "Name",
      groups: {
        income: "Your Income",
        muros: "The 4 Walls",
        debts: "Debt Payments",
        generosity: "Generosity",
        lifestyle: "Lifestyle & Others",
        future: "Investing & Future",
      },
      personalizedPlan: "Personalized plan for this month",
      remove: "Remove",
    },
    shields: {
      title: "My Shields",
      subtitle: "Your refuge in every season.",
      initial: "Starter Shield",
      initialDesc: "A first peace fund: $1,000 USD",
      definitive: "Full Shield",
      definitiveDesc: "3 to 6 months of your 4 Walls",
      definitiveLocked: "Complete your Starter Shield and pay off your debts to unlock it.",
      add: "+ Create New Shield",
      addFunds: "Add funds",
      withdraw: "Use shield funds",
      goal: "Goal",
      saved: "Saved",
      complete: "Complete",
      target: "Goal",
      historyTitle: "History",
      shieldCreatedToast: "Done! We've added your new Shield to this month's budget so you can fund it with intention.",
      newShieldName: "Shield name",
      newShieldGoal: "Goal ($)",
      create: "Create shield",
      cancel: "Cancel",
      confirmDelete: "Delete this shield? Its contributions remain in your budget history.",
    },
    debts: {
      title: "Goodbye to Chains",
      subtitle: "One at a time, with calm.",
      add: "+ Add debt",
      myTarget: "My Current Target",
      paid: "Paid",
      name: "Name",
      initial: "Starting Balance",
      min: "Minimum Payment",
      current: "Current Balance",
      bankAdjust: "Bank Adjustment",
      bankAdjustDesc: "Update the balance based on your statement (interest, fees, etc.)",
      adjustSave: "Save adjustment",
      newAmount: "New balance",
      create: "Add debt",
      celebration: "One chain less! Its minimum payment now joins your next target.",
      confirmDelete: "Delete this debt?",
    },
    dashboard: {
      title: "My Peace Dashboard",
      greeting: "Hello",
      destination: "Where my Income Goes",
      evolution: "Monthly Evolution",
      debtCurve: "Debt Collapse",
      shieldsGrowth: "Shield Growth",
      income: "Income",
      expenses: "Expenses",
      noHistoryYet: "Not enough history yet. Keep tracking with calm.",
      downloadReport: "Download Calm Report (PDF)",
      reportMonth: "This month's report",
      reportYear: "Yearly summary",
    },
    settings: {
      title: "Settings",
      profile: "Your Profile",
      name: "Name",
      language: "Language",
      redeem: "Redeem gift code",
      redeemDesc: "If you have your book code, enter it here to activate your 30 days.",
      redeemPlaceholder: "Your code",
      redeemBtn: "Activate 30 days",
      currentPlan: "Current plan",
      planFree: "Foundations (free)",
      planPremium: "Full Path",
      premiumBannerActive: "Enjoying your 30-day gift of the Full Path — {days} days left",
      resetAll: "Erase all my data",
      resetConfirm: "This will permanently delete your budgets, shields and debts. Continue?",
      currency: "Currency",
    },
    paywall: {
      title: "The Full Path to Freedom",
      copy: "You're doing wonderful work with your budget! To start tearing down your debts with the Snowball method and activate all your Protective Shields, unlock the Full Path to Financial Freedom.",
      activate: "Activate my gift code",
      close: "Back to budget",
      readOnly: "Read-only mode",
    },
    pwa: {
      banner: "Take your calm everywhere. Add this app to your home screen.",
      install: "Install",
      iosStep1: "Tap",
      iosStep2: "Share",
      iosStep3: "then \"Add to Home Screen\".",
      dismiss: "Not now",
    },
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      total: "Total",
      amount: "Amount",
      note: "Note",
    },
    reports: {
      title: "Calm Reports",
      subtitle: "Download your financial story in the format you need.",
      period: { month: "Month", year: "Year", custom: "Custom" },
      shortcuts: { last30: "Last 30 days", thisMonth: "This month", lastMonth: "Last month", ytd: "Year to date" },
      from: "From",
      to: "To",
      type: "Report type",
      typeBudget: "Budget vs Actual",
      typeDebt: "Debt detail",
      typeShield: "Shield movements",
      selectEntity: "Select",
      download: "Download PDF",
      noData: "No data yet for the selected period.",
      history: "History",
    },
    toasts: {
      goConfigureDebt: "Let's shape this debt with calm first. We'll take you to Goodbye to Chains to set it up — it'll show up here afterwards.",
      goConfigureShield: "Let's shape this shield with calm first. We'll take you to My Shields to set it up — it'll show up here afterwards.",
      goButtonDebts: "Go to Debts",
      goButtonShields: "Go to Shields",
    },
    months: [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December",
    ],
  },
};

export type Strings = DictShape;