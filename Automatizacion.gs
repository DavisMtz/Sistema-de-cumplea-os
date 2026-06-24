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
      fondo: "#F4F1F4", // Fondo neutro cálido del correo
      textoTitulo: "#1A1320", // Tinta para titulares
      textoCuerpo: "#5A5560", // Gris medio para lectura cómoda
      // --- Familia rosa para formas y tintes (Gmail-safe) ---
      rosaProfundo: "#A8006F", // Rosa oscuro para texto/acento sobre tintes
      rosaTinte: "#FCE3F1",    // Rosa muy claro para tarjetas/círculos
      rosaTinte2: "#F9D2E7",   // Rosa claro para bandas y bordes
      neutroTinte: "#F4F2F5"   // Gris cálido muy claro para tarjetas neutras
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
    preheader: `Faltan ${persona.diasRestantes} día${plural} para el cumpleaños de ${persona.nombre}.`,
    pie: "Cultura y cercanía VENTEL.",
    contenido: `
        <div style="text-align:center;">
          ${etiquetaSeccion("Próximo cumpleaños")}
          <h2 style="font-family:${FUENTE}; color:${C.textoTitulo}; margin:10px 0 28px 0; font-size:26px; font-weight:700; line-height:1.3; letter-spacing:-0.4px;">
            Preparémonos para celebrar
          </h2>
        </div>

        <!-- Contador en círculo grande (forma + juego de tamaños) -->
        ${circulo(String(persona.diasRestantes), "día" + plural, { tam: 140 })}
        ${fraseDias ? `<p style="font-family:${FUENTE}; text-align:center; margin:18px auto 0; max-width:360px; font-size:15px; color:${C.textoCuerpo}; line-height:1.6;">${fraseDias}</p>` : ""}

        <!-- Festejado en pill -->
        <div style="text-align:center; margin:28px 0 0;">
          ${pill(persona.nombre + " · " + persona.dia + " de " + persona.mesTexto, { bg: C.neutroTinte, color: C.textoTitulo })}
        </div>

        <!-- Preferencias en tarjeta -->
        <div style="margin-top:32px;">
          ${tarjeta(`
            ${etiquetaSeccion("Preferencias")}
            ${generarDetallesHTML(persona)}
          `, { bg: C.neutroTinte, padding: "20px 24px" })}
        </div>

        ${mostrarLeyenda ? `
        <div style="margin-top:24px;">
          ${tarjeta(`
            <p style="font-family:${FUENTE}; margin:0; font-size:13px; color:${C.rosaProfundo}; line-height:1.6;">
              <strong style="font-weight:700;">Nota.</strong> Este integrante pertenece al Equipo Alejandra Castro — Ventas.
            </p>
          `, { bg: C.rosaTinte, padding: "16px 20px", radius: "14px" })}
        </div>` : ""}
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
    preheader: `Hoy celebramos a ${persona.nombre} en VENTEL.`,
    paddingHeader: "44px 24px 36px",
    headerExtra: `
        <div style="font-family:${FUENTE}; color:rgba(255,255,255,0.9); font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:2.5px; margin:28px 0 12px;">Día especial VENTEL</div>
        <h1 style="font-family:${FUENTE}; color:#ffffff; margin:0; font-size:30px; font-weight:600; line-height:1.2; letter-spacing:-0.3px;">
          Felicidades, ${persona.nombre}
        </h1>`,
    contenido: `
        <div style="text-align:center;">
          ${pill(fechaHoy)}
          <p style="font-family:${FUENTE}; font-size:16px; color:${C.textoCuerpo}; margin:18px 0 0 0; line-height:1.75;">
            Hoy celebramos su día y todo lo que aporta al equipo. Un detalle, una
            sonrisa o un simple mensaje hacen la diferencia.
          </p>
        </div>

        ${puntosDecorativos({ margen: "30px 0" })}

        <!-- Preferencias en tarjeta -->
        ${tarjeta(`
          ${etiquetaSeccion("Para consentirle hoy")}
          ${generarDetallesHTML(persona)}
        `, { bg: C.neutroTinte, padding: "20px 24px" })}

        <!-- CTA con forma de botón -->
        <div style="margin:36px 0 4px;">
          ${botonRedondeado("Enviar felicitación", "mailto:" + persona.nombre.replace(/\s+/g, '.').toLowerCase() + "@liverpool.com.mx")}
        </div>
    `
  });
}
