import { bench, describe } from "vitest";
import { Ref } from "@/index";

/**
 * Computed Benchmarks
 *
 * Core benchmarks for computed refs - reactive derived values that
 * automatically update when their dependencies change.
 */

describe("Computed Creation & Evaluation", () => {
	bench("create simple computed", () => {
		const r = Ref(0);
		for (let i = 0; i < 1000; i++) {
			Ref.computed(() => r.get() * 2);
		}
	});

	bench("create computed with multiple deps", () => {
		const r1 = Ref(0);
		const r2 = Ref(1);
		const r3 = Ref(2);
		for (let i = 0; i < 1000; i++) {
			Ref.computed(() => r1.get() + r2.get() + r3.get());
		}
	});

	bench("evaluate clean computed", () => {
		const r = Ref(0);
		const c = Ref.computed(() => r.get() * 2);
		for (let i = 0; i < 100; i++) {
			const _ = c.get();
		}
	});

	bench("evaluate dirty computed", () => {
		const r = Ref(0);
		const c = Ref.computed(() => r.get() * 2);
		for (let i = 0; i < 100; i++) {
			r.set(i);
			const _ = c.get();
		}
	});
});

describe("Computed Chains", () => {
	bench("computed chain (depth 10)", () => {
		const r = Ref(0);
		let c = Ref.computed(() => r.get());
		for (let i = 0; i < 9; i++) {
			const prev = c;
			c = Ref.computed(() => prev.get() + 1);
		}
		for (let i = 0; i < 100; i++) {
			r.set(i);
			const _ = c.get();
		}
	});

	bench("computed chain (depth 100)", () => {
		const r = Ref(0);
		let c = Ref.computed(() => r.get());
		for (let i = 0; i < 99; i++) {
			const prev = c;
			c = Ref.computed(() => prev.get() + 1);
		}
		for (let i = 0; i < 10; i++) {
			r.set(i);
			const _ = c.get();
		}
	});

	bench("update chain multiple times", () => {
		const r = Ref(0);
		let c = Ref.computed(() => r.get());
		for (let i = 0; i < 9; i++) {
			const prev = c;
			c = Ref.computed(() => prev.get() + 1);
		}
		for (let i = 0; i < 100; i++) {
			r.set(i);
		}
		const _ = c.get();
	});
});

describe("Computed Diamonds", () => {
	bench("simple diamond", () => {
		const r = Ref(0);
		const left = Ref.computed(() => r.get() + 1);
		const right = Ref.computed(() => r.get() + 2);
		const bottom = Ref.computed(() => left.get() + right.get());
		for (let i = 0; i < 100; i++) {
			r.set(i);
			const _ = bottom.get();
		}
	});

	bench("wide diamond (10 branches)", () => {
		const r = Ref(0);
		const branches = Array.from({ length: 10 }, (_, i) => Ref.computed(() => r.get() + i));
		const bottom = Ref.computed(() => branches.reduce((sum, b) => sum + b.get(), 0));
		for (let i = 0; i < 100; i++) {
			r.set(i);
			const _ = bottom.get();
		}
	});

	bench("deep diamond (3 levels)", () => {
		const r = Ref(0);
		const level1a = Ref.computed(() => r.get() + 1);
		const level1b = Ref.computed(() => r.get() + 2);
		const level2a = Ref.computed(() => level1a.get() + level1b.get());
		const level2b = Ref.computed(() => level1a.get() * level1b.get());
		const bottom = Ref.computed(() => level2a.get() + level2b.get());
		for (let i = 0; i < 100; i++) {
			r.set(i);
			const _ = bottom.get();
		}
	});
});

describe("Computed Fan Patterns", () => {
	bench("fan-out (1 ref -> 10 computeds)", () => {
		const r = Ref(0);
		const computeds = Array.from({ length: 10 }, (_, i) => Ref.computed(() => r.get() + i));
		for (let i = 0; i < 100; i++) {
			r.set(i);
			computeds.forEach((c) => c.get());
		}
	});

	bench("fan-in (10 refs -> 1 computed)", () => {
		const refs = Array.from({ length: 10 }, () => Ref(0));
		const c = Ref.computed(() => refs.reduce((sum, r) => sum + r.get(), 0));
		for (let i = 0; i < 100; i++) {
			refs.forEach((r) => r.set(i));
			const _ = c.get();
		}
	});

	bench("conditional dependency", () => {
		const condition = Ref(true);
		const a = Ref(1);
		const b = Ref(2);
		const c = Ref.computed(() => (condition.get() ? a.get() : b.get()));
		for (let i = 0; i < 100; i++) {
			condition.set(i % 2 === 0);
			a.set(i);
			b.set(i * 2);
			const _ = c.get();
		}
	});
});
