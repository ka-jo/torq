import { describe, it, expect, vi } from "vitest";
import { BaseStruct } from "@/Struct/core/BaseStruct";
import { BaseRef } from "@/Ref/core/BaseRef";
import { ComputedRef } from "@/Ref/core/ComputedRef";
import { $flags, $struct, $subscribers, $value } from "@/common/symbols";
import { Subscription } from "@/common/Subscription";
import { setActiveScope } from "@/common/current-scope";
import { BaseScope } from "@/Scope/core/BaseScope";
import type { Struct } from "@/Struct/Struct";

// Helper type to make objects compatible with $struct symbol
type WithStruct<T = any> = T & { [$struct]?: BaseStruct };

describe("BaseStruct", () => {
	describe("static create method", () => {
		it("should return a Proxy instance", () => {
			const proxy = BaseStruct.create({ count: 0 });

			// The proxy should be a proxy of the original object
			expect(typeof proxy).toBe("object");
			expect(proxy.count).toBe(0);
		});

		it("should attach the struct to the original object via $struct symbol", () => {
			const obj: WithStruct<{ count: number }> = { count: 0 };
			const proxy = BaseStruct.create(obj);

			expect(obj[$struct]).toBeInstanceOf(BaseStruct);
		});

		it("should return the same proxy if called with an already-wrapped object", () => {
			const obj: WithStruct<{ count: number }> = { count: 0 };
			const proxy1 = BaseStruct.create(obj);
			const proxy2 = BaseStruct.create(obj);

			expect(proxy1).toBe(proxy2);
		});

		it("should initialize $flags to 0", () => {
			const obj: WithStruct<{ count: number }> = { count: 0 };
			const proxy = BaseStruct.create(obj);
			const struct = obj[$struct] as BaseStruct;

			expect(struct[$flags]).toBe(0);
		});

		it("should initialize $value to the original object", () => {
			const obj: WithStruct<{ count: number }> = { count: 0 };
			const proxy = BaseStruct.create(obj);
			const struct = obj[$struct] as BaseStruct;

			expect(struct[$value]).toBe(obj);
		});

		it("should initialize refs to an empty object", () => {
			const obj: WithStruct<{ count: number }> = { count: 0 };
			const proxy = BaseStruct.create(obj);
			const struct = obj[$struct] as BaseStruct;

			expect(struct.refs).toEqual({});
			expect(Object.keys(struct.refs)).toHaveLength(0);
		});

		it("should set struct[$struct] to itself", () => {
			const obj: WithStruct<{ count: number }> = { count: 0 };
			const proxy = BaseStruct.create(obj);
			const struct = obj[$struct] as BaseStruct;

			expect(struct[$struct]).toBe(struct);
		});

		it("should set proxy property on the struct", () => {
			const obj: WithStruct<{ count: number }> = { count: 0 };
			const proxy = BaseStruct.create(obj);
			const struct = obj[$struct] as BaseStruct;

			expect(struct.proxy).toBe(proxy);
		});
	});

	describe("get trap", () => {
		describe("when property ref already exists", () => {
			it("should return the value from the ref", () => {
				const obj: WithStruct<{ count: number }> = { count: 0 };
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				// Initialize a ref
				struct.refs.count = new BaseRef(42);

				expect(proxy.count).toBe(42);
			});

			it("should not access the original object", () => {
				const obj: WithStruct<{ count: number }> = { count: 0 };
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				// Initialize a ref with different value
				struct.refs.count = new BaseRef(100);

				// Original object still has old value
				expect(obj.count).toBe(0);
				// But proxy returns ref value
				expect(proxy.count).toBe(100);
			});
		});

		describe("when property is a symbol", () => {
			it("should return the value directly from target", () => {
				const sym = Symbol("test");
				const obj: WithStruct<Record<symbol, string>> = { [sym]: "symbol-value" };
				const proxy = BaseStruct.create(obj);

				expect(proxy[sym]).toBe("symbol-value");
			});

			it("should not create a ref for symbols", () => {
				const sym = Symbol("test");
				const obj: WithStruct<Record<symbol, string>> = { [sym]: "symbol-value" };
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				proxy[sym]; // Access the symbol property

				expect(struct.refs[sym]).toBeUndefined();
			});
		});

		describe("when in tracking context (currentScope exists)", () => {
			it("should initialize a ref and return its value", () => {
				const scope = new BaseScope();
				setActiveScope(scope);

				try {
					const obj: WithStruct<{ count: number }> = { count: 0 };
					const proxy = BaseStruct.create(obj);
					const struct = obj[$struct] as BaseStruct;

					const result = proxy.count;

					expect(result).toBe(0);
					expect(struct.refs.count).toBeInstanceOf(BaseRef);
				} finally {
					setActiveScope(undefined);
				}
			});

			it("should track the property ref as a dependency", () => {
				const scope = new BaseScope();
				setActiveScope(scope);

				try {
					const obj: WithStruct<{ count: number }> = { count: 0 };
					const proxy = BaseStruct.create(obj);

					proxy.count; // Access in tracking context

					const deps = Array.from(scope.observables());
					expect(deps.length).toBeGreaterThan(0);
				} finally {
					setActiveScope(undefined);
				}
			});
		});

		describe("when target value is a ref", () => {
			it("should use the ref from target and cache it", () => {
				const countRef = new BaseRef(42);
				const obj: WithStruct<{ count: BaseRef<number> }> = { count: countRef };
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				expect(proxy.count).toBe(42);
				expect(struct.refs.count).toBe(countRef);
			});

			it("should unwrap the ref value", () => {
				const countRef = new BaseRef(100);
				const obj: WithStruct<{ count: BaseRef<number> }> = { count: countRef };
				const proxy = BaseStruct.create(obj);

				expect(proxy.count).toBe(100);
				expect(proxy.count).not.toBeInstanceOf(BaseRef);
			});
		});

		describe("when target value is an object", () => {
			it("should initialize a ref for the object", () => {
				const obj: WithStruct<{ nested: { value: number } }> = { nested: { value: 42 } };
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				proxy.nested; // Access the nested object

				expect(struct.refs.nested).toBeInstanceOf(BaseRef);
			});

			it("should return a struct proxy for nested objects", () => {
				const obj: WithStruct<{ nested: { value: number } }> = { nested: { value: 42 } };
				const proxy = BaseStruct.create(obj);

				const nested = proxy.nested as WithStruct<{ value: number }>;

				expect(nested[$struct]).toBeInstanceOf(BaseStruct);
			});
		});

		describe("when target value is a primitive", () => {
			it("should return the primitive directly without creating a ref", () => {
				const obj: WithStruct<{ count: number; name: string; flag: boolean }> = {
					count: 0,
					name: "test",
					flag: true,
				};
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				expect(proxy.count).toBe(0);
				expect(proxy.name).toBe("test");
				expect(proxy.flag).toBe(true);

				// No refs should be created for primitives accessed outside tracking context
				expect(struct.refs.count).toBeUndefined();
				expect(struct.refs.name).toBeUndefined();
				expect(struct.refs.flag).toBeUndefined();
			});
		});
	});

	describe("set trap", () => {
		describe("when property ref already exists", () => {
			it("should set the value on the existing ref", () => {
				const obj: WithStruct<{ count: number }> = { count: 0 };
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				// Initialize a ref
				struct.refs.count = new BaseRef(0);

				proxy.count = 42;

				expect(struct.refs.count.get()).toBe(42);
				expect(proxy.count).toBe(42);
			});

			it("should return the result from ref.set", () => {
				const obj: WithStruct<{ count: number }> = { count: 0 };
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				struct.refs.count = new BaseRef(0);

				const result = (proxy.count = 42);

				expect(result).toBe(42);
			});
		});

		describe("when setting a ref value", () => {
			it("should initialize a property ref linked to the assigned ref", () => {
				const obj: WithStruct<{ count: number }> = { count: 0 };
				const proxy = BaseStruct.create(obj) as any;
				const struct = obj[$struct] as BaseStruct;
				const countRef = new BaseRef(42);

				proxy.count = countRef;

				expect(struct.refs.count).toBeInstanceOf(BaseRef);
				expect(proxy.count).toBe(42);
			});

			it("should track updates from the assigned ref", () => {
				const obj: WithStruct<{ count: number }> = { count: 0 };
				const proxy = BaseStruct.create(obj) as any;
				const countRef = new BaseRef(10);

				proxy.count = countRef;

				countRef.set(100);

				expect(proxy.count).toBe(100);
			});

			it("should return the assigned ref", () => {
				const obj: WithStruct<{ count: number }> = { count: 0 };
				const proxy = BaseStruct.create(obj) as any;
				const countRef = new BaseRef(42);

				const result = (proxy.count = countRef);

				expect(result).toBe(countRef);
			});
		});

		describe("when target value is a ref", () => {
			it("should cache the target ref and set its value", () => {
				const countRef = new BaseRef(0);
				const obj: WithStruct<{ count: BaseRef<number> }> = { count: countRef };
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				(proxy as any).count = 42;

				expect(struct.refs.count).toBe(countRef);
				expect(countRef.get()).toBe(42);
				expect(proxy.count).toBe(42);
			});

			it("should return the result from ref.set", () => {
				const countRef = new BaseRef(0);
				const obj: WithStruct<{ count: BaseRef<number> }> = { count: countRef };
				const proxy = BaseStruct.create(obj);

				const result = ((proxy as any).count = 42);

				expect(result).toBe(42);
			});
		});

		describe("when target value is not a ref", () => {
			it("should use Reflect.set for primitive values", () => {
				const obj: WithStruct<{ count: number; name: string }> = { count: 0, name: "test" };
				const proxy = BaseStruct.create(obj);

				proxy.count = 42;
				proxy.name = "updated";

				expect(obj.count).toBe(42);
				expect(obj.name).toBe("updated");
				expect(proxy.count).toBe(42);
				expect(proxy.name).toBe("updated");
			});

			it("should return the assigned value on successful set", () => {
				const obj: WithStruct<{ count: number }> = { count: 0 };
				const proxy = BaseStruct.create(obj);

				const result = (proxy.count = 42);

				expect(result).toBe(42);
			});
		});
	});

	describe("initPropertyRef static method", () => {
		describe("when struct value is already a ref", () => {
			it("should use the existing ref", () => {
				const countRef = new BaseRef(42);
				const obj: WithStruct<{ count: BaseRef<number> }> = { count: countRef };
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				const result = BaseStruct.initPropertyRef(struct, "count");

				expect(result).toBe(countRef);
				expect(struct.refs.count).toBe(countRef);
			});

			it("should set the value if provided", () => {
				const countRef = new BaseRef(0);
				const obj: WithStruct<{ count: BaseRef<number> }> = { count: countRef };
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				BaseStruct.initPropertyRef(struct, "count", 100);

				expect(countRef.get()).toBe(100);
			});

			it("should not set the value if not provided", () => {
				const countRef = new BaseRef(42);
				const obj: WithStruct<{ count: BaseRef<number> }> = { count: countRef };
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				BaseStruct.initPropertyRef(struct, "count");

				expect(countRef.get()).toBe(42);
			});
		});

		describe("when property has a getter/setter", () => {
			it("should create a computed ref", () => {
				const obj: WithStruct<{
					_value: number;
					value: number;
				}> = {
					_value: 100,
					get value() {
						return this._value;
					},
					set value(v: number) {
						this._value = v;
					},
				};
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				const result = BaseStruct.initPropertyRef(struct, "value");

				expect(result).toBeInstanceOf(ComputedRef);
				expect(struct.refs.value).toBeInstanceOf(ComputedRef);
			});

			it("should bind getter to the proxy", () => {
				const obj: WithStruct<{
					_value: number;
					value: number;
				}> = {
					_value: 100,
					get value() {
						return this._value;
					},
					set value(v: number) {
						this._value = v;
					},
				};
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				const ref = BaseStruct.initPropertyRef(struct, "value");

				expect(ref.get()).toBe(100);
			});

			it("should bind setter to the proxy", () => {
				const obj: WithStruct<{
					_value: number;
					value: number;
				}> = {
					_value: 100,
					get value() {
						return this._value;
					},
					set value(v: number) {
						this._value = v;
					},
				};
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				const ref = BaseStruct.initPropertyRef(struct, "value");
				ref.set(200);

				expect(obj._value).toBe(200);
			});

			it("should not mutate the original object property", () => {
				const obj: WithStruct<{
					_value: number;
					value: number;
				}> = {
					_value: 100,
					get value() {
						return this._value;
					},
					set value(v: number) {
						this._value = v;
					},
				};
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				BaseStruct.initPropertyRef(struct, "value");

				// The original object should still have its getter/setter
				const descriptor = Object.getOwnPropertyDescriptor(obj, "value");
				expect(descriptor?.get).toBeTypeOf("function");
				expect(descriptor?.set).toBeTypeOf("function");
			});
		});

		describe("when property has a setter", () => {
			it("should create a computed ref with setter", () => {
				const obj: WithStruct<{
					_value: number;
					value: number;
				}> = {
					_value: 0,
					get value() {
						return this._value;
					},
					set value(v: number) {
						this._value = v;
					},
				};
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				const result = BaseStruct.initPropertyRef(struct, "value");

				expect(result).toBeInstanceOf(ComputedRef);
			});

			it("should bind setter to the proxy", () => {
				const obj: WithStruct<{
					_value: number;
					value: number;
				}> = {
					_value: 0,
					get value() {
						return this._value;
					},
					set value(v: number) {
						this._value = v;
					},
				};
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				const ref = BaseStruct.initPropertyRef(struct, "value");

				ref.set(42);

				expect(proxy._value).toBe(42);
			});

			it("should set the value if provided", () => {
				const obj: WithStruct<{
					_value: number;
					value: number;
				}> = {
					_value: 0,
					get value() {
						return this._value;
					},
					set value(v: number) {
						this._value = v;
					},
				};
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				BaseStruct.initPropertyRef(struct, "value", 100);

				expect(proxy._value).toBe(100);
			});
		});

		describe("when property is a primitive with value provided", () => {
			it("should create a new BaseRef with provided value", () => {
				const obj: WithStruct<{ count: number }> = { count: 0 };
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				const result = BaseStruct.initPropertyRef(struct, "count", 42);

				expect(result).toBeInstanceOf(BaseRef);
				expect(result.get()).toBe(42);
				expect(struct.refs.count).toBe(result);
			});

			it("should not mutate the original object", () => {
				const obj: WithStruct<{ count: number }> = { count: 0 };
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				BaseStruct.initPropertyRef(struct, "count", 42);

				// The original object should remain unchanged
				expect(obj.count).toBe(0);
			});

			it("should create ref with shallow: false", () => {
				const obj: WithStruct<{ count: number }> = { count: 0 };
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				const result = BaseStruct.initPropertyRef(struct, "count", 42) as BaseRef;

				// The ref should be created with shallow: false (deep reactivity)
				expect(result).toBeInstanceOf(BaseRef);
			});
		});

		describe("when property is a primitive without value provided", () => {
			it("should create a new BaseRef with struct value", () => {
				const obj: WithStruct<{ count: number }> = { count: 42 };
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				const result = BaseStruct.initPropertyRef(struct, "count");

				expect(result).toBeInstanceOf(BaseRef);
				expect(result.get()).toBe(42);
				expect(struct.refs.count).toBe(result);
			});

			it("should preserve the original value", () => {
				const obj: WithStruct<{ count: number }> = { count: 100 };
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				const result = BaseStruct.initPropertyRef(struct, "count");

				expect(result.get()).toBe(100);
			});
		});

		describe("when property is an object", () => {
			it("should create a ref wrapping the object", () => {
				const obj: WithStruct<{ nested: { value: number } }> = { nested: { value: 42 } };
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				const result = BaseStruct.initPropertyRef(struct, "nested");

				expect(result).toBeInstanceOf(BaseRef);
				expect(struct.refs.nested).toBe(result);
			});

			it("should wrap the object in a struct proxy", () => {
				const obj: WithStruct<{ nested: { value: number } }> = { nested: { value: 42 } };
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				const result = BaseStruct.initPropertyRef(struct, "nested");
				const nestedValue = result.get() as WithStruct<{ value: number }>;

				expect(nestedValue[$struct]).toBeInstanceOf(BaseStruct);
			});
		});
	});

	describe("integration scenarios", () => {
		it("should handle mixed property types", () => {
			const obj: WithStruct<{
				primitive: number;
				nested: { value: string };
				ref: BaseRef<number>;
			}> = {
				primitive: 42,
				nested: { value: "test" },
				ref: new BaseRef(100),
			};
			const proxy = BaseStruct.create(obj);
			const struct = obj[$struct] as BaseStruct;

			expect(proxy.primitive).toBe(42);
			expect(proxy.nested).toEqual({ value: "test" });
			expect(proxy.ref).toBe(100);
		});

		it("should maintain ref stability across multiple accesses", () => {
			const scope = new BaseScope();
			setActiveScope(scope);

			try {
				const obj: WithStruct<{ count: number }> = { count: 0 };
				const proxy = BaseStruct.create(obj);
				const struct = obj[$struct] as BaseStruct;

				proxy.count; // First access creates ref
				const ref1 = struct.refs.count;

				proxy.count; // Second access should use same ref
				const ref2 = struct.refs.count;

				expect(ref1).toBe(ref2);
			} finally {
				setActiveScope(undefined);
			}
		});

		it("should support property assignment after ref initialization", () => {
			const scope = new BaseScope();
			setActiveScope(scope);

			try {
				const obj: WithStruct<{ count: number }> = { count: 0 };
				const proxy = BaseStruct.create(obj);

				proxy.count; // Initialize ref
				proxy.count = 42; // Set through ref

				expect(proxy.count).toBe(42);
			} finally {
				setActiveScope(undefined);
			}
		});

		it("should handle assigning external ref to property", () => {
			const obj: WithStruct<{ count: number }> = { count: 0 };
			const proxy = BaseStruct.create(obj) as any;
			const externalRef = new BaseRef(999);

			proxy.count = externalRef;

			expect(proxy.count).toBe(999);

			externalRef.set(1000);

			expect(proxy.count).toBe(1000);
		});

		it("should handle non-enumerable $struct property", () => {
			const obj: WithStruct<{ count: number }> = { count: 0 };
			const proxy = BaseStruct.create(obj);

			const keys = Object.keys(obj);
			const ownKeys = Object.getOwnPropertyNames(obj);

			expect(keys).not.toContain($struct.toString());
			expect(obj[$struct]).toBeDefined();
		});

		it("should prevent modification of $struct property", () => {
			const obj: WithStruct<{ count: number }> = { count: 0 };
			const proxy = BaseStruct.create(obj);
			const originalStruct = obj[$struct];

			expect(() => {
				obj[$struct] = {} as any;
			}).toThrow();

			expect(obj[$struct]).toBe(originalStruct);
		});
	});
});
