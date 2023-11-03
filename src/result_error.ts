import {InvalidErrorPanic, Panic} from "./panic"

export abstract class ResultError implements Error {
	abstract readonly tag: string

	readonly name = "ResultError" as const
	readonly message: string
	readonly origin?: Error
	private readonly _stack?: string

	constructor(messageOrError: string | Error = "") {
		if (messageOrError instanceof Error) {
			this.message = messageOrError.message
			this.origin = messageOrError
			if (this.origin.stack) {
				this._stack = this.origin.stack
			}
		} else {
			this.message = messageOrError
		}
		if (!this._stack) {
			this._stack = new Error(this.message).stack
		}
	}

	get stack() {
		return ResultError.updateStack(this.tag, this._stack)
	}

	/**
	 * Tries to update the stack trace to include the subclass error name.
	 *
	 * May not work in every environment, since `stack` property is implementation-dependent and isn't standardized,
	 * meaning different JavaScript engines might produce different stack traces.
	 *
	 * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack
	 */
	private static updateStack(tag: string, stack?: string) {
		return stack?.replace(/^Error/, tag)
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
