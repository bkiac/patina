import {type ErrorHandler, type ResultError} from "../error/result_error"
import {tryAsyncFn, tryAsyncFnWith, tryFn, tryFnWith} from "./try"

export function guard<A extends any[], T extends any>(f: (...args: A) => T) {
	return function (...args: A) {
		return tryFn<T>(() => f(...args))
	}
}

export function guardWith<A extends any[], T extends any, E extends ResultError<Error | null>>(
	f: (...args: A) => T,
	h: ErrorHandler<E>,
) {
	return function (...args: A) {
		return tryFnWith<T, E>(() => f(...args), h)
	}
}

export function guardAsync<A extends any[], T extends any>(f: (...args: A) => Promise<T>) {
	return function (...args: A) {
		return tryAsyncFn<T>(() => f(...args))
	}
}

export function guardAsyncWith<A extends any[], T extends any, E extends ResultError<Error | null>>(
	f: (...args: A) => Promise<T>,
	h: ErrorHandler<E>,
) {
	return function (...args: A) {
		return tryAsyncFnWith<T, E>(() => f(...args), h)
	}
}
