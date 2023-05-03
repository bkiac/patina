import type {UserConfig} from "vitest/config"

export default {
	test: {
		watch: false,
		clearMocks: true,
		include: ["**/*.test.ts"],
	},
} satisfies UserConfig
