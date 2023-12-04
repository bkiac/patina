import {Panic, UnwrapPanic} from "./panic"
import {inspectSymbol} from "./util"

export type OptionMatcher<T, A, B> = {
	Some: (value: T) => A
	None: () => B
}

export class OptionImpl<T> {
	readonly some: boolean
	readonly none: boolean
	readonly value: T | null

	constructor(some: boolean, value: T) {
		this.some = some
		this.none = !some
		this.value = value
	}

	and<U>(other: Option<U>): Option<U> {
		return this.some ? other : None
	}

	andThen<U>(f: (value: T) => Option<U>): Option<U> {
		return this.some ? f(this.value as T) : None
	}

	expect(panic: string): T {
		if (this.some) {
			return this.value as T
		}
		throw new Panic(panic)
	}

	filter(f: (value: T) => boolean): Option<T> {
		return (this.some && f(this.value as T) ? this : None) as Option<T>
	}

	inspect(f: (value: T) => void): this {
		if (this.some) {
			f(this.value as T)
		}
		return this
	}

	map<U>(f: (value: T) => U): Option<U> {
		return (this.some ? new OptionImpl(true, f(this.value as T)) : None) as Option<U>
	}

	mapOr<A, B>(defaultValue: A, f: (value: T) => B): A | B {
		return this.some ? f(this.value as T) : defaultValue
	}

	mapOrElse<A, B>(defaultValue: () => A, f: (value: T) => B): A | B {
		return this.some ? f(this.value as T) : defaultValue()
	}

	or<U>(other: Option<U>): Option<T | U> {
		return (this.some ? this : other) as Option<T | U>
	}

	orElse<U>(f: () => Option<U>): Option<T | U> {
		return (this.some ? this : f()) as Option<T | U>
	}

	unwrap(): T {
		if (this.some) {
			return this.value as T
		}
		throw new UnwrapPanic(`called "unwrap()" on ${this.toString()}`)
	}

	unwrapOr<U>(defaultValue: U): T | U {
		return this.some ? (this.value as T) : defaultValue
	}

	unwrapOrElse<U>(defaultValue: () => U): T | U {
		return this.some ? (this.value as T) : defaultValue()
	}

	xor<U>(other: Option<U>): Option<T | U> {
		if (this.some) {
			return (other.some ? None : this) as Option<T | U>
		}
		return (other.some ? other : None) as Option<T | U>
	}

	match<A, B>(matcher: OptionMatcher<T, A, B>): A | B {
		return this.some ? matcher.Some(this.value as T) : matcher.None()
	}

	toString(): `Some(${string})` | "None" {
		return this.some ? `Some(${this.value})` : "None"
	}

	[inspectSymbol](): ReturnType<OptionImpl<T>["toString"]> {
		return this.toString()
	}

	toObject(): {some: true; value: T} | {some: false; value: null} {
		return this.some ? {some: true, value: this.value as T} : {some: false, value: null}
	}

	toJSON(): {meta: "Some"; value: T} | {meta: "None"; value: null} {
		return this.some ? {meta: "Some", value: this.value as T} : {meta: "None", value: null}
	}
}

export interface Some<T> extends OptionImpl<T> {
	readonly some: true
	readonly none: false
	readonly value: T
}
export function Some<T>(value: T): Some<T> {
	return new OptionImpl(true, value) as Some<T>
}

export interface None extends OptionImpl<never> {
	readonly some: false
	readonly none: true
	readonly value: null
}
export const None = new OptionImpl(false, null) as None

type Methods<T> = Omit<OptionImpl<T>, "some" | "none" | "value">

type _OptionSome<T> = Some<T> & Methods<T>
export interface OptionSome<T> extends _OptionSome<T> {}

type _OptionNone<T> = None & Methods<T>
export interface OptionNone<T> extends _OptionNone<T> {}

export type Option<T> = OptionSome<T> | OptionNone<T>
export function Option() {}
Option.from = <T>(value: T | null | undefined): Option<T> => (value ? Some(value) : None)
