import type { Struct } from "@/Struct/Struct";
import type { StructConstructor } from "@/Struct/types/StructConstructor";
import { $struct } from "@/common/symbols";

export const isStruct: StructConstructor["isStruct"] = function isStruct<T>(
	object: T
): object is Struct<T> {
	//@ts-expect-error: TypeScript doesn't think T can be indexed with $struct
	return typeof object === "object" && object !== null && object[$struct] !== undefined;
};
