import { bench, describe } from "vitest";
import { Struct, Ref, Effect, Scope } from "@/index";

/**
 * Struct Benchmarks
 *
 * Core benchmarks for the Struct primitive - reactive objects with automatic
 * ref unwrapping via Proxy. Structs enable fine-grained reactivity at the
 * property level.
 */

describe("Struct Creation", () => {
	bench("create empty struct", () => {
		for (let i = 0; i < 1000; i++) {
			Struct({});
		}
	});

	bench("create struct with 1 property", () => {
		for (let i = 0; i < 1000; i++) {
			Struct({ value: 0 });
		}
	});

	bench("create struct with 10 properties", () => {
		for (let i = 0; i < 1000; i++) {
			Struct({
				a: 0,
				b: 1,
				c: 2,
				d: 3,
				e: 4,
				f: 5,
				g: 6,
				h: 7,
				i: 8,
				j: 9,
			});
		}
	});

	bench("create struct with ref properties", () => {
		const r = Ref(0);
		for (let i = 0; i < 1000; i++) {
			Struct({ value: r });
		}
	});
});

describe("Struct Property Access", () => {
	bench("read primitive property (untracked)", () => {
		const s = Struct({ value: 0 });
		for (let i = 0; i < 1000; i++) {
			const _ = s.value;
		}
	});

	bench("read primitive property (in computed)", () => {
		const s = Struct({ value: 0 });
		for (let i = 0; i < 100; i++) {
			const c = Ref.computed(() => s.value * 2);
			const _ = c.get();
		}
	});

	bench("read 10 properties (untracked)", () => {
		const s = Struct({
			a: 0,
			b: 1,
			c: 2,
			d: 3,
			e: 4,
			f: 5,
			g: 6,
			h: 7,
			i: 8,
			j: 9,
		});
		for (let i = 0; i < 100; i++) {
			const _ = s.a + s.b + s.c + s.d + s.e + s.f + s.g + s.h + s.i + s.j;
		}
	});

	bench("read 10 properties (in computed)", () => {
		const s = Struct({
			a: 0,
			b: 1,
			c: 2,
			d: 3,
			e: 4,
			f: 5,
			g: 6,
			h: 7,
			i: 8,
			j: 9,
		});
		for (let i = 0; i < 100; i++) {
			const c = Ref.computed(() => s.a + s.b + s.c + s.d + s.e + s.f + s.g + s.h + s.i + s.j);
			const _ = c.get();
		}
	});

	bench("read property in effect", () => {
		const s = Struct({ value: 0 });
		for (let i = 0; i < 100; i++) {
			const scope = Scope();
			let value = 0;
			Effect(
				() => {
					value = s.value;
				},
				{ scope }
			);
			scope.dispose();
		}
	});

	bench("write primitive property (no subscribers)", () => {
		const s = Struct({ value: 0 });
		for (let i = 0; i < 1000; i++) {
			s.value = i;
		}
	});

	bench("write property with 1 effect", () => {
		const s = Struct({ value: 0 });
		const scope = Scope();
		Effect(() => s.value, { scope });
		for (let i = 0; i < 100; i++) {
			s.value = i;
		}
		scope.dispose();
	});

	bench("write property with 10 effects", () => {
		const s = Struct({ value: 0 });
		const scope = Scope();
		for (let j = 0; j < 10; j++) {
			Effect(() => s.value, { scope });
		}
		for (let i = 0; i < 100; i++) {
			s.value = i;
		}
		scope.dispose();
	});
});

describe("Struct Reactivity", () => {
	bench("effect reacts to property change", () => {
		const s = Struct({ value: 0 });
		const scope = Scope();
		let count = 0;
		Effect(
			() => {
				count = s.value;
			},
			{ scope }
		);
		for (let i = 0; i < 100; i++) {
			s.value = i;
		}
		scope.dispose();
	});

	bench("computed from struct property", () => {
		const s = Struct({ value: 0 });
		const doubled = Ref.computed(() => s.value * 2);
		for (let i = 0; i < 100; i++) {
			s.value = i;
			const _ = doubled.get();
		}
	});

	bench("computed chain from struct", () => {
		const s = Struct({ a: 0, b: 1 });
		const sum = Ref.computed(() => s.a + s.b);
		const doubled = Ref.computed(() => sum.get() * 2);
		for (let i = 0; i < 100; i++) {
			s.a = i;
			s.b = i * 2;
			const _ = doubled.get();
		}
	});

	bench("struct diamond pattern", () => {
		const s = Struct({ value: 0 });
		const left = Ref.computed(() => s.value + 1);
		const right = Ref.computed(() => s.value + 2);
		const bottom = Ref.computed(() => left.get() + right.get());
		for (let i = 0; i < 100; i++) {
			s.value = i;
			const _ = bottom.get();
		}
	});
});

describe("Struct with Refs", () => {
	bench("struct wrapping refs (auto-unwrap)", () => {
		const r1 = Ref(0);
		const r2 = Ref(1);
		const s = Struct({ a: r1, b: r2 });
		for (let i = 0; i < 100; i++) {
			// Refs are unwrapped at runtime
			const sum = (s.a as unknown as number) + (s.b as unknown as number);
		}
	});

	bench("write to ref through struct", () => {
		const r = Ref(0);
		const s = Struct({ value: r });
		for (let i = 0; i < 1000; i++) {
			r.set(i);
		}
	});

	bench("effect tracking ref through struct", () => {
		const r = Ref(0);
		const s = Struct({ value: r });
		const scope = Scope();
		let count = 0;
		Effect(
			() => {
				count = s.value as unknown as number;
			},
			{ scope }
		);
		for (let i = 0; i < 100; i++) {
			r.set(i);
		}
		scope.dispose();
	});
});
