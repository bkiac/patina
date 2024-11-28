/**
 * This module contains the `AsyncOption` class, which is a promise that resolves to an `Option`.
 * @module
 */

import { AsyncResult } from "./async_result.ts";
import { None, type Option, type OptionMatch, type OptionMatchAsync, Some } from "./option.ts";

/**
 * A promise that resolves to an `Option`.
 *
 * This class is useful for chaining multiple asynchronous operations that return an `Option`.
 */
export class AsyncOption<T> implements PromiseLike<Option<T>> {
	/**
	 * The promise that resolves to an `Option`.
	 */
	public readonly promise: Promise<Option<T>> | PromiseLike<Option<T>> | AsyncOption<T>;

	/**
	 * Creates a new `AsyncOption`.
	 * @param promise - The promise that resolves to an `Option`.
	 */
	public constructor(promise: Promise<Option<T>> | PromiseLike<Option<T>> | AsyncOption<T>) {
		this.promise = promise;
	}

	public get [Symbol.toStringTag](): "AsyncOption" {
		return "AsyncOption";
	}

	/**
	 * Converts the `AsyncOption` to a JSON object.
	 */
	public toJSON(): { AsyncOption: Promise<Option<T>> | PromiseLike<Option<T>> | AsyncOption<T> } {
		return { AsyncOption: this.promise };
	}

	/**
	 * Converts the `AsyncOption` to a string.
	 */
	public toString(): string {
		return `AsyncOption(${this.promise.toString()})`;
	}

	public [Symbol.for("nodejs.util.inspect.custom")](): string {
		return this.toString();
	}

	public then<A, B>(
		successCallback?: (res: Option<T>) => A | PromiseLike<A>,
		failureCallback?: (reason: unknown) => B | PromiseLike<B>,
	): PromiseLike<A | B> {
		return this.promise.then(successCallback, failureCallback);
	}

	public catch<B>(rejectionCallback?: (reason: unknown) => B | PromiseLike<B>): PromiseLike<B> {
		return this.promise.then(undefined, rejectionCallback);
	}

	public finally(callback: () => void): PromiseLike<Option<T>> {
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
	 * Matches the `AsyncOption` to its content.
	 *
	 * @param matcher - The matcher to match the `AsyncOption` against.
	 * @returns The result of the match.
	 *
	 * @example
	 * ```
	 * const x = await AsyncSome(0).match({
	 * 	Some: (value) => value + 1,
	 * 	None: () => 0
	 * })
	 * assertEquals(x, 1)
	 *
	 * const y = await AsyncNone.match({
	 * 	Some: (value) => value + 1,
	 * 	None: () => 0
	 * })
	 * assertEquals(y, 0)
	 * ```
	 */
	public async match<A, B>(matcher: OptionMatch<T, A, B>): Promise<A | B> {
		return (await this).match(matcher);
	}

	/**
	 * Matches the `AsyncOption` to its content asynchronously.
	 *
	 * @param matcher - The matcher to match the `AsyncOption` against.
	 * @returns The result of the match.
	 *
	 * @example
	 * ```
	 * const x = await AsyncSome(0).matchAsync({
	 * 	Some: async (value) => value + 1,
	 * 	None: async () => 0
	 * })
	 * assertEquals(x, 1)
	 *
	 * const y = await AsyncNone.matchAsync({
	 * 	Some: async (value) => value + 1,
	 * 	None: async () => 0
	 * })
	 * assertEquals(y, 0)
	 * ```
	 */
	public async matchAsync<A, B>(matcher: OptionMatchAsync<T, A, B>): Promise<A | B> {
		return (await this).matchAsync(matcher);
	}

	/**
	 * Converts the `AsyncOption` to an `AsyncResult` with an error value.
	 *
	 * @param err - The error value.
	 * @returns The `AsyncResult`.
	 *
	 * @example
	 * ```
	 * const x = await AsyncSome(0).okOr("error")
	 * assertEquals(x, Ok(0))
	 *
	 * const y = await AsyncNone.okOr("error")
	 * assertEquals(y, Err("error"))
	 * ```
	 */
	public okOr<E>(err: E): AsyncResult<T, E> {
		return new AsyncResult(this.then((option) => option.okOr(err)));
	}

	/**
	 * Converts the `AsyncOption` to an `AsyncResult` with an error value.
	 *
	 * @param err - The function to compute the error value.
	 * @returns The `AsyncResult`.
	 *
	 * @example
	 * ```
	 * const x = await AsyncSome(0).okOrElse(() => "error")
	 * assertEquals(x, Ok(0))
	 *
	 * const y = await AsyncNone.okOrElse(() => "error")
	 * assertEquals(y, Err("error"))
	 * ```
	 */
	public okOrElse<E>(err: () => E): AsyncResult<T, E> {
		return new AsyncResult(this.then((option) => option.okOrElse(err)));
	}

	/**
	 * Converts the `AsyncOption` to an `AsyncResult` with an error value.
	 *
	 * @param err - The function to compute the error value.
	 * @returns The `AsyncResult`.
	 *
	 * @example
	 * ```
	 * const x = await AsyncSome(0).okOrElseAsync(() => Promise.resolve("error"))
	 * assertEquals(x, Ok(0))
	 *
	 * const y = await AsyncNone.okOrElseAsync(() => Promise.resolve("error"))
	 * assertEquals(y, Err("error"))
	 * ```
	 */
	public okOrElseAsync<E>(err: () => Promise<E>): AsyncResult<T, E> {
		return new AsyncResult(this.then((option) => option.okOrElseAsync(err)));
	}

	/**
	 * Returns `None` if the option is `None`, otherwise returns `other`.
	 * 
	 * @param other - The async option to return if this option is `Some`.
	 * @returns The other option if this option is `Some`, otherwise `None`.
	 * 
	 * @example
	 * ```
	 * let x = AsyncSome(2)
	 * let y = AsyncNone
	 * assertEquals(await x.and(y), None)
	 * 
	 * let x = AsyncNone
	 * let y = AsyncSome("foo")
	 * assertEquals(await x.and(y), None)
	 * 
	 * let x = AsyncSome(2)
	 * let y = AsyncSome("foo") 
	 * assertEquals(await x.and(y), Some("foo"))
	 * 
	 * let x = AsyncNone
	 * let y = AsyncNone
	 * assertEquals(await x.and(y), None)
	 * ```
	 */
	public and<U>(other: AsyncOption<U>): AsyncOption<U> {
		return new AsyncOption(
			this.then((option) => other.then((otherOption) => option.and(otherOption))),
		);
	}

	/**
	 * Returns `None` if the option resolves `None`, otherwise calls `f` with the wrapped value and returns the result.
	 * 
	 * Often used to chain fallible operations that may return `None`.
	 *
	 * @param f - The function to apply to the contained value.
	 * @returns The result of the function application, if the option resolves to `Some`, otherwise `None`.
	 *
	 * @example
	 * ```
	 * function divideThenToString(x: number): Option<string> {
	 *     // Division by zero returns None
	 *     return x === 0 ? None : Some((100 / x).toString())
	 * }
	 * 
	 * assertEquals(await AsyncSome(2).andThen(divideThenToString), Some("50"))
	 * assertEquals(await AsyncSome(0).andThen(divideThenToString), None) // division by zero!
	 * assertEquals(await AsyncNone.andThen(divideThenToString), None)
	 * ```
	 */
	public andThen<U>(f: (value: T) => Option<U>): AsyncOption<U> {
		return new AsyncOption(this.then((option) => option.andThen((value) => f(value))));
	}

	/**
	 * Returns `None` if the option resolves `None`, otherwise calls `f` with the wrapped value and returns the result.
	 * 
	 * Often used to chain fallible operations that may return `None`.
	 *
	 * @param f - The function to apply to the contained value.
	 * @returns The result of the function application, if the option resolves to `Some`, otherwise `None`.
	 *
	 * @example
	 * ```
	 * async function divideThenToString(x: number): Promise<Option<string>> {
	 *     // Division by zero returns None
	 *     return x === 0 ? None : Some((100 / x).toString())
	 * }
	 * 
	 * assertEquals(await AsyncSome(2).andThenAsync(divideThenToString), Some("50"))
	 * assertEquals(await AsyncSome(0).andThenAsync(divideThenToString), None) // division by zero!
	 * assertEquals(await AsyncNone.andThenAsync(divideThenToString), None)
	 * ```
	 */
	public andThenAsync<U>(f: (value: T) => Promise<Option<U>> | AsyncOption<U>): AsyncOption<U> {
		return new AsyncOption(this.then((option) => option.andThenAsync(f)));
	}

	/**
	 * Calls a function with the value of a `Some` value, or does nothing if the `AsyncOption` is `None`.
	 *
	 * @param f - The function to call with the value of a `Some` value.
	 * @returns The `AsyncOption`.
	 *
	 * @example
	 * ```
	 * const x = await AsyncSome(0).inspect((x) => console.log(x))
	 * const y = await AsyncNone.inspect((x) => console.log(x)) // does nothing
	 * ```
	 */
	public inspect(f: (value: T) => void): AsyncOption<T> {
		return new AsyncOption(this.then((option) => option.inspect(f)));
	}

	/**
	 * Returns the value of a `Some` value, or throws an error if the `AsyncOption` is `None`.
	 *
	 * @param message - The error message.
	 * @throws `Panic` with `message` if the `AsyncOption` is `None`.
	 * @returns The value of a `Some` value.
	 *
	 * @example
	 * ```
	 * const x = await AsyncSome(0).expect("error")
	 * assertEquals(x, 0)
	 *
	 * assertThrows(async () => await AsyncNone.expect("error"), "error")
	 * ```
	 */
	public async expect(message: string): Promise<T> {
		return (await this).expect(message);
	}

	/**
	 * Returns `None` if the option resolves `None`, otherwise calls `predicate` with the wrapped value and returns:
	 * - `Some(t)` if predicate returns `true` (where t is the wrapped value), and
	 * - `None` if predicate returns `false`.
	 * 
	 * This function works similar to `Array.prototype.filter()`. You can imagine the `AsyncOption<T>` being 
	 * an array over one or zero elements. `filter()` lets you decide which elements to keep.
	 *
	 * @param predicate - The predicate to apply to the contained value.
	 * @returns The option if predicate returns `true`, otherwise `None`.
	 *
	 * @example
	 * ```
	 * function isEven(n: number): boolean {
	 *     return n % 2 === 0
	 * }
	 * 
	 * assertEquals(await AsyncNone.filter(isEven), None)
	 * assertEquals(await AsyncSome(3).filter(isEven), None)
	 * assertEquals(await AsyncSome(4).filter(isEven), Some(4))
	 * ```
	 */
	public filter(f: (value: T) => boolean): AsyncOption<T> {
		return new AsyncOption(this.then((option) => option.filter(f)));
	}

	/**
	 * Returns `None` if the option is `None`, otherwise calls `predicate` with the wrapped value and returns:
	 * - `Some(t)` if predicate returns `true` (where t is the wrapped value), and
	 * - `None` if predicate returns `false`.
	 * 
	 * This function works similar to `Array.prototype.filter()`. You can imagine the `Option<T>` being 
	 * an array over one or zero elements. `filter()` lets you decide which elements to keep.
	 *
	 * @param predicate - The predicate to apply to the contained value.
	 * @returns The option if predicate returns `true`, otherwise `None`.
	 *
	 * @example
	 * ```
	 * async function isEven(n: number): Promise<boolean> {
	 *     return n % 2 === 0
	 * }
	 * 
	 * assertEquals(await AsyncNone.filterAsync(isEven), None)
	 * assertEquals(await AsyncSome(3).filterAsync(isEven), None)
	 * assertEquals(await AsyncSome(4).filterAsync(isEven), Some(4))
	 * ```
	 */
	public filterAsync(f: (value: T) => Promise<boolean>): AsyncOption<T> {
		return new AsyncOption(this.then((option) => option.filterAsync(f)));
	}

	/**
	 * Converts from `AsyncOption<Option<U>>` to `AsyncOption<U>`.
	 *
	 * @returns The `AsyncOption`.
	 *
	 * @example
	 * ```
	 * const x = await AsyncSome(Some(0)).flatten()
	 * assertEquals(x, Some(0))
	 *
	 * const y = await AsyncSome(None).flatten()
	 * assertEquals(y, None)
	 * ```
	 */
	public flatten<U>(this: AsyncOption<Option<U>>): AsyncOption<U> {
		return new AsyncOption(this.then((option) => option.flatten()));
	}

	/**
	 * Maps the `AsyncOption` to a new `AsyncOption`.
	 *
	 * @param f - The function to map the `AsyncOption` to a new `AsyncOption`.
	 * @returns The `AsyncOption`.
	 *
	 * @example
	 * ```
	 * const x = await AsyncSome(0).map((x) => x + 1)
	 * assertEquals(x, Some(1))
	 *
	 * const y = await AsyncNone.map((x) => x + 1)
	 * assertEquals(y, None)
	 * ```
	 */
	public map<U>(f: (value: T) => U): AsyncOption<U> {
		return new AsyncOption(this.then((option) => option.map(f)));
	}

	/**
	 * Maps the `AsyncOption` to a new `AsyncOption`.
	 *
	 * @param f - The function to map the `AsyncOption` to a new `AsyncOption`.
	 * @returns The `AsyncOption`.
	 *
	 * @example
	 * ```
	 * const x = await AsyncSome(0).mapAsync(async (x) => x + 1)
	 * assertEquals(x, Some(1))
	 *
	 * const y = await AsyncNone.mapAsync(async (x) => x + 1)
	 * assertEquals(y, None)
	 * ```
	 */
	public mapAsync<U>(f: (value: T) => Promise<U>): AsyncOption<U> {
		return new AsyncOption(this.then((option) => option.mapAsync(f)));
	}

	/**
	 * Maps the `AsyncOption` to a value or a default value.
	 *
	 * @param defaultValue - The default value.
	 * @param f - The function to map the `AsyncOption` to a value.
	 * @returns The value or the default value.
	 *
	 * @example
	 * ```
	 * const x = await AsyncSome(0).mapOr(1, (x) => x + 1)
	 * assertEquals(x, 1)
	 *
	 * const y = await AsyncNone.mapOr(1, (x) => x + 1)
	 * assertEquals(y, 1)
	 * ```
	 */
	public async mapOr<A, B>(defaultValue: A, f: (value: T) => B): Promise<A | B> {
		return (await this).mapOr(defaultValue, f);
	}

	/**
	 * Returns the provided default value (if none), or computes a default value by applying a function to the contained value (if any).
	 *
	 * @param defaultValue - The default value to return if the option is `None`.
	 * @param f - The function to apply to the contained value.
	 * @returns The result of the function application, if the option is `Some`, otherwise the provided default value.
	 *
	 * @example
	 * ```
	 * const x = await Some(0).mapOrAsync("default", async (v) => v + 1)
	 * assertEquals(x, 1)
	 *
	 * const y = await None.mapOrAsync("default", async (v) => v + 1)
	 * assertEquals(y, "default")
	 * ```
	 */
	public async mapOrAsync<A, B>(defaultValue: A, f: (value: T) => Promise<B>): Promise<A | B> {
		return (await this).mapOrAsync(defaultValue, f);
	}

	/**
	 * Maps the `AsyncOption` to a value or a default value.
	 *
	 * @param defaultValue - The function to compute the default value.
	 * @param f - The function to map the `AsyncOption` to a value.
	 * @returns The value or the default value.
	 *
	 * @example
	 * ```
	 * const x = await AsyncSome(0).mapOrElse(() => 1, (x) => x + 1)
	 * assertEquals(x, 1)
	 *
	 * const y = await AsyncNone.mapOrElse(() => 1, (x) => x + 1)
	 * assertEquals(y, 1)
	 * ```	
	 */
	public async mapOrElse<A, B>(defaultValue: () => A, f: (value: T) => B): Promise<A | B> {
		return (await this).mapOrElse(defaultValue, f);
	}

	/**
	 * Maps the `AsyncOption` to a value or a default value.
	 *
	 * @param defaultValue - The function to compute the default value.
	 * @param f - The function to map the `AsyncOption` to a value.
	 * @returns The value or the default value.
	 *
	 * @example
	 * ```
	 * const x = await AsyncSome(0).mapOrElseAsync(async () => 1, async (x) => x + 1)
	 * assertEquals(x, 1)
	 *
	 * const y = await AsyncNone.mapOrElseAsync(async () => 1, async (x) => x + 1)
	 * assertEquals(y, 1)
	 * ```
	 */
	public async mapOrElseAsync<A, B>(
		defaultValue: () => Promise<A>,
		f: (value: T) => Promise<B>,
	): Promise<A | B> {
		return (await this).mapOrElseAsync(defaultValue, f);
	}

	public or<U>(other: AsyncOption<U>): AsyncOption<T | U> {
		return new AsyncOption(
			this.then((thisOption) => other.then((otherOption) => thisOption.or(otherOption))),
		);
	}

	public orElse<U>(f: () => Option<U>): AsyncOption<T | U> {
		return new AsyncOption(this.then((thisOption) => thisOption.orElse(() => f())));
	}

	public orElseAsync<U>(f: () => Promise<Option<U>> | AsyncOption<U>): AsyncOption<T | U> {
		return new AsyncOption(this.then((thisOption) => thisOption.orElseAsync(() => f())));
	}

	public async unwrap(): Promise<T | undefined> {
		return (await this).unwrap();
	}

	public async unwrapOr<U>(defaultValue: U): Promise<T | U> {
		return (await this).unwrapOr(defaultValue);
	}

	public async unwrapOrElse<U>(f: () => U): Promise<T | U> {
		return (await this).unwrapOrElse(f);
	}

	public async unwrapOrElseAsync<U>(f: () => Promise<U>): Promise<T | U> {
		return (await this).unwrapOrElseAsync(f);
	}

	public xor<U>(other: AsyncOption<U>): AsyncOption<T | U> {
		return new AsyncOption(
			this.then((thisOption) => other.then((otherOption) => thisOption.xor(otherOption))),
		);
	}

	// Deprecated

	/**
	 * @deprecated Use `unwrap()` instead.
	 */
	async value(): Promise<T | undefined> {
		return (await this).value();
	}
}

export function AsyncSome<T>(value: T): AsyncOption<T> {
	return new AsyncOption(Promise.resolve(Some(value)));
}

export const AsyncNone: AsyncOption<never> = new AsyncOption(Promise.resolve(None));
