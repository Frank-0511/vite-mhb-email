#!/usr/bin/env node
/**
 * @fileoverview CLI para generar iconos PNG de email a partir de Lucide Icons.
 *
 * Uso:
 *   <pm> run generate:icons --icon <nombre> --color <hex> --size <px> [--force]
 */

import { formatRunCommand } from "../shared/env/detect-pm.ts";
import { c, paint } from "../shared/index.ts";
import { generateIcon } from "./generator.ts";

interface ParsedCliArgs {
  readonly icon?: string;
  readonly color?: string;
  readonly size?: string;
  readonly suffix?: string;
  readonly dir?: string;
  readonly force: boolean;
  readonly help: boolean;
}

function parseArgs(args: readonly string[]): ParsedCliArgs {
  let icon: string | undefined;
  let color: string | undefined;
  let size: string | undefined;
  let suffix: string | undefined;
  let dir: string | undefined;
  let force = false;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--icon" || arg === "-i") {
      icon = args[++i];
    } else if (arg === "--color" || arg === "-c") {
      color = args[++i];
    } else if (arg === "--size" || arg === "-s") {
      size = args[++i];
    } else if (arg === "--suffix") {
      suffix = args[++i];
    } else if (arg === "--dir" || arg === "-d") {
      dir = args[++i];
    } else if (arg === "--force" || arg === "-f") {
      force = true;
    } else if (arg === "--help" || arg === "-h") {
      help = true;
    }
  }

  return { icon, color, size, suffix, dir, force, help };
}

function printUsage(): void {
  console.log(`
${paint(c.bold + c.cyan, "EmailForge — Generador de iconos PNG")}

${paint(c.bold, "Uso:")}
  ${formatRunCommand("generate:icons")} --icon <nombre> --color <hex> --size <px> [--suffix <vN>] [--force]

${paint(c.bold, "Opciones:")}
  -i, --icon    Nombre del icono en Lucide (ej: rocket, circle-check)
  -c, --color   Color hexadecimal de 6 dígitos sin '#' (ej: fbbf24, 121212)
  -s, --size    Tamaño en píxeles en HTML (el PNG se genera al doble @2x, ej: 24 -> 48x48)
      --suffix  Sufijo de versión para inmutabilidad (ej: v2 -> lucide-rocket-fbbf24-v2.png)
  -f, --force   Fuerza la sobrescritura si el archivo ya existe
  -h, --help    Muestra esta ayuda

${paint(c.dim, "Ejemplo:")}
  ${formatRunCommand("generate:icons")} --icon rocket --color fbbf24 --size 24 --suffix v2
`);
}

/**
 * Función principal del CLI generador de iconos.
 */
export function runGenerateIconCli(argv: readonly string[] = process.argv.slice(2)): number {
  const parsed = parseArgs(argv);

  if (parsed.help) {
    printUsage();
    return 0;
  }

  if (!parsed.icon || !parsed.color || !parsed.size) {
    console.error(
      paint(
        c.red,
        "\n❌ Error: Parámetros requeridos incompletos. Se deben especificar --icon, --color y --size.",
      ),
    );
    printUsage();
    return 1;
  }

  try {
    const result = generateIcon({
      icon: parsed.icon,
      color: parsed.color,
      size: Number(parsed.size),
      suffix: parsed.suffix,
      iconsDir: parsed.dir,
      force: parsed.force,
    });

    if (result.overwritten) {
      console.warn(
        paint(
          c.yellow,
          `\n⚠️  Advertencia: Se sobrescribió el icono "${result.fileName}". Los clientes de correo o CDNs pueden tener la versión previa cacheada en jsDelivr.\n`,
        ),
      );
    }

    console.log(paint(c.green + c.bold, `\n✅ Icono generado exitosamente: ${result.fileName}`));
    console.log(`   Ruta: ${paint(c.dim, result.filePath)}`);
    console.log(
      `   Dimensiones: ${result.width}×${result.height} px (@2x para render HTML a ${parsed.size}×${parsed.size} px)\n`,
    );

    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(paint(c.red, `\n❌ Error generando icono: ${message}\n`));
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = runGenerateIconCli();
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}
