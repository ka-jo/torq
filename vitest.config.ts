import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		workspace: ["packages/*"],
		benchmark: {
			outputFile: "./benchmark-results.json",
			reporters: ["verbose"],
		},
	},
});
