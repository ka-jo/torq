import { $struct } from "@/common/symbols";
import type { Ref } from "@/Ref";
import type { Struct } from "@/Struct/Struct";
import { BaseStruct } from "@/Struct/core/BaseStruct";

/**
 * Returns a stable reference to a property of a struct. The returned ref is the same ref that
 * backs the property within the struct, ensuring consistency between direct property access and
 * ref-based access.
 *
 * @param struct - The struct to get the property ref from
 * @param key - The property key to get the ref for
 * @returns A ref for the specified property
 *
 * @example
 * ```ts
 * const user = Struct({ name: 'Alice', age: 30 });
 * const nameRef = Struct.ref(user, 'name');
 *
 * nameRef.get(); // 'Alice'
 * nameRef.set('Bob');
 * console.log(user.name); // 'Bob'
 * ```
 *
 * @public
 */
export function ref<T extends Record<PropertyKey, unknown>, K extends keyof T>(
	struct: Struct<T>,
	key: K
): Ref<T[K]> {
	// Get the BaseStruct handler from the original object
	const object = struct as T;
	const handler = object[$struct] as BaseStruct<T> | undefined;

	if (!handler) {
		throw new Error("Provided value is not a struct");
	}

	let ref = handler.refs[key];
	if (!ref) {
		ref = BaseStruct.initPropertyRef(handler, key);
	}

	return ref as Ref<T[K]>;
}
