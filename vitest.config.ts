import type {UserConfig} from "vitest/config"

export default {
	test: {
		include: ["**/*.test.ts"],
		globalSetup: "test/setup.ts",
	},
} satisfies UserConfig
