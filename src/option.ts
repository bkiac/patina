import {Panic} from "./panic"
import {inspectSymbol} from "./util"

export type OptionMatch<T, A, B> = {
	Some: (value: T) => A
	None: () => B
}

export class OptionImpl<T> {
	readonly isSome: boolean
	readonly isNone: boolean
	readonly value: T | null

	constructor(some: boolean, value: T) {
		this.isSome = some
		this.isNone = !some
		this.value = value
	}

	and<U>(other: Option<U>): Option<U> {
		return this.isSome ? other : None
	}

	andThen<U>(f: (value: T) => Option<U>): Option<U> {
		return this.isSome ? f(this.value as T) : None
	}

	examine(f: (value: T) => void): this {
		if (this.isSome) {
			f(this.value as T)
		}
		return this
	}

	expect(message: string): T {
		if (this.isSome) {
			return this.value as T
		}
		throw new Panic({message, cause: this})
	}

	filter(f: (value: T) => boolean): Option<T> {
		return (this.isSome && f(this.value as T) ? this : None) as Option<T>
	}

	flatten<U>(this: Option<Option<U>>): Option<U> {
		return (this.isSome ? (this.value as Option<U>) : None) as Option<U>
	}

	map<U>(f: (value: T) => U): Option<U> {
		return (this.isSome ? new OptionImpl(true, f(this.value as T)) : None) as Option<U>
	}

	mapOr<A, B>(defaultValue: A, f: (value: T) => B): A | B {
		return this.isSome ? f(this.value as T) : defaultValue
	}

	mapOrElse<A, B>(defaultValue: () => A, f: (value: T) => B): A | B {
		return this.isSome ? f(this.value as T) : defaultValue()
	}

	or<U>(other: Option<U>): Option<T | U> {
		return (this.isSome ? this : other) as Option<T | U>
	}

	orElse<U>(f: () => Option<U>): Option<T | U> {
		return (this.isSome ? this : f()) as Option<T | U>
	}

	unwrap(): T {
		if (this.isSome) {
			return this.value as T
		}
		throw new Panic({message: `called "unwrap()" on ${this.toString()}`, cause: this})
	}

	unwrapOr<U>(defaultValue: U): T | U {
		return this.isSome ? (this.value as T) : defaultValue
	}

	unwrapOrElse<U>(defaultValue: () => U): T | U {
		return this.isSome ? (this.value as T) : defaultValue()
	}

	xor<U>(other: Option<U>): Option<T | U> {
		if (this.isSome) {
			return (other.isSome ? None : this) as Option<T | U>
		}
		return (other.isSome ? other : None) as Option<T | U>
	}

	match<A, B>(matcher: OptionMatch<T, A, B>): A | B {
		return this.isSome ? matcher.Some(this.value as T) : matcher.None()
	}

	toString(): `Some(${string})` | "None" {
		return this.isSome ? `Some(${this.value})` : "None"
	}

	[inspectSymbol](): ReturnType<OptionImpl<T>["toString"]> {
		return this.toString()
	}

	toObject(): {some: true; value: T} | {some: false; value: null} {
		return this.isSome ? {some: true, value: this.value as T} : {some: false, value: null}
	}

	toJSON(): {meta: "Some"; value: T} | {meta: "None"; value: null} {
		return this.isSome ? {meta: "Some", value: this.value as T} : {meta: "None", value: null}
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
	readonly value: null
	unwrap(): never
	expect(message: string): never
}

export const None = new OptionImpl(false, null) as None

export type Option<T> = Some<T> | None<T>
export function Option() {}
Option.from = <T>(value: T | null | undefined): Option<T> =>
	value === null || value === undefined ? None : Some(value)
