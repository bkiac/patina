import type {ErrorHandler, ResultError} from "../error/result_error"
import {tryAsyncFn, tryAsyncFnWith, tryFn, tryFnWith} from "./try"

type Fn = (...args: any[]) => any
type AsyncFn = (...args: any[]) => Promise<any>

export function guard<T extends Fn>(f: T) {
	return function (...args: Parameters<T>) {
		return tryFn<ReturnType<T>>(() => f(...args))
	}
}

export function guardWith<T extends Fn, E extends ResultError>(f: T, h: ErrorHandler<E>) {
	return function (...args: Parameters<T>) {
		return tryFnWith<ReturnType<T>, E>(() => f(...args), h)
	}
}

export function guardAsync<T extends AsyncFn>(f: T) {
	return function (...args: Parameters<T>) {
		return tryAsyncFn<Awaited<ReturnType<T>>>(() => f(...args))
	}
}

export function guardAsyncWith<T extends AsyncFn, E extends ResultError>(f: T, h: ErrorHandler<E>) {
	return function (...args: Parameters<T>) {
		return tryAsyncFnWith<Awaited<ReturnType<T>>, E>(() => f(...args), h)
	}
}
