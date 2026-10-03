importScripts("https://www.gstatic.com/firebasejs/12.3.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging-compat.js");
firebase.initializeApp({apiKey:"AIzaSyAOP0jncNB7UcNLRYDhGxh0ehoy_4RmUeA",authDomain:"sistema-de-vigilancia-vecinal.firebaseapp.com",databaseURL:"https://sistema-de-vigilancia-vecinal-default-rtdb.firebaseio.com",projectId:"sistema-de-vigilancia-vecinal",storageBucket:"sistema-de-vigilancia-vecinal.firebasestorage.app",messagingSenderId:"349121257731",appId:"1:349121257731:web:629adbcb13c41788764936"});
const messaging=firebase.messaging();
messaging.onBackgroundMessage(payload=>{
 const d=payload.data||{};
 const title=d.title||"🚨 Nuevo reporte de Seguridad Vecinal";
 const body=d.body||"Hay un nuevo reporte que requiere atención.";
 self.registration.showNotification(title,{body,tag:d.tag||("reporte-"+Date.now()),renotify:true,icon:"icon.svg",badge:"icon.svg",data:{url:d.url||"./panel.html"}});
});
const CACHE="seguridad-vecinal-pwa-v5";
const APP_SHELL=["./","./index.html","./styles.css","./panel.html","./manifest.json","./icon.svg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;const isCode=/\.(html?|js)$/.test(u.pathname);e.respondWith(fetch(e.request,{cache:isCode?"no-store":"default"}).then(r=>{if(r.ok&&!isCode){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));}return r;}).catch(()=>caches.match(e.request)));});
self.addEventListener("notificationclick",e=>{e.notification.close();const target=e.notification.data&&e.notification.data.url?e.notification.data.url:"./panel.html";e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{for(const c of list)if("focus"in c){c.focus();if("navigate"in c)return c.navigate(target);return c;}return clients.openWindow(target);}));});