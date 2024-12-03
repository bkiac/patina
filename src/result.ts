import { Panic, parseError } from "./error.ts";
import { None, type Option, Some } from "./option.ts";
import { AsyncResult } from "./async_result.ts";
import type { InferErr, InferOk } from "./util.ts";

export type ResultMatch<T, E, A, B> = {
	Ok: (value: T) => A;
	Err: (error: E) => B;
};

export type ResultMatchAsync<T, E, A, B> = {
	Ok: (value: T) => Promise<A>;
	Err: (error: E) => Promise<B>;
};

const nodejsUtilInspectCustom = Symbol.for("nodejs.util.inspect.custom");

export interface ResultMethods<T, E> {
	get [Symbol.toStringTag](): "Ok" | "Err";

	toJSON(): { Ok: T } | { Err: E };

	toString(): `Ok(${string})` | `Err(${string})`;

	[nodejsUtilInspectCustom](): string;

	/**
	 * Returns a generator that yields the contained value (if `Ok`) or an error (if `Err`).
	 *
	 * See `tryBlock()` and `tryBlockAsync()` for more information.
	 */
	[Symbol.iterator](): Generator<Err<E, never>, T>;

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
	match<A, B>(pattern: ResultMatch<T, E, A, B>): A | B;

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
	matchAsync<A, B>(pattern: ResultMatchAsync<T, E, A, B>): Promise<A | B>;

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
	isOk(): this is Ok<T, E>;

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
	isOkAnd(f: (value: T) => boolean): this is Ok<T, E>;

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
	isErr(): this is Err<E, T>;

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
	isErrAnd(f: (error: E) => boolean): this is Err<E, T>;

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
	ok(): Option<T>;

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
	err(): Option<E>;

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
	map<U>(f: (value: T) => U): Result<U, E>;

	/**
	 * Maps a `Result<T, E>` to `AsyncResult<U, E>` by applying an async function to a contained `Ok` value,
	 * leaving an `Err` value untouched.
	 *
	 * This function can be used to compose the results of two functions.
	 *
	 * @param f - The async function to apply to the contained value
	 * @returns A new AsyncResult with the async function applied to the contained value if `Ok`,
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
	mapAsync<U>(f: (value: T) => Promise<U>): AsyncResult<U, E>;

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
	mapOr<A, B>(defaultValue: A, f: (value: T) => B): A | B;

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
	mapOrAsync<A, B>(defaultValue: A, f: (value: T) => Promise<B>): Promise<A | B>;

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
	mapOrElse<A, B>(defaultValue: (error: E) => A, f: (value: T) => B): A | B;

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
	mapOrElseAsync<A, B>(
		defaultValue: (error: E) => Promise<A>,
		f: (value: T) => Promise<B>,
	): Promise<A | B>;

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
	mapErr<F>(f: (error: E) => F): Result<T, F>;

	/**
	 * Maps a `Result<T, E>` to `AsyncResult<T, F>` by applying an async function to a contained `Err` value,
	 * leaving an `Ok` value untouched.
	 *
	 * This function can be used to pass through a successful result while handling an error.
	 *
	 * @param f - The async function to apply to the contained error
	 * @returns A new AsyncResult with the async function applied to the contained error if `Err`,
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
	mapErrAsync<F>(f: (error: E) => Promise<F>): AsyncResult<T, F>;

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
	inspect(f: (value: T) => void): this;

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
	inspectAsync(f: (value: T) => Promise<void>): AsyncResult<T, E>;

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
	inspectErr(f: (error: E) => void): this;

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
	inspectErrAsync(f: (error: E) => Promise<void>): AsyncResult<T, E>;

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
	expect(message: string): T;

	/**
	 * Returns the contained `Ok` value, if exists, otherwise returns `null`.
	 *
	 * Because this function may return `null`, its use is generally discouraged.
	 * Instead, prefer to:
	 * - Use pattern matching with `match()` and handle the `Err` case explicitly
	 * - Use `unwrapOr()`, `unwrapOrElse()`, or similar methods
	 *
	 * Type is narrowed to `T` if the result is already checked to be `Ok`.
	 *
	 * @returns The contained value, if exists, otherwise `null`.
	 *
	 * @example
	 * ```typescript
	 * const x = Ok(2)
	 * assertEquals(x.unwrap(), 2)
	 *
	 * const y = Err("emergency failure")
	 * assertEquals(y.unwrap(), null)
	 *
	 * const z = Result.fromThrowable(...) // Result<T, E>
	 * if (z.isOk()) {
	 *     const a = z.unwrap() // `a` has type `T`
	 * } else {
	 *     const b = z.unwrap() // `b` has type `null`
	 * }
	 * ```
	 */
	unwrapUnchecked(): T | null;

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
	expectErr(message: string): E;

	/**
	 * Returns the contained `Err` value, if exists, otherwise returns `null`.
	 *
	 * Because this function may return `null`, its use is generally discouraged.
	 * Instead, prefer to:
	 * - Use pattern matching with `match()` and handle the `Ok` case explicitly
	 * - Use similar methods that handle both cases
	 *
	 * Type is narrowed to `E` if the result is already checked to be `Err`.
	 *
	 * @returns The contained error value, if exists, otherwise `null`.
	 *
	 * @example
	 * ```typescript
	 * const x: Result<number, string> = Ok(2);
	 * assertEquals(x.unwrapErrUnchecked(), null);
	 *
	 * const y: Result<number, string> = Err("emergency failure");
	 * assertEquals(y.unwrapErrUnchecked(), "emergency failure");
	 *
	 * const z = Result.fromThrowable(...); // Result<T, E>
	 * if (z.isErr()) {
	 *     const e = z.unwrapErrUnchecked() // `e` has type `E`
	 * } else {
	 *     const u = z.unwrapErr() // `u` has type `null`
	 * }
	 * ```
	 */
	unwrapErrUnchecked(): E | null;

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
	and<U, F>(other: Result<U, F>): Result<U, E | F>;

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
	andThen<U, F>(f: (value: T) => Result<U, F>): Result<U, E | F>;

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
	andThenAsync<U, F>(
		f: (value: T) => AsyncResult<U, F> | Promise<Result<U, F>>,
	): AsyncResult<U, E | F>;

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
	or<U, F>(other: Result<U, F>): Result<T | U, F>;

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
	orElse<U, F>(f: (error: E) => Result<U, F>): Result<T | U, F>;

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
	orElseAsync<U, F>(
		f: (error: E) => AsyncResult<U, F> | Promise<Result<U, F>>,
	): AsyncResult<T | U, F>;

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
	unwrapOr<U>(defaultValue: U): T | U;

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
	unwrapOrElse<U>(defaultValue: (error: E) => U): T | U;

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
	unwrapOrElseAsync<U>(defaultValue: (error: E) => Promise<U>): Promise<T | U>;

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
	flatten<R extends Result<any, any>>(this: Result<R, E>): Result<InferOk<R>, InferErr<R> | E>;

	// Deprecated

	/**
	 * @deprecated You can yield the `Result` directly: `yield* Ok(1)` instead of `yield* Ok(1).try()`.
	 */
	try(): Generator<Err<E, never>, T>;

	/**
	 * Returns the contained value, if it exists.
	 *
	 * @deprecated Use `unwrap()` instead.
	 */
	value(): T | undefined;

	/**
	 * Returns the contained error, if it exists.
	 *
	 * @deprecated Use `unwrapErr()` instead.
	 */
	error(): E | undefined;
}

class OkImpl<T, E> implements ResultMethods<T, E> {
	private readonly _value: T;

	public constructor(value: T) {
		this._value = value;
	}

	public get [Symbol.toStringTag](): "Ok" {
		return "Ok";
	}

	public toJSON(): { Ok: T } {
		return { Ok: this._value };
	}

	public toString(): `Ok(${string})` {
		return `Ok(${String(this._value)})`;
	}

	public [nodejsUtilInspectCustom](): string {
		return this.toString();
	}

	// deno-lint-ignore require-yield
	public *[Symbol.iterator](): Generator<Err<E, never>, T> {
		return this._value;
	}

	public match<A, B>(pattern: ResultMatch<T, E, A, B>): A {
		return pattern.Ok(this._value);
	}

	public matchAsync<A, B>(pattern: ResultMatchAsync<T, E, A, B>): Promise<A> {
		return pattern.Ok(this._value);
	}

	public isOk(): this is Ok<T, E> {
		return true;
	}

	public isOkAnd(f: (value: T) => boolean): this is Ok<T, E> {
		return f(this._value);
	}

	public isErr(): this is Err<E, T> {
		return false;
	}

	public isErrAnd(_f: (error: E) => boolean): this is Err<E, T> {
		return false;
	}

	public ok(): Option<T> {
		return Some(this._value);
	}

	public err(): Option<E> {
		return None as unknown as Option<E>;
	}

	public map<U>(f: (value: T) => U): Result<U, E> {
		return Ok(f(this._value));
	}

	public mapAsync<U>(f: (value: T) => Promise<U>): AsyncResult<U, E> {
		return new AsyncResult(f(this._value).then((v) => Ok(v)));
	}

	public mapOr<A, B>(_defaultValue: A, f: (value: T) => B): A | B {
		return f(this._value);
	}

	public mapOrAsync<A, B>(_defaultValue: A, f: (value: T) => Promise<B>): Promise<A | B> {
		return f(this._value);
	}

	public mapOrElse<A, B>(_defaultValue: (error: E) => A, f: (value: T) => B): A | B {
		return f(this._value);
	}

	public mapOrElseAsync<A, B>(
		_defaultValue: (error: E) => Promise<A>,
		f: (value: T) => Promise<B>,
	): Promise<A | B> {
		return f(this._value);
	}

	public mapErr<F>(_f: (error: E) => F): Result<T, F> {
		return this as unknown as Result<T, F>;
	}

	public mapErrAsync<F>(_f: (error: E) => Promise<F>): AsyncResult<T, F> {
		return new AsyncResult(Promise.resolve(this as unknown as Result<T, F>));
	}

	public inspect(f: (value: T) => void): this {
		f(this._value);
		return this;
	}

	public inspectAsync(f: (value: T) => Promise<void>): AsyncResult<T, E> {
		return new AsyncResult(f(this._value).then(() => this as unknown as Result<T, E>));
	}

	public inspectErr(_f: (error: E) => void): this {
		return this;
	}

	public inspectErrAsync(_f: (error: E) => Promise<void>): AsyncResult<T, E> {
		return this as unknown as AsyncResult<T, E>;
	}

	public expect(_message: string): T {
		return this._value;
	}

	public unwrapUnchecked(): T {
		return this._value;
	}

	public expectErr(_message: string): never {
		throw new Panic(`${_message}: ${this._value}`, { cause: this._value });
	}

	public unwrapErrUnchecked(): null {
		return null;
	}

	public and<U, F>(other: Result<U, F>): Result<U, E | F> {
		return other as Result<U, E | F>;
	}

	public andThen<U, F>(f: (value: T) => Result<U, F>): Result<U, E | F> {
		return f(this._value) as Result<U, E | F>;
	}

	public andThenAsync<U, F>(
		f: (value: T) => AsyncResult<U, F> | Promise<Result<U, F>>,
	): AsyncResult<U, E | F> {
		return new AsyncResult(f(this._value) as unknown as Promise<Result<U, E | F>>);
	}

	public or<U, F>(_other: Result<U, F>): Result<T | U, F> {
		return this as unknown as Result<T | U, F>;
	}

	public orElse<U, F>(_f: (error: E) => Result<U, F>): Result<T | U, F> {
		return this as unknown as Result<T | U, F>;
	}

	public orElseAsync<U, F>(
		_f: (error: E) => AsyncResult<U, F> | Promise<Result<U, F>>,
	): AsyncResult<T | U, F> {
		return new AsyncResult(Promise.resolve(this as unknown as Result<T | U, F>));
	}

	public unwrapOr<U>(_defaultValue: U): T | U {
		return this._value;
	}

	public unwrapOrElse<U>(_defaultValue: (error: E) => U): T | U {
		return this._value;
	}

	public unwrapOrElseAsync<U>(_defaultValue: (error: E) => Promise<U>): Promise<T | U> {
		return Promise.resolve(this._value);
	}

	public flatten<R extends Result<any, any>>(
		this: Result<R, E>,
	): Result<InferOk<R>, InferErr<R> | E> {
		return this.expect("should flatten the result");
	}

	public unwrap(): T {
		return this._value;
	}

	// Deprecated

	public try(): Generator<Err<E, never>, T> {
		return this[Symbol.iterator]();
	}

	public value(): T {
		return this._value;
	}

	public error(): undefined {
		return undefined;
	}
}

export interface Ok<T, E = unknown> extends OkImpl<T, E> {
	(value: T): Ok<T, E>;
	prototype: OkImpl<T, E>;
}

export function Ok<T, E = unknown>(value: T): Ok<T, E> {
	return new OkImpl(value) as Ok<T, E>;
}
Ok.prototype = OkImpl.prototype;

class ErrImpl<E, T> implements ResultMethods<T, E> {
	private readonly _value: E;

	public constructor(value: E) {
		this._value = value;
	}

	public get [Symbol.toStringTag](): "Err" {
		return "Err";
	}

	public toJSON(): { Err: E } {
		return { Err: this._value };
	}

	public toString(): `Err(${string})` {
		return `Err(${String(this._value)})`;
	}

	public [nodejsUtilInspectCustom](): string {
		return this.toString();
	}

	public *[Symbol.iterator](): Generator<Err<E, never>, T> {
		// deno-lint-ignore no-this-alias
		const self = this;
		// @ts-expect-error -- This is structurally equivalent and safe
		yield self;
		// @ts-expect-error -- This is structurally equivalent and safe
		return self as T;
	}

	public match<A, B>(pattern: ResultMatch<T, E, A, B>): B {
		return pattern.Err(this._value);
	}

	public matchAsync<A, B>(pattern: ResultMatchAsync<T, E, A, B>): Promise<B> {
		return pattern.Err(this._value);
	}

	public isOk(): this is Ok<T, E> {
		return false;
	}

	public isOkAnd(_f: (value: T) => boolean): this is Ok<T, E> {
		return false;
	}

	public isErr(): this is Err<E, T> {
		return true;
	}

	public isErrAnd(f: (error: E) => boolean): this is Err<E, T> {
		return f(this._value);
	}

	public ok(): Option<T> {
		return None as unknown as Option<T>;
	}

	public err(): Option<E> {
		return Some(this._value);
	}

	public map<U>(_f: (value: T) => U): Result<U, E> {
		return this as unknown as Result<U, E>;
	}

	public mapAsync<U>(_f: (value: T) => Promise<U>): AsyncResult<U, E> {
		return new AsyncResult(Promise.resolve(this as unknown as Result<U, E>));
	}

	public mapOr<A, B>(defaultValue: A, _f: (value: T) => B): A {
		return defaultValue;
	}

	public mapOrAsync<A, B>(defaultValue: A, _f: (value: T) => Promise<B>): Promise<A> {
		return Promise.resolve(defaultValue);
	}

	public mapOrElse<A, B>(defaultValue: (error: E) => A, _f: (value: T) => B): A {
		return defaultValue(this._value);
	}

	public mapOrElseAsync<A, B>(
		defaultValue: (error: E) => Promise<A>,
		_f: (value: T) => Promise<B>,
	): Promise<A> {
		return defaultValue(this._value);
	}

	public mapErr<F>(f: (error: E) => F): Result<T, F> {
		return Err(f(this._value));
	}

	public mapErrAsync<F>(f: (error: E) => Promise<F>): AsyncResult<T, F> {
		return new AsyncResult(f(this._value).then((v) => Err(v)));
	}

	public inspect(_f: (value: T) => void): this {
		return this;
	}

	public inspectAsync(_f: (value: T) => Promise<void>): AsyncResult<T, E> {
		return new AsyncResult(Promise.resolve(this as unknown as Result<T, E>));
	}

	public inspectErr(f: (error: E) => void): this {
		f(this._value);
		return this;
	}

	public inspectErrAsync(f: (error: E) => Promise<void>): AsyncResult<T, E> {
		return new AsyncResult(f(this._value).then(() => this as unknown as Result<T, E>));
	}

	public expect(message: string): never {
		throw new Panic(`${message}: ${this._value}`, { cause: this._value });
	}

	public unwrapUnchecked(): null {
		return null;
	}

	public unwrapErrUnchecked(): E {
		return this._value;
	}

	public expectErr(_message: string): E {
		return this._value;
	}

	public and<U, F>(_other: Result<U, F>): Result<U, E | F> {
		return this as unknown as Result<U, E | F>;
	}

	public andThen<U, F>(_f: (value: T) => Result<U, F>): Result<U, E | F> {
		return this as unknown as Result<U, E | F>;
	}

	public andThenAsync<U, F>(
		_f: (value: T) => AsyncResult<U, F> | Promise<Result<U, F>>,
	): AsyncResult<U, E | F> {
		return new AsyncResult(Promise.resolve(this as unknown as Result<U, E | F>));
	}

	public or<U, F>(other: Result<U, F>): Result<T | U, F> {
		return other as Result<T | U, F>;
	}

	public orElse<U, F>(f: (error: E) => Result<U, F>): Result<T | U, F> {
		return f(this._value) as Result<T | U, F>;
	}

	public orElseAsync<U, F>(
		f: (error: E) => AsyncResult<U, F> | Promise<Result<U, F>>,
	): AsyncResult<T | U, F> {
		return new AsyncResult(f(this._value) as unknown as Promise<Result<T | U, F>>);
	}

	public unwrapOr<U>(_defaultValue: U): T | U {
		return _defaultValue;
	}

	public unwrapOrElse<U>(_defaultValue: (error: E) => U): U {
		return _defaultValue(this._value);
	}

	public unwrapErr(): E {
		return this._value;
	}

	public unwrapOrElseAsync<U>(_defaultValue: (error: E) => Promise<U>): Promise<U> {
		return _defaultValue(this._value);
	}

	public flatten<R extends Result<any, any>>(
		this: Result<R, E>,
	): Result<InferOk<R>, InferErr<R> | E> {
		return this as Result<InferOk<R>, InferErr<R> | E>;
	}

	// Deprecated

	public try(): Generator<Err<E, never>, T> {
		return this[Symbol.iterator]();
	}

	public value(): undefined {
		return undefined;
	}

	public error(): E {
		return this._value;
	}
}

export interface Err<E, T = unknown> extends ErrImpl<E, T> {
	(value: E): Err<E, T>;
	prototype: ErrImpl<E, T>;
}

export function Err<E, T = unknown>(value: E): Err<E, T> {
	return new ErrImpl(value) as Err<E, T>;
}
Err.prototype = ErrImpl.prototype;

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
	 * Tries to resolve a promise and returns the result as a `AsyncResult`.
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
	 * // const result: AsyncResult<number, Error>
	 * const result = Result.fromPromise(Promise.resolve(42))
	 * ```
	 */
	export function fromPromise<T>(promise: Promise<T>): AsyncResult<T, Error> {
		return new AsyncResult(
			promise.then(
				(value) => Ok(value),
				(error) => Err(handleCaughtError(error)),
			),
		);
	}

	/**
	 * Tries to execute an async function and returns the result as a `AsyncResult`.
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
	 * // const result: AsyncResult<number, Error>
	 * const result = Result.fromThrowableAsync((): Promise<number> => {
	 *   if (Math.random() > 0.5) {
	 *     throw new Error("random error")
	 *   } else {
	 *     return Promise.resolve(42)
	 *   }
	 * })
	 */
	export function fromThrowableAsync<T>(f: () => Promise<T>): AsyncResult<T, Error> {
		async function safe(): Promise<Result<T, Error>> {
			try {
				return Ok(await f() as T);
			} catch (error) {
				return Err(handleCaughtError(error));
			}
		}
		return new AsyncResult(safe());
	}

	/**
	 * @deprecated Use `Result.fromThrowable()` instead.
	 */
	export const from = fromThrowable;
}
