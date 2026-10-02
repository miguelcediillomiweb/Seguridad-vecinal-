import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getDatabase, ref, push, runTransaction } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const firebaseConfig={apiKey:"AIzaSyAOP0jncNB7UcNLRYDhGxh0ehoy_4RmUeA",authDomain:"sistema-de-vigilancia-vecinal.firebaseapp.com",databaseURL:"https://sistema-de-vigilancia-vecinal-default-rtdb.firebaseio.com",projectId:"sistema-de-vigilancia-vecinal",storageBucket:"sistema-de-vigilancia-vecinal.firebasestorage.app",messagingSenderId:"349121257731",appId:"1:349121257731:web:629adbcb13c41788764936"};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getDatabase(app),$=id=>document.getElementById(id);
let emergencyType="",emergencyLocation=null,emergencyPhotoData=null;
await signInAnonymously(auth);

function show(id){["inicio","emergencia","success"].forEach(v=>$(v)?.classList.toggle("hidden",v!==id));window.scrollTo({top:0,behavior:"smooth"});}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.view)));

function clock(){const d=new Date(),h=d.getHours(),e=h<12?"☀️":h<19?"🌤️":"🌙",t=h<12?"Buenos días":h<19?"Buenas tardes":"Buenas noches";$("saludo").innerHTML=t+' <span class="greeting-emoji">'+e+"</span>";$("fecha").textContent=d.toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long",year:"numeric"});$("hora").textContent=d.toLocaleTimeString("es-MX");}
clock();setInterval(clock,1000);

$("emergencyLocation").addEventListener("click",()=>{
 const s=$("emergencyStatus");s.textContent="📍 Solicitando ubicación…";
 if(!navigator.geolocation){s.textContent="❌ Este dispositivo no permite obtener ubicación.";return;}
 navigator.geolocation.getCurrentPosition(p=>{emergencyLocation={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:Math.round(p.coords.accuracy)};s.textContent="✅ Ubicación lista para enviar.";},()=>{s.textContent="❌ No se pudo obtener la ubicación. Revisa el permiso de ubicación.";},{enableHighAccuracy:true,timeout:20000,maximumAge:0});
});

document.querySelectorAll("#emergencyOptions button").forEach(b=>b.addEventListener("click",()=>{
 emergencyType=b.dataset.value;
 document.querySelectorAll("#emergencyOptions button").forEach(x=>x.classList.remove("selected"));
 b.classList.add("selected");
 $("emergencySelected").textContent="Seleccionado: "+emergencyType;
}));

function compress(file){return new Promise((resolve,reject)=>{if(!file||!file.type.startsWith("image/"))return reject(new Error("No es imagen"));const r=new FileReader();r.onerror=()=>reject(new Error("No se pudo leer"));r.onload=()=>{const i=new Image();i.onerror=()=>reject(new Error("No se pudo abrir"));i.onload=()=>{const m=900,sc=Math.min(1,m/Math.max(i.naturalWidth,i.naturalHeight)),w=Math.max(1,Math.round(i.naturalWidth*sc)),h=Math.max(1,Math.round(i.naturalHeight*sc)),c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");if(!x)return reject(new Error("No se pudo preparar"));x.drawImage(i,0,0,w,h);resolve(c.toDataURL("image/jpeg",.58));};i.src=r.result;};r.readAsDataURL(file);});}
$("emergencyPhoto").addEventListener("change",async()=>{const f=$("emergencyPhoto").files?.[0],s=$("emergencyAttachment");emergencyPhotoData=null;if(!f){s.textContent="";return;}s.textContent="📸 Preparando foto…";try{const d=await compress(f),kb=Math.round(d.length*3/4/1024);if(kb>700){s.textContent="⚠️ La foto sigue siendo muy pesada. Puedes enviar sin foto.";return;}emergencyPhotoData=d;s.textContent="✅ Foto lista para enviar ("+kb+" KB).";}catch(e){console.error(e);s.textContent="⚠️ No se pudo preparar la foto. Puedes enviar sin ella.";}});

async function sendEmergency(){
 const s=$("emergencyStatus"),b=$("sendEmergency");
 const reporterName=($("reporterName")?.value||"").trim();
 if(!emergencyType){alert("Selecciona qué está sucediendo.");return;}
 if(!reporterName){alert("Escribe tu nombre para que administración pueda identificar el reporte.");return;}
 if(!emergencyLocation){alert("Primero comparte tu ubicación.");return;}
 b.disabled=true;s.textContent=emergencyPhotoData?"📤 Guardando reporte y foto…":"📤 Guardando reporte…";
 try{
  const now=new Date(); const dd=String(now.getDate()).padStart(2,"0"),mm=String(now.getMonth()+1).padStart(2,"0"),yyyy=now.getFullYear(); const fechaFolio=mm+dd+yyyy; const counterRef=ref(db,"contadoresFolios/"+fechaFolio); const tx=await runTransaction(counterRef,current=>(current||0)+1); if(!tx.committed) throw new Error("No se pudo generar el consecutivo."); const consecutivo=tx.snapshot.val(); const record={folio:fechaFolio+"-"+consecutivo,tipo:"emergencia",tipoSuceso:emergencyType,descripcion:($("emergencyDescription")?.value||"").trim(),reportanteNombre:reporterName,estaSucediendoAhora:true,ubicacion:emergencyLocation,fechaHora:Date.now(),estado:"nuevo"};
  if(emergencyPhotoData){record.foto=emergencyPhotoData;record.fotoFormato="image/jpeg";}
  const result=await push(ref(db,"registros"),record);
  console.log("REPORTE GUARDADO",result.key);
  $("folio").textContent="Folio: "+record.folio;
  $("successDetails").innerHTML="<div>📍 <strong>Ubicación enviada</strong><br><span>Precisión aproximada: ±"+emergencyLocation.accuracy+" m</span></div>"+(emergencyPhotoData?"<p>📸 Foto enviada correctamente.</p>":"<p>Sin foto adjunta.</p>")+"<p>Tu información quedó registrada.</p>";
  show("success");
 }catch(err){console.error("FIREBASE",err);s.textContent="❌ Error al guardar";alert("NO SE PUDO ENVIAR\n\nCódigo: "+(err?.code||"SIN_CODIGO")+"\n\nDetalle: "+(err?.message||String(err)));}
 finally{b.disabled=false;}
}
$("sendEmergency").addEventListener("click",sendEmergency);