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
    colores: {
      primario: "#E10098", // Rosa Institucional Liverpool
      secundario: "#2B2B2B", // Gris Oscuro para contrastes elegantes
      acento: "#FF00A0", // Rosa brillante para botones
      fondo: "#F3F4F6", // Gris extra claro para el fondo del correo
      textoTitulo: "#111827", // Casi negro para legibilidad
      textoCuerpo: "#4B5563" // Gris medio para lectura cómoda
    }
  }
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
  
  let mensajeFinal = "";

  // Procesar cumpleaños de HOY
  if (cumpleHoy.length > 0) {
    cumpleHoy.forEach(persona => {
      mensajeFinal += `🎈 ¡HOY es el cumpleaños de ${persona.nombre}! 🎉\n\n`;
      enviarCorreoHoy(persona);
    });
  }

  // Procesar PRÓXIMOS cumpleaños
  if (listaCumpleaneros.length > 0) {
    mensajeFinal += `🎂 Cumpleaños próximos detectados (en los próximos 30 días):\n\n`;
    
    listaCumpleaneros.forEach(persona => {
      mensajeFinal += generarResumenTexto(persona);
      
      // Evaluar dinámicamente usando el arreglo del CONFIG
      if (CONFIG.diasAviso.includes(persona.diasRestantes)) {
        enviarCorreoMotivador(persona);
      }
    });
  } else if (cumpleHoy.length === 0) {
    mensajeFinal = "🎂 No hay cumpleaños próximos en los próximos 30 días.";
  }

  // Escribir resumen en la hoja
  hojaProximos.getRange("B4").setValue(mensajeFinal.trim());
}

// ============================================================================
// FUNCIONES AUXILIARES DE TEXTO
// ============================================================================
function generarResumenTexto(persona) {
  let txt = `🎉 ${persona.nombre} – ${persona.dia} de ${persona.mesTexto} (faltan ${persona.diasRestantes} día${persona.diasRestantes > 1 ? 's' : ''})\n`;
  if (persona.telefono) txt += `   📱 Teléfono: ${persona.telefono}\n`;
  if (persona.color) txt += `   🎨 Color favorito: ${persona.color}\n`;
  if (persona.eleccion) {
    txt += `   ${persona.eleccion.toLowerCase().includes("pastel") ? "🍰" : "🍽️"} Prefiere: ${persona.eleccion}`;
    if (persona.sabor && persona.eleccion.toLowerCase().includes("pastel")) txt += ` (sabor: ${persona.sabor})`;
    txt += `\n`;
  }
  txt += `   🎁 Le gustaría: ${persona.dinamica}\n`;
  if (persona.comentario) txt += `   ✏️ “${persona.comentario}”\n`;
  return txt + `\n`;
}

function generarDetallesHTML(persona) {
  let html = `
  <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 15px 20px; margin-top: 15px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">`;
  
  const addRow = (icon, label, value, isLast = false) => {
    if (value) {
      const borderStyle = isLast ? "" : "border-bottom: 1px solid #F3F4F6;";
      html += `<tr>
                <td style="padding: 12px 0; ${borderStyle} width: 35px; text-align: center; font-size: 18px; color: ${CONFIG.marca.colores.primario};">${icon}</td>
                <td style="padding: 12px 0; ${borderStyle} color: ${CONFIG.marca.colores.textoCuerpo}; line-height: 1.5;">
                  <strong style="color: ${CONFIG.marca.colores.textoTitulo}; font-weight: 600;">${label}:</strong><br>
                  ${value}
                </td>
               </tr>`;
    }
  };

  // Pre-calcular valores para saber cuál es el último y quitarle el borde inferior
  let comidaVal = persona.eleccion;
  if (persona.eleccion && persona.sabor && persona.eleccion.toLowerCase().includes("pastel")) {
    comidaVal += ` (Sabor: ${persona.sabor})`;
  }

  addRow("📱", "Teléfono", persona.telefono);
  addRow("🎨", "Color favorito", persona.color);
  addRow(persona.eleccion?.toLowerCase().includes("pastel") ? "🍰" : "🍽️", "Prefiere", comidaVal);
  addRow("🎁", "Le gustaría", persona.dinamica);
  addRow("✏️", "Comentarios adicionales", persona.comentario ? `<em>"${persona.comentario}"</em>` : "", true);
  
  html += `</table></div>`;
  return html;
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

  const renderHTML = (mostrarLeyenda) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${CONFIG.marca.colores.fondo}; padding: 40px 10px; color: ${CONFIG.marca.colores.textoCuerpo}; -webkit-font-smoothing: antialiased;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
      
      <!-- Header Institucional -->
      <div style="background-color: ${CONFIG.marca.colores.primario}; padding: 25px 20px; text-align: center;">
        <img src="${CONFIG.marca.logoURL}" alt="Liverpool" width="130" style="display: block; margin: 0 auto;">
      </div>

      <!-- Body -->
      <div style="padding: 40px 35px;">
        <h2 style="color: ${CONFIG.marca.colores.textoTitulo}; text-align: center; margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">
          ¡Preparémonos para celebrar! 🎉
        </h2>
        <p style="text-align: center; color: ${CONFIG.marca.colores.textoCuerpo}; font-size: 15px; margin: 0 0 35px 0;">
          Un miembro clave de la familia VENTEL está por cumplir años.
        </p>

        <!-- Main Alert Box -->
        <div style="background-color: ${bgBadge}; border-left: 4px solid ${colorBadge}; padding: 18px 20px; border-radius: 0 8px 8px 0; margin-bottom: 30px;">
          <p style="margin: 0 0 8px 0; font-size: 16px; color: ${CONFIG.marca.colores.textoTitulo};">
            Cumpleaños de <strong>${persona.nombre}</strong> el <strong>${persona.dia} de ${persona.mesTexto}</strong>.
          </p>
          <div style="display: inline-block; background-color: #ffffff; color: ${colorBadge}; border: 1px solid ${colorBadge}; padding: 4px 12px; border-radius: 20px; font-weight: 600; font-size: 13px;">
            Faltan ${persona.diasRestantes} día${persona.diasRestantes > 1 ? 's' : ''} — ${fraseDias}
          </div>
        </div>

        <h3 style="font-size: 15px; color: ${CONFIG.marca.colores.textoTitulo}; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Detalles de Preferencias</h3>
        ${generarDetallesHTML(persona)}

        ${mostrarLeyenda ? `
        <div style="margin-top: 25px; background-color: #FFF1F2; padding: 16px; border-radius: 10px; border: 1px dashed #FECDD3; text-align: center;">
          <p style="margin: 0; color: #BE123C; font-size: 14px; font-weight: 500;">
            📌 <strong>Nota:</strong> Este integrante pertenece al <br>Equipo Alejandra Castro – Ventas
          </p>
        </div>` : ""}

      </div>
      
      <!-- Footer -->
      <div style="background-color: #F9FAFB; padding: 25px 35px; border-top: 1px solid #E5E7EB; text-align: center;">
        <p style="margin: 0 0 8px 0; color: ${CONFIG.marca.colores.secundario}; font-size: 13px; font-weight: 500;">Cultura y Cercanía VENTEL</p>
        <p style="margin: 0; color: #9CA3AF; font-size: 12px; line-height: 1.5;">Este mensaje fue generado automáticamente.<br>Responsable Técnico: David Martínez Arredondo</p>
      </div>
    </div>
  </div>`;

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
  const botonColor = persona.color ? persona.color.toLowerCase() : CONFIG.marca.colores.acento;

  const htmlBody = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: ${CONFIG.marca.colores.fondo}; padding: 40px 10px; color: ${CONFIG.marca.colores.textoCuerpo}; -webkit-font-smoothing: antialiased;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
      
      <!-- Header Festivo Institucional -->
      <div style="background-color: ${CONFIG.marca.colores.primario}; padding: 35px 20px; text-align: center;">
        <img src="${CONFIG.marca.logoURL}" alt="Liverpool" width="130" style="display: block; margin: 0 auto 25px;">
        <div style="display: inline-block; background-color: rgba(255,255,255,0.2); border-radius: 30px; padding: 6px 16px; margin-bottom: 15px;">
          <span style="color: #ffffff; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Día Especial VENTEL</span>
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 800; line-height: 1.2;">
          ¡Felicidades,<br>${persona.nombre}!
        </h1>
      </div>

      <!-- Body -->
      <div style="padding: 40px 35px;">
        <p style="text-align: right; font-size: 13px; color: #9CA3AF; margin: 0 0 20px 0; font-weight: 500;">📅 ${fechaHoy}</p>
        
        <p style="font-size: 16px; text-align: center; color: ${CONFIG.marca.colores.textoCuerpo}; margin: 0 0 35px 0; line-height: 1.6;">
          Hoy celebramos tu vida y todo el valor que aportas a nuestro equipo. Un detalle, una sonrisa o un simple mensaje hacen la diferencia hoy.
        </p>

        <h3 style="font-size: 15px; color: ${CONFIG.marca.colores.textoTitulo}; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Para consentirle hoy:</h3>
        ${generarDetallesHTML(persona)}

        <div style="text-align: center; margin: 45px 0 20px;">
          <a href="mailto:${persona.nombre.replace(/\s+/g, '.').toLowerCase()}@liverpool.com.mx" 
             style="background-color: ${botonColor}; color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: opacity 0.3s;">
             ✉️ Enviar felicitación
          </a>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #F9FAFB; padding: 25px 35px; border-top: 1px solid #E5E7EB; text-align: center;">
        <p style="margin: 0 0 8px 0; color: ${CONFIG.marca.colores.secundario}; font-size: 13px; font-weight: 500;">Gracias por mantener viva nuestra cultura 🧡</p>
        <p style="margin: 0; color: #9CA3AF; font-size: 12px; line-height: 1.5;">Generado por el sistema automatizado de VENTEL.<br>Seguimiento: David Martínez Arredondo</p>
      </div>
    </div>
  </div>`;

  const bccDestinatarios = CONFIG.modoPrueba ? CONFIG.correoDesarrollador : CONFIG.destinatarios.join(",");

  MailApp.sendEmail({
    to: "noreply@liverpool.com.mx",
    bcc: bccDestinatarios,
    subject: asunto,
    htmlBody: htmlBody,
    name: CONFIG.marca.nombreRemitente
  });
}
