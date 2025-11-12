import { bench, describe } from "vitest";
import { Ref, Effect, Scope } from "@/index";

/**
 * Effect Benchmarks
 *
 * Core benchmarks for the Effect primitive - side effects that automatically
 * re-run when their dependencies change.
 */

describe("Effect Creation & Execution", () => {
	bench("create simple effect", () => {
		const r = Ref(0);
		for (let i = 0; i < 100; i++) {
			const scope = Scope();
			Effect(() => r.get(), { scope });
			scope.dispose();
		}
	});

	bench("create effect with multiple deps", () => {
		const r1 = Ref(0);
		const r2 = Ref(1);
		const r3 = Ref(2);
		for (let i = 0; i < 100; i++) {
			const scope = Scope();
			Effect(() => r1.get() + r2.get() + r3.get(), { scope });
			scope.dispose();
		}
	});

	bench("effect execution (1 dependency)", () => {
		const r = Ref(0);
		const scope = Scope();
		let count = 0;
		Effect(
			() => {
				count = r.get();
			},
			{ scope }
		);
		for (let i = 0; i < 100; i++) {
			r.set(i);
		}
		scope.dispose();
	});

	bench("effect execution (10 dependencies)", () => {
		const refs = Array.from({ length: 10 }, () => Ref(0));
		const scope = Scope();
		let sum = 0;
		Effect(
			() => {
				sum = refs.reduce((acc, r) => acc + r.get(), 0);
			},
			{ scope }
		);
		for (let i = 0; i < 100; i++) {
			refs.forEach((r) => r.set(i));
		}
		scope.dispose();
	});
});

describe("Effect with Computeds", () => {
	bench("effect reading computed", () => {
		const r = Ref(0);
		const c = Ref.computed(() => r.get() * 2);
		const scope = Scope();
		let value = 0;
		Effect(
			() => {
				value = c.get();
			},
			{ scope }
		);
		for (let i = 0; i < 100; i++) {
			r.set(i);
		}
		scope.dispose();
	});

	bench("effect reading computed chain", () => {
		const r = Ref(0);
		const c1 = Ref.computed(() => r.get() + 1);
		const c2 = Ref.computed(() => c1.get() * 2);
		const c3 = Ref.computed(() => c2.get() + 10);
		const scope = Scope();
		let value = 0;
		Effect(
			() => {
				value = c3.get();
			},
			{ scope }
		);
		for (let i = 0; i < 100; i++) {
			r.set(i);
		}
		scope.dispose();
	});

	bench("effect with diamond computed", () => {
		const r = Ref(0);
		const left = Ref.computed(() => r.get() + 1);
		const right = Ref.computed(() => r.get() + 2);
		const bottom = Ref.computed(() => left.get() + right.get());
		const scope = Scope();
		let value = 0;
		Effect(
			() => {
				value = bottom.get();
			},
			{ scope }
		);
		for (let i = 0; i < 100; i++) {
			r.set(i);
		}
		scope.dispose();
	});
});

describe("Effect Fan Patterns", () => {
	bench("fan-out (1 ref -> 10 effects)", () => {
		const r = Ref(0);
		const scope = Scope();
		let sum = 0;
		for (let j = 0; j < 10; j++) {
			Effect(
				() => {
					sum += r.get();
				},
				{ scope }
			);
		}
		for (let i = 0; i < 100; i++) {
			r.set(i);
		}
		scope.dispose();
	});

	bench("fan-out (1 ref -> 100 effects)", () => {
		const r = Ref(0);
		const scope = Scope();
		let sum = 0;
		for (let j = 0; j < 100; j++) {
			Effect(
				() => {
					sum += r.get();
				},
				{ scope }
			);
		}
		for (let i = 0; i < 10; i++) {
			r.set(i);
		}
		scope.dispose();
	});

	bench("conditional effect dependency", () => {
		const condition = Ref(true);
		const a = Ref(1);
		const b = Ref(2);
		const scope = Scope();
		let value = 0;
		Effect(
			() => {
				value = condition.get() ? a.get() : b.get();
			},
			{ scope }
		);
		for (let i = 0; i < 100; i++) {
			condition.set(i % 2 === 0);
			a.set(i);
			b.set(i * 2);
		}
		scope.dispose();
	});
});

describe("Effect Lifecycle", () => {
	bench("effect create/dispose cycle", () => {
		const r = Ref(0);
		for (let i = 0; i < 100; i++) {
			const scope = Scope();
			Effect(() => r.get(), { scope });
			r.set(i);
			scope.dispose();
		}
	});

	bench("nested effects", () => {
		const r = Ref(0);
		const scope = Scope();
		Effect(
			() => {
				const nested = Scope({ scope });
				Effect(() => r.get(), { scope: nested });
			},
			{ scope }
		);
		for (let i = 0; i < 100; i++) {
			r.set(i);
		}
		scope.dispose();
	});
});

describe("Effect Disposal", () => {
	bench("dispose simple effect (1 dependency)", () => {
		const r = Ref(0);
		for (let i = 0; i < 100; i++) {
			const scope = Scope();
			const effect = Effect(() => r.get(), { scope });
			effect.dispose();
		}
	});

	bench("dispose effect with 10 dependencies", () => {
		const refs = Array.from({ length: 10 }, () => Ref(0));
		for (let i = 0; i < 100; i++) {
			const scope = Scope();
			const effect = Effect(() => refs.reduce((acc, r) => acc + r.get(), 0), { scope });
			effect.dispose();
		}
	});
});
