/**
 * This module contains the core functionality of Patina.
 * @module
 */

export * from "./async_helpers.ts";
export * from "./async_option.ts";
export * from "./async_result.ts";
export * from "./error.ts";
export * from "./fn.ts";
export * from "./option.ts";
export {
	Err,
	Ok,
	Result,
	type ResultMatch,
	type ResultMatchAsync,
	type ResultMethods,
} from "./result.ts";
export * from "./try.ts";
export * from "./unwind.ts";
export * from "./util.ts";
