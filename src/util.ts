import type {Result} from "./core"

export type ValueType<T> = T extends
	| Result<infer U>
	| Promise<Result<infer U>>
	| ((...args: any[]) => Result<infer U>)
	| ((...args: any[]) => Promise<Result<infer U>>)
	? U
	: never

export type Fn = (...args: any[]) => any
export type AsyncFn = (...args: any[]) => Promise<any>
