# Sincronización de instrucciones para asistentes

Copiar esta carpeta completa como `scripts/ai/` en el repositorio original.
Las fuentes canónicas permanecen versionadas bajo `docs/ai/`; los targets
generados se declaran en `agents.config.json`.

Agregar al `package.json` del proyecto:

```json
{
  "scripts": {
    "agents:sync": "node scripts/ai/agents-sync.mjs",
    "agents:check": "node scripts/ai/agents-check.mjs"
  }
}
```

## Manifiesto

Cada entrada de `targets` admite:

- `source`: ruta canónica dentro de `docs/ai/`.
- `target`: salida administrada dentro del repositorio.
- `mode`: `symlink` (preferido) o `copy` para archivos Markdown.
- `optional`: permite omitir el target cuando todavía no existe su fuente.

Declare solo los adaptadores usados realmente por el proyecto. Por ejemplo,
para generar `CLAUDE.md` como copia marcada de las instrucciones canónicas:

```json
{
  "source": "docs/ai/AGENTS.md",
  "target": "CLAUDE.md",
  "mode": "copy"
}
```

Incluya todos los targets generados en `gitignore`. `agents:sync` mantiene ese
listado dentro de un bloque delimitado y preserva el resto de `.gitignore`.

## Garantías

- `agents:sync` realiza primero un preflight no mutante de todo el lote: valida
  manifiesto, fuentes, destinos, enlaces, padres y el bloque de `.gitignore`
  antes de crear o actualizar una sola salida.
- Un enlace roto, una fuente ausente o inválida, un target manual o un bloque
  `.gitignore` mal formado abortan el lote completo, sin cambios parciales.
- `agents:sync` es idempotente y usa enlaces relativos. Solo actualiza copias
  que ya contienen su marca administrada; no adopta enlaces apuntando a otra
  fuente, aunque estén dentro de `docs/ai/`.
- Un archivo o directorio manual nunca se reemplaza. Para adoptar una ruta ya
  existente, muévala o integre su contenido primero.
- Las copias incluyen una marca y el SHA-256 de la fuente.
- `agents:check` no escribe archivos y falla ante fuentes ausentes o inválidas,
  enlaces rotos o no administrados, targets faltantes, copias con drift o un
  `.gitignore` desincronizado.
- El modo `copy` se limita a archivos Markdown; los directorios, incluida la
  carpeta de skills, deben usar `symlink`.
- Al retirar un target del manifiesto, revisar y eliminar explícitamente la
  salida anterior. Los scripts no borran rutas huérfanas automáticamente.

Después de un clon nuevo, ejecute el runtime del proyecto para
`agents:sync` y luego `agents:check` antes de iniciar asistentes que dependan
de esas salidas. Revise el diagnóstico y resuelva manualmente cualquier
conflicto: el sincronizador no decide por usted qué contenido adoptar.
