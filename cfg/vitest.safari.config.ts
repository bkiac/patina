import type {UserConfig} from "vitest/config"
import cfg from "./vitest.browser.config"

export default {
	...cfg,
	test: {
		...cfg.test,
		browser: {
			...cfg.test.browser,
			provider: "webdriverio",
			name: "safari",
		},
	},
} satisfies UserConfig
