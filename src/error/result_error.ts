import {inspectSymbol} from "../util"
import {InvalidErrorPanic, Panic} from "./panic"
import {getName, getOriginName, replaceStack} from "./util"

export abstract class ResultError implements Error {
	abstract readonly tag: string

	readonly message: string
	readonly origin?: Readonly<Error>
	private readonly originName: string
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
		this.originName = getOriginName(this.origin)
	}

	get name() {
		return getName(this.tag, this.originName)
	}

	get stack() {
		return replaceStack(this.name, this.originName, this._stack)
	}

	toString() {
		return `${this.name}${this.message ? `: ${this.message}` : ""}`
	}

	[inspectSymbol]() {
		return this.stack
	}
}

export class StdError extends ResultError {
	readonly tag = "StdError"
}

export type ErrorHandler<E extends ResultError = StdError> = (error: unknown) => E

export function toStdError(error: unknown): StdError {
	if (error instanceof Panic) {
		throw error
	}
	if (error instanceof Error) {
		return new StdError(error)
	}
	throw new InvalidErrorPanic(error)
}
