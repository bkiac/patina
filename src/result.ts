import {Panic} from "./error"
import {inspectSymbol} from "./util"
import {Option, Some, None} from "./option"

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

	ok(): Option<T> {
		return this.isOk ? Some(this.value as T) : None
	}

	err(): Option<E> {
		return this.isErr ? Some(this.value as E) : None
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

	expect(message: string): T {
		if (this.isOk) {
			return this.value as T
		}
		throw new Panic(message, {cause: this})
	}

	unwrap(): T {
		if (this.isOk) {
			return this.value as T
		}
		throw new Panic(`called "unwrap()" on ${this.toString()}`, {cause: this})
	}

	expectErr(message: string): E {
		if (this.isErr) {
			return this.value as E
		}
		throw new Panic(message, {cause: this})
	}

	unwrapErr(): E {
		if (this.isErr) {
			return this.value as E
		}
		throw new Panic(`called "unwrapErr()" on ${this.toString()}`, {cause: this})
	}

	and<U, F>(other: Result<U, F>): Result<U, E | F> {
		return (this.isOk ? other : this) as Result<U, E | F>
	}

	andThen<U, F>(f: (value: T) => Result<U, F>): Result<U, E | F> {
		return (this.isOk ? f(this.value as T) : this) as Result<U, E | F>
	}

	or<U, F>(other: Result<U, F>): Result<T | U, F> {
		return (this.isOk ? this : other) as Result<T | U, F>
	}

	orElse<U, F>(f: (error: E) => Result<U, F>): Result<T | U, F> {
		return (this.isOk ? this : f(this.value as E)) as Result<T | U, F>
	}

	unwrapOr<U>(defaultValue: U): T | U {
		return this.isOk ? (this.value as T) : defaultValue
	}

	unwrapOrElse<U>(defaultValue: (error: E) => U): T | U {
		return this.isOk ? (this.value as T) : defaultValue(this.value as E)
	}

	flatten<U, F>(this: Result<ResultImpl<U, F>, E>): Result<U, E | F> {
		return (this.isOk ? this.value : this) as Result<U, E | F>
	}

	match<A, B>(matcher: ResultMatch<T, E, A, B>): A | B {
		return this.isOk ? matcher.Ok(this.value as T) : matcher.Err(this.value as E)
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

export function Err(): Err
export function Err<E>(value: E): Err<E>
export function Err<E>(value?: E): Err<E> {
	return new ResultImpl<never, E>(false, value as E) as Err<E>
}

export type Result<T, E> = Ok<T, E> | Err<E, T>
