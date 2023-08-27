import {Methods, Ok, Result, err, ok} from "./sync"
import {CaughtNonErrorPanic, Panic, PropagationPanic} from "./panic"
import {ErrorType, ValueType, ValueErrorType, Fn} from "../util"

export type MethodsAsync<TValue, TError extends Error> = {
	/**
	 * Unwraps value or throws a special {@link PropagationPanic} that's caught by {@link capture}.
	 * Use this method to unwrap the value and propagate potential errors up the call stack.
	 */
	propagate: () => Promise<TValue>
	/** Unwraps value, if result is an {@link Err} throw `panic`.  */
	expect: (panicOrMessage: Panic | string) => Promise<TValue>
	/** Unwraps the value, and throw if the result is an {@link Err}. */
	unwrap: () => Promise<TValue>
	/** Unwraps the error, and throw if the result is an {@link Ok}. */
	unwrapErr: () => Promise<TError>
	/** Unwraps with a default value provided. */
	unwrapOr: <T>(defaultValue: T) => Promise<T | TValue>
	/** Unwraps with a default value provided by a function. */
	unwrapOrElse: <T>(defaultValue: (error: TError) => T) => Promise<T | TValue>
	/** Takes an object with two functions `ok` and `err` and executes the corresponding one based on the result type. */
	match: <V, E>({ok, err}: {ok: (value: TValue) => V; err: (error: TError) => E}) => Promise<V | E>
}

/** Represents the result of an operation that can either succeed with a value or fail */
export class PromiseResult<TValue, TError extends Error>
	implements PromiseLike<Result<TValue, TError>>, MethodsAsync<TValue, TError>
{
	public constructor(public readonly promise: Promise<Result<TValue, TError>>) {}

	public then<A, B>(
		successCallback?: (res: Result<TValue, TError>) => A | PromiseLike<A>,
		failureCallback?: (reason: unknown) => B | PromiseLike<B>,
	): PromiseLike<A | B> {
		// TODO: Make sure this never rejects, although this should not be constructed by the consumer
		return this.promise.then(successCallback, failureCallback)
	}

	public propagate = async () => (await this).propagate()

	public expect = async (panicOrMessage: Panic | string) => (await this).expect(panicOrMessage)

	public unwrap = async () => (await this).unwrap()

	public unwrapErr = async () => (await this).unwrapErr()

	public unwrapOr = async <T>(defaultValue: T) => (await this).unwrapOr(defaultValue)

	public unwrapOrElse = async <T>(defaultValue: (error: TError) => T) =>
		(await this).unwrapOrElse(defaultValue)

	public match = async <V, E>({ok, err}: {ok: (value: TValue) => V; err: (error: TError) => E}) =>
		(await this).match({ok, err})
}

const asyncFn =
	<T extends (...args: any[]) => Promise<Result<any, any>>>(fn: T) =>
	(...args: Parameters<T>) =>
		new PromiseResult<ValueType<T>, ErrorType<T>>(fn(...args))

const testAsyncFn = asyncFn(async (seed: number) => {
	const rand = Math.random() + seed
	if (rand > 0.5) {
		return ok("hello")
	}
	return err("oh no")
})

const testFn = async () => new PromiseResult(Promise.resolve(ok("hello")))

async function main() {
	const wtf = await testAsyncFn(1)

	const ye = await testFn()

	const foo = new PromiseResult(Promise.resolve(ok("hello")))
	const bar = await foo
	if (bar.ok) {
		const ye = bar.value
	}
	const baz = await foo.unwrap()
}
