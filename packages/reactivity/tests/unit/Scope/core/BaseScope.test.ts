import { describe, it, expect, vi, beforeEach } from "vitest";
import { BaseScope } from "@/Scope/core/BaseScope";
import {
	$parent,
	$children,
	$dependencies,
	$index,
	$observable,
	$value,
	$subscribers,
	$flags,
} from "@/common/symbols";
import type { Observable } from "@/common/types";
import { setActiveScope } from "@/common/current-scope";

// Mock Observable for testing
class MockObservable implements Observable {
	[$value]: any = null;
	[$subscribers]: any = null;
	[$flags]: number = 0;

	subscribe(): any {
		return { closed: false, unsubscribe: vi.fn() };
	}

	[Symbol.observable](): Observable {
		return this;
	}
}

describe("BaseScope", () => {
	describe("constructor", () => {
		it("should create an instance of BaseScope", () => {
			const scope = new BaseScope();

			expect(scope).toBeInstanceOf(BaseScope);
		});

		it("should initialize with no parent by default", () => {
			const scope = new BaseScope();

			expect(scope[$parent]).toBeNull();
		});

		it("should initialize with an empty children array", () => {
			const scope = new BaseScope();

			expect(scope[$children]).toEqual([]);
			expect(scope[$children]).toHaveLength(0);
		});

		it("should initialize with an empty dependencies set", () => {
			const scope = new BaseScope();

			expect(scope[$dependencies]).toBeInstanceOf(Set);
			expect(scope[$dependencies]?.size).toBe(0);
		});

		describe("parent option", () => {
			describe("when parent is provided", () => {
				it("should use the provided parent as parent", () => {
					const parent = new BaseScope();
					const child = new BaseScope({ scope: parent });

					expect(child[$parent]).toBe(parent);
				});

				it("should add itself to the parent's children", () => {
					const parent = new BaseScope();
					const child = new BaseScope({ scope: parent });

					expect(parent[$children]).toContain(child);
					expect(parent[$children]).toHaveLength(1);
				});

				it("should set the correct index based on parent's children", () => {
					const parent = new BaseScope();
					const child1 = new BaseScope({ scope: parent });
					const child2 = new BaseScope({ scope: parent });
					const child3 = new BaseScope({ scope: parent });

					expect(child1[$index]).toBe(0);
					expect(child2[$index]).toBe(1);
					expect(child3[$index]).toBe(2);
				});

				it("should throw when provided parent is disposed", () => {
					const parent = new BaseScope();
					parent.dispose();

					expect(() => {
						new BaseScope({ scope: parent });
					}).toThrow();
				});

				it("should have null parent if provided parent is null", () => {
					const scope = new BaseScope({ scope: null });
					expect(scope[$parent]).toBeNull();
				});
			});

			describe("when parent is not provided", () => {
				it("should use active scope as parent if available", () => {
					const parent = new BaseScope();

					setActiveScope(parent);

					const child = new BaseScope();

					expect(child[$parent]).toBe(parent);
					expect(parent[$children]).toContain(child);

					setActiveScope(undefined);
				});

				it("should have null parent if no active scope", () => {
					const scope = new BaseScope();
					expect(scope[$parent]).toBeNull();
				});
			});
		});
	});

	describe("observables method", () => {
		it("should return an iterator", () => {
			const scope = new BaseScope();
			const result = scope.observables();

			expect(typeof result[Symbol.iterator]).toBe("function");
			expect(typeof result.next).toBe("function");
		});

		it("should yield no observables initially", () => {
			const scope = new BaseScope();
			const observables = Array.from(scope.observables());

			expect(observables).toHaveLength(0);
		});

		it("should yield observables that have been observed", () => {
			const scope = new BaseScope();
			const observable = new MockObservable();

			scope.observe(observable);
			const observables = Array.from(scope.observables());

			expect(observables).toHaveLength(1);
			expect(observables[0]).toBe(observable);
		});

		it("should yield multiple observables", () => {
			const scope = new BaseScope();
			const observable1 = new MockObservable();
			const observable2 = new MockObservable();
			const observable3 = new MockObservable();

			scope.observe(observable1);
			scope.observe(observable2);
			scope.observe(observable3);

			const observables = Array.from(scope.observables());

			expect(observables).toHaveLength(3);
			expect(observables).toContain(observable1);
			expect(observables).toContain(observable2);
			expect(observables).toContain(observable3);
		});

		it("should yield no observables after disposal", () => {
			const scope = new BaseScope();
			const observable = new MockObservable();

			scope.observe(observable);
			scope.dispose();

			const observables = Array.from(scope.observables());

			expect(observables).toHaveLength(0);
		});

		it("should be iterable multiple times", () => {
			const scope = new BaseScope();
			const observable = new MockObservable();

			scope.observe(observable);

			const observables1 = Array.from(scope.observables());
			const observables2 = Array.from(scope.observables());

			expect(observables1).toEqual(observables2);
		});
	});

	describe("scopes method", () => {
		it("should return an iterator", () => {
			const scope = new BaseScope();
			const result = scope.scopes();

			expect(typeof result[Symbol.iterator]).toBe("function");
			expect(typeof result.next).toBe("function");
		});

		it("should yield no scopes initially", () => {
			const scope = new BaseScope();
			const scopes = Array.from(scope.scopes());

			expect(scopes).toHaveLength(0);
		});

		it("should yield child scopes", () => {
			const parent = new BaseScope();
			const child = new BaseScope({ scope: parent });

			const scopes = Array.from(parent.scopes());

			expect(scopes).toHaveLength(1);
			expect(scopes[0]).toBe(child);
		});

		it("should yield multiple child scopes", () => {
			const parent = new BaseScope();
			const child1 = new BaseScope({ scope: parent });
			const child2 = new BaseScope({ scope: parent });
			const child3 = new BaseScope({ scope: parent });

			const scopes = Array.from(parent.scopes());

			expect(scopes).toHaveLength(3);
			expect(scopes).toContain(child1);
			expect(scopes).toContain(child2);
			expect(scopes).toContain(child3);
		});

		it("should yield no scopes after disposal", () => {
			const parent = new BaseScope();
			new BaseScope({ scope: parent });

			parent.dispose();

			const scopes = Array.from(parent.scopes());

			expect(scopes).toHaveLength(0);
		});

		it("should be iterable multiple times", () => {
			const parent = new BaseScope();
			new BaseScope({ scope: parent });

			const scopes1 = Array.from(parent.scopes());
			const scopes2 = Array.from(parent.scopes());

			expect(scopes1).toEqual(scopes2);
		});
	});

	describe("observe method", () => {
		it("should accept an observable", () => {
			const scope = new BaseScope();
			const observable = new MockObservable();

			expect(() => {
				scope.observe(observable);
			}).not.toThrow();
		});

		it("should add observable to dependencies set", () => {
			const scope = new BaseScope();
			const observable = new MockObservable();

			scope.observe(observable);

			expect(scope[$dependencies]?.has(observable)).toBe(true);
		});

		it("should deduplicate the same observable", () => {
			const scope = new BaseScope();
			const observable = new MockObservable();

			scope.observe(observable);
			scope.observe(observable);
			scope.observe(observable);

			expect(scope[$dependencies]?.size).toBe(1);
		});

		it("should track multiple different observables", () => {
			const scope = new BaseScope();
			const observable1 = new MockObservable();
			const observable2 = new MockObservable();
			const observable3 = new MockObservable();

			scope.observe(observable1);
			scope.observe(observable2);
			scope.observe(observable3);

			expect(scope[$dependencies]?.size).toBe(3);
			expect(scope[$dependencies]?.has(observable1)).toBe(true);
			expect(scope[$dependencies]?.has(observable2)).toBe(true);
			expect(scope[$dependencies]?.has(observable3)).toBe(true);
		});

		it("should be a no-op after disposal", () => {
			const scope = new BaseScope();
			const observable = new MockObservable();

			scope.dispose();
			scope.observe(observable);

			// Dependencies are null after disposal
			expect(scope[$dependencies]).toBeNull();
		});

		it("should not throw when observing after disposal", () => {
			const scope = new BaseScope();
			const observable = new MockObservable();

			scope.dispose();

			expect(() => {
				scope.observe(observable);
			}).not.toThrow();
		});
	});

	describe("disposed getter", () => {
		it("should return false for a newly created scope", () => {
			const scope = new BaseScope();

			expect(scope.disposed).toBe(false);
		});

		it("should return true after calling dispose", () => {
			const scope = new BaseScope();

			scope.dispose();

			expect(scope.disposed).toBe(true);
		});

		it("should return true for all children when parent is disposed", () => {
			const parent = new BaseScope();
			const child1 = new BaseScope({ scope: parent });
			const child2 = new BaseScope({ scope: parent });

			parent.dispose();

			expect(parent.disposed).toBe(true);
			expect(child1.disposed).toBe(true);
			expect(child2.disposed).toBe(true);
		});
	});

	describe("dispose method", () => {
		it("should return void", () => {
			const scope = new BaseScope();

			const result = scope.dispose();

			expect(result).toBeUndefined();
		});

		it("should set children to null", () => {
			const scope = new BaseScope();

			scope.dispose();

			expect(scope[$children]).toBeNull();
		});

		it("should set dependencies to null", () => {
			const scope = new BaseScope();

			scope.dispose();

			expect(scope[$dependencies]).toBeNull();
		});

		it("should set parent to null", () => {
			const parent = new BaseScope();
			const child = new BaseScope({ scope: parent });

			child.dispose();

			expect(child[$parent]).toBeNull();
		});

		it("should be idempotent", () => {
			const scope = new BaseScope();

			expect(() => {
				scope.dispose();
				scope.dispose();
				scope.dispose();
			}).not.toThrow();

			expect(scope[$children]).toBeNull();
			expect(scope[$dependencies]).toBeNull();
		});

		it("should dispose all children", () => {
			const parent = new BaseScope();
			const child1 = new BaseScope({ scope: parent });
			const child2 = new BaseScope({ scope: parent });
			const child3 = new BaseScope({ scope: parent });

			parent.dispose();

			expect(child1[$children]).toBeNull();
			expect(child2[$children]).toBeNull();
			expect(child3[$children]).toBeNull();
		});

		it("should dispose nested children", () => {
			const grandparent = new BaseScope();
			const parent = new BaseScope({ scope: grandparent });
			const child = new BaseScope({ scope: parent });
			const grandchild = new BaseScope({ scope: child });

			grandparent.dispose();

			expect(grandparent[$children]).toBeNull();
			expect(parent[$children]).toBeNull();
			expect(child[$children]).toBeNull();
			expect(grandchild[$children]).toBeNull();
		});

		it("should dispose children before parent", () => {
			const parent = new BaseScope();
			const child1 = new BaseScope({ scope: parent });
			const child2 = new BaseScope({ scope: parent });

			const parentSpy = vi.spyOn(parent, "dispose");
			const child1Spy = vi.spyOn(child1, "dispose");
			const child2Spy = vi.spyOn(child2, "dispose");

			parent.dispose();

			// Verify all dispose methods were called
			expect(parentSpy).toHaveBeenCalledTimes(1);
			expect(child1Spy).toHaveBeenCalledTimes(1);
			expect(child2Spy).toHaveBeenCalledTimes(1);

			// Get the invocation order by checking invocationCallOrder
			const parentOrder = parentSpy.mock.invocationCallOrder[0];
			const child1Order = child1Spy.mock.invocationCallOrder[0];
			const child2Order = child2Spy.mock.invocationCallOrder[0];

			// Children should be disposed after parent starts disposing
			expect(child1Order).toBeGreaterThan(parentOrder);
			expect(child2Order).toBeGreaterThan(parentOrder);
		});

		it("should remove itself from parent's children array", () => {
			const parent = new BaseScope();
			const child = new BaseScope({ scope: parent });

			expect(parent[$children]).toContain(child);

			child.dispose();

			expect(parent[$children]).not.toContain(child);
		});

		it("should handle disposal of last child correctly", () => {
			const parent = new BaseScope();
			const child1 = new BaseScope({ scope: parent });
			const child2 = new BaseScope({ scope: parent });
			const child3 = new BaseScope({ scope: parent });

			child3.dispose();

			expect(parent[$children]).toHaveLength(2);
			expect(parent[$children]).toEqual([child1, child2]);
			expect(child1[$index]).toBe(0);
			expect(child2[$index]).toBe(1);
		});

		it("should handle disposal when parent is already disposed", () => {
			const parent = new BaseScope();
			const child = new BaseScope({ scope: parent });

			parent.dispose();

			expect(() => {
				child.dispose();
			}).not.toThrow();

			expect(child[$children]).toBeNull();
		});
	});
});
