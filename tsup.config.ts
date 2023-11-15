import {defineConfig} from "tsup"

export default defineConfig({
	bundle: false,
	clean: true,
	dts: false,
	entry: ["src"],
	external: ["*.test.ts", "*.ignore.ts"],
	format: ["cjs", "esm"],
	keepNames: true,
	minify: false,
	outDir: "lib",
	platform: "browser",
	sourcemap: false,
	splitting: false,
	target: "es2022",
	treeshake: true,
})
