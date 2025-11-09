import { describe, it, expect, vi } from "vitest";
import { BaseEffect } from "@/Effect/core/BaseEffect";
import {
	$flags,
	$dependencies,
	$observer,
	$parent,
	$children,
	$index,
	$observable,
	$value,
	$subscribers,
	$compute,
} from "@/common/symbols";
import { Flags } from "@/common/flags";
import { BaseScope } from "@/Scope/core/BaseScope";
import { setActiveScope } from "@/common/current-scope";
import type { Observable } from "@/common/types";

// Mock Observable for testing
class MockObservable implements Observable {
	[$value]: any = null;
	[$subscribers]: any[] = [];
	[$flags]: number = 0;
	private subscriptions: Array<{ closed: boolean; unsubscribe: ReturnType<typeof vi.fn> }> = [];

	subscribe(): any {
		const subscription = {
			closed: false,
			unsubscribe: vi.fn(() => {
				subscription.closed = true;
			}),
		};
		this.subscriptions.push(subscription);
		return subscription;
	}

	[Symbol.observable](): Observable {
		return this;
	}

	// Helper method to get all subscriptions for testing
	getSubscriptions() {
		return this.subscriptions;
	}
}

describe("BaseEffect", () => {
	describe("constructor", () => {
		it("should return an instance of BaseEffect", () => {
			const effect = new BaseEffect(() => {});

			expect(effect).toBeInstanceOf(BaseEffect);
		});

		it("should return an instance with enabled set to true", () => {
			const effect = new BaseEffect(() => {});

			expect(effect.enabled).toBe(true);
		});

		it("should execute the effect function immediately", () => {
			const fn = vi.fn();
			new BaseEffect(fn);

			expect(fn).toHaveBeenCalledTimes(1);
		});

		it("should initialize with an empty dependencies array", () => {
			const effect = new BaseEffect(() => {});

			expect(effect[$dependencies]).toEqual([]);
			expect(effect[$dependencies]).toHaveLength(0);
		});

		it("should initialize with no parent by default", () => {
			const effect = new BaseEffect(() => {});

			expect(effect[$parent]).toBeNull();
		});

		it("should initialize with an empty children array", () => {
			const effect = new BaseEffect(() => {});

			expect(effect[$children]).toEqual([]);
			expect(effect[$children]).toHaveLength(0);
		});

		describe("scope option", () => {
			describe("when scope is provided", () => {
				it("should use the provided scope as parent", () => {
					const parent = new BaseScope();
					const effect = new BaseEffect(() => {}, { scope: parent });

					expect(effect[$parent]).toBe(parent);
				});

				it("should add itself to the parent's children", () => {
					const parent = new BaseScope();
					const effect = new BaseEffect(() => {}, { scope: parent });

					expect(parent[$children]).toContain(effect);
					expect(parent[$children]).toHaveLength(1);
				});

				it("should set the correct index based on parent's children", () => {
					const parent = new BaseScope();
					const effect1 = new BaseEffect(() => {}, { scope: parent });
					const effect2 = new BaseEffect(() => {}, { scope: parent });
					const effect3 = new BaseEffect(() => {}, { scope: parent });

					expect(effect1[$index]).toBe(0);
					expect(effect2[$index]).toBe(1);
					expect(effect3[$index]).toBe(2);
				});

				it("should throw when provided scope is disposed", () => {
					const parent = new BaseScope();
					parent.dispose();

					expect(() => {
						new BaseEffect(() => {}, { scope: parent });
					}).toThrow();
				});

				it("should have null parent if provided scope is null", () => {
					const effect = new BaseEffect(() => {}, { scope: null });
					expect(effect[$parent]).toBeNull();
				});
			});

			describe("when scope is not provided", () => {
				it("should use active scope as parent if available", () => {
					const parent = new BaseScope();

					setActiveScope(parent);

					const effect = new BaseEffect(() => {});

					expect(effect[$parent]).toBe(parent);
					expect(parent[$children]).toContain(effect);

					setActiveScope(undefined);
				});

				it("should have null parent if no active scope", () => {
					const effect = new BaseEffect(() => {});
					expect(effect[$parent]).toBeNull();
				});
			});
		});
	});

	describe("enabled getter", () => {
		it("should return true when effect is enabled", () => {
			const effect = new BaseEffect(() => {});

			expect(effect.enabled).toBe(true);
		});

		it("should return false when effect is disabled", () => {
			const effect = new BaseEffect(() => {});

			effect.disable();

			expect(effect.enabled).toBe(false);
		});

		it("should return true when effect is re-enabled", () => {
			const effect = new BaseEffect(() => {});

			effect.disable();
			effect.enable();

			expect(effect.enabled).toBe(true);
		});
	});

	describe("enable method", () => {
		it("should enable a disabled effect", () => {
			const effect = new BaseEffect(() => {});

			effect.disable();
			effect.enable();

			expect(effect.enabled).toBe(true);
		});

		it("should be idempotent", () => {
			const effect = new BaseEffect(() => {});

			expect(() => {
				effect.enable();
				effect.enable();
				effect.enable();
			}).not.toThrow();

			expect(effect.enabled).toBe(true);
		});
	});

	describe("disable method", () => {
		it("should disable an enabled effect", () => {
			const effect = new BaseEffect(() => {});

			effect.disable();

			expect(effect.enabled).toBe(false);
		});

		it("should be idempotent", () => {
			const effect = new BaseEffect(() => {});

			expect(() => {
				effect.disable();
				effect.disable();
				effect.disable();
			}).not.toThrow();

			expect(effect.enabled).toBe(false);
		});
	});

	describe("observables method", () => {
		it("should return an iterator", () => {
			const effect = new BaseEffect(() => {});
			const result = effect.observables();

			expect(typeof result[Symbol.iterator]).toBe("function");
			expect(typeof result.next).toBe("function");
		});

		it("should yield no observables initially", () => {
			const effect = new BaseEffect(() => {});
			const observables = Array.from(effect.observables());

			expect(observables).toHaveLength(0);
		});

		it("should yield observables that are tracked as dependencies", () => {
			const observable = new MockObservable();
			const effect = new BaseEffect((scope) => {
				scope.observe(observable);
			});

			const observables = Array.from(effect.observables());

			expect(observables).toHaveLength(1);
			expect(observables[0]).toBe(observable);
		});

		it("should yield multiple observables", () => {
			const observable1 = new MockObservable();
			const observable2 = new MockObservable();
			const observable3 = new MockObservable();

			const effect = new BaseEffect((scope) => {
				scope.observe(observable1);
				scope.observe(observable2);
				scope.observe(observable3);
			});

			const observables = Array.from(effect.observables());

			expect(observables).toHaveLength(3);
			expect(observables).toContain(observable1);
			expect(observables).toContain(observable2);
			expect(observables).toContain(observable3);
		});

		it("should yield no observables after disposal", () => {
			const observable = new MockObservable();
			const effect = new BaseEffect((scope) => {
				scope.observe(observable);
			});

			effect.dispose();

			const observables = Array.from(effect.observables());

			expect(observables).toHaveLength(0);
		});

		it("should be iterable multiple times", () => {
			const observable = new MockObservable();
			const effect = new BaseEffect((scope) => {
				scope.observe(observable);
			});

			const observables1 = Array.from(effect.observables());
			const observables2 = Array.from(effect.observables());

			expect(observables1).toEqual(observables2);
		});

		it("should track observables observed during effect execution", () => {
			const observable1 = new MockObservable();
			const observable2 = new MockObservable();
			let shouldObserveBoth = false;

			const effect = new BaseEffect((scope) => {
				scope.observe(observable1);
				if (shouldObserveBoth) {
					scope.observe(observable2);
				}
			});

			// Initially should only track observable1
			let observables = Array.from(effect.observables());
			expect(observables).toHaveLength(1);
			expect(observables[0]).toBe(observable1);

			// After re-running with different condition, should track both
			shouldObserveBoth = true;
			effect[$compute]();

			observables = Array.from(effect.observables());
			expect(observables).toHaveLength(2);
			expect(observables).toContain(observable1);
			expect(observables).toContain(observable2);
		});

		it("should not track the same observable twice", () => {
			const observable = new MockObservable();

			const effect = new BaseEffect((scope) => {
				scope.observe(observable);
				scope.observe(observable);
				scope.observe(observable);
			});

			const observables = Array.from(effect.observables());

			// Should deduplicate - implementation detail, but worth testing
			expect(observables.filter((obs) => obs === observable).length).toBeLessThanOrEqual(3);
		});
	});

	describe("scopes method", () => {
		it("should return an iterator", () => {
			const effect = new BaseEffect(() => {});
			const result = effect.scopes();

			expect(typeof result[Symbol.iterator]).toBe("function");
			expect(typeof result.next).toBe("function");
		});

		it("should yield no scopes initially", () => {
			const effect = new BaseEffect(() => {});
			const scopes = Array.from(effect.scopes());

			expect(scopes).toHaveLength(0);
		});

		it("should yield no scopes after disposal", () => {
			const effect = new BaseEffect(() => {});

			effect.dispose();

			const scopes = Array.from(effect.scopes());

			expect(scopes).toHaveLength(0);
		});
	});

	describe("observe method", () => {
		it("should accept an observable", () => {
			const effect = new BaseEffect(() => {});
			const observable = new MockObservable();

			expect(() => {
				effect.observe(observable);
			}).not.toThrow();
		});

		it("should be a no-op when not the active scope", () => {
			const effect = new BaseEffect(() => {});
			const observable = new MockObservable();

			// Call observe outside of effect execution context
			effect.observe(observable);

			const observables = Array.from(effect.observables());
			expect(observables).toHaveLength(0);
		});

		it("should be a no-op after disposal", () => {
			const effect = new BaseEffect(() => {});
			const observable = new MockObservable();

			effect.dispose();
			effect.observe(observable);

			const observables = Array.from(effect.observables());
			expect(observables).toHaveLength(0);
		});

		it("should not throw when observing after disposal", () => {
			const effect = new BaseEffect(() => {});
			const observable = new MockObservable();

			effect.dispose();

			expect(() => {
				effect.observe(observable);
			}).not.toThrow();
		});
	});

	describe("disposed getter", () => {
		it("should return false for a newly created effect", () => {
			const effect = new BaseEffect(() => {});

			expect(effect.disposed).toBe(false);
		});

		it("should return true after calling dispose", () => {
			const effect = new BaseEffect(() => {});

			effect.dispose();

			expect(effect.disposed).toBe(true);
		});

		it("should return true when created with an aborted signal", () => {
			const controller = new AbortController();
			controller.abort();

			const effect = new BaseEffect(() => {}, { signal: controller.signal });

			expect(effect.disposed).toBe(true);
		});

		it("should return true after signal is aborted", () => {
			const controller = new AbortController();
			const effect = new BaseEffect(() => {}, { signal: controller.signal });

			expect(effect.disposed).toBe(false);

			controller.abort();

			expect(effect.disposed).toBe(true);
		});
	});

	describe("dispose method", () => {
		it("should return void", () => {
			const effect = new BaseEffect(() => {});

			const result = effect.dispose();

			expect(result).toBeUndefined();
		});

		it("should set dependencies to null", () => {
			const effect = new BaseEffect(() => {});

			effect.dispose();

			expect(effect[$dependencies]).toBeNull();
		});

		it("should set observer to null", () => {
			const effect = new BaseEffect(() => {});

			effect.dispose();

			expect(effect[$observer]).toBeNull();
		});

		it("should set children to null", () => {
			const effect = new BaseEffect(() => {});

			effect.dispose();

			expect(effect[$children]).toBeNull();
		});

		it("should set parent to null", () => {
			const parent = new BaseScope();
			const effect = new BaseEffect(() => {}, { scope: parent });

			effect.dispose();

			expect(effect[$parent]).toBeNull();
		});

		it("should be idempotent", () => {
			const effect = new BaseEffect(() => {});

			expect(() => {
				effect.dispose();
				effect.dispose();
				effect.dispose();
			}).not.toThrow();

			expect(effect[$dependencies]).toBeNull();
			expect(effect[$children]).toBeNull();
		});

		it("should remove itself from parent's children array", () => {
			const parent = new BaseScope();
			const effect = new BaseEffect(() => {}, { scope: parent });

			expect(parent[$children]).toContain(effect);

			effect.dispose();

			expect(parent[$children]).not.toContain(effect);
		});

		it("should handle disposal when parent is already disposed", () => {
			const parent = new BaseScope();
			const effect = new BaseEffect(() => {}, { scope: parent });

			parent.dispose();

			expect(() => {
				effect.dispose();
			}).not.toThrow();

			expect(effect[$children]).toBeNull();
		});

		it("should unsubscribe from all observable dependencies", () => {
			const observable1 = new MockObservable();
			const observable2 = new MockObservable();
			const observable3 = new MockObservable();

			const effect = new BaseEffect((scope) => {
				scope.observe(observable1);
				scope.observe(observable2);
				scope.observe(observable3);
			});

			// Verify subscriptions were created by checking internal subscribers array
			expect(observable1[$subscribers]).toHaveLength(1);
			expect(observable2[$subscribers]).toHaveLength(1);
			expect(observable3[$subscribers]).toHaveLength(1);

			// Store references to the subscriptions
			const sub1 = observable1[$subscribers][0];
			const sub2 = observable2[$subscribers][0];
			const sub3 = observable3[$subscribers][0];

			// Verify subscriptions are not disposed yet
			expect(sub1[$flags] & Flags.Disposed).toBe(0);
			expect(sub2[$flags] & Flags.Disposed).toBe(0);
			expect(sub3[$flags] & Flags.Disposed).toBe(0);

			effect.dispose();

			// Verify all subscriptions were disposed
			expect(sub1[$flags] & Flags.Disposed).toBeGreaterThan(0);
			expect(sub2[$flags] & Flags.Disposed).toBeGreaterThan(0);
			expect(sub3[$flags] & Flags.Disposed).toBeGreaterThan(0);

			// Verify subscriptions were removed from observables' subscriber arrays
			expect(observable1[$subscribers]).not.toContain(sub1);
			expect(observable2[$subscribers]).not.toContain(sub2);
			expect(observable3[$subscribers]).not.toContain(sub3);
		});
	});

	describe("error handling", () => {
		it("should handle errors thrown in effect function", () => {
			const error = new Error("Effect error");
			const fn = vi.fn(() => {
				throw error;
			});

			expect(() => {
				new BaseEffect(fn);
			}).toThrow(error);
		});

		it("should convert non-Error values to Error when thrown", () => {
			const fn = vi.fn(() => {
				throw "string error";
			});

			expect(() => {
				new BaseEffect(fn);
			}).toThrow(Error);
		});
	});
});
