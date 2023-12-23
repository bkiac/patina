import {inspectSymbol} from "./util"
import {formatErrorString} from "./util"

export abstract class ResultError<T extends Error | null = null> implements Error {
	abstract readonly tag: string

	readonly message: string
	readonly stack?: string
	readonly cause: T | null

	constructor(args: {message?: string; cause?: T} = {}) {
		this.message = args.message ?? ""
		this.cause = args.cause ?? null

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

	override readonly cause: Error
	readonly causeRaw: T

	constructor(cause: T, message?: string) {
		const o =
			cause instanceof Error
				? cause
				: new TypeError(`Unexpected error type: "${String(cause)}"`)
		super({message})
		this.cause = o
		this.causeRaw = cause
	}
}

export type ErrorHandler<E> = (error: unknown) => E
