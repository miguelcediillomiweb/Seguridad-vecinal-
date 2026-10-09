# Seguridad Vecinal Camino Viejo

Sistema web de reportes vecinales publicado con GitHub Pages y Firebase Realtime Database.

## Archivos activos

- `index.html` + `app-folio-v2.js`: formulario público de reportes.
- `panel-acceso.html` + `panel-acceso-v5.js`: validación de acceso al panel.
- `panel.html` + `panel-estable.js`: panel de reportes para personal autorizado.
- `gestion-usuarios.html` + `gestion-usuarios.js`: administración de accesos.
- `crear-acceso.html` + `crear-acceso-v2.js`: creación de accesos.
- `styles.css`, `manifest.json`, `icon.svg`: estilos e instalación web.
- `sw-v5.js`: service worker registrado desde el formulario público.
- `sw.js`: service worker registrado desde el panel; incluye recepción de mensajes en segundo plano.

## Estado conocido

El formulario y los paneles ya existen y guardan/leen reportes de Realtime Database. El trabajo pendiente es completar y probar el envío de notificaciones desde un proceso confiable del lado del servidor a los dispositivos registrados, tanto de policías como de administradores, y la escalación si nadie confirma en 60 segundos.

**Importante:** la función local de mostrar una notificación al detectar un reporte en el panel no sustituye el envío push desde el servidor. No declarar el sistema listo para uso crítico hasta probar notificaciones con el panel cerrado, permisos del dispositivo, seguridad de reglas de Realtime Database y escalación.

## Respaldos

- `RESPALDO_ESTABLE_2026-10-02.md`
- `RESPALDO_ANTES_SEGURIDAD_FIREBASE_2026-10-02.md`

También existe la rama `respaldo-antes-depuracion-2026-10-09`, creada antes de retirar versiones antiguas no referenciadas.

## Privacidad y seguridad

No guardar PINes ni contraseñas en el repositorio. La configuración web de Firebase identifica el proyecto, pero la privacidad de los reportes debe protegerse con reglas de Realtime Database y permisos verificados del lado del servidor; ocultar un campo en la interfaz no es suficiente.
