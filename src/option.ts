import {Variant, Value} from "./common";
import {Panic} from "./error";
import {Err, Ok, type Result} from "./result";
import {inspectSymbol} from "./util_internal";

export type OptionMatch<T, A, B> = {
	Some: (value: T) => A;
	None: () => B;
};

export class OptionImpl<T> {
	private readonly [Variant]: boolean;
	private readonly [Value]: T | undefined;

	constructor(isSome: boolean, value: T) {
		this[Variant] = isSome;
		this[Value] = value;
	}

	get isSome(): boolean {
		return this[Variant];
	}

	get isNone(): boolean {
		return !this[Variant];
	}

	get value(): T | undefined {
		return this[Value];
	}

	/**
	 * Returns the contained `Some` value, if exists.
	 *
	 * Throws `Panic` with the provided message if the value is `None`.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).expect("The world is ending") // => 42
	 * None.expect("The world is ending") // => Panic: The world is ending
	 * ```
	 */
	expect(message: string): T {
		if (this.isSome) {
			return this.value as T;
		}
		throw new Panic(message, {cause: this});
	}

	/**
	 * Returns the contained `Some` value, if exists.
	 *
	 * Throws `Panic` with a default message if the value is `None`.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).unwrap() // => 42
	 * None.unwrap() // => Panic: called "unwrap()" on None
	 * ```
	 */
	unwrap(): T {
		if (this.isSome) {
			return this.value as T;
		}
		throw new Panic(`called "unwrap()" on ${this.toString()}`, {cause: this});
	}

	/**
	 * Returns the contained `Some` value, if exists.
	 *
	 * Otherwise, returns the provided default value.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).unwrapOr(0) // => 42
	 * None.unwrapOr(0) // => 0
	 * ```
	 */
	unwrapOr<U>(defaultValue: U): T | U {
		return this.isSome ? (this.value as T) : defaultValue;
	}

	/**
	 * Returns the contained `Some` value, if exists.
	 *
	 * Otherwise, computes the provided default value.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).unwrapOrElse(() => 0) // => 42
	 * None.unwrapOrElse(() => 0) // => 0
	 * ```
	 */
	unwrapOrElse<U>(defaultValue: () => U): T | U {
		return this.isSome ? (this.value as T) : defaultValue();
	}

	/**
	 * Maps an `Option<T>` to `Option<U>` by applying a function to a contained value.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).map(x => x + 1) // => Some(43)
	 * None.map(x => x + 1) // => None
	 * ```
	 */
	map<U>(f: (value: T) => U): Option<U> {
		return (this.isSome ? new OptionImpl(true, f(this.value as T)) : None) as Option<U>;
	}

	/**
	 * Calls `f` if the `Option` is `Some`, otherwise returns `None`.
	 *
	 * **Examples**
	 *
	 * ```
	 * Ok(42).inspect(console.log) // => 42
	 * ```
	 */
	inspect(f: (value: T) => void): this {
		if (this.isSome) {
			f(this.value as T);
		}
		return this;
	}

	/**
	 * Returns the provided default result (if none), or applies a function to the contained value (if any).
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).mapOr(0, x => x + 1) // => 43
	 * None.mapOr(0, x => x + 1) // => 0
	 * ```
	 */
	mapOr<A, B>(defaultValue: A, f: (value: T) => B): A | B {
		return this.isSome ? f(this.value as T) : defaultValue;
	}

	/**
	 * Returns the provided default result (if none), or computes a default value by applying a function to the contained value (if any).
	 *
	 * **Examples**
	 *
	 * ```
	 * const k = 21
	 * Some("foo").mapOrElse(() => k * 2, (v) => v.length) // => 3
	 * None.mapOrElse(() => k * 2, (v) => v.length) // => 42
	 * ```
	 */
	mapOrElse<A, B>(defaultValue: () => A, f: (value: T) => B): A | B {
		return this.isSome ? f(this.value as T) : defaultValue();
	}

	/**
	 * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err)`.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).okOr("failed") // => Ok(42)
	 * None.okOr("failed") // => Err("failed")
	 * ```
	 */
	okOr<E>(err: E): Result<T, E> {
		return this.isSome ? Ok(this.value as T) : Err(err);
	}

	/**
	 * Transforms the `Option<T>` into a `Result<T, E>`, mapping `Some(v)` to `Ok(v)` and `None` to `Err(err())`.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).okOrElse(() => "failed") // => Ok(42)
	 * None.okOrElse(() => "failed") // => Err("failed")
	 * ```
	 */
	okOrElse<E>(err: () => E): Result<T, E> {
		return this.isSome ? Ok(this.value as T) : Err(err());
	}

	/**
	 * Returns `None` if the option is `None`, otherwise returns `other`.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).and(Some(54)) // => Some(54)
	 * Some(42).and(None) // => None
	 * None.and(Some(54)) // => None
	 * None.and(None) // => None
	 * ```
	 */
	and<U>(other: Option<U>): Option<U> {
		return this.isSome ? other : None;
	}

	/**
	 * Returns `None` if the option is `None`, otherwise calls `f` with the wrapped value and returns the result.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).andThen(x => Some(x + 1)) // => Some(43)
	 * Some(42).andThen(x => None) // => None
	 * None.andThen(x => Some(x + 1)) // => None
	 * ```
	 */
	andThen<U>(f: (value: T) => Option<U>): Option<U> {
		return this.isSome ? f(this.value as T) : None;
	}

	/**
	 * Returns `None` if the option is `None`, otherwise calls `predicate` with the wrapped value and returns:
	 * - `Some<T>` if predicate returns true, and
	 * - `None` if predicate returns false.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).filter(x => x > 40) // => Some(42)
	 * Some(42).filter(x => x > 50) // => None
	 * None.filter(x => x > 40) // => None
	 * ```
	 */
	filter(predicate: (value: T) => boolean): Option<T> {
		return (this.isSome && predicate(this.value as T) ? this : None) as Option<T>;
	}

	/**
	 * Returns the option if it contains a value, otherwise returns `other`.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).or(Some(54)) // => Some(42)
	 * Some(42).or(None) // => Some(42)
	 * None.or(Some(54)) // => Some(54)
	 * None.or(None) // => None
	 * ```
	 */
	or<U>(other: Option<U>): Option<T | U> {
		return (this.isSome ? this : other) as Option<T | U>;
	}

	/**
	 * Returns the option if it contains a value, otherwise calls `f` and returns the result.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).orElse(() => Some(54)) // => Some(42)
	 * Some(42).orElse(() => None) // => Some(42)
	 * None.orElse(() => Some(54)) // => Some(54)
	 * None.orElse(() => None) // => None
	 * ```
	 */
	orElse<U>(f: () => Option<U>): Option<T | U> {
		return (this.isSome ? this : f()) as Option<T | U>;
	}

	/**
	 * Returns `Some` if exactly one of `this` and `other` is `Some`, otherwise returns `None`.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).xor(Some(54)) // => None
	 * Some(42).xor(None) // => Some(42)
	 * None.xor(Some(54)) // => Some(54)
	 * None.xor(None) // => None
	 * ```
	 */
	xor<U>(other: Option<U>): Option<T | U> {
		if (this.isSome) {
			return (other.isSome ? None : this) as Option<T | U>;
		}
		return (other.isSome ? other : None) as Option<T | U>;
	}

	/**
	 * Converts from `Option<Option<U>>` to `Option<U>`.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(Some(42)).flatten() // => Some(42)
	 * Some(None).flatten() // => None
	 * ```
	 */
	flatten<U>(this: Option<Option<U>>): Option<U> {
		return (this.isSome ? (this.value as Option<U>) : None) as Option<U>;
	}

	/**
	 * Matches the option to its content.
	 *
	 * **Examples**
	 *
	 * ```
	 * Some(42).match({
	 * 	Some: (value) => value + 1,
	 * 	None: () => 0
	 * }) // => 43
	 * ```
	 */
	match<A, B>(matcher: OptionMatch<T, A, B>): A | B {
		return this.isSome ? matcher.Some(this.value as T) : matcher.None();
	}

	toObject(): {some: true; value: T} | {some: false; value: null} {
		return this.isSome ? {some: true, value: this.value as T} : {some: false, value: null};
	}

	toJSON(): {meta: "Some"; value: T} | {meta: "None"; value: null} {
		return this.isSome ? {meta: "Some", value: this.value as T} : {meta: "None", value: null};
	}

	toString(): `Some(${string})` | "None" {
		return this.isSome ? `Some(${this.value})` : "None";
	}

	[inspectSymbol](): ReturnType<OptionImpl<T>["toString"]> {
		return this.toString();
	}
}

export interface Some<T> extends OptionImpl<T> {
	readonly isSome: true;
	readonly isNone: false;
	readonly value: T;
	unwrap(): T;
	expect(message: string): T;
}

/**
 * Some value of type `T`.
 */
export function Some<T>(value: T): Some<T> {
	return new OptionImpl(true, value) as Some<T>;
}

export interface None<T = never> extends OptionImpl<T> {
	readonly isSome: false;
	readonly isNone: true;
	readonly value: undefined;
	unwrap(): never;
	expect(message: string): never;
}

/**
 * No value.
 */
export const None = new OptionImpl(false, undefined) as None;

/**
 * `Option` represents an optional value: every `Option` is either `Some` and contains a value, or `None`, and does not.
 */
export type Option<T> = Some<T> | None<T>;

export function Option<T>(value: T | undefined | null): Option<T> {
	return value == null ? None : Some(value);
}
