import type {inspectSymbol} from "../util"

export interface ResultMethods<T, E> {
	and<U, F>(other: Result<U, F>): Result<U, E | F>
	andThen<U, F>(f: (value: T) => Result<U, F>): Result<U, E | F>
	expect(panic: string): T
	expectErr(panic: string): E
	inspect(f: (value: T) => void): Result<T, E>
	inspectErr(f: (error: E) => void): Result<T, E>
	map<U>(f: (value: T) => U): Result<U, E>
	mapErr<F>(f: (error: E) => F): Result<T, F>
	mapOr<A, B>(defaultValue: A, f: (value: T) => B): A | B
	mapOrElse<A, B>(defaultValue: (error: E) => A, f: (value: T) => B): A | B
	or<U, F>(other: Result<U, F>): Result<T | U, E | F>
	orElse<U, F>(f: (error: E) => Result<U, F>): Result<T | U, E | F>
	unwrap(): T
	unwrapErr(): E
	unwrapOr<U>(defaultValue: U): T | U
	unwrapOrElse<U>(defaultValue: (error: E) => U): T | U

	into(): T | E
	match<A, B>(ok: (value: T) => A, err: (error: E) => B): A | B

	toString(): `Ok(${string})` | `Err(${string})`
	[inspectSymbol](): ReturnType<ResultMethods<T, E>["toString"]>
	toObject(): {ok: true; value: T} | {ok: false; error: E}
	toJSON(): {meta: "Ok"; data: T} | {meta: "Err"; data: E}
}

export interface OkVariant<T> {
	readonly ok: true
	readonly err: false
	readonly value: T
}

export interface ErrVariant<E> {
	readonly ok: false
	readonly err: true
	readonly error: E
}

export type ResultVariants<T, E> = OkVariant<T> | ErrVariant<E>

export type Result<T, E> = ResultVariants<T, E> & ResultMethods<T, E>
