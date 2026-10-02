import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAOP0jncNB7UcNLRYDhGxh0ehoy_4RmUeA",
  authDomain: "sistema-de-vigilancia-vecinal.firebaseapp.com",
  databaseURL: "https://sistema-de-vigilancia-vecinal-default-rtdb.firebaseio.com",
  projectId: "sistema-de-vigilancia-vecinal",
  storageBucket: "sistema-de-vigilancia-vecinal.firebasestorage.app",
  messagingSenderId: "349121257731",
  appId: "1:349121257731:web:629adbcb13c41788764936"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const $ = id => document.getElementById(id);

let emergencyType = "";
let emergencyLocation = null;
let emergencyPhotoData = null;

function show(id) {
  ["inicio","emergencia","success"].forEach(v => $(v)?.classList.toggle("hidden", v !== id));
  window.scrollTo({top:0, behavior:"smooth"});
}

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => show(button.dataset.view));
});

function clock() {
  const d = new Date();
  const h = d.getHours();
  const emoji = h < 12 ? "☀️" : h < 19 ? "🌤️" : "🌙";
  const text = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  $("saludo").innerHTML = text + ' <span class="greeting-emoji">' + emoji + "</span>";
  $("fecha").textContent = d.toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  $("hora").textContent = d.toLocaleTimeString("es-MX");
}
clock();
setInterval(clock,1000);

function locate() {
  const status = $("emergencyStatus");
  status.textContent = "📍 Solicitando ubicación…";

  if (!navigator.geolocation) {
    status.textContent = "❌ Este dispositivo no permite obtener ubicación.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    p => {
      emergencyLocation = {
        lat: p.coords.latitude,
        lng: p.coords.longitude,
        accuracy: Math.round(p.coords.accuracy)
      };
      status.textContent = "✅ Ubicación lista para enviar.";
    },
    err => {
      console.error("GEOLOCATION", err);
      status.textContent = "❌ No se pudo obtener la ubicación. Revisa el permiso de ubicación.";
    },
    {enableHighAccuracy:true, timeout:20000, maximumAge:0}
  );
}

$("emergencyLocation").addEventListener("click", locate);

document.querySelectorAll("#emergencyOptions button").forEach(button => {
  button.addEventListener("click", () => {
    emergencyType = button.dataset.value;
    document.querySelectorAll("#emergencyOptions button").forEach(b => b.classList.remove("selected"));
    button.classList.add("selected");
    $("emergencySelected").textContent = "Seleccionado: " + emergencyType;
  });
});

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("El archivo no es una imagen."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la foto."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("No se pudo abrir la foto."));
      img.onload = () => {
        const maxSide = 900;
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const width = Math.max(1, Math.round(img.naturalWidth * scale));
        const height = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No se pudo preparar la foto."));
          return;
        }
        ctx.drawImage(img,0,0,width,height);
        resolve(canvas.toDataURL("image/jpeg",0.58));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

$("emergencyPhoto").addEventListener("change", async () => {
  const file = $("emergencyPhoto").files?.[0];
  const status = $("emergencyAttachment");

  emergencyPhotoData = null;
  if (!file) {
    status.textContent = "";
    return;
  }

  status.textContent = "📸 Preparando foto…";

  try {
    const data = await compressImage(file);
    const approxKB = Math.round((data.length * 3) / 4 / 1024);

    if (approxKB > 700) {
      status.textContent = "⚠️ La foto sigue siendo muy pesada. Puedes enviar sin foto.";
      return;
    }

    emergencyPhotoData = data;
    status.textContent = "✅ Foto lista para enviar (" + approxKB + " KB).";
  } catch (err) {
    console.error("PHOTO", err);
    status.textContent = "⚠️ No se pudo preparar la foto. Puedes enviar sin ella.";
  }
});

async function sendEmergency() {
  const status = $("emergencyStatus");
  const button = $("sendEmergency");
  const description = ($("emergencyDescription")?.value || "").trim();

  if (!emergencyType) {
    alert("Selecciona qué está sucediendo.");
    return;
  }

  if (!emergencyLocation) {
    alert("Primero comparte tu ubicación.");
    return;
  }

  button.disabled = true;
  status.textContent = emergencyPhotoData ? "📤 Guardando reporte y foto…" : "📤 Guardando reporte…";

  try {
    const record = {
      folio: "REP-" + Date.now().toString().slice(-8),
      tipo: "emergencia",
      tipoSuceso: emergencyType,
      descripcion,
      estaSucediendoAhora: true,
      ubicacion: emergencyLocation,
      fechaHora: Date.now(),
      estado: "nuevo"
    };

    if (emergencyPhotoData) {
      record.foto = emergencyPhotoData;
      record.fotoFormato = "image/jpeg";
    }

    const result = await push(ref(db,"registros"), record);
    console.log("REPORTE GUARDADO", result.key);

    $("folio").textContent = "Folio: " + record.folio;
    $("successDetails").innerHTML =
      "<div>📍 <strong>Ubicación enviada</strong><br><span>Precisión aproximada: ±" +
      emergencyLocation.accuracy +
      " m</span></div>" +
      (emergencyPhotoData ? "<p>📸 Foto enviada correctamente.</p>" : "<p>Sin foto adjunta.</p>") +
      "<p>Tu información quedó registrada.</p>";

    show("success");
  } catch (err) {
    console.error("FIREBASE", err);
    status.textContent = "❌ Error al guardar";
    alert("NO SE PUDO ENVIAR\n\nCódigo: " + (err?.code || "SIN_CODIGO") + "\n\nDetalle: " + (err?.message || String(err)));
  } finally {
    button.disabled = false;
  }
}

$("sendEmergency").addEventListener("click", sendEmergency);
