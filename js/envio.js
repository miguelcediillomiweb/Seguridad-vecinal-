(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  $("btnEnviar").addEventListener("click", async () => {
    const reporte = window.ReporteVecinal;
    if (!reporte || !reporte.validar()) return;
    const datos = reporte.obtenerDatos();
    const boton = $("btnEnviar");
    const salida = $("resultado");
    if (!window.CONFIG || !CONFIG.URL_BACKEND || CONFIG.URL_BACKEND.includes("PEGA_AQUI")) {
      salida.textContent = "⚠️ Falta configurar el destino del reporte. Avísale al administrador.";
      return;
    }
    boton.disabled = true;
    salida.textContent = "⏳ Enviando reporte…";
    const paquete = {
      tipo: datos.tipo,
      categoria: datos.tipo,
      nombre: datos.nombre,
      latitud: datos.latitud,
      longitud: datos.longitud,
      lat: datos.latitud,
      lng: datos.longitud,
      precision: datos.precision,
      ubicacion: datos.latitud !== "" && datos.longitud !== "" ? { latitud: datos.latitud, longitud: datos.longitud, lat: datos.latitud, lng: datos.longitud } : "",
      foto: datos.foto,
      fotoBase64: datos.fotoBase64,
      fotoNombre: datos.fotoNombre,
      fecha: datos.fecha
    };
    try {
      // text/plain evita la solicitud CORS preliminar; Apps Script recibe el JSON en postData.contents.
      await fetch(CONFIG.URL_BACKEND, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(paquete)
      });
      salida.textContent = "📨 Solicitud enviada. Como el navegador no permite confirmar la respuesta del servidor, verifica que el reporte aparezca en el registro. Si es una emergencia inmediata, llama al 911.";
      salida.classList.add("aviso-enviado");
    } catch (error) {
      salida.textContent = "❌ No se pudo enviar. Revisa tu conexión e inténtalo de nuevo. Si hay peligro inmediato, llama al 911.";
    } finally {
      boton.disabled = false;
    }
  });
})();