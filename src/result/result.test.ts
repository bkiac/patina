import {describe, it, expect} from "vitest"
import {Panic, UnwrapPanic, Ok, Err, Result} from "../internal"

const testErr = new Error("hello")

describe.concurrent("ok", () => {
	it("returns an Ok result", () => {
		const result = Ok(42)
		expect(result.ok).toEqual(true)
		expect(result.value).toEqual(42)
	})
})

describe.concurrent("err", () => {
	it("returns an Err result", () => {
		const result = Err("error")
		expect(result.ok).toEqual(false)
		expect(result.error).toEqual("error")
	})
})

describe.concurrent("and", () => {
	it("returns the error when Ok and Err", () => {
		const a = Ok(2)
		const b = Err("late error")
		expect(a.and(b)).toEqual(b)
	})

	it("returns the late value when Ok and Ok", () => {
		const a = Ok(2)
		const b = Ok("str")
		expect(a.and(b)).toEqual(b)
	})

	it("returns the error when Err and Ok", () => {
		const a = Err("early error")
		const b = Ok("foo")
		expect(a.and(b)).toEqual(a)
	})

	it("returns the early error when Err and Err", () => {
		const a = Err("early error")
		const b = Err("late error")
		expect(a.and(b)).toEqual(a)
	})
})

describe.concurrent("andThen", () => {
	it("returns the mapped value for an Ok result", () => {
		const a = Ok(0)
		expect(a.andThen((value) => Ok(value + 1))).toEqual(Ok(1))
	})

	it("returns the result for an Err result", () => {
		const a = Err("early error")
		expect(a.andThen((value) => Ok(value + 1))).toEqual(a)
	})
})

describe.concurrent("expect", () => {
	it("returns the value when called on an Ok result", () => {
		const result = Ok(42)
		const value = result.expect("Panic message")
		expect(value).toEqual(42)
	})

	it("throws a Panic with the provided message when called on an Err result", () => {
		const error = new Error("Original error")
		const result = Err(error)
		const panicMsg = "Panic message"
		try {
			Err(testErr).expect("hello")
		} catch (err) {
			console.log(err)
		}
		expect(() => result.expect(panicMsg)).toThrow(Panic)
		expect(() => result.expect(panicMsg)).toThrow(panicMsg)
	})
})

describe.concurrent("expectErr", () => {
	it("returns the value when called on an Err result", () => {
		const error = new Error("Original error")
		const err = Err(error)
		expect(err.expectErr("panic message")).toEqual(error)
	})

	it("throws a Panic with the provided message when called on an Ok result", () => {
		const ok = Ok()
		const panicMsg = "Panic message"
		expect(() => ok.expectErr(panicMsg)).toThrow(Panic)
		expect(() => ok.expectErr(panicMsg)).toThrow(panicMsg)
	})
})

describe.concurrent("inspect", () => {
	it("returns this and calls inspect on Ok result", () => {
		let counter = 0
		const result = Ok(42)
		const result2 = result.inspect((value) => {
			counter += value
		})
		expect(counter).toEqual(42)
		expect(result2).toEqual(result)
	})

	it("returns this and does not call inspect on Err result", () => {
		let counter = 0
		const result = Err("")
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
		const result = Ok(42)
		const result2 = result.inspectErr(() => {
			counter += 1
		})
		expect(counter).toEqual(0)
		expect(result2).toEqual(result)
	})

	it("returns this and calls inspectErr on Err result", () => {
		let counter = 0
		const result = Err("")
		const result2 = result.inspectErr(() => {
			counter += 1
		})
		expect(counter).toEqual(1)
		expect(result2).toEqual(result)
	})
})

describe.concurrent("map", () => {
	it("returns the mapped value for an Ok result", () => {
		const result = Ok(42)
		const result2 = result.map((value) => value * 2)
		expect(result2).toEqual(Ok(84))
	})

	it("returns the original Err for an Err result", () => {
		const error = new Error("Test error")
		const result = Err(error)
		const result2 = result.map((value) => value * 2)
		expect(result2).toEqual(result)
	})
})

describe.concurrent("mapErr", () => {
	it("returns the mapped error for an Err result", () => {
		const error = new Error("Test error")
		const result = Err(error)
		const result2 = result.mapErr(() => new Error("Error"))
		expect(result2).toEqual(Err(new Error("Error")))
	})

	it("returns the original Ok for an Err result", () => {
		const result = Ok()
		const result2 = result.mapErr(() => new Error("Error"))
		expect(result2).toEqual(result)
	})
})

describe.concurrent("mapOr", () => {
	it("returns the mapped value for an Ok result", () => {
		const result = Ok(42)
		const value = result.mapOr(0, (value) => value * 2)
		expect(value).toEqual(84)
	})

	it("returns the default value for an Err result", () => {
		const error = new Error("Test error")
		const result = Err(error)
		const value = result.mapOr(0, (value) => value * 2)
		expect(value).toEqual(0)
	})
})

describe.concurrent("mapOrElse", () => {
	it("returns the mapped value for an Ok result", () => {
		const result = Ok(42)
		const value = result.mapOrElse(
			() => 0,
			(value) => value * 2,
		)
		expect(value).toEqual(84)
	})

	it("returns the default value from a function for an Err result", () => {
		const result = Err(new Error("Test error"))
		const value = result.mapOrElse(
			() => 0,
			(value) => value * 2,
		)
		expect(value).toEqual(0)
	})
})

describe.concurrent("or", () => {
	it("returns the value when Ok or Err", () => {
		const a = Ok(2)
		const b = Err("late error")
		expect(a.or(b)).toEqual(a)
	})

	it("returns the early value when Ok or Ok", () => {
		const a = Ok(2)
		const b = Ok("str")
		expect(a.or(b)).toEqual(a)
	})

	it("returns the late value when Err or Ok", () => {
		const a = Err("early error")
		const b = Ok("foo")
		expect(a.or(b)).toEqual(b)
	})

	it("returns the late error when Err and Err", () => {
		const a = Err("early error")
		const b = Err("late error")
		expect(a.or(b)).toEqual(b)
	})
})

describe.concurrent("orElse", () => {
	it("returns the result for an Ok result", () => {
		const a = Ok(0)
		expect(a.orElse(() => Ok(1))).toEqual(a)
	})

	it("returns the mapped value for an Err result", () => {
		const a = Err("early error")
		expect(a.orElse(() => Ok(1))).toEqual(Ok(1))
	})
})

describe.concurrent("unwrap", () => {
	it("returns the value for an Ok result", () => {
		const result = Ok(42)
		expect(result.unwrap()).toEqual(42)
	})

	it("throws a Panic for an Err result", () => {
		const error = new Error("Test error")
		const result = Err(error)
		expect(() => result.unwrap()).toThrow(UnwrapPanic)
	})
})

describe.concurrent("unwrapErr", () => {
	it("returns the error for an Err result", () => {
		const error = new Error("Test error")
		const result = Err(error)
		expect(result.unwrapErr()).toEqual(error)
	})

	it("throws for an Ok result", () => {
		const result = Ok(42)
		expect(() => result.unwrapErr()).toThrow(UnwrapPanic)
	})
})

describe.concurrent("unwrapOr", () => {
	it("returns the value for an Ok result", () => {
		const result = Ok(42)
		expect(result.unwrapOr(0)).toEqual(42)
	})

	it("returns the default value for an Err result", () => {
		const error = new Error("Test error")
		const result = Err(error)
		expect(result.unwrapOr(42)).toEqual(42)
	})
})

describe.concurrent("unwrapOrElse", () => {
	it("returns the value for an Ok result", () => {
		const result = Ok(42)
		expect(result.unwrapOrElse(() => 0)).toEqual(42)
	})

	it("returns the default value from a function for an Err result", () => {
		const error = new Error("Test error")
		const result = Err(error)
		const unwrapped = result.unwrapOrElse(() => 42)
		expect(unwrapped).toEqual(42)
	})
})

describe.concurrent("into", () => {
	it("returns the value for an Ok result", () => {
		const result = Ok(42) as Result<number, Error>
		expect(result.into()).toEqual(42)
	})

	it("returns the err for an Err result", () => {
		const result = Err(42) as Result<string, number>
		expect(result.into()).toEqual(42)
	})
})

describe.concurrent("match", () => {
	it("calls the ok function for an Ok result", () => {
		const result = Ok(42)
		const output = result.match(
			(value) => value * 2,
			() => 0,
		)
		expect(output).toEqual(84)
	})

	it("calls the err function for an Err result", () => {
		const error = new Error("Test error")
		const result = Err(error)
		const output = result.match(
			(value) => value * 2,
			() => 0,
		)
		expect(output).toEqual(0)
	})
})
