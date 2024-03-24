export class Panic extends Error {
	override readonly name = "Panic"
	override readonly cause?: unknown

	constructor(message?: string, options?: {cause?: unknown}) {
		super(message, options)
		this.cause = options?.cause
	}
}
