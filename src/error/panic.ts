import {inspectSymbol} from "../util"
import {getName, getOriginName, replaceStack} from "./util"

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
		this.originName = getOriginName(this.origin)
		this.name = getName("Panic", this.originName)
		this._stack = this.stack // Save a copy of the stack trace before it gets overridden.
	}

	override get stack() {
		return replaceStack(this.name, this.originName, this._stack)
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
