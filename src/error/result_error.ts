import {inspectSymbol} from "../util"
import {replaceName, replaceStack} from "./util"

export abstract class ResultError<T extends Error = Error> implements Error {
	abstract readonly tag: string

	readonly message: string
	readonly origin: T

	constructor(origin: T) {
		this.message = origin.message
		this.origin = origin
	}

	get name() {
		return replaceName(this.tag, this.origin.name)
	}

	get stack() {
		return replaceStack(this.name, this.origin.name, this.origin.stack)
	}

	toString() {
		return `${this.name}${this.message ? `: ${this.message}` : ""}`
	}

	[inspectSymbol]() {
		return this.stack
	}
}

export class StdError<T = unknown> extends ResultError {
	readonly tag = "StdError"
	readonly originRaw: T

	constructor(origin: T) {
		const error =
			origin instanceof Error
				? origin
				: new Error(`Unexpected error type: "${String(origin)}"`)
		super(error)
		this.originRaw = origin
	}
}

export type ErrorHandler<E> = (error: unknown) => E
