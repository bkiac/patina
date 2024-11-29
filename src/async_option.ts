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
	 * Transforms the `AsyncOption<T>` into a `AsyncResult<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err)`.
	 *
	 * @param err - The error to return if the option is `None`.
	 * @returns The result of the transformation.
	 *
	 * @example
	 * ```
	 * let x = Some("foo")
	 * assertEquals(x.okOr(0), Ok("foo"))
	 *
	 * let x = None
	 * assertEquals(x.okOr(0), Err(0))
	 * ```
	 */
	public okOr<E>(err: E): AsyncResult<T, E> {
		return new AsyncResult(this.then((option) => option.okOr(err)));
	}

	/**
	 * Transforms the `AsyncOption<T>` into a `AsyncResult<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err())`.
	 *
	 * @param err - The function to compute the error to return if the option is `None`.
	 * @returns The result of the transformation.
	 *
	 * @example
	 * ```
	 * let x = Some("foo")
	 * assertEquals(x.okOrElse(() => 0), Ok("foo"))
	 *
	 * let x = None
	 * assertEquals(x.okOrElse(() => 0), Err(0))
	 * ```
	 */
	public okOrElse<E>(err: () => E): AsyncResult<T, E> {
		return new AsyncResult(this.then((option) => option.okOrElse(err)));
	}

	/**
	 * Transforms the `AsyncOption<T>` into a `AsyncResult<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err())`.
	 *
	 * @param err - The async function to compute the error to return if the option is `None`.
	 * @returns The result of the transformation.
	 *
	 * @example
	 * ```
	 * let x = Some("foo")
	 * assertEquals(await x.okOrElseAsync(async () => 0), Ok("foo"))
	 *
	 * let x = None
	 * assertEquals(await x.okOrElseAsync(async () => 0), Err(0))
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
	 * Calls a function with the contained value if `Some`.
	 *
	 * Returns the original option.
	 *
	 * @param f - The function to call with the contained value.
	 * @returns The original option.
	 *
	 * @example
	 * ```
	 * const list = [1, 2, 3]
	 *
	 * function findItem(index: number): AsyncOption<number> {
	 *     return index < list.length ? AsyncSome(list[index]) : AsyncNone
	 * }
	 *
	 * // prints "got: 2"
	 * const x = await findItem(1)
	 *     .inspect((x) => console.log(`got: ${x}`))
	 *     .expect("list should be long enough")
	 *
	 * // prints nothing
	 * await findItem(5).inspect((x) => console.log(`got: ${x}`))
	 * ```
	 */
	public inspect(f: (value: T) => void): AsyncOption<T> {
		return new AsyncOption(this.then((option) => option.inspect(f)));
	}

	/**
	 * Calls an async function with the contained value if `Some`.
	 *
	 * Returns the original option.
	 *
	 * @param f - The async function to call with the contained value.
	 * @returns The original option.
	 *
	 * @example
	 * ```
	 * const list = [1, 2, 3]
	 *
	 * function findItem(index: number): AsyncOption<number> {
	 *     return index < list.length ? AsyncSome(list[index]) : AsyncNone
	 * }
	 *
	 * // prints "got: 2"
	 * const x = await findItem(1)
	 *     .inspectAsync(async (x) => console.log(`got: ${x}`))
	 *     .expect("list should be long enough")
	 *
	 * // prints nothing
	 * await findItem(5).inspectAsync(async (x) => console.log(`got: ${x}`))
	 * ```
	 */
	public inspectAsync(f: (value: T) => Promise<void>): AsyncOption<T> {
		return new AsyncOption(this.then((option) => option.inspectAsync(f)));
	}

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
	 * Returns `None` if the option resolves to `None`, otherwise calls `predicate` with the wrapped value and returns:
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
	 * Converts from `AsyncOption<Option<T>>` to `AsyncOption<T>`.
	 *
	 * @returns A flattened `AsyncOption<T>`.
	 *
	 * @example
	 * ```
	 * // Basic usage:
	 * let x: AsyncOption<Option<number>> = AsyncSome(Some(6))
	 * assertEquals(await x.flatten(), Some(6))
	 *
	 * let x: AsyncOption<Option<number>> = AsyncSome(None)
	 * assertEquals(await x.flatten(), None)
	 *
	 * let x: AsyncOption<Option<number>> = AsyncNone
	 * assertEquals(await x.flatten(), None)
	 * ```
	 */
	public flatten<U>(this: AsyncOption<Option<U>>): AsyncOption<U> {
		return new AsyncOption(this.then((option) => option.flatten()));
	}

	/**
	 * Maps an `AsyncOption<T>` to `AsyncOption<U>` by applying a function to a contained value.
	 *
	 * @param f - The function to apply to the contained value.
	 * @returns The result of the function application.
	 *
	 * @example
	 * ```
	 * let maybeSomeString = AsyncSome("Hello, World!")
	 * let maybeSomeLen = await maybeSomeString.map((s) => s.length)
	 * assertEquals(maybeSomeLen, Some(13))
	 *
	 * let x = AsyncNone
	 * assertEquals(await x.map((s) => s.length), None)
	 * ```
	 */
	public map<U>(f: (value: T) => U): AsyncOption<U> {
		return new AsyncOption(this.then((option) => option.map(f)));
	}

	/**
	 * Maps an `AsyncOption<T>` to `AsyncOption<U>` by applying an async function to a contained value.
	 *
	 * @param f - The async function to apply to the contained value.
	 * @returns The result of the async function application.
	 *
	 * @example
	 * ```
	 * let maybeSomeString = AsyncSome("Hello, World!")
	 * let maybeSomeLen = await maybeSomeString.mapAsync(async (s) => s.length)
	 * assertEquals(maybeSomeLen, Some(13))
	 *
	 * let x = AsyncNone
	 * assertEquals(await x.mapAsync(async (s) => s.length), None)
	 * ```
	 */
	public mapAsync<U>(f: (value: T) => Promise<U>): AsyncOption<U> {
		return new AsyncOption(this.then((option) => option.mapAsync(f)));
	}

	/**
	 * Returns the provided default result (if none), or applies a function to the contained value (if any).
	 *
	 * @param defaultValue - The default value to return if the option is `None`.
	 * @param f - The function to apply to the contained value.
	 * @returns The result of the function application, if the option is `Some`, otherwise the provided default value.
	 *
	 * @example
	 * ```
	 * let x = AsyncSome("foo")
	 * assertEquals(await x.mapOr(42, v => v.length), 3)
	 *
	 * let x = None
	 * assertEquals(x.mapOr(42, v => v.length), 42)
	 * ```
	 */
	public async mapOr<A, B>(defaultValue: A, f: (value: T) => B): Promise<A | B> {
		return (await this).mapOr(defaultValue, f);
	}

	/**
	 * Returns the provided default result (if none), or applies an async function to the contained value (if any).
	 *
	 * @param defaultValue - The default value to return if the option is `None`.
	 * @param f - The async function to apply to the contained value.
	 * @returns The result of the async function application, if the option is `Some`, otherwise the provided default value.
	 *
	 * @example
	 * ```
	 * let x = AsyncSome("foo")
	 * assertEquals(await x.mapOrAsync(42, async (v) => v.length), 3)
	 *
	 * let x = AsyncNone
	 * assertEquals(await x.mapOrAsync(42, async (v) => v.length), 42)
	 * ```
	 */
	public async mapOrAsync<A, B>(defaultValue: A, f: (value: T) => Promise<B>): Promise<A | B> {
		return (await this).mapOrAsync(defaultValue, f);
	}

	/**
	 * Returns the provided default result (if none), or computes a default value by applying a function to the contained value (if any).
	 *
	 * @param defaultValue - The function to compute the default value.
	 * @param f - The function to apply to the contained value.
	 * @returns The result of the function application, if the option is `Some`, otherwise the computed default value.
	 *
	 * @example
	 * ```
	 * const k = 21
	 *
	 * let x = Some("foo")
	 * assertEquals(x.mapOrElse(() => 2 * k, (v) => v.length), 3)
	 *
	 * let x = None
	 * assertEquals(x.mapOrElse(() => 2 * k, (v) => v.length), 42)
	 *
	 * // Handling a Result-based fallback
	 * // This example parses a command line argument (if present), or reads from a file
	 * function parseConfig(): Result<number, Error> {
	 *     return Option.fromNullish(args[2])
	 *         .mapOrElse(
	 *             () => {
	 *                 return Result.fromThrowable(() => {
	 *                     return readFileSync("/etc/someconfig.conf", "utf8");
	 *                 });
	 *             },
	 *             Ok,
	 *         )
	 *         .andThen((str) =>
	 *             Result.fromThrowable(() => {
	 *                 return parseInt(str);
	 *             })
	 *         );
	 * }
	 * ```
	 */
	public async mapOrElse<A, B>(defaultValue: () => A, f: (value: T) => B): Promise<A | B> {
		return (await this).mapOrElse(defaultValue, f);
	}

	/**
	 * Returns the provided default result (if none), or computes a default value by applying an async function to the contained value (if any).
	 *
	 * @param defaultValue - The async function to compute the default value.
	 * @param f - The async function to apply to the contained value.
	 * @returns The result of the async function application, if the option is `Some`, otherwise the computed default value.
	 *
	 * @example
	 * ```
	 * const k = 21
	 *
	 * let x = AsyncSome("foo")
	 * assertEquals(await x.mapOrElseAsync(async () => 2 * k, async (v) => v.length), 3)
	 *
	 * let x = AsyncNone
	 * assertEquals(await x.mapOrElseAsync(async () => 2 * k, async (v) => v.length), 42)
	 * ```
	 */
	public async mapOrElseAsync<A, B>(
		defaultValue: () => Promise<A>,
		f: (value: T) => Promise<B>,
	): Promise<A | B> {
		return (await this).mapOrElseAsync(defaultValue, f);
	}

	/**
	 * Returns the option if it resolves to a value, otherwise returns `other`.
	 *
	 * @param other - The option to return if this option is `None`.
	 * @returns This option if it resolves to a value, otherwise the provided option.
	 *
	 * @example
	 * ```
	 * let x = AsyncSome(2)
	 * let y = AsyncNone
	 * assertEquals(await x.or(y), Some(2))
	 *
	 * let x = AsyncNone
	 * let y = AsyncSome(100)
	 * assertEquals(await x.or(y), Some(100))
	 *
	 * let x = AsyncSome(2)
	 * let y = AsyncSome(100)
	 * assertEquals(await x.or(y), Some(2))
	 *
	 * let x = AsyncNone
	 * let y = AsyncNone
	 * assertEquals(await x.or(y), None)
	 * ```
	 */
	public or<U>(other: AsyncOption<U>): AsyncOption<T | U> {
		return new AsyncOption(
			this.then((thisOption) => other.then((otherOption) => thisOption.or(otherOption))),
		);
	}

	/**
	 * Returns the option if it resolves to a value, otherwise calls `f` and returns the result.
	 *
	 * @param f - The function to call if the option is `None`.
	 * @returns This option if it resolves to a value, otherwise the result of calling `f`.
	 *
	 * @example
	 * ```
	 * function nobody(): Option<string> { return None }
	 * function vikings(): Option<string> { return Some("vikings") }
	 *
	 * assertEquals(await AsyncSome("barbarians").orElse(vikings), Some("barbarians"))
	 * assertEquals(await AsyncNone.orElse(vikings), Some("vikings"))
	 * assertEquals(await AsyncNone.orElse(nobody), None)
	 * ```
	 */
	public orElse<U>(f: () => Option<U>): AsyncOption<T | U> {
		return new AsyncOption(this.then((thisOption) => thisOption.orElse(() => f())));
	}

	/**
	 * Returns the option if it resolves to a value, otherwise calls `f` and returns the result.
	 *
	 * @param f - The function to call if the option is `None`.
	 * @returns This option if it resolves to a value, otherwise the result of calling `f`.
	 *
	 * @example
	 * ```
	 * async function nobody(): Promise<Option<string>> { return None }
	 * async function vikings(): Promise<Option<string>> { return Some("vikings") }
	 *
	 * assertEquals(await AsyncSome("barbarians").orElseAsync(vikings), Some("barbarians"))
	 * assertEquals(await AsyncNone.orElseAsync(vikings), Some("vikings"))
	 * assertEquals(await AsyncNone.orElseAsync(nobody), None)
	 * ```
	 */
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

	/**
	 * Returns `Some` if exactly one of `this`, `other` is `Some`, otherwise returns `None`.
	 *
	 * @param other - The option to compare with.
	 * @returns `Some` if exactly one of the options is `Some`, otherwise `None`.
	 *
	 * @example
	 * ```
	 * let x = AsyncSome(2)
	 * let y = AsyncNone
	 * assertEquals(await x.xor(y), Some(2))
	 *
	 * let x = AsyncNone
	 * let y = AsyncSome(2)
	 * assertEquals(await x.xor(y), Some(2))
	 *
	 * let x = AsyncSome(2)
	 * let y = AsyncSome(2)
	 * assertEquals(await x.xor(y), None)
	 *
	 * let x = AsyncNone
	 * let y = AsyncNone
	 * assertEquals(await x.xor(y), None)
	 * ```
	 */
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
