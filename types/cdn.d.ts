declare module "https://cdn.jsdelivr.net/npm/vanilla-jsoneditor@3.11.0/standalone.js" {
  export class JSONEditor {
    constructor(options: {
      target: HTMLElement;
      props?: {
        content?: { json?: any; text?: string };
        mode?: string;
        mainMenuBar?: boolean;
        navigationBar?: boolean;
        statusBar?: boolean;
        readOnly?: boolean;
        onChange?: (content: any, previousContent: any, status: any) => void;
        onRenderMenu?: (items: any[], context: any) => any[] | undefined;
      };
    });
    set(content: { json?: any; text?: string }): void;
    get(): { json?: any; text?: string };
    updateProps(props: any): void;
    destroy(): void;
  }
}
