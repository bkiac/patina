/**
 * This module contains the `AsyncResult` class, which is a promise that resolves to a `Result`.
 * @module
 */

import { AsyncOption } from "./async_option.ts";
import { Err, Ok, type Result, type ResultMatch, type ResultMatchAsync } from "./result.ts";
import type { InferErr, InferOk } from "./util.ts";

type WrappedResult<T, E> = Promise<Result<T, E>> | PromiseLike<Result<T, E>> | AsyncResult<T, E>;

/**
 * A promise that resolves to a `Result`.
 *
 * This class is useful for chaining multiple asynchronous operations that return a `Result`.
 *
 * This class also implements the `PromiseLike<Result<T, E>>` interface, so it can be awaited like a `Promise` to convert to a `Result`.
 */
export class AsyncResult<T, E> implements PromiseLike<Result<T, E>> {
	/**
	 * Takes an array of `AsyncResult`s and returns `Ok` when all of them are `Ok`, otherwise returns the first `Err`.
	 *
	 * Uses `Promise.all()` under the hood.
	 *
	 * @param results - The `AsyncResult`s to resolve
	 * @returns A new `AsyncResult` that resolves to an array of the results of the given `AsyncResult`s
	 *
	 * @example
	 * ```typescript
	 * const allOks = [AsyncOk(1), AsyncOk(2)];
	 * const result = AsyncResult.all(allOks);
	 * assertEquals(await result, Ok([1, 2]));
	 *
	 * const withErr = [AsyncOk(1), AsyncErr("error")];
	 * const result2 = AsyncResult.all(withErr);
	 * assertEquals(await result2, Err("error"));
	 * ```
	 */
	public static all<A extends readonly AsyncResult<any, any>[] | []>(
		results: A,
	): AsyncResult<
		{ -readonly [I in keyof A]: InferOk<Awaited<A[I]>> },
		InferErr<Awaited<A[number]>>
	> {
		const promises = [];
		for (const result of results) {
			promises.push(result.toPromise());
		}
		return new AsyncResult(
			Promise.all(promises).then((values) => {
				return Ok(values as any);
			}).catch((e) => {
				return Err(e);
			}),
		);
	}

	/**
	 * Takes an array of `AsyncResult`s and returns a `Promise` that resolves to an array of `Result`s.
	 *
	 * Uses `Promise.allSettled()` under the hood.
	 *
	 * @param results - The `AsyncResult`s to resolve
	 * @returns A promise that resolves to an array of the results of the given `AsyncResult`s
	 *
	 * @example
	 * ```typescript
	 * const allOks = [AsyncOk(1), AsyncErr("error"), AsyncOk(2)];
	 * const result = AsyncResult.allSettled(allOks);
	 * assertEquals(await result, [Ok(1), Err("error"), Ok(2)]);
	 * ```
	 */
	public static async allSettled<A extends readonly AsyncResult<any, any>[] | []>(
		results: A,
	): Promise<
		{ -readonly [I in keyof A]: Result<InferOk<Awaited<A[I]>>, InferErr<Awaited<A[I]>>> }
	> {
		const promises = [];
		for (const result of results) {
			promises.push(result.toPromise());
		}
		return (await Promise.allSettled(promises)).map((result) => {
			if (result.status === "fulfilled") {
				return Ok(result.value);
			}
			return Err(result.reason);
		}) as any;
	}

	/**
	 * Takes an array of `AsyncResult`s and returns the first `Ok`, otherwise returns an `Err` containing an array of all the errors.
	 *
	 * Uses `Promise.any()` under the hood.
	 *
	 * @param results - The `AsyncResult`s to resolve
	 * @returns A new `AsyncResult` that resolves to the first `Ok` result, or an `Err` containing all the errors if all results are `Err`
	 *
	 * @example
	 * ```typescript
	 * const anyOk = [AsyncOk(1), AsyncErr("error"), AsyncOk(2)];
	 * const result = AsyncResult.any(anyOk);
	 * assertEquals(await result, Ok(1));
	 *
	 * const allErrs = [AsyncErr("error1"), AsyncErr("error2")];
	 * const result2 = AsyncResult.any(allErrs);
	 * assertEquals(await result2, Err(["error1", "error2"]));
	 * ```
	 */
	public static any<A extends readonly AsyncResult<any, any>[] | []>(
		results: A,
	): AsyncResult<
		InferOk<Awaited<A[number]>>,
		{ -readonly [I in keyof A]: InferErr<Awaited<A[I]>> }
	> {
		const promises = [];
		for (const result of results) {
			promises.push(result.toPromise());
		}
		return new AsyncResult(
			Promise.any(promises).then((value) => {
				return Ok(value);
			}).catch((e) => {
				// Error caught thrown by Promise.any is an AggregateError
				const ae = e as AggregateError;
				return Err(ae.errors);
			}),
		) as any;
	}

	/**
	 * Takes an array of `AsyncResult`s and returns the first settled `Result`.
	 *
	 * Uses `Promise.race()` under the hood.
	 *
	 * @param results - The `AsyncResult`s to resolve
	 * @returns A new `AsyncResult` that resolves to the first settled `Result`
	 *
	 * @example
	 * ```typescript
	 * const quick: AsyncResult<string, string> = new AsyncResult(
	 * 	new Promise((resolve) => {
	 * 		setTimeout(
	 * 			resolve,
	 * 			100,
	 * 			Ok("quick"),
	 * 		);
	 * 	}),
	 * );
	 * const slow: AsyncResult<string, string> = new AsyncResult(
	 * 	new Promise((resolve) => {
	 * 		setTimeout(
	 * 			resolve,
	 * 			1000,
	 * 			Ok("slow"),
	 * 		);
	 * 	}),
	 * );
	 * const result = AsyncResult.race([quick, slow]);
	 * assertEquals(await result, Ok("quick"));
	 * ```
	 */
	public static race<A extends readonly AsyncResult<any, any>[] | []>(
		results: A,
	): AsyncResult<
		InferOk<Awaited<A[number]>>,
		InferErr<Awaited<A[number]>>
	> {
		const promises = [];
		for (const result of results) {
			promises.push(result.toPromise());
		}
		return new AsyncResult(
			Promise.race(promises).then((value) => {
				return Ok(value);
			}).catch((e) => {
				return Err(e);
			}),
		);
	}

	public readonly promise: WrappedResult<T, E>;

	public constructor(promise: WrappedResult<T, E>) {
		this.promise = promise;
	}

	public get [Symbol.toStringTag](): "AsyncResult" {
		return "AsyncResult";
	}

	public toJSON(): {
		AsyncResult: WrappedResult<T, E>;
	} {
		return { AsyncResult: this.promise };
	}

	public toString(): string {
		return `AsyncResult(${this.promise.toString()})`;
	}

	public [Symbol.for("nodejs.util.inspect.custom")](): {
		AsyncResult: WrappedResult<T, E>;
	} {
		return this.toJSON();
	}

	/**
	 * Converts an `AsyncResult` to a regular `Promise`.
	 *
	 * @returns A promise that resolves to the contained value if `Ok`, otherwise throws the contained error
	 *
	 * @example
	 * ```typescript
	 * const x: AsyncResult<number, string> = AsyncOk(2)
	 * assertEquals(await x.toPromise(), 2)
	 *
	 * const y: AsyncResult<number, string> = AsyncErr("error")
	 * await y.toPromise().catch((e) => assertEquals(e, "error"))
	 * ```
	 */
	public async toPromise(): Promise<T> {
		return (await this).unwrapOrElse((e) => {
			throw e;
		});
	}

	/**
	 * Returns a generator that yields the contained value (if `Ok`) or an error (if `Err`).
	 *
	 * See `tryBlock()` and `tryBlockAsync()` for more information.
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

	/**
	 * Matches the result with two functions.
	 *
	 * @param pattern - The pattern to match the result against
	 * @returns The result of the matched function
	 *
	 * @example
	 * ```typescript
	 * const x: AsyncResult<number, string> = AsyncOk(2)
	 * assertEquals(await x.match({
	 * 	Ok: (v) => v * 2,
	 * 	Err: (e) => e.length,
	 * }), 4)
	 *
	 * const y: AsyncResult<number, string> = AsyncErr("error")
	 * assertEquals(await y.match({
	 * 	Ok: (v) => v * 2,
	 * 	Err: (e) => e.length,
	 * }), 5)
	 * ```
	 */
	public async match<A, B>(matcher: ResultMatch<T, E, A, B>): Promise<A | B> {
		return (await this).match(matcher);
	}

	/**
	 * Matches the result with two async functions.
	 *
	 * @param pattern - The pattern to match the result against
	 * @returns A promise that resolves to the result of the matched function
	 *
	 * @example
	 * ```typescript
	 * const x: AsyncResult<number, string> = AsyncOk(2)
	 * assertEquals(await x.matchAsync({
	 * 	Ok: async (v) => v * 2,
	 * 	Err: async (e) => e.length,
	 * }), 4)
	 *
	 * const y: AsyncResult<number, string> = AsyncErr("error")
	 * assertEquals(await y.matchAsync({
	 * 	Ok: async (v) => v * 2,
	 * 	Err: async (e) => e.length,
	 * }), 5)
	 * ```
	 */
	public async matchAsync<A, B>(matcher: ResultMatchAsync<T, E, A, B>): Promise<A | B> {
		return (await this).matchAsync(matcher);
	}

	/**
	 * Converts from `AsyncResult<T, E>` to `AsyncOption<T>`, discarding the error if any.
	 *
	 * @returns An `Option` containing the success value if this is `Ok`, or `None` if this is `Err`
	 *
	 * @example
	 * ```typescript
	 * const x: AsyncResult<number, string> = AsyncOk(2);
	 * assertEquals(await x.ok(), Some(2));
	 *
	 * const x: AsyncResult<number, string> = AsyncErr("Nothing here");
	 * assertEquals(await x.ok(), None);
	 * ```
	 */
	public ok(): AsyncOption<T> {
		return new AsyncOption(this.then((result) => result.ok()));
	}

	/**
	 * Converts from `AsyncResult<T, E>` to `AsyncOption<E>`, discarding the success value if any.
	 *
	 * @returns An `AsyncOption` containing the error value if this is `Err`, or `None` if this is `Ok`.
	 *
	 * @example
	 * ```typescript
	 * const x: AsyncResult<number, string> = AsyncOk(2);
	 * assertEquals(await x.err(), None);
	 *
	 * const x: AsyncResult<number, string> = AsyncErr("Nothing here");
	 * assertEquals(await x.err(), Some("Nothing here"));
	 * ```
	 */
	public err(): AsyncOption<E> {
		return new AsyncOption(this.then((result) => result.err()));
	}

	/**
	 * Returns `other` if the result is `Ok`, otherwise returns `this` (as `Err`).
	 *
	 * @param other - The result to return if this result is `Ok`.
	 * @returns The other result if this result is `Ok`, otherwise this result's error.
	 *
	 * @example
	 * ```typescript
	 * let x: AsyncResult<number, string> = AsyncOk(2)
	 * let y: AsyncResult<string, string> = AsyncErr("late error")
	 * assertEquals(await x.and(y), Err("late error"))
	 *
	 * let x: AsyncResult<number, string> = AsyncErr("early error")
	 * let y: AsyncResult<string, string> = AsyncOk("foo")
	 * assertEquals(await x.and(y), Err("early error"))
	 *
	 * let x: AsyncResult<number, string> = AsyncErr("not a 2")
	 * let y: AsyncResult<string, string> = AsyncErr("late error")
	 * assertEquals(await x.and(y), Err("not a 2"))
	 *
	 * let x: AsyncResult<number, string> = AsyncOk(2)
	 * let y: AsyncResult<string, string> = AsyncOk("different result type")
	 * assertEquals(await x.and(y), Ok("different result type"))
	 * ```
	 */
	public and<U, F>(other: AsyncResult<U, F>): AsyncResult<U, E | F> {
		return new AsyncResult(
			this.then((result) => other.then((otherResult) => result.and(otherResult))),
		);
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
	 * assertEquals(await AsyncOk(100).andThen(divideThenToString), Ok("50"))
	 * assertEquals(await AsyncOk(100).andThen(divideThenToString), Err("division by zero"))
	 * assertEquals(await AsyncErr("not a number").andThen(divideThenToString), Err("not a number"))
	 *
	 * // Often used to chain fallible operations that may return Err
	 * const json = await Result.fromThrowableAsync(async () => {
	 *     return readFile("config.json", "utf8");
	 * }).andThen((contents) => {
	 *     return Result.fromThrowable(() => JSON.parse(contents));
	 * });
	 * assertEquals(json.isOk(), true)
	 *
	 * const shouldFail = await Result.fromThrowableAsync(() => {
	 *     return readFile("/bad/path", "utf8");
	 * }).andThen((contents) => {
	 *     return Result.fromThrowable(() => JSON.parse(contents));
	 * });
	 * assertEquals(shouldFail.isErr(), true)
	 * ```
	 */
	public andThen<U, F>(f: (value: T) => Result<U, F>): AsyncResult<U, E | F> {
		return new AsyncResult(this.then((result) => result.andThen((value) => f(value))));
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
	 * assertEquals(await AsyncOk(100, 2).andThenAsync(divideThenToString), Ok("50"))
	 * assertEquals(await AsyncOk(100, 0).andThenAsync(divideThenToString), Err("division by zero"))
	 * assertEquals(await AsyncErr("not a number").andThenAsync(divideThenToString), Err("not a number"))
	 *
	 * // Often used to chain fallible operations that may return Err
	 * const json = await Result.fromThrowableAsync(async () => {
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
	public andThenAsync<U, F>(f: (value: T) => Promise<Result<U, F>>): AsyncResult<U, E | F> {
		return new AsyncResult(this.then((result) => result.andThenAsync((value) => f(value))));
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
	 * const x: AsyncResult<number, string> = AsyncErr("emergency failure");
	 * await x.expect("Testing expect"); // throws Panic: Testing expect: emergency failure
	 * ```
	 *
	 * It is recommended that expect messages describe the reason you expect the Result should be Ok.
	 *
	 * @example
	 * ```typescript
	 * const path = await Result.fromThrowableAsync(async () => {
	 *     return readFile("/etc/important.conf", "utf8");
	 * }).expect("config file should exist");
	 * ```
	 */
	public async expect(message: string): Promise<T> {
		return (await this).expect(message);
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
	 * const x: AsyncResult<number, string> = AsyncOk(10);
	 * await x.expectErr("Testing expectErr"); // throws Panic: Testing expectErr: 10
	 * ```
	 */
	public async expectErr(message: string): Promise<E> {
		return (await this).expectErr(message);
	}

	/**
	 * Converts from `AsyncResult<Result<T, F>, E>` to `AsyncResult<T, E | F>`.
	 *
	 * @returns A flattened `AsyncResult<T, E | F>`.
	 *
	 * @example
	 * ```typescript
	 * // Basic usage:
	 * let x: AsyncResult<Result<string, number>, number> = AsyncOk(Ok("hello"));
	 * assertEquals(await x.flatten(), Ok("hello"));
	 *
	 * let x: AsyncResult<Result<string, number>, number> = AsyncOk(Err(6));
	 * assertEquals(await x.flatten(), Err(6));
	 *
	 * let x: AsyncResult<Result<string, number>, number> = AsyncErr(6);
	 * assertEquals(await x.flatten(), Err(6));
	 *
	 * // Flattening only removes one level of nesting at a time:
	 * let x: AsyncResult<Result<Result<string, number>, number>, number> = AsyncOk(Ok(Ok("hello")));
	 * assertEquals(await x.flatten(), Ok(Ok("hello")));
	 * assertEquals(await x.flatten().flatten(), Ok("hello"));
	 * ```
	 */
	public flatten<R extends Result<any, any>>(
		this: AsyncResult<R, E>,
	): AsyncResult<InferOk<R>, InferErr<R> | E> {
		return new AsyncResult(this.then((result) => result.flatten()));
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
	 * const x = Result.fromThrowableAsync(async () => parseInt("4"))
	 *     .inspect(x => console.log(`original: ${x}`)) // prints: original: 4
	 *     .map(x => Math.pow(x, 3))
	 *     .expect("failed to parse number");
	 * ```
	 */
	public inspect(f: (value: T) => void): AsyncResult<T, E> {
		return new AsyncResult(this.then((result) => result.inspect(f)));
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
	public inspectAsync(f: (value: T) => Promise<void>): AsyncResult<T, E> {
		return new AsyncResult(this.then((result) => result.inspectAsync(f)));
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
	 * const result = await Result
	 *     .fromThrowableAsync(async () => readFileSync("address.txt", "utf8"))
	 *     .inspectErr(async (e) => console.error(`failed to read file: ${e}`))
	 *     .map(async (contents) => processContents(contents));
	 * ```
	 */
	public inspectErr(f: (error: E) => void): AsyncResult<T, E> {
		return new AsyncResult(this.then((result) => result.inspectErr(f)));
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
	 * const result = Result.fromThrowable(() => readFileSync("address.txt", "utf8"))
	 *     .inspectErrAsync(async (e) => console.error(`failed to read file: ${e}`))
	 *     .map((contents) => processContents(contents));
	 * ```
	 */
	public inspectErrAsync(f: (error: E) => Promise<void>): AsyncResult<T, E> {
		return new AsyncResult(this.then((result) => result.inspectErrAsync(f)));
	}

	/**
	 * Maps a `AsyncResult<T, E>` to `AsyncResult<U, E>` by applying a function to a contained `Ok` value,
	 * leaving an `Err` value untouched.
	 *
	 * This function can be used to compose the results of two functions.
	 *
	 * @param f - The function to apply to the contained value
	 * @returns A new AsyncResult with the function applied to the contained value if `Ok`,
	 *          or the original error if `Err`
	 *
	 * @example
	 * ```typescript
	 * const x = await AsyncOk(2).map((x) => x.toString());
	 * assertEquals(x, Ok("2"));
	 *
	 * const x = await AsyncErr("error").map((x) => x.toString());
	 * assertEquals(x, Err("error"));
	 *
	 * // Processing lines of numbers:
	 * const lines = "1\n2\n3\n4";
	 *
	 * for (const line of lines.split("\n")) {
	 *     await Result.fromThrowableAsync(async () => parseInt(line))
	 *         .map((n) => n * 2)
	 *         .match({
	 *             Ok: (n) => console.log(n),
	 *             Err: () => {} // Skip invalid numbers
	 *         });
	 * }
	 * ```
	 */
	public map<U>(f: (value: T) => U): AsyncResult<U, E> {
		return new AsyncResult(this.then((result) => result.map(f)));
	}

	/**
	 * Maps a `AsyncResult<T, E>` to `AsyncResult<U, E>` by applying an async function to a contained `Ok` value,
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
	 * const x = await AsyncOk(2).mapAsync(async (x) => x.toString());
	 * assertEquals(x, Ok("2"));
	 *
	 * const x = await AsyncErr("error").mapAsync(async (x) => x.toString());
	 * assertEquals(x, Err("error"));
	 *
	 * // Processing lines of numbers:
	 * const lines = "1\n2\n3\n4";
	 *
	 * for (const line of lines.split("\n")) {
	 *     await Result.fromThrowableAsync(async () => parseInt(line))
	 *         .mapAsync(async (n) => n * 2)
	 *         .match({
	 *             Ok: (n) => console.log(n),
	 *             Err: () => {} // Skip invalid numbers
	 *         });
	 * }
	 * ```
	 */
	public mapAsync<U>(f: (value: T) => Promise<U>): AsyncResult<U, E> {
		return new AsyncResult(this.then((result) => result.mapAsync(f)));
	}

	/**
	 * Maps a `AsyncResult<T, E>` to `AsyncResult<T, F>` by applying a function to a contained `Err` value,
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
	 * const x: AsyncResult<number, number> = AsyncOk(2);
	 * assertEquals(await x.mapErr(stringify), Ok(2));
	 *
	 * const x: AsyncResult<number, number> = AsyncErr(13);
	 * assertEquals(await x.mapErr(stringify), Err("error code: 13"));
	 * ```
	 */
	public mapErr<F>(f: (error: E) => F): AsyncResult<T, F> {
		return new AsyncResult(this.then((result) => result.mapErr(f)));
	}

	/**
	 * Maps a `AsyncResult<T, E>` to `AsyncResult<T, F>` by applying an async function to a contained `Err` value,
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
	 * const x: AsyncResult<number, number> = AsyncOk(2);
	 * assertEquals(await x.mapErrAsync(stringify), Ok(2));
	 *
	 * const x: AsyncResult<number, number> = AsyncErr(13);
	 * assertEquals(await x.mapErrAsync(stringify), Err("error code: 13"));
	 * ```
	 */
	public mapErrAsync<F>(f: (error: E) => Promise<F>): AsyncResult<T, F> {
		return new AsyncResult(this.then((result) => result.mapErrAsync(f)));
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
	 * let x: AsyncResult<string, string> = AsyncOk("foo")
	 * assertEquals(await x.mapOr(42, (v) => v.length), 3)
	 *
	 * let x: AsyncResult<string, string> = AsyncErr("bar")
	 * assertEquals(await x.mapOr(42, (v) => v.length), 42)
	 * ```
	 */
	public async mapOr<A, B>(defaultValue: A, f: (value: T) => B): Promise<A | B> {
		return (await this).mapOr(defaultValue, f);
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
	 * let x: AsyncResult<string, string> = AsyncOk("foo")
	 * assertEquals(await x.mapOrAsync(42, async (v) => v.length), 3)
	 *
	 * let x: AsyncResult<string, string> = AsyncErr("bar")
	 * assertEquals(await x.mapOrAsync(42, async (v) => v.length), 42)
	 * ```
	 */
	public async mapOrAsync<A, B>(defaultValue: A, f: (value: T) => Promise<B>): Promise<A | B> {
		return (await this).mapOrAsync(defaultValue, f);
	}

	/**
	 * Maps a `AsyncResult<T, E>` to `A | B` by applying fallback function `defaultValue` to a contained `Err` value,
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
	 * let x: AsyncResult<string, string> = AsyncOk("foo");
	 * assertEquals(await x.mapOrElse((e) => k * 2, (v) => v.length), 3);
	 *
	 * let x: Result<string, string> = Err("bar");
	 * assertEquals(x.mapOrElse((e) => k * 2, (v) => v.length), 42);
	 * ```
	 */
	public async mapOrElse<A, B>(
		defaultValue: (error: E) => A,
		f: (value: T) => B,
	): Promise<A | B> {
		return (await this).mapOrElse(defaultValue, f);
	}

	/**
	 * Maps a `AsyncResult<T, E>` to `Promise<A | B>` by applying fallback function `defaultValue` to a contained `Err` value,
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
	 * let x: AsyncResult<string, string> = AsyncOk("foo");
	 * assertEquals(await x.mapOrElseAsync(async (e) => k * 2, (v) => v.length), 3);
	 *
	 * let x: AsyncResult<string, string> = AsyncErr("bar");
	 * assertEquals(await x.mapOrElseAsync(async (e) => k * 2, async (v) => v.length), 42);
	 * ```
	 */
	public async mapOrElseAsync<A, B>(
		defaultValue: (error: E) => Promise<A>,
		f: (value: T) => Promise<B>,
	): Promise<A | B> {
		return (await this).mapOrElseAsync(defaultValue, f);
	}

	/**
	 * Returns `other` if the result is `Err`, otherwise returns `this` (as `Ok`).
	 *
	 * @param other - The result to return if this result is `Err`
	 * @returns This result if it is `Ok`, otherwise the provided result
	 *
	 * @example
	 * ```typescript
	 * let x: AsyncResult<number, string> = AsyncOk(2)
	 * let y: AsyncResult<number, string> = AsyncErr("late error")
	 * assertEquals(await x.or(y), Ok(2))
	 *
	 * let x: AsyncResult<number, string> = AsyncErr("early error")
	 * let y: AsyncResult<number, string> = AsyncOk(2)
	 * assertEquals(await x.or(y), Ok(2))
	 *
	 * let x: AsyncResult<number, string> = AsyncErr("not a 2")
	 * let y: AsyncResult<number, string> = AsyncErr("late error")
	 * assertEquals(await x.or(y), Err("late error"))
	 *
	 * let x: AsyncResult<number, string> = AsyncOk(2)
	 * let y: AsyncResult<number, string> = AsyncOk(100)
	 * assertEquals(await x.or(y), Ok(2))
	 * ```
	 */
	public or<U, F>(other: AsyncResult<U, F>): AsyncResult<T | U, F> {
		return new AsyncResult(
			this.then((thisResult) => other.then((otherResult) => thisResult.or(otherResult))),
		);
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
	 * assertEquals(await AsyncOk(2).orElse(sq).orElse(sq), Ok(2))
	 * assertEquals(await AsyncOk(2).orElse(err).orElse(sq), Ok(2))
	 * assertEquals(await AsyncErr(3).orElse(sq).orElse(err), Ok(9))
	 * assertEquals(await AsyncErr(3).orElse(err).orElse(err), Err(3))
	 * ```
	 */
	public orElse<U, F>(f: (error: E) => Result<U, F>): AsyncResult<T | U, F> {
		return new AsyncResult(this.then((thisResult) => thisResult.orElse((error) => f(error))));
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
	 * assertEquals(await AsyncOk(2).orElseAsync(sq).orElseAsync(sq), Ok(2))
	 * assertEquals(await AsyncOk(2).orElseAsync(err).orElseAsync(sq), Ok(2))
	 * assertEquals(await AsyncErr(3).orElseAsync(sq).orElseAsync(err), Ok(9))
	 * assertEquals(await AsyncErr(3).orElseAsync(err).orElseAsync(err), Err(3))
	 * ```
	 */
	public orElseAsync<U, F>(f: (error: E) => Promise<Result<U, F>>): AsyncResult<T | U, F> {
		return new AsyncResult(
			this.then((thisResult) => thisResult.orElseAsync((error) => f(error))),
		);
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
	 * let x: AsyncResult<number, string> = AsyncOk(9)
	 * assertEquals(await x.unwrapOr(defaultValue), 9)
	 *
	 * let x: AsyncResult<number, string> = AsyncErr("error")
	 * assertEquals(await x.unwrapOr(defaultValue), defaultValue)
	 * ```
	 */
	public async unwrapOr<U>(defaultValue: U): Promise<T | U> {
		return (await this).unwrapOr(defaultValue);
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
	 * assertEquals(await AsyncOk(2).unwrapOrElse(count), 2)
	 * assertEquals(await AsyncErr("foo").unwrapOrElse(count), 3)
	 * ```
	 */
	public async unwrapOrElse<U>(defaultValue: (error: E) => U): Promise<T | U> {
		return (await this).unwrapOrElse(defaultValue);
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
	 * assertEquals(await AsyncOk(2).unwrapOrElseAsync(count), 2)
	 * assertEquals(await AsyncErr("foo").unwrapOrElseAsync(count), 3)
	 * ```
	 */
	public async unwrapOrElseAsync<U>(defaultValue: (error: E) => Promise<U>): Promise<T | U> {
		return (await this).unwrapOrElseAsync(defaultValue);
	}
}
