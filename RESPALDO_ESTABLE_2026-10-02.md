# RESPALDO — Seguridad Vecinal — 2 octubre 2026

Este archivo marca el estado funcional respaldado del proyecto.

## Funciones comprobadas
- Reporte de emergencia con folio, ubicación y foto.
- Nombre del reportante visible únicamente para administrador.
- Policía ve ubicación y descripción, no el nombre del reportante.
- Flujo compartido: Nuevo → Atendiendo → Atendido → Cerrado.
- Identificación de policía que atiende.
- Compartir resumen por WhatsApp sin nombre ni ubicación.
- Gestión de policías.
- Copiar enlace individual.
- PIN de 6 dígitos para nuevos accesos.
- PIN almacenado como hash SHA-256; no se guarda el PIN visible.
- El dispositivo queda recordado después de la primera validación del PIN.
- Administrador puede restablecer el PIN; al hacerlo se invalida el acceso recordado del dispositivo anterior.
- Administrador puede eliminar un acceso sin borrar los reportes históricos.

## Respaldo en Git
GitHub conserva cada cambio como commit. Los cambios del sistema de PIN quedaron registrados en commits separados, por lo que pueden recuperarse aunque una modificación posterior falle.

Último commit de la cadena de PIN:
5239826b4443411767e02833ed9f521a050d2ebc

Panel estable previo:
850153d69e295702f6ad233f233649b01249af4a

No guardar aquí PIN, tokens ni contraseñas reales.
