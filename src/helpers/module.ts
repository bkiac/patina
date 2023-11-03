import {tryAsyncFnWith, tryFnWith, tryPromiseWith} from "./try"
import type {ErrorHandler, ResultError} from "../error/result_error"
import type {Result} from "../result/interface"
import type {PromiseResult} from "../result/promise"

export type ResultModuleErrorHandler<E extends ResultError, F extends ResultError> = (error: E) => F

export class ResultModule<E extends ResultError> {
	private constructor(private readonly handleError: ErrorHandler<E>) {}

	tryFn<T>(f: () => T): Result<T, E> {
		return tryFnWith(f, this.handleError)
	}

	tryFnWith<T, F extends ResultError>(
		f: () => T,
		h: ResultModuleErrorHandler<E, F>,
	): Result<T, F> {
		return tryFnWith(f, (error) => h(this.handleError(error)))
	}

	tryPromise<T>(promise: Promise<T>): PromiseResult<T, E> {
		return tryPromiseWith(promise, this.handleError)
	}

	tryPromiseWith<T, F extends ResultError>(
		promise: Promise<T>,
		h: ResultModuleErrorHandler<E, F>,
	): PromiseResult<T, F> {
		return tryPromiseWith(promise, (error) => h(this.handleError(error)))
	}

	tryAsyncFn<T>(f: () => Promise<T>): PromiseResult<T, E> {
		return tryAsyncFnWith(f, this.handleError)
	}

	tryAsyncFnWith<T, F extends ResultError>(
		f: () => Promise<T>,
		h: ResultModuleErrorHandler<E, F>,
	): PromiseResult<T, F> {
		return tryAsyncFnWith(f, (error) => h(this.handleError(error)))
	}

	static with<E extends ResultError>(handleError: ErrorHandler<E>): ResultModule<E> {
		return new ResultModule(handleError)
	}
}

export function module<E extends ResultError>(handleError: ErrorHandler<E>): ResultModule<E> {
	return ResultModule.with(handleError)
}
