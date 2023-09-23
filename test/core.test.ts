import {describe, it, expect} from "vitest"
import {
	InvalidErrorPanic,
	Panic,
	PropagationPanic,
	Result,
	UnwrapPanic,
	handleError,
	Ok,
	Err,
} from "../src"

class CustomErrorA extends Error {
	tag: "CustomError" = "CustomError"
}

class CustomErrorB extends Error {
	tag: "AsdError" = "AsdError"
}

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
		const error = new (class CustomError extends Error {
			constructor() {
				super("Custom Error")
			}
		})()
		const result = new Err(error)
		expect(result.ok).toEqual(false)
		expect(result.error).toEqual(error)
	})

	it("returns an Err when given a string", () => {
		const msg = "Test error"
		const result = new Err(msg)
		expect(result.ok).toEqual(false)
		expect(result.error).toEqual(new Error(msg))
	})

	it("throws a Panic when given a Panic", () => {
		const panic = new Panic("Test panic")
		expect(() => new Err(panic)).to.throw(Panic)
	})
})

describe.concurrent("and", () => {
	it("returns the error when Ok and Err", () => {
		const a = new Ok(2) as Result<number, CustomErrorA>
		const b = new Err("late error") as Result<string, CustomErrorB>
		expect(a.and(b)).toEqual(b)
	})

	it("returns the late value when Ok and Ok", () => {
		const a = new Ok(2) as Result<number, CustomErrorA>
		const b = new Ok("str") as Result<string, CustomErrorB>
		expect(a.and(b)).toEqual(b)
	})

	it("returns the error when Err and Ok", () => {
		const a = new Err("early error") as Result<number, CustomErrorA>
		const b = new Ok("foo") as Result<string, CustomErrorB>
		expect(a.and(b)).toEqual(a)
	})

	it("returns the early error when Err and Err", () => {
		const a = new Err("early error") as Result<number, CustomErrorA>
		const b = new Err("late error") as Result<string, CustomErrorB>
		expect(a.and(b)).toEqual(a)
	})
})

describe.concurrent("andThen", () => {
	it("returns the mapped value for an Ok result", () => {
		const a = new Ok(0) as Result<number, CustomErrorA>
		expect(a.andThen((value) => new Ok(value + 1))).toEqual(new Ok(1))
	})

	it("returns the result for an Err result", () => {
		const a = new Err("early error") as Result<number, CustomErrorA>
		expect(a.andThen((value) => new Ok(value + 1))).toEqual(a)
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
		const result = new Err(error)
		expect(() => result.expect("Panic message")).to.throw(Panic, "Panic message")
	})

	it("throws a Panic with the provided Panic when called on an Err result", () => {
		const error = new Error("Original error")
		const result = new Err(error)
		const panic = new Panic("custom panic")
		expect(() => result.expect(panic)).to.throw(panic)
	})
})

describe.concurrent("expectErr", () => {
	it("returns the value when called on an Err result", () => {
		const error = new Error("Original error")
		const err = new Err(error)
		expect(err.expectErr()).toEqual(error)
	})

	it("throws a Panic with the provided message when called on an Ok result", () => {
		const ok = new Ok()
		expect(() => ok.expectErr("Panic message")).to.throw(Panic, "Panic message")
	})

	it("throws a Panic with the provided Panic when called on an Ok result", () => {
		const result = new Ok()
		const panic = new Panic("custom panic")
		expect(() => result.expectErr(panic)).to.throw(panic)
	})
})

describe.concurrent("inspect", () => {
	it("returns this and calls inspect on Ok result", () => {
		let counter = 0
		const result = new Ok(42)
		const result2 = result.inspect((value) => {
			counter += value
		})
		expect(counter).toEqual(42)
		expect(result2).toEqual(result)
	})

	it("returns this and does not call inspect on Err result", () => {
		let counter = 0
		const result = new Err("") as Result<number, CustomErrorA>
		const result2 = result.inspect(() => {
			counter += 1
		})
		expect(counter).toEqual(0)
		expect(result2).toEqual(result)
	})
})

describe.concurrent("inspectErr", () => {
	it("returns this and does not call inspectErr on Ok result", () => {
		let counter = 0
		const result = new Ok(42) as Result<number, CustomErrorA>
		const result2 = result.inspectErr(() => {
			counter += 1
		})
		expect(counter).toEqual(0)
		expect(result2).toEqual(result)
	})

	it("returns this and calls inspectErr on Err result", () => {
		let counter = 0
		const result = new Err("")
		const result2 = result.inspectErr(() => {
			counter += 1
		})
		expect(counter).toEqual(1)
		expect(result2).toEqual(result)
	})
})

describe.concurrent("map", () => {
	it("returns the mapped value for an Ok result", () => {
		const result = new Ok(42)
		const result2 = result.map((value) => value * 2)
		expect(result2).toEqual(new Ok(84))
	})

	it("returns the original Err for an Err result", () => {
		const error = new Error("Test error")
		const result = new Err(error) as Result<number>
		const result2 = result.map((value) => value * 2)
		expect(result2).toEqual(result)
	})
})

describe.concurrent("mapErr", () => {
	it("returns the mapped error for an Err result", () => {
		const error = new Error("Test error")
		const result = new Err(error)
		const result2 = result.mapErr(() => new Error("New error"))
		expect(result2).toEqual(new Err(new Error("New error")))
	})

	it("returns the original Ok for an Err result", () => {
		const error = new Error("Test error")
		const result = new Err(error) as Result<number>
		const result2 = result.map((value) => value * 2)
		expect(result2).toEqual(result)
	})
})

describe.concurrent("mapOr", () => {
	it("returns the mapped value for an Ok result", () => {
		const result = new Ok(42) as Result<number>
		const result2 = result.mapOr(0, (value) => value * 2)
		expect(result2).toEqual(84)
	})

	it("returns the default value for an Err result", () => {
		const error = new Error("Test error")
		const result = new Err(error) as Result<number>
		const result2 = result.mapOr(0, (value) => value * 2)
		expect(result2).toEqual(0)
	})
})

describe.concurrent("mapOrElse", () => {
	it("returns the mapped value for an Ok result", () => {
		const result = new Ok(42) as Result<number>
		const result2 = result.mapOrElse(
			() => 0,
			(value) => value * 2,
		)
		expect(result2).toEqual(84)
	})

	it("returns the default value from a function for an Err result", () => {
		const error = new Error("Test error")
		const result = new Err(error) as Result<number>
		const result2 = result.mapOrElse(
			() => 0,
			(value) => value * 2,
		)
		expect(result2).toEqual(0)
	})
})

describe.concurrent("or", () => {
	it("returns the value when Ok or Err", () => {
		const a = new Ok(2) as Result<number, CustomErrorA>
		const b = new Err("late error") as Result<string, CustomErrorB>
		expect(a.or(b)).toEqual(a)
	})

	it("returns the early value when Ok or Ok", () => {
		const a = new Ok(2) as Result<number, CustomErrorA>
		const b = new Ok("str") as Result<string, CustomErrorB>
		expect(a.or(b)).toEqual(a)
	})

	it("returns the late value when Err or Ok", () => {
		const a = new Err("early error") as Result<number, CustomErrorA>
		const b = new Ok("foo") as Result<string, CustomErrorB>
		expect(a.or(b)).toEqual(b)
	})

	it("returns the late error when Err and Err", () => {
		const a = new Err("early error") as Result<number, CustomErrorA>
		const b = new Err("late error") as Result<string, CustomErrorB>
		expect(a.or(b)).toEqual(b)
	})
})

describe.concurrent("orElse", () => {
	it("returns the result for an Ok result", () => {
		const a = new Ok(0) as Result<number, CustomErrorA>
		expect(a.orElse(() => new Ok(1))).toEqual(a)
	})

	it("returns the mapped value for an Err result", () => {
		const a = new Err("early error") as Result<number, CustomErrorA>
		expect(a.orElse(() => new Ok(1))).toEqual(new Ok(1))
	})
})

describe.concurrent("unwrap", () => {
	it("returns the value for an Ok result", () => {
		const result = new Ok(42)
		expect(result.unwrap()).toEqual(42)
	})

	it("throws a Panic for an Err result", () => {
		const error = new Error("Test error")
		const result = new Err(error)
		expect(() => result.unwrap()).toThrow(UnwrapPanic)
	})
})

describe.concurrent("unwrapErr", () => {
	it("returns the error for an Err result", () => {
		const error = new Error("Test error")
		const result = new Err(error)
		expect(result.unwrapErr()).toEqual(error)
	})

	it("throws for an Ok result", () => {
		const result = new Ok(42)
		expect(() => result.unwrapErr()).toThrow(UnwrapPanic)
	})
})

describe.concurrent("unwrapOr", () => {
	it("returns the value for an Ok result", () => {
		const result = new Ok(42) as Result<number>
		expect(result.unwrapOr(0)).toEqual(42)
	})

	it("returns the default value for an Err result", () => {
		const error = new Error("Test error")
		const result = new Err(error) as Result<number>
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
		const result = new Err(error) as Result<number>
		const unwrapped = result.unwrapOrElse(() => 42)
		expect(unwrapped).toEqual(42)
	})

	it("can panic", () => {
		const error = new Error("Test error")
		expect(() =>
			new Err(error).unwrapOrElse((error) => {
				throw new Panic(error)
			}),
		).toThrow(Panic)
	})
})

describe.concurrent("match", () => {
	it("calls the ok function for an Ok result", () => {
		const result = new Ok(42)
		const output = result.match(
			(value) => value * 2,
			() => 0,
		)
		expect(output).toEqual(84)
	})

	it("calls the err function for an Err result", () => {
		const error = new Error("Test error")
		const result = new Err(error) as Result<number>
		const output = result.match(
			(value) => value * 2,
			() => 0,
		)
		expect(output).toEqual(0)
	})
})

describe.concurrent("tap", () => {
	it("returns value for an Ok result", () => {
		const result = new Ok(1)
		expect(result.tap()).toEqual(1)
	})

	it("throws PropagationPanic for an Err result", () => {
		const error = new Error("custom error")
		const result = new Err(error)
		expect(() => result.tap()).toThrow(PropagationPanic)
		try {
			result.tap()
		} catch (err) {
			expect((err as PropagationPanic).originalError).toEqual(error)
		}
	})
})
