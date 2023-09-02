import {fromAsyncFn, fromFn} from "./from"
import type {AsyncFn, Fn} from "./util"

export function guard<T extends Fn>(fn: T) {
	return function (...args: Parameters<T>) {
		return fromFn<ReturnType<T>>(() => fn(...args))
	}
}

export function guardAsync<T extends AsyncFn>(fn: T) {
	return function (...args: Parameters<T>) {
		return fromAsyncFn<Awaited<ReturnType<T>>>(() => fn(...args))
	}
}
