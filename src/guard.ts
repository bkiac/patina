import {type ErrorHandler} from "./error"
import {tryAsyncFn, tryAsyncFnWith, tryFn, tryFnWith} from "./try"

export function guard<A extends any[], T>(fn: (...args: A) => T) {
	return function (...args: A) {
		return tryFn<T>(() => fn(...args))
	}
}

export function guardWith<A extends any[], T, E extends Error>(
	fn: (...args: A) => T,
	handleError: ErrorHandler<E>,
) {
	return function (...args: A) {
		return tryFnWith<T, E>(() => fn(...args), handleError)
	}
}

export function guardAsync<A extends any[], T>(fn: (...args: A) => Promise<T>) {
	return function (...args: A) {
		return tryAsyncFn<T>(() => fn(...args))
	}
}

export function guardAsyncWith<A extends any[], T, E extends Error>(
	fn: (...args: A) => Promise<T>,
	handleError: ErrorHandler<E>,
) {
	return function (...args: A) {
		return tryAsyncFnWith<T, E>(() => fn(...args), handleError)
	}
}
