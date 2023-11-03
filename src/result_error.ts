import {inspectSymbol} from "./util"
import {InvalidErrorPanic, Panic} from "./panic"

export abstract class ResultError implements Error {
	abstract readonly tag: string

	readonly message: string
	readonly origin?: Readonly<Error>
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

	get name() {
		return this.originName !== "Error" ? `${this.tag} from ${this.originName}` : this.tag
	}

	private get originName() {
		return this.origin?.name ?? "Error"
	}

	// Tries to replace the stack trace to include the subclass error name.
	// May not work in every environment, since `stack` property is implementation-dependent and isn't standardized,
	// meaning different JavaScript engines might produce different stack traces.
	// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack
	get stack() {
		const r = new RegExp(`^${this.originName}`)
		return this._stack?.replace(r, this.name)
	}

	toString() {
		return `${this.name}: ${this.message}`
	}

	[inspectSymbol]() {
		return this.stack
	}
}

export class StdError extends ResultError {
	readonly tag = "StdError"
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
