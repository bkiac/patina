import {defineConfig} from "tsup"

export default defineConfig({
	entry: ["src/index.ts", "src/internal.ts"],
	clean: true,
	dts: true,
	format: "esm",
	outDir: "lib",
})
