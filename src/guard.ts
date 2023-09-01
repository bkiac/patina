import {tryAsyncFn, tryFn} from "./try"
import type {AsyncFn, Fn} from "./util"

export function guard<T extends Fn>(fn: T) {
	return function (...args: Parameters<T>) {
		return tryFn<ReturnType<T>>(() => fn(...args))
	}
}

export function guardAsync<T extends AsyncFn>(fn: T) {
	return function (...args: Parameters<T>) {
		return tryAsyncFn<Awaited<ReturnType<T>>>(() => fn(...args))
	}
}
