import {Panic, UnwrapPanic} from "./panic"
import {inspectSymbol} from "./util"

export type ResultMatcher<T, E, A, B> = {
	Ok: (value: T) => A
	Err: (error: E) => B
}

export class ResultImpl<T, E> {
	readonly ok: boolean
	readonly err: boolean
	readonly value: T | E

	constructor(ok: boolean, value: T | E) {
		this.ok = ok
		this.err = !ok
		this.value = value
	}

	and<U, F>(other: Result<U, F>): Result<U, E | F> {
		return (this.ok ? other : this) as Result<U, E | F>
	}

	andThen<U, F>(f: (value: T) => Result<U, F>): Result<U, E | F> {
		return (this.ok ? f(this.value as T) : this) as Result<U, E | F>
	}

	expect(panic: string): T {
		if (this.ok) {
			return this.value as T
		}
		throw new Panic(panic, this.value as E)
	}

	expectErr(panic: string): E {
		if (this.err) {
			return this.value as E
		}
		throw new Panic(panic, this.value as T)
	}

	flatten<U, F>(this: Result<Result<U, F>, E>): Result<U, E | F> {
		return (this.ok ? (this.value as Result<U, F>) : this) as Result<U, E | F>
	}

	inspect(f: (value: T) => void): Result<T, E> {
		if (this.ok) {
			f(this.value as T)
		}
		return this as unknown as Result<T, E>
	}

	inspectErr(f: (error: E) => void): Result<T, E> {
		if (this.err) {
			f(this.value as E)
		}
		return this as unknown as Result<T, E>
	}

	map<U>(f: (value: T) => U): Result<U, E> {
		return (this.ok ? new ResultImpl<U, E>(true, f(this.value as T)) : this) as Result<U, E>
	}

	mapErr<F>(f: (error: E) => F): Result<T, F> {
		return (this.ok ? this : new ResultImpl<T, F>(false, f(this.value as E))) as Result<T, F>
	}

	mapOr<A, B>(defaultValue: A, f: (value: T) => B): A | B {
		return this.ok ? f(this.value as T) : defaultValue
	}

	mapOrElse<A, B>(defaultValue: (error: E) => A, f: (value: T) => B): A | B {
		return this.ok ? f(this.value as T) : defaultValue(this.value as E)
	}

	or<U, F>(other: Result<U, F>): Result<T | U, F> {
		return (this.ok ? this : other) as Result<T | U, F>
	}

	orElse<U, F>(f: (error: E) => Result<U, F>): Result<T | U, F> {
		return (this.ok ? this : f(this.value as E)) as Result<T | U, F>
	}

	unwrap(): T {
		if (this.ok) {
			return this.value as T
		}
		throw new UnwrapPanic(`called "unwrap()" on ${this.toString()}`)
	}

	unwrapErr(): E {
		if (this.err) {
			return this.value as E
		}
		throw new UnwrapPanic(`called "unwrapErr()" on ${this.toString()}`)
	}

	unwrapOr<U>(defaultValue: U): T | U {
		return this.ok ? (this.value as T) : defaultValue
	}

	unwrapOrElse<U>(defaultValue: (error: E) => U): T | U {
		return this.ok ? (this.value as T) : defaultValue(this.value as E)
	}

	match<A, B>(matcher: ResultMatcher<T, E, A, B>): A | B {
		return this.ok ? matcher.Ok(this.value as T) : matcher.Err(this.value as E)
	}

	toString(): `Ok(${string})` | `Err(${string})` {
		return this.ok ? `Ok(${this.value})` : `Err(${this.value})`
	}

	[inspectSymbol](): ReturnType<ResultImpl<T, E>["toString"]> {
		return this.toString()
	}

	toObject(): {ok: true; value: T} | {ok: false; value: E} {
		if (this.ok) {
			return {
				ok: true,
				value: this.value as T,
			}
		}
		return {
			ok: false,
			value: this.value as E,
		}
	}

	toJSON(): {meta: "Ok"; value: T} | {meta: "Err"; value: E} {
		if (this.ok) {
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
	readonly ok: true
	readonly err: false
	readonly value: T
}

export function Ok(): Ok
export function Ok<T>(value: T): Ok<T>
export function Ok<T>(value?: T): Ok<T> {
	return new ResultImpl<T, never>(true, value as T) as Ok<T>
}

export interface Err<E = undefined> extends ResultImpl<never, E> {
	readonly ok: false
	readonly err: true
	readonly value: E
}

export function Err(): Err
export function Err<E>(value: E): Err<E>
export function Err<E>(value?: E): Err<E> {
	return new ResultImpl<never, E>(false, value as E) as Err<E>
}

type Methods<T, E> = Omit<ResultImpl<T, E>, "ok" | "err" | "value">

type _ResultOk<T, E> = Ok<T> & Methods<T, E>
export interface ResultOk<T, E> extends _ResultOk<T, E> {}

type _ResultErr<T, E> = Err<E> & Methods<T, E>
export interface ResultErr<T, E> extends _ResultErr<T, E> {}

export type Result<T, E> = ResultOk<T, E> | ResultErr<T, E>
