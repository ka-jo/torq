import { bench, describe } from "vitest";
import { Ref, Effect, Scope } from "@/index";

/**
 * Scope Benchmarks
 *
 * Core benchmarks for the Scope primitive - hierarchical contexts for managing
 * reactive lifecycle. Scopes enable automatic cleanup of effects when disposed.
 */

describe("Scope Creation", () => {
	bench("create empty scope", () => {
		for (let i = 0; i < 1000; i++) {
			Scope();
		}
	});
});

describe("Scope Disposal", () => {
	bench("dispose empty scope", () => {
		for (let i = 0; i < 1000; i++) {
			const scope = Scope();
			scope.dispose();
		}
	});

	bench("dispose scope with 1 effect", () => {
		const r = Ref(0);
		for (let i = 0; i < 100; i++) {
			const scope = Scope();
			Effect(() => r.get(), { scope });
			scope.dispose();
		}
	});

	bench("dispose scope with 10 effects", () => {
		const r = Ref(0);
		for (let i = 0; i < 100; i++) {
			const scope = Scope();
			for (let j = 0; j < 10; j++) {
				Effect(() => r.get(), { scope });
			}
			scope.dispose();
		}
	});

	bench("dispose scope with 100 effects", () => {
		const r = Ref(0);
		for (let i = 0; i < 10; i++) {
			const scope = Scope();
			for (let j = 0; j < 100; j++) {
				Effect(() => r.get(), { scope });
			}
			scope.dispose();
		}
	});

	bench("dispose nested scopes (3 levels)", () => {
		for (let i = 0; i < 100; i++) {
			const scope1 = Scope();
			const scope2 = Scope({ scope: scope1 });
			const scope3 = Scope({ scope: scope2 });
			scope1.dispose();
		}
	});

	bench("dispose parent with 10 child scopes", () => {
		const r = Ref(0);
		for (let i = 0; i < 100; i++) {
			const parent = Scope();
			for (let j = 0; j < 10; j++) {
				const child = Scope({ scope: parent });
				Effect(() => r.get(), { scope: child });
			}
			parent.dispose();
		}
	});

	bench("dispose deeply nested scopes (depth 10)", () => {
		const r = Ref(0);
		for (let i = 0; i < 10; i++) {
			let scope = Scope();
			const root = scope;
			for (let j = 0; j < 10; j++) {
				Effect(() => r.get(), { scope });
				scope = Scope({ scope });
			}
			root.dispose();
		}
	});
});

describe("Scope Nesting", () => {
	bench("nested scopes (3 levels)", () => {
		for (let i = 0; i < 100; i++) {
			const scope1 = Scope();
			const scope2 = Scope({ scope: scope1 });
			const scope3 = Scope({ scope: scope2 });
		}
	});

	bench("dispose nested scopes (3 levels)", () => {
		for (let i = 0; i < 100; i++) {
			const scope1 = Scope();
			const scope2 = Scope({ scope: scope1 });
			const scope3 = Scope({ scope: scope2 });
			scope1.dispose();
		}
	});

	bench("parent with 10 child scopes", () => {
		for (let i = 0; i < 100; i++) {
			const parent = Scope();
			for (let j = 0; j < 10; j++) {
				Scope({ scope: parent });
			}
			parent.dispose();
		}
	});

	bench("nested scopes with effects", () => {
		const r = Ref(0);
		for (let i = 0; i < 100; i++) {
			const parent = Scope();
			Effect(() => r.get(), { scope: parent });

			const child1 = Scope({ scope: parent });
			Effect(() => r.get(), { scope: child1 });

			const child2 = Scope({ scope: parent });
			Effect(() => r.get(), { scope: child2 });

			parent.dispose();
		}
	});
});

describe("Scope Lifecycle", () => {
	bench("create, use, dispose cycle", () => {
		const r = Ref(0);
		for (let i = 0; i < 100; i++) {
			const scope = Scope();
			Effect(() => r.get(), { scope });
			r.set(i);
			scope.dispose();
		}
	});

	bench("repeated scope creation/disposal", () => {
		const r = Ref(0);
		for (let i = 0; i < 100; i++) {
			const scope = Scope();
			for (let j = 0; j < 10; j++) {
				Effect(() => r.get(), { scope });
			}
			r.set(i);
			scope.dispose();
		}
	});

	bench("scope churn (no memory leaks)", () => {
		const r = Ref(0);
		for (let i = 0; i < 1000; i++) {
			const scope = Scope();
			Effect(() => r.get(), { scope });
			scope.dispose();
		}
	});
});

describe("Scope with AbortSignal", () => {
	bench("scope with abort signal", () => {
		const r = Ref(0);
		for (let i = 0; i < 100; i++) {
			const controller = new AbortController();
			const scope = Scope({ signal: controller.signal });
			Effect(() => r.get(), { scope });
			controller.abort();
		}
	});

	bench("multiple scopes with same signal", () => {
		const r = Ref(0);
		for (let i = 0; i < 100; i++) {
			const controller = new AbortController();
			for (let j = 0; j < 10; j++) {
				const scope = Scope({ signal: controller.signal });
				Effect(() => r.get(), { scope });
			}
			controller.abort();
		}
	});
});
