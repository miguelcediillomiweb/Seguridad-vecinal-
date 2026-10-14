// ============================================
// ENVÍO DEL REPORTE
// Toma lo que guardó formulario.js y lo manda
// al backend. Si no hay señal, lo guarda y lo
// reintenta solo cuando regrese la conexión.
// ============================================

const CLAVE_PENDIENTE = "reporte_pendiente";

function crearId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function mostrar(texto, clase) {
  const resultado = document.getElementById("resultado");
  resultado.textContent = texto;
  resultado.className = "resultado " + (clase || "");
}

async function enviarAlBackend(datos) {
  const respuesta = await fetch(CONFIG.URL_BACKEND, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(datos)
  });
  const resultado = await respuesta.json();
  if (!resultado.ok) {
    throw new Error(resultado.error || "Error en el servidor");
  }
}

function guardarPendiente(datos) {
  try {
    localStorage.setItem(CLAVE_PENDIENTE, JSON.stringify(datos));
  } catch (e) {}
}

function leerPendiente() {
  try {
    const texto = localStorage.getItem(CLAVE_PENDIENTE);
    return texto ? JSON.parse(texto) : null;
  } catch (e) {
    return null;
  }
}

function borrarPendiente() {
  try {
    localStorage.removeItem(CLAVE_PENDIENTE);
  } catch (e) {}
}

function marcarEnviado() {
  const boton = document.getElementById("btnEnviar");
  boton.textContent = "✅ Reporte enviado";
  boton.disabled = true;
  mostrar("✅ Tu reporte fue enviado. Ya vienen en camino. Gracias por avisar.", "ok");
}

// Reintenta un reporte que quedó guardado sin enviar
async function reintentarPendiente() {
  const pendiente = leerPendiente();
  if (!pendiente) return;
  try {
    await enviarAlBackend(pendiente);
    borrarPendiente();
    marcarEnviado();
  } catch (e) {
    // seguirá guardado; se reintenta después
  }
}

async function enviarReporte() {
  const boton = document.getElementById("btnEnviar");

  if (!REPORTE.tipo) {
    mostrar("Por favor elige qué está pasando (paso 1).", "error");
    return;
  }

  const datos = {
    id: crearId(),
    tipo: REPORTE.tipo,
    latitud: REPORTE.latitud,
    longitud: REPORTE.longitud,
    precision: REPORTE.precision,
    foto: REPORTE.foto,
    nombre: document.getElementById("nombre").value.trim(),
    fecha: new Date().toISOString()
  };

  boton.disabled = true;
  mostrar("Enviando…", "");

  try {
    await enviarAlBackend(datos);
    borrarPendiente();
    marcarEnviado();
  } catch (e) {
    guardarPendiente(datos);
    boton.disabled = false;
    mostrar(
      "No hay buena señal. Tu reporte quedó guardado y se enviará solo al volver la conexión. " +
      "Si es urgente, toca de nuevo el botón o llama por teléfono.",
      "error"
    );
  }
}

// ---------- Arranque ----------
document.getElementById("btnEnviar").addEventListener("click", enviarReporte);
window.addEventListener("online", reintentarPendiente);
reintentarPendiente();
