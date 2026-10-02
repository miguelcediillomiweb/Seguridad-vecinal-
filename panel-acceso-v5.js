import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getDatabase, ref, get, push } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

const firebaseConfig={apiKey:"AIzaSyAOP0jncNB7UcNLRYDhGxh0ehoy_4RmUeA",authDomain:"sistema-de-vigilancia-vecinal.firebaseapp.com",databaseURL:"https://sistema-de-vigilancia-vecinal-default-rtdb.firebaseio.com",projectId:"sistema-de-vigilancia-vecinal",storageBucket:"sistema-de-vigilancia-vecinal.firebasestorage.app",messagingSenderId:"349121257731",appId:"1:349121257731:web:629adbcb13c41788764936"};
const app=initializeApp(firebaseConfig),db=getDatabase(app);
const loading=document.getElementById("loading"),denied=document.getElementById("denied"),welcome=document.getElementById("welcome"),who=document.getElementById("who"),deniedText=document.getElementById("deniedText");
const installBtn=document.getElementById("installApp"),openPanel=document.getElementById("openPanel");
let deferredInstallPrompt=null;

if("serviceWorker" in navigator){ navigator.serviceWorker.register("sw.js").catch(()=>{}); }

window.addEventListener("beforeinstallprompt",(event)=>{
 event.preventDefault();
 deferredInstallPrompt=event;
 installBtn.classList.remove("hide");
});

window.addEventListener("appinstalled",()=>{
 deferredInstallPrompt=null;
 installBtn.classList.add("hide");
});

function show(el){loading.classList.add("hide");denied.classList.add("hide");welcome.classList.add("hide");el.classList.remove("hide")}
const token=new URLSearchParams(location.search).get("acceso");

async function installThenOpen(){
 if(deferredInstallPrompt){
   try{
     await deferredInstallPrompt.prompt();
     await deferredInstallPrompt.userChoice;
   }catch(e){}
   deferredInstallPrompt=null;
   installBtn.classList.add("hide");
 }
 location.href=openPanel.href;
}

async function main(){
 if(!token||!/^[A-Za-z0-9_-]{12,80}$/.test(token)){deniedText.textContent="Falta el código de acceso en este enlace.";show(denied);return}
 try{
  const snap=await get(ref(db,"accesosPanel/"+token));
  if(!snap.exists()){show(denied);return}
  const data=snap.val();
  if(data.activo===false){deniedText.textContent="Este acceso fue revocado.";show(denied);return}
  if(data.expiraEn && Date.now()>data.expiraEn){deniedText.textContent="Este acceso ya caducó.";show(denied);return}
  who.textContent="Acceso asignado a: "+(data.nombre||"Persona autorizada");
  const deviceId=localStorage.getItem("sv_device_id")||crypto.randomUUID();
  localStorage.setItem("sv_device_id",deviceId);
  await push(ref(db,"accesosPanel/"+token+"/usos"),{momento:Date.now(),dispositivo:deviceId,referencia:navigator.userAgent.slice(0,180),fuente:document.referrer||"directo"});
  sessionStorage.setItem("sv_panel_token",token);
  sessionStorage.setItem("sv_panel_nombre",data.nombre||"Persona autorizada");
  sessionStorage.setItem("sv_panel_rol",data.rol||"policia");
  localStorage.setItem("sv_panel_token",token);
  localStorage.setItem("sv_panel_nombre",data.nombre||"Persona autorizada");
  localStorage.setItem("sv_panel_rol",data.rol||"policia");
  document.cookie="sv_panel_token="+encodeURIComponent(token)+"; Max-Age=31536000; Path=/; SameSite=Lax";
  document.cookie="sv_panel_nombre="+encodeURIComponent(data.nombre||"Persona autorizada")+"; Max-Age=31536000; Path=/; SameSite=Lax";
  document.cookie="sv_panel_rol="+encodeURIComponent(data.rol||"policia")+"; Max-Age=31536000; Path=/; SameSite=Lax";
  openPanel.href="panel.html?acceso="+encodeURIComponent(token);
  openPanel.addEventListener("click",(e)=>{
    e.preventDefault();
    installThenOpen();
  });
  installBtn.addEventListener("click",installThenOpen);
  show(welcome);
 }catch(err){deniedText.textContent="No se pudo verificar el acceso. Intenta nuevamente.";show(denied);console.error(err)}
}
main();