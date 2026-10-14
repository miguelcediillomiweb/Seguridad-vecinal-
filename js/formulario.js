(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const botones = Array.from(document.querySelectorAll(".tipo"));
  let tipoElegido = "";
  let ubicacion = null;
  let fotoBase64 = "";
  let fotoNombre = "";

  botones.forEach(boton => {
    boton.setAttribute("aria-pressed", "false");
    boton.addEventListener("click", () => {
      tipoElegido = boton.dataset.tipo || "";
      botones.forEach(b => {
        const activo = b === boton;
        b.classList.toggle("seleccionado", activo);
        b.setAttribute("aria-pressed", String(activo));
      });
      $("tipoSeleccionado").value = tipoElegido;
    });
  });

  function actualizarBannerHora() {
    const ahora = new Date();
    const hora = ahora.getHours();
    let saludo, emoji, adorno;
    if (hora >= 5 && hora < 12) {
      saludo = "Buenos días";
      emoji = "🌅";
      adorno = "☀️";
    } else if (hora >= 12 && hora < 19) {
      saludo = "Buenas tardes";
      emoji = "🌤️";
      adorno = "✨";
    } else {
      saludo = "Buenas noches";
      emoji = "🌙";
      adorno = "⭐";
    }
    $("saludo").textContent = saludo;
    $("emojiSaludo").textContent = emoji;
    $("emojiClima").textContent = adorno;
    $("fechaActual").textContent = ahora.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    $("horaActual").textContent = "🕒 " + ahora.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  }
  actualizarBannerHora();
  // Actualiza el saludo y la fecha automáticamente, incluso si la página permanece abierta.
  window.setInterval(actualizarBannerHora, 1000);

  $("btnUbicacion").addEventListener("click", () => {
    const estado = $("estadoUbicacion");
    if (!navigator.geolocation) {
      estado.textContent = "Tu navegador no permite compartir ubicación. Puedes continuar e indicar la ubicación en el reporte.";
      return;
    }
    estado.textContent = "📍 Buscando tu ubicación…";
    $("btnUbicacion").disabled = true;
    navigator.geolocation.getCurrentPosition(pos => {
      ubicacion = { latitud: pos.coords.latitude, longitud: pos.coords.longitude, precision: pos.coords.accuracy };
      estado.textContent = "✅ Ubicación lista (precisión aproximada: " + Math.round(pos.coords.accuracy) + " m).";
      $("btnUbicacion").disabled = false;
    }, err => {
      ubicacion = null;
      estado.textContent = err.code === 1 ? "No se dio permiso de ubicación. Puedes intentarlo de nuevo." : "No pudimos obtener la ubicación. Inténtalo de nuevo en un lugar con señal.";
      $("btnUbicacion").disabled = false;
    }, { enableHighAccuracy:true, timeout:15000, maximumAge:0 });
  });

  $("btnFoto").addEventListener("click", () => $("inputFoto").click());
  $("inputFoto").addEventListener("change", async () => {
    const archivo = $("inputFoto").files && $("inputFoto").files[0];
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      $("estadoFoto").textContent = "Elige un archivo de imagen.";
      return;
    }
    $("estadoFoto").textContent = "Preparando foto…";
    try {
      const img = await cargarImagen(archivo);
      const max = (window.CONFIG && CONFIG.FOTO_ANCHO_MAX) || 480;
      const calidad = (window.CONFIG && CONFIG.FOTO_CALIDAD) || 0.5;
      const escala = Math.min(1, max / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      fotoBase64 = canvas.toDataURL("image/jpeg", calidad).split(",")[1];
      fotoNombre = "reporte.jpg";
      $("miniatura").src = "data:image/jpeg;base64," + fotoBase64;
      $("miniatura").hidden = false;
      $("estadoFoto").textContent = "✅ Foto lista para adjuntar.";
    } catch (e) {
      fotoBase64 = "";
      $("estadoFoto").textContent = "No se pudo preparar la foto. Intenta con otra imagen.";
    }
  });

  function cargarImagen(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("imagen inválida")); };
      img.src = url;
    });
  }
  window.ReporteVecinal = {
    obtenerDatos: () => ({
      tipo: tipoElegido,
      nombre: $("nombre").value.trim(),
      latitud: ubicacion ? ubicacion.latitud : "",
      longitud: ubicacion ? ubicacion.longitud : "",
      precision: ubicacion ? ubicacion.precision : "",
      foto: fotoBase64,
      fotoBase64: fotoBase64,
      fotoNombre: fotoNombre,
      fecha: new Date().toISOString()
    }),
    validar: () => {
      if (!tipoElegido) { $("resultado").textContent = "☝️ Selecciona primero el tipo de emergencia."; document.querySelector(".panel").scrollIntoView({behavior:"smooth",block:"start"}); return false; }
      return true;
    },
    mostrar: mensaje => { $("resultado").textContent = mensaje; }
  };
})();