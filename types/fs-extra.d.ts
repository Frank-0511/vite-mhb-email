/**
 * @fileoverview Declaraciones de tipo para fs-extra en ausencia de @types/fs-extra.
 */

declare module "fs-extra" {
  export * from "node:fs";
  export function ensureDirSync(path: string): void;
  export function outputFileSync(file: string, data: any, options?: any): void;
  export function outputJsonSync(file: string, data: any, options?: any): void;
  export function readJsonSync(file: string, options?: any): any;
  export function removeSync(path: string): void;
  export function emptyDirSync(path: string): void;
  export function copySync(src: string, dest: string, options?: any): void;
  export function readFile(file: string, encoding: string): Promise<string>;
  export function readFile(file: string): Promise<Buffer>;
  export function pathExistsSync(path: string): boolean;
  const fsExtra: typeof import("node:fs") & {
    ensureDirSync(path: string): void;
    outputFileSync(file: string, data: any, options?: any): void;
    outputJsonSync(file: string, data: any, options?: any): void;
    readJsonSync(file: string, options?: any): any;
    removeSync(path: string): void;
    emptyDirSync(path: string): void;
    copySync(src: string, dest: string, options?: any): void;
    readFile(file: string, encoding: string): Promise<string>;
    readFile(file: string): Promise<Buffer>;
    pathExistsSync(path: string): boolean;
  };
  export default fsExtra;
}
