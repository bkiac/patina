/** Extends Error, used for unrecoverable errors. */
export class Panic extends Error {
	private static defaultName = "Panic"

	constructor(messageOrError: string | Error) {
		if (messageOrError instanceof Error) {
			const error = messageOrError
			super(error.message)
			this.name = `${Panic.defaultName}: ${error.name}`
			if (error.stack) {
				this.stack = error.stack
			}
		} else {
			const message = messageOrError
			super(message)
			this.name = Panic.defaultName
		}
	}
}

export class UnwrapPanic extends Panic {
	constructor(messageOrError: string | Error) {
		super(messageOrError)
	}
}

export class InvalidErrorPanic extends Panic {
	constructor(public error: unknown) {
		super("Invalid Error value")
	}
}

export class TodoPanic extends Panic {
	constructor(message = "Todo") {
		super(message)
	}
}

export class UnreachablePanic extends Panic {
	constructor(message = "Unreachable") {
		super(message)
	}
}

export class UnimplementedPanic extends Panic {
	constructor(message = "Unimplemented") {
		super(message)
	}
}
