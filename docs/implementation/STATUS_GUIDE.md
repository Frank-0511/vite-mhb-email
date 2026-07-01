# Guía de mantenimiento del estado de implementación

## Propósito

`STATUS.md` es un resumen persistente para transferir el trabajo
entre agentes. No es un reporte detallado de ejecución ni reemplaza a Git.

## Estructura obligatoria

El archivo debe conservar estas secciones y este orden:

1. Resumen
2. Tareas completadas
3. Tarea actual
4. Validaciones
5. Decisiones persistentes
6. Desviaciones
7. Bloqueos
8. Handoff

No se deben crear, eliminar, renombrar ni reorganizar secciones.

## Estados permitidos

- `Pendiente`
- `En progreso`
- `En revisión`
- `Bloqueada`
- `Completada`

El agente ejecutor debe dejar la tarea como `En revisión`.

Una tarea solo puede pasar a `Completada` después de que otro agente o el usuario
revise:

- criterios de aceptación;
- diff;
- tests;
- lint;
- build;
- desviaciones.

## Información que debe registrarse

- tarea y fase actuales;
- estado actual;
- validaciones resumidas;
- decisiones que afecten tareas futuras;
- desviaciones respecto al plan;
- bloqueos reales;
- próxima acción necesaria;
- si el worktree está limpio o tiene cambios pendientes.

## Información que no debe registrarse

- logs completos;
- salida completa de tests;
- listas detalladas disponibles mediante `git diff`;
- explicaciones extensas de implementación;
- contenido duplicado del plan;
- conversaciones con el usuario;
- prompts;
- información específica de Claude, Codex o Antigravity;
- suposiciones no verificadas.

## Actualización al comenzar

El agente debe:

1. comprobar que la tarea solicitada coincide con el estado;
2. verificar sus dependencias;
3. cambiar su estado a `En progreso`;
4. no modificar la próxima tarea.

## Actualización al terminar

El agente debe:

1. cambiar la tarea a `En revisión`;
2. resumir los cambios en un máximo de cinco puntos;
3. registrar cada comando obligatorio como `Verde`, `Fallido` o `No ejecutado`;
4. documentar decisiones persistentes;
5. documentar desviaciones y bloqueos;
6. mantener bloqueada la siguiente tarea hasta la revisión;
7. entregar los detalles completos en su respuesta, no en este archivo.

## Fallos de validación

Si una validación obligatoria no fue ejecutada o falla:

- la tarea no puede marcarse como `Completada`;
- debe registrarse como `En revisión` o `Bloqueada`;
- debe indicarse la acción concreta necesaria;
- no se debe comenzar la siguiente tarea.
