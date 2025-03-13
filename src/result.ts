import { Panic, parseError } from "./error.ts";
import { None, type Option, Some } from "./option.ts";
import { ResultAsync } from "./result_async.ts";
import type { InferErr, InferOk } from "./util.ts";

export type ResultMatch<T, E, A, B> = {
	Ok: (value: T) => A;
	Err: (error: E) => B;
};

export type ResultMatchAsync<T, E, A, B> = {
	Ok: (value: T) => Promise<A>;
	Err: (error: E) => Promise<B>;
};

const unwrapSymbol = Symbol("unwrap");
const unwrapErrSymbol = Symbol("unwrapErr");

export class ResultImpl<T, E> {
	private readonly _ok: boolean;
	private readonly _value: T | E;

	public constructor(ok: boolean, value: T | E) {
		this._ok = ok;
		this._value = value;
	}

	public get [Symbol.toStringTag](): "Ok" | "Err" {
		return this._ok ? "Ok" : "Err";
	}

	public toJSON(): { Ok: T } | { Err: E } {
		if (this._ok) {
			return { Ok: this._value as T };
		}
		return { Err: this._value as E };
	}

	public toString(): `Ok(${string})` | `Err(${string})` {
		const str = String(this._value);
		if (this._ok) {
			return `Ok(${str})`;
		}
		return `Err(${str})`;
	}

	public [Symbol.for("nodejs.util.inspect.custom")](): { Ok: T } | { Err: E } {
		return this.toJSON();
	}

	/**
	 * Returns a generator that yields the contained value (if `Ok`) or an error (if `Err`).
	 *
	 * See `tryBlock()` and `tryBlockAsync()` for more information.
	 */
	public *[Symbol.iterator](): Generator<Err<E, never>, T> {
		if (this._ok) {
			return this._value as T;
		}

		// deno-lint-ignore no-this-alias
		const self = this;
		// @ts-expect-error -- This is structurally equivalent and safe
		yield self;
		// @ts-expect-error -- This is structurally equivalent and safe
		return self as E;
	}

	/**
	 * Matches the result with two functions.
	 *
	 * @param pattern - The pattern to match the result against
	 * @returns The result of the matched function
	 *
	 * @example
	 * ```
	 * const x: Result<number, string> = Ok(2)
	 * assertEquals(x.match({
	 * 	Ok: (v) => v * 2,
	 * 	Err: (e) => e.length,
	 * }), 4)
	 *
	 * const y: Result<number, string> = Err("error")
	 * assertEquals(y.match({
	 * 	Ok: (v) => v * 2,
	 * 	Err: (e) => e.length,
	 * }), 5)
	 * ```
	 */
	public match<A, B>(pattern: ResultMatch<T, E, A, B>): A | B {
		if (this._ok) {
			return pattern.Ok(this._value as T);
		}
		return pattern.Err(this._value as E);
	}

	/**
	 * Matches the result with two async functions.
	 *
	 * @param pattern - The pattern to match the result against
	 * @returns A promise that resolves to the result of the matched function
	 *
	 * @example
	 * ```
	 * const x: Result<number, string> = Ok(2)
	 * assertEquals(await x.matchAsync({
	 * 	Ok: async (v) => v * 2,
	 * 	Err: async (e) => e.length,
	 * }), 4)
	 *
	 * const y: Result<number, string> = Err("error")
	 * assertEquals(await y.matchAsync({
	 * 	Ok: async (v) => v * 2,
	 * 	Err: async (e) => e.length,
	 * }), 5)
	 * ```
	 */
	public matchAsync<A, B>(pattern: ResultMatchAsync<T, E, A, B>): Promise<A | B> {
		if (this._ok) {
			return pattern.Ok(this._value as T);
		}
		return pattern.Err(this._value as E);
	}

	/**
	 * Returns `true` if the result is `Ok`.
	 *
	 * Works as a type guard to narrow the type of the result to `Ok<T>`.
	 *
	 * @returns `true` if the result is `Ok`, otherwise `false`
	 *
	 * @example
	 * ```typescript
	 * const x = Ok(2);
	 * assertEquals(x.isOk(), true);
	 *
	 * const x = Err("Some error message");
	 * assertEquals(x.isOk(), false);
	 *
	 * // Type narrowing example:
	 * const x = Result.fromThrowable(() => someOperation());
	 * if (x.isOk()) {
	 *     // x is now typed as Ok<T>
	 *     const value = x.unwrap(); // value has type T
	 * } else {
	 *     // x is now typed as Err<E>
	 *     const error = x.unwrapErr(); // error has type E
	 * }
	 * ```
	 */
	public isOk(): this is Ok<T, E> {
		return this._ok;
	}

	/**
	 * Returns `true` if the result is `Ok` and the value satisfies the predicate.
	 *
	 * Works as a type guard to narrow the type of the result to `Ok<T>`.
	 *
	 * @param f - The predicate to check the contained value against
	 * @returns `true` if the result is `Ok` and the value matches the predicate, otherwise `false`
	 *
	 * @example
	 * ```typescript
	 * const x = Ok(2);
	 * assertEquals(x.isOkAnd((x) => x > 1), true);
	 *
	 * const x = Ok(0);
	 * assertEquals(x.isOkAnd((x) => x > 1), false);
	 *
	 * const x = Err("error");
	 * assertEquals(x.isOkAnd((x) => x > 1), false);
	 * ```
	 */
	public isOkAnd(f: (value: T) => boolean): this is Ok<T, E> {
		return this._ok && f(this._value as T);
	}

	/**
	 * Returns `true` if the result is `Err`.
	 *
	 * Works as a type guard to narrow the type of the result to `Err<E>`.
	 *
	 * @returns `true` if the result is `Err`, otherwise `false`
	 *
	 * @example
	 * ```typescript
	 * const x = Ok(-3);
	 * assertEquals(x.isErr(), false);
	 *
	 * const x = Err("Some error message");
	 * assertEquals(x.isErr(), true);
	 *
	 * // Type narrowing example:
	 * const x = Result.fromThrowable(() => someOperation());
	 * if (x.isErr()) {
	 *     // x is now typed as Err<E>
	 *     const error = x.unwrapErr(); // error has type E
	 * }
	 * ```
	 */
	public isErr(): this is Err<E, T> {
		return !this._ok;
	}

	/**
	 * Returns `true` if the result is `Err` and the error satisfies the predicate.
	 *
	 * Works as a type guard to narrow the type of the result to `Err<E>`.
	 *
	 * @param f - The predicate to check the contained error against
	 * @returns `true` if the result is `Err` and the error matches the predicate, otherwise `false`
	 *
	 * @example
	 * ```typescript
	 * const x = Err("error");
	 * assertEquals(x.isErrAnd((e) => e.length > 3), true);
	 *
	 * const x = Err("err");
	 * assertEquals(x.isErrAnd((e) => e.length > 3), false);
	 *
	 * const x = Ok(123);
	 * assertEquals(x.isErrAnd((e) => e.length > 3), false);
	 * ```
	 */
	public isErrAnd(f: (error: E) => boolean): this is Err<E, T> {
		return !this._ok && f(this._value as E);
	}

	/**
	 * Converts from `Result<T, E>` to `Option<T>`, discarding the error if any.
	 *
	 * @returns An `Option` containing the success value if this is `Ok`, or `None` if this is `Err`
	 *
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = Ok(2);
	 * assertEquals(x.ok(), Some(2));
	 *
	 * const x: Result<number, string> = Err("Nothing here");
	 * assertEquals(x.ok(), None);
	 * ```
	 */
	public ok(): Option<T> {
		if (this._ok) {
			return Some(this._value as T);
		}
		return None;
	}

	/**
	 * Converts from `Result<T, E>` to `Option<E>`, discarding the success value if any.
	 *
	 * @returns An `Option` containing the error value if this is `Err`, or `None` if this is `Ok`.
	 *
	 * @example
	 * ```
	 * const x: Result<number, string> = Ok(2);
	 * assertEquals(x.err(), None);
	 *
	 * const x: Result<number, string> = Err("Nothing here");
	 * assertEquals(x.err(), Some("Nothing here"));
	 * ```
	 */
	public err(): Option<E> {
		if (!this._ok) {
			return Some(this._value as E);
		}
		return None;
	}

	/**
	 * Maps a `Result<T, E>` to `Result<U, E>` by applying a function to a contained `Ok` value,
	 * leaving an `Err` value untouched.
	 *
	 * This function can be used to compose the results of two functions.
	 *
	 * @param f - The function to apply to the contained value
	 * @returns A new Result with the function applied to the contained value if `Ok`,
	 *          or the original error if `Err`
	 *
	 * @example
	 * ```typescript
	 * const x = Ok(2).map((x) => x.toString());
	 * assertEquals(x, Ok("2"));
	 *
	 * const x = Err("error").map((x) => x.toString());
	 * assertEquals(x, Err("error"));
	 *
	 * // Processing lines of numbers:
	 * const lines = "1\n2\n3\n4";
	 *
	 * for (const line of lines.split("\n")) {
	 *     Result.fromThrowable(() => parseInt(line))
	 *         .map((n) => n * 2)
	 *         .match({
	 *             Ok: (n) => console.log(n),
	 *             Err: () => {} // Skip invalid numbers
	 *         });
	 * }
	 * ```
	 */
	public map<U>(f: (value: T) => U): Result<U, E> {
		if (this._ok) {
			return Ok(f(this._value as T));
		}
		return Err(this._value as E);
	}

	/**
	 * Maps a `Result<T, E>` to `ResultAsync<U, E>` by applying an async function to a contained `Ok` value,
	 * leaving an `Err` value untouched.
	 *
	 * This function can be used to compose the results of two functions.
	 *
	 * @param f - The async function to apply to the contained value
	 * @returns A new ResultAsync with the async function applied to the contained value if `Ok`,
	 *          or the original error if `Err`
	 *
	 * @example
	 * ```typescript
	 * const x = Ok(2).mapAsync(async (x) => x.toString());
	 * assertEquals(x, Ok("2"));
	 *
	 * const x = Err("error").mapAsync(async (x) => x.toString());
	 * assertEquals(x, Err("error"));
	 *
	 * // Processing lines of numbers:
	 * const lines = "1\n2\n3\n4";
	 *
	 * for (const line of lines.split("\n")) {
	 *     await Result.fromThrowable(() => parseInt(line))
	 *         .mapAsync(async (n) => n * 2)
	 *         .match({
	 *             Ok: (n) => console.log(n),
	 *             Err: () => {} // Skip invalid numbers
	 *         });
	 * }
	 * ```
	 */
	public mapAsync<U>(f: (value: T) => Promise<U>): ResultAsync<U, E> {
		if (this._ok) {
			return new ResultAsync(f(this._value as T).then((value) => Ok(value)));
		}
		return new ResultAsync(Promise.resolve(Err(this._value as E)));
	}

	/**
	 * Returns the provided default (if `Err`), or applies a function to the contained value (if `Ok`).
	 *
	 * @param defaultValue - The value to return if the result is `Err`
	 * @param f - The function to apply to the contained value if the result is `Ok`
	 * @returns The default value if `Err`, otherwise the result of applying `f` to the contained value
	 *
	 * @example
	 * ```typescript
	 * let x: Result<string, string> = Ok("foo")
	 * assertEquals(x.mapOr(42, (v) => v.length), 3)
	 *
	 * let x: Result<string, string> = Err("bar")
	 * assertEquals(x.mapOr(42, (v) => v.length), 42)
	 * ```
	 */
	public mapOr<A, B>(defaultValue: A, f: (value: T) => B): A | B {
		if (this._ok) {
			return f(this._value as T);
		}
		return defaultValue;
	}

	/**
	 * Returns the provided default (if `Err`), or applies a function to the contained value (if `Ok`).
	 *
	 * @param defaultValue - The value to return if the result is `Err`
	 * @param f - The function to apply to the contained value if the result is `Ok`
	 * @returns The default value if `Err`, otherwise the result of applying `f` to the contained value
	 *
	 * @example
	 * ```typescript
	 * let x: Result<string, string> = Ok("foo")
	 * assertEquals(await x.mapOrAsync(42, async (v) => v.length), 3)
	 *
	 * let x: Result<string, string> = Err("bar")
	 * assertEquals(await x.mapOrAsync(42, async (v) => v.length), 42)
	 * ```
	 */
	public mapOrAsync<A, B>(defaultValue: A, f: (value: T) => Promise<B>): Promise<A | B> {
		if (this._ok) {
			return f(this._value as T);
		}
		return Promise.resolve(defaultValue);
	}

	/**
	 * Maps a `Result<T, E>` to `A | B` by applying fallback function `defaultValue` to a contained `Err` value,
	 * or function `f` to a contained `Ok` value.
	 *
	 * This function can be used to unpack a successful result while handling an error.
	 *
	 * @param defaultValue - The function to call with the error if the result is `Err`
	 * @param f - The function to call with the value if the result is `Ok`
	 * @returns The result of either function application
	 *
	 * @example
	 * ```typescript
	 * const k = 21;
	 *
	 * let x: Result<string, string> = Ok("foo");
	 * assertEquals(x.mapOrElse((e) => k * 2, (v) => v.length), 3);
	 *
	 * let x: Result<string, string> = Err("bar");
	 * assertEquals(x.mapOrElse((e) => k * 2, (v) => v.length), 42);
	 * ```
	 */
	public mapOrElse<A, B>(defaultValue: (error: E) => A, f: (value: T) => B): A | B {
		if (this._ok) {
			return f(this._value as T);
		}
		return defaultValue(this._value as E);
	}

	/**
	 * Maps a `Result<T, E>` to `Promise<A | B>` by applying fallback function `defaultValue` to a contained `Err` value,
	 * or function `f` to a contained `Ok` value.
	 *
	 * This function can be used to unpack a successful result while handling an error.
	 *
	 * @param defaultValue - The function to call with the error if the result is `Err`
	 * @param f - The function to call with the value if the result is `Ok`
	 * @returns The result of either function application
	 *
	 * @example
	 * ```typescript
	 * const k = 21;
	 *
	 * let x: Result<string, string> = Ok("foo");
	 * assertEquals(await x.mapOrElseAsync(async (e) => k * 2, (v) => v.length), 3);
	 *
	 * let x: Result<string, string> = Err("bar");
	 * assertEquals(await x.mapOrElseAsync(async (e) => k * 2, async (v) => v.length), 42);
	 * ```
	 */
	public mapOrElseAsync<A, B>(
		defaultValue: (error: E) => Promise<A>,
		f: (value: T) => Promise<B>,
	): Promise<A | B> {
		if (this._ok) {
			return f(this._value as T);
		}
		return defaultValue(this._value as E);
	}

	/**
	 * Maps a `Result<T, E>` to `Result<T, F>` by applying a function to a contained `Err` value,
	 * leaving an `Ok` value untouched.
	 *
	 * This function can be used to pass through a successful result while handling an error.
	 *
	 * @param f - The function to apply to the contained error
	 * @returns A new Result with the function applied to the contained error if `Err`,
	 *          or the original value if `Ok`
	 *
	 * @example
	 * ```typescript
	 * const stringify = (x: number): string => `error code: ${x}`;
	 *
	 * const x: Result<number, number> = Ok(2);
	 * assertEquals(x.mapErr(stringify), Ok(2));
	 *
	 * const x: Result<number, number> = Err(13);
	 * assertEquals(x.mapErr(stringify), Err("error code: 13"));
	 * ```
	 */
	public mapErr<F>(f: (error: E) => F): Result<T, F> {
		if (this._ok) {
			return Ok(this._value as T);
		}
		return Err(f(this._value as E));
	}

	/**
	 * Maps a `Result<T, E>` to `ResultAsync<T, F>` by applying an async function to a contained `Err` value,
	 * leaving an `Ok` value untouched.
	 *
	 * This function can be used to pass through a successful result while handling an error.
	 *
	 * @param f - The async function to apply to the contained error
	 * @returns A new ResultAsync with the async function applied to the contained error if `Err`,
	 *          or the original value if `Ok`
	 *
	 * @example
	 * ```typescript
	 * const stringify = async (x: number): Promise<string> => `error code: ${x}`;
	 *
	 * const x: Result<number, number> = Ok(2);
	 * assertEquals(x.mapErrAsync(stringify), Ok(2));
	 *
	 * const x: Result<number, number> = Err(13);
	 * assertEquals(x.mapErrAsync(stringify), Err("error code: 13"));
	 * ```
	 */
	public mapErrAsync<F>(f: (error: E) => Promise<F>): ResultAsync<T, F> {
		if (this._ok) {
			return new ResultAsync(Promise.resolve(Ok(this._value as T)));
		}
		return new ResultAsync(f(this._value as E).then((error) => Err(error)));
	}

	/**
	 * Calls the provided function with the contained value (if `Ok`).
	 *
	 * Returns the original result, making it useful for debugging in the middle of method chains.
	 *
	 * @param f - The function to call with the contained value
	 * @returns The original result, unchanged
	 *
	 * @example
	 * ```typescript
	 * const x = Result.fromThrowable(() => parseInt("4"))
	 *     .inspect(x => console.log(`original: ${x}`)) // prints: original: 4
	 *     .map(x => Math.pow(x, 3))
	 *     .expect("failed to parse number");
	 * ```
	 */
	public inspect(f: (value: T) => void): this {
		if (this._ok) {
			f(this._value as T);
		}
		return this;
	}

	/**
	 * Calls the provided async function with the contained value (if `Ok`).
	 *
	 * Returns the original result, making it useful for debugging in the middle of method chains.
	 *
	 * @param f - The async function to call with the contained value
	 * @returns An async result, unchanged
	 *
	 * @example
	 * ```typescript
	 * const x = await Result.fromThrowable(() => parseInt("4"))
	 *     .inspectAsync(async (x) => console.log(`original: ${x}`)) // prints: original: 4
	 *     .map((x) => Math.pow(x, 3))
	 *     .expect("failed to parse number");
	 * ```
	 */
	public inspectAsync(f: (value: T) => Promise<void>): ResultAsync<T, E> {
		if (this._ok) {
			return new ResultAsync(f(this._value as T).then(() => this as unknown as Result<T, E>));
		}
		return new ResultAsync(Promise.resolve(this as unknown as Result<T, E>));
	}

	/**
	 * Calls the provided function with the contained error (if `Err`).
	 *
	 * Returns the original result, making it useful for debugging in the middle of method chains.
	 *
	 * @param f - The function to call with the contained error
	 * @returns The original result, unchanged
	 *
	 * @example
	 * ```typescript
	 * const result = Result
	 *     .fromThrowable(() => readFileSync("address.txt", "utf8"))
	 *     .inspectErr((e) => console.error(`failed to read file: ${e}`))
	 *     .map((contents) => processContents(contents));
	 * ```
	 */
	public inspectErr(f: (error: E) => void): this {
		if (!this._ok) {
			f(this._value as E);
		}
		return this;
	}

	/**
	 * Calls the provided function with the contained error (if `Err`).
	 *
	 * Returns the original result, making it useful for debugging in the middle of method chains.
	 *
	 * @param f - The function to call with the contained error
	 * @returns Original result converted to an async result
	 *
	 * @example
	 * ```typescript
	 * const result = Result.fromThrowable(() => readFileSync("address.txt", "utf8"))
	 *     .inspectErrAsync(async (e) => console.error(`failed to read file: ${e}`))
	 *     .map((contents) => processContents(contents));
	 * ```
	 */
	public inspectErrAsync(f: (error: E) => Promise<void>): this {
		if (!this._ok) {
			f(this._value as E);
		}
		return this;
	}

	/**
	 * Returns the contained `Ok` value.
	 *
	 * Because this function may throw, its use is generally discouraged. Instead, prefer to:
	 * - Use pattern matching with `match()` and handle the `Err` case explicitly
	 * - Use `unwrapOr()`, `unwrapOrElse()`, or similar methods
	 *
	 * @param message - A message explaining why you expect this Result to be Ok
	 * @throws {Panic} If the value is an `Err`, with a message containing the passed message and the content of the `Err` as cause
	 * @returns The contained `Ok` value
	 *
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = Err("emergency failure");
	 * x.expect("Testing expect"); // throws Panic: Testing expect: emergency failure
	 * ```
	 *
	 * It is recommended that expect messages describe the reason you expect the Result should be Ok.
	 *
	 * @example
	 * ```typescript
	 * const path = Result.fromThrowable(async () => {
	 *     return readFileSync("/etc/important.conf", "utf8");
	 * }).expect("config file should exist");
	 * ```
	 */
	public expect(message: string): T {
		if (this._ok) {
			return this._value as T;
		}
		throw new Panic(message, { cause: this._value });
	}

	/**
	 * Returns the contained `Err` value.
	 *
	 * Because this function may throw, its use is generally discouraged. Instead, prefer to:
	 * - Use pattern matching with `match()` and handle the `Ok` case explicitly
	 * - Use similar methods that don't throw
	 *
	 * @param message - A message explaining why you expect this Result to be Err
	 * @throws {Panic} If the value is an `Ok`, with a message containing the passed message and the content of the `Ok` as cause
	 * @returns The contained Err value
	 *
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = Ok(10);
	 * x.expectErr("Testing expectErr"); // throws Panic: Testing expectErr: 10
	 * ```
	 */
	public expectErr(message: string): E {
		if (!this._ok) {
			return this._value as E;
		}
		throw new Panic(message, { cause: this._value });
	}

	/**
	 * Returns `other` if the result is `Ok`, otherwise returns `this` (as `Err`).
	 *
	 * @param other - The result to return if this result is `Ok`.
	 * @returns The other result if this result is `Ok`, otherwise this result's error.
	 *
	 * @example
	 * ```
	 * let x: Result<number, string> = Ok(2)
	 * let y: Result<string, string> = Err("late error")
	 * assertEquals(x.and(y), Err("late error"))
	 *
	 * let x: Result<number, string> = Err("early error")
	 * let y: Result<string, string> = Ok("foo")
	 * assertEquals(x.and(y), Err("early error"))
	 *
	 * let x: Result<number, string> = Err("not a 2")
	 * let y: Result<string, string> = Err("late error")
	 * assertEquals(x.and(y), Err("not a 2"))
	 *
	 * let x: Result<number, string> = Ok(2)
	 * let y: Result<string, string> = Ok("different result type")
	 * assertEquals(x.and(y), Ok("different result type"))
	 * ```
	 */
	public and<U, F>(other: Result<U, F>): Result<U, E | F> {
		if (this._ok) {
			return other;
		}
		return Err(this._value as E);
	}

	/**
	 * Calls `f` if the result is `Ok`, otherwise returns `this` (as `Err`).
	 *
	 * This function can be used for control flow based on Result values.
	 *
	 * @param f - The function to apply to the contained value.
	 * @returns The result of the function application if `Ok`, otherwise returns the original error.
	 *
	 * @example
	 * ```
	 * function divideThenToString(a: number, b: number): Result<string, string> {
	 *     if (b === 0) {
	 *         return Err("division by zero")
	 *     }
	 *     return Ok((a / b).toString())
	 * }
	 *
	 * assertEquals(Ok(100, 2).andThen(divideThenToString), Ok("50"))
	 * assertEquals(Ok(100, 0).andThen(divideThenToString), Err("division by zero"))
	 * assertEquals(Err("not a number").andThen(divideThenToString), Err("not a number"))
	 *
	 * // Often used to chain fallible operations that may return Err
	 * const json = Result.fromThrowable(() => {
	 *     return readFileSync("config.json", "utf8");
	 * }).andThen((contents) => {
	 *     return Result.fromThrowable(() => JSON.parse(contents));
	 * });
	 * assertEquals(json.isOk(), true)
	 *
	 * const shouldFail = Result.fromThrowable(() => {
	 *     return readFileSync("/bad/path", "utf8");
	 * }).andThen((contents) => {
	 *     return Result.fromThrowable(() => JSON.parse(contents));
	 * });
	 * assertEquals(shouldFail.isErr(), true)
	 * ```
	 */
	public andThen<U, F>(f: (value: T) => Result<U, F>): Result<U, E | F> {
		if (this._ok) {
			return f(this._value as T);
		}
		return Err(this._value as E);
	}

	/**
	 * Calls `f` if the result is `Ok`, otherwise returns `this` (as `Err`).
	 *
	 * This async function can be used for control flow based on Result values.
	 *
	 * @param f - The async function to apply to the contained value.
	 * @returns The result of the async function application if `Ok`, otherwise returns the original error.
	 *
	 * @example
	 * ```
	 * async function divideThenToString(a: number, b: number): Promise<Result<string, string>> {
	 *     if (b === 0) {
	 *         return Err("division by zero")
	 *     }
	 *     return Ok((a / b).toString())
	 * }
	 *
	 * assertEquals(await Ok(100, 2).andThenAsync(divideThenToString), Ok("50"))
	 * assertEquals(await Ok(100, 0).andThenAsync(divideThenToString), Err("division by zero"))
	 * assertEquals(await Err("not a number").andThenAsync(divideThenToString), Err("not a number"))
	 *
	 * // Often used to chain fallible operations that may return Err
	 * const json = Result.fromThrowableAsync(async () => {
	 *     return readFile("config.json", "utf8");
	 * }).andThenAsync(async (contents) => {
	 *     return Result.fromThrowable(() => JSON.parse(contents));
	 * });
	 * assertEquals(json.isOk(), true)
	 *
	 * const shouldFail = await Result.fromThrowableAsync(async () => {
	 *     return readFile("/bad/path", "utf8");
	 * }).andThenAsync(async (contents) => {
	 *     return Result.fromThrowable(() => JSON.parse(contents));
	 * });
	 * assertEquals(shouldFail.isErr(), true)
	 * ```
	 */
	public andThenAsync<U, F>(
		f: (value: T) => ResultAsync<U, F> | Promise<Result<U, F>>,
	): ResultAsync<U, E | F> {
		if (this._ok) {
			return new ResultAsync(f(this._value as T));
		}
		return new ResultAsync(Promise.resolve(Err(this._value as E)));
	}

	/**
	 * Returns `other` if the result is `Err`, otherwise returns `this` (as `Ok`).
	 *
	 * @param other - The result to return if this result is `Err`
	 * @returns This result if it is `Ok`, otherwise the provided result
	 *
	 * @example
	 * ```typescript
	 * let x: Result<number, string> = Ok(2)
	 * let y: Result<number, string> = Err("late error")
	 * assertEquals(x.or(y), Ok(2))
	 *
	 * let x: Result<number, string> = Err("early error")
	 * let y: Result<number, string> = Ok(2)
	 * assertEquals(x.or(y), Ok(2))
	 *
	 * let x: Result<number, string> = Err("not a 2")
	 * let y: Result<number, string> = Err("late error")
	 * assertEquals(x.or(y), Err("late error"))
	 *
	 * let x: Result<number, string> = Ok(2)
	 * let y: Result<number, string> = Ok(100)
	 * assertEquals(x.or(y), Ok(2))
	 * ```
	 */
	public or<U, F>(other: Result<U, F>): Result<T | U, F> {
		if (this._ok) {
			return Ok(this._value as T);
		}
		return other;
	}

	/**
	 * Calls `f` if the result is `Err`, otherwise returns `this` (as `Ok`).
	 *
	 * This function can be used for control flow based on result values.
	 *
	 * @param f - The function to call with the error value if this result is `Err`
	 * @returns This result if it is `Ok`, otherwise the result of calling `f` with the error
	 *
	 * @example
	 * ```typescript
	 * function sq(x: number): Result<number, number> { return Ok(x * x) }
	 * function err(x: number): Result<number, number> { return Err(x) }
	 *
	 * assertEquals(Ok(2).orElse(sq).orElse(sq), Ok(2))
	 * assertEquals(Ok(2).orElse(err).orElse(sq), Ok(2))
	 * assertEquals(Err(3).orElse(sq).orElse(err), Ok(9))
	 * assertEquals(Err(3).orElse(err).orElse(err), Err(3))
	 * ```
	 */
	public orElse<U, F>(f: (error: E) => Result<U, F>): Result<T | U, F> {
		if (this._ok) {
			return Ok(this._value as T);
		}
		return f(this._value as E);
	}

	/**
	 * Calls `f` if the result is `Err`, otherwise returns `this` (as `Ok`).
	 *
	 * This function can be used for control flow based on result values.
	 *
	 * @param f - The function to call with the error value if this result is `Err`
	 * @returns This result if it is `Ok`, otherwise the result of calling `f` with the error
	 *
	 * @example
	 * ```typescript
	 * async function sq(x: number): Promise<Result<number, number>> { return Ok(x * x) }
	 * async function err(x: number): Promise<Result<number, number>> { return Err(x) }
	 *
	 * assertEquals(await Ok(2).orElseAsync(sq).orElseAsync(sq), Ok(2))
	 * assertEquals(await Ok(2).orElseAsync(err).orElseAsync(sq), Ok(2))
	 * assertEquals(await Err(3).orElseAsync(sq).orElseAsync(err), Ok(9))
	 * assertEquals(await Err(3).orElseAsync(err).orElseAsync(err), Err(3))
	 * ```
	 */
	public orElseAsync<U, F>(
		f: (error: E) => ResultAsync<U, F> | Promise<Result<U, F>>,
	): ResultAsync<T | U, F> {
		if (this._ok) {
			return new ResultAsync(Promise.resolve(this) as Promise<Result<T | U, F>>);
		}
		return new ResultAsync(f(this._value as E));
	}

	/**
	 * Returns the contained `Ok` value or a provided default.
	 *
	 * @param defaultValue - The value to return if the result is `Err`
	 * @returns The contained value if `Ok`, otherwise the provided default value
	 *
	 * @example
	 * ```typescript
	 * const defaultValue = 2
	 *
	 * let x: Result<number, string> = Ok(9)
	 * assertEquals(x.unwrapOr(defaultValue), 9)
	 *
	 * let x: Result<number, string> = Err("error")
	 * assertEquals(x.unwrapOr(defaultValue), defaultValue)
	 * ```
	 */
	public unwrapOr<U>(defaultValue: U): T | U {
		if (this._ok) {
			return this._value as T;
		}
		return defaultValue;
	}

	/**
	 * Returns the contained `Ok` value or computes it from a function.
	 *
	 * @param defaultValue - The function to compute a default value from the error
	 * @returns The contained value if `Ok`, otherwise the result of calling `defaultValue` with the error
	 *
	 * @example
	 * ```typescript
	 * function count(x: string): number { return x.length }
	 *
	 * assertEquals(Ok(2).unwrapOrElse(count), 2)
	 * assertEquals(Err("foo").unwrapOrElse(count), 3)
	 * ```
	 */
	public unwrapOrElse<U>(defaultValue: (error: E) => U): T | U {
		if (this._ok) {
			return this._value as T;
		}
		return defaultValue(this._value as E);
	}

	/**
	 * Returns the contained `Ok` value or computes it from a function.
	 *
	 * @param defaultValue - The function to compute a default value from the error
	 * @returns The contained value if `Ok`, otherwise the result of calling `defaultValue` with the error
	 *
	 * @example
	 * ```typescript
	 * async function count(x: string): Promise<number> { return x.length }
	 *
	 * assertEquals(await Ok(2).unwrapOrElseAsync(count), 2)
	 * assertEquals(await Err("foo").unwrapOrElseAsync(count), 3)
	 * ```
	 */
	public unwrapOrElseAsync<U>(defaultValue: (error: E) => Promise<U>): Promise<T | U> {
		if (this._ok) {
			return Promise.resolve(this._value as T);
		}
		return defaultValue(this._value as E);
	}

	/**
	 * Converts from `Result<Result<T, F>, E>` to `Result<T, E | F>`.
	 *
	 * @returns A flattened `Result<T, E | F>`.
	 *
	 * @example
	 * ```typescript
	 * // Basic usage:
	 * let x: Result<Result<string, number>, number> = Ok(Ok("hello"));
	 * assertEquals(x.flatten(), Ok("hello"));
	 *
	 * let x: Result<Result<string, number>, number> = Ok(Err(6));
	 * assertEquals(x.flatten(), Err(6));
	 *
	 * let x: Result<Result<string, number>, number> = Err(6);
	 * assertEquals(x.flatten(), Err(6));
	 *
	 * // Flattening only removes one level of nesting at a time:
	 * let x: Result<Result<Result<string, number>, number>, number> = Ok(Ok(Ok("hello")));
	 * assertEquals(x.flatten(), Ok(Ok("hello")));
	 * assertEquals(x.flatten().flatten(), Ok("hello"));
	 * ```
	 */
	public flatten<R extends Result<any, any>>(
		this: Result<R, E>,
	): Result<InferOk<R>, InferErr<R> | E> {
		if (this._ok) {
			return this._value as Result<InferOk<R>, InferErr<R> | E>;
		}
		return Err(this._value as E);
	}

	/**
	 * @internal Use `unwrap()` on narrowed `Ok` variants instead.
	 */
	public [unwrapSymbol](): T {
		if (this._ok) {
			return this._value as T;
		}
		throw new Panic("Called `unwrap()` on an `Err` value", {
			cause: this._value,
		});
	}

	/**
	 * @internal Use `unwrapErr()` on narrowed `Err` variants instead.
	 */
	public [unwrapErrSymbol](): E {
		if (!this._ok) {
			return this._value as E;
		}
		throw new Panic("Called `unwrapErr()` on an `Ok` value", {
			cause: this._value,
		});
	}
}

declare const tag: unique symbol;

export interface Ok<T, E = unknown> extends ResultImpl<T, E> {
	[tag]: "Ok";

	/**
	 * Safely unwraps the contained `Ok` value. Only available on `Ok` variants.
	 *
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = Ok(10);
	 * if (x.isOk()) {
	 *     assertEquals(x.unwrap(), 10);
	 * } else {
	 *     // TypeScript error: Property 'unwrap' does not exist on 'Err<string, number>'.
	 *     assertEquals(x.unwrap(), 10);
	 * }
	 * ```
	 */
	unwrap(): T;
}

/**
 * Contains the success value of a `Result`.
 *
 * @param value - The value to wrap in an `Ok` variant.
 * @returns A new `Ok` variant containing the given value.
 *
 * @example
 * ```typescript
 * const x = Ok(10);
 * assertEquals(x.unwrap(), 10);
 * ```
 */
export function Ok<T, E = never>(value: T): Ok<T, E> {
	const self = new ResultImpl<T, E>(true, value) as Ok<T, E>;
	self.unwrap = self[unwrapSymbol];
	return self;
}

/**
 * Contains the error value of a `Result`.
 *
 * @param value - The value to wrap in an `Err` variant.
 * @returns A new `Err` variant containing the given value.
 *
 * @example
 * ```typescript
 * const x = Err("error");
 * assertEquals(x.unwrapErr(), "error");
 * ```
 */
export interface Err<E, T = never> extends ResultImpl<T, E> {
	[tag]: "Err";

	/**
	 * Safely unwraps the contained `Err` value. Only available on `Err` variants.
	 *
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = Err("error");
	 * if (x.isErr()) {
	 *     assertEquals(x.unwrapErr(), "error");
	 * } else {
	 *     // TypeScript error: Property 'unwrapErr' does not exist on 'Ok<number, string>'.
	 *     assertEquals(x.unwrapErr(), "error");
	 * }
	 * ```
	 */
	unwrapErr(): E;
}

export function Err<E, T = unknown>(value: E): Err<E, T> {
	const self = new ResultImpl<T, E>(false, value) as Err<E, T>;
	self.unwrapErr = self[unwrapErrSymbol];
	return self;
}

/**
 * `Result` is a type that represents either success (`Ok`) or failure (`Err`).
 *
 * `Result<T, E>` is the type used for returning errors. It is a discriminated union with the variants, `Ok<T>`, representing success and containing a value, and `Err<E>`, representing error and containing an error value.
 *
 * Functions return `Result` whenever errors are expected and recoverable.
 */
export type Result<T, E> = Ok<T, E> | Err<E, T>;

// deno-lint-ignore no-namespace
export namespace Result {
	function handlePanic(error: unknown): unknown {
		if (error instanceof Panic) {
			throw error;
		}
		return error;
	}

	function handleCaughtError(error: unknown): Error {
		return parseError(handlePanic(error));
	}

	/**
	 * Tries to execute a function and returns the result as a `Result`.
	 *
	 * @param f - The function to execute
	 * @returns The result of the function
	 *
	 * @example
	 * ```typescript
	 * // const result: Result<number, Error>
	 * const result = Result.fromThrowable(() => {
	 *   if (Math.random() > 0.5) {
	 *     return 42
	 *   } else {
	 *     throw new Error("random error")
	 *   }
	 * })
	 * ```
	 */
	export function fromThrowable<T>(f: () => T): Result<T, Error> {
		try {
			return Ok(f());
		} catch (error) {
			return Err(handleCaughtError(error));
		}
	}

	/**
	 * Tries to resolve a promise and returns the result as a `ResultAsync`.
	 *
	 * This may allow a synchronous error to escape, prefer using `Result.fromThrowableAsync()` instead.
	 *
	 * @example
	 * ```typescript
	 * function findUser(id: string): Promise<User> {
	 *    throw new Error("not found") // synchronous error
	 * }
	 *
	 * // synchronous error here will not be caught
	 * const result = Result.fromPromise(findUser("123")) //
	 * ```
	 *
	 * @param promise - A safe promise to resolve
	 * @returns The result of the promise
	 *
	 * @example
	 * ```typescript
	 * // const result: ResultAsync<number, Error>
	 * const result = Result.fromPromise(Promise.resolve(42))
	 * ```
	 */
	export function fromPromise<T>(promise: Promise<T>): ResultAsync<T, Error> {
		return new ResultAsync(
			promise.then(
				(value) => Ok(value),
				(error) => Err(handleCaughtError(error)),
			),
		);
	}

	/**
	 * Tries to execute an async function and returns the result as a `ResultAsync`.
	 *
	 * This is safer then `Result.fromPromise()` because it will not allow a synchronous error to escape.
	 *
	 * @example
	 * ```typescript
	 * function findUser(id: string): Promise<User> {
	 *    throw new Error("not found") // synchronous error
	 * }
	 *
	 * // synchronous error here will be caught
	 * const result = Result.fromThrowableAsync(async () => findUser("123"))
	 * ```
	 *
	 * @param f - The async function to execute
	 * @returns The result of the async function
	 *
	 * @example
	 * ```typescript
	 * // const result: ResultAsync<number, Error>
	 * const result = Result.fromThrowableAsync((): Promise<number> => {
	 *   if (Math.random() > 0.5) {
	 *     throw new Error("random error")
	 *   } else {
	 *     return Promise.resolve(42)
	 *   }
	 * })
	 */
	export function fromThrowableAsync<T>(f: () => Promise<T>): ResultAsync<T, Error> {
		async function safe(): Promise<Result<T, Error>> {
			try {
				return Ok(await f() as T);
			} catch (error) {
				return Err(handleCaughtError(error));
			}
		}
		return new ResultAsync(safe());
	}
}
