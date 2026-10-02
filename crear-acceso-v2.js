import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getDatabase,ref,set } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
const cfg={apiKey:"AIzaSyAOP0jncNB7UcNLRYDhGxh0ehoy_4RmUeA",authDomain:"sistema-de-vigilancia-vecinal.firebaseapp.com",databaseURL:"https://sistema-de-vigilancia-vecinal-default-rtdb.firebaseio.com",projectId:"sistema-de-vigilancia-vecinal",storageBucket:"sistema-de-vigilancia-vecinal.firebasestorage.app",messagingSenderId:"349121257731",appId:"1:349121257731:web:629adbcb13c41788764936"};
const app=initializeApp(cfg),auth=getAuth(app),db=getDatabase(app);const $=id=>document.getElementById(id); async function hashPin(pin){const b=new TextEncoder().encode(pin);const h=await crypto.subtle.digest("SHA-256",b);return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join("");}
await signInAnonymously(auth);
$("crear").onclick=async()=>{
 const nombre=$("nombre").value.trim(),rol=$("rol").value,dur=Number($("duracion").value),pin=$("pin").value.trim();
 if(!nombre){alert("Escribe el nombre del elemento.");return;} if(!/^\d{6}$/.test(pin)){alert("El PIN debe tener exactamente 6 dígitos.");return;}
 try{
  const token=crypto.randomUUID().replaceAll("-","");
  const expiraEn=dur?Date.now()+dur:null;
  await set(ref(db,"accesosPanel/"+token),{nombre,rol,activo:true,creadoEn:Date.now(),expiraEn,pinHash:await hashPin(pin),pinVersion:Date.now()});
  const url=new URL("panel-acceso.html",location.href);url.searchParams.set("acceso",token);
  const o=$("resultado");o.classList.remove("hide");
  o.innerHTML="<strong>"+(rol==="admin"?"🛡️ Administrador":"👮 Policía")+" — "+nombre+"</strong><br><br>"+url.href+"<br><br><strong>🔐 PIN inicial:</strong> "+pin+"<br><br><small>Entrega el PIN personalmente y no lo publiques en grupos. El sistema no guardará el PIN visible.</small>";
 }catch(e){alert("No se pudo crear: "+(e.message||e))}
};