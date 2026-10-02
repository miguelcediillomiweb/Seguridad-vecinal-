import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getDatabase, ref as dbRef, push, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAOP0jncNB7UcNLRYDhGxh0ehoy_4RmUeA",
  authDomain: "sistema-de-vigilancia-vecinal.firebaseapp.com",
  databaseURL: "https://sistema-de-vigilancia-vecinal-default-rtdb.firebaseio.com",
  projectId: "sistema-de-vigilancia-vecinal",
  storageBucket: "sistema-de-vigilancia-vecinal.firebasestorage.app",
  messagingSenderId: "349121257731",
  appId: "1:349121257731:web:629adbcb13c41788764936"
};
const configured=!Object.values(firebaseConfig).some(v=>v==="REEMPLAZAR");
let db,storage;
if(configured){const app=initializeApp(firebaseConfig);db=getDatabase(app);storage=getStorage(app);}

const $=id=>document.getElementById(id),views=["inicio","emergencia","reporte","success"];
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.view)));
function show(id){views.forEach(v=>$(v).classList.toggle("hidden",v!==id));scrollTo({top:0,behavior:"smooth"});}

function clock(){
  const d=new Date(),h=d.getHours();
  $("saludo").textContent=h<12?"Buenos días ☀️":h<19?"Buenas tardes 🌤️":"Buenas noches 🌙";
  $("fecha").textContent=d.toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  $("hora").textContent=d.toLocaleTimeString("es-MX");
}
clock();setInterval(clock,1000);

let emergencyType="",emergencyLocationData=null,reportLocationData=null,emergencyPhoto=null,reportPhoto=null;

function getLocation(kind){
  const statusId=kind==="emergencia"?"emergencyStatus":"reportStatus";
  const attachmentId=kind==="emergencia"?"emergencyAttachment":"reportAttachment";
  const setStatus=msg=>$(statusId).textContent=msg;
  setStatus("📍 Solicitando ubicación…");
  if(!navigator.geolocation){setStatus("❌ Este navegador no permite compartir ubicación.");return;}
  navigator.geolocation.getCurrentPosition(
    p=>{
      const data={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:Math.round(p.coords.accuracy)};
      if(kind==="emergencia") emergencyLocationData=data; else reportLocationData=data;
      $(attachmentId).innerHTML=`<div class="location-ok">📍 <strong>Ubicación obtenida</strong><br><span>Precisión aproximada: ±${data.accuracy} m</span><small>Se enviará junto con tu reporte al presionar ENVIAR.</small></div>`;
      setStatus("✅ Ubicación lista para enviar.");
    },
    ()=>{setStatus("❌ No se pudo obtener la ubicación. Revisa el permiso de ubicación del navegador e inténtalo de nuevo.");},
    {enableHighAccuracy:true,timeout:20000,maximumAge:0}
  );
}

$("emergencyLocation").onclick=()=>getLocation("emergencia");
$("reportLocation").onclick=()=>getLocation("reporte");

document.querySelectorAll("#emergencyOptions button").forEach(b=>b.onclick=()=>{
  emergencyType=b.dataset.value;
  document.querySelectorAll("#emergencyOptions button").forEach(x=>x.classList.remove("selected"));
  b.classList.add("selected");
  $("emergencySelected").textContent="Seleccionado: "+emergencyType;
});

function showPhotoPreview(inputId,attachmentId,file){
  if(!file){$(attachmentId).innerHTML="";return;}
  const url=URL.createObjectURL(file);
  $(attachmentId).innerHTML=`<div class="photo-ok"><img src="${url}" alt="Vista previa de la foto"><div><strong>📸 Foto lista</strong><br><span>${file.name||"Imagen seleccionada"}</span><small>Se subirá al enviar el reporte.</small></div></div>`;
}

$("emergencyPhoto").onchange=e=>{
  emergencyPhoto=e.target.files[0]||null;
  showPhotoPreview("emergencyPhoto","emergencyAttachment",emergencyPhoto);
};
$("reportPhoto").onchange=e=>{
  reportPhoto=e.target.files[0]||null;
  showPhotoPreview("reportPhoto","reportAttachment",reportPhoto);
};

async function photoToDataUrl(file){
  if(!file)return null;
  if(!file.type.startsWith("image/"))throw new Error("El archivo seleccionado no es una imagen.");
  const maxSide=1000, quality=.68;
  const bitmap=await createImageBitmap(file);
  const scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));
  canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext("2d",{alpha:false});
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg",quality);
}

async function send(kind){
  if(!configured){alert("La página ya está preparada, pero falta conectar la configuración de Firebase.");return;}
  const emergency=kind==="emergencia";
  const type=emergency?emergencyType:$("reportType").value;
  const description=emergency?$("emergencyDescription").value.trim():$("reportDescription").value.trim();
  const selectedLocation=emergency?emergencyLocationData:reportLocationData;
  const file=emergency?emergencyPhoto:reportPhoto;
  const statusId=emergency?"emergencyStatus":"reportStatus";

  if(!type){alert("Selecciona qué está sucediendo.");return;}
  if(!description&&!emergency){alert("Describe brevemente lo sucedido.");return;}
  if(!selectedLocation){alert("Primero comparte tu ubicación para que podamos enviarla junto con el reporte.");return;}

  const folio="REP-"+Date.now().toString().slice(-8);
  const sendButton=$(emergency?"sendEmergency":"sendReport");
  sendButton.disabled=true;
  sendButton.textContent=file?"📤 SUBIENDO FOTO…":"📤 ENVIANDO REPORTE…";

  try{
    $(statusId).textContent=file?"📸 Subiendo foto…":"📍 Preparando ubicación…";
    const photoUrl=await photoToDataUrl(file);

    $(statusId).textContent="📍 Guardando ubicación y reporte…";
    const record={
      folio,tipo:kind,tipoSuceso:type,descripcion,
      estaSucediendoAhora:emergency||$("reportNow").value.startsWith("Sí"),
      ubicacion:selectedLocation,
      photoUrl,
      fechaHora:serverTimestamp(),
      estado:"nuevo"
    };
    await push(dbRef(db,"registros"),record);

    $("folio").textContent="Folio: "+folio;
    $("successDetails").innerHTML=`
      <div>📍 <strong>Ubicación enviada</strong><br><span>Precisión aproximada: ±${selectedLocation.accuracy} m</span></div>
      <div>${photoUrl?"📸 <strong>Foto enviada correctamente</strong>":"📸 Sin foto adjunta"}</div>
      <p>Tu información quedó registrada para las personas autorizadas.</p>`;
    sendButton.disabled=false;
    sendButton.textContent=emergency?"🚨 ENVIAR EMERGENCIA":"📤 ENVIAR REPORTE";
    show("success");
  }catch(err){
    console.error(err);
    sendButton.disabled=false;
    sendButton.textContent=emergency?"🚨 ENVIAR EMERGENCIA":"📤 ENVIAR REPORTE";
    $(statusId).textContent="❌ No se pudo completar el envío.";
    alert("No se pudo enviar el reporte. Revisa la conexión y las reglas de Firebase.");
  }
}

$("sendEmergency").onclick=()=>send("emergencia");
$("sendReport").onclick=()=>send("reporte");