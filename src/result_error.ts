import {formatErrorString, inspectSymbol} from "./util"

export abstract class ResultError<Cause extends Error | null = Error | null> implements Error {
	abstract readonly tag: string

	readonly message: string
	readonly stack?: string
	readonly cause: Cause

	constructor(
		args: Cause extends Error
			? {message?: string; cause: Cause}
			: {message?: string; cause?: Cause} | void,
	) {
		this.message = args?.message ?? ""
		this.cause = (args?.cause ?? null) as Cause

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor)
		} else {
			this.stack = new Error().stack
		}
	}

	get name() {
		return this.tag
	}

	toString() {
		let str = formatErrorString(this.name, this.message)
		if (this.cause) {
			str += `\nCaused by: ${this.cause.toString()}`
		}
		return str
	}

	[inspectSymbol]() {
		let str = this.stack
		if (this.cause) {
			str += `\nCaused by: ${this.cause.stack}`
		}
		return str
	}
}

export class StdError<T = unknown> extends ResultError<Error> {
	readonly tag = "StdError"

	readonly causeRaw: T

	constructor(cause: T, message?: string) {
		const c =
			cause instanceof Error
				? cause
				: new TypeError(`Unexpected error type: "${String(cause)}"`)
		super({message, cause: c})
		this.causeRaw = cause
	}
}

export type ErrorHandler<E> = (error: unknown) => E
