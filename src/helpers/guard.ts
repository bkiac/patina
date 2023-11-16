import {type ErrorHandler, type ResultError} from "../error/result_error.js"
import {tryAsyncFn, tryAsyncFnWith, tryFn, tryFnWith} from "./try.js"

export function guard<A extends any[], T>(f: (...args: A) => T) {
	return function (...args: A) {
		return tryFn<T>(() => f(...args))
	}
}

export function guardWith<A extends any[], T, E extends ResultError<Error | null>>(
	f: (...args: A) => T,
	h: ErrorHandler<E>,
) {
	return function (...args: A) {
		return tryFnWith<T, E>(() => f(...args), h)
	}
}

export function guardAsync<A extends any[], T>(f: (...args: A) => Promise<T>) {
	return function (...args: A) {
		return tryAsyncFn<T>(() => f(...args))
	}
}

export function guardAsyncWith<A extends any[], T, E extends ResultError<Error | null>>(
	f: (...args: A) => Promise<T>,
	h: ErrorHandler<E>,
) {
	return function (...args: A) {
		return tryAsyncFnWith<T, E>(() => f(...args), h)
	}
}
