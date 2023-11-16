import {defineConfig} from "tsup"

export default defineConfig({
	bundle: true,
	clean: true,
	dts: false,
	entry: ["src/index.ts", "src/internal.ts"],
	format: ["esm", "cjs"],
	keepNames: true,
	minify: false,
	outDir: "lib",
	outExtension({format}) {
		if (format === "iife") {
			throw new Error("iife is not supported")
		}
		return {
			js: format === "cjs" ? `.${format}` : ".js",
		}
	},
	platform: "neutral",
	sourcemap: false,
	splitting: true,
	target: "es2022",
	treeshake: true,
})
