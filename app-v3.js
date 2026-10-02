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
let reportLocation = null;

function show(id) {
  ["inicio","emergencia","reporte","success"].forEach(v => $(v)?.classList.toggle("hidden", v !== id));
  window.scrollTo({top:0, behavior:"smooth"});
}

document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => show(b.dataset.view)));

function clock() {
  const d = new Date(), h = d.getHours();
  $("saludo").textContent = h < 12 ? "Buenos días ☀️" : h < 19 ? "Buenas tardes 🌤️" : "Buenas noches 🌙";
  $("fecha").textContent = d.toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  $("hora").textContent = d.toLocaleTimeString("es-MX");
}
clock();
setInterval(clock,1000);

function locate(kind) {
  const status = $(kind === "emergencia" ? "emergencyStatus" : "reportStatus");
  status.textContent = "📍 Solicitando ubicación…";
  navigator.geolocation.getCurrentPosition(
    p => {
      const data = {lat:p.coords.latitude,lng:p.coords.longitude,accuracy:Math.round(p.coords.accuracy)};
      if (kind === "emergencia") emergencyLocation = data; else reportLocation = data;
      status.textContent = "✅ Ubicación lista para enviar.";
    },
    () => status.textContent = "❌ No se pudo obtener la ubicación. Revisa el permiso.",
    {enableHighAccuracy:true,timeout:20000,maximumAge:0}
  );
}

$("emergencyLocation").onclick = () => locate("emergencia");
$("reportLocation").onclick = () => locate("reporte");

document.querySelectorAll("#emergencyOptions button").forEach(b => {
  b.onclick = () => {
    emergencyType = b.dataset.value;
    document.querySelectorAll("#emergencyOptions button").forEach(x => x.classList.remove("selected"));
    b.classList.add("selected");
    $("emergencySelected").textContent = "Seleccionado: " + emergencyType;
  };
});

async function send(kind) {
  const emergency = kind === "emergencia";
  const type = emergency ? emergencyType : ($("reportType")?.value || "").trim();
  const description = ($((emergency ? "emergencyDescription" : "reportDescription"))?.value || "").trim();
  const location = emergency ? emergencyLocation : reportLocation;
  const status = $(emergency ? "emergencyStatus" : "reportStatus");
  const button = $(emergency ? "sendEmergency" : "sendReport");

  if (!type) return alert(emergency ? "Selecciona qué está sucediendo." : "Selecciona qué quieres reportar.");
  if (!emergency && !description) return alert("Describe brevemente lo sucedido.");
  if (!location) return alert("Primero comparte tu ubicación.");

  button.disabled = true;
  status.textContent = "📤 Guardando reporte…";

  try {
    const record = {
      folio: "REP-" + Date.now().toString().slice(-8),
      tipo: kind,
      tipoSuceso: type,
      descripcion: description,
      estaSucediendoAhora: emergency || (($("reportNow")?.value || "").startsWith("Sí")),
      ubicacion: location,
      fechaHora: Date.now(),
      estado: "nuevo"
    };

    const result = await push(ref(db,"registros"), record);
    console.log("REPORTE GUARDADO", result.key);

    $("folio").textContent = "Folio: " + record.folio;
    $("successDetails").innerHTML = "<div>📍 <strong>Ubicación enviada</strong><br><span>Precisión aproximada: ±" + location.accuracy + " m</span></div><p>Tu información quedó registrada.</p>";
    show("success");
  } catch (err) {
    console.error(err);
    status.textContent = "❌ Error al guardar";
    alert("NO SE PUDO ENVIAR\n\nCódigo: " + (err?.code || "SIN_CODIGO") + "\n\nDetalle: " + (err?.message || String(err)));
  } finally {
    button.disabled = false;
    button.textContent = emergency ? "🚨 ENVIAR EMERGENCIA" : "📤 ENVIAR REPORTE";
  }
}

$("sendEmergency").onclick = () => send("emergencia");
$("sendReport").onclick = () => send("reporte");
