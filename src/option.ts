import {Panic} from "./error"
import {Err, Ok, type Result} from "./result"
import {inspectSymbol} from "./util"

export type OptionMatch<T, A, B> = {
	Some: (value: T) => A
	None: () => B
}

export class OptionImpl<T> {
	readonly isSome: boolean
	readonly isNone: boolean
	readonly value: T | undefined

	constructor(some: boolean, value: T) {
		this.isSome = some
		this.isNone = !some
		this.value = value
	}

	expect(message: string): T {
		if (this.isSome) {
			return this.value as T
		}
		throw new Panic(message, {cause: this})
	}

	unwrap(): T {
		if (this.isSome) {
			return this.value as T
		}
		throw new Panic(`called "unwrap()" on ${this.toString()}`, {cause: this})
	}

	unwrapOr<U>(defaultValue: U): T | U {
		return this.isSome ? (this.value as T) : defaultValue
	}

	unwrapOrElse<U>(defaultValue: () => U): T | U {
		return this.isSome ? (this.value as T) : defaultValue()
	}

	map<U>(f: (value: T) => U): Option<U> {
		return (this.isSome ? new OptionImpl(true, f(this.value as T)) : None) as Option<U>
	}

	examine(f: (value: T) => void): this {
		if (this.isSome) {
			f(this.value as T)
		}
		return this
	}

	mapOr<A, B>(defaultValue: A, f: (value: T) => B): A | B {
		return this.isSome ? f(this.value as T) : defaultValue
	}

	mapOrElse<A, B>(defaultValue: () => A, f: (value: T) => B): A | B {
		return this.isSome ? f(this.value as T) : defaultValue()
	}

	okOr<E>(err: E): Result<T, E> {
		return this.isSome ? Ok(this.value as T) : Err(err)
	}

	okOrElse<E>(err: () => E): Result<T, E> {
		return this.isSome ? Ok(this.value as T) : Err(err())
	}

	and<U>(other: Option<U>): Option<U> {
		return this.isSome ? other : None
	}

	andThen<U>(f: (value: T) => Option<U>): Option<U> {
		return this.isSome ? f(this.value as T) : None
	}

	filter(f: (value: T) => boolean): Option<T> {
		return (this.isSome && f(this.value as T) ? this : None) as Option<T>
	}

	or<U>(other: Option<U>): Option<T | U> {
		return (this.isSome ? this : other) as Option<T | U>
	}

	orElse<U>(f: () => Option<U>): Option<T | U> {
		return (this.isSome ? this : f()) as Option<T | U>
	}

	xor<U>(other: Option<U>): Option<T | U> {
		if (this.isSome) {
			return (other.isSome ? None : this) as Option<T | U>
		}
		return (other.isSome ? other : None) as Option<T | U>
	}

	flatten<U>(this: Option<Option<U>>): Option<U> {
		return (this.isSome ? (this.value as Option<U>) : None) as Option<U>
	}

	match<A, B>(matcher: OptionMatch<T, A, B>): A | B {
		return this.isSome ? matcher.Some(this.value as T) : matcher.None()
	}

	toObject(): {some: true; value: T} | {some: false; value: null} {
		return this.isSome ? {some: true, value: this.value as T} : {some: false, value: null}
	}

	toJSON(): {meta: "Some"; value: T} | {meta: "None"; value: null} {
		return this.isSome ? {meta: "Some", value: this.value as T} : {meta: "None", value: null}
	}

	toString(): `Some(${string})` | "None" {
		return this.isSome ? `Some(${this.value})` : "None"
	}

	[inspectSymbol](): ReturnType<OptionImpl<T>["toString"]> {
		return this.toString()
	}
}

export interface Some<T> extends OptionImpl<T> {
	readonly isSome: true
	readonly isNone: false
	readonly value: T
	unwrap(): T
	expect(message: string): T
}

export function Some<T>(value: T): Some<T> {
	return new OptionImpl(true, value) as Some<T>
}

export interface None<T = never> extends OptionImpl<T> {
	readonly isSome: false
	readonly isNone: true
	readonly value: undefined
	unwrap(): never
	expect(message: string): never
}

export const None = new OptionImpl(false, undefined) as None

export type Option<T> = Some<T> | None<T>

export function Option<T>(value: T | undefined | null): Option<T> {
	return value == null ? None : Some(value)
}
