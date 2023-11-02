import {tryAsyncFn, tryFn} from "./try"

export function guard<T extends (...args: any[]) => any>(fn: T) {
	return function (...args: Parameters<T>) {
		return tryFn<ReturnType<T>>(() => fn(...args))
	}
}

export function guardAsync<T extends (...args: any[]) => Promise<any>>(fn: T) {
	return function (...args: Parameters<T>) {
		return tryAsyncFn<Awaited<ReturnType<T>>>(() => fn(...args))
	}
}
