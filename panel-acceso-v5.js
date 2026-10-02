import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getDatabase, ref, get, push } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
const firebaseConfig={apiKey:"AIzaSyAOP0jncNB7UcNLRYDhGxh0ehoy_4RmUeA",authDomain:"sistema-de-vigilancia-vecinal.firebaseapp.com",databaseURL:"https://sistema-de-vigilancia-vecinal-default-rtdb.firebaseio.com",projectId:"sistema-de-vigilancia-vecinal",storageBucket:"sistema-de-vigilancia-vecinal.firebasestorage.app",messagingSenderId:"349121257731",appId:"1:349121257731:web:629adbcb13c41788764936"};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getDatabase(app);
const loading=document.getElementById("loading"),denied=document.getElementById("denied"),welcome=document.getElementById("welcome"),pinBox=document.getElementById("pinBox"),who=document.getElementById("who"),pinWho=document.getElementById("pinWho"),deniedText=document.getElementById("deniedText"),pinInput=document.getElementById("pinInput"),pinError=document.getElementById("pinError"),verifyPin=document.getElementById("verifyPin"),installBtn=document.getElementById("installApp"),openPanel=document.getElementById("openPanel");
await signInAnonymously(auth);
let deferredInstallPrompt=null;
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;installBtn.classList.remove("hide")});
window.addEventListener("appinstalled",()=>{deferredInstallPrompt=null;installBtn.classList.add("hide")});
function show(el){[loading,denied,pinBox,welcome].forEach(x=>x.classList.add("hide"));el.classList.remove("hide")}
const token=new URLSearchParams(location.search).get("acceso");
function deviceId(){let d=localStorage.getItem("sv_device_id");if(!d){d=crypto.randomUUID();localStorage.setItem("sv_device_id",d)}return d}
async function hashPin(pin){const b=new TextEncoder().encode(pin);const h=await crypto.subtle.digest("SHA-256",b);return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function saveAccess(data){const d=deviceId();sessionStorage.setItem("sv_panel_token",token);sessionStorage.setItem("sv_panel_nombre",data.nombre||"Persona autorizada");sessionStorage.setItem("sv_panel_rol",data.rol||"policia");localStorage.setItem("sv_panel_token",token);localStorage.setItem("sv_panel_nombre",data.nombre||"Persona autorizada");localStorage.setItem("sv_panel_rol",data.rol||"policia");localStorage.setItem("sv_pin_ok_"+token,String(data.pinVersion||"legacy"));document.cookie="sv_panel_token="+encodeURIComponent(token)+"; Max-Age=31536000; Path=/; SameSite=Lax";document.cookie="sv_panel_nombre="+encodeURIComponent(data.nombre||"Persona autorizada")+"; Max-Age=31536000; Path=/; SameSite=Lax";document.cookie="sv_panel_rol="+encodeURIComponent(data.rol||"policia")+"; Max-Age=31536000; Path=/; SameSite=Lax"}
async function enter(data){saveAccess(data);await push(ref(db,"accesosPanel/"+token+"/usos"),{momento:Date.now(),dispositivo:deviceId(),referencia:navigator.userAgent.slice(0,180),fuente:document.referrer||"directo"});who.textContent="Acceso asignado a: "+(data.nombre||"Persona autorizada");openPanel.href="panel.html?acceso="+encodeURIComponent(token);show(welcome)}
async function installThenOpen(){if(deferredInstallPrompt){try{await deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice}catch(e){}deferredInstallPrompt=null;installBtn.classList.add("hide")}location.href=openPanel.href}
async function main(){
 if(!token||!/^[A-Za-z0-9_-]{12,80}$/.test(token)){deniedText.textContent="Falta el código de acceso en este enlace.";show(denied);return}
 try{
  const snap=await get(ref(db,"accesosPanel/"+token));if(!snap.exists()){show(denied);return}
  const data=snap.val();if(data.activo===false){deniedText.textContent="Este acceso fue revocado.";show(denied);return}if(data.expiraEn&&Date.now()>data.expiraEn){deniedText.textContent="Este acceso ya caducó.";show(denied);return}
  pinWho.textContent="Acceso asignado a: "+(data.nombre||"Persona autorizada");
  if(data.pinHash){
   const remembered=localStorage.getItem("sv_pin_ok_"+token);if(remembered===String(data.pinVersion||"")){await enter(data);return}
   verifyPin.onclick=async()=>{const pin=pinInput.value.trim();if(!/^\d{6}$/.test(pin)){pinError.textContent="El PIN debe tener exactamente 6 dígitos.";pinError.classList.remove("hide");return}verifyPin.disabled=true;try{const hash=await hashPin(pin);if(hash!==data.pinHash){pinError.textContent="PIN incorrecto.";pinError.classList.remove("hide");pinInput.select();verifyPin.disabled=false;return}await enter(data)}catch(e){pinError.textContent="No se pudo verificar el PIN.";pinError.classList.remove("hide");verifyPin.disabled=false}};
   show(pinBox);setTimeout(()=>pinInput.focus(),100);return
  }
  await enter(data)
 }catch(err){deniedText.textContent="No se pudo verificar el acceso. Intenta nuevamente.";show(denied);console.error(err)}
}
openPanel.addEventListener("click",e=>{e.preventDefault();installThenOpen()});installBtn.addEventListener("click",installThenOpen);main();