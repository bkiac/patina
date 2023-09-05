import {Result} from "./core"
import {type Panic} from "./panic"

interface MethodsAsync<TValue, TError extends Error> {
	match<V, E>(args: {ok: (value: TValue) => V; err: (error: TError) => E}): Promise<V | E>
	tap(): Promise<TValue>
	expect(panicOrMessage: Panic | string): Promise<TValue>
	unwrapUnsafe(): Promise<TValue>
	unwrapOr<T>(defaultValue: T): Promise<T | TValue>
	unwrapOrElse<T>(defaultValue: (error: TError) => T): Promise<T | TValue>
	unwrapErrUnsafe(): Promise<TError>
}

/** Represents the result of an operation that can either succeed with a value or fail */
export class PromiseResult<TValue, TError extends Error = Error>
	implements PromiseLike<Result<TValue, TError>>, MethodsAsync<TValue, TError>
{
	readonly promise: Promise<Result<TValue, TError>>

	constructor(promise: Promise<Result<TValue, TError>>) {
		this.promise = promise
	}

	then<A, B>(
		successCallback?: (res: Result<TValue, TError>) => A | PromiseLike<A>,
		failureCallback?: (reason: unknown) => B | PromiseLike<B>,
	): PromiseLike<A | B> {
		return this.promise.then(successCallback, failureCallback)
	}

	catch<B>(rejectionCallback?: (reason: unknown) => B | PromiseLike<B>): PromiseLike<B> {
		return this.promise.then(null, rejectionCallback)
	}

	finally(callback: () => void): PromiseLike<Result<TValue, TError>> {
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

	async match<V, E>(args: {ok: (value: TValue) => V; err: (error: TError) => E}) {
		return (await this).match(args)
	}

	async tap() {
		return (await this).tap()
	}

	async expect(panicOrMessage: Panic | string) {
		return (await this).expect(panicOrMessage)
	}

	async unwrapUnsafe() {
		return (await this).unwrapUnsafe()
	}

	async unwrapOr<T>(defaultValue: T) {
		return (await this).unwrapOr(defaultValue)
	}

	async unwrapOrElse<T>(defaultValue: (error: TError) => T) {
		return (await this).unwrapOrElse(defaultValue)
	}

	async unwrapErrUnsafe() {
		return (await this).unwrapErrUnsafe()
	}
}
