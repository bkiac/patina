import type {UserConfig} from "vitest/config"
import cfg from "./vitest.config"

export default {
	...cfg,
	test: {
		...cfg.test,
		browser: {
			enabled: true,
			headless: true,
			provider: "playwright",
			name: "chromium",
		},
	},
} satisfies UserConfig
