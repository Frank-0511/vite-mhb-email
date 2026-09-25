/**
 * @fileoverview Fixtures y generadores de directorios dist/ temporales para pruebas.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const FIXTURE_HTML_WELCOME =
  '<!DOCTYPE html><html><body><h1>Welcome {{ first_name }}</h1><p><a href="{{ unsubscribe_url }}">Unsubscribe</a></p></body></html>\n';

export const FIXTURE_HTML_RECEIPT =
  "<!DOCTYPE html><html><body><h1>Order {{ order_number }}</h1><p>Total: {{ total_amount }}</p></body></html>\n";

export const FIXTURE_HTML_WELCOME_LOST_ESP =
  '<!DOCTYPE html><html><body><h1>Welcome Friend</h1><p><a href="{{ unsubscribe_url }}">Unsubscribe</a></p></body></html>\n';

export const FIXTURE_HTML_WELCOME_NEW_ESP =
  '<!DOCTYPE html><html><body><h1>Welcome {{ first_name }} {{ last_name }}</h1><p><a href="{{ unsubscribe_url }}">Unsubscribe</a></p></body></html>\n';

export const FIXTURE_HTML_WELCOME_BYTE_CHANGED =
  '<!DOCTYPE html><html><body><h1>Welcome {{ first_name }}!</h1><p><a href="{{ unsubscribe_url }}">Unsubscribe</a></p></body></html>\n';

/**
 * Crea un directorio temporal que simula un dist/ con los templates dados.
 *
 * @param {Record<string, string>} files Mapa de nombre de archivo a contenido HTML
 * @returns {{ dir: string; cleanup: () => void }}
 */
export function createTempDist(files: Record<string, string>): {
  dir: string;
  cleanup: () => void;
} {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dist-baseline-test-"));

  for (const [filename, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, filename), content, "utf-8");
  }

  const cleanup = () => {
    fs.rmSync(dir, { recursive: true, force: true });
  };

  return { dir, cleanup };
}
