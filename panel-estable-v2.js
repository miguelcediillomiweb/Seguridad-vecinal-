import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getDatabase, ref, onValue, get, runTransaction } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

const firebaseConfig={apiKey:"AIzaSyAOP0jncNB7UcNLRYDhGxh0ehoy_4RmUeA",authDomain:"sistema-de-vigilancia-vecinal.firebaseapp.com",databaseURL:"https://sistema-de-vigilancia-vecinal-default-rtdb.firebaseio.com",projectId:"sistema-de-vigilancia-vecinal",storageBucket:"sistema-de-vigilancia-vecinal.firebasestorage.app",messagingSenderId:"349121257731",appId:"1:349121257731:web:629adbcb13c41788764936"};
const db=getDatabase(initializeApp(firebaseConfig));
const reports=document.getElementById("reports");
const accessInfo=document.getElementById("accessInfo");
const notifyBtn=document.getElementById("notifyBtn");
const installBtn=document.getElementById("installBtn");
const usersBtn=document.getElementById("usersBtn");
const params=new URLSearchParams(location.search);
function esc(v){return String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]));}
function setMessage(msg,cls="empty"){reports.innerHTML='<div class="'+cls+'">'+esc(msg)+"</div>";}
function getCookie(n){const m=document.cookie.match(new RegExp("(^|;\\s*)"+n+"=([^;]*)"));return m?decodeURIComponent(m[2]):"";}
const token=params.get("acceso")||sessionStorage.getItem("sv_panel_token")||localStorage.getItem("sv_panel_token")||getCookie("sv_panel_token");
let accessName="Persona autorizada",accessRole="policia",deferredInstall=null;

async function verifyAccess(){
 if(!token){setMessage("Abre el panel desde tu enlace individual de acceso.","error");return false;}
 try{
  const snap=await Promise.race([
   get(ref(db,"accesosPanel/"+token)),
   new Promise((_,reject)=>setTimeout(()=>reject(new Error("Firebase no respondió después de 10 segundos.")),10000))
  ]);
  if(!snap.exists())throw new Error("El enlace de acceso no existe.");
  const d=snap.val();
  if(d.activo===false)throw new Error("Este acceso fue revocado.");
  if(d.expiraEn&&Date.now()>d.expiraEn)throw new Error("Este acceso ya caducó.");
  accessName=d.nombre||"Persona autorizada";
  accessRole=d.rol||"policia";
  accessInfo.textContent="Acceso: "+accessName+(accessRole==="admin"?" • Administrador":" • Policía");
  sessionStorage.setItem("sv_panel_token",token);
  localStorage.setItem("sv_panel_token",token);
  if(accessRole==="admin"){
   usersBtn.hidden=false;
   usersBtn.onclick=()=>location.href="gestion-usuarios.html?admin="+encodeURIComponent(token);
  }else usersBtn.hidden=true;
  return true;
 }catch(e){setMessage(e.message||"No se pudo verificar el acceso.","error");return false;}
}

async function changeStatus(id,status){
 const result=await runTransaction(ref(db,"registros/"+id),current=>{
  if(!current)return current;
  const actual=current.estado||"nuevo";
  const quien=current.atendidoPor||"";
  const now=Date.now();
  if(status==="atendiendo"){
   if(actual!=="nuevo"&&!(actual==="atendiendo"&&quien===accessName))return;
   current.estado="atendiendo";
   current.atendidoPor=accessName;
   current.atendiendoEn=current.atendiendoEn||now;
   current.actualizadoEn=now;
   return current;
  }
  if(status==="atendido"){
   if(actual!=="atendiendo"||quien!==accessName)return;
   current.estado="atendido";
   current.atendidoPor=accessName;
   current.atendidoEn=now;
   current.actualizadoEn=now;
   return current;
  }
  if(status==="cerrado"){
   if(accessRole!=="admin"&&quien!==accessName)return;
   current.estado="cerrado";
   current.cerradoPor=accessName;
   current.cerradoEn=now;
   current.actualizadoEn=now;
   return current;
  }
  return;
 });
 if(!result.committed)throw new Error("El reporte cambió o ya fue tomado por otra persona.");
}

function shareReport(r){
 const text=["🚨 REPORTE DE SEGURIDAD VECINAL","Folio: "+(r.folio||"Sin folio"),"Situación: "+(r.tipoSuceso||"Sin especificar"),r.descripcion?"Hechos: "+r.descripcion:"","Estado: "+(r.estado||"nuevo").toUpperCase()].filter(Boolean).join("\\n");
 if(navigator.share){navigator.share({title:"Reporte vecinal "+(r.folio||""),text}).catch(e=>{if(e.name!=="AbortError")navigator.clipboard?.writeText(text);});}
 else navigator.clipboard?.writeText(text).then(()=>alert("Resumen copiado."));
}

function render(data){
 const arr=Object.entries(data||{}).map(([id,r])=>({...r,id})).sort((a,b)=>(b.fechaHora||0)-(a.fechaHora||0));
 if(!arr.length){reports.innerHTML='<div class="empty">No hay reportes.</div>';return;}
 reports.innerHTML=arr.map(r=>{
  const status=r.estado||"nuevo";
  const date=r.fechaHora?new Date(r.fechaHora).toLocaleString("es-MX"):"Sin fecha";
  const type=r.tipoSuceso||"Sin especificar";
  const desc=r.descripcion||"Sin descripción";
  const map=(r.ubicacion&&typeof r.ubicacion.lat==="number"&&typeof r.ubicacion.lng==="number")?'<a class="map" target="_blank" href="https://www.google.com/maps?q='+r.ubicacion.lat+","+r.ubicacion.lng+'">📍 Abrir ubicación del reporte</a>':"";
  const photo=r.foto?'<img class="photo" src="'+r.foto+'" alt="Foto del reporte">':"";
  const timeline=[r.atendiendoEn?"🕐 Tomado: "+new Date(r.atendiendoEn).toLocaleString("es-MX"):"",r.atendidoEn?"✅ Atendido: "+new Date(r.atendidoEn).toLocaleString("es-MX"):"",r.cerradoEn?"🔒 Cerrado: "+new Date(r.cerradoEn).toLocaleString("es-MX"):""].filter(Boolean).join("<br>");
  const privateBox=accessRole==="admin"?( '<div class="private-info"><div><strong>👤 Vecino:</strong> '+esc(r.reportanteNombre||"No identificado")+'</div>'+map+"</div>" ):map?'<div class="private-info">'+map+"</div>":"";
  return '<article class="card report"><div class="top"><span class="folio">'+esc(r.folio||"Sin folio")+'</span><span class="badge">'+esc(status.toUpperCase())+"</span></div>"+
   '<div class="row"><span class="label">Fecha:</span> '+esc(date)+"</div>"+
   '<div class="row"><span class="label">Emergencia:</span> '+esc(type)+"</div>"+
   '<div class="row"><span class="label">Descripción:</span><div class="desc">'+esc(desc)+"</div></div>"+
   (r.atendidoPor?'<div class="row"><span class="label">Atiende:</span> '+esc(r.atendidoPor)+"</div>":"")+
   (timeline?'<div class="timeline">'+esc(timeline).replace(/&lt;br&gt;/g,"<br>")+"</div>":"")+privateBox+photo+
   '<div class="actions"><button class="act attend" data-id="'+esc(r.id)+'" data-status="atendiendo">👮 Atender</button><button class="act done" data-id="'+esc(r.id)+'" data-status="atendido">✅ Atendido</button><button class="act close" data-id="'+esc(r.id)+'" data-status="cerrado">🔒 Cerrar</button><button class="act share" data-id="'+esc(r.id)+'">📤 Compartir resumen</button></div></article>';
 }).join("");

 reports.querySelectorAll("[data-status]").forEach(btn=>{
  const r=arr.find(x=>x.id===btn.dataset.id);
  if(!r)return;
  if(btn.dataset.status===r.estado)btn.classList.add("selected-status");
  const owner=r.atendidoPor===accessName;
  if(btn.dataset.status==="atendiendo"&&r.estado!=="nuevo")btn.disabled=true;
  if(btn.dataset.status==="atendido"&&(!owner||r.estado!=="atendiendo"))btn.disabled=true;
  if(btn.dataset.status==="cerrado"&&(accessRole!=="admin"&&!owner))btn.disabled=true;
  btn.onclick=async()=>{btn.disabled=true;try{await changeStatus(btn.dataset.id,btn.dataset.status);}catch(e){alert(e.message||"No se pudo actualizar el estado.");}finally{btn.disabled=false;}};
 });
 reports.querySelectorAll(".share").forEach(btn=>btn.onclick=()=>{const r=arr.find(x=>x.id===btn.dataset.id);if(r)shareReport(r);});
 if(accessRole!=="admin")reports.querySelectorAll(".share").forEach(b=>b.remove());
}

notifyBtn.onclick=async()=>{
 if(!("Notification"in window)){alert("Este navegador no permite notificaciones.");return;}
 const p=await Notification.requestPermission();
 if(p==="granted"){notifyBtn.textContent="🔔 Notificaciones activadas";notifyBtn.disabled=true;}
};
document.getElementById("refresh").onclick=()=>location.reload();
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;installBtn.hidden=false;});
installBtn.onclick=async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;installBtn.hidden=true;};

async function start(){
 if(!(await verifyAccess()))return;
 try{
  if("serviceWorker"in navigator)await navigator.serviceWorker.register("./sw.js");
  onValue(ref(db,"registros"),snap=>render(snap.val()||{}),err=>setMessage(err.message||"Error leyendo reportes.","error"));
 }catch(e){setMessage(e.message||"No se pudo iniciar el panel.","error");}
}
start();
