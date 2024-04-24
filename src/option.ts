import {AsyncOption} from "./async_option";
import {AsyncResult} from "./async_result";
import * as symbols from "./symbols";
import {Panic} from "./error";
import {Err, Ok, type Result} from "./result";
import {inspectSymbol} from "./util_internal";

export type OptionMatch<T, A, B> = {
	Some: (value: T) => A;
	None: () => B;
};

export type OptionMatchAsync<T, A, B> = {
	Some: (value: T) => Promise<A>;
	None: () => Promise<B>;
};

export class OptionImpl<T> {
	readonly [symbols.kind]: boolean;
	private readonly [symbols.value]: T | undefined;

	constructor(some: boolean, x: T) {
		this[symbols.kind] = some;
		this[symbols.value] = x;
	}

	private unwrapFailed(message: string): never {
		throw new Panic(message, {cause: this[symbols.value]});
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
	match<A, B>(pattern: OptionMatch<T, A, B>): A | B {
		return this[symbols.kind] ? pattern.Some(this[symbols.value] as T) : pattern.None();
	}

	matchAsync<A, B>(pattern: OptionMatchAsync<T, A, B>): Promise<A | B> {
		return this[symbols.kind] ? pattern.Some(this[symbols.value] as T) : pattern.None();
	}

	/**
	 * Returns `true` if the option is a `Some` value.
	 */
	isSome(): this is Some<T> {
		return this[symbols.kind];
	}

	/**
	 * Returns `true` if the option is a `Some` value and the contained value is equal to `value`.
	 *
	 * Maybe not as useful as using `option.isSome() && f(option.value)`, because it doesn't narrow the type, but it's here for completeness.
	 */
	isSomeAnd(predicate: (value: T) => boolean): this is Some<T> {
		return this.isSome() && predicate(this[symbols.value] as T);
	}

	/**
	 * Returns `true` if the option is a `None` value.
	 */
	isNone(): this is None {
		return !this[symbols.kind];
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
		return this.match({
			Some: (t) => t,
			None: () => this.unwrapFailed(message),
		});
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
		return this.expect(`called \`unwrap()\` on \`None\``);
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
		return this.match({
			Some: (t) => t,
			None: () => defaultValue,
		});
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
		return this.match({
			Some: (t) => t,
			None: () => defaultValue(),
		});
	}

	unwrapOrElseAsync<U>(defaultValue: () => Promise<U>): Promise<T | U> {
		return this.matchAsync({
			Some: (t) => Promise.resolve(t),
			None: () => defaultValue(),
		});
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
		return this.match({
			Some: (t) => Some(f(t)),
			None: () => None,
		});
	}

	mapAsync<U>(f: (value: T) => Promise<U>): AsyncOption<U> {
		return new AsyncOption(
			this.matchAsync({
				Some: (t) => f(t).then(Some),
				None: () => Promise.resolve(None),
			}),
		);
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
		return this.match({
			Some: (t) => {
				f(t);
				return this;
			},
			None: () => this,
		});
	}

	inspectAsync(f: (value: T) => Promise<void>): AsyncOption<T> {
		return new AsyncOption(
			this.matchAsync({
				Some: (t) => f(t).then(() => Some(t)),
				None: () => Promise.resolve(None),
			}),
		);
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
		return this.match({
			Some: (t) => f(t),
			None: () => defaultValue,
		});
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
		return this.match({
			Some: (t) => f(t),
			None: () => defaultValue(),
		});
	}

	mapOrElseAsync<A, B>(
		defaultValue: () => Promise<A>,
		f: (value: T) => Promise<B>,
	): Promise<A | B> {
		return this.matchAsync({
			Some: (t) => f(t),
			None: () => defaultValue(),
		});
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
		return this.match({
			Some: (t) => Ok(t),
			None: () => Err(err),
		});
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
		return this.match({
			Some: (t) => Ok(t),
			None: () => Err(err()),
		});
	}

	okOrElseAsync<E>(err: () => Promise<E>): AsyncResult<T, E> {
		return new AsyncResult(
			this.matchAsync({
				Some: (t) => Promise.resolve(Ok(t)),
				None: () => err().then(Err),
			}) as Promise<Result<T, E>>,
		);
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
		return this.match({
			Some: () => other,
			None: () => None,
		});
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
		return this.match({
			Some: (t) => f(t),
			None: () => None,
		});
	}

	andThenAsync<U>(f: (value: T) => Promise<Option<U>> | AsyncOption<U>): AsyncOption<U> {
		return new AsyncOption(
			this.matchAsync({
				Some: (t) => f(t) as Promise<Option<U>>,
				None: () => Promise.resolve(None),
			}),
		);
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
		return this.match({
			Some: (t) => (predicate(t) ? Some(t) : None),
			None: () => None,
		});
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
		return this.match({
			Some: (t) => Some(t),
			None: () => other,
		});
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
		return this.match({
			Some: (t) => Some(t),
			None: () => f(),
		});
	}

	orElseAsync<U>(f: () => Promise<Option<U>> | AsyncOption<U>): AsyncOption<T | U> {
		return new AsyncOption(
			this.matchAsync({
				Some: (t) => Promise.resolve(Some(t)),
				None: () => f() as Promise<Option<U>>,
			}) as Promise<Option<T | U>>,
		);
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
		return this.match({
			Some: (t) => (other.isNone() ? Some(t) : None),
			None: () => other,
		});
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
		return this.match({
			Some: (t) => t,
			None: () => None,
		});
	}

	toObject(): {isSome: true; value: T} | {isSome: false; value: null} {
		return this.match({
			Some: (value) => ({isSome: true, value}),
			None: () => ({isSome: false, value: null}),
		});
	}

	toJSON(): {meta: "Some"; value: T} | {meta: "None"; value: null} {
		return this.match({
			Some: (value) => ({meta: "Some", value}),
			None: () => ({meta: "None", value: null}),
		});
	}

	toString(): `Some(${string})` | "None" {
		return this.match({
			Some: (value) => `Some(${String(value)})` as const,
			None: () => "None" as const,
		});
	}

	[inspectSymbol](): ReturnType<OptionImpl<T>["toString"]> {
		return this.toString();
	}
}

export interface Some<T> extends OptionImpl<T> {
	[symbols.kind]: true;
	value: () => T;
	unwrap(): T;
	expect(message: string): T;
}

/**
 * Some value of type `T`.
 */
export function Some<T>(value: T): Some<T> {
	const some = new OptionImpl(true, value) as Some<T>;
	some.value = () => value;
	return some;
}

export interface None<T = never> extends OptionImpl<T> {
	[symbols.kind]: false;
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
