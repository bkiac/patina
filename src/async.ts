import {Result, ok} from "./core"
import {CaughtNonErrorPanic, Panic, PropagationPanic} from "./panic"

type Methods<TValue> = {
	/**
	 * Unwraps value or throws a special {@link PropagationPanic} that's caught by {@link capture}.
	 * Use this method to unwrap the value and propagate potential errors up the call stack.
	 */
	propagate: () => TValue
	/** Unwraps value, if result is an {@link Err} throw `panic`.  */
	expect: (panicOrMessage: Panic | string) => TValue
	/** Unwraps the value, and throw if the result is an {@link Err}. */
	unwrap: () => TValue
	/** Unwraps the error, and throw if the result is an {@link Ok}. */
	unwrapErr: () => Error
	/** Unwraps with a default value provided. */
	unwrapOr: <T>(defaultValue: T) => T | TValue
	/** Unwraps with a default value provided by a function. */
	unwrapOrElse: <T>(defaultValue: (error: Error) => T) => T | TValue
	/** Takes an object with two functions `ok` and `err` and executes the corresponding one based on the result type. */
	match: <O, E>({ok, err}: {ok: (value: TValue) => O; err: (error: Error) => E}) => O | E
}

/** Represents the result of an operation that can either succeed with a value or fail */
export class ResultAsync<T> implements PromiseLike<Result<T>> {
	constructor(private readonly promise: Promise<Result<T>>) {}

	then<A, B>(
		successCallback?: (res: Result<T>) => A | PromiseLike<A>,
		failureCallback?: (reason: unknown) => B | PromiseLike<B>,
	): PromiseLike<A | B> {
		return this.promise.then(successCallback, failureCallback)
	}

	public unwrap = async (): Promise<T> => {
		const result = await this.promise // What happens if promise rejects?
		return result.unwrap()
	}
}

async function main() {
	const foo = new ResultAsync(Promise.resolve(ok("hello")))
	const bar = await foo
	if (bar.ok) {
		const ye = bar.value
	}
	const baz = await foo.unwrap()
}
