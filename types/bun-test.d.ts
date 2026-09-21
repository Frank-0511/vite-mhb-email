declare module "bun:test" {
  export interface Mock<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): ReturnType<T>;
    mockImplementation(fn: (...args: Parameters<T>) => ReturnType<T>): this;
    mockReturnValue(val: ReturnType<T>): this;
    mockResolvedValue(val: any): this;
    mockClear(): void;
    mockReset(): void;
    mockRestore(): void;
  }

  export function describe(name: string, fn: () => void | Promise<void>): void;
  export namespace describe {
    export function skip(name: string, fn: () => void | Promise<void>): void;
    export function only(name: string, fn: () => void | Promise<void>): void;
    export function each<T>(
      cases: readonly T[],
    ): (name: string, fn: (arg: T) => void | Promise<void>) => void;
  }

  export function it(name: string, fn: () => void | Promise<void>): void;
  export namespace it {
    export function skip(name: string, fn: () => void | Promise<void>): void;
    export function only(name: string, fn: () => void | Promise<void>): void;
    export function each<T>(
      cases: readonly T[],
    ): (name: string, fn: (arg: T) => void | Promise<void>) => void;
  }

  export function test(name: string, fn: () => void | Promise<void>): void;
  export namespace test {
    export function skip(name: string, fn: () => void | Promise<void>): void;
    export function only(name: string, fn: () => void | Promise<void>): void;
    export function each<T>(
      cases: readonly T[],
    ): (name: string, fn: (arg: T) => void | Promise<void>) => void;
  }

  export function expect(actual: any): any;
  export namespace expect {
    export function objectContaining(obj: any): any;
    export function stringContaining(str: string): any;
    export function arrayContaining(arr: any[]): any;
    export function any(type: any): any;
  }
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;
  export function mock<T extends (...args: any[]) => any>(fn?: T): Mock<T>;
  export function spyOn<T extends object, K extends keyof T>(obj: T, method: K): any;
}
