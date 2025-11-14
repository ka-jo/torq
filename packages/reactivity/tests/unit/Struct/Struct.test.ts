import { describe, it, expect } from "vitest";
import { Struct } from "@/Struct";
import { Ref } from "@/Ref";

describe("Struct", () => {
	describe("constructor", () => {
		it("should be callable with new keyword", () => {
			expect(() => {
				const struct = new Struct({ count: 0 });
				expect(Struct.isStruct(struct)).toBe(true);
			}).not.toThrow();
		});

		it("should be callable without new keyword", () => {
			expect(() => {
				const struct = Struct({ count: 0 });
				expect(Struct.isStruct(struct)).toBe(true);
			}).not.toThrow();
		});

		it("should return a proxy", () => {
			const struct = Struct({ count: 0 });
			expect(typeof struct).toBe("object");
			expect(struct).not.toBeNull();
		});

		it("should handle empty objects", () => {
			expect(() => {
				const struct = Struct({});
				expect(Struct.isStruct(struct)).toBe(true);
			}).not.toThrow();
		});
	});

	describe("static isStruct method", () => {
		it("should return true for Struct instance", () => {
			const struct = Struct({ count: 0 });
			expect(Struct.isStruct(struct)).toBe(true);
		});

		it("should return false for plain object", () => {
			const obj = { count: 0 };
			expect(Struct.isStruct(obj)).toBe(false);
		});

		it("should return false for null", () => {
			expect(Struct.isStruct(null)).toBe(false);
		});

		it("should return false for undefined", () => {
			expect(Struct.isStruct(undefined)).toBe(false);
		});

		it("should return false for primitives", () => {
			expect(Struct.isStruct(0)).toBe(false);
			expect(Struct.isStruct("test")).toBe(false);
			expect(Struct.isStruct(true)).toBe(false);
		});

		it("should return false for arrays", () => {
			expect(Struct.isStruct([])).toBe(false);
			expect(Struct.isStruct([1, 2, 3])).toBe(false);
		});

		it("should return false for Ref instances", () => {
			const ref = Ref(0);
			expect(Struct.isStruct(ref)).toBe(false);
		});
	});

	describe("instanceof operator", () => {
		it("should support instanceof", () => {
			const struct = Struct({ count: 0 });
			expect(struct instanceof Struct).toBe(true);
		});

		it("should return false for non-Struct objects", () => {
			const obj = { count: 0 };
			expect(obj instanceof Struct).toBe(false);
		});
	});

	describe("static ref method", () => {
		it("should return a Ref for a struct property", () => {
			const struct = Struct({ count: 0 });
			const ref = Struct.ref(struct, "count");
			expect(Ref.isRef(ref)).toBe(true);
		});

		it("should return the same ref instance for repeated calls", () => {
			const struct = Struct({ count: 0 });
			const ref1 = Struct.ref(struct, "count");
			const ref2 = Struct.ref(struct, "count");
			expect(ref1).toBe(ref2);
		});

		it("should return different refs for different properties", () => {
			const struct = Struct({ a: 1, b: 2 });
			const refA = Struct.ref(struct, "a");
			const refB = Struct.ref(struct, "b");
			expect(refA).not.toBe(refB);
		});

		it("should return different refs for different struct instances", () => {
			const struct1 = Struct({ count: 0 });
			const struct2 = Struct({ count: 0 });
			const ref1 = Struct.ref(struct1, "count");
			const ref2 = Struct.ref(struct2, "count");
			expect(ref1).not.toBe(ref2);
		});

		it("should throw for non-struct objects", () => {
			const obj = { count: 0 };
			expect(() => Struct.ref(obj as any, "count")).toThrow();
		});
	});
});
