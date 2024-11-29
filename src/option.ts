/**
 * This module contains the `Option` class, which represents an optional value.
 * @module
 */

import { AsyncOption } from "./async_option.ts";
import { AsyncResult } from "./async_result.ts";
import { Panic } from "./error.ts";
import { Err, Ok, type Result } from "./result.ts";
import type * as symbols from "./symbols.ts";

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

/**
 * The implementation of the `Option` class.
 * @internal
 */
export class OptionImpl<T> {
	private readonly _some: boolean;
	private readonly _value: T | undefined;

	public constructor(some: boolean, value: T | undefined) {
		Object.defineProperty(this.constructor, "name", { value: "Option" });
		this._some = some;
		this._value = value;
	}

	public get [Symbol.toStringTag](): "Some" | "None" {
		return this._some ? "Some" : "None";
	}

	/**
	 * Converts the `Option` to a JSON object.
	 */
	public toJSON(): T | null {
		if (this._some) {
			return this._value as T;
		}
		return null;
	}

	/**
	 * Converts the `Option` to a string.
	 */
	public toString(): `Some(${string})` | "None" {
		if (this._some) {
			return `Some(${String(this._value)})`;
		}
		return "None";
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
	 * const x = Some(0)
	 * assertEquals(x.isSome(), true)
	 *
	 * const y = None
	 * assertEquals(y.isSome(), false)
	 * ```
	 */
	public isSome(): this is Some<T> {
		return this._some;
	}

	/**
	 * Returns `true` if the option is `Some` and the contained value is equal to `value`.
	 *
	 * Maybe not as useful as using `option.isSome() && f(option.unwrap())`, because it doesn't narrow the type, but it's here for completeness.
	 *
	 * @param predicate - The predicate to check the contained value against.
	 * @returns `true` if the option is `Some` and the contained value is equal to `value`, otherwise `false`.
	 *
	 * @example
	 * ```
	 * const x = Some(0)
	 * assertEquals(x.isSomeAnd((v) => v === 0), true)
	 * ```
	 */
	public isSomeAnd(predicate: (value: T) => boolean): this is Some<T> {
		if (this._some) {
			return predicate(this._value as T);
		}
		return false;
	}

	/**
	 * Returns `true` if the option is `None`.
	 *
	 * @returns `true` if the option is `None`, otherwise `false`.
	 *
	 * @example
	 * ```
	 * const x = None
	 * assertEquals(x.isNone(), true)
	 *
	 * const y = Some(0)
	 * assertEquals(y.isNone(), false)
	 * ```
	 */
	public isNone(): this is None<T> {
		return !this._some;
	}

	/**
	 * Returns the contained `Some` value, if exists. Otherwise, throws a `Panic` with the provided message.
	 *
	 * @param message - The message to throw if the value is `None`.
	 * @throws `Panic` with the provided message if the value is `None`.
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
	 * Returns the contained `Some` value, if exists, otherwise returns `undefined`.
	 *
	 * Type is narrowed to `T` if the option is already checked to be `Some`.
	 *
	 * @returns The contained value, if exists, otherwise `undefined`.
	 *
	 * @example
	 * ```
	 * const x = Some(0).unwrap()
	 * assertEquals(x, 0)
	 *
	 * const y = None.unwrap()
	 * assertEquals(y, undefined)
	 *
	 * const z = Option.fromNullish(...) // Option<T>
	 * if (z.isSome()) {
	 * 	const a = z.unwrap() // `a` has type `T`
	 * 	assertEquals(typeof a, "number")
	 * } else {
	 * 	const b = z.unwrap() // `b` has type `undefined`
	 * 	assertEquals(typeof b, "undefined")
	 * }
	 * ```
	 */
	public unwrap(): T | undefined {
		if (this._some) {
			return this._value as T;
		}
		return undefined;
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
	 * const x = Some(0).unwrapOr(0)
	 * assertEquals(x, 0)
	 *
	 * const y = None.unwrapOr(0)
	 * assertEquals(y, 0)
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
	 * const x = Some(0).map((v) => v + 1)
	 * assertEquals(x, Some(1))
	 *
	 * const y = None.map((v) => v + 1)
	 * assertEquals(y, None)
	 * ```
	 */
	public map<U>(f: (value: T) => U): Option<U> {
		if (this._some) {
			return Some(f(this._value as T));
		}
		return None;
	}

	/**
	 * Maps an `Option<T>` to `Option<U>` by applying a function to a contained value.
	 *
	 * @param f - The function to apply to the contained value.
	 * @returns The result of the function application.
	 *
	 * @example
	 * ```
	 * const x = await Some(0).mapAsync(async (v) => v + 1)
	 * assertEquals(x, Some(1))
	 *
	 * const y = await None.mapAsync(async (v) => v + 1)
	 * assertEquals(y, None)
	 * ```
	 */
	public mapAsync<U>(f: (value: T) => Promise<U>): AsyncOption<U> {
		if (this._some) {
			return new AsyncOption(f(this._value as T).then(Some));
		}
		return new AsyncOption(Promise.resolve(None));
	}

	/**
	 * Calls `f` if the `Option` is `Some`.
	 *
	 * @param f - The function to apply to the contained value.
	 * @returns The same `Option<T>`.
	 *
	 * @example
	 * ```
	 * Some(0).inspect((value) => {
	 * 	console.log(value)
	 * })
	 *
	 * const y = None.inspect((value) => {
	 * 	// No output
	 * 	console.log(value)
	 * })
	 * ```
	 */
	public inspect(f: (value: T) => void): this {
		if (this._some) {
			f(this._value as T);
		}
		return this;
	}

	/**
	 * Calls `f` if the `Option` is `Some`.
	 *
	 * @param f - The function to apply to the contained value.
	 * @returns The same `Option<T>`.
	 *
	 * @example
	 * ```
	 * await Some(0).inspectAsync(async (value) => {
	 * 	console.log(value)
	 * })
	 *
	 * const y = await None.inspectAsync(async (value) => {
	 * 	// No output
	 * 	console.log(value)
	 * })
	 * ```
	 */
	public inspectAsync(f: (value: T) => Promise<void>): AsyncOption<T> {
		if (this._some) {
			return new AsyncOption(f(this._value as T).then(() => this as unknown as Some<T>));
		}
		return new AsyncOption(Promise.resolve(None));
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
	 * const x = Some(0).mapOr(0, (v) => v + 1)
	 * assertEquals(x, 1)
	 *
	 * const y = None.mapOr(0, (v) => v + 1)
	 * assertEquals(y, 0)
	 * ```
	 */
	public mapOr<A, B>(defaultValue: A, f: (value: T) => B): A | B {
		if (this._some) {
			return f(this._value as T);
		}
		return defaultValue;
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
	public mapOrAsync<A, B>(defaultValue: A, f: (value: T) => Promise<B>): Promise<A | B> {
		if (this._some) {
			return f(this._value as T);
		}
		return defaultValue;
	}

	/**
	 * Returns the provided default result (if none), or computes a default value by applying a function to the contained value (if any).
	 *
	 * @param defaultValue - The default value to return if the option is `None`.
	 * @param f - The function to apply to the contained value.
	 * @returns The result of the function application, if the option is `Some`, otherwise the provided default value.
	 *
	 * @example
	 * ```
	 * const x = Some("foo").mapOrElse(() => 0, (v) => v.length)
	 * assertEquals(x, 3)
	 *
	 * const y = None.mapOrElse(() => 0, (v) => v.length)
	 * assertEquals(y, 0)
	 * ```
	 */
	public mapOrElse<A, B>(defaultValue: () => A, f: (value: T) => B): A | B {
		if (this._some) {
			return f(this._value as T);
		}
		return defaultValue();
	}

	/**
	 * Returns the provided default result (if none), or computes a default value by applying a function to the contained value (if any).
	 *
	 * @param defaultValue - The default value to return if the option is `None`.
	 * @param f - The function to apply to the contained value.
	 * @returns The result of the function application, if the option is `Some`, otherwise the provided default value.
	 *
	 * @example
	 * ```
	 * const x = await Some(0).mapOrElseAsync(async () => 0, async (v) => v + 1)
	 * assertEquals(x, 1)
	 *
	 * const y = await None.mapOrElseAsync(async () => 0, async (v) => v + 1)
	 * assertEquals(y, 0)
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
	 * const x = Some(0).okOr("failed")
	 * assertEquals(x, Ok(0))
	 *
	 * const y = None.okOr("failed")
	 * assertEquals(y, Err("failed"))
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
	 * const x = Some(0).okOrElse(() => "failed")
	 * assertEquals(x, Ok(0))
	 *
	 * const y = None.okOrElse(() => "failed")
	 * assertEquals(y, Err("failed"))
	 * ```
	 */
	public okOrElse<E>(err: () => E): Result<T, E> {
		if (this._some) {
			return Ok(this._value as T);
		}
		return Err(err());
	}

	/**
	 * Transforms the `Option<T>` into a `AsyncResult<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err())`.
	 *
	 * @param err - The function to compute the error to return if the option is `None`.
	 * @returns The result of the transformation.
	 *
	 * @example
	 * ```
	 * const x = await Some(0).okOrElseAsync(async () => "failed")
	 * assertEquals(x, Ok(0))
	 *
	 * const y = await None.okOrElseAsync(async () => "failed")
	 * assertEquals(y, Err("failed"))
	 * ```
	 */
	public okOrElseAsync<E>(err: () => Promise<E>): AsyncResult<T, E> {
		if (this._some) {
			return new AsyncResult(Promise.resolve(Ok(this._value as T)));
		}
		return new AsyncResult(err().then((e) => Err(e)));
	}

	/**
	 * Returns `None` if the option is `None`, otherwise returns `other`.
	 *
	 * @param other - The option to return if the option is `Some`.
	 * @returns The result of the operation.
	 *
	 * @example
	 * ```
	 * let x = Some(0).and(Some(1))
	 * assertEquals(x, Some(1))
	 *
	 * x = Some(0).and(None)
	 * assertEquals(x, None)
	 *
	 * x = None.and(Some(1))
	 * assertEquals(x, None)
	 *
	 * x = None.and(None)
	 * assertEquals(x, None)
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
	 * @param f - The function to apply to the contained value.
	 * @returns The result of the function application, if the option is `Some`, otherwise `None`.
	 *
	 * @example
	 * ```
	 * let x = Some(0).andThen((x) => Some(x + 1))
	 * assertEquals(x, Some(1))
	 *
	 * x = Some(0).andThen(x => None)
	 * assertEquals(x, None)
	 *
	 * x = None.andThen((x) => Some(x + 1))
	 * assertEquals(x, None)
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
	 * @param f - The function to apply to the contained value.
	 * @returns The result of the function application, if the option is `Some`, otherwise `None`.
	 *
	 * @example
	 * ```
	 * let x = await Some(0).andThenAsync(async (x) => Some(x + 1))
	 * assertEquals(x, Some(1))
	 *
	 * x = await Some(0).andThenAsync(async (x) => None)
	 * assertEquals(x, None)
	 *
	 * x = await None.andThenAsync(async (x) => Some(x + 1))
	 * assertEquals(x, None)
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
	 * - `Some<T>` if predicate returns `true`, and
	 * - `None` if predicate returns `false`.
	 *
	 * @param predicate - The predicate to apply to the contained value.
	 * @returns The result of the predicate application, if the option is `Some`, otherwise `None`.
	 *
	 * @example
	 * ```
	 * let x = Some(1).filter((x) => x > 0)
	 * assertEquals(x, Some(1))
	 *
	 * x = Some(0).filter((x) => x > 1)
	 * assertEquals(x, None)
	 *
	 * x = None.filter((x) => x > 0)
	 * assertEquals(x, None)
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
	 * - `Some<T>` if predicate returns `true`, and
	 * - `None` if predicate returns `false`.
	 *
	 * @param predicate - The predicate to apply to the contained value.
	 * @returns The result of the predicate application, if the option is `Some`, otherwise `None`.
	 *
	 * @example
	 * ```
	 * let x = await Some(1).filterAsync(async (x) => x > 0)
	 * assertEquals(x, Some(1))
	 *
	 * x = await Some(0).filterAsync(async (x) => x > 1)
	 * assertEquals(x, None)
	 *
	 * x = await None.filterAsync(async (x) => x > 0)
	 * assertEquals(x, None)
	 * ```
	 */
	public filterAsync(predicate: (value: T) => Promise<boolean>): AsyncOption<T> {
		const check = async (): Promise<Option<T>> => {
			if (this._some && (await predicate(this._value as T))) {
				return this as unknown as Option<T>;
			}
			return None;
		};
		return new AsyncOption(check());
	}

	/**
	 * Returns the option if it contains a value, otherwise returns `other`.
	 *
	 * @param other - The option to return if the option is `None`.
	 * @returns The result of the operation.
	 *
	 * @example
	 * ```
	 * let x = Some(0).or(Some(1))
	 * assertEquals(x, Some(0))
	 *
	 * x = Some(0).or(None)
	 * assertEquals(x, Some(0))
	 *
	 * x = None.or(Some(1))
	 * assertEquals(x, Some(1))
	 *
	 * x = None.or(None)
	 * assertEquals(x, None)
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
	 * @param f - The function to apply to the contained value.
	 * @returns The result of the function application, if the option is `Some`, otherwise the provided default value.
	 *
	 * @example
	 * ```
	 * let x = Some(0).orElse(() => Some(1))
	 * assertEquals(x, Some(0))
	 *
	 * x = Some(0).orElse(() => None)
	 * assertEquals(x, Some(0))
	 *
	 * x = None.orElse(() => Some(1))
	 * assertEquals(x, Some(1))
	 *
	 * x = None.orElse(() => None)
	 * assertEquals(x, None)
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
	 * @param f - The function to apply to the contained value.
	 * @returns The result of the function application, if the option is `Some`, otherwise the provided default value.
	 *
	 * @example
	 * ```
	 * let x = await Some(0).orElseAsync(async () => Some(1))
	 * assertEquals(x, Some(0))
	 *
	 * x = await Some(0).orElseAsync(async () => None)
	 * assertEquals(x, Some(0))
	 *
	 * x = await None.orElseAsync(async () => Some(1))
	 * assertEquals(x, Some(1))
	 *
	 * x = await None.orElseAsync(async () => None)
	 * assertEquals(x, None)
	 * ```
	 */
	public orElseAsync<U>(f: () => Promise<Option<U>> | AsyncOption<U>): AsyncOption<T | U> {
		if (this._some) {
			return new AsyncOption(Promise.resolve(this as unknown as Some<T>));
		}
		return new AsyncOption(f());
	}

	/**
	 * Returns `Some` if exactly one of `this` and `other` is `Some`, otherwise returns `None`.
	 *
	 * @param other - The option to compare with.
	 * @returns The result of the operation.
	 *
	 * @example
	 * ```
	 * let x = Some(0).xor(Some(1))
	 * assertEquals(x, None)
	 *
	 * x = Some(0).xor(None)
	 * assertEquals(x, Some(0))
	 *
	 * x = None.xor(Some(1))
	 * assertEquals(x, Some(1))
	 *
	 * x = None.xor(None)
	 * assertEquals(x, None)
	 * ```
	 */
	public xor<U>(other: Option<U>): Option<T | U> {
		if (this._some) {
			return other._some ? None : (this as unknown as Option<T | U>);
		}
		return other;
	}

	/**
	 * Converts from `Option<Option<U>>` to `Option<U>`.
	 *
	 * @returns A flattened `Option<U>`.
	 *
	 * @example
	 * ```
	 * let x = Some(Some(0)).flatten()
	 * assertEquals(x, Some(0))
	 *
	 * x = Some(None).flatten()
	 * assertEquals(x, None)
	 * ```
	 */
	public flatten<U>(this: Option<Option<U>>): Option<U> {
		if (this._some) {
			return this._value as Option<U>;
		}
		return None;
	}

	// Deprecated

	/**
	 * Returns the contained `Some` value, if it exists.
	 *
	 * @deprecated Use `unwrap()` instead.
	 */
	public value(): T | undefined {
		return this._value;
	}
}

export interface Some<T> extends OptionImpl<T> {
	[symbols.tag]: "Some";

	unwrap(): T;
	expect(message: string): T;

	// Deprecated

	/**
	 * Returns the contained `Some` value, if it exists.
	 *
	 * @deprecated Use `unwrap()` instead.
	 */
	value(): T;
}

/**
 * Some value of type `T`.
 */
export function Some<T>(value: T): Some<T> {
	return new OptionImpl(true, value) as Some<T>;
}

export interface None<T = never> extends OptionImpl<T> {
	[symbols.tag]: "None";

	unwrap(): undefined;
	expect(message: string): never;

	// Deprecated

	/**
	 * Returns the contained `Some` value, if it exists.
	 *
	 * @deprecated Use `unwrap()` instead.
	 */
	value(): undefined;
}

/**
 * No value.
 */
export const None = new OptionImpl(false, undefined) as None;

/**
 * `Option` represents an optional value: every `Option` is either `Some` and contains a value, or `None`, and does not.
 */
export type Option<T> = Some<T> | None<T>;

// deno-lint-ignore no-namespace
export namespace Option {
	/**
	 * Creates an `Option` from a nullish value.
	 */
	export function fromNullish<T>(value: T | undefined | null): Option<T> {
		return value == null ? None : Some(value);
	}

	/**
	 * @deprecated Use `Option.fromNullish()` instead.
	 */
	export const from = fromNullish;
}
