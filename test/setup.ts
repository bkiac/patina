import {execa} from "execa"

export async function setup() {
	await execa("pnpm", ["build"])
}
