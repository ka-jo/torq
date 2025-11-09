import type { Struct } from "@/Struct/Struct";

export type StructConstructor = {
	new <T extends object>(object: T): Struct<T>;
	<T extends object>(object: T): Struct<T>;

	isStruct<T>(object: T): object is Struct<T>;
};
