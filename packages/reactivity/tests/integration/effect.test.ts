import { Effect, Ref } from "@torq-js/reactivity";
import { flushMicrotasks } from "../fixtures/util";

describe("Effect", () => {
	describe("reactivity", () => {
		it("should track dependencies and re-run when they change", async () => {
			const ref = Ref(0);
			const fn = vi.fn(() => {
				ref.get();
			});
			Effect(fn);

			// Clear initial call
			fn.mockClear();

			ref.set(1);

			// Wait for microtask
			await flushMicrotasks();

			expect(fn).toHaveBeenCalledTimes(1);
		});

		it("should track multiple dependencies", async () => {
			const ref1 = Ref(0);
			const ref2 = Ref(0);
			const fn = vi.fn(() => {
				ref1.get();
				ref2.get();
			});
			Effect(fn);

			// Clear initial call
			fn.mockClear();

			ref1.set(1);

			// Wait for microtask
			await flushMicrotasks();

			expect(fn).toHaveBeenCalledTimes(1);

			// Clear again
			fn.mockClear();

			ref2.set(1);

			// Wait for microtask
			await flushMicrotasks();

			expect(fn).toHaveBeenCalledTimes(1);
		});

		it("should update dependencies when effect re-runs", async () => {
			const condition = Ref(true);
			const ref1 = Ref(0);
			const ref2 = Ref(0);
			const fn = vi.fn(() => {
				if (condition.get()) {
					ref1.get();
				} else {
					ref2.get();
				}
			});
			Effect(fn);

			// Clear initial call
			fn.mockClear();

			// Should track ref1 initially
			ref1.set(1);
			await flushMicrotasks();
			expect(fn).toHaveBeenCalledTimes(1);

			fn.mockClear();

			// Change condition, should now track ref2
			condition.set(false);
			await flushMicrotasks();
			expect(fn).toHaveBeenCalledTimes(1);

			fn.mockClear();

			// ref1 should no longer trigger effect
			ref1.set(2);
			await flushMicrotasks();
			expect(fn).not.toHaveBeenCalled();

			// ref2 should trigger effect
			ref2.set(1);
			await flushMicrotasks();
			expect(fn).toHaveBeenCalledTimes(1);
		});

		it("should not re-run when disabled", async () => {
			const ref = Ref(0);
			const fn = vi.fn(() => {
				ref.get();
			});
			const effect = Effect(fn) as any;

			// Clear initial call
			fn.mockClear();

			effect.disable();

			ref.set(1);
			await flushMicrotasks();

			expect(fn).not.toHaveBeenCalled();
		});

		it("should re-run when re-enabled after dependency change", async () => {
			const ref = Ref(0);
			const fn = vi.fn(() => {
				ref.get();
			});
			const effect = Effect(fn) as any;

			// Clear initial call
			fn.mockClear();

			effect.disable();

			ref.set(1);
			await flushMicrotasks();

			expect(fn).not.toHaveBeenCalled();

			effect.enable();

			ref.set(2);
			await flushMicrotasks();

			expect(fn).toHaveBeenCalledTimes(1);
		});

		it("should not re-run after disposal", async () => {
			const ref = Ref(0);
			const fn = vi.fn(() => {
				ref.get();
			});
			const effect = Effect(fn) as any;

			// Clear initial call
			fn.mockClear();

			effect.dispose();

			ref.set(1);
			await flushMicrotasks();

			expect(fn).not.toHaveBeenCalled();
		});

		it("should batch multiple changes into a single re-run", async () => {
			const ref1 = Ref(0);
			const ref2 = Ref(0);
			const fn = vi.fn(() => {
				ref1.get();
				ref2.get();
			});
			const effect = Effect(fn);

			// Clear initial call
			fn.mockClear();

			// Make multiple changes synchronously
			ref1.set(1);
			ref2.set(1);
			ref1.set(2);
			ref2.set(2);

			// Wait for microtask
			await flushMicrotasks();

			// Should only run once
			expect(fn).toHaveBeenCalledTimes(1);
		});
	});

	describe("computed refs as dependencies", () => {
		it("should track computed refs", async () => {
			const count = Ref(0);
			const doubled = Ref.computed(() => count.get() * 2);
			const fn = vi.fn(() => {
				doubled.get();
			});
			const effect = Effect(fn);

			// Clear initial call
			fn.mockClear();

			count.set(1);

			await flushMicrotasks();

			expect(fn).toHaveBeenCalledTimes(1);
		});

		it("should track through computed ref chains", async () => {
			const count = Ref(0);
			const doubled = Ref.computed(() => count.get() * 2);
			const quadrupled = Ref.computed(() => doubled.get() * 2);
			const fn = vi.fn(() => {
				quadrupled.get();
			});
			const effect = Effect(fn);

			// Clear initial call
			fn.mockClear();

			count.set(1);

			// Wait for microtask
			await flushMicrotasks();

			expect(fn).toHaveBeenCalledTimes(1);
		});

		it("should not re-run when computed value doesn't change", async () => {
			const count = Ref(1);
			const isOdd = Ref.computed(() => count.get() % 2 === 1);
			const fn = vi.fn(() => {
				isOdd.get();
			});
			const effect = Effect(fn);

			// Clear initial call
			fn.mockClear();

			// Change from 1 to 3, both odd
			count.set(3);

			// Wait for microtask
			await flushMicrotasks();

			// Effect should not re-run because isOdd is still true
			expect(fn).not.toHaveBeenCalled();
		});
	});

	describe("nested effects", () => {
		it("should allow effects to create child effects", async () => {
			const ref1 = Ref(0);
			const ref2 = Ref(0);
			const outerFn = vi.fn();
			const innerFn = vi.fn();

			const outerEffect = Effect(() => {
				outerFn();
				ref1.get();

				Effect(() => {
					innerFn();
					ref2.get();
				});
			});

			// Clear initial calls
			outerFn.mockClear();
			innerFn.mockClear();

			ref1.set(1);
			await flushMicrotasks();

			// Outer effect should re-run and create a new inner effect
			expect(outerFn).toHaveBeenCalledTimes(1);
			expect(innerFn).toHaveBeenCalledTimes(1);
		});

		it("should allow child effects to run independently", async () => {
			const ref1 = Ref(0);
			const ref2 = Ref(0);
			const outerFn = vi.fn();
			const innerFn = vi.fn();

			const outerEffect = Effect(() => {
				outerFn();
				ref1.get();

				Effect(() => {
					innerFn();
					ref2.get();
				});
			});

			// Clear initial calls
			outerFn.mockClear();
			innerFn.mockClear();

			ref2.set(1);
			await flushMicrotasks();

			// Only inner effect should run
			expect(outerFn).not.toHaveBeenCalled();
			expect(innerFn).toHaveBeenCalledTimes(1);
		});

		it("should dispose child effects when parent disposes", async () => {
			const ref1 = Ref(0);
			const ref2 = Ref(0);
			const outerFn = vi.fn();
			const innerFn = vi.fn();

			const outerEffect = Effect(() => {
				outerFn();
				ref1.get();

				Effect(() => {
					innerFn();
					ref2.get();
				});
			}) as any;

			// Clear initial calls
			outerFn.mockClear();
			innerFn.mockClear();

			outerEffect.dispose();

			ref1.set(1);
			ref2.set(1);
			await flushMicrotasks();

			expect(outerFn).not.toHaveBeenCalled();
			expect(innerFn).not.toHaveBeenCalled();
		});
	});

	describe("effect cleanup on re-run", () => {
		it("should dispose old child effects when parent re-runs", async () => {
			const ref = Ref(0);

			const outerEffect = Effect(() => {
				ref.get();

				// Create a child effect that depends on ref
				Effect(() => {
					ref.get();
				});
			});

			const child1 = Array.from(outerEffect.scopes())[0];
			expect(child1).toBeDefined();
			expect(child1.disposed).toBe(false);

			// Update ref to trigger outer effect re-run
			ref.set(1);
			await flushMicrotasks();

			const child2 = Array.from(outerEffect.scopes())[0];
			expect(child2).toBeDefined();
			expect(child2).not.toBe(child1);
			expect(child1.disposed).toBe(true);
			expect(child2.disposed).toBe(false);
		});
	});
});
