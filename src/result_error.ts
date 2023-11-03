import {InvalidErrorPanic, Panic} from "./panic"

export abstract class ResultError implements Error {
	abstract readonly tag: string

	readonly name = "ResultError" as const
	readonly message: string
	readonly origin?: Error

	constructor(messageOrError: string | Error = "") {
		if (messageOrError instanceof Error) {
			this.message = messageOrError.message
			this.origin = messageOrError
		} else {
			this.message = messageOrError
		}
	}

	// TODO: How to get own stack?
	get stack() {
		// Try to update the stack trace to include the subclass error name.
		// May not work in every environment, since `stack` property is implementation-dependent and isn't standardized,
		// meaning different JavaScript engines might produce different stack traces.
		// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack
		return this.origin?.stack?.replace(/^Error/, this.tag)
	}
}

export class StdError extends ResultError {
	static readonly tag = "StdError"
	readonly tag = StdError.tag
}

export type ErrorHandler<E extends ResultError = StdError> = (error: StdError) => E

export function toStdError(error: unknown): StdError {
	if (error instanceof Panic) {
		throw error
	}
	if (error instanceof Error) {
		return new StdError(error)
	}
	throw new InvalidErrorPanic(error)
}
