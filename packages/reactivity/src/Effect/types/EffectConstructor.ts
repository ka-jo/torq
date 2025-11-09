import { EffectOptions } from "@/Effect/types";
import { Effect } from "@/Effect/Effect";
import { Scope } from "@/Scope";

export interface EffectConstructor {
	(fn: (scope: Scope) => void, options?: EffectOptions): Effect;
	new (fn: (scope: Scope) => void, options?: EffectOptions): Effect;
	/**
	 * Type guard to check if a value is an Effect
	 * @param value
	 */
	isEffect(value: unknown): value is Effect;
}
