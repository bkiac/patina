import type {Ok} from "./core"

export type UnwrapValue<T> = T extends Ok<infer U> ? U : never

export type NeverFn = (...args: any[]) => never
export type Fn = (...args: any[]) => any
export type AsyncFn = (...args: any[]) => Promise<any>
export type FnArgs = Parameters<(...args: any[]) => any>
