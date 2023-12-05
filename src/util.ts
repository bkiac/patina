import type {Err, Ok, Result} from "./result"

export const inspectSymbol = Symbol.for("nodejs.util.inspect.custom")

/**
 * Tries to replace the stack trace to include the subclass error name.
 *
 * May not work in every environment, since `stack` property is implementation-dependent and isn't standardized,
 *
 * meaning different JavaScript engines might produce different stack traces.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack
 */
export function replaceStack(name: string, originName: string, stack?: string) {
	const r = new RegExp(`^${originName}`)
	return stack?.replace(r, name)
}

export function formatErrorString(name: string, message = "") {
	return name + (message ? ": " + message : "")
}

export type InferOk<T> = T extends Ok<infer O> ? O : never

export type InferErr<T> = T extends Err<infer E> ? E : never

export type ExtractOk<T> = T extends Ok<infer O>
	? O
	: T extends Result<infer O, infer _>
	? O
	: never

export type ExtractErr<T> = T extends Err<infer E>
	? E
	: T extends Result<infer _, infer E>
	? E
	: never
