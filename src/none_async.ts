// NoneAsync alone is defined here to avoid circular dependency between option.ts and option_async.ts

import { None } from "./option.ts";
import { OptionAsync } from "./option_async.ts";

export const NoneAsync: OptionAsync<never> = new OptionAsync(Promise.resolve(None));
