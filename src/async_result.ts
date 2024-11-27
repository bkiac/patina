import { AsyncOption } from "./async_option.ts";
import {
	Err,
	Ok,
	type Result,
	type ResultImpl,
	type ResultMatch,
	type ResultMatchAsync,
} from "./result.ts";

/**
 * A promise that resolves to a `Result`.
 *
 * This class is useful for chaining multiple asynchronous operations that return a `Result`.
 */
export class AsyncResult<T, E> implements PromiseLike<Result<T, E>> {
	public readonly promise: Promise<Result<T, E>> | PromiseLike<Result<T, E>> | AsyncResult<T, E>;

	public constructor(
		promise: Promise<Result<T, E>> | PromiseLike<Result<T, E>> | AsyncResult<T, E>,
	) {
		this.promise = promise;
	}

	public get [Symbol.toStringTag](): "AsyncResult" {
		return "AsyncResult";
	}

	public toJSON(): {
		AsyncResult: Promise<Result<T, E>> | PromiseLike<Result<T, E>> | AsyncResult<T, E>;
	} {
		return { AsyncResult: this.promise };
	}

	public toString(): string {
		return `AsyncResult(${this.promise.toString()})`;
	}

	public [Symbol.for("nodejs.util.inspect.custom")](): string {
		return this.toString();
	}

	/**
	 * Returns a generator that yields the contained value (if `Ok`) or an error (if `Err`).
	 */
	public async *[Symbol.asyncIterator](): AsyncGenerator<Err<E, never>, T> {
		return yield* await this.promise.then((res) => res[Symbol.iterator]());
	}

	public then<A, B>(
		successCallback?: (res: Result<T, E>) => A | PromiseLike<A>,
		failureCallback?: (reason: unknown) => B | PromiseLike<B>,
	): PromiseLike<A | B> {
		return this.promise.then(successCallback, failureCallback);
	}

	public catch<B>(rejectionCallback?: (reason: unknown) => B | PromiseLike<B>): PromiseLike<B> {
		return this.promise.then(undefined, rejectionCallback);
	}

	public finally(callback: () => void): PromiseLike<Result<T, E>> {
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

	public async match<A, B>(matcher: ResultMatch<T, E, A, B>): Promise<A | B> {
		return (await this).match(matcher);
	}

	async matchAsync<A, B>(matcher: ResultMatchAsync<T, E, A, B>): Promise<A | B> {
		return (await this).matchAsync(matcher);
	}

	public ok(): AsyncOption<T> {
		return new AsyncOption(this.then((result) => result.ok()));
	}

	public err(): AsyncOption<E> {
		return new AsyncOption(this.then((result) => result.err()));
	}

	public and<U, F>(other: AsyncResult<U, F>): AsyncResult<U, E | F> {
		return new AsyncResult(
			this.then((result) => other.then((otherResult) => result.and(otherResult))),
		);
	}

	public andThen<U, F>(f: (value: T) => Result<U, F>): AsyncResult<U, E | F> {
		return new AsyncResult(this.then((result) => result.andThen((value) => f(value))));
	}

	public andThenAsync<U, F>(f: (value: T) => Promise<Result<U, F>>): AsyncResult<U, E | F> {
		return new AsyncResult(this.then((result) => result.andThenAsync((value) => f(value))));
	}

	public async expect(message: string): Promise<T> {
		return (await this).expect(message);
	}

	public async expectErr(message: string): Promise<E> {
		return (await this).expectErr(message);
	}

	public flatten<U, F>(this: AsyncResult<ResultImpl<U, F>, E>): AsyncResult<U, E | F> {
		return new AsyncResult(this.then((result) => result.flatten()));
	}

	public inspect(f: (value: T) => void): AsyncResult<T, E> {
		return new AsyncResult(this.then((result) => result.inspect(f)));
	}

	public inspectAsync(f: (value: T) => Promise<void>): AsyncResult<T, E> {
		return new AsyncResult(this.then((result) => result.inspectAsync(f)));
	}

	public inspectErr(f: (error: E) => void): AsyncResult<T, E> {
		return new AsyncResult(this.then((result) => result.inspectErr(f)));
	}

	public inspectErrAsync(f: (error: E) => Promise<void>): AsyncResult<T, E> {
		return new AsyncResult(this.then((result) => result.inspectErrAsync(f)));
	}

	public map<U>(f: (value: T) => U): AsyncResult<U, E> {
		return new AsyncResult(this.then((result) => result.map(f)));
	}

	public mapAsync<U>(f: (value: T) => Promise<U>): AsyncResult<U, E> {
		return new AsyncResult(this.then((result) => result.mapAsync(f)));
	}

	public mapErr<F>(f: (error: E) => F): AsyncResult<T, F> {
		return new AsyncResult(this.then((result) => result.mapErr(f)));
	}

	public mapErrAsync<F>(f: (error: E) => Promise<F>): AsyncResult<T, F> {
		return new AsyncResult(this.then((result) => result.mapErrAsync(f)));
	}

	public async mapOr<A, B>(defaultValue: A, f: (value: T) => B): Promise<A | B> {
		return (await this).mapOr(defaultValue, f);
	}

	public async mapOrElse<A, B>(
		defaultValue: (error: E) => A,
		f: (value: T) => B,
	): Promise<A | B> {
		return (await this).mapOrElse(defaultValue, f);
	}

	public or<U, F>(other: AsyncResult<U, F>): AsyncResult<T | U, F> {
		return new AsyncResult(
			this.then((thisResult) => other.then((otherResult) => thisResult.or(otherResult))),
		);
	}

	public orElse<U, F>(f: (error: E) => Result<U, F>): AsyncResult<T | U, F> {
		return new AsyncResult(this.then((thisResult) => thisResult.orElse((error) => f(error))));
	}

	public orElseAsync<U, F>(f: (error: E) => Promise<Result<U, F>>): AsyncResult<T | U, F> {
		return new AsyncResult(
			this.then((thisResult) => thisResult.orElseAsync((error) => f(error))),
		);
	}

	public async unwrap(): Promise<T | undefined> {
		return (await this).unwrap();
	}

	public async unwrapErr(): Promise<E | undefined> {
		return (await this).unwrapErr();
	}

	public async unwrapOr<U>(defaultValue: U): Promise<T | U> {
		return (await this).unwrapOr(defaultValue);
	}

	public async unwrapOrElse<U>(defaultValue: (error: E) => U): Promise<T | U> {
		return (await this).unwrapOrElse(defaultValue);
	}

	// Deprecated

	/**
	 * @deprecated You can yield the `Result` directly: `yield* Ok(1)` instead of `yield* Ok(1).try()`.
	 */
	public async *try(): AsyncGenerator<Err<E, never>, T> {
		return yield* this[Symbol.asyncIterator]();
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
}

export function AsyncOk<T>(value: T): AsyncResult<T, never> {
	return new AsyncResult(Promise.resolve(Ok(value)));
}

export function AsyncErr<E>(error: E): AsyncResult<never, E> {
	return new AsyncResult(Promise.resolve(Err(error)));
}
