/** Extends Error, used for unrecoverable errors. */
export class Panic extends Error {
	private static defaultName = "Panic";

	constructor(messageOrError: string | Error) {
		if (messageOrError instanceof Error) {
			const error = messageOrError;
			super(error.message);
			this.name = `${Panic.defaultName}: ${error.name}`;
			if (error.stack) {
				this.stack = error.stack;
			}
		} else {
			const message = messageOrError;
			super(message);
			this.name = Panic.defaultName;
		}
	}
}

export class PropagationPanic extends Panic {
	constructor(public originalError: Error) {
		super("Result propagation has not been caught");
	}
}

export class CaughtNonErrorPanic extends Panic {
	constructor(public value: unknown) {
		super("Caught non-Error value");
	}
}
