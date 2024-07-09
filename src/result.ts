import {Panic, parseError} from "./error";
import {type Option, Some, None} from "./option";
import {AsyncResult} from "./async_result";
import * as symbols from "./symbols";

export type ResultMatch<T, E, A, B> = {
	Ok: (value: T) => A;
	Err: (error: E) => B;
};

export type ResultMatchAsync<T, E, A, B> = {
	Ok: (value: T) => Promise<A>;
	Err: (error: E) => Promise<B>;
};

export class ResultImpl<T, E> {
	private readonly kind?: true;
	private readonly wrapped: T | E;

	[Symbol.toStringTag] = "Result";

	constructor(k: boolean, v: T | E) {
		if (k) {
			this.kind = true;
		}
		this.wrapped = v;
	}

	*[Symbol.iterator](): Iterator<Result<T, E>, T, any> {
		const self = this as unknown as Result<T, E>;
		return yield self;
	}

	private unwrapFailed(message: string): never {
		throw new Panic(message, {cause: this.wrapped});
	}

	/**
	 * Matches the result with two functions.
	 *
	 * **Examples**
	 *
	 * ```
	 * const x: Result<number, string> = Ok(2)
	 * assert.strictEqual(x.match({
	 * 	Ok: (v) => v * 2,
	 * 	Err: (e) => e.length,
	 * }), 4)
	 *
	 * const y: Result<number, string> = Err("error")
	 * assert.strictEqual(y.match({
	 * 	Ok: (v) => v * 2,
	 * 	Err: (e) => e.length,
	 * }), 5)
	 * ```
	 */
	match<A, B>(pattern: ResultMatch<T, E, A, B>): A | B {
		return this.kind ? pattern.Ok(this.wrapped as T) : pattern.Err(this.wrapped as E);
	}

	matchAsync<A, B>(pattern: ResultMatchAsync<T, E, A, B>): Promise<A | B> {
		return this.kind ? pattern.Ok(this.wrapped as T) : pattern.Err(this.wrapped as E);
	}

	/**
	 * Returns the contained value, if it exists.
	 *
	 * @deprecated Use `unwrap()` instead.
	 */
	value(): T | undefined {
		return this.kind ? (this.wrapped as T) : undefined;
	}

	/**
	 * Returns the contained error, if it exists.
	 *
	 * @deprecated Use `unwrapErr()` instead.
	 */
	error(): E | undefined {
		return this.kind ? undefined : (this.wrapped as E);
	}

	/**
	 * Returns `true` if the result is `Ok`.
	 */
	isOk(): this is Ok<T, E> {
		return this.kind === true;
	}

	/**
	 * Returns `true` if the result is `Ok` and the value satisfies the predicate.
	 *
	 * Maybe not as useful as using `result.isOk() && f(result.value)`, because it doesn't narrow the type, but it's here for completeness.
	 */
	isOkAnd(f: (value: T) => boolean): this is Ok<T, E> {
		return this.kind === true && f(this.wrapped as T);
	}

	/**
	 * Returns `true` if the result is `Err`.
	 */
	isErr(): this is Err<E, T> {
		return this.kind === undefined;
	}

	/**
	 * Returns `true` if the result is `Err` and the error satisfies the predicate.
	 *
	 * Maybe not as useful as using `result.isErr() && f(result.error)`, because it doesn't narrow the type, but it's here for completeness.
	 */
	isErrAnd(f: (error: E) => boolean): this is Err<E, T> {
		return this.kind === undefined && f(this.wrapped as E);
	}

	/**
	 * Converts from `Result<T, E>` to `Option<T>`.
	 *
	 * **Examples**
	 *
	 * ```
	 * const x: Result<number, string> = Ok(2)
	 * assert.strictDeepEqual(x.ok(), Some(2))
	 *
	 * const y: Result<number, string> = Err("Nothing here")
	 * assert.strictDeepEqual(y.ok(), None)
	 * ```
	 */
	ok(): Option<T> {
		return this.kind ? Some(this.wrapped as T) : None;
	}

	/**
	 * Converts from `Result<T, E>` to `Option<E>`.
	 *
	 * **Examples**
	 *
	 * ```
	 * const x: Result<number, string> = Ok(2)
	 * assert.strictDeepEqual(x.err(), None)
	 *
	 * const y: Result<number, string> = Err("Nothing here")
	 * assert.strictDeepEqual(y.err(), Some("Nothing here"))
	 * ```
	 */
	err(): Option<E> {
		return this.kind ? None : Some(this.wrapped as E);
	}

	/**
	 * Maps a `Result<T, E>` to `Result<U, E>` by applying a function to a contained `Ok` value, leaving an `Err` value untouched.
	 *
	 * **Examples**
	 *
	 * ```
	 * const x = Ok(10)
	 * const mapped = x.map((n) => `number ${n}`)
	 * assert.strictEqual(mapped.unwrap(), "number 10")
	 * ```
	 */
	map<U>(f: (value: T) => U): Result<U, E> {
		return this.kind ? Ok(f(this.wrapped as T)) : Err(this.wrapped as E);
	}

	/**
	 * Maps a `Result<T, E>` to `AsyncResult<U, E>` by applying an async function to a contained `Ok` value, leaving an `Err` value untouched.
	 *
	 * **Examples**
	 *
	 * ```
	 * const x = Ok(10)
	 * const mapped = x.mapAsync((n) => Promise.resolve(`number ${n}`))
	 * assert.strictEqual(await mapped.unwrap(), "number 10")
	 * ```
	 */
	mapAsync<U>(f: (value: T) => Promise<U>): AsyncResult<U, E> {
		return new AsyncResult(
			this.kind
				? f(this.wrapped as T).then((v) => Ok(v))
				: Promise.resolve(Err(this.wrapped as E)),
		);
	}

	/**
	 * Returns the provided default (if `Err`), or applies a function to the contained value (if `Ok`).
	 *
	 * **Examples**
	 *
	 * ```
	 * const x: Result<string, string> = Ok("foo");
	 * assert.strictEqual(x.mapOr(42, (v) => v.length), 3);
	 *
	 * const y: Result<string, string> = Err("bar");
	 * assert.strictEqual(y.mapOr(42, (v) => v.length), 42);
	 * ```
	 */
	mapOr<A, B>(defaultValue: A, f: (value: T) => B): A | B {
		return this.kind ? f(this.wrapped as T) : defaultValue;
	}

	mapOrAsync<A, B>(defaultValue: A, f: (value: T) => Promise<B>): Promise<A | B> {
		return this.kind ? f(this.wrapped as T) : Promise.resolve(defaultValue);
	}

	/**
	 * Maps a `Result<T, E>` to `A | B` by applying fallback function `defaultValue` to a contained `Err` value, or function `f` to a contained `Ok` value.
	 *
	 * **Examples**
	 *
	 * ```
	 * const k = 21
	 *
	 * let x: Result<string, string> = Ok("foo")
	 * assert.strictEqual(x.mapOrElse(() => k * 2, (v) => v.length), 3)
	 *
	 * x = Err("bar")
	 * assert.strictEqual(x.mapOrElse(() => k * 2, (v) => v.length), 42)
	 * ```
	 */
	mapOrElse<A, B>(defaultValue: (error: E) => A, f: (value: T) => B): A | B {
		return this.kind ? f(this.wrapped as T) : defaultValue(this.wrapped as E);
	}

	mapOrElseAsync<A, B>(
		defaultValue: (error: E) => Promise<A>,
		f: (value: T) => Promise<B>,
	): Promise<A | B> {
		return this.kind ? f(this.wrapped as T) : defaultValue(this.wrapped as E);
	}

	/**
	 * Maps a `Result<T, E>` to `Result<T, F>` by applying a function to a contained `Err` value, leaving an `Ok` value untouched.
	 *
	 * **Examples**
	 *
	 * ```
	 * const x = Err("error")
	 * const mapped = x.mapErr((s) => s.length)
	 * assert.strictEqual(mapped.unwrapErr(), 5)
	 * ```
	 */
	mapErr<F>(f: (error: E) => F): Result<T, F> {
		return this.kind ? Ok(this.wrapped as T) : Err(f(this.wrapped as E));
	}

	/**
	 * Maps a `Result<T, E>` to `AsyncResult<T, F>` by applying an async function to a contained `Err` value, leaving an `Ok` value untouched.
	 *
	 * **Examples**
	 *
	 * ```
	 * const x = Err("error")
	 * const mapped = x.mapErrAsync((s) => Promise.resolve(s.length))
	 * assert.strictEqual(await mapped.unwrapErr(), 5)
	 * ```
	 */
	mapErrAsync<F>(f: (error: E) => Promise<F>): AsyncResult<T, F> {
		return new AsyncResult(
			this.kind
				? Promise.resolve(Ok(this.wrapped as T))
				: f(this.wrapped as E).then((v) => Err(v)),
		);
	}

	/**
	 * Calls the provided function with the contained value (if `Ok`).
	 *
	 * **Examples**
	 *
	 * ```
	 * const x = Ok(2)
	 * x.inspect((v) => console.log(v))
	 * ```
	 */
	inspect(f: (value: T) => void): this {
		if (this.kind) {
			f(this.wrapped as T);
		}
		return this;
	}

	/**
	 * Calls the provided async function with the contained value (if `Ok`).
	 *
	 * **Examples**
	 *
	 * ```
	 * const x = Ok(2)
	 * x.inspectAsync((v) => Promise.resolve(console.log(v)))
	 * ```
	 */
	inspectAsync(f: (value: T) => Promise<void>): AsyncResult<T, E> {
		return new AsyncResult(
			this.matchAsync({
				Ok: (t) => f(t).then(() => Ok(t)),
				Err: (e) => Promise.resolve(Err(e)),
			}),
		);
	}

	/**
	 * Calls the provided function with the contained error (if `Err`).
	 *
	 * **Examples**
	 *
	 * ```
	 * const x = Err("error")
	 * x.inspectErr((e) => console.error(e))
	 * ```
	 */
	inspectErr(f: (error: E) => void): this {
		if (!this.kind) {
			f(this.wrapped as E);
		}
		return this;
	}

	/**
	 * Calls the provided async function with the contained error (if `Err`).
	 *
	 * **Examples**
	 *
	 * ```
	 * const x = Err("error")
	 * x.inspectErrAsync((e) => Promise.resolve(console.error(e)))
	 * ```
	 */
	inspectErrAsync(f: (error: E) => Promise<void>): AsyncResult<T, E> {
		return new AsyncResult(
			this.kind
				? Promise.resolve(Ok(this.wrapped as T))
				: f(this.wrapped as E).then(() => Err(this.wrapped as E)),
		);
	}

	/**
	 * Returns the contained `Ok` value.
	 *
	 * Throws `Panic` if the value is an `Err`, with a message containing `message` and content of the `Err` as `cause`.
	 *
	 * **Examples**
	 *
	 * ```
	 * const x = Err("emergency failure")
	 * x.expect("Testing expect") // throws Panic: Testing expect
	 * ```
	 */
	expect(message: string): T {
		return this.kind ? (this.wrapped as T) : this.unwrapFailed(message);
	}

	/**
	 * Returns the contained `Ok` value or `undefined`.
	 */
	unwrap(): T | undefined {
		return this.kind ? (this.wrapped as T) : undefined;
	}

	/**
	 * Returns the contained `Err` value.
	 *
	 * Throws `Panic` if the value is an `Ok`, with a message containing `message` and content of the `Ok` as `cause`.
	 *
	 * **Examples**
	 *
	 * ```
	 * const x = Ok(2)
	 * x.expectErr("Testing expectErr") // throws Panic: Testing expectErr
	 * ```
	 */
	expectErr(message: string): E {
		return this.kind ? this.unwrapFailed(message) : (this.wrapped as E);
	}

	/**
	 * Returns the contained `Err` value or `undefined`
	 */
	unwrapErr(): E | undefined {
		return this.kind ? undefined : (this.wrapped as E);
	}

	/**
	 * Returns `other` if the result is `Ok`, otherwise returns `this` (as `Err`).
	 *
	 * **Examples**
	 *
	 * ```
	 * let x: Result<number, string> = Ok(2)
	 * let y: Result<string, string> = Err("late error")
	 * assert.deepStrictEqual(x.and(y), Err("late error"))
	 *
	 * x = Err("early error")
	 * y = Ok("foo")
	 * assert.deepStrictEqual(x.and(y), Err("early error"))
	 *
	 * x = Err("not a 2")
	 * y = Err("late error")
	 * assert.deepStrictEqual(x.and(y), Err("not a 2"))
	 *
	 * x = Ok(2)
	 * y = Ok("different result type")
	 * assert.deepStrictEqual(x.and(y), Ok("different result type"))
	 * ```
	 */
	and<U, F>(other: Result<U, F>): Result<U, E | F> {
		return (this.kind ? other : this) as Result<U, E | F>;
	}

	/**
	 * Calls `f` if the result is `Ok`, otherwise returns `this` (as `Err`).
	 *
	 * **Examples**
	 *
	 * ```
	 * let x: Result<number, string> = Ok(2)
	 * assert.deepStrictEqual(x.andThen((n) => Ok(n * 2)), Ok(4))
	 *
	 * let y: Result<string, string> = Err("late error")
	 * assert.deepStrictEqual(y.andThen((n) => Ok(n * 2)), Err("late error"))
	 * ```
	 */
	andThen<U, F>(f: (value: T) => Result<U, F>): Result<U, E | F> {
		return (this.kind ? f(this.wrapped as T) : this) as Result<U, E | F>;
	}

	/**
	 * Calls `f` if the result is `Ok`, otherwise returns `this` (as `Err`).
	 *
	 * **Examples**
	 *
	 * ```
	 * let x: Result<number, string> = Ok(2)
	 * assert.deepStrictEqual(x.andThenAsync((n) => Promise.resolve(Ok(n * 2))), Ok(4))
	 *
	 * let y: Result<string, string> = Err("late error")
	 * assert.deepStrictEqual(y.andThenAsync((n) => Promise.resolve(Ok(n * 2))), Err("late error"))
	 * ```
	 */
	andThenAsync<U, F>(
		f: (value: T) => AsyncResult<U, F> | Promise<Result<U, F>>,
	): AsyncResult<U, E | F> {
		return new AsyncResult(
			(this.kind
				? f(this.wrapped as T)
				: Promise.resolve(this as unknown as Err<E, T>)) as Promise<Result<U, E | F>>,
		);
	}

	/**
	 * Returns `other` if the result is `Err`, otherwise returns `this` (as `Ok`).
	 *
	 * **Examples**
	 *
	 * ```
	 * let x: Result<number, string> = Ok(2)
	 * let y: Result<number, string> = Err("late error")
	 * assert.deepStrictEqual(x.or(y), Ok(2))
	 * assert.deepStrictEqual(y.or(x), Ok(2))
	 * ```
	 */
	or<U, F>(other: Result<U, F>): Result<T | U, F> {
		return (this.kind ? this : other) as Result<T | U, F>;
	}

	/**
	 * Calls `f` if the result is `Err`, otherwise returns `this` (as `Ok`).
	 *
	 * **Examples**
	 *
	 * ```
	 * let x: Result<number, string> = Ok(2)
	 * assert.deepStrictEqual(x.orElse((e) => Err(e + "bar")), Ok(2))
	 *
	 * let y: Result<number, string> = Err("foo")
	 * assert.deepStrictEqual(y.orElse((e) => Err(e + "bar")), Err("foobar"))
	 * ```
	 */
	orElse<U, F>(f: (error: E) => Result<U, F>): Result<T | U, F> {
		return (this.kind ? this : f(this.wrapped as E)) as Result<T | U, F>;
	}

	/**
	 * Calls `f` if the result is `Err`, otherwise returns `this` (as `Ok`).
	 *
	 * **Examples**
	 *
	 * ```
	 * let x: Result<number, string> = Ok(2)
	 * assert.deepStrictEqual(x.orElseAsync((e) => Promise.resolve(Err(e + "bar"))), Ok(2))
	 *
	 * let y: Result<number, string> = Err("foo")
	 * assert.deepStrictEqual(y.orElseAsync((e) => Promise.resolve(Err(e + "bar"))), Err("foobar"))
	 * ```
	 */
	orElseAsync<U, F>(
		f: (error: E) => AsyncResult<U, F> | Promise<Result<U, F>>,
	): AsyncResult<T | U, F> {
		return new AsyncResult(
			(this.kind
				? Promise.resolve(this as unknown as Ok<T, E>)
				: f(this.wrapped as E)) as Promise<Result<T | U, F>>,
		);
	}

	/**
	 * Returns the contained `Ok` value or a provided default.
	 *
	 * **Examples**
	 *
	 * ```
	 * const x: Result<number, string> = Ok(2)
	 * assert.strictEqual(x.unwrapOr(0), 2)
	 *
	 * const y: Result<number, string> = Err("error")
	 * assert.strictEqual(y.unwrapOr(0), 0)
	 * ```
	 */
	unwrapOr<U>(defaultValue: U): T | U {
		return this.kind ? (this.wrapped as T) : defaultValue;
	}

	/**
	 * Returns the contained `Ok` value or computes it from `defaultValue`.
	 *
	 * **Examples**
	 *
	 * ```
	 * const x: Result<number, string> = Ok(2)
	 * assert.strictEqual(x.unwrapOrElse(() => 0), 2)
	 *
	 * const y: Result<number, string> = Err("error")
	 * assert.strictEqual(y.unwrapOrElse(() => 0), 0)
	 * ```
	 */
	unwrapOrElse<U>(defaultValue: (error: E) => U): T | U {
		return this.kind ? (this.wrapped as T) : defaultValue(this.wrapped as E);
	}

	unwrapOrElseAsync<U>(defaultValue: (error: E) => Promise<U>): Promise<T | U> {
		return this.kind ? Promise.resolve(this.wrapped as T) : defaultValue(this.wrapped as E);
	}

	/**
	 * Converts from `Result<Result<U, F>, E>` to `Result<U, E | F>`.
	 *
	 * **Examples**
	 *
	 * ```
	 * const x: Result<Result<number, string>, string> = Ok(Ok(2))
	 * assert.deepStrictEqual(x.flatten(), Ok(2))
	 *
	 * const y: Result<Result<number, string>, string> = Ok(Err("late error"))
	 * assert.deepStrictEqual(y.flatten(), Err("late error"))
	 *
	 * const z: Result<Result<number, string>, string> = Err("early error")
	 * assert.deepStrictEqual(z.flatten(), Err("early error"))
	 * ```
	 */
	flatten<U, F>(this: Result<ResultImpl<U, F>, E>): Result<U, E | F> {
		return this.kind ? (this.wrapped as Result<U, F>) : Err(this.wrapped as E);
	}

	toObject(): {isOk: true; value: T} | {isOk: false; error: E} {
		return this.kind
			? {isOk: true, value: this.wrapped as T}
			: {isOk: false, error: this.wrapped as E};
	}

	toString(): `Ok(${string})` | `Err(${string})` {
		const str = String(this.wrapped);
		return this.kind ? `Ok(${str})` : `Err(${str})`;
	}

	[symbols.inspect](): ReturnType<ResultImpl<T, E>["toString"]> {
		return this.toString();
	}
}

export interface Ok<T = undefined, E = never> extends ResultImpl<T, E> {
	[symbols.tag]: "Ok";
	value(): T;
	error(): undefined;
	unwrap(): T;
	unwrapErr(): undefined;
	expect(message: string): T;
	expectErr(message: string): never;
}

/**
 * Contains the success value.
 */
export function Ok(): Ok;
export function Ok<T>(value: T): Ok<T>;
export function Ok<T>(value?: T): Ok<T> {
	return new ResultImpl<T, never>(true, value as T) as Ok<T>;
}

export interface Err<E = undefined, T = never> extends ResultImpl<T, E> {
	[symbols.tag]: "Err";
	value(): undefined;
	error(): E;
	unwrap(): undefined;
	unwrapErr(): E;
	expect(message: string): never;
	expectErr(message: string): E;
}

/**
 * Contains the error value.
 */
export function Err(): Err;
export function Err<E>(error: E): Err<E>;
export function Err<E>(error?: E): Err<E> {
	return new ResultImpl<never, E>(false, error as E) as Err<E>;
}

function handlePanic(error: unknown) {
	if (error instanceof Panic) {
		throw error;
	}
	return error;
}

function handleCaughtError(error: unknown) {
	return parseError(handlePanic(error));
}

/**
 * `Result` is a type that represents either success (`Ok`) or failure (`Err`).
 *
 * `Result<T, E>` is the type used for returning errors. It is a discriminated union with the variants, `Ok<T>`, representing success and containing a value, and `Err<E>`, representing error and containing an error value.
 *
 * Functions return `Result` whenever errors are expected and recoverable.
 */
export type Result<T, E> = Ok<T, E> | Err<E, T>;

export function Result() {}

/**
 * Tries to execute a function and returns the result as a `Result`.
 *
 * **Examples**
 *
 * ```
 * // const result: Result<number, Error>
 * const result = Result.from(() => {
 *   if (Math.random() > 0.5) {
 *		return 42
 *	  } else {
 *		throw new Error("random error")
 *	  }
 * })
 * ```
 */
Result.from = <T>(f: () => T): Result<T, Error> => {
	try {
		return Ok(f());
	} catch (error) {
		return Err(handleCaughtError(error));
	}
};

/**
 * Tries to resolve a promise and returns the result as a `AsyncResult`.
 *
 * **Examples**
 *
 * ```
 * // const result: AsyncResult<number, Error>
 * const result = Result.fromPromise(Promise.resolve(42))
 * ```
 */
Result.fromPromise = <T>(promise: Promise<T>): AsyncResult<T, Error> => {
	return new AsyncResult(
		promise.then(
			(value) => Ok(value),
			(error) => Err(handleCaughtError(error)),
		),
	);
};
