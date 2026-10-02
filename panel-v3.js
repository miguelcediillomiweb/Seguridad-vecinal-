import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getDatabase, ref, onValue, get, update } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

const firebaseConfig={apiKey:"AIzaSyAOP0jncNB7UcNLRYDhGxh0ehoy_4RmUeA",authDomain:"sistema-de-vigilancia-vecinal.firebaseapp.com",databaseURL:"https://sistema-de-vigilancia-vecinal-default-rtdb.firebaseio.com",projectId:"sistema-de-vigilancia-vecinal",storageBucket:"sistema-de-vigilancia-vecinal.firebasestorage.app",messagingSenderId:"349121257731",appId:"1:349121257731:web:629adbcb13c41788764936"};
const db=getDatabase(initializeApp(firebaseConfig));
const reports=document.getElementById("reports");
const accessInfo=document.getElementById("accessInfo");
const notifyBtn=document.getElementById("notifyBtn");
const installBtn=document.getElementById("installBtn");
const esc=v=>String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]));
const token=new URLSearchParams(location.search).get("acceso");
let accessName="Persona autorizada";
let previousIds=new Set();
let firstLoad=true;
let deferredInstall=null;\nlet accessRole="policia";\nconst usersBtn=document.getElementById("usersBtn");

function setMessage(html,cls="empty"){reports.innerHTML='<div class="'+cls+'">'+html+"</div>";}

async function verifyAccess(){
  if(!token){setMessage("Abre el panel desde tu enlace individual de acceso.","error");return false;}
  const snap=await get(ref(db,"accesosPanel/"+token));
  if(!snap.exists()) throw new Error("El enlace de acceso no existe.");
  const d=snap.val();
  if(d.activo===false) throw new Error("Este acceso fue revocado.");
  if(d.expiraEn && Date.now()>d.expiraEn) throw new Error("Este acceso ya caducó.");
  accessName=d.nombre||"Persona autorizada";\n  accessRole=d.rol||"policia";\n  if(accessRole==="admin" && usersBtn){ usersBtn.hidden=false; usersBtn.onclick=()=>{ location.href="gestion-usuarios.html?admin="+encodeURIComponent(token); }; }
  accessInfo.textContent="Acceso: "+accessName;
  sessionStorage.setItem("sv_panel_token",token);
  sessionStorage.setItem("sv_panel_nombre",accessName);
  return true;
}

async function enableNotifications(){
  if(!("Notification" in window)){alert("Este navegador no permite notificaciones.");return;}
  const p=await Notification.requestPermission();
  if(p==="granted"){notifyBtn.textContent="🔔 Notificaciones activadas";notifyBtn.disabled=true;}
  else alert("Debes permitir las notificaciones del navegador para recibir avisos mientras el panel esté abierto.");
}
notifyBtn.onclick=enableNotifications;

function notifyNew(r){
  if(!("Notification" in window)||Notification.permission!=="granted") return;
  const title="🚨 Nuevo reporte vecinal";
  const body=(r.tipoSuceso||"Emergencia")+" • "+(r.folio||"Sin folio");
  if("serviceWorker" in navigator && navigator.serviceWorker.controller){
    navigator.serviceWorker.ready.then(reg=>reg.showNotification(title,{body,tag:"reporte-"+(r.folio||Date.now()),renotify:true,icon:"icon.svg",badge:"icon.svg",vibrate:[200,100,200]})).catch(()=>new Notification(title,{body}));
  }else new Notification(title,{body});
}

function summaryText(r){
  const partes=[
    "🚨 REPORTE DE SEGURIDAD VECINAL",
    "Folio: "+(r.folio||"Sin folio"),
    "Situación: "+(r.tipoSuceso||"Sin especificar"),
    r.descripcion?"Hechos: "+r.descripcion:"",
    "Estado: "+(r.estado||"nuevo").toUpperCase()
  ].filter(Boolean);
  return partes.join("\n");
}

async function shareReport(r){
  const text=summaryText(r);
  if(navigator.share){
    try{
      const data={title:"Reporte vecinal "+(r.folio||""),text};
      if(r.foto && navigator.canShare){
        try{
          const blob=await (await fetch(r.foto)).blob();
          const file=new File([blob],"reporte-"+(r.folio||"foto")+".jpg",{type:"image/jpeg"});
          if(navigator.canShare({files:[file]})) data.files=[file];
        }catch(_){}
      }
      await navigator.share(data); return;
    }catch(e){if(e.name==="AbortError") return;}
  }
  await navigator.clipboard?.writeText(text);
  alert("Resumen copiado. Puedes pegarlo en el grupo de seguridad.");
}

async function changeStatus(id,status){
  await update(ref(db,"registros/"+id),{estado:status,actualizadoEn:Date.now(),atendidoPor:accessName});
}

function render(data){
  const arr=Object.entries(data||{}).map(([id,r])=>({...r,id})).sort((a,b)=>(b.fechaHora||0)-(a.fechaHora||0));
  const current=new Set(arr.map(r=>r.id));
  if(!firstLoad) arr.filter(r=>!previousIds.has(r.id)).forEach(notifyNew);
  previousIds=current; firstLoad=false;
  if(!arr.length){setMessage("No hay reportes registrados.");return;}
  reports.innerHTML=arr.map(r=>{
    const d=r.fechaHora?new Date(r.fechaHora).toLocaleString("es-MX"):"Sin fecha";
    const loc=r.ubicacion&&typeof r.ubicacion.lat==="number"&&typeof r.ubicacion.lng==="number"
      ?'<a class="map" target="_blank" rel="noopener" href="https://www.google.com/maps?q='+r.ubicacion.lat+','+r.ubicacion.lng+'">📍 Abrir ubicación</a>':"";
    const photo=r.foto?'<img class="photo" src="'+r.foto+'" alt="Foto del reporte">':"";
    const status=r.estado||"nuevo";
    return '<article class="card report" data-id="'+esc(r.id)+'">'+
      '<div class="top"><span class="folio">'+esc(r.folio||"Sin folio")+'</span><span class="badge">'+esc(status.toUpperCase())+'</span></div>'+
      '<div class="row"><span class="label">Fecha:</span> '+esc(d)+'</div>'+
      '<div class="row"><span class="label">Emergencia:</span> '+esc(r.tipoSuceso||"Sin especificar")+'</div>'+
      '<div class="row"><span class="label">Descripción:</span><div class="desc">'+esc(r.descripcion||"Sin descripción")+'</div></div>'+
      (r.atendidoPor?'<div class="row"><span class="label">Atiende:</span> '+esc(r.atendidoPor)+'</div>':"")+
      loc+photo+
      '<div class="actions">'+
      '<button class="act attend" data-id="'+esc(r.id)+'" data-status="atendiendo">👮 Atender</button>'+
      '<button class="act done" data-id="'+esc(r.id)+'" data-status="atendido">✅ Atendido</button>'+
      '<button class="act close" data-id="'+esc(r.id)+'" data-status="cerrado">🔒 Cerrar</button>'+
      '<button class="act share" data-id="'+esc(r.id)+'">📤 Compartir resumen</button>'+
      '</div></article>';
  }).join("");
  reports.querySelectorAll("[data-status]").forEach(b=>b.onclick=async()=>{b.disabled=true;try{await changeStatus(b.dataset.id,b.dataset.status);}catch(e){alert("No se pudo actualizar el estado.");}finally{b.disabled=false;}});
  reports.querySelectorAll(".share").forEach(b=>b.onclick=()=>{const r=arr.find(x=>x.id===b.dataset.id);if(r)shareReport(r);});
}

async function start(){
  try{
    await verifyAccess();
    if("serviceWorker" in navigator) await navigator.serviceWorker.register("./sw.js");
    onValue(ref(db,"registros"),snap=>render(snap.val()),err=>setMessage("No se pudieron cargar los reportes: "+esc(err.message),"error"));
  }catch(e){setMessage("🚫 "+esc(e.message||e),"error");}
}
document.getElementById("refresh").onclick=()=>location.reload();

window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;installBtn.hidden=false;});
installBtn.onclick=async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;installBtn.hidden=true;};
if(window.matchMedia("(display-mode: standalone)").matches) installBtn.hidden=true;
start();
