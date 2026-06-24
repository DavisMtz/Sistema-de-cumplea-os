 /**
 * SCRIPT DE AUTOMATIZACIÓN DE CUMPLEAÑOS – EQUIPO VENTEL
 * Versión: 1.1 (Configuración Avanzada)
 * Autor Original: David Martínez Arredondo
 * Mejoras: Rendimiento de lectura en lote, Configuración centralizada, Diseño de Email Moderno, Modo Prueba.
 */

// 1. CONFIGURACIÓN CENTRALIZADA (Fácil de mantener)
const CONFIG = {
  // ==========================================
  // ⚙️ MODO PRUEBA (Evita enviar correos al equipo durante pruebas)
  // ==========================================
  modoPrueba: false, // Cámbialo a 'true' para que todos los correos te lleguen solo a ti
  correoDesarrollador: "dmartineza02@liverpool.com.mx",

  hojas: {
    respuestas: "Respuestas de formulario 1",
    proximos: "Proximos"
  },
  
  // Días exactos antes del cumpleaños para enviar recordatorio
  diasAviso: [10, 3, 1],

  destinatarios: [
    "eacastrog@liverpool.com.mx",   // Elida Alejandra Castro Holguín – Supervisora
    "ygchaveza@liverpool.com.mx",   // Gisel Chavez Albarado – Supervisora
    "encabarantep@liverpool.com.mx",// Eduardo Neftalí Caravantes – Apoyo Administrativo
    "dgaribayo@liverpool.com.mx",   // David Garibay – Team Leader 
    "dmartineza02@liverpool.com.mx",// David Martínez Arredondo – Apoyo
    "marodriguc02@liverpool.com.mx",// Mitzi Adalid Rodríguez Carbajal – Posible organizadora
    "ajrodriguezq@liverpool.com.mx",// Alejandra Jacaranday Rodriguez Quiroz - Posible organizadora
    "agcampuzanoe@liverpool.com.mx",// Andrea campuzano - Posible organizadora
    "alleong@liverpool.com.mx"      // Airam Lizeth León Gómez – Apoyo Administrativo
  ],
  
  correosConLeyenda: [
    "eacastrog@liverpool.com.mx",
    "dmartineza02@liverpool.com.mx",
    "marodriguc02@liverpool.com.mx"
  ],
  
  // ==========================================
  // 🎨 DISEÑO Y MARCA CORPORATIVA
  // ==========================================
  marca: {
    nombreRemitente: "Notificaciones VENTEL",
    logoURL: "https://assetspwa.liverpool.com.mx/assets/digital/mailings/img/liv_w.png",
    // (Opcional) URLs alojadas de los íconos SVG/PNG para compatibilidad total
    // con Gmail/Outlook. Si se dejan vacías, se usan los SVG inline de Plantillas.gs.
    // Sube los archivos de /assets/icons al CDN y pega aquí sus URLs.
    iconosURL: {
      // telefono: "", color: "", pastel: "", comida: "",
      // regalo: "", comentario: "", calendario: "", divisor: ""
    },
    // Responsable técnico (se muestra en el pie de todos los correos)
    responsable: {
      nombre: "David Martínez Arredondo",
      rol: "Apoyo / Asesor de Ventas – VENTEL",
      correo: "dmartineza02@liverpool.com.mx"
    },
    colores: {
      primario: "#E10098", // Rosa Institucional Liverpool
      secundario: "#2B2B2B", // Gris Oscuro para contrastes elegantes
      acento: "#FF00A0", // Rosa brillante para botones
      fondo: "#F3F4F6", // Gris extra claro para el fondo del correo
      textoTitulo: "#111827", // Casi negro para legibilidad
      textoCuerpo: "#4B5563" // Gris medio para lectura cómoda
    }
  },

  // Nombres de meses en español (compartido por todo el sistema)
  meses: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
};

// ============================================================================
// FUNCIÓN PRINCIPAL
// ============================================================================
function encontrarProximoCumpleaños() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const hojaRespuestas = libro.getSheetByName(CONFIG.hojas.respuestas);
  const hojaProximos = libro.getSheetByName(CONFIG.hojas.proximos);
  
  // OPTIMIZACIÓN: Leer todos los datos en una sola llamada a la API
  const ultimaFila = hojaRespuestas.getLastRow();
  if (ultimaFila < 2) return; // No hay datos
  
  // Obtenemos desde B2 hasta M[ultimaFila]
  const rangoDatos = hojaRespuestas.getRange(2, 2, ultimaFila - 1, 12).getValues();
  
  const hoy = new Date();
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  
  let listaCumpleaneros = [];
  let cumpleHoy = [];

  // Mapear los datos procesados
  rangoDatos.forEach((fila, index) => {
    // Índices del array basados en la columna B=0, C=1, D=2...
    const datos = {
      index: index,
      filaSheet: index + 2,
      nombre: fila[0],         // B
      color: fila[2],          // D
      eleccion: fila[3],       // E
      sabor: fila[4],          // F
      dinamica: fila[6],       // H
      comentario: fila[8],     // J
      dia: parseInt(fila[9], 10),  // K
      mes: parseInt(fila[10], 10) - 1, // L
      telefono: fila[11]       // M
    };

    if (isNaN(datos.dia) || isNaN(datos.mes)) return;

    let fechaCumple = new Date(hoy.getFullYear(), datos.mes, datos.dia);
    if (fechaCumple < hoySinHora) {
      fechaCumple.setFullYear(hoy.getFullYear() + 1);
    }

    const diferencia = Math.ceil((fechaCumple - hoySinHora) / (1000 * 60 * 60 * 24));
    datos.diasRestantes = diferencia;
    datos.fechaObject = fechaCumple;
    datos.mesTexto = fechaCumple.toLocaleString('es-ES', { month: 'long' });

    if (diferencia === 0) cumpleHoy.push(datos);
    if (diferencia > 0 && diferencia <= 30) listaCumpleaneros.push(datos);
  });

  // Ordenar próximos cumpleaños
  listaCumpleaneros.sort((a, b) => a.diasRestantes - b.diasRestantes);

  // Procesar cumpleaños de HOY (envía correo festivo al equipo)
  cumpleHoy.forEach(persona => enviarCorreoHoy(persona));

  // Procesar PRÓXIMOS cumpleaños (envía recordatorio en los días configurados)
  listaCumpleaneros.forEach(persona => {
    if (CONFIG.diasAviso.includes(persona.diasRestantes)) {
      enviarCorreoMotivador(persona);
    }
  });

  // Dibujar el tablero visual en la hoja "Proximos"
  // (HOY se muestra primero, luego los próximos ordenados por cercanía)
  const agenda = cumpleHoy.concat(listaCumpleaneros);
  actualizarDashboard(agenda);
}

// ============================================================================
// ENVÍO DE CORREOS (DISEÑO MODERNO INSTITUCIONAL)
// ============================================================================

function enviarCorreoMotivador(persona) {
  const asuntoBase = "Recordatorio · Próximo cumpleaños en VENTEL";
  const asunto = CONFIG.modoPrueba ? `[PRUEBA] ${asuntoBase}` : asuntoBase;
  
  const incluirLeyenda = persona.filaSheet >= 2 && persona.filaSheet <= 20;
  const renderHTML = (mostrarLeyenda) => construirCorreoMotivador(persona, mostrarLeyenda);

  let destinatariosLeyenda = [];
  let destinatariosNormales = [];

  CONFIG.destinatarios.forEach(dest => {
    if (incluirLeyenda && CONFIG.correosConLeyenda.includes(dest)) {
      destinatariosLeyenda.push(dest);
    } else {
      destinatariosNormales.push(dest);
    }
  });

  const bccLeyenda = CONFIG.modoPrueba ? CONFIG.correoDesarrollador : destinatariosLeyenda.join(",");
  const bccNormales = CONFIG.modoPrueba ? CONFIG.correoDesarrollador : destinatariosNormales.join(",");

  if (destinatariosLeyenda.length > 0) {
    MailApp.sendEmail({
      to: "noreply@liverpool.com.mx", bcc: bccLeyenda, subject: asunto,
      htmlBody: renderHTML(true), name: CONFIG.marca.nombreRemitente
    });
  }

  if (destinatariosNormales.length > 0) {
    MailApp.sendEmail({
      to: "noreply@liverpool.com.mx", bcc: bccNormales, subject: asunto,
      htmlBody: renderHTML(false), name: CONFIG.marca.nombreRemitente
    });
  }
}

/**
 * Construye el HTML del recordatorio (monocromático minimalista).
 * Separado del envío para poder generar vistas previas sin enviar correos.
 */
function construirCorreoMotivador(persona, mostrarLeyenda) {
  const C = CONFIG.marca.colores;
  const plural = persona.diasRestantes > 1 ? "s" : "";

  let fraseDias = "";
  if (persona.diasRestantes === 10) {
    fraseDias = "Aún hay tiempo de planear algo especial.";
  } else if (persona.diasRestantes === 3) {
    fraseDias = "Ya casi es el día. Afinando los últimos detalles.";
  } else if (persona.diasRestantes === 1) {
    fraseDias = "Mañana es el gran día. No lo dejemos pasar.";
  }

  return envolturaLiverpool({
    pie: "Cultura y cercanía VENTEL.",
    contenido: `
        ${etiquetaSeccion("Próximo cumpleaños")}
        <h2 style="color: ${C.textoTitulo}; margin: 0 0 28px 0; font-size: 24px; font-weight: 600; line-height: 1.3;">
          Preparémonos para celebrar
        </h2>

        <!-- Contador tipográfico monocromático -->
        <div style="margin: 0 0 4px 0;">
          <span style="font-size: 52px; font-weight: 600; line-height: 1; color: ${C.primario};">${persona.diasRestantes}</span>
          <span style="font-size: 13px; font-weight: 600; letter-spacing: 1.4px; text-transform: uppercase; color: #9CA3AF; margin-left: 8px;">día${plural} para el festejo</span>
        </div>
        ${fraseDias ? `<p style="margin: 0 0 30px 0; font-size: 14px; color: ${C.textoCuerpo}; line-height: 1.6;">${fraseDias}</p>` : `<div style="height: 24px;"></div>`}

        <!-- Festejado: línea fina, sin caja -->
        <div style="border-top: 1px solid #F0F0F0; padding-top: 24px;">
          <p style="margin: 0; font-size: 16px; color: ${C.textoTitulo}; line-height: 1.6;">
            <strong style="font-weight: 600;">${persona.nombre}</strong> cumple años el ${persona.dia} de ${persona.mesTexto}.
          </p>
        </div>

        <div style="margin-top: 34px;">
          ${etiquetaSeccion("Preferencias")}
        </div>
        ${generarDetallesHTML(persona)}

        ${mostrarLeyenda ? `
        <p style="margin: 28px 0 0; padding-left: 14px; border-left: 2px solid ${C.primario}; font-size: 13px; color: ${C.textoCuerpo}; line-height: 1.6;">
          Este integrante pertenece al Equipo Alejandra Castro — Ventas.
        </p>` : ""}
    `
  });
}

function enviarCorreoHoy(persona) {
  const asuntoBase = `Hoy celebramos a ${persona.nombre} · VENTEL`;
  const asunto = CONFIG.modoPrueba ? `[PRUEBA] ${asuntoBase}` : asuntoBase;
  
  const bccDestinatarios = CONFIG.modoPrueba ? CONFIG.correoDesarrollador : CONFIG.destinatarios.join(",");

  MailApp.sendEmail({
    to: "noreply@liverpool.com.mx",
    bcc: bccDestinatarios,
    subject: asunto,
    htmlBody: construirCorreoHoy(persona),
    name: CONFIG.marca.nombreRemitente
  });
}

/**
 * Construye el HTML del correo "Hoy celebramos" (minimalista).
 * Separado del envío para poder generar vistas previas sin enviar correos.
 */
function construirCorreoHoy(persona) {
  const fechaHoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd 'de' MMMM 'de' yyyy");
  const C = CONFIG.marca.colores;

  return envolturaLiverpool({
    paddingHeader: "40px 20px 34px",
    headerExtra: `
        <div style="color: rgba(255,255,255,0.85); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin: 26px 0 12px;">Día especial VENTEL</div>
        <h1 style="color: #ffffff; margin: 0; font-size: 30px; font-weight: 600; line-height: 1.25;">
          Felicidades, ${persona.nombre}
        </h1>`,
    contenido: `
        ${etiquetaSeccion(fechaHoy)}
        <p style="font-size: 16px; color: ${C.textoCuerpo}; margin: 14px 0 0 0; line-height: 1.7;">
          Hoy celebramos tu vida y todo el valor que aportas al equipo. Un detalle,
          una sonrisa o un simple mensaje hacen la diferencia.
        </p>

        <div style="margin-top: 36px;">
          ${etiquetaSeccion("Para consentirle hoy")}
        </div>
        ${generarDetallesHTML(persona)}

        <div style="margin: 40px 0 4px;">
          <a href="mailto:${persona.nombre.replace(/\s+/g, '.').toLowerCase()}@liverpool.com.mx"
             style="color: ${C.primario}; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; padding-bottom: 4px; border-bottom: 1.5px solid ${C.primario};">
             Enviar felicitación &rarr;
          </a>
        </div>
    `
  });
}
