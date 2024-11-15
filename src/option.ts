import { AsyncOption } from "./async_option.ts";
import { AsyncResult } from "./async_result.ts";
import { Panic } from "./error.ts";
import { Err, Ok, type Result } from "./result.ts";
import * as symbols from "./symbols.ts";

export type OptionMatch<T, A, B> = {
	Some: (value: T) => A;
	None: () => B;
};

export type OptionMatchAsync<T, A, B> = {
	Some: (value: T) => Promise<A>;
	None: () => Promise<B>;
};

export class OptionImpl<T> {
	private readonly _some: boolean;
	private readonly _value: T | undefined;

	public constructor(some: boolean, value: T | undefined) {
		Object.defineProperty(this.constructor, "name", { value: "Option" });
		this._some = some;
		this._value = value;
	}

	public get [Symbol.toStringTag](): "Some" | "None" {
		return this._some ? "Some" : "None";
	}

	public toJSON(): T | null {
		if (this._some) {
			return this._value as T;
		}
		return null;
	}

	public toString(): `Some(${string})` | "None" {
		if (this._some) {
			return `Some(${String(this._value)})`;
		}
		return "None";
	}

	public [Symbol.for("nodejs.util.inspect.custom")](): string {
		return this.toString();
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
	public match<A, B>(pattern: OptionMatch<T, A, B>): A | B {
		if (this._some) {
			return pattern.Some(this._value as T);
		}
		return pattern.None();
	}

	public matchAsync<A, B>(pattern: OptionMatchAsync<T, A, B>): Promise<A | B> {
		if (this._some) {
			return pattern.Some(this._value as T);
		}
		return pattern.None();
	}

	/**
	 * Returns `true` if the option is a `Some` value.
	 */
	public isSome(): this is Some<T> {
		return this._some;
	}

	/**
	 * Returns `true` if the option is a `Some` value and the contained value is equal to `value`.
	 *
	 * Maybe not as useful as using `option.isSome() && f(option.value)`, because it doesn't narrow the type, but it's here for completeness.
	 */
	public isSomeAnd(predicate: (value: T) => boolean): this is Some<T> {
		if (this._some) {
			return predicate(this._value as T);
		}
		return false;
	}

	/**
	 * Returns `true` if the option is a `None` value.
	 */
	public isNone(): this is None<T> {
		return !this._some;
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
	public expect(message: string): T {
		if (this._some) {
			return this._value as T;
		}
		throw new Panic(message);
	}

	/**
	 * Returns the contained `Some` value, if exists, otherwise returns `undefined`.
	 */
	public unwrap(): T | undefined {
		if (this._some) {
			return this._value as T;
		}
		return undefined;
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
	public unwrapOr<U>(defaultValue: U): T | U {
		if (this._some) {
			return this._value as T;
		}
		return defaultValue;
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
	public unwrapOrElse<U>(defaultValue: () => U): T | U {
		if (this._some) {
			return this._value as T;
		}
		return defaultValue();
	}

	public unwrapOrElseAsync<U>(defaultValue: () => Promise<U>): Promise<T | U> {
		if (this._some) {
			return Promise.resolve(this._value as T);
		}
		return defaultValue();
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
	public map<U>(f: (value: T) => U): Option<U> {
		if (this._some) {
			return Some(f(this._value as T));
		}
		return None;
	}

	public mapAsync<U>(f: (value: T) => Promise<U>): AsyncOption<U> {
		if (this._some) {
			return new AsyncOption(f(this._value as T).then(Some));
		}
		return new AsyncOption(Promise.resolve(None));
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
	public inspect(f: (value: T) => void): this {
		if (this._some) {
			f(this._value as T);
		}
		return this;
	}

	public inspectAsync(f: (value: T) => Promise<void>): AsyncOption<T> {
		if (this._some) {
			return new AsyncOption(f(this._value as T).then(() => this as unknown as Some<T>));
		}
		return new AsyncOption(Promise.resolve(None));
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
	public mapOr<A, B>(defaultValue: A, f: (value: T) => B): A | B {
		if (this._some) {
			return f(this._value as T);
		}
		return defaultValue;
	}

	public mapOrAsync<A, B>(defaultValue: A, f: (value: T) => Promise<B>): Promise<A | B> {
		if (this._some) {
			return f(this._value as T);
		}
		return Promise.resolve(defaultValue);
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
	public mapOrElse<A, B>(defaultValue: () => A, f: (value: T) => B): A | B {
		if (this._some) {
			return f(this._value as T);
		}
		return defaultValue();
	}

	public mapOrElseAsync<A, B>(
		defaultValue: () => Promise<A>,
		f: (value: T) => Promise<B>,
	): Promise<A | B> {
		if (this._some) {
			return f(this._value as T);
		}
		return defaultValue();
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
	public okOr<E>(err: E): Result<T, E> {
		if (this._some) {
			return Ok(this._value as T);
		}
		return Err(err);
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
	public okOrElse<E>(err: () => E): Result<T, E> {
		if (this._some) {
			return Ok(this._value as T);
		}
		return Err(err());
	}

	public okOrElseAsync<E>(err: () => Promise<E>): AsyncResult<T, E> {
		if (this._some) {
			return new AsyncResult(Promise.resolve(Ok(this._value as T)));
		}
		return new AsyncResult(err().then((e) => Err(e)));
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
	public and<U>(other: Option<U>): Option<U> {
		if (this._some) {
			return other;
		}
		return None;
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
	public andThen<U>(f: (value: T) => Option<U>): Option<U> {
		if (this._some) {
			return f(this._value as T);
		}
		return None;
	}

	public andThenAsync<U>(f: (value: T) => Promise<Option<U>> | AsyncOption<U>): AsyncOption<U> {
		if (this._some) {
			return new AsyncOption(f(this._value as T));
		}
		return new AsyncOption(Promise.resolve(None));
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
	public filter(predicate: (value: T) => boolean): Option<T> {
		if (this._some && predicate(this._value as T)) {
			return this as unknown as Option<T>;
		}
		return None;
	}

	public filterAsync(predicate: (value: T) => Promise<boolean>): AsyncOption<T> {
		const check = async (): Promise<Option<T>> => {
			if (this._some && (await predicate(this._value as T))) {
				return this as unknown as Option<T>;
			}
			return None;
		};
		return new AsyncOption(check());
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
	public or<U>(other: Option<U>): Option<T | U> {
		if (this._some) {
			return this as unknown as Option<T | U>;
		}
		return other;
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
	public orElse<U>(f: () => Option<U>): Option<T | U> {
		if (this._some) {
			return this as unknown as Option<T | U>;
		}
		return f();
	}

	public orElseAsync<U>(f: () => Promise<Option<U>> | AsyncOption<U>): AsyncOption<T | U> {
		if (this._some) {
			return new AsyncOption(Promise.resolve(this as unknown as Some<T>));
		}
		return new AsyncOption(f());
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
	public xor<U>(other: Option<U>): Option<T | U> {
		if (this._some) {
			return other._some ? None : (this as unknown as Option<T | U>);
		}
		return other;
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
	public flatten<U>(this: Option<Option<U>>): Option<U> {
		if (this._some) {
			return this._value as Option<U>;
		}
		return None;
	}

	// Deprecated

	/**
	 * Returns the contained `Some` value, if it exists.
	 *
	 * @deprecated Use `unwrap()` instead.
	 */
	public value(): T | undefined {
		return this._value;
	}
}

export interface Some<T> extends OptionImpl<T> {
	[symbols.tag]: "Some";

	unwrap(): T;
	expect(message: string): T;

	// Deprecated

	/**
	 * Returns the contained `Some` value, if it exists.
	 *
	 * @deprecated Use `unwrap()` instead.
	 */
	value(): T;
}

/**
 * Some value of type `T`.
 */
export function Some<T>(value: T): Some<T> {
	return new OptionImpl(true, value) as Some<T>;
}

export interface None<T = never> extends OptionImpl<T> {
	[symbols.tag]: "None";

	unwrap(): undefined;
	expect(message: string): never;

	// Deprecated

	/**
	 * Returns the contained `Some` value, if it exists.
	 *
	 * @deprecated Use `unwrap()` instead.
	 */
	value(): undefined;
}

/**
 * No value.
 */
export const None = new OptionImpl(false, undefined) as None;

/**
 * `Option` represents an optional value: every `Option` is either `Some` and contains a value, or `None`, and does not.
 */
export type Option<T> = Some<T> | None<T>;

// deno-lint-ignore no-namespace
export namespace Option {
	/**
	 * Creates an `Option` from a nullish value.
	 */
	export function fromNullish<T>(value: T | undefined | null): Option<T> {
		return value == null ? None : Some(value);
	}

	/**
	 * @deprecated Use `Option.fromNullish()` instead.
	 */
	export const from = fromNullish;
}
