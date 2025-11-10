import fs from "fs";
import path from "path";

import { defineConfig } from "vitest/config";
import { resolve } from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import dts from "vite-plugin-dts";

export default defineConfig({
	plugins: [
		tsconfigPaths(),
		dts({
			rollupTypes: true,
			tsconfigPath: "./tsconfig.build.json",
			beforeWriteFile: (filePath, content) => {
				if (filePath.endsWith(".map")) {
					return { filePath, content };
				} else {
					return {
						filePath,
						// remove all @privateRemarks tags in the generated d.ts files
						content: content.replace(/(\s*\*\s*@privateRemarks\s*[\s\S]*?)(\s*\*\s*@|\*\/)/g, "$2"),
					};
				}
			},
			afterBuild: () => {
				const srcPath = require.resolve("symbol-observable/index.d.ts");
				const distPath = path.resolve(__dirname, "dist/reactivity.d.ts");
				const symbolObservableContent = fs.readFileSync(srcPath, "utf-8");

				// append the global type augmentation for the SymbolConstructor from the symbol-observable package
				fs.appendFileSync(distPath, `\n${symbolObservableContent}`);
			},
		}),
	],
	build: {
		target: "es2022",
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			name: "SheenReactivity",
			fileName: (format) => `reactivity.${format}.js`,
			formats: ["es", "cjs", "umd"],
		},
		sourcemap: true,
		minify: "esbuild",
	},
	test: {
		globals: true,
		setupFiles: ["./tests/fixtures/expect/toBeRef.ts"],
		alias: (() => {
			// Allow switching between source and built files for integration tests
			const testTarget = process.env.SHEEN_TEST_TARGET || "source"; // Default to source
			const aliases: Record<string, string> = {};

			if (testTarget === "source") {
				// Map @sheen/reactivity to source files via @ alias
				aliases["@sheen/reactivity"] = resolve(__dirname, "src/index.ts");
			}
			// When testTarget === "dist", use the workspace dependency (built files)
			return aliases;
		})(),
	},
});
