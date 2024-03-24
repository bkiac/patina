import {tryAsyncFnWith, tryFnWith, tryPromiseWith} from "./try"
import type {ErrorHandler} from "./error"
import type {Result} from "./result"
import type {ResultPromise} from "./result_promise"

type Fn = (...args: any[]) => any
type AsyncFn = (...args: any[]) => Promise<any>

export class ResultGroup<E> {
	private constructor(private readonly handleError: ErrorHandler<E>) {}

	tryFn<T>(fn: () => T): Result<T, E> {
		return tryFnWith(fn, this.handleError)
	}

	tryFnWith<T, F>(fn: () => T, handleError: (error: E) => F): Result<T, F> {
		return tryFnWith(fn, (error, raw) => handleError(this.handleError(error, raw)))
	}

	tryPromise<T>(promise: Promise<T>): ResultPromise<T, E> {
		return tryPromiseWith(promise, this.handleError)
	}

	tryPromiseWith<T, F>(promise: Promise<T>, handleError: (error: E) => F): ResultPromise<T, F> {
		return tryPromiseWith(promise, (error, raw) => handleError(this.handleError(error, raw)))
	}

	tryAsyncFn<T>(fn: () => Promise<T>): ResultPromise<T, E> {
		return tryAsyncFnWith(fn, this.handleError)
	}

	tryAsyncFnWith<T, F>(fn: () => Promise<T>, handleError: (error: E) => F): ResultPromise<T, F> {
		return tryAsyncFnWith(fn, (error, raw) => handleError(this.handleError(error, raw)))
	}

	guard<T extends Fn>(fn: T) {
		return (...args: Parameters<T>) => this.tryFn(() => fn(...args))
	}

	guardWith<T extends Fn, F>(fn: T, handleError: (error: E) => F) {
		return (...args: Parameters<T>) => this.tryFnWith(() => fn(...args), handleError)
	}

	guardAsync<T extends AsyncFn>(fn: T) {
		return (...args: Parameters<T>) => this.tryAsyncFn(() => fn(...args))
	}

	guardAsyncWith<T extends AsyncFn, F>(fn: T, h: (error: E) => F) {
		return (...args: Parameters<T>) => this.tryAsyncFnWith(() => fn(...args), h)
	}

	static with<E>(handleError: ErrorHandler<E>): ResultGroup<E> {
		return new ResultGroup(handleError)
	}
}
