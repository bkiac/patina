import {inspectSymbol} from "./util"
import type {OptionMethods, Option} from "./option"
import {None} from "./none"

export class SomeImpl<T> implements OptionMethods<T> {
	readonly some = true
	readonly none = false
	readonly value: T

	constructor(value: T) {
		this.value = value
	}

	and<U>(other: Option<U>): Option<U> {
		return other
	}

	andThen<U>(f: (value: T) => Option<U>): Option<U> {
		return f(this.value)
	}

	expect(_panic: string): T {
		return this.value
	}

	filter(f: (value: T) => boolean): Option<T> {
		return f(this.value) ? this : None
	}

	inspect(f: (value: T) => void): this {
		f(this.value)
		return this
	}

	map<U>(f: (value: T) => U): Some<U> {
		return new SomeImpl(f(this.value))
	}

	mapOr<A, B>(_defaultValue: A, f: (value: T) => B): B {
		return f(this.value)
	}

	mapOrElse<A, B>(_defaultValue: () => A, f: (value: T) => B): B {
		return f(this.value)
	}

	or<U>(_other: Option<U>): this {
		return this
	}

	orElse<U>(_f: () => Option<U>): this {
		return this
	}

	unwrap(): T {
		return this.value
	}

	unwrapOr<U>(_defaultValue: U): T {
		return this.value
	}

	unwrapOrElse<U>(_defaultValue: () => U): T {
		return this.value
	}

	xor<U>(other: Option<U>): Option<T | U> {
		return other.some ? None : this
	}

	match<A, B>(some: (value: T) => A, _none: () => B): A {
		return some(this.value)
	}

	toString(): `Some(${string})` {
		return `Some(${this.value})` as const
	}

	[inspectSymbol](): ReturnType<OptionMethods<T>["toString"]> {
		return this.toString()
	}

	toObject(): {some: true; value: T} {
		return {some: true, value: this.value} as const
	}

	toJSON(): {meta: "Some"; value: T} {
		return {meta: "Some", value: this.value} as const
	}
}

export interface Some<T> extends SomeImpl<T> {}
export function Some<T>(value: T): Some<T> {
	return new SomeImpl(value)
}
