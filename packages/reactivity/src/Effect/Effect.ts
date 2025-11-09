import { BaseEffect } from "@/Effect/core/BaseEffect";
import { EffectConstructor, EffectOptions } from "@/Effect/types";
import { isEffect } from "@/Effect/isEffect";
import { Scope } from "@/Scope";

export interface Effect extends Scope {
	/**
	 * Denotes if the effect will run in response to changes in dependencies.
	 * If true, the effect will trigger anytime a dependency changes.
	 * If false, the effect will only run when explicitly called with {@link EffectInstance.run | run}.
	 */
	readonly enabled: boolean;
	/**
	 * Returns true if this effect has been disposed and will no longer run.
	 *
	 * @remarks
	 * Once disposed, an effect cannot be reactivated. Disposed effects clean up
	 * all dependencies and subscriptions.
	 *
	 * @public
	 */
	readonly disposed: boolean;
	/**
	 * Allows the effect to automatically run in response to changes in dependencies.
	 */
	enable(): void;
	/**
	 * Prevents the effect from automatically running in response to changes in dependencies.
	 */
	disable(): void;
	/**
	 * Manually trigger the effect to run.
	 * @remarks
	 * Running the effect in this manner bypasses any dependency tracking and
	 * calls the function passed to the effect directly.
	 * @param scope - A reference to the active scope (the effect itself)
	 */
	run(scope: Scope): void;
}

export const Effect: EffectConstructor = Object.defineProperties(
	function Effect(fn: (scope: Scope) => void, options?: EffectOptions) {
		return new BaseEffect(fn, options);
	},
	{
		[Symbol.hasInstance]: {
			value: isEffect,
			writable: false,
		},
		isEffect: {
			value: isEffect,
			writable: false,
		},
	}
) as any;
