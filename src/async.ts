import {Result} from "./core"
import {type Panic} from "./panic"

interface MethodsAsync<T> {
	match<A, B>(args: {ok: (value: T) => A; err: (error: Error) => B}): Promise<A | B>
	tap(): Promise<T>
	expect(panicOrMessage: Panic | string): Promise<T>
	unwrapUnsafe(): Promise<T>
	unwrapOr<U>(defaultValue: U): Promise<T | U>
	unwrapOrElse<U>(defaultValue: (error: Error) => U): Promise<T | U>
	unwrapErrUnsafe(): Promise<Error>
}

/** Represents the result of an operation that can either succeed with a value or fail */
export class PromiseResult<T> implements PromiseLike<Result<T>>, MethodsAsync<T> {
	readonly promise: Promise<Result<T>>

	constructor(promise: Promise<Result<T>>) {
		this.promise = promise
	}

	then<A, B>(
		successCallback?: (res: Result<T>) => A | PromiseLike<A>,
		failureCallback?: (reason: unknown) => B | PromiseLike<B>,
	): PromiseLike<A | B> {
		return this.promise.then(successCallback, failureCallback)
	}

	catch<B>(rejectionCallback?: (reason: unknown) => B | PromiseLike<B>): PromiseLike<B> {
		return this.promise.then(null, rejectionCallback)
	}

	finally(callback: () => void): PromiseLike<Result<T>> {
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

	async match<A, B>(args: {ok: (value: T) => A; err: (error: Error) => B}) {
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

	async unwrapOr<U>(defaultValue: U) {
		return (await this).unwrapOr(defaultValue)
	}

	async unwrapOrElse<U>(defaultValue: (error: Error) => U) {
		return (await this).unwrapOrElse(defaultValue)
	}

	async unwrapErrUnsafe() {
		return (await this).unwrapErrUnsafe()
	}
}
