import {InvalidErrorPanic, Panic} from "./panic"

export abstract class ResultError extends Error {
	abstract override readonly name: string
	origin?: Error

	constructor(messageOrError?: string | Error) {
		if (messageOrError instanceof Error) {
			super(messageOrError.message)
			this.origin = messageOrError
		} else {
			super(messageOrError)
		}

		// Set the prototype explicitly to support subclassing built-in classes in TypeScript.
		Object.setPrototypeOf(this, ResultError.prototype)
	}

	override get stack() {
		// Try to update the stack trace to include the subclass error name.
		// May not work in every environment, since `stack` property is implementation-dependent and isn't standardized,
		// meaning different JavaScript engines might produce different stack traces.
		// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack
		return this.origin?.stack?.replace(/^Error/, this.name)
	}
}

export class StdError extends ResultError {
	static readonly tag = "StdError"
	readonly name = StdError.tag
}

export type ErrorHandler<E extends ResultError = StdError> = (error: StdError) => E

export function toStdError(error: unknown): StdError {
	if (error instanceof Panic) {
		throw error
	}
	if (error instanceof Error) {
		return new StdError()
	}
	throw new InvalidErrorPanic(error)
}
