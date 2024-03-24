export class Panic extends Error {
	override readonly name = "Panic"
	override readonly cause?: unknown

	constructor(message?: string, options?: {cause?: unknown}) {
		super(message, options)
		this.cause = options?.cause
	}
}

export abstract class ErrorWithTag extends Error {
	abstract readonly tag: string
}

export abstract class ErrorWithCause<Cause> extends ErrorWithTag {
	override readonly cause: Cause

	constructor(message: string, options: {cause: Cause}) {
		super(message)
		this.cause = options.cause
	}
}

export function parseError(error: unknown): Error {
	if (error instanceof Error) {
		return error
	}
	return new TypeError(`Unexpected error type: "${String(error)}"`, {cause: error})
}

export type ErrorHandler<E> = (error: Error, raw: unknown) => E
