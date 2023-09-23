import {Result} from "./core"
import {type Panic} from "./panic"

interface MethodsAsync<T, E extends Error> {
	match<A, B>(ok: (value: T) => A, err: (error: E) => B): Promise<A | B>
	tap(): Promise<T>
	expect(panic: Panic | string): Promise<T>
	unwrap(): Promise<T>
	unwrapOr<U>(defaultValue: U): Promise<T | U>
	unwrapOrElse<U>(defaultValue: (error: E) => U): Promise<T | U>
	unwrapErr(): Promise<E>
}

/** Represents the result of an operation that can either succeed with a value or fail */
export class PromiseResult<T, E extends Error = Error>
	implements PromiseLike<Result<T, E>>, MethodsAsync<T, E>
{
	constructor(readonly promise: Promise<Result<T, E>>) {}

	then<A, B>(
		successCallback?: (res: Result<T, E>) => A | PromiseLike<A>,
		failureCallback?: (reason: unknown) => B | PromiseLike<B>,
	): PromiseLike<A | B> {
		return this.promise.then(successCallback, failureCallback)
	}

	catch<B>(rejectionCallback?: (reason: unknown) => B | PromiseLike<B>): PromiseLike<B> {
		return this.promise.then(null, rejectionCallback)
	}

	finally(callback: () => void): PromiseLike<Result<T, E>> {
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

	async match<A, B>(ok: (value: T) => A, err: (error: E) => B) {
		return (await this).match(ok, err)
	}

	async tap() {
		return (await this).tap()
	}

	async expect(panic: Panic | string) {
		return (await this).expect(panic)
	}

	async unwrap() {
		return (await this).unwrap()
	}

	async unwrapOr<U>(defaultValue: U) {
		return (await this).unwrapOr(defaultValue)
	}

	async unwrapOrElse<U>(defaultValue: (error: E) => U) {
		return (await this).unwrapOrElse(defaultValue)
	}

	async unwrapErr() {
		return (await this).unwrapErr()
	}
}
