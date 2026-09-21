/// <reference types="vite/client" />

interface ImportMeta {
  readonly hot?: import("vite").ViteHotContext;
  readonly dir?: string;
  readonly dirname?: string;
}
