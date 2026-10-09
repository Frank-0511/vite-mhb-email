# Contribuir a EmailForge Toolkit

EmailForge Toolkit admite contribuciones con cualquier gestor de paquetes soportado.

## Desarrollo local

Usa el gestor que prefieras (`<pm>` = `bun`, `yarn`, `npm` o `pnpm`):

```bash
<pm> install
<pm> run <script>
```

Antes de abrir la PR, los siguientes checks deben pasar en verde:

```bash
<pm> run lint
<pm> run typecheck
<pm> run test
<pm> run build
<pm> run validate-email
```

El check `check:dist-baseline` se valida con Bun (`bun run check:dist-baseline`).

No commitees `dist/` a mano: lo genera `<pm> run build`.

## Política de pull requests externas

- La PR no debe incluir `package-lock.json`, `yarn.lock` ni `pnpm-lock.yaml`,
  ni cambios en `.github/`. El check `PR Guard` la rechaza. Para proponer un
  cambio de CI, abrir primero un issue.
- Los workflows de PR externas esperan la aprobación del mantenedor antes de
  ejecutarse.
