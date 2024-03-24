import {Panic} from "./panic"
import {inspectSymbol} from "./util"

export type ResultMatcher<T, E, A, B> = {
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

	and<U, F>(other: Result<U, F>): Result<U, E | F> {
		return (this.isOk ? other : this) as Result<U, E | F>
	}

	andThen<U, F>(f: (value: T) => Result<U, F>): Result<U, E | F> {
		return (this.isOk ? f(this.value as T) : this) as Result<U, E | F>
	}

	examine(f: (value: T) => void): Result<T, E> {
		if (this.isOk) {
			f(this.value as T)
		}
		return this as unknown as Result<T, E>
	}

	examineErr(f: (error: E) => void): Result<T, E> {
		if (this.isErr) {
			f(this.value as E)
		}
		return this as unknown as Result<T, E>
	}

	expect(panic: string): T {
		if (this.isOk) {
			return this.value as T
		}
		throw new Panic({message: panic, cause: this})
	}

	expectErr(panic: string): E {
		if (this.isErr) {
			return this.value as E
		}
		throw new Panic({message: panic, cause: this})
	}

	flatten<U, F>(this: Result<ResultImpl<U, F>, E>): Result<U, E | F> {
		return (this.isOk ? (this.value as Result<U, F>) : this) as Result<U, E | F>
	}

	map<U>(f: (value: T) => U): Result<U, E> {
		return (this.isOk ? new ResultImpl<U, E>(true, f(this.value as T)) : this) as Result<U, E>
	}

	mapErr<F>(f: (error: E) => F): Result<T, F> {
		return (this.isOk ? this : new ResultImpl<T, F>(false, f(this.value as E))) as Result<T, F>
	}

	mapOr<A, B>(defaultValue: A, f: (value: T) => B): A | B {
		return this.isOk ? f(this.value as T) : defaultValue
	}

	mapOrElse<A, B>(defaultValue: (error: E) => A, f: (value: T) => B): A | B {
		return this.isOk ? f(this.value as T) : defaultValue(this.value as E)
	}

	or<U, F>(other: Result<U, F>): Result<T | U, F> {
		return (this.isOk ? this : other) as Result<T | U, F>
	}

	orElse<U, F>(f: (error: E) => Result<U, F>): Result<T | U, F> {
		return (this.isOk ? this : f(this.value as E)) as Result<T | U, F>
	}

	unwrap(): T {
		if (this.isOk) {
			return this.value as T
		}
		throw new Panic({message: `called "unwrap()" on ${this.toString()}`, cause: this})
	}

	unwrapErr(): E {
		if (this.isErr) {
			return this.value as E
		}
		throw new Panic({message: `called "unwrapErr()" on ${this.toString()}`, cause: this})
	}

	unwrapOr<U>(defaultValue: U): T | U {
		return this.isOk ? (this.value as T) : defaultValue
	}

	unwrapOrElse<U>(defaultValue: (error: E) => U): T | U {
		return this.isOk ? (this.value as T) : defaultValue(this.value as E)
	}

	match<A, B>(matcher: ResultMatcher<T, E, A, B>): A | B {
		return this.isOk ? matcher.Ok(this.value as T) : matcher.Err(this.value as E)
	}

	toString(): `Ok(${string})` | `Err(${string})` {
		return this.isOk ? `Ok(${this.value})` : `Err(${this.value})`
	}

	[inspectSymbol](): ReturnType<ResultImpl<T, E>["toString"]> {
		return this.toString()
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
}

export interface Ok<T = undefined> extends ResultImpl<T, never> {
	readonly isOk: true
	readonly isErr: false
	readonly value: T
}

export function Ok(): Ok
export function Ok<T>(value: T): Ok<T>
export function Ok<T>(value?: T): Ok<T> {
	return new ResultImpl<T, never>(true, value as T) as Ok<T>
}

export interface Err<E = undefined> extends ResultImpl<never, E> {
	readonly isOk: false
	readonly isErr: true
	readonly value: E
}

export function Err(): Err
export function Err<E>(value: E): Err<E>
export function Err<E>(value?: E): Err<E> {
	return new ResultImpl<never, E>(false, value as E) as Err<E>
}

type Methods<T, E> = Omit<ResultImpl<T, E>, "ok" | "err" | "value">

type _OkResult<T, E> = Ok<T> & Methods<T, E>
export interface OkResult<T, E> extends _OkResult<T, E> {}

type _ErrResult<T, E> = Err<E> & Methods<T, E>
export interface ErrResult<T, E> extends _ErrResult<T, E> {}

export type Result<T, E> = OkResult<T, E> | ErrResult<T, E>
