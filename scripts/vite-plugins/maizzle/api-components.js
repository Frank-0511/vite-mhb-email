import { render } from "@maizzle/framework";
import fs from "fs-extra";
import Handlebars from "handlebars";
import { resolve } from "path";

/**
 * Busca un componente recursivamente en un directorio
 */
function searchComponentDir(baseDir, componentName) {
  const items = fs.readdirSync(baseDir);
  for (const item of items) {
    const itemPath = resolve(baseDir, item);
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      if (item === componentName && fs.existsSync(resolve(itemPath, "schema.json"))) {
        return itemPath;
      }
      const found = searchComponentDir(itemPath, componentName);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Obtiene la lista de todos los componentes disponibles
 */
function getComponentsList(rootDir) {
  const components = [];
  const searchDirs = [
    { path: resolve(rootDir, "src/components"), prefix: "src/components" },
    { path: resolve(rootDir, "src/partials"), prefix: "src/partials" },
  ];

  for (const { path: searchDir, prefix } of searchDirs) {
    if (!fs.existsSync(searchDir)) continue;

    const findComponents = (dir, relativePath = "") => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = resolve(dir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          const schemaPath = resolve(itemPath, "schema.json");
          if (fs.existsSync(schemaPath)) {
            const schema = fs.readJsonSync(schemaPath);
            const fullRelativePath = relativePath ? `${relativePath}/${item}` : item;
            components.push({
              id: item,
              path: `${prefix}/${fullRelativePath}`,
              dirPath: itemPath,
              ...schema,
              name: schema.name || item,
            });
          } else {
            const nextRelativePath = relativePath ? `${relativePath}/${item}` : item;
            findComponents(itemPath, nextRelativePath);
          }
        }
      }
    };

    findComponents(searchDir);
  }

  return components;
}

/**
 * Obtiene el schema de un componente específico
 */
function getComponentSchema(rootDir, componentName) {
  let componentDir = resolve(rootDir, "src/components", componentName);

  if (!fs.existsSync(resolve(componentDir, "schema.json"))) {
    componentDir = searchComponentDir(resolve(rootDir, "src/partials"), componentName);
  }

  if (!componentDir) {
    return null;
  }

  const schemaPath = resolve(componentDir, "schema.json");
  if (!fs.existsSync(schemaPath)) {
    return null;
  }

  const schema = fs.readJsonSync(schemaPath);
  const availableVariants = [];

  if (fs.existsSync(componentDir)) {
    const files = fs.readdirSync(componentDir);
    for (const file of files) {
      if (file.endsWith(".html")) {
        availableVariants.push(file.replace(".html", ""));
      }
    }
  }

  return {
    id: componentName,
    dirPath: componentDir,
    ...schema,
    _availableVariants: availableVariants,
  };
}

/**
 * Renderiza un componente con una variante específica y props
 */
async function renderComponent(rootDir, componentName, variant, props) {
  let componentDir = resolve(rootDir, "src/components", componentName);

  if (!fs.existsSync(componentDir)) {
    componentDir = searchComponentDir(resolve(rootDir, "src/partials"), componentName);
  }

  if (!componentDir) {
    throw new Error(`Component '${componentName}' not found`);
  }

  let variantPath = null;
  const potentialNames = [`${variant}.html`, `${componentName}-${variant}.html`];

  for (const name of potentialNames) {
    const path = resolve(componentDir, name);
    if (fs.existsSync(path)) {
      variantPath = path;
      break;
    }
  }

  if (!variantPath) {
    const availableVariants = [];
    if (fs.existsSync(componentDir)) {
      const files = fs.readdirSync(componentDir);
      for (const file of files) {
        if (file.endsWith(".html")) {
          availableVariants.push(file.replace(".html", ""));
        }
      }
    }
    throw new Error(
      `Variant '${variant}' not found. Available: ${availableVariants.join(", ") || "none"}`,
    );
  }

  // Leer el archivo de variante
  let componentHtml = fs.readFileSync(variantPath, "utf8");

  // Remover el bloque <script props>...</script>
  componentHtml = componentHtml.replace(/<script\s+props[^>]*>[\s\S]*?<\/script>/i, "");

  // Convertir sintaxis de Maizzle a Handlebars
  componentHtml = componentHtml.replace(/\[\[([^\]]+)\]\]/g, "{{$1}}");

  // Convertir condicionales de Maizzle a Handlebars
  componentHtml = componentHtml.replace(
    /<if\s+condition="([^"]+)">\s*([\s\S]*?)\s*<\/if>/gi,
    "{{#if $1}}$2{{/if}}",
  );

  componentHtml = componentHtml.replace(/<elseif\s+condition="([^"]+)">/gi, "{{else if $1}}");

  componentHtml = componentHtml.replace(/<else>\s*/gi, "{{else}}");

  // Crear documento HTML completo con el componente en el layout
  const fullHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <style>
    :root {
      color-scheme: light dark;
    }
  </style>
  <style>
    @import "src/css/tailwind.email.css";
  </style>
</head>
<body class="bg-zinc-100 dark:bg-zinc-900 m-0 p-0">
  <div class="w-full bg-zinc-100 dark:bg-zinc-900">
    <table class="w-full max-w-2xl mx-auto" cellpadding="0" cellspacing="0" role="none">
      <!-- CONTENT (component) -->
      <tr>
        <td class="bg-white dark:bg-zinc-800 px-8 py-10 dark:text-zinc-100">
          ${componentHtml}
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;

  // Procesar con Maizzle
  const { html: maizzleHtml } = await render(fullHtml, {
    useTransformers: false,
    components: {
      folders: [resolve(rootDir, "src/layouts"), resolve(rootDir, "src/partials")],
      tagPrefix: "x-",
    },
    expressions: {
      delimiters: ["[[", "]]"],
      unescapedDelimiters: ["[[[", "]]]"],
    },
  });

  // Convertir sintaxis de Maizzle remanente a Handlebars
  const cleanHtml = maizzleHtml.replace(/\[\[([^\]]+)\]\]/g, "{{$1}}");

  // Preparar datos para Handlebars
  const handlebarsData = {
    title: props.title || "Bienvenido a Mi Empresa",
    subtitle: props.subtitle || "Descubre todo lo que podemos hacer por ti",
    buttonText: props.buttonText || props["button-text"] || "Explorar ahora",
    buttonUrl: props.buttonUrl || props["button-url"] || "https://ejemplo.com",
    showButton: props.showButton !== false && props["show-button"] !== "false",
    ...props,
  };

  // Compilar y renderizar con Handlebars
  const template = Handlebars.compile(cleanHtml);
  return template(handlebarsData);
}

/**
 * Maneja las rutas /api/components para GET y POST
 */
export function setupComponentsApi(server, rootDir) {
  server.middlewares.use((req, res, next) => {
    if (!req.url?.startsWith("/api/components")) {
      return next();
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const componentName = url.pathname.split("/")[3];

    // GET /api/components - Listar todos los componentes
    if (req.method === "GET" && !componentName) {
      try {
        const components = getComponentsList(rootDir);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(components));
      } catch (err) {
        console.error("[components] List Error:", err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // GET /api/components/:name - Obtener schema de un componente
    if (req.method === "GET" && componentName) {
      try {
        const schema = getComponentSchema(rootDir, componentName);
        if (!schema) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          return res.end(JSON.stringify({ error: "Component not found" }));
        }
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(schema));
      } catch (err) {
        console.error("[components] Get Error:", err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // POST /api/components/:name/render - Renderizar componente
    if (req.method === "POST" && componentName && url.pathname.endsWith("/render")) {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", async () => {
        try {
          const { variant, props } = JSON.parse(body);
          if (!variant) throw new Error("Variant is required");

          const rendered = await renderComponent(rootDir, componentName, variant, props);

          // Envolver en estructura HTML para iframe
          const iframeHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/index.css">
</head>
<body style="margin: 0; padding: 0;">
  ${rendered}
</body>
</html>`;

          res.setHeader("Content-Type", "text/html");
          res.end(iframeHtml);
        } catch (err) {
          console.error("[components] Render Error:", err);
          res.statusCode = 500;
          res.end(
            `<pre style="color: #d32f2f; padding: 1rem; font-family: monospace;">${err.message}</pre>`,
          );
        }
      });
      return;
    }

    return next();
  });
}
