import {OptionPromise} from "./option_promise"
import type {Result, ResultImpl, ResultMatch} from "./result"

/**
 * A promise that resolves to a `Result`.
 *
 * This class is useful for chaining multiple asynchronous operations that return a `Result`.
 */
export class ResultPromise<T, E> implements PromiseLike<Result<T, E>> {
	constructor(
		readonly promise: Promise<Result<T, E>> | PromiseLike<Result<T, E>> | ResultPromise<T, E>,
	) {}

	then<A, B>(
		successCallback?: (res: Result<T, E>) => A | PromiseLike<A>,
		failureCallback?: (reason: unknown) => B | PromiseLike<B>,
	): PromiseLike<A | B> {
		return this.promise.then(successCallback, failureCallback)
	}

	catch<B>(rejectionCallback?: (reason: unknown) => B | PromiseLike<B>): PromiseLike<B> {
		return this.promise.then(undefined, rejectionCallback)
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

	/**
	 * Async version of `Result#ok`.
	 */
	ok(): OptionPromise<T> {
		return new OptionPromise(this.then((result) => result.ok()))
	}

	/**
	 * Async version of `Result#err`.
	 */
	err(): OptionPromise<E> {
		return new OptionPromise(this.then((result) => result.err()))
	}

	/**
	 * Async version of `Result#and`.
	 */
	and<U, F>(other: ResultPromise<U, F>): ResultPromise<U, E | F> {
		return new ResultPromise(
			this.then((result) => other.then((otherResult) => result.and(otherResult))),
		)
	}

	/**
	 * Async version of `Result#andThen`.
	 */
	andThen<U, F>(f: (value: T) => Result<U, F>): ResultPromise<U, E | F> {
		return new ResultPromise(this.then((result) => result.andThen((value) => f(value))))
	}

	/**
	 * Async version of `Result#expect`.
	 */
	async expect(message: string): Promise<T> {
		return (await this).expect(message)
	}

	/**
	 * Async version of `Result#expectErr`.
	 */
	async expectErr(message: string): Promise<E> {
		return (await this).expectErr(message)
	}

	/**
	 * Async version of `Result#flatten`.
	 */
	flatten<U, F>(this: ResultPromise<ResultImpl<U, F>, E>): ResultPromise<U, E | F> {
		return new ResultPromise(this.then((result) => result.flatten()))
	}

	/**
	 * Async version of `Result#inspect`.
	 */
	inspect(f: (value: T) => void): ResultPromise<T, E> {
		return new ResultPromise(this.then((result) => result.inspect(f)))
	}

	/**
	 * Async version of `Result#inspectAsync`.
	 */
	inspectAsync(f: (value: T) => Promise<void>): ResultPromise<T, E> {
		return new ResultPromise(this.then((result) => result.inspectAsync(f)))
	}

	/**
	 * Async version of `Result#inspectErr`.
	 */
	inspectErr(f: (error: E) => void): ResultPromise<T, E> {
		return new ResultPromise(this.then((result) => result.inspectErr(f)))
	}

	/**
	 * Async version of `Result#inspectErrAsync`.
	 */
	inspectErrAsync(f: (error: E) => Promise<void>): ResultPromise<T, E> {
		return new ResultPromise(this.then((result) => result.inspectErrAsync(f)))
	}

	/**
	 * Async version of `Result#map`.
	 */
	map<U>(f: (value: T) => U): ResultPromise<U, E> {
		return new ResultPromise(this.then((result) => result.map(f)))
	}

	/**
	 * Async version of `Result#mapAsync`.
	 */
	mapAsync<U>(f: (value: T) => Promise<U>): ResultPromise<U, E> {
		return new ResultPromise(this.then((result) => result.mapAsync(f)))
	}

	/**
	 * Async version of `Result#mapErr`.
	 */
	mapErr<F>(f: (error: E) => F): ResultPromise<T, F> {
		return new ResultPromise(this.then((result) => result.mapErr(f)))
	}

	/**
	 * Async version of `Result#mapErrAsync`.
	 */
	mapErrAsync<F>(f: (error: E) => Promise<F>): ResultPromise<T, F> {
		return new ResultPromise(this.then((result) => result.mapErrAsync(f)))
	}

	/**
	 * Async version of `Result#mapOr`.
	 */
	async mapOr<A, B>(defaultValue: A, f: (value: T) => B): Promise<A | B> {
		return (await this).mapOr(defaultValue, f)
	}

	/**
	 * Async version of `Result#mapOrElse`.
	 */
	async mapOrElse<A, B>(defaultValue: (error: E) => A, f: (value: T) => B): Promise<A | B> {
		return (await this).mapOrElse(defaultValue, f)
	}

	/**
	 * Async version of `Result#or`.
	 */
	or<U, F>(other: ResultPromise<U, F>): ResultPromise<T | U, F> {
		return new ResultPromise(
			this.then((thisResult) => other.then((otherResult) => thisResult.or(otherResult))),
		)
	}

	/**
	 * Async version of `Result#orElse`.
	 */
	orElse<U, F>(f: (error: E) => Result<U, F>): ResultPromise<T | U, F> {
		return new ResultPromise(this.then((thisResult) => thisResult.orElse((error) => f(error))))
	}

	/**
	 * Async version of `Result#unwrap`.
	 */
	async unwrap(): Promise<T> {
		return (await this).unwrap()
	}

	/**
	 * Async version of `Result#unwrapErr`.
	 */
	async unwrapErr(): Promise<E> {
		return (await this).unwrapErr()
	}

	/**
	 * Async version of `Result#unwrapOr`.
	 */
	async unwrapOr<U>(defaultValue: U): Promise<T | U> {
		return (await this).unwrapOr(defaultValue)
	}

	/**
	 * Async version of `Result#unwrapOrElse`.
	 */
	async unwrapOrElse<U>(defaultValue: (error: E) => U): Promise<T | U> {
		return (await this).unwrapOrElse(defaultValue)
	}

	/**
	 * Async version of `Result#match`.
	 */
	async match<A, B>(matcher: ResultMatch<T, E, A, B>): Promise<A | B> {
		return (await this).match(matcher)
	}
}
