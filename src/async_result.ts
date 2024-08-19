import {AsyncOption} from "./async_option";
import type {Result, ResultImpl, ResultMatch, ResultMatchAsync} from "./result";

/**
 * A promise that resolves to a `Result`.
 *
 * This class is useful for chaining multiple asynchronous operations that return a `Result`.
 */
export class AsyncResult<T, E> implements PromiseLike<Result<T, E>> {
	constructor(
		readonly promise: Promise<Result<T, E>> | PromiseLike<Result<T, E>> | AsyncResult<T, E>,
	) {}

	*[Symbol.iterator](): Iterator<AsyncResult<T, E>, T, any> {
		return yield this;
	}

	then<A, B>(
		successCallback?: (res: Result<T, E>) => A | PromiseLike<A>,
		failureCallback?: (reason: unknown) => B | PromiseLike<B>,
	): PromiseLike<A | B> {
		return this.promise.then(successCallback, failureCallback);
	}

	catch<B>(rejectionCallback?: (reason: unknown) => B | PromiseLike<B>): PromiseLike<B> {
		return this.promise.then(undefined, rejectionCallback);
	}

	finally(callback: () => void): PromiseLike<Result<T, E>> {
		return this.then(
			(value) => {
				callback();
				return value;
			},
			(reason) => {
				callback();
				throw reason;
			},
		);
	}

	/**
	 * Async version of `Result#match`.
	 */
	async match<A, B>(matcher: ResultMatch<T, E, A, B>): Promise<A | B> {
		return (await this).match(matcher);
	}

	async matchAsync<A, B>(matcher: ResultMatchAsync<T, E, A, B>): Promise<A | B> {
		return (await this).matchAsync(matcher);
	}

	/**
	 * @deprecated - Use `unwrap()` instead.
	 */
	async value(): Promise<T | undefined> {
		return (await this).value();
	}

	/**
	 * @deprecated - Use `unwrapErr()` instead.
	 */
	async error(): Promise<E | undefined> {
		return (await this).error();
	}

	/**
	 * Async version of `Result#ok`.
	 */
	ok(): AsyncOption<T> {
		return new AsyncOption(this.then((result) => result.ok()));
	}

	/**
	 * Async version of `Result#err`.
	 */
	err(): AsyncOption<E> {
		return new AsyncOption(this.then((result) => result.err()));
	}

	/**
	 * Async version of `Result#and`.
	 */
	and<U, F>(other: AsyncResult<U, F>): AsyncResult<U, E | F> {
		return new AsyncResult(
			this.then((result) => other.then((otherResult) => result.and(otherResult))),
		);
	}

	/**
	 * Async version of `Result#andThen`.
	 */
	andThen<U, F>(f: (value: T) => Result<U, F>): AsyncResult<U, E | F> {
		return new AsyncResult(this.then((result) => result.andThen((value) => f(value))));
	}

	/**
	 * Async version of `Result#andThenAsync`.
	 */
	andThenAsync<U, F>(f: (value: T) => Promise<Result<U, F>>): AsyncResult<U, E | F> {
		return new AsyncResult(this.then((result) => result.andThenAsync((value) => f(value))));
	}

	/**
	 * Async version of `Result#expect`.
	 */
	async expect(message: string): Promise<T> {
		return (await this).expect(message);
	}

	/**
	 * Async version of `Result#expectErr`.
	 */
	async expectErr(message: string): Promise<E> {
		return (await this).expectErr(message);
	}

	/**
	 * Async version of `Result#flatten`.
	 */
	flatten<U, F>(this: AsyncResult<ResultImpl<U, F>, E>): AsyncResult<U, E | F> {
		return new AsyncResult(this.then((result) => result.flatten()));
	}

	/**
	 * Async version of `Result#inspect`.
	 */
	inspect(f: (value: T) => void): AsyncResult<T, E> {
		return new AsyncResult(this.then((result) => result.inspect(f)));
	}

	/**
	 * Async version of `Result#inspectAsync`.
	 */
	inspectAsync(f: (value: T) => Promise<void>): AsyncResult<T, E> {
		return new AsyncResult(this.then((result) => result.inspectAsync(f)));
	}

	/**
	 * Async version of `Result#inspectErr`.
	 */
	inspectErr(f: (error: E) => void): AsyncResult<T, E> {
		return new AsyncResult(this.then((result) => result.inspectErr(f)));
	}

	/**
	 * Async version of `Result#inspectErrAsync`.
	 */
	inspectErrAsync(f: (error: E) => Promise<void>): AsyncResult<T, E> {
		return new AsyncResult(this.then((result) => result.inspectErrAsync(f)));
	}

	/**
	 * Async version of `Result#map`.
	 */
	map<U>(f: (value: T) => U): AsyncResult<U, E> {
		return new AsyncResult(this.then((result) => result.map(f)));
	}

	/**
	 * Async version of `Result#mapAsync`.
	 */
	mapAsync<U>(f: (value: T) => Promise<U>): AsyncResult<U, E> {
		return new AsyncResult(this.then((result) => result.mapAsync(f)));
	}

	/**
	 * Async version of `Result#mapErr`.
	 */
	mapErr<F>(f: (error: E) => F): AsyncResult<T, F> {
		return new AsyncResult(this.then((result) => result.mapErr(f)));
	}

	/**
	 * Async version of `Result#mapErrAsync`.
	 */
	mapErrAsync<F>(f: (error: E) => Promise<F>): AsyncResult<T, F> {
		return new AsyncResult(this.then((result) => result.mapErrAsync(f)));
	}

	/**
	 * Async version of `Result#mapOr`.
	 */
	async mapOr<A, B>(defaultValue: A, f: (value: T) => B): Promise<A | B> {
		return (await this).mapOr(defaultValue, f);
	}

	/**
	 * Async version of `Result#mapOrElse`.
	 */
	async mapOrElse<A, B>(defaultValue: (error: E) => A, f: (value: T) => B): Promise<A | B> {
		return (await this).mapOrElse(defaultValue, f);
	}

	/**
	 * Async version of `Result#or`.
	 */
	or<U, F>(other: AsyncResult<U, F>): AsyncResult<T | U, F> {
		return new AsyncResult(
			this.then((thisResult) => other.then((otherResult) => thisResult.or(otherResult))),
		);
	}

	/**
	 * Async version of `Result#orElse`.
	 */
	orElse<U, F>(f: (error: E) => Result<U, F>): AsyncResult<T | U, F> {
		return new AsyncResult(this.then((thisResult) => thisResult.orElse((error) => f(error))));
	}

	/**
	 * Async version of `Result#orElseAsync`.
	 */
	orElseAsync<U, F>(f: (error: E) => Promise<Result<U, F>>): AsyncResult<T | U, F> {
		return new AsyncResult(
			this.then((thisResult) => thisResult.orElseAsync((error) => f(error))),
		);
	}

	/**
	 * Async version of `Result#unwrap`.
	 */
	async unwrap(): Promise<T | undefined> {
		return (await this).unwrap();
	}

	/**
	 * Async version of `Result#unwrapErr`.
	 */
	async unwrapErr(): Promise<E | undefined> {
		return (await this).unwrapErr();
	}

	/**
	 * Async version of `Result#unwrapOr`.
	 */
	async unwrapOr<U>(defaultValue: U): Promise<T | U> {
		return (await this).unwrapOr(defaultValue);
	}

	/**
	 * Async version of `Result#unwrapOrElse`.
	 */
	async unwrapOrElse<U>(defaultValue: (error: E) => U): Promise<T | U> {
		return (await this).unwrapOrElse(defaultValue);
	}
}
