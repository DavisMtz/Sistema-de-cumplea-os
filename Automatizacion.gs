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
  const asuntoBase = "🎂 Recordatorio: Un cumpleaños especial en VENTEL";
  const asunto = CONFIG.modoPrueba ? `[PRUEBA] ${asuntoBase}` : asuntoBase;
  
  let fraseDias = "";
  let colorBadge = "#3B82F6"; // Azul por defecto
  let bgBadge = "#EFF6FF";

  if (persona.diasRestantes === 10) {
    fraseDias = "Aún hay tiempo de planear algo increíble.";
    colorBadge = "#8B5CF6"; bgBadge = "#F5F3FF"; // Morado
  } else if (persona.diasRestantes === 3) {
    fraseDias = "¡Ya casi es el día! Afinando los últimos detalles.";
    colorBadge = "#F59E0B"; bgBadge = "#FFFBEB"; // Ambar
  } else if (persona.diasRestantes === 1) {
    fraseDias = "¡Mañana es el gran día! 💥 No dejemos pasar la oportunidad.";
    colorBadge = "#EF4444"; bgBadge = "#FEF2F2"; // Rojo
  }

  const incluirLeyenda = persona.filaSheet >= 2 && persona.filaSheet <= 20;
  const C = CONFIG.marca.colores;

  const renderHTML = (mostrarLeyenda) => envolturaLiverpool({
    pie: "Cultura y Cercanía VENTEL",
    contenido: `
        <h2 style="color: ${C.textoTitulo}; text-align: center; margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">
          ¡Preparémonos para celebrar! 🎉
        </h2>
        <p style="text-align: center; color: ${C.textoCuerpo}; font-size: 15px; margin: 0 0 30px 0;">
          Un miembro clave de la familia VENTEL está por cumplir años.
        </p>

        <!-- Contador visual grande de días -->
        <div style="text-align: center; margin: 0 0 30px 0;">
          <div style="display: inline-block; background-color: ${bgBadge}; border: 2px solid ${colorBadge}; border-radius: 16px; padding: 18px 30px;">
            <div style="font-size: 42px; font-weight: 800; line-height: 1; color: ${colorBadge};">${persona.diasRestantes}</div>
            <div style="font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: ${colorBadge}; margin-top: 4px;">
              día${persona.diasRestantes > 1 ? 's' : ''} para el festejo
            </div>
          </div>
        </div>

        <!-- Caja principal -->
        <div style="background-color: ${bgBadge}; border-left: 4px solid ${colorBadge}; padding: 18px 20px; border-radius: 0 8px 8px 0; margin-bottom: 30px;">
          <p style="margin: 0 0 6px 0; font-size: 16px; color: ${C.textoTitulo};">
            Cumpleaños de <strong>${persona.nombre}</strong> el <strong>${persona.dia} de ${persona.mesTexto}</strong>.
          </p>
          <p style="margin: 0; font-size: 14px; color: ${colorBadge}; font-weight: 600;">${fraseDias}</p>
        </div>

        <h3 style="font-size: 15px; color: ${C.textoTitulo}; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Detalles de Preferencias</h3>
        ${generarDetallesHTML(persona)}

        ${mostrarLeyenda ? `
        <div style="margin-top: 25px; background-color: #FFF1F2; padding: 16px; border-radius: 10px; border: 1px dashed #FECDD3; text-align: center;">
          <p style="margin: 0; color: #BE123C; font-size: 14px; font-weight: 500;">
            📌 <strong>Nota:</strong> Este integrante pertenece al <br>Equipo Alejandra Castro – Ventas
          </p>
        </div>` : ""}
    `
  });

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

function enviarCorreoHoy(persona) {
  const asuntoBase = `🎉 ¡Hoy celebramos a ${persona.nombre}! - VENTEL`;
  const asunto = CONFIG.modoPrueba ? `[PRUEBA] ${asuntoBase}` : asuntoBase;
  
  const fechaHoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd 'de' MMMM 'de' yyyy");
  const C = CONFIG.marca.colores;
  const botonColor = persona.color ? persona.color.toLowerCase() : C.acento;

  const htmlBody = envolturaLiverpool({
    sombraFuerte: true,
    paddingHeader: "35px 20px",
    headerExtra: `
        <div style="display: inline-block; background-color: rgba(255,255,255,0.2); border-radius: 30px; padding: 6px 16px; margin: 25px 0 15px;">
          <span style="color: #ffffff; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Día Especial VENTEL</span>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; line-height: 1.2;">
          ¡Felicidades,<br>${persona.nombre}!
        </h1>`,
    contenido: `
        <p style="text-align: right; font-size: 13px; color: #9CA3AF; margin: 0 0 20px 0; font-weight: 500;">📅 ${fechaHoy}</p>

        <p style="font-size: 16px; text-align: center; color: ${C.textoCuerpo}; margin: 0 0 35px 0; line-height: 1.6;">
          Hoy celebramos tu vida y todo el valor que aportas a nuestro equipo. Un detalle, una sonrisa o un simple mensaje hacen la diferencia hoy.
        </p>

        <h3 style="font-size: 15px; color: ${C.textoTitulo}; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Para consentirle hoy:</h3>
        ${generarDetallesHTML(persona)}

        <div style="text-align: center; margin: 45px 0 20px;">
          <a href="mailto:${persona.nombre.replace(/\s+/g, '.').toLowerCase()}@liverpool.com.mx"
             style="background-color: ${botonColor}; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: opacity 0.3s;">
             ✉️ Enviar felicitación
          </a>
        </div>
    `
  });

  const bccDestinatarios = CONFIG.modoPrueba ? CONFIG.correoDesarrollador : CONFIG.destinatarios.join(",");

  MailApp.sendEmail({
    to: "noreply@liverpool.com.mx",
    bcc: bccDestinatarios,
    subject: asunto,
    htmlBody: htmlBody,
    name: CONFIG.marca.nombreRemitente
  });
}
