import {Panic, UnwrapPanic} from "../error/panic.js"
import {inspectSymbol} from "../util.js"
import type {OptionMethods, Option} from "./option.js"

export class NoneImpl implements OptionMethods<never> {
	readonly some = false
	readonly none = true
	readonly value = null

	and<U>(_other: Option<U>): None {
		return None
	}

	andThen<U>(_f: (value: never) => Option<U>): None {
		return None
	}

	expect(panic: string): never {
		throw new Panic(panic)
	}

	filter(_f: (value: never) => boolean): None {
		return None
	}

	inspect(_f: (value: never) => void): None {
		return None
	}

	map<U>(_f: (value: never) => U): None {
		return None
	}

	mapOr<A, B>(defaultValue: A, _f: (value: never) => B): A {
		return defaultValue
	}

	mapOrElse<A, B>(defaultValue: () => A, _f: (value: never) => B): A {
		return defaultValue()
	}

	or<U>(other: Option<U>): Option<U> {
		return other
	}

	orElse<U>(f: () => Option<U>): Option<U> {
		return f()
	}

	unwrap(): never {
		throw new UnwrapPanic(`called "unwrap()" on None`)
	}

	unwrapOr<U>(defaultValue: U): U {
		return defaultValue
	}

	unwrapOrElse<U>(defaultValue: () => U): U {
		return defaultValue()
	}

	xor<U>(other: Option<U>): Option<U> {
		return other
	}

	match<A, B>(_some: (value: never) => A, none: () => B): B {
		return none()
	}

	toString(): "None" {
		return "None" as const
	}

	[inspectSymbol](): "None" {
		return this.toString()
	}

	toObject(): {some: false; value: null} {
		return {some: false, value: null} as const
	}

	toJSON(): {meta: "None"; value: null} {
		return {meta: "None", value: null} as const
	}
}

export interface None extends NoneImpl {}
export const None: None = new NoneImpl()
