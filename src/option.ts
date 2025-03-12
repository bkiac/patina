/**
 * This module contains the `Option` class, which represents an optional value.
 * @module
 */

import { AsyncOption } from "./async_option.ts";
import { AsyncResult } from "./async_result.ts";
import { Panic } from "./error.ts";
import { Err, Ok, type Result } from "./result.ts";

/**
 * The type of the matcher for `Option.match`.
 */
export type OptionMatch<T, A, B> = {
	/**
	 * The function to call if the option is a `Some` value.
	 */
	Some: (value: T) => A;
	/**
	 * The function to call if the option is a `None` value.
	 */
	None: () => B;
};

/**
 * The type of the matcher for `Option.matchAsync`.
 */
export type OptionMatchAsync<T, A, B> = {
	/**
	 * The function to call if the option is a `Some` value.
	 */
	Some: (value: T) => Promise<A>;
	/**
	 * The function to call if the option is a `None` value.
	 */
	None: () => Promise<B>;
};

const unwrapSymbol = Symbol("unwrap");

/**
 * @internal The internal implementation of `Option`.
 */
export class OptionImpl<T> {
	private readonly _some: boolean;
	private readonly _value: T | null;

	public constructor(some: boolean, value: T | null) {
		this._some = some;
		this._value = value;
	}

	public get [Symbol.toStringTag](): "Some" | "None" {
		return this._some ? "Some" : "None";
	}

	public toJSON(): T | null {
		return this._value;
	}

	public toString(): `Some(${string})` | "None" {
		return this._some ? `Some(${String(this._value)})` : "None";
	}

	public [Symbol.for("nodejs.util.inspect.custom")](): string {
		return this.toString();
	}

	/**
	 * Matches the option to its content.
	 *
	 * @param pattern - The pattern to match the option against.
	 * @returns The result of the match.
	 *
	 * @example
	 * ```
	 * const x = Some(0).match({
	 * 	Some: (value) => value + 1,
	 * 	None: () => 0
	 * })
	 * assertEquals(x, 1)
	 *
	 * const y = None.match({
	 * 	Some: (value) => value + 1,
	 * 	None: () => 0
	 * })
	 * assertEquals(y, 0)
	 * ```
	 */
	public match<A, B>(pattern: OptionMatch<T, A, B>): A | B {
		if (this._some) {
			return pattern.Some(this._value as T);
		}
		return pattern.None();
	}

	/**
	 * Matches the option to its content asynchronously.
	 *
	 * @param pattern - The pattern to match the option against.
	 * @returns The result of the match.
	 *
	 * @example
	 * ```
	 * const x = await Some(0).matchAsync({
	 * 	Some: async (value) => value + 1,
	 * 	None: async () => 0
	 * })
	 * assertEquals(x, 1)
	 *
	 * const y = await None.matchAsync({
	 * 	Some: async (value) => value + 1,
	 * 	None: async () => 0
	 * })
	 * assertEquals(y, 0)
	 * ```
	 */
	public matchAsync<A, B>(pattern: OptionMatchAsync<T, A, B>): Promise<A | B> {
		if (this._some) {
			return pattern.Some(this._value as T);
		}
		return pattern.None();
	}

	/**
	 * Returns `true` if the option is `Some`.
	 *
	 * @returns `true` if the option is `Some`, otherwise `false`.
	 *
	 * @example
	 * ```
	 * let x = Some(2)
	 * assertEquals(x.isSome(), true)
	 *
	 * let x = None
	 * assertEquals(x.isSome(), false)
	 * ```
	 */
	public isSome(): this is Some<T> {
		return this._some;
	}

	/**
	 * Returns `true` if the option is `Some` and the contained value is equal to `value`.
	 *
	 * @param predicate - The predicate to check the contained value against.
	 * @returns `true` if the option is `Some` and the contained value matches the predicate, otherwise `false`.
	 *
	 * @example
	 * ```
	 * let x = Some(2)
	 * assertEquals(x.isSomeAnd(x => x > 1), true)
	 *
	 * x = Some(0)
	 * assertEquals(x.isSomeAnd(x => x > 1), false)
	 *
	 * x = None
	 * assertEquals(x.isSomeAnd(x => x > 1), false)
	 * ```
	 */
	public isSomeAnd(predicate: (value: T) => boolean): this is Some<T> {
		return this._some && predicate(this._value as T);
	}

	/**
	 * Returns `true` if the option is `None`.
	 *
	 * @returns `true` if the option is `None`, otherwise `false`.
	 *
	 * @example
	 * ```
	 * let x = Some(2)
	 * assertEquals(x.isNone(), false)
	 *
	 * let x = None
	 * assertEquals(x.isNone(), true)
	 * ```
	 */
	public isNone(): this is None<T> {
		return !this._some;
	}

	/**
	 * Returns the contained `Some` value, if exists. Otherwise, throws a `Panic` with the provided message.
	 *
	 * @param message - The message to throw if the value is `None`.
	 * @throws {Panic} If the value is `None`, with a message containing the passed message and the content of the `None` as cause.
	 * @returns The contained value.
	 *
	 * It is recommended that `expect()` messages are used to describe the reason you expect the `Option` should be `Some`.
	 *
	 * ```ts
	 * const cfg = config.load().expect("config file should exist")
	 * ```
	 *
	 * @example
	 * ```
	 * const x = Some("value").expect("value should exist")
	 * assertEquals(x, "value")
	 *
	 * assertThrows(() => None.expect("value should exist"), "value should exist")
	 * ```
	 */
	public expect(message: string): T {
		if (this._some) {
			return this._value as T;
		}
		throw new Panic(message);
	}

	/**
	 * Returns the contained `Some` value, if exists.
	 *
	 * Otherwise, returns the provided default value.
	 *
	 * @param defaultValue - The default value to return if the option is `None`.
	 * @returns The contained value, if exists, otherwise the provided default value.
	 *
	 * @example
	 * ```
	 * assertEquals(Some("car").unwrapOr("bike"), "car")
	 * assertEquals(None.unwrapOr("bike"), "bike")
	 * ```
	 */
	public unwrapOr<U>(defaultValue: U): T | U {
		if (this._some) {
			return this._value as T;
		}
		return defaultValue;
	}

	/**
	 * Returns the contained `Some` value, if exists.
	 *
	 * Otherwise, computes the provided default value.
	 *
	 * @param defaultValue - The default value to return if the option is `None`.
	 * @returns The contained value, if exists, otherwise the provided default value.
	 *
	 * @example
	 * ```
	 * const x = Some(0).unwrapOrElse(() => 0)
	 * assertEquals(x, 0)
	 *
	 * const y = None.unwrapOrElse(() => 0)
	 * assertEquals(y, 0)
	 * ```
	 */
	public unwrapOrElse<U>(defaultValue: () => U): T | U {
		if (this._some) {
			return this._value as T;
		}
		return defaultValue();
	}

	/**
	 * Returns the contained `Some` value, if exists.
	 *
	 * Otherwise, computes the provided default value.
	 *
	 * @param defaultValue - The default value to return if the option is `None`.
	 * @returns The contained value, if exists, otherwise the provided default value.
	 *
	 * @example
	 * ```
	 * const x = await Some(0).unwrapOrElseAsync(async () => 0)
	 * assertEquals(x, 0)
	 *
	 * const y = await None.unwrapOrElseAsync(async () => 0)
	 * assertEquals(y, 0)
	 * ```
	 */
	public unwrapOrElseAsync<U>(defaultValue: () => Promise<U>): Promise<T | U> {
		if (this._some) {
			return Promise.resolve(this._value as T);
		}
		return defaultValue();
	}

	/**
	 * Maps an `Option<T>` to `Option<U>` by applying a function to a contained value.
	 *
	 * @param f - The function to apply to the contained value.
	 * @returns The result of the function application.
	 *
	 * @example
	 * ```
	 * let maybeSomeString = Some("Hello, World!")
	 * let maybeSomeLen = maybeSomeString.map((s) => s.length)
	 * assertEquals(maybeSomeLen, Some(13))
	 *
	 * let x = None
	 * assertEquals(x.map(s => s.length), None)
	 * ```
	 */
	public map<U>(f: (value: T) => U): Option<U> {
		if (this._some) {
			return Some(f(this._value as T));
		}
		return None;
	}

	/**
	 * Maps an `Option<T>` to `AsyncOption<U>` by applying an async function to a contained value.
	 *
	 * @param f - The async function to apply to the contained value.
	 * @returns The result of the async function application.
	 *
	 * @example
	 * ```
	 * let maybeSomeString = Some("Hello, World!")
	 * let maybeSomeLen = await maybeSomeString.mapAsync(async (s) => s.length)
	 * assertEquals(maybeSomeLen, Some(13))
	 *
	 * let x = None
	 * assertEquals(await x.mapAsync(async (s) => s.length), None)
	 * ```
	 */
	public mapAsync<U>(f: (value: T) => Promise<U>): AsyncOption<U> {
		if (this._some) {
			return new AsyncOption(f(this._value as T).then(Some));
		}
		return new AsyncOption(Promise.resolve(None));
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
	 * // prints "got: 2"
	 * const x = Option.fromNullish(list[1])
	 *     .inspect((x) => console.log(`got: ${x}`))
	 *     .expect("list should be long enough")
	 *
	 * // prints nothing
	 * Option.fromNullish(list[5]).inspect((x) => console.log(`got: ${x}`))
	 * ```
	 */
	public inspect(f: (value: T) => void): this {
		if (this._some) {
			f(this._value as T);
		}
		return this;
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
	 * // prints "got: 2"
	 * const x = await Option.fromNullish(list[1])
	 *     .inspectAsync(async (x) => console.log(`got: ${x}`))
	 *     .expect("list should be long enough")
	 *
	 * // prints nothing
	 * await Option.fromNullish(list[5]).inspectAsync(async (x) => console.log(`got: ${x}`))
	 * ```
	 */
	public inspectAsync(f: (value: T) => Promise<void>): AsyncOption<T> {
		if (this._some) {
			return new AsyncOption(f(this._value as T).then(() => this as unknown as Some<T>));
		}
		return new AsyncOption(Promise.resolve(this as unknown as Some<T>));
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
	 * let x = Some("foo")
	 * assertEquals(x.mapOr(42, (v) => v.length), 3)
	 *
	 * let x = None
	 * assertEquals(x.mapOr(42, (v) => v.length), 42)
	 * ```
	 */
	public mapOr<A, B>(defaultValue: A, f: (value: T) => B): A | B {
		if (this._some) {
			return f(this._value as T);
		}
		return defaultValue;
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
	 * let x = Some("foo")
	 * assertEquals(await x.mapOrAsync(42, async (v) => v.length), 3)
	 *
	 * let x = None
	 * assertEquals(await x.mapOrAsync(42, async (v) => v.length), 42)
	 * ```
	 */
	public mapOrAsync<A, B>(defaultValue: A, f: (value: T) => Promise<B>): Promise<A | B> {
		if (this._some) {
			return f(this._value as T);
		}
		return Promise.resolve(defaultValue);
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
	public mapOrElse<A, B>(defaultValue: () => A, f: (value: T) => B): A | B {
		if (this._some) {
			return f(this._value as T);
		}
		return defaultValue();
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
	 * let x = Some("foo")
	 * assertEquals(await x.mapOrElseAsync(async () => 2 * k, async (v) => v.length), 3)
	 *
	 * let x = None
	 * assertEquals(await x.mapOrElseAsync(async () => 2 * k, async (v) => v.length), 42)
	 * ```
	 */
	public mapOrElseAsync<A, B>(
		defaultValue: () => Promise<A>,
		f: (value: T) => Promise<B>,
	): Promise<A | B> {
		if (this._some) {
			return f(this._value as T);
		}
		return defaultValue();
	}

	/**
	 * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err)`.
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
	public okOr<E>(err: E): Result<T, E> {
		if (this._some) {
			return Ok(this._value as T);
		}
		return Err(err);
	}

	/**
	 * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err())`.
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
	public okOrElse<E>(f: () => E): Result<T, E> {
		if (this._some) {
			return Ok(this._value as T);
		}
		return Err(f());
	}

	/**
	 * Transforms the `Option<T>` into a `AsyncResult<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err())`.
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
	public okOrElseAsync<E>(f: () => Promise<E>): AsyncResult<T, E> {
		if (this._some) {
			return new AsyncResult(Promise.resolve(Ok(this._value as T)));
		}
		return new AsyncResult(f().then((err) => Err(err)));
	}

	/**
	 * Returns `None` if the option is `None`, otherwise returns `other`.
	 *
	 * @param other - The option to return if this option is `Some`.
	 * @returns The other option if this option is `Some`, otherwise `None`.
	 *
	 * @example
	 * ```
	 * let x = Some(2)
	 * let y = None
	 * assertEquals(x.and(y), None)
	 *
	 * let x = None
	 * let y = Some("foo")
	 * assertEquals(x.and(y), None)
	 *
	 * let x = Some(2)
	 * let y = Some("foo")
	 * assertEquals(x.and(y), Some("foo"))
	 *
	 * let x = None
	 * let y = None
	 * assertEquals(x.and(y), None)
	 * ```
	 */
	public and<U>(other: Option<U>): Option<U> {
		if (this._some) {
			return other;
		}
		return None;
	}

	/**
	 * Returns `None` if the option is `None`, otherwise calls `f` with the wrapped value and returns the result.
	 *
	 * Often used to chain fallible operations that may return `None`.
	 *
	 * @param f - The function to apply to the contained value.
	 * @returns The result of the function application, if the option is `Some`, otherwise `None`.
	 *
	 * @example
	 * ```
	 * function divideThenToString(x: number): Option<string> {
	 *     // Division by zero returns None
	 *     return x === 0 ? None : Some((100 / x).toString())
	 * }
	 *
	 * assertEquals(Some(2).andThen(divideThenToString), Some("50"))
	 * assertEquals(Some(0).andThen(divideThenToString), None) // division by zero!
	 * assertEquals(None.andThen(divideThenToString), None)
	 *
	 * // Chaining fallible operations
	 * const arr2d = [["A0", "A1"], ["B0", "B1"]]
	 *
	 * const item01 = Option.fromNullish(arr2d[0]).andThen((row) =>
	 *     Option.fromNullish(row[1])
	 * )
	 * assertEquals(item01, Some("A1"))
	 *
	 * const item20 = Option.fromNullish(arr2d[2]).andThen((row) =>
	 *     Option.fromNullish(row[0])
	 * )
	 * assertEquals(item20, None)
	 * ```
	 */
	public andThen<U>(f: (value: T) => Option<U>): Option<U> {
		if (this._some) {
			return f(this._value as T);
		}
		return None;
	}

	/**
	 * Returns `None` if the option is `None`, otherwise calls `f` with the wrapped value and returns the result.
	 *
	 * Often used to chain fallible operations that may return `None`.
	 *
	 * @param f - The function to apply to the contained value.
	 * @returns The result of the function application, if the option is `Some`, otherwise `None`.
	 *
	 * @example
	 * ```
	 * async function divideThenToString(x: number): Promise<Option<string>> {
	 *     // Division by zero returns None
	 *     return x === 0 ? None : Some((100 / x).toString())
	 * }
	 *
	 * assertEquals(await Some(2).andThenAsync(divideThenToString), Some("50"))
	 * assertEquals(await Some(0).andThenAsync(divideThenToString), None) // division by zero!
	 * assertEquals(await None.andThenAsync(divideThenToString), None)
	 *
	 * // Chaining fallible operations
	 * const arr2d = [["A0", "A1"], ["B0", "B1"]]
	 *
	 * const item01 = Option.fromNullish(arr2d[0]).andThenAsync(async (row) =>
	 *     Option.fromNullish(row[1])
	 * )
	 * assertEquals(item01, Some("A1"))
	 *
	 * const item20 = Option.fromNullish(arr2d[2]).andThenAsync(async (row) =>
	 *     Option.fromNullish(row[0])
	 * )
	 * assertEquals(item20, None)
	 * ```
	 */
	public andThenAsync<U>(f: (value: T) => Promise<Option<U>> | AsyncOption<U>): AsyncOption<U> {
		if (this._some) {
			return new AsyncOption(f(this._value as T));
		}
		return new AsyncOption(Promise.resolve(None));
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
	 * function isEven(n: number): boolean {
	 *     return n % 2 === 0
	 * }
	 *
	 * assertEquals(None.filter(isEven), None)
	 * assertEquals(Some(3).filter(isEven), None)
	 * assertEquals(Some(4).filter(isEven), Some(4))
	 * ```
	 */
	public filter(predicate: (value: T) => boolean): Option<T> {
		if (this._some && predicate(this._value as T)) {
			return this as unknown as Option<T>;
		}
		return None;
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
	 * assertEquals(await None.filterAsync(isEven), None)
	 * assertEquals(await Some(3).filterAsync(isEven), None)
	 * assertEquals(await Some(4).filterAsync(isEven), Some(4))
	 * ```
	 */
	public filterAsync(predicate: (value: T) => Promise<boolean>): AsyncOption<T> {
		if (this._some) {
			return new AsyncOption(
				predicate(this._value as T).then((result) =>
					result ? this as unknown as Option<T> : None
				),
			);
		}
		return new AsyncOption(Promise.resolve(None));
	}

	/**
	 * Returns the option if it contains a value, otherwise returns `other`.
	 *
	 * @param other - The option to return if this option is `None`.
	 * @returns This option if it is `Some`, otherwise the provided option.
	 *
	 * @example
	 * ```
	 * let x = Some(2)
	 * let y = None
	 * assertEquals(x.or(y), Some(2))
	 *
	 * let x = None
	 * let y = Some(100)
	 * assertEquals(x.or(y), Some(100))
	 *
	 * let x = Some(2)
	 * let y = Some(100)
	 * assertEquals(x.or(y), Some(2))
	 *
	 * let x = None
	 * let y = None
	 * assertEquals(x.or(y), None)
	 * ```
	 */
	public or<U>(other: Option<U>): Option<T | U> {
		if (this._some) {
			return this as unknown as Option<T | U>;
		}
		return other;
	}

	/**
	 * Returns the option if it contains a value, otherwise calls `f` and returns the result.
	 *
	 * @param f - The function to call if the option is `None`.
	 * @returns This option if it is `Some`, otherwise the result of calling `f`.
	 *
	 * @example
	 * ```
	 * function nobody(): Option<string> { return None }
	 * function vikings(): Option<string> { return Some("vikings") }
	 *
	 * assertEquals(Some("barbarians").orElse(vikings), Some("barbarians"))
	 * assertEquals(None.orElse(vikings), Some("vikings"))
	 * assertEquals(None.orElse(nobody), None)
	 * ```
	 */
	public orElse<U>(f: () => Option<U>): Option<T | U> {
		if (this._some) {
			return this as unknown as Option<T | U>;
		}
		return f();
	}

	/**
	 * Returns the option if it contains a value, otherwise calls `f` and returns the result.
	 *
	 * @param f - The async function to call if the option is `None`.
	 * @returns This option if it is `Some`, otherwise the result of calling `f`.
	 *
	 * @example
	 * ```
	 * async function nobody(): Promise<Option<string>> { return None }
	 * async function vikings(): Promise<Option<string>> { return Some("vikings") }
	 *
	 * assertEquals(await Some("barbarians").orElseAsync(vikings), Some("barbarians"))
	 * assertEquals(await None.orElseAsync(vikings), Some("vikings"))
	 * assertEquals(await None.orElseAsync(nobody), None)
	 * ```
	 */
	public orElseAsync<U>(f: () => Promise<Option<U>> | AsyncOption<U>): AsyncOption<T | U> {
		if (this._some) {
			return new AsyncOption(Promise.resolve(this as unknown as Option<T | U>));
		}
		return new AsyncOption(f());
	}

	/**
	 * Returns `Some` if exactly one of `this`, `other` is `Some`, otherwise returns `None`.
	 *
	 * @param other - The option to compare with.
	 * @returns `Some` if exactly one of the options is `Some`, otherwise `None`.
	 *
	 * @example
	 * ```
	 * let x = Some(2)
	 * let y = None
	 * assertEquals(x.xor(y), Some(2))
	 *
	 * let x = None
	 * let y = Some(2)
	 * assertEquals(x.xor(y), Some(2))
	 *
	 * let x = Some(2)
	 * let y = Some(2)
	 * assertEquals(x.xor(y), None)
	 *
	 * let x = None
	 * let y = None
	 * assertEquals(x.xor(y), None)
	 * ```
	 */
	public xor<U>(other: Option<U>): Option<T | U> {
		if (this._some) {
			if (other._some) {
				return None;
			}
			return this as unknown as Option<T | U>;
		}
		return other;
	}

	/**
	 * Converts from `Option<Option<T>>` to `Option<T>`.
	 *
	 * @returns A flattened `Option<T>`.
	 *
	 * @example
	 * ```
	 * // Basic usage:
	 * let x: Option<Option<number>> = Some(Some(6))
	 * assertEquals(x.flatten(), Some(6))
	 *
	 * let x: Option<Option<number>> = Some(None)
	 * assertEquals(x.flatten(), None)
	 *
	 * let x: Option<Option<number>> = None
	 * assertEquals(x.flatten(), None)
	 *
	 * // Flattening only removes one level of nesting at a time:
	 * let x: Option<Option<Option<number>>> = Some(Some(Some(6)))
	 * assertEquals(x.flatten(), Some(Some(6)))
	 * assertEquals(x.flatten().flatten(), Some(6))
	 * ```
	 */
	public flatten<U>(this: Option<Option<U>>): Option<U> {
		if (this._some) {
			return this._value as Option<U>;
		}
		return None;
	}

	/**
	 * @internal Use `unwrap()` on narrowed `Some` variants instead.
	 */
	public [unwrapSymbol](): T {
		if (this._some) {
			return this._value as T;
		}
		throw new Panic("Called `unwrap` on a `None` value");
	}
}

declare const tag: unique symbol;

export interface Some<T> extends OptionImpl<T> {
	[tag]: "Some";
	unwrap(): T;
}

export function Some<T>(value: T): Some<T> {
	const self = new OptionImpl(true, value) as Some<T>;
	self.unwrap = self[unwrapSymbol];
	return self;
}

export interface None<T = never> extends OptionImpl<T> {
	[tag]: "None";
}

export const None = new OptionImpl(false, null) as None;

export type Option<T> = Some<T> | None<T>;

// deno-lint-ignore no-namespace
export namespace Option {
	/**
	 * Creates an `Option<T>` from a value that may be `null` or `undefined`.
	 *
	 * @param value - The value to create an `Option<T>` from.
	 * @returns An `Option<T>` that is `Some(value)` if `value` is not `null` or `undefined`, otherwise `None`.
	 *
	 * @example
	 * ```
	 * const x = Option.fromNullish(null);
	 * assertEquals(x, None);
	 *
	 * const y = Option.fromNullish(1);
	 * assertEquals(y, Some(1));
	 * ```
	 */
	export function fromNullish<T>(value: T | null | undefined): Option<T> {
		if (value == null) {
			return None;
		}
		return Some(value);
	}
}
