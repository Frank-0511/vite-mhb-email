/**
 * @fileoverview Declaraciones de tipo para fs-extra en ausencia de @types/fs-extra.
 */

declare module "fs-extra" {
  export * from "node:fs";

  export function ensureDir(path: string): Promise<void>;
  export function ensureDirSync(path: string): void;
  export function remove(path: string): Promise<void>;
  export function removeSync(path: string): void;
  export function emptyDir(path: string): Promise<void>;
  export function emptyDirSync(path: string): void;
  export function pathExists(path: string): Promise<boolean>;
  export function pathExistsSync(path: string): boolean;
  export function outputFileSync(file: string, data: any, options?: any): void;
  export function outputFile(file: string, data: any, options?: any): Promise<void>;
  export function outputJsonSync(file: string, data: any, options?: any): void;
  export function outputJson(file: string, data: any, options?: any): Promise<void>;
  export function readJsonSync(file: string, options?: any): any;
  export function readJson(file: string, options?: any): Promise<any>;
  export function writeJsonSync(file: string, data: any, options?: any): void;
  export function writeJson(file: string, data: any, options?: any): Promise<void>;
  export function copySync(src: string, dest: string, options?: any): void;
  export function copy(src: string, dest: string, options?: any): Promise<void>;
  export function readFile(file: string, encoding: string): Promise<string>;
  export function readFile(file: string): Promise<Buffer>;
  export function writeFile(file: string, data: any, options?: any): Promise<void>;

  const fsExtra: typeof import("node:fs") & {
    ensureDir(path: string): Promise<void>;
    ensureDirSync(path: string): void;
    remove(path: string): Promise<void>;
    removeSync(path: string): void;
    emptyDir(path: string): Promise<void>;
    emptyDirSync(path: string): void;
    pathExists(path: string): Promise<boolean>;
    pathExistsSync(path: string): boolean;
    outputFileSync(file: string, data: any, options?: any): void;
    outputFile(file: string, data: any, options?: any): Promise<void>;
    outputJsonSync(file: string, data: any, options?: any): void;
    outputJson(file: string, data: any, options?: any): Promise<void>;
    readJsonSync(file: string, options?: any): any;
    readJson(file: string, options?: any): Promise<any>;
    writeJsonSync(file: string, data: any, options?: any): void;
    writeJson(file: string, data: any, options?: any): Promise<void>;
    copySync(src: string, dest: string, options?: any): void;
    copy(src: string, dest: string, options?: any): Promise<void>;
    readFile(file: string, encoding: string): Promise<string>;
    readFile(file: string): Promise<Buffer>;
    writeFile(file: string, data: any, options?: any): Promise<void>;
    [key: string]: any;
  };

  export default fsExtra;
}
