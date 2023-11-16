import {Panic, UnwrapPanic} from "./panic"
import {inspectSymbol} from "./util"

export class OptionImpl<T> {
	readonly some: boolean
	readonly none: boolean
	readonly value: T | never

	constructor(some: boolean, value: T) {
		this.some = some
		this.none = !some
		this.value = value
	}

	and<U>(other: Option<U>): Option<T | U> {
		return this.some ? other : None
	}

	andThen<U>(f: (value: T) => Option<U>): Option<T | U> {
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

	map<U>(f: (value: T) => U): Option<T | U> {
		return (this.some ? new OptionImpl(true, f(this.value as T)) : None) as Option<T | U>
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
		return other.some ? other : (None as Option<T | U>)
	}

	match<A, B>(some: (value: T) => A, none: () => B): A | B {
		return this.some ? some(this.value as T) : none()
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
	readonly value: never
}
export const None = new OptionImpl(false, null) as None

export type Option<T> = (Some<T> | None) & OptionImpl<T>
