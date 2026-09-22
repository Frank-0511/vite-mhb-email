/**
 * @fileoverview Barril exportador de servicios de render y compilación.
 */

export { compileTemplate } from "./maizzle-compiler.ts";

export {
  normalizeRenderError,
  RENDER_ERROR_VERSION,
  type NormalizedRenderError,
  type RenderErrorLocation,
  type NormalizeRenderErrorOptions,
} from "./render-error.ts";

export {
  renderComponentPreview,
  type RenderComponentPreviewOptions,
} from "./component-preview-renderer.ts";

export {
  createRenderRequestHandler,
  type RenderRequestHandlerOptions,
} from "./render-request-handler.ts";

export { runSelectiveBuild, type SelectiveBuildResult } from "./selective-build.ts";
