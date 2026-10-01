import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "REEMPLAZAR", authDomain: "REEMPLAZAR", projectId: "REEMPLAZAR",
  storageBucket: "REEMPLAZAR", messagingSenderId: "REEMPLAZAR", appId: "REEMPLAZAR"
};
const configured=!Object.values(firebaseConfig).some(v=>v==="REEMPLAZAR");
let db,storage;
if(configured){const app=initializeApp(firebaseConfig);db=getFirestore(app);storage=getStorage(app);}
const $=id=>document.getElementById(id),views=["inicio","emergencia","reporte","success"];
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.view)));
function show(id){views.forEach(v=>$(v).classList.toggle("hidden",v!==id));scrollTo({top:0,behavior:"smooth"});}
function clock(){const d=new Date(),h=d.getHours();$("saludo").textContent=h<12?"Buenos días ☀️":h<19?"Buenas tardes 🌤️":"Buenas noches 🌙";$("fecha").textContent=d.toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long",year:"numeric"});$("hora").textContent=d.toLocaleTimeString("es-MX");}clock();setInterval(clock,1000);
let emergencyType="",location=null,emergencyPhoto=null,reportPhoto=null;
function getLocation(statusId){$(statusId).textContent="Solicitando ubicación…";navigator.geolocation.getCurrentPosition(p=>{location={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy};$(statusId).textContent="📍 Ubicación agregada correctamente."},()=>$(statusId).textContent="No se pudo obtener la ubicación. Revisa el permiso del navegador.",{enableHighAccuracy:true,timeout:15000,maximumAge:0});}
$("emergencyLocation").onclick=()=>getLocation("emergencyStatus");$("reportLocation").onclick=()=>getLocation("reportStatus");
document.querySelectorAll("#emergencyOptions button").forEach(b=>b.onclick=()=>{emergencyType=b.dataset.value;document.querySelectorAll("#emergencyOptions button").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");$("emergencySelected").textContent="Seleccionado: "+emergencyType;});
$("emergencyPhoto").onchange=e=>emergencyPhoto=e.target.files[0]||null;$("reportPhoto").onchange=e=>reportPhoto=e.target.files[0]||null;
async function uploadPhoto(file,folio){if(!file)return null;const safe=(file.name||"foto").replace(/[^a-zA-Z0-9._-]/g,"_");const r=ref(storage,"reportes/"+folio+"/"+Date.now()+"_"+safe);await uploadBytes(r,file);return getDownloadURL(r);}
async function send(kind){if(!configured){alert("La página ya está preparada, pero falta conectar la configuración de Firebase.");return;}const emergency=kind==="emergencia",type=emergency?emergencyType:$("reportType").value,description=emergency?$("emergencyDescription").value.trim():$("reportDescription").value.trim();if(!type){alert("Selecciona qué está sucediendo.");return;}if(!description&&!emergency){alert("Describe brevemente lo sucedido.");return;}const folio="REP-"+Date.now().toString().slice(-8),file=emergency?emergencyPhoto:reportPhoto;try{const photoUrl=await uploadPhoto(file,folio);await addDoc(collection(db,"registros"),{folio,tipo:kind,tipoSuceso:type,descripcion:description,estaSucediendoAhora:emergency||$("reportNow").value.startsWith("Sí"),ubicacion:location,photoUrl,fechaHora:serverTimestamp(),estado:"nuevo"});$("folio").textContent="Folio: "+folio;show("success");}catch(err){console.error(err);alert("No se pudo enviar el reporte. Revisa la configuración de Firebase.");}}
$("sendEmergency").onclick=()=>send("emergencia");$("sendReport").onclick=()=>send("reporte");