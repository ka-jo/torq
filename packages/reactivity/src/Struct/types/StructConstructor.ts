import type { Ref } from "@/Ref";
import type { Struct } from "@/Struct/Struct";

export type StructConstructor = {
	/**
	 * Creates a new struct from an object, enabling reactive property access with automatic ref
	 * unwrapping. Can be called with or without `new`.
	 */
	new <T extends object>(object: T): Struct<T>;
	/**
	 * Creates a new struct from an object, enabling reactive property access with automatic ref
	 * unwrapping. Can be called with or without `new`.
	 */
	<T extends object>(object: T): Struct<T>;

	/**
	 * Type guard to check if a value is a struct.
	 */
	isStruct<T>(object: T): object is Struct<T>;

	/**
	 * Returns a stable reference to a property of a struct. The returned ref is the same ref that
	 * backs the property within the struct, ensuring consistency between direct property access
	 * and ref-based access.
	 */
	ref<T extends Record<PropertyKey, unknown>, K extends keyof T>(
		struct: Struct<T>,
		key: K
	): Ref<T[K]>;
};
