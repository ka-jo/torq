import { $struct } from "@/common/symbols";
import { BaseStruct } from "@/Struct/core/BaseStruct";
import { StructConstructor } from "@/Struct/types/StructConstructor";
import { isStruct } from "@/Struct/isStruct";
import { ref } from "@/Struct/ref";

/**
 * @public
 */
export type Struct<T> = T & {
	[$struct]: Struct<T>;
};

/**
 * @public
 */
export const Struct: StructConstructor = Object.defineProperties(
	function Struct<T extends Record<PropertyKey, unknown>>(object: T): Struct<T> {
		return BaseStruct.create(object);
	},
	{
		[Symbol.hasInstance]: {
			value: (object: unknown) => isStruct(object),
			writable: false,
		},
		isStruct: {
			value: isStruct,
			writable: false,
		},
		ref: {
			value: ref,
			writable: false,
		},
	}
) as StructConstructor;
