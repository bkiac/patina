import { Methods, Ok, Result, err, ok } from "./sync"
import { CaughtNonErrorPanic, Panic, PropagationPanic } from "./panic"
import { ErrorType, ValueType, ValueErrorType, Fn } from "../util"

export type MethodsAsync<TValue, TError extends Error> = {
	/**
	 * Unwraps value or throws a special {@link PropagationPanic} that's caught by {@link capture}.
	 * Use this method to unwrap the value and propagate potential errors up the call stack.
	 */
	propagate(): Promise<TValue>
	/** Unwraps value, if result is an {@link Err} throw `panic`.  */
	expect(panicOrMessage: Panic | string): Promise<TValue>
	/** Unwraps the value, and throw if the result is an {@link Err}. */
	unwrap(): Promise<TValue>
	/** Unwraps with a default value provided. */
	unwrapOr<T>(defaultValue: T): Promise<T | TValue>
	/** Unwraps with a default value provided by a function. */
	unwrapOrElse<T>(defaultValue: (error: TError) => T): Promise<T | TValue>
	/** Unwraps the error, and throw if the result is an {@link Ok}. */
	unwrapErr(): Promise<TError>
	/** Takes an object with two functions `ok` and `err` and executes the corresponding one based on the result type. */
	match<V, E>(args: {
		ok: (value: TValue) => V
		err: (error: TError) => E
	}): Promise<V | E>
}

/** Represents the result of an operation that can either succeed with a value or fail */
export class PromiseResult<TValue, TError extends Error>
	implements PromiseLike<Result<TValue, TError>>, MethodsAsync<TValue, TError>
{
	public constructor(public readonly promise: Promise<Result<TValue, TError>>) { }

	public then<A, B>(
		successCallback?: (res: Result<TValue, TError>) => A | PromiseLike<A>,
		failureCallback?: (reason: unknown) => B | PromiseLike<B>,
	): PromiseLike<A | B> {
		// TODO: Make sure this never rejects, although this should not be constructed by the consumer
		return this.promise.then(successCallback, failureCallback)
	}

	public async propagate() {
		return (await this).propagate()
	}

	public async expect(panicOrMessage: Panic | string) {
		return (await this).expect(panicOrMessage)
	}

	public async unwrap() {
		return (await this).unwrap()
	}

	public async unwrapErr() {
		return (await this).unwrapErr()
	}

	public async unwrapOr<T>(defaultValue: T) {
		return (await this).unwrapOr(defaultValue)
	}

	public async unwrapOrElse<T>(defaultValue: (error: TError) => T) {
		return (await this).unwrapOrElse(defaultValue)
	}

	public async match<V, E>(args: { ok: (value: TValue) => V; err: (error: TError) => E }) {
		return (await this).match(args)
	}
}

export function asyncFn<T extends (...args: any[]) => Promise<Result<any, any>>>(fn: T) {
	return function (...args: Parameters<T>) {
		return new PromiseResult<ValueType<T>, ErrorType<T>>(fn(...args))
	}
}
