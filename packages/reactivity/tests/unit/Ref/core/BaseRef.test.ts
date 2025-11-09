import { $observable, $value, $flags } from "@/common/symbols";
import { Flags } from "@/common/flags";
import { Subscription } from "@/common/Subscription";
import { BaseRef } from "@/Ref/core/BaseRef";

describe("BaseRef", () => {
	describe("constructor", () => {
		it("should return an instance of BaseRef", () => {
			const ref = new BaseRef(0);

			expect(ref).toBeInstanceOf(BaseRef);
		});

		it("should set the initial value", () => {
			const ref = new BaseRef(0);

			expect(ref[$value]).toBe(0);
		});
	});

	describe("get method", () => {
		it("should return the current value", () => {
			const ref = new BaseRef(0);

			expect(ref.get()).toBe(ref[$value]);
		});
	});

	describe("set method", () => {
		// This one is a bit weird, but currently, BaseRef has no reason to return anything but
		// true when setting the value. This will change when we implement the readonly flag
		it("should return true", () => {
			const ref = new BaseRef(0);

			const result = ref.set(1);

			expect(result).toBe(true);
		});

		it("should set the value", () => {
			const ref = new BaseRef(0);

			ref.set(1);

			expect(ref[$value]).toBe(1);
		});

		it("should notify observers when value is different", () => {
			const ref = new BaseRef(0);
			const nextCallback = vi.fn();
			ref.subscribe(nextCallback);

			ref.set(1);

			expect(nextCallback).toHaveBeenCalledWith(1);
		});

		it("should not notify observers when value is the same", () => {
			const ref = new BaseRef(0);
			const nextCallback = vi.fn();
			ref.subscribe(nextCallback);

			ref.set(0);

			expect(nextCallback).not.toHaveBeenCalled();
		});
	});

	describe("subscribe method", () => {
		it("should be callable with an observer", () => {
			const ref = new BaseRef(0);
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
			const ref = new BaseRef(0);
			const nextCallback = vi.fn();

			expect(() => {
				ref.subscribe(nextCallback);
			}).not.toThrowError();
		});

		it("should be callable with a next function and an error function", () => {
			const ref = new BaseRef(0);
			const nextCallback = vi.fn();
			const errorCallback = vi.fn();

			expect(() => {
				ref.subscribe(nextCallback, errorCallback);
			}).not.toThrowError();
		});

		it("should be callable with a next function, an error function, and a complete function", () => {
			const ref = new BaseRef(0);
			const nextCallback = vi.fn();
			const errorCallback = vi.fn();
			const completeCallback = vi.fn();

			expect(() => {
				ref.subscribe(nextCallback, errorCallback, completeCallback);
			}).not.toThrowError();
		});

		it("should be callable with a next function and a complete function, but no error function", () => {
			const ref = new BaseRef(0);
			const nextCallback = vi.fn();
			const completeCallback = vi.fn();
			expect(() => {
				ref.subscribe(nextCallback, undefined, completeCallback);
			}).not.toThrowError();
		});

		it("should return a Subscription instance", () => {
			const ref = new BaseRef(0);
			const nextCallback = vi.fn();

			const subscription = ref.subscribe(nextCallback);

			expect(subscription).toBeInstanceOf(Subscription);
		});

		it("should immediately trigger complete if the ref is disposed", () => {
			const ref = new BaseRef(0);
			const completeCallback = vi.fn();

			ref.dispose();

			ref.subscribe({ complete: completeCallback });

			expect(completeCallback).toHaveBeenCalled();
		});
	});

	describe("[$observable] method", () => {
		it("should return the instance itself", () => {
			const ref = new BaseRef(0);

			expect(ref[$observable]()).toBe(ref);
		});
	});

	describe("disposed getter", () => {
		it("should return false for a newly created ref", () => {
			const ref = new BaseRef(0);

			expect(ref.disposed).toBe(false);
		});

		it("should return true after calling dispose", () => {
			const ref = new BaseRef(0);

			ref.dispose();

			expect(ref.disposed).toBe(true);
		});

		it("should return true when created with an aborted signal", () => {
			const controller = new AbortController();
			controller.abort();

			const ref = new BaseRef(0, { signal: controller.signal });

			expect(ref.disposed).toBe(true);
		});

		it("should return true after signal is aborted", () => {
			const controller = new AbortController();
			const ref = new BaseRef(0, { signal: controller.signal });

			expect(ref.disposed).toBe(false);

			controller.abort();

			expect(ref.disposed).toBe(true);
		});
	});

	describe("dispose method", () => {
		it("should return void", () => {
			const ref = new BaseRef(0);

			const result = ref.dispose();

			expect(result).toBeUndefined();
		});

		it("should trigger complete callback for observers", () => {
			const ref = new BaseRef(0);
			const completeCallback = vi.fn();
			ref.subscribe({ complete: completeCallback });

			ref.dispose();

			expect(completeCallback).toHaveBeenCalled();
		});

		it("should prevent further notifications to observers", () => {
			const ref = new BaseRef(0);
			const nextCallback = vi.fn();
			ref.subscribe(nextCallback);

			ref.dispose();

			ref.set(1);

			expect(nextCallback).not.toHaveBeenCalled();
		});

		it("should set closed to true for all subscriptions", () => {
			const ref = new BaseRef(0);
			const nextCallback = vi.fn();
			const subscription = ref.subscribe(nextCallback);

			ref.dispose();

			expect(subscription.closed).toBe(true);
		});

		it("should set enabled to false for all subscriptions", () => {
			const ref = new BaseRef(0);
			const nextCallback = vi.fn();
			const subscription = ref.subscribe(nextCallback);

			ref.dispose();

			expect(subscription.enabled).toBe(false);
		});
	});

	describe("supports AbortSignal", () => {
		it("should trigger complete callback for observers when aborted", () => {
			const controller = new AbortController();
			const ref = new BaseRef(0, { signal: controller.signal });
			const completeCallback = vi.fn();
			ref.subscribe({ complete: completeCallback });

			controller.abort();

			expect(completeCallback).toHaveBeenCalled();
		});

		it("should prevent further notifications to observers", () => {
			const controller = new AbortController();
			const ref = new BaseRef(0, { signal: controller.signal });
			const nextCallback = vi.fn();
			ref.subscribe(nextCallback);

			controller.abort();

			ref.set(1);

			expect(nextCallback).not.toHaveBeenCalled();
		});

		it("should set closed to true for all subscriptions", () => {
			const controller = new AbortController();
			const ref = new BaseRef(0, { signal: controller.signal });
			const nextCallback = vi.fn();
			const subscription = ref.subscribe(nextCallback);

			controller.abort();

			expect(subscription.closed).toBe(true);
		});

		it("should set enabled to false for all subscriptions", () => {
			const controller = new AbortController();
			const ref = new BaseRef(0, { signal: controller.signal });
			const nextCallback = vi.fn();
			const subscription = ref.subscribe(nextCallback);

			controller.abort();

			expect(subscription.enabled).toBe(false);
		});

		it("should handle already-aborted signals", () => {
			const controller = new AbortController();
			controller.abort(); // Abort before creating ref

			const ref = new BaseRef(0, { signal: controller.signal });

			// Ref should be immediately disposed
			expect(ref[$flags] & Flags.Disposed).toBe(Flags.Disposed);
		});

		it("should not notify subscribers when created with already-aborted signal", () => {
			const controller = new AbortController();
			controller.abort(); // Abort before creating ref

			const ref = new BaseRef(0, { signal: controller.signal });
			const nextCallback = vi.fn();
			ref.subscribe(nextCallback);

			ref.set(1);

			expect(nextCallback).not.toHaveBeenCalled();
		});

		it("should complete observers immediately when created with already-aborted signal", () => {
			const controller = new AbortController();
			controller.abort(); // Abort before creating ref

			const ref = new BaseRef(0, { signal: controller.signal });
			const completeCallback = vi.fn();
			ref.subscribe({ complete: completeCallback });

			// Complete should have been called during subscription setup
			expect(completeCallback).toHaveBeenCalled();
		});

		it("should have closed subscriptions when created with already-aborted signal", () => {
			const controller = new AbortController();
			controller.abort(); // Abort before creating ref

			const ref = new BaseRef(0, { signal: controller.signal });
			const subscription = ref.subscribe(() => {});

			expect(subscription.closed).toBe(true);
			expect(subscription.enabled).toBe(false);
		});
	});

	describe("supports forwarding from other refs", () => {
		describe("when constructed with a ref", () => {
			it("should set the value to the forwarded ref's value", () => {
				const ref1 = new BaseRef(0);
				const ref2 = new BaseRef(ref1);

				expect(ref2[$value]).toBe(ref1[$value]);
			});

			it("should update the value when the forwarded ref's value changes", () => {
				const ref1 = new BaseRef(0);
				const ref2 = new BaseRef(ref1);

				ref1.set(1);

				expect(ref2[$value]).toBe(1);
			});

			it("should notify subscribers when the forwarded ref's value changes", () => {
				const ref1 = new BaseRef(0);
				const ref2 = new BaseRef(ref1);
				const nextCallback = vi.fn();
				ref2.subscribe(nextCallback);

				ref1.set(1);

				expect(nextCallback).toHaveBeenCalledWith(1);
			});

			it("should not notify subscribers when the forwarded ref's value is set to the same value", () => {
				const ref1 = new BaseRef(0);
				const ref2 = new BaseRef(ref1);
				const nextCallback = vi.fn();
				ref2.subscribe(nextCallback);

				ref1.set(0);

				expect(nextCallback).not.toHaveBeenCalled();
			});

			it("should cancel forwarding when a new value is set on the ref", () => {
				const ref1 = new BaseRef(0);
				const ref2 = new BaseRef(ref1);
				const nextCallback = vi.fn();
				ref2.subscribe(nextCallback);

				ref2.set(1);

				expect(nextCallback).toHaveBeenCalledTimes(1);
				expect(ref2[$value]).toBe(1);

				ref1.set(2);

				expect(nextCallback).toHaveBeenCalledTimes(1);
				expect(ref2[$value]).toBe(1);
			});
		});

		describe("when set with a ref", () => {
			it("should set the value to the forwarded ref's value", () => {
				const ref1 = new BaseRef(0);
				const ref2 = new BaseRef(1);

				ref2.set(ref1);

				expect(ref2[$value]).toBe(ref1[$value]);
			});

			it("should update the value when the forwarded ref's value changes", () => {
				const ref1 = new BaseRef(0);
				const ref2 = new BaseRef(1);

				ref2.set(ref1);

				expect(ref2[$value]).toBe(0);

				ref1.set(42);

				expect(ref2[$value]).toBe(42);
			});

			it("should notify subscribers when the forwarded ref's value changes", () => {
				const ref1 = new BaseRef(0);
				const ref2 = new BaseRef(1);

				ref2.set(ref1);

				const nextCallback = vi.fn();
				ref2.subscribe(nextCallback);

				ref1.set(42);

				expect(nextCallback).toHaveBeenCalledWith(42);
			});

			it("should not notify subscribers when the forwarded ref's value is set to the same value", () => {
				const ref1 = new BaseRef(0);
				const ref2 = new BaseRef(1);

				ref2.set(ref1);

				const nextCallback = vi.fn();
				ref2.subscribe(nextCallback);

				ref1.set(0);

				expect(nextCallback).not.toHaveBeenCalled();
			});

			it("should cancel forwarding when a new value is set on the ref", () => {
				const ref1 = new BaseRef(0);
				const ref2 = new BaseRef(1);

				ref2.set(ref1);

				const nextCallback = vi.fn();
				ref2.subscribe(nextCallback);

				ref2.set(42);

				expect(nextCallback).toHaveBeenCalledTimes(1);
				expect(ref2[$value]).toBe(42);

				ref1.set(99);

				expect(nextCallback).toHaveBeenCalledTimes(1);
				expect(ref2[$value]).toBe(42);
			});
		});
	});
});
