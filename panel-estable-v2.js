import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getDatabase, ref, onValue, get, update, runTransaction } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

const firebaseConfig={apiKey:"AIzaSyAOP0jncNB7UcNLRYDhGxh0ehoy_4RmUeA",authDomain:"sistema-de-vigilancia-vecinal.firebaseapp.com",databaseURL:"https://sistema-de-vigilancia-vecinal-default-rtdb.firebaseio.com",projectId:"sistema-de-vigilancia-vecinal",storageBucket:"sistema-de-vigilancia-vecinal.firebasestorage.app",messagingSenderId:"349121257731",appId:"1:349121257731:web:629adbcb13c41788764936"};
const db=getDatabase(initializeApp(firebaseConfig));
const reports=document.getElementById("reports"),accessInfo=document.getElementById("accessInfo"),notifyBtn=document.getElementById("notifyBtn"),installBtn=document.getElementById("installBtn"),usersBtn=document.getElementById("usersBtn");
const esc=v=>String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]));
const params=new URLSearchParams(location.search);
function getCookie(n){const m=document.cookie.match(new RegExp("(^|;\\s*)"+n+"=([^;]*)"));return m?decodeURIComponent(m[2]):"";}
const token=params.get("acceso")||sessionStorage.getItem("sv_panel_token")||localStorage.getItem("sv_panel_token")||getCookie("sv_panel_token");
let accessName="Persona autorizada",accessRole="policia",previousIds=new Set(),firstLoad=true,deferredInstall=null;
function setMessage(html,cls="empty"){reports.innerHTML='<div class="'+cls+'">'+html+"</div>";}
async function verifyAccess(){
 if(!token){setMessage("Abre el panel desde tu enlace individual de acceso.","error");return false;}
 const snap=await get(ref(db,"accesosPanel/"+token)); if(!snap.exists())throw new Error("El enlace de acceso no existe.");
 const d=snap.val(); if(d.activo===false)throw new Error("Este acceso fue revocado."); if(d.expiraEn&&Date.now()>d.expiraEn)throw new Error("Este acceso ya caducó.");
 accessName=d.nombre||"Persona autorizada"; accessRole=d.rol||"policia";
 accessInfo.textContent="Acceso: "+accessName+(accessRole==="admin"?" • Administrador":" • Policía");
 for(const s of [sessionStorage,localStorage]){s.setItem("sv_panel_token",token);s.setItem("sv_panel_nombre",accessName);s.setItem("sv_panel_rol",accessRole);}
 if(accessRole==="admin"){usersBtn.hidden=false;usersBtn.onclick=()=>location.href="gestion-usuarios.html?admin="+encodeURIComponent(token);}else usersBtn.hidden=true;
 return true;
}
async function enableNotifications(){if(!("Notification"in window)){alert("Este navegador no permite notificaciones.");return;}const p=await Notification.requestPermission();if(p==="granted"){notifyBtn.textContent="🔔 Notificaciones activadas";notifyBtn.disabled=true;}else alert("Debes permitir las notificaciones del navegador.");}
notifyBtn.onclick=enableNotifications;
function notifyNew(r){if(!("Notification"in window)||Notification.permission!=="granted")return;const title="🚨 Nuevo reporte vecinal",body=(r.tipoSuceso||"Emergencia")+" • "+(r.folio||"Sin folio");navigator.serviceWorker?.ready.then(reg=>reg.showNotification(title,{body,tag:"reporte-"+(r.folio||Date.now()),renotify:true,icon:"icon.svg",badge:"icon.svg"})).catch(()=>new Notification(title,{body}));}
function summaryText(r){return ["🚨 REPORTE DE SEGURIDAD VECINAL","Folio: "+(r.folio||"Sin folio"),"Situación: "+(r.tipoSuceso||"Sin especificar"),r.descripcion?"Hechos: "+r.descripcion:"","Estado: "+(r.estado||"nuevo").toUpperCase()].filter(Boolean).join("\n");}
async function shareReport(r){const text=summaryText(r);if(navigator.share){try{await navigator.share({title:"Reporte vecinal "+(r.folio||""),text});return;}catch(e){if(e.name==="AbortError")return;}}await navigator.clipboard?.writeText(text);alert("Resumen copiado.");}
async function changeStatus(id,status){
  const rr=ref(db,"registros/"+id),now=Date.now();
  const result=await runTransaction(rr,current=>{
    if(!current)return current;
    const actual=current.estado||"nuevo",quien=current.atendidoPor||"";
    if(status==="atendiendo"){
      if(actual!=="nuevo" && !(actual==="atendiendo"&&quien===accessName))return;
      current.estado="atendiendo";current.atendidoPor=accessName;current.atendiendoEn=current.atendiendoEn||now;current.actualizadoEn=now;return current;
    }
    if(status==="atendido"){
      if(actual!=="atendiendo" || (quien&&quien!==accessName))return;
      current.estado="atendido";current.atendidoPor=accessName;current.atendidoEn=now;current.actualizadoEn=now;return current;
    }
    if(status==="cerrado"){
      if(accessRole!=="admin"&&quien!==accessName)return;
      current.estado="cerrado";current.cerradoPor=accessName;current.cerradoEn=now;current.actualizadoEn=now;return current;
    }
    return;
  });
  if(!result.committed)throw new Error("El reporte ya fue tomado por otro policía o no permite ese cambio.");
}
function render(data){
 const arr=Object.entries(data||{}).map(([id,r])=>({...r,id})).sort((a,b)=>(b.fechaHora||0)-(a.fechaHora||0)); const current=new Set(arr.map(r=>r.id));
 if(!firstLoad)arr.filter(r=>!previousIds.has(r.id)).forEach(notifyNew); previousIds=current; firstLoad=false;
 if(!arr.length){setMessage("No hay reportes registrados.");return;}
 reports.innerHTML=arr.map(r=>{const d=r.fechaHora?new Date(r.fechaHora).toLocaleString("es-MX"):"Sin fecha";const loc=r.ubicacion&&typeof r.ubicacion.lat==="number"&&typeof r.ubicacion.lng==="number"?'<a class="map" target="_blank" rel="noopener" href="https://www.google.com/maps?q='+r.ubicacion.lat+','+r.ubicacion.lng+'">📍 Abrir ubicación</a>':"";const photo=r.foto?'<img class="photo" src="'+r.foto+'" alt="Foto del reporte">':"";const status=r.estado||"nuevo";return '<article class="card report"><div class="top"><span class="folio">'+esc(r.folio||"Sin folio")+'</span><span class="badge">'+esc(status.toUpperCase())+'</span></div><div class="row"><span class="label">Fecha:</span> '+esc(d)+'</div><div class="row"><span class="label">Emergencia:</span> '+esc(r.tipoSuceso||"Sin especificar")+'</div><div class="row"><span class="label">Descripción:</span><div class="desc">'+esc(r.descripcion||"Sin descripción")+'</div></div>'+(r.atendidoPor?'<div class="row"><span class="label">Atiende:</span> '+esc(r.atendidoPor)+'</div>':"")+loc+photo+'<div class="actions"><button class="act attend" data-id="'+esc(r.id)+'" data-status="atendiendo">👮 Atender</button><button class="act done" data-id="'+esc(r.id)+'" data-status="atendido">✅ Atendido</button><button class="act close" data-id="'+esc(r.id)+'" data-status="cerrado">🔒 Cerrar</button><button class="act share" data-id="'+esc(r.id)+'">📤 Compartir resumen</button></div></article>';}).join("");
 arr.forEach(r=>{const b=reports.querySelector("[data-id=\""+r.id+"\"]");const card=b?.closest(".card");if(!card)return;const box=document.createElement("div");box.className="private-info";if(accessRole==="admin")box.innerHTML=(r.reportanteNombre?"<div><strong>👤 Vecino:</strong> "+esc(r.reportanteNombre)+"</div>":"<div><strong>👤 Vecino:</strong> No identificado</div>")+(r.ubicacion&&typeof r.ubicacion.lat==="number"&&typeof r.ubicacion.lng==="number"?"<div><a class=\"map\" target=\"_blank\" href=\"https://www.google.com/maps?q="+r.ubicacion.lat+","+r.ubicacion.lng+"\">📍 Ver ubicación</a></div>":"");else if(r.ubicacion&&typeof r.ubicacion.lat==="number"&&typeof r.ubicacion.lng==="number")box.innerHTML="<div><a class=\"map\" target=\"_blank\" href=\"https://www.google.com/maps?q="+r.ubicacion.lat+","+r.ubicacion.lng+"\">📍 Abrir ubicación del reporte</a></div>";if(box.innerHTML)card.insertBefore(box,card.querySelector(".actions"));});
reports.querySelectorAll("[data-status]").forEach(b=>{
  const r=arr.find(x=>x.id===b.dataset.id);if(!r)return;
  if(b.dataset.status===r.estado)b.classList.add("selected-status");
  const owner=r.atendidoPor===accessName;
  if(b.dataset.status==="atendiendo"&&r.estado!=="nuevo")b.disabled=true;
  if(b.dataset.status==="atendido"&&(!owner||r.estado!=="atendiendo"))b.disabled=true;
  if(b.dataset.status==="cerrado"&&(accessRole!=="admin"&&!owner))b.disabled=true;
  b.onclick=async()=>{b.disabled=true;try{await changeStatus(b.dataset.id,b.dataset.status);}catch(e){alert(e.message||"No se pudo actualizar el estado.");}finally{b.disabled=false;}};
});
 reports.querySelectorAll(".share").forEach(b=>b.onclick=()=>{const r=arr.find(x=>x.id===b.dataset.id);if(r)shareReport(r);});
 if(accessRole!=="admin")reports.querySelectorAll(".share").forEach(b=>b.remove());
}
async function start(){try{if(!(await verifyAccess()))return;if("serviceWorker"in navigator)await navigator.serviceWorker.register("./sw.js");onValue(ref(db,"registros"),snap=>render(snap.val()||{}),err=>setMessage("🚫 "+esc(err.message||err),"error"));}catch(e){setMessage("🚫 "+esc(e.message||e),"error");}}
document.getElementById("refresh").onclick=()=>location.reload();
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;installBtn.hidden=false;});installBtn.onclick=async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;installBtn.hidden=true;};if(window.matchMedia("(display-mode: standalone)").matches)installBtn.hidden=true;start();