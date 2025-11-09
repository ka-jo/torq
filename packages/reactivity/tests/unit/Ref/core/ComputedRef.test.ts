import { vi } from "vitest";
import { Subscription } from "@/common/Subscription";
import { Flags } from "@/common/flags";
import {
	$dependencies,
	$flags,
	$observable,
	$value,
	$compute,
	$dependenciesIndex,
	$subscribers,
	$subscribersIndex,
	$parent,
	$children,
	$index,
} from "@/common/symbols";
import { ComputedRef } from "@/Ref/core/ComputedRef";
import { Ref } from "@/Ref/Ref";
import { setActiveScope } from "@/common/current-scope";

// Helper function to create a mock subscription with dependency tracking fields
function createMockDependency(
	overrides: Partial<{
		isDirty: boolean;
		sourceValue: unknown;
		snapshotValue: unknown;
		hasCompute: boolean;
	}>
): Subscription {
	const { isDirty = false, sourceValue = 42, snapshotValue = 42, hasCompute = false } = overrides;

	const mockObservable: any = {
		[$flags]: isDirty ? Flags.Dirty : 0,
		[$value]: sourceValue,
		[$subscribers]: [], // Need this for unsubscribe to work
	};

	if (hasCompute) {
		mockObservable[$compute] = vi.fn();
	}

	// Create a real subscription using the factory method
	const subscription = Subscription.create(mockObservable, { next: vi.fn() } as any);
	// Set the snapshot value to simulate what was captured during tracking
	(subscription as any)[$value] = snapshotValue;
	// Set a mock index to indicate it's part of a dependencies array
	(subscription as any)[$dependenciesIndex] = 0;

	return subscription;
}

describe("ComputedRef", () => {
	describe("constructor", () => {
		it("should return an instance of ComputedRef", () => {
			const ref = new ComputedRef({ get: () => 0 });

			expect(ref).toBeInstanceOf(ComputedRef);
		});

		it("should initialize with no parent by default", () => {
			const ref = new ComputedRef({ get: () => 0 });

			expect(ref[$parent]).toBeNull();
		});

		it("should initialize with an empty children array", () => {
			const ref = new ComputedRef({ get: () => 0 });

			expect(ref[$children]).toEqual([]);
			expect(ref[$children]).toHaveLength(0);
		});

		describe("scope option", () => {
			describe("when scope is provided", () => {
				it("should use the provided scope as parent", () => {
					const parent = new ComputedRef({ get: () => 1 });
					const child = new ComputedRef({ get: () => 2, scope: parent });

					expect(child[$parent]).toBe(parent);
				});

				it("should add itself to the parent's children", () => {
					const parent = new ComputedRef({ get: () => 1 });
					const child = new ComputedRef({ get: () => 2, scope: parent });

					expect(parent[$children]).toContain(child);
					expect(parent[$children]).toHaveLength(1);
				});

				it("should set the correct index based on parent's children", () => {
					const parent = new ComputedRef({ get: () => 1 });
					const child1 = new ComputedRef({ get: () => 2, scope: parent });
					const child2 = new ComputedRef({ get: () => 3, scope: parent });
					const child3 = new ComputedRef({ get: () => 4, scope: parent });

					expect(child1[$index]).toBe(0);
					expect(child2[$index]).toBe(1);
					expect(child3[$index]).toBe(2);
				});

				it("should throw when provided parent is disposed", () => {
					const parent = new ComputedRef({ get: () => 1 });
					parent.dispose();

					expect(() => {
						new ComputedRef({ get: () => 2, scope: parent });
					}).toThrow("Cannot add scope to disposed parent");
				});

				it("should have null parent if provided scope is null", () => {
					const ref = new ComputedRef({ get: () => 0, scope: null });
					expect(ref[$parent]).toBeNull();
				});
			});

			describe("when scope is not provided", () => {
				it("should use active scope as parent if available", async () => {
					const parent = new ComputedRef({ get: () => 1 });

					setActiveScope(parent);

					const child = new ComputedRef({ get: () => 2 });

					expect(child[$parent]).toBe(parent);
					expect(parent[$children]).toContain(child);

					setActiveScope(undefined);
				});

				it("should have null parent if no active scope", () => {
					const ref = new ComputedRef({ get: () => 0 });
					expect(ref[$parent]).toBeNull();
				});
			});
		});
	});

	describe("get method", () => {
		it("should call the getter on initial get", () => {
			const getFn = vi.fn(() => 0);
			const ref = new ComputedRef({ get: getFn });

			ref.get();

			expect(getFn).toHaveBeenCalled();
		});

		it("should return the value from the get function", () => {
			const ref = new ComputedRef({ get: () => 42 });

			const result = ref.get();

			expect(result).toBe(42);
		});

		it("should return the cached value if not dirty", () => {
			const getter = vi.fn(() => 42);
			const ref = new ComputedRef({ get: getter });

			ref[$value] = 42; // Simulate cached value
			ref[$flags] = 0; // Simulate not dirty

			const result = ref.get();

			expect(getter).not.toHaveBeenCalled(); // Ensure the getter is not called
			expect(result).toBe(42);
		});

		describe("when the ref is dirty", () => {
			it("should call the getter if any dependencies are outdated", () => {
				const getter = vi.fn(() => 42);
				const ref = new ComputedRef({ get: getter });

				ref[$value] = 27;
				ref[$flags] = Flags.Dirty;
				ref[$dependencies] = [
					createMockDependency({
						sourceValue: 100,
						snapshotValue: 50, // Different values to make it outdated
					}),
				];

				const result = ref.get();
				// Even though the we set the cached value to 27, the getter should be called because the ref is dirty
				expect(getter).toHaveBeenCalled();
				expect(result).toBe(42);
			});

			it("should not call the getter if no dependencies are outdated", () => {
				const getter = vi.fn(() => 42);
				const ref = new ComputedRef({ get: getter });

				ref[$value] = 27;
				ref[$flags] = Flags.Dirty;
				ref[$dependencies] = [
					createMockDependency({
						sourceValue: 50,
						snapshotValue: 50, // Same values to make it not outdated
					}),
				];

				const result = ref.get();
				// Even though the we set the cached value to 27, the getter should be called because the ref is dirty
				expect(getter).not.toHaveBeenCalled();
				expect(result).toBe(27);
			});
		});
	});

	describe("set method", () => {
		it("should throw an error if setter not defined", () => {
			const ref = new ComputedRef({ get: () => 0 });

			expect(() => ref.set(1)).toThrow(TypeError);
		});

		it("should return true if setter defined", () => {
			const ref = new ComputedRef({ get: () => 0, set: () => {} });

			const result = ref.set(1);

			expect(result).toBe(true);
		});

		it("should call setter", () => {
			const setFn = vi.fn();
			const ref = new ComputedRef({ get: () => 0, set: setFn });

			ref.set(1);

			expect(setFn).toHaveBeenCalledWith(1);
		});
	});

	describe("subscribe method", () => {
		it("should be callable with an observer", () => {
			const ref = new ComputedRef({ get: () => 0 });
			const nextCallback = vi.fn();
			const errorCallback = vi.fn();
			const completeCallback = vi.fn();

			expect(() => {
				ref.subscribe({
					next: nextCallback,
					error: errorCallback,
					complete: completeCallback,
				});
			}).not.toThrowError();
		});

		it("should be callable with a next function", () => {
			const ref = new ComputedRef({ get: () => 0 });
			const nextCallback = vi.fn();

			expect(() => {
				ref.subscribe(nextCallback);
			}).not.toThrowError();
		});

		it("should be callable with a next function and an error function", () => {
			const ref = new ComputedRef({ get: () => 0 });
			const nextCallback = vi.fn();
			const errorCallback = vi.fn();

			expect(() => {
				ref.subscribe(nextCallback, errorCallback);
			}).not.toThrowError();
		});

		it("should be callable with a next function, an error function, and a complete function", () => {
			const ref = new ComputedRef({ get: () => 0 });
			const nextCallback = vi.fn();
			const errorCallback = vi.fn();
			const completeCallback = vi.fn();

			expect(() => {
				ref.subscribe(nextCallback, errorCallback, completeCallback);
			}).not.toThrowError();
		});

		it("should be callable with a next function and a complete function, but no error function", () => {
			const ref = new ComputedRef({ get: () => 0 });
			const nextCallback = vi.fn();
			const completeCallback = vi.fn();
			expect(() => {
				ref.subscribe(nextCallback, undefined, completeCallback);
			}).not.toThrowError();
		});

		it("should return a Subscription instance", () => {
			const ref = new ComputedRef({ get: () => 0 });
			const nextCallback = vi.fn();

			const subscription = ref.subscribe(nextCallback);

			expect(subscription).toBeInstanceOf(Subscription);
		});

		it("should immediately trigger complete if the ref is disposed", () => {
			const ref = new ComputedRef({ get: () => 0 });
			const completeCallback = vi.fn();

			ref.dispose();

			ref.subscribe({ complete: completeCallback });

			expect(completeCallback).toHaveBeenCalled();
		});
	});

	describe("[$observable] method", () => {
		it("should return the instance itself", () => {
			const ref = new ComputedRef({ get: () => 0 });

			expect(ref[$observable]()).toBe(ref);
		});
	});

	describe("disposed getter", () => {
		it("should return false for a newly created computed ref", () => {
			const ref = new ComputedRef({ get: () => 0 });

			expect(ref.disposed).toBe(false);
		});

		it("should return true after calling dispose", () => {
			const ref = new ComputedRef({ get: () => 0 });

			ref.dispose();

			expect(ref.disposed).toBe(true);
		});

		it("should return true when created with an aborted signal", () => {
			const controller = new AbortController();
			controller.abort();

			const ref = new ComputedRef({ get: () => 0, signal: controller.signal });

			expect(ref.disposed).toBe(true);
		});

		it("should return true after signal is aborted", () => {
			const controller = new AbortController();
			const ref = new ComputedRef({ get: () => 0, signal: controller.signal });

			expect(ref.disposed).toBe(false);

			controller.abort();

			expect(ref.disposed).toBe(true);
		});
	});

	describe("dispose method", () => {
		it("should return void", () => {
			const ref = new ComputedRef({ get: () => 0 });

			const result = ref.dispose();

			expect(result).toBeUndefined();
		});

		it("should trigger complete callback for observers", () => {
			const ref = new ComputedRef({ get: () => 0 });
			const completeCallback = vi.fn();
			ref.subscribe({ complete: completeCallback });

			ref.dispose();

			expect(completeCallback).toHaveBeenCalled();
		});

		it("should prevent further notifications to observers", () => {
			const ref = new ComputedRef({ get: () => 0 });
			const nextCallback = vi.fn();
			ref.subscribe(nextCallback);

			ref.dispose();

			ref.set(1);

			expect(nextCallback).not.toHaveBeenCalled();
		});

		it("should set closed to true for all subscriptions", () => {
			const ref = new ComputedRef({ get: () => 0 });
			const nextCallback = vi.fn();
			const subscription = ref.subscribe(nextCallback);

			ref.dispose();

			expect(subscription.closed).toBe(true);
		});

		it("should set enabled to false for all subscriptions", () => {
			const ref = new ComputedRef({ get: () => 0 });
			const nextCallback = vi.fn();
			const subscription = ref.subscribe(nextCallback);

			ref.dispose();

			expect(subscription.enabled).toBe(false);
		});

		it("should set children to null", () => {
			const ref = new ComputedRef({ get: () => 0 });

			ref.dispose();

			expect(ref[$children]).toBeNull();
		});

		it("should set parent to null", () => {
			const parent = new ComputedRef({ get: () => 1 });
			const child = new ComputedRef({ get: () => 2, scope: parent });

			child.dispose();

			expect(child[$parent]).toBeNull();
		});

		it("should dispose all children", () => {
			const parent = new ComputedRef({ get: () => 1 });
			const child1 = new ComputedRef({ get: () => 2, scope: parent });
			const child2 = new ComputedRef({ get: () => 3, scope: parent });
			const child3 = new ComputedRef({ get: () => 4, scope: parent });

			parent.dispose();

			expect(child1[$children]).toBeNull();
			expect(child2[$children]).toBeNull();
			expect(child3[$children]).toBeNull();
		});

		it("should remove itself from parent's children array", () => {
			const parent = new ComputedRef({ get: () => 1 });
			const child = new ComputedRef({ get: () => 2, scope: parent });

			expect(parent[$children]).toContain(child);

			child.dispose();

			expect(parent[$children]).not.toContain(child);
			expect(parent[$children]?.length).toBe(0);
		});
	});

	describe("supports AbortSignal", () => {
		it("should trigger complete callback for observers when aborted", () => {
			const controller = new AbortController();
			const ref = new ComputedRef({ get: () => 0, signal: controller.signal });
			const completeCallback = vi.fn();
			ref.subscribe({ complete: completeCallback });

			controller.abort();

			expect(completeCallback).toHaveBeenCalled();
		});

		it("should prevent further notifications to observers", () => {
			const controller = new AbortController();
			const ref = new ComputedRef({ get: () => 0, signal: controller.signal });
			const nextCallback = vi.fn();
			ref.subscribe(nextCallback);

			controller.abort();

			ref.set(1);

			expect(nextCallback).not.toHaveBeenCalled();
		});

		it("should set closed to true for all subscriptions", () => {
			const controller = new AbortController();
			const ref = new ComputedRef({ get: () => 0, signal: controller.signal });
			const nextCallback = vi.fn();
			const subscription = ref.subscribe(nextCallback);

			controller.abort();

			expect(subscription.closed).toBe(true);
		});

		it("should set enabled to false for all subscriptions", () => {
			const controller = new AbortController();
			const ref = new ComputedRef({ get: () => 0, signal: controller.signal });
			const nextCallback = vi.fn();
			const subscription = ref.subscribe(nextCallback);

			controller.abort();

			expect(subscription.enabled).toBe(false);
		});

		it("should handle already-aborted signals", () => {
			const controller = new AbortController();
			controller.abort(); // Abort before creating ref

			const ref = new ComputedRef({ get: () => 0, signal: controller.signal });

			// Ref should be immediately disposed
			expect(ref[$flags] & Flags.Disposed).toBe(Flags.Disposed);
		});

		it("should not notify subscribers when created with already-aborted signal", () => {
			const controller = new AbortController();
			controller.abort(); // Abort before creating ref

			const ref = new ComputedRef({
				get: () => 0,
				set: () => {},
				signal: controller.signal,
			});
			const nextCallback = vi.fn();
			ref.subscribe(nextCallback);

			ref.set(1);

			expect(nextCallback).not.toHaveBeenCalled();
		});

		it("should complete observers immediately when created with already-aborted signal", () => {
			const controller = new AbortController();
			controller.abort(); // Abort before creating ref

			const ref = new ComputedRef({ get: () => 0, signal: controller.signal });
			const completeCallback = vi.fn();
			ref.subscribe({ complete: completeCallback });

			// Complete should have been called during subscription setup
			expect(completeCallback).toHaveBeenCalled();
		});

		it("should have closed subscriptions when created with already-aborted signal", () => {
			const controller = new AbortController();
			controller.abort(); // Abort before creating ref

			const ref = new ComputedRef({ get: () => 0, signal: controller.signal });
			const subscription = ref.subscribe(() => {});

			expect(subscription.closed).toBe(true);
			expect(subscription.enabled).toBe(false);
		});
	});

	it("should not call getter until first access", () => {
		const getter = vi.fn(() => 42);
		const ref = new ComputedRef({ get: getter });

		expect(getter).not.toHaveBeenCalled();

		ref.get();

		expect(getter).toHaveBeenCalled();
	});

	describe("observables method", () => {
		it("should return an iterator", () => {
			const ref = new ComputedRef({ get: () => 0 });
			const result = ref.observables();

			expect(typeof result[Symbol.iterator]).toBe("function");
			expect(typeof result.next).toBe("function");
		});

		it("should yield no observables initially", () => {
			const ref = new ComputedRef({ get: () => 42 });
			const observables = Array.from(ref.observables());

			expect(observables).toHaveLength(0);
		});

		it("should yield tracked observables after computation", () => {
			const source = Ref(42);
			const ref = new ComputedRef({ get: () => source.get() });
			ref.get(); // Force computation to track dependencies

			const observables = Array.from(ref.observables());

			expect(observables).toHaveLength(1);
			expect(observables[0]).toBe(source);
		});

		it("should yield multiple tracked observables", () => {
			const source1 = Ref(1);
			const source2 = Ref(2);
			const source3 = Ref(3);
			const ref = new ComputedRef({ get: () => source1.get() + source2.get() + source3.get() });
			ref.get(); // Force computation

			const observables = Array.from(ref.observables());

			expect(observables).toHaveLength(3);
			expect(observables).toContain(source1);
			expect(observables).toContain(source2);
			expect(observables).toContain(source3);
		});

		it("should yield no observables after disposal", () => {
			const source = Ref(42);
			const ref = new ComputedRef({ get: () => source.get() });
			ref.get(); // Force computation

			ref.dispose();

			const observables = Array.from(ref.observables());
			expect(observables).toEqual([]);
		});

		it("should be iterable multiple times", () => {
			const source = Ref(42);
			const ref = new ComputedRef({ get: () => source.get() });
			ref.get(); // Force computation

			const observables1 = Array.from(ref.observables());
			const observables2 = Array.from(ref.observables());

			expect(observables1).toEqual(observables2);
		});
	});

	describe("scopes method", () => {
		it("should return an iterator", () => {
			const ref = new ComputedRef({ get: () => 0 });
			const result = ref.scopes();

			expect(typeof result[Symbol.iterator]).toBe("function");
			expect(typeof result.next).toBe("function");
		});

		it("should yield no scopes initially", () => {
			const ref = new ComputedRef({ get: () => 0 });
			const scopes = Array.from(ref.scopes());

			expect(scopes).toHaveLength(0);
		});

		it("should yield child scopes", () => {
			const parent = new ComputedRef({ get: () => 1 });
			const child = new ComputedRef({ get: () => 2, scope: parent });

			const scopes = Array.from(parent.scopes());

			expect(scopes).toHaveLength(1);
			expect(scopes[0]).toBe(child);
		});

		it("should yield multiple child scopes", () => {
			const parent = new ComputedRef({ get: () => 1 });
			const child1 = new ComputedRef({ get: () => 2, scope: parent });
			const child2 = new ComputedRef({ get: () => 3, scope: parent });
			const child3 = new ComputedRef({ get: () => 4, scope: parent });

			const scopes = Array.from(parent.scopes());

			expect(scopes).toHaveLength(3);
			expect(scopes).toContain(child1);
			expect(scopes).toContain(child2);
			expect(scopes).toContain(child3);
		});

		it("should yield no scopes after disposal", () => {
			const parent = new ComputedRef({ get: () => 1 });
			new ComputedRef({ get: () => 2, scope: parent });

			parent.dispose();

			const scopes = Array.from(parent.scopes());

			expect(scopes).toHaveLength(0);
		});

		it("should be iterable multiple times", () => {
			const parent = new ComputedRef({ get: () => 1 });
			new ComputedRef({ get: () => 2, scope: parent });

			const scopes1 = Array.from(parent.scopes());
			const scopes2 = Array.from(parent.scopes());

			expect(scopes1).toEqual(scopes2);
		});
	});
});
