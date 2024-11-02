// ex. scripts/build_npm.ts
import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

await build({
	typeCheck: false,
	test: false,
	entryPoints: ["./mod.ts"],
	outDir: "./npm",
	shims: {},
	package: {
		// package.json properties
		name: "your-package",
		version: Deno.args[0],
		description: "Your package.",
		license: "MIT",
		repository: {
			type: "git",
			url: "git+https://github.com/username/repo.git",
		},
		bugs: {
			url: "https://github.com/username/repo/issues",
		},
	},
	postBuild() {
		// steps to run after building and before running the tests
		Deno.copyFileSync("LICENSE", "npm/LICENSE");
		Deno.copyFileSync("README.md", "npm/README.md");
	},
});
