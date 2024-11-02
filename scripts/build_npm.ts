// ex. scripts/build_npm.ts
import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

const git = "https://github.com/bkiac/patina";

const { version } = JSON.parse(await Deno.readTextFile("./deno.json"));

await build({
	typeCheck: false,
	test: false,
	entryPoints: ["./src/mod.ts"],
	outDir: "./npm",
	shims: {},
	package: {
		name: "@patina/core",
		version,
		description: "Type-safe error-handling and nothing-handling library for TypeScript",
		license: "MIT",
		repository: {
			type: "git",
			url: `git+${git}.git`,
		},
		bugs: {
			url: `${git}/issues`,
		},
		author: "bkiac <bkiac@pm.me>",
		keywords: [
			"typescript",
			"error-handling",
			"option-type",
			"result-type",
		],
		sideEffects: false,
	},
	postBuild() {
		// steps to run after building and before running the tests
		Deno.copyFileSync("LICENSE", "npm/LICENSE");
		Deno.copyFileSync("README.md", "npm/README.md");
	},
});
