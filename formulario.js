// ============================================
// FORMULARIO: saludo, tipo, ubicación y foto
// Guarda lo que elige el vecino en REPORTE,
// que luego lee envio.js
// ============================================

const REPORTE = {
  tipo: "",
  latitud: null,
  longitud: null,
  precision: null,
  foto: ""
};

// ---------- Saludo según la hora ----------
function ponerSaludo() {
  const hora = new Date().getHours();
  let texto = "Buenas noches";
  if (hora >= 5 && hora < 12) texto = "Buenos días";
  else if (hora >= 12 && hora < 19) texto = "Buenas tardes";
  document.getElementById("saludo").textContent = texto + " 👋";
}

// ---------- Tipo de reporte ----------
function iniciarTipos() {
  const botones = document.querySelectorAll(".tipo");
  botones.forEach(function (boton) {
    boton.addEventListener("click", function () {
      botones.forEach(function (b) { b.classList.remove("activo"); });
      boton.classList.add("activo");
      REPORTE.tipo = boton.dataset.tipo;
    });
  });
}

// ---------- Ubicación (un solo botón) ----------
function iniciarUbicacion() {
  const boton = document.getElementById("btnUbicacion");
  const estado = document.getElementById("estadoUbicacion");

  boton.addEventListener("click", function () {
    if (!navigator.geolocation) {
      estado.textContent = "Tu teléfono no permite enviar ubicación. Puedes enviar el reporte igual.";
      return;
    }

    estado.textContent = "Buscando tu ubicación…";

    navigator.geolocation.getCurrentPosition(
      function (posicion) {
        REPORTE.latitud = posicion.coords.latitude;
        REPORTE.longitud = posicion.coords.longitude;
        REPORTE.precision = Math.round(posicion.coords.accuracy);
        boton.classList.add("listo");
        boton.textContent = "✅ Ubicación enviada";
        estado.textContent = "";
      },
      function () {
        estado.textContent = "No pudimos obtener tu ubicación. Puedes enviar el reporte igual.";
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

// ---------- Foto (solo con la cámara) ----------
function reducirFoto(archivo) {
  return new Promise(function (resolver, rechazar) {
    const lector = new FileReader();
    lector.onerror = rechazar;
    lector.onload = function () {
      const imagen = new Image();
      imagen.onerror = rechazar;
      imagen.onload = function () {
        const escala = Math.min(1, CONFIG.FOTO_ANCHO_MAX / imagen.width);
        const lienzo = document.createElement("canvas");
        lienzo.width = Math.round(imagen.width * escala);
        lienzo.height = Math.round(imagen.height * escala);
        lienzo.getContext("2d").drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
        resolver(lienzo.toDataURL("image/jpeg", CONFIG.FOTO_CALIDAD));
      };
      imagen.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}

function iniciarFoto() {
  const boton = document.getElementById("btnFoto");
  const entrada = document.getElementById("inputFoto");
  const miniatura = document.getElementById("miniatura");

  boton.addEventListener("click", function () {
    entrada.click();
  });

  entrada.addEventListener("change", function () {
    const archivo = entrada.files[0];
    if (!archivo) return;

    reducirFoto(archivo)
      .then(function (datos) {
        REPORTE.foto = datos;
        miniatura.src = datos;
        miniatura.hidden = false;
        boton.classList.add("listo");
        boton.textContent = "✅ Foto guardada (tocar para repetir)";
      })
      .catch(function () {
        boton.textContent = "📷 Intentar de nuevo";
      });
  });
}

// ---------- Arranque ----------
ponerSaludo();
iniciarTipos();
iniciarUbicacion();
iniciarFoto();
