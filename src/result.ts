import { Panic, parseError } from "./error.ts";
import { None, type Option, Some } from "./option.ts";
import { AsyncResult } from "./async_result.ts";
import type * as symbols from "./symbols.ts";

export type ResultMatch<T, E, A, B> = {
	Ok: (value: T) => A;
	Err: (error: E) => B;
};

export type ResultMatchAsync<T, E, A, B> = {
	Ok: (value: T) => Promise<A>;
	Err: (error: E) => Promise<B>;
};

export class ResultImpl<T, E> {
	private readonly _ok: boolean;
	private readonly _value: T | E;

	public constructor(ok: boolean, value: T | E) {
		this._ok = ok;
		this._value = value;

		// Make the constructor name equal to "Result"
		Object.defineProperty(this.constructor, "name", { value: "Result" });

		Object.defineProperty(this, Symbol.iterator, {
			enumerable: false, // Make the iterator non-enumerable to prevent it being used in loops and equality checks
			writable: false, // Make the iterator non-writable to prevent modification
			configurable: false, // Make the iterator non-configurable to prevent redefinition
		});
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

	public [Symbol.for("nodejs.util.inspect.custom")](): string {
		return this.toString();
	}

	/**
	 * Returns a generator that yields the contained value (if `Ok`) or an error (if `Err`).
	 */
	public [Symbol.iterator](): Generator<Err<E, never>, T> {
		const v = this._value;
		if (this._ok) {
			// deno-lint-ignore require-yield
			return (function* (): Generator<Err<E, never>, T> {
				return v as T;
			})();
		}
		return (function* (): Generator<Err<E, never>, T> {
			yield Err(v as E);
			throw new Panic("Do not use this generator outside of a try block");
		})();
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
	public match<A, B>(pattern: ResultMatch<T, E, A, B>): A | B {
		if (this._ok) {
			return pattern.Ok(this._value as T);
		}
		return pattern.Err(this._value as E);
	}

	public matchAsync<A, B>(pattern: ResultMatchAsync<T, E, A, B>): Promise<A | B> {
		if (this._ok) {
			return pattern.Ok(this._value as T);
		}
		return pattern.Err(this._value as E);
	}

	/**
	 * Returns `true` if the result is `Ok`.
	 */
	public isOk(): this is Ok<T, E> {
		return this._ok;
	}

	/**
	 * Returns `true` if the result is `Ok` and the value satisfies the predicate.
	 *
	 * Maybe not as useful as using `result.isOk() && f(result.value)`, because it doesn't narrow the type, but it's here for completeness.
	 */
	public isOkAnd(f: (value: T) => boolean): this is Ok<T, E> {
		return this._ok && f(this._value as T);
	}

	/**
	 * Returns `true` if the result is `Err`.
	 */
	public isErr(): this is Err<E, T> {
		return !this._ok;
	}

	/**
	 * Returns `true` if the result is `Err` and the error satisfies the predicate.
	 *
	 * Maybe not as useful as using `result.isErr() && f(result.error)`, because it doesn't narrow the type, but it's here for completeness.
	 */
	public isErrAnd(f: (error: E) => boolean): this is Err<E, T> {
		return !this._ok && f(this._value as E);
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
	public ok(): Option<T> {
		if (this._ok) {
			return Some(this._value as T);
		}
		return None;
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
	public err(): Option<E> {
		if (!this._ok) {
			return Some(this._value as E);
		}
		return None;
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
	public map<U>(f: (value: T) => U): Result<U, E> {
		if (this._ok) {
			return Ok(f(this._value as T));
		}
		return Err(this._value as E);
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
	public mapAsync<U>(f: (value: T) => Promise<U>): AsyncResult<U, E> {
		if (this._ok) {
			return new AsyncResult(f(this._value as T).then((v) => Ok(v)));
		}
		return new AsyncResult(Promise.resolve(Err(this._value as E)));
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
	public mapOr<A, B>(defaultValue: A, f: (value: T) => B): A | B {
		if (this._ok) {
			return f(this._value as T);
		}
		return defaultValue;
	}

	public mapOrAsync<A, B>(defaultValue: A, f: (value: T) => Promise<B>): Promise<A | B> {
		if (this._ok) {
			return f(this._value as T);
		}
		return Promise.resolve(defaultValue);
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
	public mapOrElse<A, B>(defaultValue: (error: E) => A, f: (value: T) => B): A | B {
		if (this._ok) {
			return f(this._value as T);
		}
		return defaultValue(this._value as E);
	}

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
	public mapErr<F>(f: (error: E) => F): Result<T, F> {
		if (!this._ok) {
			return Err(f(this._value as E));
		}
		return Ok(this._value as T);
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
	public mapErrAsync<F>(f: (error: E) => Promise<F>): AsyncResult<T, F> {
		if (!this._ok) {
			return new AsyncResult(f(this._value as E).then((v) => Err(v)));
		}
		return new AsyncResult(Promise.resolve(Ok(this._value as T)));
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
	public inspect(f: (value: T) => void): this {
		if (this._ok) {
			f(this._value as T);
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
	public inspectAsync(f: (value: T) => Promise<void>): AsyncResult<T, E> {
		if (this._ok) {
			return new AsyncResult(f(this._value as T).then(() => this) as Promise<Result<T, E>>);
		}
		return new AsyncResult(Promise.resolve(this) as Promise<Result<T, E>>);
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
	public inspectErr(f: (error: E) => void): this {
		if (!this._ok) {
			f(this._value as E);
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
	public inspectErrAsync(f: (error: E) => Promise<void>): AsyncResult<T, E> {
		if (!this._ok) {
			return new AsyncResult(f(this._value as E).then(() => this) as Promise<Result<T, E>>);
		}
		return new AsyncResult(Promise.resolve(this) as Promise<Result<T, E>>);
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
	public expect(message: string): T {
		if (this._ok) {
			return this._value as T;
		}
		throw new Panic(`${message}: ${this._value}`, { cause: this._value });
	}

	/**
	 * Returns the contained `Ok` value or `undefined`.
	 */
	public unwrap(): T | undefined {
		if (this._ok) {
			return this._value as T;
		}
		return undefined;
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
	public expectErr(message: string): E {
		if (!this._ok) {
			return this._value as E;
		}
		throw new Panic(`${message}: ${this._value}`, { cause: this._value });
	}

	/**
	 * Returns the contained `Err` value or `undefined`
	 */
	public unwrapErr(): E | undefined {
		if (!this._ok) {
			return this._value as E;
		}
		return undefined;
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
		return this as unknown as Result<U, E | F>;
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
	public andThen<U, F>(f: (value: T) => Result<U, F>): Result<U, E | F> {
		if (this._ok) {
			return f(this._value as T);
		}
		return this as unknown as Result<U, E | F>;
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
	public andThenAsync<U, F>(
		f: (value: T) => AsyncResult<U, F> | Promise<Result<U, F>>,
	): AsyncResult<U, E | F> {
		if (this._ok) {
			return new AsyncResult(f(this._value as T));
		}
		return new AsyncResult(Promise.resolve(this) as Promise<Result<U, E | F>>);
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
	public or<U, F>(other: Result<U, F>): Result<T | U, F> {
		if (this._ok) {
			return this as unknown as Result<T | U, F>;
		}
		return other;
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
	public orElse<U, F>(f: (error: E) => Result<U, F>): Result<T | U, F> {
		if (this._ok) {
			return this as unknown as Result<T | U, F>;
		}
		return f(this._value as E);
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
	public orElseAsync<U, F>(
		f: (error: E) => AsyncResult<U, F> | Promise<Result<U, F>>,
	): AsyncResult<T | U, F> {
		if (this._ok) {
			return new AsyncResult(Promise.resolve(this) as Promise<Result<T | U, F>>);
		}
		return new AsyncResult(f(this._value as E));
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
	public unwrapOr<U>(defaultValue: U): T | U {
		if (this._ok) {
			return this._value as T;
		}
		return defaultValue;
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
	public unwrapOrElse<U>(defaultValue: (error: E) => U): T | U {
		if (this._ok) {
			return this._value as T;
		}
		return defaultValue(this._value as E);
	}

	public unwrapOrElseAsync<U>(defaultValue: (error: E) => Promise<U>): Promise<T | U> {
		if (this._ok) {
			return Promise.resolve(this._value as T);
		}
		return defaultValue(this._value as E);
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
	public flatten<U, F>(this: Result<ResultImpl<U, F>, E>): Result<U, E | F> {
		if (this._ok) {
			return this._value as Result<U, F>;
		}
		return Err(this._value as E);
	}

	// Deprecated

	/**
	 * @deprecated You can yield the `Result` directly: `yield* Ok(1)` instead of `yield* Ok(1).try()`.
	 */
	public try(): Generator<Err<E, never>, T> {
		return this[Symbol.iterator]();
	}

	/**
	 * Returns the contained value, if it exists.
	 *
	 * @deprecated Use `unwrap()` instead.
	 */
	public value(): T | undefined {
		return this._ok ? (this._value as T) : undefined;
	}

	/**
	 * Returns the contained error, if it exists.
	 *
	 * @deprecated Use `unwrapErr()` instead.
	 */
	public error(): E | undefined {
		return this._ok ? undefined : (this._value as E);
	}
}

export interface Ok<T = undefined, E = never> extends ResultImpl<T, E> {
	[symbols.tag]: "Ok";

	unwrap(): T;
	unwrapErr(): undefined;
	expect(message: string): T;
	expectErr(message: string): never;

	// Deprecated

	/**
	 * @deprecated Use `unwrap()` instead.
	 */
	value(): T;
	/**
	 * @deprecated Use `unwrapErr()` instead.
	 */
	error(): undefined;
}

/**
 * Contains the success value.
 */
export function Ok<T>(value: T): Ok<T> {
	return new ResultImpl<T, never>(true, value) as Ok<T>;
}

export interface Err<E = undefined, T = never> extends ResultImpl<T, E> {
	[symbols.tag]: "Err";

	unwrap(): undefined;
	unwrapErr(): E;
	expect(message: string): never;
	expectErr(message: string): E;

	// Deprecated

	/**
	 * Returns the contained value, if it exists.
	 *
	 * @deprecated Use `unwrap()` instead.
	 */
	value(): undefined;
	/**
	 * Returns the contained value, if it exists.
	 *
	 * @deprecated Use `unwrapErr()` instead.
	 */
	error(): E;
}

/**
 * Contains the error value.
 */
export function Err<E>(error: E): Err<E> {
	return new ResultImpl<never, E>(false, error) as Err<E>;
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
	 * **Examples**
	 *
	 * ```
	 * // const result: Result<number, Error>
	 * const result = Result.fromThrowable(() => {
	 *   if (Math.random() > 0.5) {
	 * 		return 42
	 * 	  } else {
	 * 		throw new Error("random error")
	 * 	  }
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
	 * **Examples**
	 *
	 * ```
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
	 * **Examples**
	 *
	 * ```
	 * // const result: AsyncResult<number, Error>
	 * const result = Result.fromThrowableAsync((): Promise<number> => {
	 *   if (Math.random() > 0.5) {
	 * 		throw new Error("random error")
	 * 	  } else {
	 * 		return Promise.resolve(42)
	 * 	  }
	 * })
	 */
	export function fromThrowableAsync<T>(f: () => Promise<T>): AsyncResult<T, Error> {
		async function safe(): Promise<Result<T, Error>> {
			try {
				return Ok(await f());
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
