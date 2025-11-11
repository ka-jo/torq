import { bench, describe } from "vitest";
import { Ref, Effect, Scope } from "@/index";

/**
 * Ref Benchmarks
 *
 * Core benchmarks for the Ref primitive - the fundamental building block of
 * Torq's reactivity system. Refs hold reactive values that can be read,
 * written, and subscribed to.
 */

describe("Ref Creation", () => {
	bench("create primitive ref", () => {
		for (let i = 0; i < 1000; i++) {
			Ref(0);
		}
	});

	bench("create object ref", () => {
		for (let i = 0; i < 1000; i++) {
			Ref({ value: i });
		}
	});

	bench("create 100 refs in sequence", () => {
		for (let i = 0; i < 100; i++) {
			Ref(i);
		}
	});
});

describe("Ref Reading & Writing", () => {
	bench("read ref (untracked)", () => {
		const r = Ref(42);
		for (let i = 0; i < 1000; i++) {
			const _ = r.get();
		}
	});

	bench("read ref (in computed)", () => {
		const r = Ref(0);
		for (let i = 0; i < 100; i++) {
			const c = Ref.computed(() => r.get() * 2);
			const _ = c.get();
		}
	});

	bench("read ref (in effect)", () => {
		const r = Ref(0);
		for (let i = 0; i < 100; i++) {
			const scope = Scope();
			let value = 0;
			Effect(
				() => {
					value = r.get();
				},
				{ scope }
			);
			scope.dispose();
		}
	});

	bench("read multiple refs (in computed)", () => {
		const r1 = Ref(1);
		const r2 = Ref(2);
		const r3 = Ref(3);
		for (let i = 0; i < 100; i++) {
			const c = Ref.computed(() => r1.get() + r2.get() + r3.get());
			const _ = c.get();
		}
	});

	bench("write ref (no subscribers)", () => {
		const r = Ref(0);
		for (let i = 0; i < 100; i++) {
			r.set(i);
		}
	});

	bench("write ref (same value)", () => {
		const r = Ref(42);
		for (let i = 0; i < 1000; i++) {
			r.set(42);
		}
	});

	bench("write ref with 1 subscriber", () => {
		const r = Ref(0);
		const scope = Scope();
		Effect(() => r.get(), { scope });
		for (let i = 0; i < 100; i++) {
			r.set(i);
		}
		scope.dispose();
	});

	bench("write ref with 10 subscribers", () => {
		const r = Ref(0);
		const scope = Scope();
		for (let j = 0; j < 10; j++) {
			Effect(() => r.get(), { scope });
		}
		for (let i = 0; i < 100; i++) {
			r.set(i);
		}
		scope.dispose();
	});
});

describe("Ref Subscriptions", () => {
	bench("subscribe/unsubscribe cycle", () => {
		const r = Ref(0);
		for (let i = 0; i < 100; i++) {
			const sub = r.subscribe(() => {});
			sub.unsubscribe();
		}
	});

	bench("subscription with notifications", () => {
		const r = Ref(0);
		for (let i = 0; i < 100; i++) {
			const sub = r.subscribe(() => {});
			r.set(i);
			sub.unsubscribe();
		}
	});

	bench("10 subscriptions, 100 updates", () => {
		const r = Ref(0);
		const subs = [];
		for (let i = 0; i < 10; i++) {
			subs.push(r.subscribe(() => {}));
		}
		for (let i = 0; i < 100; i++) {
			r.set(i);
		}
		subs.forEach((sub) => sub.unsubscribe());
	});
});
