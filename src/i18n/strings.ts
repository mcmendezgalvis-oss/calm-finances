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
  dashboard: Record<string, string> & { greetingTemplate: string; greetingFallback: string };
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
    totalRow: string;
  };
  toasts: {
    goConfigureDebt: string;
    goConfigureShield: string;
    goButtonDebts: string;
    goButtonShields: string;
  };
  emergency: {
    title: string;
    intro: string;
    level1: string;
    level2: string;
    level3: string;
    progressTo: string;
    customGoals: string;
  };
  groupHelp: Record<"income" | "muros" | "debts" | "generosity" | "lifestyle" | "future", string>;
  snowball: {
    coach: string;
    asOf: string;
    currentBalance: string;
  };
  categoryPicker: {
    chooseCategory: string;
    customLabel: string;
    customPlaceholder: string;
    confirm: string;
  };
  trophies: {
    title: string;
    subtitle: string;
    empty: string;
    nav: string;
  };
  dashboardPeriod: {
    prev: string;
    next: string;
    mode: string;
  };
  closeMonth: {
    closeBtn: string;
    reopenBtn: string;
    closed: string;
    blockedNegative: string;
    positiveTitle: string;
    positiveCopy: string;
    optDebt: string;
    optShield: string;
    optCarry: string;
    zeroTitle: string;
    zeroCopy: string;
    confirmClose: string;
    reopenTitle: string;
    reopenCopy: string;
    reopenContinue: string;
    reopenRestore: string;
    nextCarryBlocked: string;
    incomeChain: string;
  };
  deleteGoal: {
    btn: string;
    confirmTitle: string;
    confirmCopy: string;
    confirmCta: string;
    blockedTitle: string;
    blockedCopy: string;
    archive: string;
    forceDelete: string;
    forceConfirm: string;
    archivedToast: string;
    deletedToast: string;
    archivedSection: string;
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
      greetingTemplate: "Hola, {name}. Me encanta que estés por aquí — vamos a ponerle intención a nuestro dinero.",
      greetingFallback: "Hola, bienvenida. Me encanta que estés por aquí — vamos a ponerle intención a nuestro dinero.",
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
      totalRow: "TOTAL",
    },
    toasts: {
      goConfigureDebt: "Primero demos forma a esta deuda con calma. Te llevamos a Adiós a las Cadenas para configurarla y luego volverá a aparecer aquí.",
      goConfigureShield: "Primero demos forma a este escudo con calma. Te llevamos a Mis Escudos para configurarlo y luego volverá a aparecer aquí.",
      goButtonDebts: "Ir a Deudas",
      goButtonShields: "Ir a Escudos",
    },
    emergency: {
      title: "Fondo de Emergencia",
      intro: "Tu refugio crece por etapas: primero $1,000 de tranquilidad, luego 1–3 meses de gastos esenciales, y finalmente 3–6 meses para vivir en calma.",
      level1: "Nivel 1 · Escudo Inicial",
      level2: "Nivel 2 · 1–3 meses de gastos",
      level3: "Nivel 3 · 3–6 meses de gastos",
      progressTo: "Hacia",
      customGoals: "Metas personalizadas",
    },
    groupHelp: {
      income: "Todo lo que entra a tu hogar este mes. Registrar tus ingresos con claridad es el primer paso para asignarlos con intención.",
      muros: "Los 4 Muros son lo esencial para vivir en paz: vivienda, servicios, comida y transporte esencial. Tu hipoteca vive aquí.",
      debts: "Pagos enfocados a tus deudas siguiendo la Bola de Nieve: la deuda más pequeña primero, mínimos en las demás. La hipoteca NO se incluye aquí; ese pago va en 'Vivienda' dentro de los 4 Muros, ya que es tu refugio esencial.",
      generosity: "Dar también es parte de tu bienestar financiero. Diezmo, ofrenda, regalos: lo que ofreces con el corazón.",
      lifestyle: "Lo que disfrutas: restaurantes, suscripciones, ropa, hobbies. Vivir bien también es parte del plan.",
      future: "Tu yo del futuro lo agradecerá: retiro, inversiones, metas de ahorro y el Fondo de Emergencia.",
    },
    snowball: {
      coach: "Ataca la deuda menor y mantén el pago mínimo en las demás hasta liberarla.",
      asOf: "al",
      currentBalance: "Saldo Actual",
    },
    categoryPicker: {
      chooseCategory: "Elige una categoría",
      customLabel: "Nombre personalizado",
      customPlaceholder: "Escribe el nombre",
      confirm: "Agregar",
    },
    trophies: {
      title: "Salón de la Fama",
      subtitle: "Cada logro es una raíz más profunda en tu paz financiera.",
      empty: "Aún no hay logros registrados. Sigue cuidando tu plan con calma.",
      nav: "Logros",
    },
    dashboardPeriod: {
      prev: "Anterior",
      next: "Siguiente",
      mode: "Vista",
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
      totalRow: "TOTAL",
    },
    toasts: {
      goConfigureDebt: "Let's shape this debt with calm first. We'll take you to Goodbye to Chains to set it up — it'll show up here afterwards.",
      goConfigureShield: "Let's shape this shield with calm first. We'll take you to My Shields to set it up — it'll show up here afterwards.",
      goButtonDebts: "Go to Debts",
      goButtonShields: "Go to Shields",
    },
    emergency: {
      title: "Emergency Fund",
      intro: "Your refuge grows in stages: first $1,000 of calm, then 1–3 months of essentials, and finally 3–6 months to truly live in peace.",
      level1: "Level 1 · Starter Shield",
      level2: "Level 2 · 1–3 months of essentials",
      level3: "Level 3 · 3–6 months of essentials",
      progressTo: "Toward",
      customGoals: "Custom goals",
    },
    groupHelp: {
      income: "Everything coming into your home this month. Tracking income clearly is the first step to assigning it with intention.",
      muros: "Your 4 Walls are the essentials: housing, utilities, groceries and essential transport. Your mortgage lives here.",
      debts: "Debt payments using the Snowball method: smallest debt first, minimums on the rest. The mortgage does NOT belong here; its payment goes under 'Housing' inside the 4 Walls — it's your essential refuge.",
      generosity: "Giving is part of your financial wellbeing too. Tithe, offerings, gifts: whatever you give from the heart.",
      lifestyle: "What you enjoy: dining out, subscriptions, clothing, hobbies. Living well is part of the plan.",
      future: "Your future self will thank you: retirement, investments, savings goals and the Emergency Fund.",
    },
    snowball: {
      coach: "Attack the smallest debt and keep minimum payments on the rest until it's gone.",
      asOf: "as of",
      currentBalance: "Current Balance",
    },
    categoryPicker: {
      chooseCategory: "Choose a category",
      customLabel: "Custom name",
      customPlaceholder: "Type a name",
      confirm: "Add",
    },
    trophies: {
      title: "Hall of Fame",
      subtitle: "Every milestone is a deeper root in your financial peace.",
      empty: "No trophies yet. Keep nurturing your plan with calm.",
      nav: "Trophies",
    },
    dashboardPeriod: {
      prev: "Previous",
      next: "Next",
      mode: "View",
    },
    months: [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December",
    ],
  },
};

export type Strings = DictShape;