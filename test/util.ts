import {ErrorWithTag} from "../src"

export class TaggedError extends ErrorWithTag {
	readonly tag = "TaggedError"
}
