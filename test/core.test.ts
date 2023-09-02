import {describe, it, expect} from "vitest"
import {
	InvalidErrorPanic,
	Panic,
	PropagationPanic,
	Result,
	UnwrapPanic,
	err,
	handleError,
	Ok,
} from "../src"

describe.concurrent("handleError", () => {
	it("returns an Error when given an Error", () => {
		class TestError extends Error {}
		const error = new TestError("Test error")
		const err = handleError(error)
		expect(err).to.be.instanceof(TestError)
	})

	it("throws a Panic when given a Panic", () => {
		const msg = "Test panic"
		const panic = new Panic(msg)
		expect(() => handleError(panic)).to.throw(Panic, msg)
	})

	it("throws a Panic when given an unknown value", () => {
		expect(() => handleError(0)).to.throw(InvalidErrorPanic)
		expect(() => handleError("")).to.throw(InvalidErrorPanic)
		expect(() => handleError(true)).to.throw(InvalidErrorPanic)
		expect(() => handleError(undefined)).to.throw(InvalidErrorPanic)
		expect(() => handleError(null)).to.throw(InvalidErrorPanic)
		expect(() => handleError({})).to.throw(InvalidErrorPanic)
		expect(() => handleError([])).to.throw(InvalidErrorPanic)
	})
})

describe.concurrent("ok", () => {
	it("returns an Ok result", () => {
		const result = new Ok(42)
		expect(result.ok).toEqual(true)
		expect(result.value).toEqual(42)
	})
})

describe.concurrent("err", () => {
	it("returns an Err when given an Error", () => {
		const error = new Error("Test error")
		const result = err(error)
		expect(result.ok).toEqual(false)
		expect(result.error).toEqual(error)
	})

	it("returns an Err when given a string", () => {
		const msg = "Test error"
		const result = err(msg)
		expect(result.ok).toEqual(false)
		expect(result.error).toEqual(new Error(msg))
	})

	it("throws a Panic when given a Panic", () => {
		const panic = new Panic("Test panic")
		expect(() => err(panic)).to.throw(Panic)
	})
})

describe.concurrent("expect", () => {
	it("returns the value when called on an Ok result", () => {
		const result = new Ok(42)
		const value = result.expect()
		expect(value).to.equal(42)
	})

	it("throws a Panic with the provided message when called on an Err result", () => {
		const error = new Error("Original error")
		const result = err(error)
		expect(() => result.expect("Panic message")).to.throw(Panic, "Panic message")
	})

	it("throws a Panic with the provided Panic when called on an Err result", () => {
		const error = new Error("Original error")
		const result = err(error)
		const panic = new Panic("custom panic")
		expect(() => result.expect(panic)).to.throw(Panic, "custom panic")
	})
})

describe.concurrent("unwrapUnsafe", () => {
	it("returns the value for an Ok result", () => {
		const result = new Ok(42)
		expect(result.unwrapUnsafe()).toEqual(42)
	})

	it("throws a Panic for an Err result", () => {
		const error = new Error("Test error")
		const result = err(error)
		expect(() => result.unwrapUnsafe()).toThrow(UnwrapPanic)
	})
})

describe.concurrent("unwrapErrUnsafe", () => {
	it("returns the error for an Err result", () => {
		const error = new Error("Test error")
		const result = err(error)
		expect(result.unwrapErrUnsafe()).toEqual(error)
	})

	it("throws for an Ok result", () => {
		const result = new Ok(42)
		expect(() => result.unwrapErrUnsafe()).toThrow(UnwrapPanic)
	})
})

describe.concurrent("unwrapOr", () => {
	it("returns the value for an Ok result", () => {
		const result = new Ok(42) as Result<number>
		expect(result.unwrapOr(0)).toEqual(42)
	})

	it("returns the default value for an Err result", () => {
		const error = new Error("Test error")
		const result = err(error) as Result<number>
		expect(result.unwrapOr(42)).toEqual(42)
	})
})

describe.concurrent("unwrapOrElse", () => {
	it("returns the value for an Ok result", () => {
		const result = new Ok(42) as Result<number>
		expect(result.unwrapOrElse(() => 0)).toEqual(42)
	})

	it("returns the default value from a function for an Err result", () => {
		const error = new Error("Test error")
		const result = err(error) as Result<number>
		const unwrapped = result.unwrapOrElse(() => 42)
		expect(unwrapped).toEqual(42)
	})

	it("can panic", () => {
		const error = new Error("Test error")
		expect(() =>
			err(error).unwrapOrElse((error) => {
				throw new Panic(error)
			}),
		).toThrow(Panic)
	})
})

describe.concurrent("try", () => {
	it("returns value for an Ok result", () => {
		const result = new Ok(1)
		expect(result.try()).toEqual(1)
	})

	it("throws PropagationPanic for an Err result", () => {
		const error = new Error("custom error")
		const result = err(error)
		expect(() => result.try()).toThrow(PropagationPanic)
		try {
			result.try()
		} catch (err) {
			expect((err as PropagationPanic).originalError).toEqual(error)
		}
	})
})

describe.concurrent("match", () => {
	it("calls the ok function for an Ok result", () => {
		const result = new Ok(42)
		const output = result.match({
			ok: (value) => value * 2,
			err: () => 0,
		})
		expect(output).toEqual(84)
	})

	it("calls the err function for an Err result", () => {
		const error = new Error("Test error")
		const result = err(error) as Result<number>
		const output = result.match({
			ok: (value) => value * 2,
			err: () => 0,
		})
		expect(output).toEqual(0)
	})
})
