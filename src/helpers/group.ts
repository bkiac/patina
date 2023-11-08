import {tryAsyncFnWith, tryFnWith, tryPromiseWith} from "./try"
import type {ErrorHandler} from "../error/result_error"
import type {Result} from "../result/interface"
import type {PromiseResult} from "../result/promise"

type Fn = (...args: any[]) => any
type AsyncFn = (...args: any[]) => Promise<any>

export class ResultGroup<E> {
	private constructor(private readonly handleError: ErrorHandler<E>) {}

	tryFn<T>(f: () => T): Result<T, E> {
		return tryFnWith(f, this.handleError)
	}

	tryFnWith<T, F>(f: () => T, handleError: (error: E) => F): Result<T, F> {
		return tryFnWith(f, (error) => handleError(this.handleError(error)))
	}

	tryPromise<T>(promise: Promise<T>): PromiseResult<T, E> {
		return tryPromiseWith(promise, this.handleError)
	}

	tryPromiseWith<T, F>(promise: Promise<T>, handleError: (error: E) => F): PromiseResult<T, F> {
		return tryPromiseWith(promise, (error) => handleError(this.handleError(error)))
	}

	tryAsyncFn<T>(f: () => Promise<T>): PromiseResult<T, E> {
		return tryAsyncFnWith(f, this.handleError)
	}

	tryAsyncFnWith<T, F>(f: () => Promise<T>, handleError: (error: E) => F): PromiseResult<T, F> {
		return tryAsyncFnWith(f, (error) => handleError(this.handleError(error)))
	}

	guard<T extends Fn>(f: T) {
		return (...args: Parameters<T>) => this.tryFn(() => f(...args))
	}

	guardWith<T extends Fn, F>(f: T, handleError: (error: E) => F) {
		return (...args: Parameters<T>) => this.tryFnWith(() => f(...args), handleError)
	}

	guardAsync<T extends AsyncFn>(f: T) {
		return (...args: Parameters<T>) => this.tryAsyncFn(() => f(...args))
	}

	guardAsyncWith<T extends AsyncFn, F>(f: T, h: (error: E) => F) {
		return (...args: Parameters<T>) => this.tryAsyncFnWith(() => f(...args), h)
	}

	static with<E>(handleError: ErrorHandler<E>): ResultGroup<E> {
		return new ResultGroup(handleError)
	}
}

export function createGroup<E>(handleError: ErrorHandler<E>): ResultGroup<E> {
	return ResultGroup.with(handleError)
}
