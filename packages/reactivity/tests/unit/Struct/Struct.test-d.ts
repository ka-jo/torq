import { Struct } from "@/Struct";
import type { Struct as StructType } from "@/Struct/Struct";
import { Ref } from "@/Ref";
import { $struct } from "@/common/symbols";

describe("Struct constructor", () => {
	it("should be a function", () => {
		expectTypeOf(Struct).toBeFunction();
	});

	it("should accept an object", () => {
		expectTypeOf(Struct).toBeCallableWith({ count: 0 });
	});

	it("should be callable with new", () => {
		expectTypeOf(Struct).toBeConstructibleWith({ count: 0 });
	});

	it("should return a Struct", () => {
		expectTypeOf(Struct({ count: 0 })).toEqualTypeOf<StructType<{ count: number }>>();
	});

	it("should work with new keyword", () => {
		expectTypeOf(new Struct({ count: 0 })).toEqualTypeOf<StructType<{ count: number }>>();
	});

	describe("type inference", () => {
		it("should infer primitive types", () => {
			const struct = Struct({ count: 0, name: "test", active: true });
			expectTypeOf(struct.count).toEqualTypeOf<number>();
			expectTypeOf(struct.name).toEqualTypeOf<string>();
			expectTypeOf(struct.active).toEqualTypeOf<boolean>();
		});

		it("should infer nested object types", () => {
			const struct = Struct({
				user: {
					name: "test",
					age: 25,
				},
			});
			expectTypeOf(struct.user.name).toEqualTypeOf<string>();
			expectTypeOf(struct.user.age).toEqualTypeOf<number>();
		});

		it("should infer array types", () => {
			const struct = Struct({ items: [1, 2, 3] });
			expectTypeOf(struct.items).toEqualTypeOf<number[]>();
		});

		it("should preserve optional properties", () => {
			const struct = Struct({ optional: undefined as number | undefined });
			expectTypeOf(struct.optional).toEqualTypeOf<number | undefined>();
		});

		it("should infer union types", () => {
			const struct = Struct({ value: 0 as number | string });
			expectTypeOf(struct.value).toEqualTypeOf<number | string>();
		});
	});

	describe("static isStruct method", () => {
		it("should be a function", () => {
			expectTypeOf(Struct.isStruct).toBeFunction();
		});

		it("should accept any value", () => {
			expectTypeOf(Struct.isStruct).toBeCallableWith({});
			expectTypeOf(Struct.isStruct).toBeCallableWith(null);
			expectTypeOf(Struct.isStruct).toBeCallableWith(undefined);
			expectTypeOf(Struct.isStruct).toBeCallableWith(0);
		});

		it("should return a boolean", () => {
			expectTypeOf(Struct.isStruct).returns.toEqualTypeOf<boolean>();
		});

		it("should act as a type guard", () => {
			const value: unknown = {};
			if (Struct.isStruct(value)) {
				expectTypeOf(value).toEqualTypeOf<StructType<unknown>>();
			}
		});

		it("should narrow the type parameter", () => {
			const value = { count: 0 };
			if (Struct.isStruct(value)) {
				expectTypeOf(value).toEqualTypeOf<StructType<{ count: number }>>();
			}
		});
	});

	describe("static ref method", () => {
		it("should be a function", () => {
			expectTypeOf(Struct.ref).toBeFunction();
		});

		it("should accept a struct and key", () => {
			const struct = Struct({ count: 0 });
			expectTypeOf(Struct.ref).toBeCallableWith(struct, "count");
		});

		it("should return a Ref with correct type", () => {
			const struct = Struct({ count: 0, name: "test" });
			expectTypeOf(Struct.ref(struct, "count")).toEqualTypeOf<Ref<number>>();
			expectTypeOf(Struct.ref(struct, "name")).toEqualTypeOf<Ref<string>>();
		});

		it("should only accept valid keys", () => {
			const struct = Struct({ count: 0 });
			expectTypeOf(Struct.ref(struct, "count")).toEqualTypeOf<Ref<number>>();
			// @ts-expect-error - "invalid" is not a valid key
			expectTypeOf(Struct.ref(struct, "invalid")).toEqualTypeOf<Ref<unknown>>();
		});

		it("should handle nested object refs", () => {
			const struct = Struct({ nested: { value: 1 } });
			expectTypeOf(Struct.ref(struct, "nested")).toEqualTypeOf<Ref<{ value: number }>>();
		});
	});

	describe("Symbol.hasInstance", () => {
		it("should work with instanceof", () => {
			const struct = Struct({ count: 0 });
			if (struct instanceof Struct) {
				expectTypeOf(struct).toEqualTypeOf<StructType<{ count: number }>>();
			}
		});
	});
});

describe("Struct type", () => {
	it("should extend the original object type", () => {
		type Original = { count: number; name: string };
		expectTypeOf<StructType<Original>>().toHaveProperty("count");
		expectTypeOf<StructType<Original>>().toHaveProperty("name");
	});

	it("should have $struct symbol", () => {
		expectTypeOf<StructType<{ count: number }>>().toHaveProperty($struct);
	});

	it("should preserve property types", () => {
		const struct: StructType<{ count: number; name: string }> = {} as any;
		expectTypeOf(struct.count).toEqualTypeOf<number>();
		expectTypeOf(struct.name).toEqualTypeOf<string>();
	});

	it("should preserve method types", () => {
		const struct: StructType<{ increment: () => void }> = {} as any;
		expectTypeOf(struct.increment).toEqualTypeOf<() => void>();
	});

	it("should preserve getter types", () => {
		type ObjWithGetter = {
			get fullName(): string;
		};
		const struct: StructType<ObjWithGetter> = {} as any;
		expectTypeOf(struct.fullName).toEqualTypeOf<string>();
	});

	it("should handle readonly properties", () => {
		type ObjWithReadonly = {
			readonly id: number;
		};
		const struct: StructType<ObjWithReadonly> = {} as any;
		expectTypeOf(struct.id).toEqualTypeOf<number>();
	});

	it("should handle optional properties", () => {
		type ObjWithOptional = {
			count?: number;
		};
		const struct: StructType<ObjWithOptional> = {} as any;
		expectTypeOf(struct.count).toEqualTypeOf<number | undefined>();
	});

	it("should handle index signatures", () => {
		type ObjWithIndex = {
			[key: string]: number;
		};
		const struct: StructType<ObjWithIndex> = {} as any;
		expectTypeOf(struct.anyKey).toEqualTypeOf<number>();
	});

	describe("nested structs", () => {
		it("should handle nested objects", () => {
			const struct = Struct({
				user: {
					profile: {
						name: "test",
					},
				},
			});
			expectTypeOf(struct.user.profile.name).toEqualTypeOf<string>();
		});

		it("should preserve types through nesting", () => {
			const struct = Struct({
				level1: {
					level2: {
						level3: {
							value: 42,
						},
					},
				},
			});
			expectTypeOf(struct.level1.level2.level3.value).toEqualTypeOf<number>();
		});
	});
});
