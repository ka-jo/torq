import { BaseStruct } from "@/Struct/core/BaseStruct";

describe("BaseStruct", () => {
	describe("T type parameter", () => {
		it("should be inferred from create argument", () => {
			const struct = BaseStruct.create({ count: 0, name: "test" });
			expectTypeOf(struct.count).toEqualTypeOf<number>();
			expectTypeOf(struct.name).toEqualTypeOf<string>();
		});

		it("should preserve complex object types", () => {
			const obj = {
				count: 0,
				nested: { value: 1 },
				optional: undefined as number | undefined,
			};
			const struct = BaseStruct.create(obj);
			expectTypeOf(struct.count).toEqualTypeOf<number>();
			expectTypeOf(struct.nested.value).toEqualTypeOf<number>();
			expectTypeOf(struct.optional).toEqualTypeOf<number | undefined>();
		});
	});

	describe("create static method", () => {
		it("should be a function", () => {
			expectTypeOf(BaseStruct.create).toBeFunction();
		});

		it("should accept an object", () => {
			expectTypeOf(BaseStruct.create).toBeCallableWith({ count: 0 });
		});

		it("should return a proxy of the same type", () => {
			const result = BaseStruct.create({ count: 0 });
			expectTypeOf(result.count).toEqualTypeOf<number>();
		});
	});

	describe("get trap", () => {
		it("should return correct property types", () => {
			const struct = BaseStruct.create({ count: 0, name: "test" });
			expectTypeOf(struct.count).toEqualTypeOf<number>();
			expectTypeOf(struct.name).toEqualTypeOf<string>();
		});

		it("should handle optional properties", () => {
			const struct = BaseStruct.create({ optional: undefined as number | undefined });
			expectTypeOf(struct.optional).toEqualTypeOf<number | undefined>();
		});

		it("should handle nested objects", () => {
			const struct = BaseStruct.create({ nested: { value: 1 } });
			expectTypeOf(struct.nested.value).toEqualTypeOf<number>();
		});
	});

	describe("set trap", () => {
		it("should accept values of correct type", () => {
			const struct = BaseStruct.create({ count: 0 });
			expectTypeOf(struct).toHaveProperty("count").toEqualTypeOf<number>();
		});
	});
});
