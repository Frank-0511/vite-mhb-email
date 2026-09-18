# Plan de implementación — EmailForge Toolkit

Este es el contrato técnico completo del repositorio. Contiene todas las
features MHB-01 a MHB-25, sus dependencias, criterios de aceptación, pruebas,
riesgos y diseño de orquestación. `STATUS.md` registra solo la tarea que se
está ejecutando; no reduce ni sustituye este plan.

## Objetivo

Convertir `vite-mhb-email` en **EmailForge Toolkit**, una herramienta local
defendible de desarrollo de emails: creación y preview seguros, compilación
reproducible de HTML y una demostración verificable de cuatro casos de email.
La línea de partida es `master` en
`ce708cf178dcbb426d9aaa2cb5b8d2bd3b0b825c`, no las declaraciones históricas
del PLAN o STATUS originales.

## Usuario, problema y narrativa

- **Usuario:** desarrollador o diseñador que mantiene templates HTML para un
  ESP y necesita iterar sin editar HTML final a mano.
- **Problema:** el preview, la compilación y la exportación deben preservar
  variables ESP, reducir errores de compatibilidad y evitar que una entrada de
  CLI altere rutas o comandos fuera del template elegido.
- **Narrativa de portafolio:** una herramienta de DX especializada que integra
  Maizzle, Handlebars, Vite y validación de HTML email; demuestra decisiones de
  seguridad, calidad de pipeline y UX de una herramienta interna. No afirmará
  compatibilidad real con clientes hasta contar con evidencia manual trazable.

## Alcance y exclusiones

### Requerido

- Eliminar los P1 de nombres de template y ejecución por shell; dejar pruebas
  de regresión.
- Rebasar la documentación operativa y la trazabilidad posterior a `v1.1.0`
  sin reescribir el tag publicado.
- Cubrir todas las rutas de código relevantes en CI y crear pruebas del flujo
  crítico.
- Completar el flujo de producto pendiente: variables, errores accionables,
  descarga de HTML y cuatro templates de producto.
- Producir evidencia de accesibilidad, rendimiento y compatibilidad para la
  revisión final del producto.

### Opcional

- Demo pública estática, solo después de resolver la divergencia entre preview
  local y artefactos pre-renderizados.
- Ampliar la biblioteca de componentes después de documentar y estabilizar los
  componentes existentes.

### Fuera de alcance

- Migración global a TypeScript, publicación a npm, editor drag-and-drop,
  envío real de correos y reescritura del historial o del tag `v1.1.0`.

## Backlog priorizado

| ID     | Tipo                     | Feature o entregable                                       | Problema o hallazgo                                                                                                                                       | Prioridad | Dependencias                           | Criterios de aceptación                                                                                                                                                                          | Fase | Modelo sugerido | Esfuerzo sugerido |
| ------ | ------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- | --------------- | ----------------- |
| MHB-01 | Habilitador técnico      | Guard central de nombres de template                       | P1: generador, exportador y build selectivo no usan la validación existente.                                                                              | Requerida | Entorno de ejecución disponible        | Las tres rutas usan una única validación; entradas inválidas no crean, leen ni escriben fuera de la ruta permitida; pruebas de borde verdes.                                                     | A    | gpt-5.6-terra   | Alto              |
| MHB-02 | Habilitador técnico      | Ejecución de procesos sin shell                            | P1: el CLI reenvía nombre interactivo mediante `shell: true`.                                                                                             | Requerida | MHB-01                                 | El CLI no usa shell con argumentos de usuario; `build-helper` también queda endurecido o justificado; comandos conservan sus códigos de salida.                                                  | A    | gpt-5.6-terra   | Alto              |
| MHB-03 | Definición de producto   | Línea base documental y política de release                | P1/P2: PLAN, STATUS, workflow y notas posteriores al tag discrepan.                                                                                       | Requerida | Entorno de ejecución disponible        | PLAN/STATUS describen `ce708cf`, Bun 1.3.13, `bun.lock` y el CI real; se documenta cómo corregir/reconciliar la release sin mover `v1.1.0`.                                                      | A    | gpt-5.6-terra   | Medio             |
| MHB-04 | Habilitador técnico      | CI completo por cambios relevantes                         | P2: cambios de workflow, layouts y HTML web pueden omitir `verify`.                                                                                       | Requerida | MHB-01, MHB-02                         | Cambios en `.github/workflows/**`, `src/emails/layouts/**` y HTML/JS relevante de `src/web/**` activan los jobs aplicables; CI incluye formato y la suite declarada sin saltos silenciosos.      | A    | gpt-5.6-terra   | Alto              |
| MHB-05 | Habilitador técnico      | Pruebas de seguridad de comandos                           | P2: no hay regresiones de rutas, CLI ni restauración del build selectivo.                                                                                 | Requerida | MHB-01, MHB-02, MHB-04                 | Pruebas cubren traversal, nombres inválidos, códigos de salida y restauración ante fallo; CI las ejecuta.                                                                                        | B    | gpt-5.6-terra   | Alto              |
| MHB-06 | Feature                  | Validación de variables ESP                                | F1-T1 pendiente: no se reportan `{{ variable }}` faltantes o sobrantes.                                                                                   | Requerida | MHB-05                                 | Reporta faltantes como warning y sobrantes como info sin falsos positivos; se integra en preview y antes de build/exportación.                                                                   | B    | gpt-5.6-terra   | Alto              |
| MHB-07 | Feature                  | Errores accionables en preview                             | F1-T2 pendiente: `/api/render` devuelve 500 genérico.                                                                                                     | Requerida | MHB-05                                 | El preview muestra causa y ubicación cuando existan, con respuesta estructurada y sin rutas absolutas.                                                                                           | B    | gpt-5.6-terra   | Alto              |
| MHB-08 | Feature                  | Descargar HTML final                                       | F1-T3 pendiente: solo existe copiar HTML.                                                                                                                 | Requerida | MHB-07                                 | El dashboard descarga `<template>.html` equivalente al HTML compilado; error y nombre son seguros.                                                                                               | B    | gpt-5.6-terra   | Medio             |
| MHB-09 | Definición de producto   | Catálogo de templates de producto                          | El dashboard listaba solo `welcome` y excluía `example` y `user-created`; arquetipos no existían.                                                         | Requerida | MHB-06                                 | Se define el catálogo final de cuatro casos y qué fixtures salen del dashboard, sin referencias colgantes.                                                                                       | B    | gpt-5.6-terra   | Medio             |
| MHB-10 | Feature                  | Template password-reset                                    | Falta caso transaccional profesional.                                                                                                                     | Requerida | MHB-06, MHB-09                         | Compila sin errores, preserva `{{ reset_url }}`, contiene aviso de seguridad y pasa validadores.                                                                                                 | B    | gpt-5.6-terra   | Medio             |
| MHB-11 | Feature                  | Template receipt                                           | Falta caso transaccional de detalle.                                                                                                                      | Requerida | MHB-06, MHB-09                         | Compila sin errores, presenta ítems/totales y pasa validadores de tablas y variables.                                                                                                            | B    | gpt-5.6-terra   | Medio             |
| MHB-12 | Feature                  | Template newsletter                                        | Falta caso de marketing profesional.                                                                                                                      | Requerida | MHB-06, MHB-09                         | Compila sin errores y contiene un enlace de baja verificable por el validador.                                                                                                                   | B    | gpt-5.6-terra   | Medio             |
| MHB-13 | Habilitador técnico      | Cobertura de tipos y rendimiento                           | Typecheck parcial y sin métricas reproducibles.                                                                                                           | Requerida | MHB-19, MHB-20                         | `checkJs` cubre los scripts relevantes sin migración global; mediciones repetidas documentan Bun, Node, SO y método.                                                                             | C    | gpt-5.6-terra   | Alto              |
| MHB-14 | Entregable de portafolio | Evidencia de uso y compatibilidad                          | Sin revisión de teclado/lector ni pruebas en clientes reales.                                                                                             | Requerida | MHB-07, MHB-08, MHB-10, MHB-11, MHB-12 | Checklist manual reproducible para teclado/lector y matriz con evidencia fechada de Gmail, Outlook y Apple Mail.                                                                                 | C    | gpt-5.6-terra   | Alto              |
| MHB-15 | Entregable de portafolio | Documentación, capturas y release posterior                | La narrativa y trazabilidad de release son parciales.                                                                                                     | Requerida | MHB-03, MHB-13, MHB-14, MHB-18, MHB-22 | README, CHANGELOG, versión, tag y release posterior coinciden; capturas son actuales e incluye límites verificables, no reclamos no probados.                                                    | C    | gpt-5.6-terra   | Medio             |
| MHB-16 | Feature                  | Demo candidata pre-renderizada                             | No hay despliegue verificable y el preview requiere servidor.                                                                                             | Opcional  | MHB-13, MHB-14, MHB-15                 | Se decide y prueba una demo solo lectura sin divergencia respecto al HTML compilado; el despliegue candidato se enlaza para verificación.                                                        | D    | gpt-5.6-terra   | Alto              |
| MHB-17 | Feature                  | Alternar render y código fuente                            | F1-T4 quedó omitida en la primera versión del plan.                                                                                                       | Requerida | MHB-07                                 | El usuario alterna vista renderizada/código escapado sin recompilación redundante; el estado dura la sesión y tiene prueba de estado.                                                            | B    | gpt-5.6-terra   | Medio             |
| MHB-18 | Entregable de portafolio | Guía de componentes y matriz documentada                   | F1-T9 pedía una guía reproducible y documentación de compatibilidad.                                                                                      | Requerida | MHB-10, MHB-11, MHB-12                 | Un usuario crea un componente con `index.html` y `schema.json` usando solo la guía; la matriz distingue validación estática de pruebas reales.                                                   | B    | gpt-5.6-terra   | Medio             |
| MHB-19 | Habilitador técnico      | Unit tests de helpers y reglas                             | F2-T2/T3 exigían cobertura granular, diluida en el plan anterior.                                                                                         | Requerida | MHB-05, MHB-06                         | Helpers críticos tienen casos felices/borde; cada regla de compatibilidad tiene al menos un positivo y un negativo.                                                                              | C    | gpt-5.6-terra   | Alto              |
| MHB-20 | Habilitador técnico      | Integración build, render, caché y exportación             | F2-T4/T5 exigían comprobar el flujo extremo a extremo.                                                                                                    | Requerida | MHB-07, MHB-10, MHB-11, MHB-12         | Tests temporales comprueban flatten, `{{ }}`, `[[ ]]`, gate, tema, `theme+dataHash` y exportación HTML sin depender de binarios PNG.                                                             | C    | gpt-5.6-terra   | Alto              |
| MHB-21 | Definición de producto   | Resolver links placeholder                                 | Tres outputs conservan `href="#"` como warnings.                                                                                                          | Requerida | MHB-09, MHB-10, MHB-11, MHB-12         | Los cuatro templates de producto no generan warnings de links placeholder o documentan una excepción de fixture fuera del catálogo.                                                              | B    | gpt-5.6-terra   | Medio             |
| MHB-22 | Entregable de portafolio | Licencia MIT verificable                                   | `package.json` declara MIT, pero falta `LICENSE`.                                                                                                         | Requerida | MHB-03                                 | Existe archivo de licencia coherente con metadata y autoría; README lo enlaza.                                                                                                                   | A    | gpt-5.6-terra   | Bajo              |
| MHB-23 | Feature                  | Ampliar biblioteca de componentes                          | F3-T2 estaba mencionada sin ID ni cierre.                                                                                                                 | Opcional  | MHB-18, MHB-20                         | Cada componente adicional es email-safe, tiene schema, aparece en `/library` y cuenta con validación/prueba aplicable.                                                                           | D    | gpt-5.6-terra   | Medio             |
| MHB-24 | Habilitador técnico      | Modularización segura de validación, componentes y preview | Las superficies de validación ESP, components API, HMR preview, modal copy HTML y helper ESP crecieron acopladas y comparten responsabilidades con la UI. | Requerida | MHB-05, MHB-06                         | Contratos de build/preview/API conservados; `componentName` y `variant` inseguros se invalidan antes de tocar rutas; pruebas focalizadas verdes por módulo; sin cambios de severidad ni de gate. | B    | gpt-5.6-terra   | Alto              |

<!-- markdownlint-disable MD060 -->

| MHB-25 | Feature | Upgrade del sistema visual web | Home, Preview y Library necesitan una identidad visual coherente, accesible y responsive sin alterar el pipeline de email. | Requerida | MHB-24 | Tokens Space Blue en Home, Preview y Library; gates por fase en dark/light y móvil/desktop; sin cambios de email, APIs Vite ni pipeline. | B | gpt-5.6-terra | Alto |
| MHB-26 | Habilitador técnico | Validación automatizada de accesibilidad y contraste | La verificación de contraste WCAG y accesibilidad del dashboard dependía de revisión manual en navegador. | Requerida | MHB-25 | Un validador de contraste por tokens y un checker de accesibilidad (axe-core sobre el Puppeteer existente) reportan hallazgos por texto sin abrir el navegador; hallazgos de contraste existentes quedan documentados, no corregidos en este ID. | D | gpt-5.6-terra | Medio |
| MHB-27 | Habilitador técnico | Corregir hallazgos de MHB-26 y estabilizar `a11y-check` | `lint:contrast` reporta `action-primary` bajo AA; `a11y-check` reportaba 9 violaciones que resultaron ser falsos positivos por una carrera con el optimizador de dependencias de Vite, que enmascaraban un hallazgo real (`meta-viewport`/zoom deshabilitado). | Requerida | MHB-26 | `lint:contrast` y `a11y-check` corren en verde; `a11y-check.js` espera de forma determinista el full-reload del optimizador de Vite antes de auditar, sin falsos positivos reproducibles; el contrato de `action-primary` en `DESIGN.md` coincide con el componente real; el viewport permite zoom táctil. | D | gpt-5.6-terra | Medio |
| MHB-28 | Habilitador técnico | Modularización de superficies web sobredimensionadas | `src/web/features/preview/` concentra 7.150 líneas (~72 % del código web) en archivos que ya no son mantenibles: `styles.css` (776 líneas, 9 dominios, 112 selectores por ID, 20 `!important`), `preview.html` (666 líneas con ~180 de skeletons y 52 de JS embebido) y `copy-html-modal.css` (476). `preview-ready.js` repite siete veces el par oculta-skeleton/muestra-contenido. Además hay `styles.css` cargado dos veces, una regla CSS muerta y cinco fragmentos HTML huérfanos de un intento de componentización abandonado. | Requerida | MHB-24, MHB-25, MHB-27 | Ningún archivo no-test de `src/web/**` supera 300 líneas; `preview.html` no contiene lógica JS; los skeletons se declaran con un Web Component en light DOM y `preview-ready.js` deja de enumerar pares de IDs a mano; cero cambio visual comprobado por `a11y-check`/`lint:contrast` y recorrido dark/light; `dist/` idéntico byte a byte antes y después. | D | gpt-5.6-terra | Alto |

<!-- markdownlint-enable MD060 -->

## Detalle ejecutable de las fases inmediatas

### MHB-01 — Guard central de nombres

- **Objetivo:** usar un único contrato runtime para nombres de template en
  generador, exportador y build selectivo.
- **Archivos previstos:** `scripts/shared/path-safety.js`, generador,
  exportador, build selectivo y tests asociados.
- **Aceptación:** nombres válidos conservan comportamiento; traversal,
  separadores, absolutos, vacíos y metacaracteres fallan antes de tocar disco.
- **Pruebas/validación:** unitarias de tabla y prueba temporal de no escritura;
  lint, typecheck, test, formato y acción CLI afectada.
- **Riesgo:** romper nombres históricos válidos; cualquier cambio del patrón se
  escala al orquestador.
- **Fuera de alcance:** renombrar templates existentes.
- **Dependencias y precondiciones:** entorno de ejecución disponible; inventariar las tres rutas antes de cambiar el patrón.
- **Pasos técnicos previstos:** extraer un guard runtime único, enrutar generador/exportador/build selectivo y añadir casos de borde aislados.
- **Validación automática:** tabla unitaria, no-escritura temporal, lint, typecheck, test y formato.
- **Validación manual:** ejecutar las acciones CLI afectadas con nombre válido e inválido.
- **Evidencia requerida:** inventario de rutas, casos cubiertos y salida resumida sin rutas sensibles.
- **Implementador:** perfil de seguridad/CLI, alto.
- **Revisor independiente o autoridad de cierre:** revisor de seguridad distinto del implementador.
- **Condición de escalamiento:** cualquier cambio del patrón permitido, filesystem o compatibilidad multiplataforma.

### MHB-02 — Procesos sin shell

- **Objetivo:** retirar shell de toda ruta que reciba o pueda reenviar entrada
  de usuario y endurecer el helper literal restante.
- **Archivos previstos:** `scripts/cli/helpers.js`, acciones CLI,
  `scripts/build/build-helper.js` y tests.
- **Aceptación:** argumentos viajan como array sin interpretación del shell;
  señales/errores/códigos de salida se propagan; el helper literal queda sin
  shell o con excepción documentada y revisada.
- **Pruebas/validación:** proceso hijo controlado con espacios/metacaracteres,
  acciones CLI y suite global aplicable.
- **Riesgo:** diferencias Windows/WSL/macOS; escalar si exige comandos
  específicos de plataforma.
- **Fuera de alcance:** rediseñar la interfaz interactiva completa.
- **Dependencias y precondiciones:** MHB-01 en revisión y matriz de invocaciones CLI/build conocida.
- **Pasos técnicos previstos:** sustituir invocaciones con arrays de argumentos, endurecer o justificar helper literal y conservar propagación de errores.
- **Validación automática:** proceso hijo controlado con espacios/metacaracteres, acciones CLI, lint, typecheck, test y formato.
- **Validación manual:** comprobar códigos de salida y mensajes de una ejecución controlada.
- **Evidencia requerida:** diff de procesos, resultados de casos y justificación de cualquier excepción literal.
- **Implementador:** perfil de seguridad/CLI, alto.
- **Revisor independiente o autoridad de cierre:** revisor de seguridad distinto del implementador.
- **Condición de escalamiento:** diferencias Windows/WSL/macOS o un cambio de contrato CLI.

### MHB-03 — Reconciliación documental y de release

- **Objetivo:** convertir PLAN/STATUS actuales en fuentes fiables sin mover ni
  reescribir `v1.1.0`.
- **Archivos previstos:** documentación de implementación, README y CHANGELOG;
  notas remotas solo con autorización explícita.
- **Aceptación:** línea base, Bun, lockfile, CI, `dist`, capturas, HEAD y tag no
  se contradicen; se registra qué contenido pertenece al tag y qué es posterior.
- **Pruebas/validación:** diff `v1.1.0..HEAD`, revisión de tag/remote, enlaces,
  lint Markdown y formato.
- **Riesgo:** presentar como publicada información posterior al tag.
- **Fuera de alcance:** reescribir tag, historial o publicar una release.
- **Dependencias y precondiciones:** entorno de ejecución disponible; disponer de HEAD, tag y fuentes documentales verificables.
- **Pasos técnicos previstos:** contrastar versiones, lockfile, CI, dist, capturas y tag; separar hechos del tag de cambios posteriores.
- **Validación automática:** diff `v1.1.0..HEAD`, comprobación de enlaces/metadata, lint Markdown y formato.
- **Validación manual:** revisar SHA, tag, workflow y narrativa de release.
- **Evidencia requerida:** matriz de reconciliación y enlaces a fuentes comprobadas.
- **Implementador:** perfil de documentación/release, medio.
- **Revisor independiente o autoridad de cierre:** orquestador.
- **Condición de escalamiento:** un tag, versión, release o decisión de autoría no sustentada.

### MHB-04 — CI por rutas relevantes

- **Objetivo:** que ningún cambio capaz de afectar el producto evite sus gates.
- **Archivos previstos:** `.github/workflows/ci.yml` y tests/documentación de
  la matriz de rutas si son necesarios.
- **Aceptación:** workflow, layouts, templates, HTML/JS web, scripts,
  configuración y dependencias disparan lint/verify adecuados; formato entra
  en CI; jobs omitidos quedan justificados por datos.
- **Pruebas/validación:** sintaxis, matriz ruta→job, suite local y runs remotos
  de casos representativos antes de completar.
- **Riesgo:** duplicar instalaciones o aumentar costo innecesario.
- **Fuera de alcance:** deploy y publicación de release.
- **Dependencias y precondiciones:** MHB-01 y MHB-02 en revisión; inventario de rutas y jobs actuales.
- **Pasos técnicos previstos:** actualizar filtros/matriz, incluir formato y documentar cada omisión justificada.
- **Validación automática:** sintaxis de workflow, matriz ruta→job y suite local completa.
- **Validación manual:** confirmar runs remotos para cambios de workflow, layouts y HTML/JS web.
- **Evidencia requerida:** URL de run, tabla ruta→job y resultados de controles.
- **Implementador:** perfil CI, alto.
- **Revisor independiente o autoridad de cierre:** revisor técnico distinto del implementador.
- **Condición de escalamiento:** ampliar permisos, publicar artefactos o modificar release.

### MHB-22 — Licencia verificable

- **Objetivo:** materializar la licencia MIT declarada y alinear metadata.
- **Archivos previstos:** `LICENSE`, README y metadata si discrepa.
- **Aceptación:** texto y titular están sustentados por autoría; enlaces y
  metadata coinciden.
- **Pruebas/validación:** lint Markdown cuando aplique y revisión manual de
  autoría/licencia por el orquestador.
- **Riesgo:** introducir un titular o año no comprobados.
- **Fuera de alcance:** asesoría legal o relicenciamiento.
- **Dependencias y precondiciones:** MHB-03 en revisión y autoría/titular verificables.
- **Pasos técnicos previstos:** añadir licencia, enlazar README y alinear metadata solo si existe discrepancia comprobada.
- **Validación automática:** lint Markdown y comprobación de existencia/enlace/metadata.
- **Validación manual:** revisión de titular, año y alcance por el orquestador.
- **Evidencia requerida:** diff de LICENSE/README/metadata y fuente de autoría.
- **Implementador:** perfil documentación, bajo.
- **Revisor independiente o autoridad de cierre:** orquestador.
- **Condición de escalamiento:** incertidumbre legal, de titularidad o de licencia.

### MHB-05 — Pruebas de seguridad de comandos

- **Objetivo observable:** convertir los controles de MHB-01/MHB-02/MHB-04 en regresiones automatizadas del flujo CLI y filesystem.
- **Superficies autorizadas:** tests de scripts, helpers de build/CLI, fixtures temporales y configuración de suite/CI relacionada.
- **Dependencias y precondiciones:** MHB-01, MHB-02 y MHB-04 revisados; no usar archivos de usuario como fixture.
- **Pasos técnicos:** cubrir nombres válidos e inválidos, traversal, metacaracteres, códigos de salida y restauración tras fallo; conectar la suite al CI.
- **Criterios de aceptación:** las rutas inseguras no leen ni escriben fuera del directorio permitido y los fallos no dejan artefactos parciales.
- **Validación automática:** suite de regresión de comandos y filesystem, lint, typecheck, formato y CI.
- **Validación manual:** revisar mensajes, códigos y recuperación de un fallo controlado.
- **Evidencia requerida:** inventario de casos, resultados resumidos y diff de procesos/targets.
- **Riesgos y reversión:** fixtures frágiles o dependientes de SO; aislar en temporales y revertir solo los tests/configuración del ID.
- **Exclusiones específicas:** no rediseñar el CLI ni añadir soporte de shells.
- **Implementador:** perfil técnico alto con propiedad exclusiva de tests y helpers afectados.
- **Revisor independiente:** seguridad/CLI; no quien implementó la ruta.
- **Condición de escalamiento:** una incompatibilidad multiplataforma o cambio del contrato de comandos.

### MHB-06 — Validación de variables ESP

- **Objetivo observable:** informar variables `{{ }}` faltantes como warning y sobrantes como info sin falsos positivos.
- **Superficies autorizadas:** validadores de templates/datos, preview, build/exportación y tests/fixtures de variables.
- **Dependencias y precondiciones:** MHB-05 cerrado en revisión; conservar delimitadores admitidos y ejemplos intencionales.
- **Pasos técnicos:** definir comparación template/datos, clasificar severidad y exponer el resultado antes de preview y build/exportación.
- **Criterios de aceptación:** faltantes y sobrantes se distinguen correctamente y no bloquean un caso válido por una variable ESP conocida.
- **Validación automática:** fixtures faltante, sobrante, helper y variable intencional; lint, typecheck y suite aplicable.
- **Validación manual:** provocar cada categoría desde preview y confirmar el aviso previo a exportar/build.
- **Evidencia requerida:** payload/captura sin secretos y test del gate.
- **Riesgos y reversión:** interpretar mal sintaxis de ESP; conservar fixtures positivos/negativos y revertir la regla aislada.
- **Exclusiones específicas:** no prometer compatibilidad real con clientes de correo.
- **Implementador:** perfil de compatibilidad de email, alto.
- **Revisor independiente:** seguridad/compatibilidad.
- **Condición de escalamiento:** cambiar semántica de delimitadores o severidades de producto.

### MHB-07 — Errores accionables en preview

- **Objetivo observable:** reemplazar el 500 genérico de `/api/render` por un error estructurado, seguro y útil.
- **Superficies autorizadas:** handler API de render, cliente/dashboard de preview y pruebas de API/UI.
- **Dependencias y precondiciones:** MHB-05; definir qué causa y ubicación son seguras de exponer.
- **Pasos técnicos:** normalizar errores, devolver estado/payload adecuados, sanitizar rutas y representarlos en la interfaz.
- **Criterios de aceptación:** el preview muestra causa y ubicación cuando existen, sin rutas absolutas, stack traces ni secretos.
- **Validación automática:** tests de handler 422/payload/sanitización y cliente de error.
- **Validación manual:** provocar un error real y revisar desktop/móvil.
- **Evidencia requerida:** captura segura, payload de prueba y resultados de tests.
- **Riesgos y reversión:** filtrar detalles internos o romper clientes existentes; mantener un contrato de payload versionado en tests.
- **Exclusiones específicas:** no rediseñar todo el dashboard ni cambiar rutas públicas sin aprobación.
- **Implementador:** perfil UX/API, alto, con propiedad de la superficie preview.
- **Revisor independiente:** revisor UX/API.
- **Condición de escalamiento:** exponer rutas, cambiar payload público o requerir arquitectura nueva.

### MHB-08 — Descargar HTML final

- **Objetivo observable:** permitir descargar `<template>.html` equivalente al HTML compilado.
- **Superficies autorizadas:** dashboard de preview, utilidad de descarga, render/exportación y pruebas de estado.
- **Dependencias y precondiciones:** MHB-07; el nombre de template debe pasar el guard de MHB-01.
- **Pasos técnicos:** reutilizar HTML compilado, sanitizar nombre, generar descarga y mostrar fallos recuperables.
- **Criterios de aceptación:** el archivo descargado es equivalente al compilado y no acepta un nombre inseguro.
- **Validación automática:** pruebas de utilidad de descarga, nombre y estado; suite UI aplicable.
- **Validación manual:** descargar, abrir y comparar un template representativo.
- **Evidencia requerida:** archivo comparado, captura y prueba de estado.
- **Riesgos y reversión:** divergencia con build o inyección en nombre; reutilizar fuente compilada y revertir UI/utility juntas.
- **Exclusiones específicas:** no añadir ZIP, persistencia ni envío a ESP.
- **Implementador:** perfil UX/API, medio.
- **Revisor independiente:** revisor UX/API.
- **Condición de escalamiento:** exigir almacenamiento, autenticación o una API nueva.

### MHB-09 — Catálogo de templates de producto

- **Objetivo observable:** definir cuatro casos de producto y retirar scaffolds visibles del dashboard.
- **Superficies autorizadas:** catálogo/listado, fixtures, templates visibles, rutas de preview y documentación relacionada.
- **Dependencias y precondiciones:** MHB-06; inventariar referencias existentes antes de retirar un fixture.
- **Pasos técnicos:** fijar catálogo, clasificar fixtures internos, actualizar navegación y eliminar referencias colgantes.
- **Criterios de aceptación:** cuatro casos definidos son visibles y los scaffolds no aparecen como producto.
- **Validación automática:** build, validadores y tests de catálogo/rutas aplicables.
- **Validación manual:** recorrer dashboard y confirmar ausencia de enlaces rotos.
- **Evidencia requerida:** tabla de catálogo, resultados por template y capturas actuales.
- **Riesgos y reversión:** perder fixture útil o enlace interno; preservar fixtures de prueba fuera del catálogo.
- **Exclusiones específicas:** no crear templates todavía ni cambiar identidad de marca.
- **Implementador:** perfil de producto/email, medio.
- **Revisor independiente:** revisor de email.
- **Condición de escalamiento:** decisión de marca, contenido o retirada de material con autoría incierta.

### MHB-10 — Template password-reset

- **Objetivo observable:** añadir un email transaccional profesional de recuperación de contraseña.
- **Superficies autorizadas:** template, layout/componentes y schema/datos asociados del catálogo.
- **Dependencias y precondiciones:** MHB-06 y MHB-09; preservar `{{ reset_url }}`.
- **Pasos técnicos:** crear contenido/layout email-safe, schema y validaciones, y registrar el template en catálogo.
- **Criterios de aceptación:** compila sin errores, conserva `{{ reset_url }}`, incluye aviso de seguridad y pasa validadores.
- **Validación automática:** build, validate-email, pruebas de variables/tablas y lint/format aplicables.
- **Validación manual:** revisar desktop/móvil, enlace y contenido transaccional.
- **Evidencia requerida:** output `dist/`, resultados de validación y capturas.
- **Riesgos y reversión:** diseño incompatible o URL eliminada; mantener fixture y revertir template/schema juntos.
- **Exclusiones específicas:** no integrar flujos reales de autenticación.
- **Implementador:** perfil email, medio.
- **Revisor independiente:** revisor de email/compatibilidad.
- **Condición de escalamiento:** una regla de compatibilidad impida el diseño o haga falta decisión de marca.

### MHB-11 — Template receipt

- **Objetivo observable:** añadir un recibo transaccional con ítems y totales verificables.
- **Superficies autorizadas:** template, tablas/layout, schema/datos y catálogo.
- **Dependencias y precondiciones:** MHB-06 y MHB-09; definir fixture sin datos reales.
- **Pasos técnicos:** modelar ítems/totales, crear markup email-safe y conectar variables al validador.
- **Criterios de aceptación:** compila sin errores, presenta ítems/totales y pasa validadores de tablas y variables.
- **Validación automática:** build, validadores, tests de schema/variables y lint aplicable.
- **Validación manual:** revisar legibilidad de tabla en desktop/móvil.
- **Evidencia requerida:** `dist/`, resultados por template y capturas.
- **Riesgos y reversión:** tabla frágil en clientes; probar estructura mínima y revertir template/schema juntos.
- **Exclusiones específicas:** no conectar pagos ni datos de pedidos reales.
- **Implementador:** perfil email, medio.
- **Revisor independiente:** revisor de email/compatibilidad.
- **Condición de escalamiento:** una regla de cliente impida la tabla o surja decisión de contenido.

### MHB-12 — Template newsletter

- **Objetivo observable:** añadir un newsletter de marketing con baja verificable.
- **Superficies autorizadas:** template, componentes/layout, schema/datos y catálogo.
- **Dependencias y precondiciones:** MHB-06 y MHB-09; fijar variable/enlace de baja seguro.
- **Pasos técnicos:** crear markup de marketing email-safe, contenido de ejemplo, schema y enlace de unsubscribe.
- **Criterios de aceptación:** compila sin errores y contiene un enlace de baja verificable por el validador.
- **Validación automática:** build, validate-email, prueba de enlace y reglas de variables.
- **Validación manual:** revisar contenido, jerarquía y enlace en desktop/móvil.
- **Evidencia requerida:** `dist/`, validaciones y capturas.
- **Riesgos y reversión:** enlace placeholder o contenido no aprobado; mantener datos ficticios y revertir template/schema juntos.
- **Exclusiones específicas:** no operar listas, consentimientos ni campañas reales.
- **Implementador:** perfil email, medio.
- **Revisor independiente:** revisor de email/compatibilidad.
- **Condición de escalamiento:** surja requisito legal, de marca o de plataforma de mailing.

### MHB-13 — Cobertura de tipos y rendimiento

- **Objetivo observable:** ampliar `checkJs` de forma gradual y documentar mediciones repetibles.
- **Superficies autorizadas:** configuración de typecheck, scripts relevantes, tests/medición y documentación técnica.
- **Dependencias y precondiciones:** MHB-19 y MHB-20; conservar compatibilidad JavaScript sin migración global.
- **Pasos técnicos:** seleccionar scripts de mayor riesgo, corregir tipos progresivamente y medir con Bun, Node, SO y método declarados.
- **Criterios de aceptación:** checkJs cubre scripts relevantes sin migración global y las mediciones son repetibles y contextualizadas.
- **Validación automática:** typecheck ampliado, suite y script de medición reproducible.
- **Validación manual:** revisar entorno, repeticiones y variabilidad.
- **Evidencia requerida:** tabla Bun/Node/SO, comandos, repeticiones y resultados.
- **Riesgos y reversión:** scope creep a TypeScript o métricas engañosas; limitar archivos y conservar baseline.
- **Exclusiones específicas:** no fijar budget CI ni migrar todo a TypeScript.
- **Implementador:** perfil de tipos/rendimiento, alto.
- **Revisor independiente:** revisor técnico.
- **Condición de escalamiento:** exigir migración global, presupuesto CI o métricas de producción.

### MHB-14 — Evidencia de uso y compatibilidad

- **Objetivo observable:** producir checklist reproducible de accesibilidad y matriz fechada de clientes reales.
- **Superficies autorizadas:** protocolo/checklist, capturas, matriz documental y templates de producto.
- **Dependencias y precondiciones:** MHB-07, MHB-08, MHB-10, MHB-11 y MHB-12; disponer de los clientes/dispositivos declarados.
- **Pasos técnicos:** definir criterios de teclado/lector, ejecutar protocolo en Gmail, Outlook y Apple Mail, y registrar límites.
- **Criterios de aceptación:** cada prueba tiene fecha, cliente, criterio, resultado y evidencia; no se sustituyen clientes reales por un validador estático.
- **Validación automática:** validadores disponibles y lint de matriz, sin presentarlos como prueba real.
- **Validación manual:** teclado, lector y clientes de correo según protocolo.
- **Evidencia requerida:** matriz por cliente/criterio, capturas sin secretos y limitaciones.
- **Riesgos y reversión:** afirmar cobertura no realizada o filtrar datos; usar cuentas/fixtures seguros y marcar no verificado.
- **Exclusiones específicas:** no certificar accesibilidad ni compatibilidad universal.
- **Implementador:** perfil de evidencia/compatibilidad, alto.
- **Revisor independiente:** orquestador o revisor con acceso a clientes.
- **Condición de escalamiento:** falta acceso a cliente/dispositivo o aparecen datos sensibles.

### MHB-15 — Documentación, capturas y release posterior

- **Objetivo observable:** dejar README, CHANGELOG, versión, tag y release posterior coherentes y sustentados.
- **Superficies autorizadas:** README, CHANGELOG, versión/package metadata, capturas, notas de release y documentación relacionada.
- **Dependencias y precondiciones:** MHB-03, MHB-13, MHB-14, MHB-18 y MHB-22; decisión explícita antes de publicar o etiquetar.
- **Pasos técnicos:** reconciliar narrativa/evidencia, actualizar versión y changelog del alcance real, preparar tag/release solo tras revisión.
- **Criterios de aceptación:** documentación, versión, tag y release posterior coinciden; capturas son actuales y los límites no se presentan como hechos no probados.
- **Validación automática:** lint Markdown, suite, build y comprobación de consistencia de versión.
- **Validación manual:** revisar README, capturas, changelog, SHA/tag y notas antes de publicar.
- **Evidencia requerida:** SHA, tag, URL de release, diff final y checklist de capturas.
- **Riesgos y reversión:** publicar una afirmación adelantada; detener antes de acciones externas y revertir documentación local si corresponde.
- **Exclusiones específicas:** no publicar automáticamente ni modificar `v1.1.0`.
- **Implementador:** perfil documentación/release, medio.
- **Revisor independiente:** orquestador.
- **Condición de escalamiento:** cualquier publicación, tag, versión o evidencia no sustentada.

### MHB-16 — Demo candidata pre-renderizada (opcional)

- **Objetivo observable:** decidir y probar una demo solo lectura sin divergencia frente al HTML compilado.
- **Superficies autorizadas:** build estático, configuración de demo/despliegue aprobada, rutas de navegación y documentación de evidencia.
- **Dependencias y precondiciones:** MHB-13, MHB-14 y MHB-15; aprobación explícita de proveedor/credenciales si fueran necesarios.
- **Pasos técnicos:** comparar output, configurar demo mínima, ejecutar smoke y registrar SHA desplegado.
- **Criterios de aceptación:** demo candidata coincide con HTML compilado, funciona en desktop/móvil y se enlaza para verificación.
- **Validación automática:** smoke de build estático, enlaces y checks aplicables.
- **Validación manual:** navegar la demo solo lectura en desktop/móvil.
- **Evidencia requerida:** URL candidata, SHA desplegado y checklist.
- **Riesgos y reversión:** divergencia, coste o exposición de datos; no desplegar sin aprobación y retirar la configuración candidata de forma recuperable.
- **Exclusiones específicas:** no publicar el caso como destacado ni añadir backend.
- **Implementador:** perfil de deploy/preview, alto.
- **Revisor independiente:** orquestador.
- **Condición de escalamiento:** proveedor, credenciales, coste o publicación externa.

### MHB-17 — Alternar render y código fuente

- **Objetivo observable:** alternar render/código escapado en una sesión sin recompilación redundante.
- **Superficies autorizadas:** dashboard de preview, estado de UI, render/cache y pruebas de estado.
- **Dependencias y precondiciones:** MHB-07; preservar sanitización y HTML ya compilado.
- **Pasos técnicos:** añadir control de vista, reutilizar resultado actual y asegurar persistencia de sesión sin nueva compilación.
- **Criterios de aceptación:** usuario alterna ambas vistas, el código se escapa y el estado persiste durante la sesión.
- **Validación automática:** prueba de estado, sanitización y no recompilación redundante.
- **Validación manual:** alternar un template representativo y revisar legibilidad.
- **Evidencia requerida:** captura y prueba de estado/rendimiento.
- **Riesgos y reversión:** mostrar HTML ejecutable o invalidar caché; escapar contenido y revertir componente/estado juntos.
- **Exclusiones específicas:** no crear editor de código ni persistencia entre sesiones.
- **Implementador:** perfil UX/API, medio.
- **Revisor independiente:** revisor UX/API.
- **Condición de escalamiento:** cambie contrato de cache, payload público o seguridad de render.

### MHB-18 — Guía de componentes y matriz documentada

- **Objetivo observable:** permitir crear un componente con `index.html` y `schema.json` siguiendo solo la guía.
- **Superficies autorizadas:** guía, snippets, matriz de compatibilidad y componente/fixture temporal de verificación.
- **Dependencias y precondiciones:** MHB-10, MHB-11 y MHB-12; conservar distinción entre validación estática y pruebas reales.
- **Pasos técnicos:** documentar estructura, schema, registro y validación; ejecutar el ejercicio desde cero y actualizar la matriz.
- **Criterios de aceptación:** una persona crea un componente válido usando solo la guía y la matriz declara el nivel de evidencia.
- **Validación automática:** lint documental, comprobación de snippets y build/validator del componente temporal.
- **Validación manual:** seguir la guía sin conocimiento implícito y revisar el resultado.
- **Evidencia requerida:** componente descartable, checklist y resultados de validación.
- **Riesgos y reversión:** guía desactualizada o promesas excesivas; versionar ejemplos y revertir documentación sin afectar producto.
- **Exclusiones específicas:** no convertir documentación estable en una skill ni crear un builder.
- **Implementador:** perfil documentación/email, medio.
- **Revisor independiente:** revisor que siga la guía desde cero.
- **Condición de escalamiento:** la guía exija una skill nueva o revele una decisión de arquitectura.

### MHB-19 — Unit tests de helpers y reglas

- **Objetivo observable:** cubrir helpers críticos y cada regla de compatibilidad con positivos y negativos.
- **Superficies autorizadas:** helpers, validadores, tests unitarios y fixtures aislados.
- **Dependencias y precondiciones:** MHB-05 y MHB-06; identificar reglas y helpers críticos sin probar detalles internos irrelevantes.
- **Pasos técnicos:** crear inventario regla/helper→casos, añadir felices/borde y positivos/negativos, y mantener fixtures mínimos.
- **Criterios de aceptación:** cada helper/regla crítico tiene cobertura pertinente y los fallos explican la regla afectada.
- **Validación automática:** suite unitaria, cobertura/inventario y lint/typecheck aplicables.
- **Validación manual:** revisar que fixtures prueben comportamiento observable.
- **Evidencia requerida:** inventario regla/helper→tests y resultados de suite.
- **Riesgos y reversión:** tests acoplados a implementación; preferir contratos observables y revertir fixtures/tests aislados.
- **Exclusiones específicas:** no imponer un porcentaje global de cobertura.
- **Implementador:** perfil de pruebas, alto.
- **Revisor independiente:** revisor técnico alto.
- **Condición de escalamiento:** requerir binarios externos o cambios productivos para probar.

### MHB-20 — Integración build, render, caché y exportación

- **Objetivo observable:** comprobar el flujo extremo a extremo con temporales, sin depender de binarios PNG.
- **Superficies autorizadas:** tests de integración, build/render, caché, exportación y fixtures temporales.
- **Dependencias y precondiciones:** MHB-07, MHB-10, MHB-11 y MHB-12; mantener aislados datos/output de prueba.
- **Pasos técnicos:** integrar flatten, `{{ }}`, `[[ ]]`, gate, tema, `theme+dataHash` y exportación HTML en escenarios transaccional y marketing.
- **Criterios de aceptación:** los flujos producen output esperado, respetan cache y no dejan artefactos fuera de temporales.
- **Validación automática:** integración temporal de build/render/caché/exportación y suite global.
- **Validación manual:** revisar HTML final de un caso transaccional y uno marketing.
- **Evidencia requerida:** resultados de flatten, delimitadores, gate, caché y exportación.
- **Riesgos y reversión:** pruebas lentas/frágiles o dependencia de binarios; usar temporales y evitar PNG.
- **Exclusiones específicas:** no reemplazar pruebas visuales reales ni construir infraestructura de snapshots pesada.
- **Implementador:** perfil de pruebas/integración, alto.
- **Revisor independiente:** revisor técnico alto.
- **Condición de escalamiento:** tests requieran binarios externos o modifiquen comportamiento de producción.

### MHB-21 — Resolver links placeholder

- **Objetivo observable:** eliminar warnings `href="#"` de los cuatro templates de producto o aislar excepciones de fixture.
- **Superficies autorizadas:** templates, datos/schema, validador de links y catálogo.
- **Dependencias y precondiciones:** MHB-09, MHB-10, MHB-11 y MHB-12; distinguir fixture interno de template de producto.
- **Pasos técnicos:** localizar placeholders, sustituir por URLs/variables seguras o retirar el contenido del catálogo visible.
- **Criterios de aceptación:** los cuatro templates no generan warnings placeholder o existe excepción documentada fuera del catálogo.
- **Validación automática:** build, validador de links y tests de catálogo.
- **Validación manual:** revisar destinos y contenido representativo sin navegar enlaces sensibles.
- **Evidencia requerida:** resultados por template y excepción documentada si aplica.
- **Riesgos y reversión:** introducir URLs engañosas o romper fixtures; usar destinos demostrativos seguros y revertir datos/template juntos.
- **Exclusiones específicas:** no integrar tracking ni enlaces de producción.
- **Implementador:** perfil email/producto, medio.
- **Revisor independiente:** revisor de email.
- **Condición de escalamiento:** se requiera URL de marca, legal o de producción.

### MHB-23 — Ampliar biblioteca de componentes (opcional)

- **Objetivo observable:** añadir componentes email-safe con schema y presencia en `/library`.
- **Superficies autorizadas:** partials/componentes, schemas, library, pruebas y documentación de componentes.
- **Dependencias y precondiciones:** MHB-18 y MHB-20; cada componente debe tener un caso de uso aprobado.
- **Pasos técnicos:** crear componente/schema, registrarlo, construirlo y cubrir su validación/prueba aplicable.
- **Criterios de aceptación:** cada componente adicional es email-safe, tiene schema, aparece en `/library` y pasa controles.
- **Validación automática:** build, schema, validadores y tests aplicables por componente.
- **Validación manual:** abrir library, editar datos y revisar output.
- **Evidencia requerida:** schema, captura, build verde y resultados de validación.
- **Riesgos y reversión:** ampliar hacia un builder o duplicar componentes; mantener cada adición aislada y reversible.
- **Exclusiones específicas:** no construir editor/builder de emails.
- **Implementador:** perfil email/UI, medio.
- **Revisor independiente:** revisor de email/UI.
- **Condición de escalamiento:** el alcance se amplíe hacia un builder o requiera nueva arquitectura.

### MHB-24 — Modularización segura de validación, componentes y preview

- **Objetivo observable:** separar responsabilidades en la components API,
  validador HTML, HMR preview, modal de copy HTML y helper ESP, conservando
  contratos funcionales y endureciendo la entrada de la API.
- **Superficies autorizadas:**
  - `scripts/vite/api/components.js` y sus tests asociados.
  - `scripts/build/validate-email-html.js` y sus tests asociados.
  - `src/web/features/preview/preview-hmr.js` (o módulo equivalente) y sus
    tests.
  - `src/web/features/preview/copy-html-modal.js` y sus tests.
  - `scripts/email/esp-variables.js` y `scripts/email/esp-sources.js` como
    helper ESP compartido, sin nuevos consumidores fuera de los actuales.
- **Dependencias y precondiciones:** MHB-05 y MHB-06 `Completada`;
  `scripts/email/esp-variables.js`, `scripts/email/esp-sources.js`,
  `scripts/vite/api/render.js`, `scripts/vite/api/components.js` y la regla
  `esp-variables` de `validate-email-html.js` ya integrados.
- **Pasos técnicos:**
  1. Inventariar imports, exports y efectos colaterales de cada superficie y
     fijar un mapa de módulos antes de mover código.
  2. Separar catálogo, renderizado y HTTP de la components API; reutilizar el
     guard de nombres existente y rechazar entradas vacías, con separadores,
     traversal, espacios o metacaracteres antes de resolver rutas.
  3. Aislar el validador HTML en módulos por regla; cada regla expone su
     severidad y mantiene la composición actual (`ERROR` bloquea, `WARNING` e
     `INFO` no).
  4. Encapsular la lógica HMR del preview en un módulo del cliente, conservando
     sus eventos, payloads y el comportamiento de refresco actual.
  5. Convertir el modal de copy HTML en un módulo autocontenido con su propio
     estado, sin tocar otras features de preview.
  6. Mantener `scripts/email/esp-variables.js` como helper ESP estable: extraer
     filtrado de claves solo si elimina duplicación comprobada, añadir pruebas
     focalizadas y no introducir consumidores nuevos.
- **Criterios de aceptación:**
  - Los contratos de build, preview y components API permanecen estables:
    mismos endpoints, mismos payloads, misma severidad por regla y misma
    respuesta de validación ESP.
  - `componentName` y `variant` inseguros se invalidan con un error
    estructurado antes de cualquier acceso a filesystem o registro de
    componentes; las entradas válidas siguen funcionando sin cambios
    observables.
  - Pruebas focalizadas verdes por módulo (`components`, `validate-email`,
    HMR preview, copy HTML modal y helper ESP), sin duplicar fixtures.
- **Validación automática:**
  - `bun run lint`, `bun run typecheck`, `bun run format:check` y
    `git diff --check` verdes.
  - `bun run test` con la suite ampliada en los módulos afectados.
  - `bun run build` y `bun run validate-email` sin nuevos ERROR y con
    WARNING/INFO esperadas.
  - Recorrido manual mínimo del preview: render de un template representativo
    y copia de HTML en el modal.
- **Validación manual:** reproducir un `componentName` inválido (vacío,
  traversal, separador, longitud excesiva, metacaracteres) y confirmar error
  controlado; render y copy HTML siguen funcionando con entradas válidas.
- **Evidencia requerida:** diff por módulo, salida resumida de pruebas
  focalizadas, captura segura de error de entrada inválida y registro de
  comandos ejecutados.
- **Riesgos y reversión:** acoplamiento residual entre preview y modal, o
  regresión de severidades; conservar el orden de composición de reglas,
  revertir módulos aislados y reejecutar `bun run validate-email`.
- **Exclusiones específicas:**
  - No migrar a TypeScript ni ampliar `tsconfig`.
  - No añadir dependencias nuevas.
  - No cambiar severidades (`ERROR`/`WARNING`/`INFO`) ni reglas del gate.
  - No rediseñar UI ni introducir un nuevo endpoint exitoso.
  - No crear templates nuevos ni ampliar el catálogo de producto.
  - No introducir consumidores adicionales del helper ESP fuera de los ya
    existentes.
- **Implementador:** perfil técnico alto con propiedad exclusiva de los
  módulos listados y sus tests.
- **Revisor independiente:** revisor técnico distinto del implementador.
- **Condición de escalamiento:** cualquier cambio de contrato público de la
  components API, del payload de validación, de las severidades del gate o
  del helper ESP que no esté cubierto por el criterio de aceptación.

### MHB-25 — Upgrade del sistema visual web

- **Objetivo observable:** aplicar el contrato visual Space Blue a la interfaz
  web, con dark como tema inicial y un modo light equivalente, manteniendo la
  navegación, edición, renderizado, validación, exportación y consulta actuales.
- **Superficies autorizadas:** `docs/design/**`, `src/web/**` y el markup de
  tarjetas Home generado en `scripts/vite/plugins/dashboard.js`; también sus
  pruebas focalizadas. No se modifica `src/emails/**`, el HTML dentro de
  iframes, Maizzle, Handlebars, variables ESP, validadores ni APIs Vite.
- **Dependencias y precondiciones:** MHB-24 `Completada`; rama
  `feature/mhb-25`; conservar `app-theme`, su control de teclado y
  `theme-changed`.
- **Fases y pasos técnicos:** formalizar y congelar `docs/design/DESIGN.md`;
  implementar tokens web y el piloto Home; aplicar los roles semánticos a
  Preview preservando IDs, controles, editor, temas de iframe y renderizado;
  aplicar los roles a Library preservando catálogo, selección, formularios y
  renderizado. Preview y Library son fases del mismo ID, pero ninguna fase se
  completa sin sus propios controles automatizados y revisión visual.
- **Ampliación de alcance (2026-09-11, autorizada por el orquestador):** el
  skeleton de carga de Library (`#preview-skeleton`) diferencia su forma según
  la categoría atomic design del componente seleccionado (`atoms`, `molecules`,
  `organisms`, `templates`), en vez de un único layout genérico. Incluye
  renombrar la clave interna `other` de `componentsManager.groupByType` a
  `templates` (su `name` visible ya era "Templates"; solo corrige el key). No
  cambia catálogo, selección, formularios, renderizado ni contratos públicos.
- **Criterios de aceptación:** se conservan contratos públicos, semántica,
  ARIA, teclado e iframe aislado; tokens dark/light apuntan a contraste AA;
  móvil no oculta operaciones críticas; no cambia la salida de email ni se
  agregan dependencias o fuentes remotas.
- **Validación automática:** `bun run lint`, pruebas focalizadas por fase,
  `bun run format:check` y `git diff --check`; sumar build y validador solo si
  una fase afecta la salida de email.
- **Validación manual:** `bun run dev` en 375px, 768px y 1440px, dark y light;
  comprobar navegación, foco, contraste, controles y aislamiento del iframe.
- **Evidencia requerida:** diff acotado, salidas de controles por fase,
  recorrido manual fechado y revisión visual independiente antes de cada cierre.
- **Riesgos y reversión:** degradación de contraste, densidad, foco o responsive;
  mantener cambios incrementales y reversibles por feature, registrando toda
  limitación manual sin convertirla en aceptación automática.
- **Exclusiones específicas:** no rediseñar pipeline, templates/layouts, APIs,
  validadores, HTML compilado, iframes ni incorporar otro framework CSS,
  dependencias visuales o fuentes remotas.
- **Implementador:** perfil UI/web con propiedad exclusiva de las superficies
  autorizadas; medio/alto. **Revisor independiente:** revisor UI distinto por
  fase; el orquestador confirma el cierre del ID completo.
- **Condición de escalamiento:** cualquier cambio de contrato público,
  pipeline/email, API Vite, dependencia, alcance autorizado o imposibilidad de
  demostrar contraste, teclado o aislamiento.

### MHB-26 — Validación automatizada de accesibilidad y contraste

- **Objetivo observable:** detectar problemas de contraste WCAG y de
  accesibilidad del dashboard por texto/CLI, sin depender de revisión manual
  en navegador.
- **Superficies autorizadas:** `scripts/build/` (nuevos validadores),
  `package.json` (scripts), `.github/workflows/ci.yml`, `docs/ai/AGENTS.md`
  (solo la nota de preferencia texto/markdown sobre screenshot) y
  `docs/implementation/`. No se modifica `design-tokens.css`, `DESIGN.md` ni
  ningún componente de `src/web/**` para corregir hallazgos: esta tarea es la
  herramienta, no el arreglo de lo que encuentre.
- **Dependencias y precondiciones:** MHB-25 `Completada` (tokens Space Blue
  estables); Puppeteer ya disponible como devDependency.
- **Pasos técnicos:** validador de contraste de tokens (`design-tokens.css`,
  matemática WCAG sin navegador) con pares fg/bg derivados de
  `docs/design/DESIGN.md`; checker de accesibilidad de la dashboard con
  axe-core inyectado vía el Puppeteer existente contra rutas fijas (`/`,
  `/library`, `/preview?template=<válido>`) en tema claro y oscuro; ambos como
  scripts dedicados (`lint:contrast`, `a11y-check`), fuera de la cadena de
  `bun run lint`/`bun run build` — igual que `validate-email` hoy — más su job
  correspondiente en CI.
- **Criterios de aceptación:** `bun run lint:contrast` reporta ratio y
  severidad por par fg/bg y tema, fallando si algún par no llega a su umbral
  AA; `bun run a11y-check` reporta violaciones de axe-core por ruta/tema con
  severidad mapeada (`critical`/`serious` bloquean); ambos corren sin
  necesidad de abrir el Browser pane manualmente; hallazgos de contraste ya
  existentes en los tokens actuales quedan documentados como decisión
  pendiente del orquestador, no bloquean el cierre de este ID ni el pipeline
  de `lint`/`build` existente.
- **Validación automática:** `bun run lint:contrast`, `bun run a11y-check`,
  `bun run lint`, `bun run typecheck`, `bun run test`,
  `bun run format:check`, `bun run agents:check`.
- **Validación manual:** correr `bun run a11y-check` una vez localmente y
  revisar que el reporte sea legible y el proceso cierre sin dejar servidor o
  navegador colgado.
- **Evidencia requerida:** salida resumida de ambos validadores, resultados de
  controles y el hallazgo de contraste documentado en `STATUS.md`.
- **Riesgos y reversión:** falsos positivos por diferencias de renderizado
  entre Puppeteer y navegadores reales; ajustar reglas/tags de axe si el ruido
  es alto, sin bajar el umbral WCAG. Mantener el nuevo script fuera de
  `bun run build`/`bun run test` por defecto para no acoplar el pipeline de
  email a un checker de UI ni volver lenta la suite estándar.
- **Exclusiones específicas:** no corregir el contraste/tokens que el
  validador reporte como fallidos; no agregar un segundo motor de navegador
  (Playwright) teniendo Puppeteer disponible.

### MHB-27 — Corregir hallazgos de MHB-26 y estabilizar `a11y-check`

- **Objetivo observable:** `bun run lint:contrast` y `bun run a11y-check`
  corren en verde de forma reproducible; los hallazgos reales de
  accesibilidad/contraste que ambos detectan quedan corregidos en la UI.
- **Superficies autorizadas (ampliadas tras el diagnóstico real, acordado con
  el orquestador):** `docs/design/DESIGN.md` (contrato de `action-primary`),
  `scripts/build/validate-contrast.js` (par fg/bg de `action-primary`),
  `scripts/build/a11y-check.js` (servidor Vite y estrategia de espera),
  `src/web/shared/styles/design-tokens.css` (token `text-on-accent`),
  `src/web/features/preview/styles.css` (usar el token en vez de `#fff`
  literal), `src/web/features/library/**` y `src/web/features/preview/**`
  (los 4 hallazgos reales descritos abajo) y `docs/implementation/`.
- **Dependencias y precondiciones:** MHB-26 `Completada`.
- **Diagnóstico real (reemplaza la hipótesis inicial de este contrato; no
  repetir el proceso):**
  1. La causa de las 9 violaciones originales de `a11y-check` NO era una
     carrera con el optimizador de dependencias de Vite. La causa real:
     `a11y-check.js` pasaba `root: projectRoot` a `createServer()`, pisando
     el `root: "src/web"` declarado en `vite.config.js` — eso dejaba la app
     en un estado inconsistente. Quitar ese `root` explícito (dejar que
     `configFile` lo resuelva) basta para que `/`, `/library` y `/preview`
     sirvan la app real.
  2. Con el `root` corregido, `/preview?template=welcome` nunca cumple
     `waitUntil: "networkidle0"` (el iframe de render y el editor JSON dejan
     conexiones abiertas) y el script agotaba el timeout de navegación de
     Puppeteer. Se reemplazó por `waitUntil: "load"` más
     `page.waitForNetworkIdle({ idleTime: 500, timeout: 8000 })` tolerante a
     no llegar a cero conexiones.
  3. Con ambos fixes, 5 de los 9 hallazgos originales resultaron falsos
     positivos (desaparecen de forma reproducible en ≥3 corridas):
     `color-contrast` en Home (dark) y Library (ambos temas), y
     `scrollable-region-focusable` en Preview (ambos temas). El hallazgo
     `meta-viewport`/`user-scalable=no` reportado en un diagnóstico
     intermedio tampoco era real: correspondía a una página de error interna
     de Chrome (`chrome-error://chromewebdata/`) alcanzada durante una
     navegación inestable, no a la app — el `<meta viewport>` de todas las
     páginas del dashboard ya es correcto en el código fuente y no requiere
     cambio.
  4. Quedan 6 hallazgos reales, reproducibles en 3 corridas consecutivas:
     - `action-primary (text/accent-strong)` da 2.90:1 en tema claro porque
       `DESIGN.md` declaraba `textColor: {colors.text}`, pero ningún botón
       real usa esa combinación (ya usan texto blanco). Corregido: nuevo
       token `--ef-text-on-accent` (blanco) referenciado por `DESIGN.md` y
       `validate-contrast.js`; pasa en ambos temas (5.43:1 claro, 3.58:1
       oscuro — ver punto siguiente).
     - `scrollable-region-focusable` en Library (`.library-preview`, ambos
       temas): el panel de preview con `overflow-auto` no es alcanzable por
       teclado.
     - `aria-required-parent` en Preview (`#tab-btn-preview`/`#tab-btn-editor`,
       ambos temas): botones `role="tab"` sin un ancestro `role="tablist"`.
     - `color-contrast` en Preview claro: `#sync-status` usa `text-green-600`
       de Tailwind (2.56:1 sobre `--ef-surface`) en vez del token
       `--ef-success` del sistema de diseño (que sí pasa, 5.12:1).
     - `color-contrast` en Preview oscuro: el label del botón de viewport
       activo (`.viewport-label-full`, 12px) usa texto blanco sobre
       `--ef-accent-strong` oscuro a 3.58:1 — pasa el umbral "ui" (3:1) que
       usa `lint:contrast` para `action-primary`, pero no el 4.5:1 real que
       exige WCAG 1.4.3 para texto normal (axe-core lo clasifica como texto,
       no como componente UI). Es la misma pareja de tokens que el punto
       `action-primary`; el `lint:contrast` existente seguirá sin detectar
       este caso porque cataloga esa pareja como `role: "ui"` — se documenta
       la limitación en vez de reclasificar el validador (fuera de alcance).
- **Pasos técnicos:**
  1. Corregir el contrato de `action-primary` en `DESIGN.md`/
     `validate-contrast.js` (token `text-on-accent`, sin cambio visual).
  2. Corregir `a11y-check.js`: quitar el `root` explícito y cambiar la
     estrategia de espera de `/preview` (paso 2 del diagnóstico).
  3. Library: agregar `tabindex="0"` (y rol/etiqueta accesible si aplica) al
     contenedor `.library-preview` con scroll.
  4. Preview: envolver los botones `#tab-btn-preview`/`#tab-btn-editor` en un
     contenedor con `role="tablist"`.
  5. Preview: reemplazar `text-green-600` de `#sync-status` por el token
     `--ef-success`.
  6. Preview: corregir el contraste del label del viewport activo en tema
     oscuro sin migrar todo `--ef-accent-strong` (afectaría otros usos
     decorativos); usar una solución acotada al propio label (p. ej. peso/
     tamaño que califique como texto grande, o un tono de fondo específico
     para ese estado activo) — decisión de implementación menor, sin
     rediseñar el componente.
- **Criterios de aceptación:** `bun run lint:contrast` y `bun run a11y-check`
  terminan en verde (0 errores) en al menos 3 corridas consecutivas locales;
  el contrato de `action-primary` en `DESIGN.md` coincide con el componente
  real; los 4 hallazgos de UI quedan corregidos sin alterar el pipeline de
  email, las APIs Vite ni el contrato de `components.js`.
- **Validación automática:** `bun run lint:contrast`, `bun run a11y-check`
  (≥3 corridas), `bun run lint`, `bun run typecheck`, `bun run test`,
  `bun run format:check`, `bun run agents:check`.
- **Validación manual:** ninguna adicional; los scripts existentes son la
  fuente de verdad para accesibilidad/contraste.
- **Evidencia requerida:** salida de las 3 corridas de `lint:contrast`/
  `a11y-check` en verde, diff de todos los archivos tocados.
- **Riesgos y reversión:** el fix del label de viewport oscuro es el único
  con impacto visual (aunque menor); si genera desacuerdo, revertir solo ese
  cambio puntual sin afectar el resto del ID.
- **Exclusiones específicas:** no reclasificar `role: "ui"` a `role: "text"`
  en `validate-contrast.js` para toda la familia `action-primary` (cambiaría
  el umbral de otros pares); no migrar `a11y-check.js` a otro motor de
  navegador; no rediseñar Library/Preview más allá de los 4 hallazgos.
- **Implementador:** perfil habilitador técnico, medio. **Revisor
  independiente:** revisor técnico distinto.
- **Condición de escalamiento:** que corregir el label del viewport oscuro
  requiera un cambio de token más amplio que el acotado al propio label.

### MHB-28 — Modularización de superficies web sobredimensionadas

- **Objetivo observable:** ningún archivo no-test de `src/web/**` supera 300
  líneas, `preview.html` queda sin lógica JavaScript y los skeletons se
  declaran como componente reutilizable, sin un solo cambio visual ni alteración
  del pipeline de email.
- **Motivación:** `src/web/features/preview/` concentra 7.150 líneas, ~72 % del
  código web del proyecto, en archivos que mezclan dominios. La deuda ya produjo
  bugs documentados en el propio código: los comentarios de
  `styles.css:647-666` describen cómo un selector por ID ganó silenciosamente
  sobre una utilidad Tailwind y el estado "seleccionado" del viewport dejó de
  mostrarse. El riesgo no es estético, es de regresión silenciosa.

#### Inventario del hallazgo (2026-09-18, medido sobre `master`)

| Archivo                                          | Líneas  | Diagnóstico                                                                   |
| ------------------------------------------------ | ------- | ----------------------------------------------------------------------------- |
| `src/web/features/preview/styles.css`            | **776** | 9 dominios en un archivo; 112 selectores con `#`, 20 `!important`             |
| `src/web/features/preview/preview.html`          | **666** | ~180 líneas de skeletons + `<script>` embebido de 52 líneas (610-661)         |
| `src/web/features/preview/copy-html-modal.css`   | **476** | CSS de un único diálogo; incluye bloque "legado" con una regla muerta         |
| `src/web/features/library/styles/library.css`    | 331     | Bajo umbral, pero repite el bloque de scrollbars light/dark cuatro veces      |
| `src/web/features/preview/view-mode-controls.js` | 254     | En el límite; mezcla toggle de vista con escapado de HTML fuente              |
| `src/web/features/library/main.js`               | 232     | Un objeto `app` monolítico: estado, storage, debounce, filtrado y DOM         |
| `scripts/vite/plugins/dashboard.js`              | 209     | Solo 2 funciones: casi todo es un template string con HTML + CSS + `<script>` |
| `src/web/features/preview/preview-ready.js`      | 98      | Siete repeticiones a mano del par oculta-skeleton/muestra-contenido           |

Defectos puntuales confirmados, independientes del tamaño:

1. `styles.css` se carga dos veces: `<link>` en `preview.html:9` **y**
   `import "./styles.css"` en `main.js:22`. `home` y `library` solo usan el
   import; el `<link>` es el sobrante.
2. JavaScript embebido fuera de bootstrap, contra la regla de
   `email-refactor-type-safety`: `preview.html:610-661` (tabs móviles y cierre
   del menú `⋯`) y el `<script>` dentro del template string de `dashboard.js`.
3. Regla CSS muerta: `.btn-build-copy` en `copy-html-modal.css:473`. Solo
   `.btn-copy-existing` tiene consumidor (`copy-html-dialog.js:34`).
4. `src/web/features/library/components/` son **cinco fragmentos HTML
   huérfanos** (59 líneas): no hay `fetch()` de `.html` ni mecanismo de include
   en todo `src/web`, y sus clases BEM (`library-sidebar__header`) no coinciden
   con las de la página viva (`library-sidebar-header`, inline en
   `components-library.html`). Entraron en `432d731` y quedaron abandonados.

- **Decisión de arquitectura previa (acordada con el orquestador el
  2026-09-18):** Handlebars queda reservado a `src/emails/**` y no se introduce
  en `src/web`. La componentización del dashboard usa **Web Components
  nativos**, el único patrón vivo del proyecto (`theme-toggle` en
  `src/web/shared/utils/theme-toggle-component.js`, el único
  `customElements.define` de todo `src/web`). La vía de fragmentos HTML ya se
  intentó y quedó muerta (punto 4 del inventario); no se retoma.
- **Restricción técnica del componente de skeleton:** `<ef-skeleton>` debe usar
  **light DOM, nunca shadow DOM**, al contrario que `theme-toggle`. Dos razones
  verificadas: (a) los skeletons se pintan con utilidades Tailwind
  (`animate-pulse`, `bg-slate-200`) y `styles.css:625-636` los alcanza desde
  fuera por ID (`.preview-shell #preview-skeleton`, `#editor-skeleton`,
  `#actions-skeleton`); (b) `preview-ready.js` los resuelve con
  `doc.getElementById`. Shadow DOM rompería ambas cosas.
- **Superficies autorizadas:**
  - Bloques obligatorios: `src/web/features/preview/styles.css` y el nuevo
    directorio `src/web/features/preview/styles/`; `preview.html`; `main.js`
    (solo imports y bootstrap); `preview-ready.js` y su test;
    `copy-html-modal.css`; nuevos `src/web/features/preview/mobile-tabs.js` y
    `src/web/shared/components/ef-skeleton.js` con sus tests; borrado de
    `src/web/features/library/components/**`.
  - Bloque opcional (solo con autorización explícita, ver Fases):
    `scripts/vite/plugins/dashboard.js` y su test;
    `src/web/features/library/styles/library.css`;
    `src/web/features/library/main.js` y sus módulos;
    `src/web/features/preview/view-mode-controls.js` y su test.
  - No se modifica `src/emails/**`, Maizzle, Handlebars, variables ESP,
    validadores, APIs Vite, `scripts/shared/**` ni el HTML dentro de iframes.
- **Dependencias y precondiciones:** MHB-24, MHB-25 y MHB-27 `Completada`;
  rama `feature/mhb-28` con `bun run check:task-branch` en verde antes de
  editar; `feature/mhb-18` integrada o cerrada, para no competir por
  `src/web/features/library/**`. No iniciar sin asignación explícita del
  orquestador: en el orden del roadmap MHB-20 sigue primero.

#### Fases y pasos técnicos

Cada bloque es un commit propio y revertible por separado. El orden no es
negociable: F1 antes de F3, porque aislar `shell-theme.css` deja a la vista las
reglas por ID de las líneas 625-636 que F3 va a mover.

- **F0 — Limpieza sin riesgo (obligatorio).**
  1. Eliminar el `<link>` de `styles.css` en `preview.html:9` y conservar solo
     el `import` de `main.js:22`.
  2. Borrar la regla muerta `.btn-build-copy` de `copy-html-modal.css:473`.
  3. Borrar los cinco fragmentos huérfanos de
     `src/web/features/library/components/`.
- **F1 — División de `styles.css` (obligatorio).** Cortar por las fronteras que
  ya marcan sus propios comentarios de sección, sin reordenar reglas:
  `layout.css` (1-114: base y modo código), `header-responsive.css` (115-328:
  variantes de etiqueta y container queries del header), `responsive.css`
  (329-491: tablet, móvil y móvil pequeño), `jsoneditor-theme.css` (492-584:
  validación, errores y temas de Vanilla JSONEditor) y `shell-theme.css`
  (585-776: shell Space Blue, selector de viewport y overrides de contraste).
  `styles.css` queda como índice de `@import` y conserva su ruta, para no
  romper el punto de entrada. El orden de los `@import` replica el orden
  original: la cascada depende de él.
- **F2 — Extracción del JavaScript embebido (obligatorio).** Mover
  `preview.html:610-661` a `mobile-tabs.js` (tabs móviles) e integrar el cierre
  del menú `⋯` en el `more-menu.js` existente, que ya cubre ese
  comportamiento. `preview.html` queda solo con
  `<script type="module" src="…/main.js">`.
- **F3 — Componente `<ef-skeleton>` (obligatorio).** Declarar cada par
  skeleton/contenido en el markup, por ejemplo
  `<ef-skeleton for="topbar-controls" reveal-display="flex">`, conservando
  intactas las clases Tailwind del skeleton actual. `markPreviewReady()` pasa a
  recorrer los componentes y llamar `reveal()`, en vez de enumerar siete pares
  de IDs. Dos de los siete pares no son uniformes y el componente debe
  absorberlo de forma explícita: `template-name-skeleton` se **elimina** con
  `.remove()` en vez de ocultarse (`preview-ready.js:34`), y el par de acciones
  además hace `saveBtn.disabled = false` — ese `disabled` se queda fuera del
  componente, en `main.js`. Los IDs del DOM existentes no se renombran: los
  consumen JS, CSS y `a11y-check`.
- **F4 — `dashboard.js` (obligatorio, riesgo bajo).** Sacar el HTML, CSS y
  `<script>` del template string a un archivo de plantilla, dejando el plugin
  con la lógica de `getTemplates` y el ensamblado. El markup de tarjetas Home
  ya fue superficie autorizada de MHB-25; aquí no cambia su apariencia.
- **F5 — Bloque opcional, solo con autorización explícita.** Dedup del bloque
  de scrollbars light/dark en `library.css`; división de `library/main.js` en
  `state.js` + `controller.js`; extracción del escapado de HTML fuente de
  `view-mode-controls.js`. Ninguno de los tres es causa de bug conocido; entran
  si el orquestador los aprueba, y su ausencia no bloquea el cierre del ID.

- **Criterios de aceptación:**
  - Ningún archivo no-test bajo `src/web/**` supera 300 líneas, y `styles.css`,
    `preview.html` y `copy-html-modal.css` quedan por debajo del umbral.
  - `preview.html` no contiene ningún `<script>` con lógica; solo el módulo de
    bootstrap.
  - `preview-ready.js` no enumera pares de IDs a mano y cubre los siete pares
    con el componente, incluidos los dos casos no uniformes.
  - `<ef-skeleton>` está registrado con `customElements.define`, usa light DOM
    y tiene test propio (revelado, `reveal-mode="hide|remove"` y ausencia de
    `for`).
  - **Cero cambio visual:** `bun run a11y-check` y `bun run lint:contrast`
    devuelven el mismo resultado verde que antes del ID, y el recuento de
    `!important` y de selectores por ID no aumenta respecto al inventario.
  - **Cero cambio en la salida de email:** `dist/*.html` idéntico byte a byte
    antes y después del refactor.
  - `src/web/features/library/components/` queda eliminado.
- **Validación automática:** `bun run lint`, `bun run typecheck`,
  `bun run test`, `bun run format:check`, `bun run build`,
  `bun run validate-email`, `bun run lint:contrast`, `bun run a11y-check`,
  `bun run agents:check` y `git diff --check`. Gate específico del ID:
  capturar el hash de cada `dist/*.html` antes de empezar y compararlo al
  cerrar; cualquier diferencia detiene el ID.
- **Validación manual:** `bun run dev` en 375px, 768px y 1440px, en dark y
  light, sobre las tres páginas (Home, Preview, Library). Comprobar
  explícitamente: transición skeleton→contenido sin destello ni salto de
  layout, tabs móviles, menú `⋯` en <480px, estado activo del selector de
  viewport (el bug que ya documentó `styles.css:647-666`), toggle
  render/código y modal de copiar HTML.
- **Evidencia requerida:** tabla archivo→líneas antes y después; diff por
  bloque (F0 a F4 en commits separados); salida de los gates; hashes de
  `dist/*.html` antes y después; recuento de `!important` y selectores por ID
  antes y después; recorrido manual fechado con las seis combinaciones de
  ancho y tema.
- **Riesgos y reversión:**
  - Romper el orden de cascada al dividir el CSS. Mitigación: no reordenar
    reglas dentro de un bloque y replicar el orden original en los `@import`.
  - Especificidad: `styles.css` gana por ID sobre utilidades Tailwind en varios
    puntos. Mover reglas puede invertir un ganador silenciosamente; por eso el
    gate visual es `a11y-check`/`lint:contrast` más el recorrido manual, no la
    inspección del diff.
  - Destello de contenido (FOUC) o salto de layout si `<ef-skeleton>` altera el
    momento del revelado. Mitigación: conservar la semántica actual de
    `hidden`/`flex` y el `initLucideIcons()` final.
  - Reversión: cada bloque es un commit independiente; F5 puede descartarse
    entero sin afectar el cierre.
- **Exclusiones específicas:**
  - No introducir Handlebars en `src/web`: queda reservado a `src/emails/**`.
  - No usar shadow DOM en `<ef-skeleton>`.
  - No incorporar framework ni dependencias nuevas (React, Vue, Lit, ningún
    framework CSS adicional) ni fuentes remotas.
  - No rediseñar UI: el ID no tiene presupuesto de cambio visual.
  - No renombrar IDs del DOM ni clases consumidas por CSS, JS o `a11y-check`.
  - No migrar a TypeScript ni ampliar `tsconfig`.
  - No tocar `src/emails/**`, Maizzle, variables ESP, validadores ni APIs Vite.
  - No abordar `readBuiltTemplate` (`scripts/shared/built-templates.js`): es el
    riesgo residual heredado de MHB-19 y requiere su propio ID.
- **Implementador:** perfil UI/web con propiedad exclusiva de las superficies
  listadas; esfuerzo alto. **Revisor independiente:** revisor UI distinto del
  implementador, que debe ejecutar el recorrido manual completo y verificar los
  hashes de `dist/`.
- **Condición de escalamiento:** que un bloque no pueda cumplirse sin cambio
  visual, sin renombrar IDs o sin tocar una superficie fuera de la lista; que
  `dist/` cambie; o que dividir el CSS exija reordenar reglas para conservar el
  comportamiento actual.

## Fases

### Fase A — Seguridad y trazabilidad

- **Hallazgos que resuelve:** P1 de comandos; P1/P2 de PLAN, STATUS, CI y tag.
- **IDs incluidos:** MHB-01, MHB-02, MHB-03, MHB-04, MHB-22.
- **Entregables:** contrato único de nombres seguros, procesos sin shell para
  entradas, documentación rebasada, licencia y CI que no omite rutas críticas.
- **Riesgos:** cambiar CLI/build o workflow sin prueba de regresión; confundir
  la documentación posterior al tag con el contenido de la release publicada.
- **Criterio de salida:** controles locales y CI definidos en MHB-04 verdes;
  ningún comando acepta un nombre inválido; la reconciliación no mueve el tag.

### Fase B — Flujo de producto comprobable

- **Hallazgos que resuelve:** validación de variables, errores de preview,
  descarga y ejemplos de producto incompletos.
- **IDs incluidos:** MHB-05 a MHB-12, MHB-17, MHB-18, MHB-21, MHB-24, MHB-25.
- **Entregables:** pruebas de flujo crítico, preview con errores seguros,
  descarga HTML, toggle render/código, documentación de componentes, cuatro
  templates de producto sin links placeholder y modularización segura de
  validación, componentes y preview sin alterar contratos.
- **Riesgos:** tratar warnings del validador como compatibilidad real o dejar
  fixtures visibles como si fueran producto.
- **Criterio de salida:** cuatro templates visibles compilan; tests de
  build/render/CLI verdes; variables y errores se comportan como se documenta;
  la components API rechaza entradas inseguras y la modularización conserva
  contratos de build/preview/API.

### Fase C — Evidencia para la puerta de calidad

- **Hallazgos que resuelve:** cobertura/tipos/rendimiento, accesibilidad,
  clientes reales y narrativa/release.
- **IDs incluidos:** MHB-13, MHB-14, MHB-15, MHB-19, MHB-20.
- **Entregables:** mediciones reproducibles, matriz de pruebas manuales y una
  release posterior plenamente trazable.
- **Riesgos:** afirmar evidencia de clientes sin pruebas; incluir secretos en
  capturas o documentación.
- **Criterio de salida:** evidencia enlazable en `progress.md`; todos los
  bloqueadores de auditoría resueltos o explícitamente reevaluados.

### Fase D — Evolución opcional y mantenimiento

- **IDs incluidos:** MHB-16, MHB-23 (opcionales) y MHB-28 (requerido). MHB-26 y
  MHB-27 se ejecutaron en esta fase y están `Completada`.
- **Nota de alcance:** la fase dejó de ser solo opcional. MHB-26/MHB-27
  (validación automatizada de accesibilidad y contraste) y MHB-28
  (mantenibilidad del código web) son `Requerida`: no añaden producto, pero sin
  ellos el dashboard no es verificable ni mantenible.
- **Criterio de salida:** cada opcional aprobado cumple su propia aceptación;
  una demo accesible es apta para verificación, pero no equivale a publicar el
  caso como destacado. Los IDs requeridos de la fase cumplen su aceptación
  completa, sin excepción por ser trabajo interno.

## Contrato obligatorio de cierre

Cada elemento debe conservar en el contrato transferido: objetivo, archivos,
pasos, dependencias, aceptación, pruebas automáticas, validación manual,
riesgos, exclusiones y evidencia esperada. Una skill puede añadir controles,
pero no sustituir esos campos ni rebajar su aceptación.

### Estados y revisión independiente

1. `Pendiente`: dependencias o autorización todavía no satisfechas.
2. `En progreso`: implementador asignado y propiedad de archivos registrada.
3. `En revisión`: implementación terminada; se registran diff, comandos,
   resultados, desviaciones y riesgos. El implementador no puede marcarla
   `Completada`.
4. `Bloqueada`: un control obligatorio falla o falta evidencia; no se inicia la
   tarea dependiente.
5. `Completada`: un revisor independiente confirma aceptación, diff, pruebas,
   lint, typecheck/build cuando correspondan y ausencia de cambios fuera de
   alcance; el orquestador dicta el veredicto.

### Matriz mínima de comprobación

| IDs                    | Prueba automática mínima                                                      | Validación manual                                                                                 | Evidencia de cierre                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| MHB-01/MHB-02          | Casos válidos, traversal, metacaracteres, códigos de salida y restauración.   | Ejecutar acciones CLI afectadas sin shell.                                                        | Tests, diff de procesos y demostración de que no se escribe fuera.                                     |
| MHB-03/MHB-22          | Lint Markdown y comprobación de enlaces/metadata.                             | Comparar HEAD, tag, CHANGELOG, STATUS, workflow y licencia.                                       | Matriz de reconciliación y enlaces a evidencia.                                                        |
| MHB-04                 | Validación de sintaxis y matriz de rutas; suite local completa.               | Confirmar CI remoto para cambios de workflow, layouts y HTML web.                                 | URL de run y tabla ruta→job.                                                                           |
| MHB-05                 | Suite de regresión de comandos y filesystem.                                  | Revisar mensajes y recuperación ante fallo.                                                       | Casos cubiertos y salida resumida.                                                                     |
| MHB-06                 | Fixtures faltante, sobrante, helper y variable ESP intencional.               | Verificar aviso en preview y antes de exportar/build.                                             | Captura/payload y test del gate.                                                                       |
| MHB-07                 | Handler 422, payload, sanitización y cliente de error.                        | Provocar error real en preview.                                                                   | Captura sin rutas absolutas y tests.                                                                   |
| MHB-08/MHB-17          | Utilidades de descarga y estado del toggle.                                   | Descargar/abrir HTML; alternar sin recompilación redundante.                                      | Archivo comparado, captura y prueba de estado.                                                         |
| MHB-09 a MHB-12/MHB-21 | Build y validadores sobre los cuatro templates.                               | Desktop/móvil y revisión de contenido/link/unsubscribe.                                           | `dist/`, resultados por template y capturas actuales.                                                  |
| MHB-18                 | Lint de documentación y comprobación de snippets.                             | Crear un componente siguiendo solo la guía.                                                       | Componente de prueba descartable y checklist.                                                          |
| MHB-19                 | Positivo/negativo por regla y casos felices/borde por helper crítico.         | Revisar que las fixtures no prueben implementación interna irrelevante.                           | Inventario regla/helper→tests.                                                                         |
| MHB-20                 | Integración temporal de build, render, caché y exportación HTML.              | Revisar output final de un caso transaccional y uno marketing.                                    | Resultados de flatten, delimitadores, gate y caché.                                                    |
| MHB-13                 | Typecheck ampliado y medición repetida.                                       | Revisar entorno y variabilidad.                                                                   | Tabla con Bun/Node/SO, comando, repeticiones y resultados.                                             |
| MHB-14                 | Validadores disponibles; no sustituyen pruebas reales.                        | Teclado/lector y Gmail/Outlook/Apple Mail con protocolo fechado.                                  | Matriz por cliente/criterio, capturas sin secretos y limitaciones.                                     |
| MHB-15                 | Lint, suite, build y consistencia de versión.                                 | Revisar README, capturas, changelog y release antes de publicar.                                  | SHA, tag, URL de release y diff final.                                                                 |
| MHB-16                 | Smoke del build estático y enlaces.                                           | Navegar demo solo lectura en desktop/móvil.                                                       | URL candidata, SHA desplegado y checklist.                                                             |
| MHB-23                 | Tests/validadores aplicables por componente.                                  | Aparición y edición en `/library`.                                                                | Schema, captura y build verde.                                                                         |
| MHB-28                 | Suite completa, `lint:contrast`, `a11y-check` y test propio de `ef-skeleton`. | Seis combinaciones ancho×tema en Home/Preview/Library; skeletons, tabs móviles y viewport activo. | Tabla líneas antes/después, hashes de `dist/` iguales, diff por bloque y recuento de `!important`/IDs. |

### Gates globales

- Todos los cambios: `bun run format:check` y `git diff --check`.
- Markdown: `bun run lint:md`.
- JavaScript/configuración: `bun run lint` y `bun run typecheck` según alcance.
- Templates/layouts/CSS/build: `bun run build` y
  `bun run validate-email`; ERROR bloquea, WARNING/INFO no se ocultan.
- UI/API: pruebas automatizadas más `bun run dev` y recorrido manual.
- Antes de cerrar una fase: instalación congelada, lint, typecheck, test,
  build y formato verdes en la versión de Bun fijada por el proyecto.
- Un control obligatorio `Fallido` o `No ejecutado` impide `Completada`, salvo
  excepción explícita aprobada por el orquestador con riesgo y nueva acción.

## Orden de ejecución

1. Ejecutar la Fase A, MHB-01 a MHB-04/MHB-22; cada ítem pasa por
   implementador, revisor y veredicto del orquestador.
2. Revisar el cierre de Fase A antes de iniciar el flujo de producto.
3. Ejecutar Fase B y luego Fase C. Solo entonces decidir si MHB-16 o MHB-23
   aportan valor suficiente para abrir Fase D.
4. Someter el producto a una revisión final independiente antes de declararlo
   listo para presentarse como caso de portafolio.

### Política de ramas y versiones conservada

- Una tarea por rama `feature/<id-en-minusculas>` y PR directo a `master`; no
  se mezclan tareas ni se incrementa versión por cada una.
- El gate de Fase B conserva la intención de una minor `v1.2.0` y el de Fase C
  la de `v1.3.0`, pero MHB-03 debe confirmar primero si el estado posterior a
  `v1.1.0` exige una corrección `v1.1.1`. La decisión queda documentada antes
  de editar versiones.
- Tag, CHANGELOG, versión y release deben apuntar al mismo alcance. Ningún
  subagente publica o mueve referencias sin aprobación del orquestador.
- `dist/` permanece versionado por decisión del proyecto; capturas son
  entregables documentales. `task-verification` debe resolver la contradicción
  actual de `workflow-git.md` y evitar commits accidentales fuera de tarea.

## Criterios para estar listo para portafolio

- Los P1 de comandos y trazabilidad están cerrados con evidencia reproducible.
- CI cubre las rutas relevantes; lint, typecheck, pruebas, build y formato
  están verdes en la matriz declarada.
- Cuatro templates de producto, preview seguro y descarga de HTML funcionan.
- La vista de código, guía de componentes, licencia y links reales están
  verificados.
- Hay evidencia fechada de accesibilidad, rendimiento y clientes de correo.
- La documentación, versión, tag y release posterior concuerdan; existe un
  despliegue candidato o instrucciones reproducibles para demostrar el flujo.
- MHB-16 solo puede seguir opcional si la puerta final acepta la demostración
  local reproducible; si esa evidencia es insuficiente, pasa a requerida antes
  de `Listo para portafolio`.
- La verificación final aprueba el caso. Publicarlo en una superficie externa
  del portafolio es una acción posterior y separada.

## Impacto de nombre o combinación de repositorios

No se cambia el repositorio ni se combina con otro caso. `EmailForge Toolkit`
es el nombre de producto; `vite-mhb-email` conserva su slug, URL y paquete
históricos. Toda release posterior debe usar ambos nombres de forma coherente.

## Diseño de orquestación

Las skills son contratos de procedimiento; los subagentes son ejecuciones
temporales. Cada subagente recibe IDs, skills obligatorias, archivos exclusivos,
controles y condición de escalamiento. Ninguna identidad se persiste como
agente permanente.

### Orquestación de la Fase A — Seguridad y trazabilidad

| Línea                                | Skills obligatorias                          | Implementador y propiedad                                   | Revisor                               | Controles                                                           | Escalar cuando                                                    |
| ------------------------------------ | -------------------------------------------- | ----------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| MHB-01/MHB-02 rutas y procesos       | `email-quality-gates`, `email-project-stack` | Terra alto; scripts de generación, exportación, build y CLI | Terra alto distinto del implementador | Casos adversariales seguros, códigos de salida, lint/typecheck/test | Cambie contrato CLI, filesystem o compatibilidad multiplataforma. |
| MHB-03/MHB-22 documentación/licencia | `task-verification`                          | Terra medio; PLAN, STATUS, CHANGELOG, README y LICENSE      | Orquestador                           | SHA/tag/workflow, lint Markdown y metadata                          | Requiera tag/release, versión o decisión legal no sustentada.     |
| MHB-04 CI                            | `task-verification`, `email-project-stack`   | Terra alto; `.github/workflows/ci.yml`                      | Terra alto distinto del implementador | Ruta→job, suite local y CI remoto                                   | Amplíe permisos, publique artefactos o cambie release.            |

### Fase B — Producto

| Línea                     | Skills obligatorias                                                            | Implementador y propiedad                                                                        | Revisor                               | Controles                                                                | Escalar cuando                                                  |
| ------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------- |
| MHB-05/MHB-06 validadores | `email-compatibility`, `email-quality-gates`                                   | Terra alto; validadores y tests asociados                                                        | Revisor de seguridad/compatibilidad   | Fixtures, preview, build/export y gate                                   | Cambie semántica ESP o severidades.                             |
| MHB-24 modularización     | `email-refactor-type-safety`, `email-quality-gates`, `email-preview-dashboard` | Terra alto; módulos de components API, validate-email, HMR preview, copy HTML modal y helper ESP | Terra alto distinto del implementador | Pruebas focalizadas por módulo, build, validate-email y recorrido manual | Cambie contrato de build/preview/API, severidades o helper ESP. |

<!-- markdownlint-disable MD060 -->

| MHB-25 upgrade visual web | `email-preview-dashboard`, `email-quality-gates`, `task-verification` | Terra alto; docs/design y src/web autorizados | Revisor UI por fase y orquestador | Lint, tests, formato, diff y recorrido dark/light | Cambie pipeline/email, APIs o alcance autorizado. |

<!-- markdownlint-enable MD060 -->

| MHB-07/MHB-08/MHB-17 preview | `email-preview-dashboard`, `email-quality-gates` | Terra alto; API/UI preview | Revisor UX/API | Tests más recorrido manual desktop/móvil | Exponga rutas, cambie payload público o requiera nueva arquitectura. |
| MHB-09 a MHB-12/MHB-21 templates | `email-compatibility`, `email-project-stack` | Terra medio; catálogo/templates y `dist` derivado | Revisor de email | Build, validate-email, visual y links | Una regla impida el diseño o aparezcan decisiones de marca. |
| MHB-18 documentación | `task-verification`, `email-compatibility` | Terra medio; guía/matriz | Revisor que siga la guía desde cero | Lint y ejercicio de componente | La guía requiera crear una skill adicional. |

### Fase C — Calidad y evidencia

| Línea                    | Skills obligatorias                               | Implementador y propiedad           | Revisor                  | Controles                                          | Escalar cuando                                                    |
| ------------------------ | ------------------------------------------------- | ----------------------------------- | ------------------------ | -------------------------------------------------- | ----------------------------------------------------------------- |
| MHB-19/MHB-20 pruebas    | `task-verification`, skills del dominio probado   | Terra alto; tests/fixtures          | Terra alto independiente | Inventario de cobertura e integración temporal     | Requiera binarios externos o cambios productivos para testear.    |
| MHB-13 tipos/rendimiento | `email-refactor-type-safety`, `task-verification` | Terra alto; tipos/config/mediciones | Revisor técnico          | Typecheck y protocolo reproducible                 | Amplíe alcance a migración TypeScript o budget CI.                |
| MHB-14 evidencia manual  | `email-compatibility`, `email-preview-dashboard`  | Terra alto; matriz/capturas         | Orquestador              | Protocolo fechado, clientes reales y accesibilidad | No haya acceso a cliente/dispositivo o aparezcan datos sensibles. |
| MHB-15 release           | `task-verification`                               | Terra medio; docs/version/changelog | Orquestador              | Suite completa, tag y release coherentes           | Antes de cualquier publicación o cambio de versión.               |

### Fase D — Opcionales

| Línea              | Skills obligatorias                                                                                | Implementador y propiedad                   | Revisor             | Controles                                 | Escalar cuando                                          |
| ------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------- | ----------------------------------------- | ------------------------------------------------------- |
| MHB-16 demo        | `email-project-stack`, `email-preview-dashboard`, skill de despliegue solo si se aprueba proveedor | Terra alto; build estático/config de deploy | Orquestador         | Smoke, URL, SHA y ausencia de divergencia | Requiera proveedor, credenciales o publicación externa. |
| MHB-23 componentes | `email-compatibility`, `email-preview-dashboard`                                                   | Terra medio; partials/schemas/library       | Revisor de email/UI | Build, schema, library y visual           | Amplíe el alcance hacia un builder.                     |

El orquestador conserva integración, decisiones transversales, cambios
destructivos, versiones, releases y veredictos. Solo paraleliza líneas con
archivos exclusivos y al menos dos ámbitos realmente independientes.
