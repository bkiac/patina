import {Panic} from "./error"
import {inspectSymbol} from "./util_internal"
import {Option, Some, None} from "./option"
import {ResultPromise} from "./result_promise"

export type ResultMatch<T, E, A, B> = {
	Ok: (value: T) => A
	Err: (error: E) => B
}

export class ResultImpl<T, E> {
	readonly isOk: boolean
	readonly isErr: boolean
	readonly value: T | E

	constructor(ok: boolean, value: T | E) {
		this.isOk = ok
		this.isErr = !ok
		this.value = value
	}

	*[Symbol.iterator](): Iterator<Result<T, E>, T, any> {
		const self = this as unknown as Result<T, E>
		return yield self
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
		return this.isOk ? Some(this.value as T) : None
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
		return this.isErr ? Some(this.value as E) : None
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
		return (this.isOk ? new ResultImpl<U, E>(true, f(this.value as T)) : this) as Result<U, E>
	}

	/**
	 * Maps a `Result<T, E>` to `ResultPromise<U, E>` by applying an async function to a contained `Ok` value, leaving an `Err` value untouched.
	 *
	 * **Examples**
	 *
	 * ```
	 * const x = Ok(10)
	 * const mapped = x.mapAsync((n) => Promise.resolve(`number ${n}`))
	 * assert.strictEqual(await mapped.unwrap(), "number 10")
	 * ```
	 */
	mapAsync<U>(f: (value: T) => Promise<U>): ResultPromise<U, E> {
		const promise = this.isOk
			? f(this.value as T).then((v) => new ResultImpl<U, E>(true, v))
			: Promise.resolve(this)
		return new ResultPromise<U, E>(promise as Promise<Result<U, E>>)
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
		return this.isOk ? f(this.value as T) : defaultValue
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
		return this.isOk ? f(this.value as T) : defaultValue(this.value as E)
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
		return (this.isOk ? this : new ResultImpl<T, F>(false, f(this.value as E))) as Result<T, F>
	}

	/**
	 * Maps a `Result<T, E>` to `ResultPromise<T, F>` by applying an async function to a contained `Err` value, leaving an `Ok` value untouched.
	 *
	 * **Examples**
	 *
	 * ```
	 * const x = Err("error")
	 * const mapped = x.mapErrAsync((s) => Promise.resolve(s.length))
	 * assert.strictEqual(await mapped.unwrapErr(), 5)
	 * ```
	 */
	mapErrAsync<F>(f: (error: E) => Promise<F>): ResultPromise<T, F> {
		const promise = this.isErr
			? f(this.value as E).then((v) => new ResultImpl<T, F>(false, v))
			: Promise.resolve(this)
		return new ResultPromise<T, F>(promise as Promise<Result<T, F>>)
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
	inspect(f: (value: T) => void): Result<T, E> {
		if (this.isOk) {
			f(this.value as T)
		}
		return this as unknown as Result<T, E>
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
	inspectAsync(f: (value: T) => Promise<void>): ResultPromise<T, E> {
		const promise = this.isOk ? f(this.value as T).then(() => this) : Promise.resolve(this)
		return new ResultPromise<T, E>(promise as unknown as Promise<Result<T, E>>)
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
	inspectErr(f: (error: E) => void): Result<T, E> {
		if (this.isErr) {
			f(this.value as E)
		}
		return this as unknown as Result<T, E>
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
	inspectErrAsync(f: (error: E) => Promise<void>): ResultPromise<T, E> {
		const promise = this.isErr ? f(this.value as E).then(() => this) : Promise.resolve(this)
		return new ResultPromise<T, E>(promise as unknown as Promise<Result<T, E>>)
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
		if (this.isOk) {
			return this.value as T
		}
		throw new Panic(message, {cause: this})
	}

	/**
	 * Returns the contained `Ok` value.
	 *
	 * Throws `Panic` if the value is an `Err`, with a message containing the content of the `Err` and `this` as `cause`.
	 *
	 * **Examples**
	 *
	 * ```
	 * const x = Err("emergency failure")
	 * x.unwrap() // throws Panic: called "unwrap()" on Err("emergency failure")
	 * ```
	 */
	unwrap(): T {
		if (this.isOk) {
			return this.value as T
		}
		throw new Panic(`called "unwrap()" on ${this.toString()}`, {cause: this})
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
		if (this.isErr) {
			return this.value as E
		}
		throw new Panic(message, {cause: this})
	}

	/**
	 * Returns the contained `Err` value.
	 *
	 * Throws `Panic` if the value is an `Ok`, with a message containing the content of the `Ok` and `this` as `cause`.
	 *
	 * **Examples**
	 *
	 * ```
	 * const x = Ok(2)
	 * x.unwrapErr() // throws Panic: called "unwrapErr()" on Ok(2)
	 * ```
	 */
	unwrapErr(): E {
		if (this.isErr) {
			return this.value as E
		}
		throw new Panic(`called "unwrapErr()" on ${this.toString()}`, {cause: this})
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
		return (this.isOk ? other : this) as Result<U, E | F>
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
		return (this.isOk ? f(this.value as T) : this) as Result<U, E | F>
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
		f: (value: T) => ResultPromise<U, F> | Promise<Result<U, F>>,
	): ResultPromise<U, E | F> {
		const promise = this.isOk ? f(this.value as T) : Promise.resolve(this)
		return new ResultPromise<U, E | F>(promise as Promise<Result<U, F>>)
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
		return (this.isOk ? this : other) as Result<T | U, F>
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
		return (this.isOk ? this : f(this.value as E)) as Result<T | U, F>
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
		f: (error: E) => ResultPromise<U, F> | Promise<Result<U, F>>,
	): ResultPromise<T | U, F> {
		const promise = this.isErr ? f(this.value as E) : Promise.resolve(this)
		return new ResultPromise<T | U, F>(promise as Promise<Result<T | U, F>>)
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
		return this.isOk ? (this.value as T) : defaultValue
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
		return this.isOk ? (this.value as T) : defaultValue(this.value as E)
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
		return (this.isOk ? this.value : this) as Result<U, E | F>
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
	match<A, B>(match: ResultMatch<T, E, A, B>): A | B {
		return this.isOk ? match.Ok(this.value as T) : match.Err(this.value as E)
	}

	toObject(): {isOk: true; value: T} | {isOk: false; value: E} {
		if (this.isOk) {
			return {
				isOk: true,
				value: this.value as T,
			}
		}
		return {
			isOk: false,
			value: this.value as E,
		}
	}

	toJSON(): {meta: "Ok"; value: T} | {meta: "Err"; value: E} {
		if (this.isOk) {
			return {
				meta: "Ok",
				value: this.value as T,
			}
		}
		return {
			meta: "Err",
			value: this.value as E,
		}
	}

	toString(): `Ok(${string})` | `Err(${string})` {
		return this.isOk ? `Ok(${this.value})` : `Err(${this.value})`
	}

	[inspectSymbol](): ReturnType<ResultImpl<T, E>["toString"]> {
		return this.toString()
	}
}

export interface Ok<T = undefined, E = never> extends ResultImpl<T, E> {
	readonly isOk: true
	readonly isErr: false
	readonly value: T
	unwrap(): T
	unwrapErr(): never
	expect(message: string): T
	expectErr(message: string): never
}

/**
 * Contains the success value.
 */
export function Ok(): Ok
export function Ok<T>(value: T): Ok<T>
export function Ok<T>(value?: T): Ok<T> {
	return new ResultImpl<T, never>(true, value as T) as Ok<T>
}

export interface Err<E = undefined, T = never> extends ResultImpl<T, E> {
	readonly isOk: false
	readonly isErr: true
	readonly value: E
	unwrap(): never
	unwrapErr(): E
	expect(message: string): never
	expectErr(message: string): E
}

/**
 * Contains the error value.
 */
export function Err(): Err
export function Err<E>(value: E): Err<E>
export function Err<E>(value?: E): Err<E> {
	return new ResultImpl<never, E>(false, value as E) as Err<E>
}

/**
 * `Result` is a type that represents either success (`Ok`) or failure (`Err`).
 *
 * `Result<T, E>` is the type used for returning errors. It is a discriminated union with the variants, `Ok<T>`, representing success and containing a value, and `Err<E>`, representing error and containing an error value.
 *
 * Functions return `Result` whenever errors are expected and recoverable.
 */
export type Result<T, E> = Ok<T, E> | Err<E, T>
