import type { Result } from "./core"

export type ValueErrorType<T> = T extends
	| Result<infer V, infer E>
	| Promise<Result<infer V, infer E>>
	| ((...args: any[]) => Promise<Result<infer V, infer E>>)
	? { value: V; error: E }
	: never
export type ValueType<T> = ValueErrorType<T>["value"]
export type ErrorType<T> = ValueErrorType<T>["error"]

export type NeverFn = (...args: any[]) => never
export type Fn = (...args: any[]) => any
export type AsyncFn = (...args: any[]) => Promise<any>

/**
 * Returns true if the value is `PromiseLike`.
 */
export function isPromiseLike<T>(v: unknown): v is PromiseLike<T> {
	return (
		v instanceof Promise ||
		(v != null && typeof v === "object" && typeof (v as PromiseLike<T>).then === "function")
	)
}
