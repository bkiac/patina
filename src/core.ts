import {InvalidErrorPanic, Panic, PropagationPanic, UnwrapPanic} from "./panic"

interface Methods<T> {
	match<A, B>(args: {ok: (value: T) => A; err: (error: Error) => B}): A | B
	tap(): T
	expect(panicOrMessage: Panic | string): T
	unwrapUnsafe(): T
	unwrapOr<U>(defaultValue: U): T | U
	unwrapOrElse<U>(defaultValue: (error: Error) => U): T | U
	unwrapErrUnsafe(): Error
}

export class Ok<T = undefined> implements Methods<T> {
	readonly ok = true
	readonly value: T

	constructor()
	constructor(value: T)
	constructor(value?: T) {
		this.value = value as T
	}

	match<A, B>({ok}: {ok: (value: T) => A; err: (error: never) => B}) {
		return ok(this.value)
	}

	private unwrap() {
		return this.value
	}

	tap = this.unwrap
	expect = this.unwrap
	unwrapUnsafe = this.unwrap
	unwrapOr = this.unwrap
	unwrapOrElse = this.unwrap

	unwrapErrUnsafe(): never {
		throw new UnwrapPanic("Cannot unwrapErr on an Ok")
	}
}

export class Err implements Methods<never> {
	readonly ok = false
	readonly error: Error

	constructor(error: Error)
	constructor(message: string)
	constructor(errorOrMessage: unknown) {
		if (errorOrMessage instanceof Panic) {
			throw new Panic("Cannot create an Err from a Panic")
		}
		if (errorOrMessage instanceof Error) {
			this.error = errorOrMessage
		} else if (typeof errorOrMessage === "string") {
			this.error = new Error(errorOrMessage)
		} else {
			this.error = new Error("Unknown Error")
		}
	}

	match<A, B>({err}: {ok: (value: never) => A; err: (error: Error) => B}) {
		return err(this.error)
	}

	tap(): never {
		throw new PropagationPanic(this.error)
	}

	expect(panicOrMessage: Panic | string): never {
		if (panicOrMessage instanceof Panic) {
			throw panicOrMessage
		}
		throw new Panic(panicOrMessage)
	}

	unwrapUnsafe(): never {
		throw new UnwrapPanic(this.error)
	}

	unwrapOr<U>(defaultValue: U) {
		return defaultValue
	}

	unwrapOrElse<U>(defaultValue: (error: Error) => U) {
		return defaultValue(this.error)
	}

	unwrapErrUnsafe() {
		return this.error
	}
}

export type Result<T> = Ok<T> | Err

export function handleError(error: unknown) {
	if (error instanceof Panic) {
		throw error
	}
	if (error instanceof Error) {
		return error
	}
	throw new InvalidErrorPanic(error)
}
