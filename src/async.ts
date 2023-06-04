import {Methods, Result, err, ok} from "./core"
import {CaughtNonErrorPanic, Panic, PropagationPanic} from "./panic"

/** Represents the result of an operation that can either succeed with a value or fail */
export class ResultAsync<T> implements PromiseLike<Result<T>>, Methods<Promise<T>> {
	public constructor(private readonly promise: Promise<Result<T>>) {}

	public then<A, B>(
		successCallback?: (res: Result<T>) => A | PromiseLike<A>,
		failureCallback?: (reason: unknown) => B | PromiseLike<B>,
	): PromiseLike<A | B> {
		return this.promise.then(successCallback, failureCallback)
	}

	public unwrap = async () => {
		const result = await this.promise // What happens if promise rejects?
		return result.unwrap()
	}

	public unwrapErr = async () => {
		const result = await this.promise
		return result.unwrapErr()
	}

	public propagate = async () => {
		const result = await this.promise
		return result.propagate()
	}
}

export class OkAsync<T> extends ResultAsync<T> {}

export function okAsync<T>(value: T): OkAsync<T> {
	return new OkAsync(Promise.resolve(ok(value)))
}

export class ErrAsync extends ResultAsync<never> {}

export function errAsync(error: Error | string): ErrAsync {
	return new ErrAsync(Promise.resolve(err(error)))
}

async function ye(): ResultAsync<string> {
	if (Math.random() > 0.5) {
		return okAsync("ok")
	}
	return errAsync("err")
}

async function main() {
	const foo = new ResultAsync(Promise.resolve(ok("hello")))
	const bar = await foo
	if (bar.ok) {
		const ye = bar.value
	}
	const baz = await foo.unwrap()

	const result = await ye().propagate()
}
