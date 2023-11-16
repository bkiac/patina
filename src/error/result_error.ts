import {inspectSymbol} from "../util.js"
import {formatErrorString} from "./util.js"

export abstract class ResultError<T extends Error | null = null> implements Error {
	abstract readonly tag: string

	readonly message: string
	readonly stack?: string
	readonly origin: T | null

	constructor(message?: string, origin?: T) {
		this.message = message ?? ""
		this.origin = origin ?? null

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
		if (this.origin) {
			str += `\nCaused by: ${this.origin.toString()}`
		}
		return str
	}

	[inspectSymbol]() {
		let str = this.stack
		if (this.origin) {
			str += `\nCaused by: ${this.origin.stack}`
		}
		return str
	}
}

export class StdError<T = unknown> extends ResultError<Error> {
	readonly tag = "StdError"

	override readonly origin: Error
	readonly originRaw: T

	constructor(origin: T, message?: string) {
		const o =
			origin instanceof Error
				? origin
				: new TypeError(`Unexpected error type: "${String(origin)}"`)
		super(message)
		this.origin = o
		this.originRaw = origin
	}
}

export type ErrorHandler<E> = (error: unknown) => E
