import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getDatabase, ref as dbRef, push, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

const firebaseConfig={apiKey:"AIzaSyAOP0jncNB7UcNLRYDhGxh0ehoy_4RmUeA",authDomain:"sistema-de-vigilancia-vecinal.firebaseapp.com",databaseURL:"https://sistema-de-vigilancia-vecinal-default-rtdb.firebaseio.com",projectId:"sistema-de-vigilancia-vecinal",storageBucket:"sistema-de-vigilancia-vecinal.firebasestorage.app",messagingSenderId:"349121257731",appId:"1:349121257731:web:629adbcb13c41788764936"};
const app=initializeApp(firebaseConfig),db=getDatabase(app);
const $=id=>document.getElementById(id),views=["inicio","emergencia","reporte","success"];
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.view)));
function show(id){views.forEach(v=>$(v)?.classList.toggle("hidden",v!==id));scrollTo({top:0,behavior:"smooth"});}
function clock(){const d=new Date(),h=d.getHours();$("saludo").textContent=h<12?"Buenos días ☀️":h<19?"Buenas tardes 🌤️":"Buenas noches 🌙";$("fecha").textContent=d.toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long",year:"numeric"});$("hora").textContent=d.toLocaleTimeString("es-MX");}
clock();setInterval(clock,1000);
let emergencyType="",emergencyLocationData=null,reportLocationData=null,emergencyPhoto=null,reportPhoto=null;
function getLocation(kind){const statusId=kind==="emergencia"?"emergencyStatus":"reportStatus",attachmentId=kind==="emergencia"?"emergencyAttachment":"reportAttachment",setStatus=msg=>$(statusId).textContent=msg;setStatus("📍 Solicitando ubicación…");if(!navigator.geolocation){setStatus("❌ Este navegador no permite compartir ubicación.");return;}navigator.geolocation.getCurrentPosition(p=>{const data={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:Math.round(p.coords.accuracy)};if(kind==="emergencia")emergencyLocationData=data;else reportLocationData=data;$(attachmentId).innerHTML=`<div class="location-ok">📍 <strong>Ubicación obtenida</strong><br><span>Precisión aproximada: ±${data.accuracy} m</span><small>Se enviará junto con tu reporte al presionar ENVIAR.</small></div>`;setStatus("✅ Ubicación lista para enviar.");},()=>setStatus("❌ No se pudo obtener la ubicación. Revisa el permiso de ubicación del navegador e inténtalo de nuevo."),{enableHighAccuracy:true,timeout:20000,maximumAge:0});}
$("emergencyLocation").onclick=()=>getLocation("emergencia");$("reportLocation").onclick=()=>getLocation("reporte");
document.querySelectorAll("#emergencyOptions button").forEach(b=>b.onclick=()=>{emergencyType=b.dataset.value;document.querySelectorAll("#emergencyOptions button").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");$("emergencySelected").textContent="Seleccionado: "+emergencyType;});
function showPhotoPreview(id,file){if(!file){$(id).innerHTML="";return;}const url=URL.createObjectURL(file);$(id).innerHTML=`<div class="photo-ok"><img src="${url}" alt="Vista previa"><div><strong>📸 Foto lista</strong><br><span>${file.name||"Imagen seleccionada"}</span></div></div>`;}
$("emergencyPhoto").onchange=e=>{emergencyPhoto=e.target.files[0]||null;showPhotoPreview("emergencyAttachment",emergencyPhoto);};$("reportPhoto").onchange=e=>{reportPhoto=e.target.files[0]||null;showPhotoPreview("reportAttachment",reportPhoto);};
function loadImage(file){return new Promise((resolve,reject)=>{const u=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(u);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(u);reject(new Error("No se pudo procesar la imagen."))};img.src=u;});}
async function photoToDataUrl(file){if(!file)return null;if(!file.type.startsWith("image/"))throw new Error("El archivo seleccionado no es una imagen.");const img=await loadImage(file),maxSide=1000,scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));const ctx=canvas.getContext("2d",{alpha:false});if(!ctx)throw new Error("No se pudo preparar la imagen.");ctx.drawImage(img,0,0,canvas.width,canvas.height);return canvas.toDataURL("image/jpeg",.68);}
async function send(kind){
 const emergency=kind==="emergencia",typeEl=emergency?null:$("reportType"),descEl=emergency?$("emergencyDescription"):$("reportDescription"),nowEl=emergency?null:$("reportNow"),type=emergency?emergencyType:(typeEl?.value||"").trim(),description=(descEl?.value||"").trim(),location=emergency?emergencyLocationData:reportLocationData,file=emergency?emergencyPhoto:reportPhoto,statusId=emergency?"emergencyStatus":"reportStatus",button=$(emergency?"sendEmergency":"sendReport");
 if(!type){alert(emergency?"Selecciona qué está sucediendo.":"Selecciona qué quieres reportar.");return;}
 if(!emergency&&!description){alert("Describe brevemente lo sucedido.");return;}
 if(!location){alert("Primero comparte tu ubicación.");return;}
 button.disabled=true;button.textContent=file?"📤 PREPARANDO FOTO…":"📤 ENVIANDO REPORTE…";
 try{
  $(statusId).textContent=file?"📸 Preparando foto…":"📍 Guardando reporte…";
  const photoUrl=file?await photoToDataUrl(file):null;
  const record={folio:"REP-"+Date.now().toString().slice(-8),tipo:kind,tipoSuceso:type,descripcion,estaSucediendoAhora:emergency?true:(nowEl?.value||"").startsWith("Sí"),ubicacion:location,fechaHora:serverTimestamp(),estado:"nuevo"};
  if(photoUrl)record.photoUrl=photoUrl;
  await push(dbRef(db,"registros"),record);
  $("folio").textContent="Folio: "+record.folio;$("successDetails").innerHTML=`<div>📍 <strong>Ubicación enviada</strong><br><span>Precisión aproximada: ±${location.accuracy} m</span></div><div>${photoUrl?"📸 <strong>Foto enviada correctamente</strong>":"📸 Sin foto adjunta (opcional)"}</div><p>Tu información quedó registrada para las personas autorizadas.</p>`;show("success");
 }catch(err){
  console.error("Error Firebase:",err);
  const code=err?.code||"SIN_CODIGO",msg=err?.message||String(err);
  $(statusId).textContent=`❌ Firebase: ${code}`;
  alert(`NO SE PUDO ENVIAR\n\nCódigo: ${code}\n\nDetalle: ${msg}`);
 }finally{button.disabled=false;button.textContent=emergency?"🚨 ENVIAR EMERGENCIA":"📤 ENVIAR REPORTE";}
}
$("sendEmergency").onclick=()=>send("emergencia");$("sendReport").onclick=()=>send("reporte");