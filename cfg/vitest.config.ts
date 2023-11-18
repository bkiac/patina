import type {UserConfig} from "vitest/config"

export default {
	test: {
		include: ["**/*.test.ts"],
		cache: false,
		environment: "node",
	},
} satisfies UserConfig
