<div align="center">

# 🎂 Sistema de Cumpleaños · VENTEL

### Automatización de felicitaciones y recordatorios de cumpleaños para el equipo de Ventas Telefónicas de Liverpool

![Plataforma](https://img.shields.io/badge/Google_Apps_Script-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Estética](https://img.shields.io/badge/Estética-Liverpool_%E2%80%A2_%23E10098-E10098?style=for-the-badge)
![Estado](https://img.shields.io/badge/Versión-2.0-success?style=for-the-badge)

</div>

---

## ✨ ¿Qué hace?

A partir de un **Formulario de Google** donde cada integrante registra su fecha de cumpleaños y sus preferencias (color, pastel/comida, dinámica, etc.), el sistema:

| 🎯 | Acción | ¿A quién? | ¿Cuándo? |
|----|--------|-----------|----------|
| 📩 | **Confirmación de registro** | A la persona que llenó el formulario | Al registrarse |
| ⏰ | **Recordatorio con contador** | Al equipo organizador | **10, 3 y 1** días antes |
| 🎉 | **Aviso del día** | Al equipo organizador | El día del cumpleaños |
| 🎈 | **Felicitación festiva** | A la persona cumpleañera | El día de su cumpleaños |
| 📊 | **Panel visual** | En la hoja `Proximos` | En cada ejecución |
| 🌟 | **Resaltado de fila** | En la hoja de respuestas | En cada ejecución |

---

## 🎨 Estética Liverpool

Toda la marca vive en un solo lugar: la constante `CONFIG.marca` en `Automatizacion.gs`.

| Color | Hex | Uso |
|-------|-----|-----|
| 🩷 Rosa institucional | `#E10098` | Headers, banners, botones |
| ⚫ Gris oscuro | `#2B2B2B` | Encabezados de tabla, contrastes |
| 💖 Rosa brillante | `#FF00A0` | Acentos y degradados |
| ⬜ Gris claro | `#F3F4F6` | Fondo de los correos |

El **código de colores por urgencia** del panel (tipo semáforo, con leyenda visible en la hoja):

| Cercanía | Color |
|----------|-------|
| 🎉 **HOY** | Rosa Liverpool |
| 🔴 ≤ 3 días | Rojo (urgente) |
| 🟡 ≤ 7 días | Amarillo (esta semana) |
| 🟢 Resto del mes | Verde (con tiempo de planear) |

El panel de la hoja `Proximos` muestra **toda** la información útil para organizar cada festejo: nombre, fecha con día de la semana, días restantes, qué prefiere (pastel/comida), sabor del pastel, qué le gustaría, color favorito, comentarios y teléfono.

---

## 🗂️ Estructura del proyecto

```
Sistema-de-cumpleaños/
├── Automatizacion.gs            ⚙️  CONFIG central + lógica principal + correos al equipo
├── Plantillas.gs                🎨  Diseño compartido (envoltura, pie, tarjeta de datos)
├── Dashboard.gs                 📊  Panel visual en la hoja "Proximos"
├── Correo para cumpleañero.gs   🎈  Felicitación festiva al cumpleañero
├── enviarConfirmacionCumple.gs  ✅  Confirmación de registro
└── Destacarfila.gs              🌟  Resalta la fila del cumpleaños más próximo
```

> 💡 **Clave del diseño:** todos los correos comparten la misma "envoltura" (`envolturaLiverpool`) de `Plantillas.gs`. Cambias el logo o los colores **una vez** y se actualizan todos los correos a la vez.

---

## 🧩 Funciones principales

| Función | Archivo | Qué hace |
|---------|---------|----------|
| `encontrarProximoCumpleaños()` | Automatizacion.gs | Función maestra: revisa fechas, manda correos y dibuja el panel |
| `envolturaLiverpool(opciones)` | Plantillas.gs | Construye el marco Liverpool de cualquier correo |
| `generarDetallesHTML(persona)` | Plantillas.gs | Tarjeta de preferencias con iconos |
| `actualizarDashboard(lista)` | Dashboard.gs | Dibuja el panel visual de próximos cumpleaños |
| `enviarFelicitacionCumpleanero()` | Correo para cumpleañero.gs | Felicita al cumpleañero el día de su cumpleaños |
| `enviarConfirmacionCumple()` | enviarConfirmacionCumple.gs | Confirma el registro del último formulario |
| `resaltarCumpleañosMasProximo()` | Destacarfila.gs | Pinta de rosa la fila más próxima |

---

## 📋 Datos esperados (hoja `Respuestas de formulario 1`)

| Columna | Contenido |
|---------|-----------|
| **B** | Nombre |
| **D** | Color favorito |
| **E** | Prefiere (pastel / comida) |
| **F** | Sabor del pastel |
| **H** | Dinámica / qué le gustaría |
| **J** | Comentario |
| **K** | Día de cumpleaños |
| **L** | Mes de cumpleaños (número) |
| **M** | Teléfono |
| **N** | Correo de la persona |

---

## 🚀 Puesta en marcha

1. Abre la hoja de cálculo → **Extensiones → Apps Script**.
2. Asegúrate de tener los 6 archivos `.gs` de este repositorio.
3. Configura `CONFIG` en `Automatizacion.gs` (destinatarios, modo prueba, etc.).
4. Crea **activadores** (triggers) por tiempo:
   - `encontrarProximoCumpleaños` → diario
   - `enviarFelicitacionCumpleanero` → diario
   - `enviarConfirmacionCumple` → al enviar el formulario

### 🧪 Modo prueba

En `CONFIG.modoPrueba = true`, **todos** los correos del equipo se redirigen solo a `CONFIG.correoDesarrollador`. Ideal para probar sin molestar al equipo.

---

<div align="center">

*“Automatizar no es reemplazar el detalle humano… es amplificarlo con propósito.”*

**Responsable técnico:** David Martínez Arredondo — Apoyo / Asesor de Ventas · VENTEL

</div>
