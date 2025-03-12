/**
 * This module contains the core functionality of Patina.
 *
 * TODO: Add documentation here
 *
 * @module
 */

export * from "./async_helpers.ts";
export * from "./async_option.ts";
export * from "./async_result.ts";
export * from "./error.ts";
export * from "./fn.ts";
export { None, Option, type OptionMatch, type OptionMatchAsync, Some } from "./option.ts";
export { Err, Ok, Result, type ResultMatch, type ResultMatchAsync } from "./result.ts";
export * from "./run.ts";
export * from "./try.ts";
export * from "./unwind.ts";
export * from "./util.ts";
