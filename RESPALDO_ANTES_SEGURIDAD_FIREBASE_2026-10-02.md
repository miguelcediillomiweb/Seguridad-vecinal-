# RESPALDO ANTES DE SEGURIDAD FIREBASE — 2026-10-02

Punto estable antes de cambiar autenticación y reglas de Firebase.

## Estado probado
- Reportes de emergencia funcionando.
- Foto y ubicación funcionando.
- Panel compartido entre policías.
- Flujo Nuevo → Atendiendo → Atendido → Cerrado funcionando.
- Nombre del reportante visible solo para administrador.
- Compartir resumen por WhatsApp sin nombre ni ubicación.
- PIN de 6 dígitos funcionando.
- Dispositivo recordado después del primer PIN.
- Restablecimiento de PIN invalida la autorización anterior.
- Revocación/eliminación de accesos disponible.

## Firebase actual
- Realtime Database sigue temporalmente con reglas públicas para no romper el sistema durante la migración.
- No cambiar las reglas hasta completar autenticación y probar el acceso.

## Regla de recuperación
Si el cambio de seguridad falla, este commit marca el último punto estable conocido. No guardar PINes ni credenciales en este respaldo.
