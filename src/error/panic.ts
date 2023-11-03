import {inspectSymbol} from "../util"

export class Panic extends Error {
	readonly origin?: Error
	private readonly originName: string
	private readonly _stack?: string

	constructor(messageOrError?: string | Error) {
		if (messageOrError instanceof Error) {
			super(messageOrError.message)
			this.origin = messageOrError
		} else {
			super(messageOrError)
		}
		this.originName = this.origin?.name ?? "Error"
		this.name = this.originName !== "Error" ? `Panic from ${this.originName}` : "Panic"
		this._stack = this.stack // Save a copy of the stack trace before it gets overridden.
	}

	override get stack() {
		const r = new RegExp(`^${this.originName}`)
		return this._stack?.replace(r, this.name)
	}

	[inspectSymbol]() {
		return this.stack
	}
}

export class UnwrapPanic extends Panic {
	constructor(msg: string) {
		super(msg)
	}
}

export class InvalidErrorPanic extends Panic {
	constructor(value: unknown) {
		super(`Invalid error: "${value}"`)
	}
}

export class TodoPanic extends Panic {
	override message = "Todo"
}

export class UnreachablePanic extends Panic {
	override message = "Unreachable"
}

export class UnimplementedPanic extends Panic {
	override message = "Unimplemented"
}
