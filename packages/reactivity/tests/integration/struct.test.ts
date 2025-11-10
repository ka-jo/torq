import { Struct, Ref } from "@sheen/reactivity";
import { flushMicrotasks } from "../fixtures/util";

describe("Struct", () => {
	it("should return a struct", () => {
		const struct = Struct({ count: 0 });
		expect(Struct.isStruct(struct)).toBe(true);
	});

	it("should initialize primitive values", () => {
		const struct = Struct({ count: 0, name: "test" });
		expect(struct).toEqual({ count: 0, name: "test" });
	});

	it("should initialize primitive refs as primitives", () => {
		const struct = Struct({ count: Ref(0), name: Ref("test") });
		expect(struct).toEqual({ count: 0, name: "test" });
	});

	it("should support getters", () => {
		const struct = Struct({
			firstName: "Rick",
			lastName: "Sanchez",
			get fullName() {
				return `${this.firstName} ${this.lastName}`;
			},
		});

		expect(struct.fullName).toBe("Rick Sanchez");

		struct.firstName = "Morty";
		struct.lastName = "Smith";

		expect(struct.fullName).toBe("Morty Smith");
	});

	it("should support getters with setters", () => {
		const struct = Struct({
			firstName: "Rick",
			lastName: "Sanchez",
			get fullName() {
				return `${this.firstName} ${this.lastName}`;
			},
			set fullName(value: string) {
				const [firstName, lastName] = value.split(" ");
				this.firstName = firstName;
				this.lastName = lastName;
			},
		});

		expect(struct.fullName).toBe("Rick Sanchez");

		struct.fullName = "Morty Smith";

		expect(struct.firstName).toBe("Morty");
		expect(struct.lastName).toBe("Smith");
		expect(struct.fullName).toBe("Morty Smith");
	});

	it("should support setters with no getter", () => {
		const struct = Struct({
			count: 0,
			set increment(value: number) {
				this.count += value;
			},
		});

		expect(struct.count).toBe(0);

		struct.increment = 5;

		expect(struct.count).toBe(5);

		struct.increment = 3;

		expect(struct.count).toBe(8);
	});

	it("should support getter/setter on prototype", () => {
		class Parent {
			constructor(public firstName: string, public lastName: string) {}

			get fullName() {
				return `${this.firstName} ${this.lastName}`;
			}

			set fullName(value: string) {
				const [firstName, lastName] = value.split(" ");
				this.firstName = firstName;
				this.lastName = lastName;
			}
		}

		class Child extends Parent {}

		const struct = Struct(new Child("Rick", "Sanchez"));

		expect(struct.fullName).toBe("Rick Sanchez");

		struct.fullName = "Morty Smith";

		expect(struct.firstName).toBe("Morty");
		expect(struct.lastName).toBe("Smith");
	});

	describe("assigning a ref to a struct property", () => {
		it("should unwrap the ref", () => {
			const struct = Struct({ count: 0 });
			//@ts-expect-error: unfortunately, TypeScript doesn't allow creating mapped setters, so
			// the struct type only allows setting the raw values, not refs
			struct.count = Ref(5);

			expect(struct.count).toBe(5);
		});

		it("should update when the ref updates", () => {
			const struct = Struct({ count: 0 });
			const countRef = Ref(0);
			//@ts-expect-error
			struct.count = countRef;

			countRef.set(5);

			expect(struct.count).toBe(5);
		});

		describe("assigning to that struct property again", () => {
			it("should not update the ref", () => {
				const struct = Struct({ count: 0 });
				const countRef = Ref(0);
				//@ts-expect-error
				struct.count = countRef;
				struct.count = 5;
				expect(countRef.get()).toBe(0);
				expect(struct.count).toBe(5);
			});

			it("should not update the struct property when the ref updates", () => {
				const struct = Struct({ count: 0 });
				const countRef = Ref(1);
				//@ts-expect-error
				struct.count = countRef;

				expect(struct.count).toBe(1);

				struct.count = 5;
				countRef.set(10);

				expect(countRef.get()).toBe(10);
				expect(struct.count).toBe(5);
			});
		});
	});

	describe("reactivity", () => {
		test("computed from struct", () => {
			const struct = Struct({ firstName: "Rick", lastName: "Sanchez" });
			const fullName = Ref.computed(() => `${struct.firstName} ${struct.lastName}`);

			expect(fullName.get()).toBe("Rick Sanchez");

			struct.firstName = "Morty";
			struct.lastName = "Smith";

			expect(fullName.get()).toBe("Morty Smith");
		});
	});

	describe("deep reactivity", () => {
		it("should return nested objects as structs", () => {
			const struct = Struct({
				user: {
					name: "Rick",
					age: 70,
				},
			});

			expect(struct.user).toEqual({
				name: "Rick",
				age: 70,
			});

			expect(Struct.isStruct(struct.user)).toBe(true);
		});

		test("computed from nested struct", () => {
			const struct = Struct({
				user: {
					firstName: "Rick",
					lastName: "Sanchez",
				},
			});

			const fullName = Ref.computed(() => `${struct.user.firstName} ${struct.user.lastName}`);
			expect(fullName.get()).toBe("Rick Sanchez");

			struct.user.firstName = "Morty";
			struct.user.lastName = "Smith";
			expect(fullName.get()).toBe("Morty Smith");
		});
	});
});
