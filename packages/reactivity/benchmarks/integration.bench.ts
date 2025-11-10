import { bench, describe } from "vitest";
import { Ref, Effect, Scope, Struct } from "@/index";

/**
 * Integration Benchmarks
 *
 * End-to-end benchmarks for realistic application scenarios that combine
 * multiple reactivity primitives. These represent common real-world patterns.
 */

describe("Form State", () => {
	bench("simple login form", () => {
		for (let i = 0; i < 100; i++) {
			const form = Struct({
				email: "",
				password: "",
				remember: false,
			});

			const scope = Scope();
			const isValid = Ref.computed(() => form.email.length > 0 && form.password.length >= 8);

			Effect(
				() => {
					if (isValid.get()) {
						// Validation side effect
					}
				},
				{ scope }
			);

			form.email = `user${i}@example.com`;
			form.password = `password${i}`;
			form.remember = i % 2 === 0;

			const _ = isValid.get();
			scope.dispose();
		}
	});

	bench("multi-field validation", () => {
		for (let i = 0; i < 100; i++) {
			const form = Struct({
				firstName: "",
				lastName: "",
				email: "",
				age: 0,
			});

			const scope = Scope();

			const emailValid = Ref.computed(() => form.email.includes("@"));
			const ageValid = Ref.computed(() => form.age >= 18);
			const isValid = Ref.computed(
				() =>
					emailValid.get() &&
					ageValid.get() &&
					form.firstName.length > 0 &&
					form.lastName.length > 0
			);

			let validationCount = 0;
			Effect(
				() => {
					if (!isValid.get()) validationCount++;
				},
				{ scope }
			);

			form.firstName = `First${i}`;
			form.lastName = `Last${i}`;
			form.email = `user${i}@example.com`;
			form.age = 25;

			scope.dispose();
		}
	});

	bench("form with computed totals", () => {
		for (let i = 0; i < 100; i++) {
			const form = Struct({
				items: 5,
				pricePerItem: 10,
				taxRate: 0.08,
				discount: 0,
			});

			const subtotal = Ref.computed(() => form.items * form.pricePerItem);
			const discountAmount = Ref.computed(() => subtotal.get() * (form.discount / 100));
			const taxableAmount = Ref.computed(() => subtotal.get() - discountAmount.get());
			const tax = Ref.computed(() => taxableAmount.get() * form.taxRate);
			const total = Ref.computed(() => taxableAmount.get() + tax.get());

			form.items = (i % 10) + 1;
			form.pricePerItem = (i % 100) + 10;
			form.discount = i % 20;

			const _ = total.get();
		}
	});
});

describe("Todo List", () => {
	bench("add and filter todos", () => {
		const todos = Ref<Array<{ id: number; text: string; done: boolean }>>([]);
		const filter = Ref<"all" | "active" | "completed">("all");

		const filteredTodos = Ref.computed(() => {
			const list = todos.get();
			const f = filter.get();
			if (f === "all") return list;
			if (f === "active") return list.filter((t) => !t.done);
			return list.filter((t) => t.done);
		});

		for (let i = 0; i < 100; i++) {
			todos.set([...todos.get(), { id: i, text: `Todo ${i}`, done: i % 2 === 0 }]);

			if (i % 10 === 0) {
				filter.set(i % 20 === 0 ? "all" : i % 30 === 0 ? "active" : "completed");
			}

			const _ = filteredTodos.get();
		}
	});

	bench("todo counters", () => {
		const todos = Ref<Array<{ done: boolean }>>([]);

		const totalCount = Ref.computed(() => todos.get().length);
		const activeCount = Ref.computed(() => todos.get().filter((t) => !t.done).length);
		const completedCount = Ref.computed(() => todos.get().filter((t) => t.done).length);

		for (let i = 0; i < 100; i++) {
			todos.set([...todos.get(), { done: i % 3 === 0 }]);

			const _ = totalCount.get() + activeCount.get() + completedCount.get();
		}
	});
});

describe("UI Controls", () => {
	bench("RGB color picker", () => {
		const r = Ref(0);
		const g = Ref(0);
		const b = Ref(0);

		const hex = Ref.computed(() => {
			const toHex = (n: number) => n.toString(16).padStart(2, "0");
			return `#${toHex(r.get())}${toHex(g.get())}${toHex(b.get())}`;
		});

		const luminance = Ref.computed(() => {
			return 0.299 * r.get() + 0.587 * g.get() + 0.114 * b.get();
		});

		const textColor = Ref.computed(() => (luminance.get() > 128 ? "#000000" : "#ffffff"));

		for (let i = 0; i < 100; i++) {
			r.set(i % 256);
			g.set((i * 2) % 256);
			b.set((i * 3) % 256);

			const _ = hex.get() + textColor.get();
		}
	});

	bench("color picker with alpha", () => {
		const color = Struct({
			r: 255,
			g: 0,
			b: 0,
			a: 1.0,
		});

		const rgba = Ref.computed(() => `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`);

		const hex = Ref.computed(() => {
			const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
			const alphaHex = toHex(color.a * 255);
			return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}${alphaHex}`;
		});

		for (let i = 0; i < 100; i++) {
			color.r = i % 256;
			color.g = (i * 2) % 256;
			color.b = (i * 3) % 256;
			color.a = (i % 100) / 100;

			const _ = rgba.get() + hex.get();
		}
	});
});

describe("Data Table", () => {
	bench("sortable table", () => {
		const data = Ref([
			{ id: 1, name: "Alice", age: 30, score: 85 },
			{ id: 2, name: "Bob", age: 25, score: 92 },
			{ id: 3, name: "Charlie", age: 35, score: 78 },
		]);

		const sortBy = Ref<"name" | "age" | "score">("name");
		const sortOrder = Ref<"asc" | "desc">("asc");

		const sortedData = Ref.computed(() => {
			const items = [...data.get()];
			const by = sortBy.get();
			const order = sortOrder.get();

			items.sort((a, b) => {
				const aVal = a[by];
				const bVal = b[by];
				const compare = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
				return order === "asc" ? compare : -compare;
			});

			return items;
		});

		for (let i = 0; i < 100; i++) {
			sortBy.set(i % 3 === 0 ? "name" : i % 3 === 1 ? "age" : "score");
			sortOrder.set(i % 2 === 0 ? "asc" : "desc");
			const _ = sortedData.get();
		}
	});

	bench("filtered and paginated table", () => {
		const data = Ref(
			Array.from({ length: 100 }, (_, i) => ({
				id: i,
				name: `User ${i}`,
				active: i % 2 === 0,
			}))
		);

		const searchQuery = Ref("");
		const showActive = Ref(true);
		const page = Ref(0);
		const pageSize = 10;

		const filtered = Ref.computed(() => {
			let items = data.get();
			const query = searchQuery.get().toLowerCase();

			if (query) {
				items = items.filter((item) => item.name.toLowerCase().includes(query));
			}

			if (showActive.get()) {
				items = items.filter((item) => item.active);
			}

			return items;
		});

		const paginated = Ref.computed(() => {
			const items = filtered.get();
			const start = page.get() * pageSize;
			return items.slice(start, start + pageSize);
		});

		for (let i = 0; i < 100; i++) {
			searchQuery.set(i % 10 === 0 ? `User ${i}` : "");
			showActive.set(i % 5 !== 0);
			page.set(i % 5);
			const _ = paginated.get();
		}
	});
});
