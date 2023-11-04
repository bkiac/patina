import {tryAsyncFnWith, tryFnWith, tryPromiseWith} from "./try"
import type {ErrorHandler, ResultError} from "../error/result_error"
import type {Result} from "../result/interface"
import type {PromiseResult} from "../result/promise"

export type ResultGroupErrorHandler<E extends ResultError, F extends ResultError> = (error: E) => F

type Fn = (...args: any[]) => any
type AsyncFn = (...args: any[]) => Promise<any>

export class ResultGroup<E extends ResultError> {
	private constructor(private readonly handleError: ErrorHandler<E>) {}

	tryFn<T>(f: () => T): Result<T, E> {
		return tryFnWith(f, this.handleError)
	}

	tryFnWith<T, F extends ResultError>(
		f: () => T,
		h: ResultGroupErrorHandler<E, F>,
	): Result<T, F> {
		return tryFnWith(f, (error) => h(this.handleError(error)))
	}

	tryPromise<T>(promise: Promise<T>): PromiseResult<T, E> {
		return tryPromiseWith(promise, this.handleError)
	}

	tryPromiseWith<T, F extends ResultError>(
		promise: Promise<T>,
		h: ResultGroupErrorHandler<E, F>,
	): PromiseResult<T, F> {
		return tryPromiseWith(promise, (error) => h(this.handleError(error)))
	}

	tryAsyncFn<T>(f: () => Promise<T>): PromiseResult<T, E> {
		return tryAsyncFnWith(f, this.handleError)
	}

	tryAsyncFnWith<T, F extends ResultError>(
		f: () => Promise<T>,
		h: ResultGroupErrorHandler<E, F>,
	): PromiseResult<T, F> {
		return tryAsyncFnWith(f, (error) => h(this.handleError(error)))
	}

	guard<T extends Fn>(f: T) {
		return (...args: Parameters<T>) => this.tryFn(() => f(...args))
	}

	guardWith<T extends Fn, F extends ResultError>(f: T, h: ResultGroupErrorHandler<E, F>) {
		return (...args: Parameters<T>) => this.tryFnWith(() => f(...args), h)
	}

	guardAsync<T extends AsyncFn>(f: T) {
		return (...args: Parameters<T>) => this.tryAsyncFn(() => f(...args))
	}

	guardAsyncWith<T extends AsyncFn, F extends ResultError>(
		f: T,
		h: ResultGroupErrorHandler<E, F>,
	) {
		return (...args: Parameters<T>) => this.tryAsyncFnWith(() => f(...args), h)
	}

	static with<E extends ResultError>(handleError: ErrorHandler<E>): ResultGroup<E> {
		return new ResultGroup(handleError)
	}
}

export function createGroup<E extends ResultError>(handleError: ErrorHandler<E>): ResultGroup<E> {
	return ResultGroup.with(handleError)
}
