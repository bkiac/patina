import {Result} from "./core"
import {type Panic} from "./panic"

export type MethodsAsync<TValue, TError extends Error> = {
	expect(panicOrMessage: Panic | string): Promise<TValue>
	unwrap(): Promise<TValue>
	unwrapOr<T>(defaultValue: T): Promise<T | TValue>
	unwrapOrElse<T>(defaultValue: (error: TError) => T): Promise<T | TValue>
	unwrapErr(): Promise<TError>
	match<V, E>(args: {ok: (value: TValue) => V; err: (error: TError) => E}): Promise<V | E>
}

/** Represents the result of an operation that can either succeed with a value or fail */
export class PromiseResult<TValue, TError extends Error = Error>
	implements PromiseLike<Result<TValue, TError>>, MethodsAsync<TValue, TError>
{
	public readonly promise: Promise<Result<TValue, TError>>

	public constructor(promise: Promise<Result<TValue, TError>>) {
		this.promise = promise
	}

	public then<A, B>(
		successCallback?: (res: Result<TValue, TError>) => A | PromiseLike<A>,
		failureCallback?: (reason: unknown) => B | PromiseLike<B>,
	): PromiseLike<A | B> {
		return this.promise.then(successCallback, failureCallback)
	}

	public catch<B>(rejectionCallback?: (reason: unknown) => B | PromiseLike<B>): PromiseLike<B> {
		return this.promise.then(null, rejectionCallback)
	}

	public finally(callback: () => void): PromiseLike<Result<TValue, TError>> {
		return this.then(
			(value) => {
				callback()
				return value
			},
			(reason) => {
				callback()
				throw reason
			},
		)
	}

	public async expect(panicOrMessage: Panic | string) {
		return (await this).expect(panicOrMessage)
	}

	public async unwrap() {
		return (await this).unwrap()
	}

	public async unwrapOr<T>(defaultValue: T) {
		return (await this).unwrapOr(defaultValue)
	}

	public async unwrapOrElse<T>(defaultValue: (error: TError) => T) {
		return (await this).unwrapOrElse(defaultValue)
	}

	public async unwrapErr() {
		return (await this).unwrapErr()
	}

	public async match<V, E>(args: {ok: (value: TValue) => V; err: (error: TError) => E}) {
		return (await this).match(args)
	}
}
