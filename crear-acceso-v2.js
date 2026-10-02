import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getDatabase,ref,set } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
const cfg={apiKey:"AIzaSyAOP0jncNB7UcNLRYDhGxh0ehoy_4RmUeA",authDomain:"sistema-de-vigilancia-vecinal.firebaseapp.com",databaseURL:"https://sistema-de-vigilancia-vecinal-default-rtdb.firebaseio.com",projectId:"sistema-de-vigilancia-vecinal",storageBucket:"sistema-de-vigilancia-vecinal.firebasestorage.app",messagingSenderId:"349121257731",appId:"1:349121257731:web:629adbcb13c41788764936"};
const db=getDatabase(initializeApp(cfg));const $=id=>document.getElementById(id);
$("crear").onclick=async()=>{
 const nombre=$("nombre").value.trim(),rol=$("rol").value,dur=Number($("duracion").value);
 if(!nombre){alert("Escribe el nombre del elemento.");return;}
 try{
  const token=crypto.randomUUID().replaceAll("-","");
  const expiraEn=dur?Date.now()+dur:null;
  await set(ref(db,"accesosPanel/"+token),{nombre,rol,activo:true,creadoEn:Date.now(),expiraEn});
  const url=new URL("panel-acceso.html",location.href);url.searchParams.set("acceso",token);
  const o=$("resultado");o.classList.remove("hide");
  o.innerHTML="<strong>"+(rol==="admin"?"🛡️ Administrador":"👮 Policía")+" — "+nombre+"</strong><br><br>"+url.href+"<br><br><small>Este enlace es individual. No lo publiques en grupos.</small>";
 }catch(e){alert("No se pudo crear: "+(e.message||e))}
};