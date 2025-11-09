import { RefOptions, RefConstructor } from "@/Ref/types";
import { BaseRef } from "@/Ref/core/BaseRef";
import { isRef } from "@/Ref/isRef";
import { computed } from "@/Ref/computed";
import type { Observable, Observer } from "@/common/types";
import type { Subscription } from "@/common/Subscription";
import { $flags, $subscribers, $ref, $id } from "@/common/symbols";

/**
 * The `Ref` interface is the core reactive object in Mora. A ref instance holds a value
 * and allows you to subscribe to changes to that value. Accessing a ref's value will
 * register it as a dependency in the current tracking context if one exists. Setting a
 * ref's value will notify all subscribers of the change and trigger any dependent
 * computations or effects.
 *
 * @privateRemarks
 * Though the `Ref` interface is modeled after the TC39 Signals proposal, we opted to
 * use the term "ref" for a few reasons that we acknowledge are largely author preference:
 * - Ref is already an established term in the language itself (see {@link WeakRef})
 * - Mora refs have more functionality than the Signal described in the proposal; they
 *   come with a built-in subscription model based on the TC39 Observable proposal
 * - We believe first and foremost that — to the consumer — this primitive is a value and
 *   reactivity is an emergent behavior of the value, not the sole purpose of it
 * - "Signal" puts an overt focus on the concept of notifying downstream dependencies, but
 *   in the proposal, the subscription mechanism is hidden from the consumer, so why do
 *   they care to think about it this way?
 *
 * The term "signal" may have a place in the mental model of library authors, but as a means
 * of notifying subscribers, we believe "observable" fits into the mental model of the
 * consumer better. To this end, Mora's refs can be thought of as the union of "signals" and
 * "observables" packaged with the consumer in mind.
 *
 * @public
 */
export interface Ref<TGet = unknown, TSet = TGet> extends Observable<TGet> {
	/**
	 * The state of any flags that are set on the ref. Refer to {@link Flags} for possible
	 * states tracked with this field.
	 *
	 * @internal
	 */
	[$flags]: number;

	/**
	 * The active subscriptions to this ref
	 *
	 * @internal
	 */
	/**
	 * @internal
	 */
	[$subscribers]: Subscription[];

	/**
	 * The ref symbol is used internally to identify ref instances. It is not intended
	 * to be used by consumers but is included here to act as a type brand.
	 *
	 * @internal
	 */
	[$ref]: Ref<TGet, TSet>;

	/**
	 * A unique numeric identifier for this ref instance, useful for debugging.
	 *
	 * @internal
	 */
	[$id]: number;

	/**
	 * Returns true if this ref has been disposed and will no longer notify subscribers
	 * or accept new subscriptions.
	 *
	 * @remarks
	 * Once disposed, a ref cannot be reactivated. Operations on disposed refs are safe
	 * but have no effect - reads return the last value, and writes are silently ignored.
	 *
	 * @public
	 */
	readonly disposed: boolean;

	/**
	 * This method technically exists on the instance of the ref itself because it makes
	 * it easier for different Ref implementations to implement their own dispose method,
	 * but I don't think we want disposing to be at the top of a consumer's mind when
	 * interacting with a ref, so we marking it as internal to prevent exposing it in the
	 * public API. Instead, a consumer should use the dispose method on the Ref namespace.
	 *
	 * In the future, we may want to make this a symbol property to make it less visible
	 * at runtime, but for the time being, we are leaving it as a regular method.
	 *
	 * @internal
	 */
	dispose(): void;

	/**
	 * Returns the current value of the ref. Calling this method will register the
	 * ref as a dependency in the current tracking context if one exists.
	 *
	 * @public
	 */
	get(): TGet;

	/**
	 * Sets the current value of the ref. Calling this method will notify all
	 * subscribers of the change.
	 *
	 * @param value - The new value to set
	 * @returns true if the value could be set, false otherwise (e.g. if the ref is readonly)
	 *
	 * @public
	 */
	set(value: TSet | Ref<TGet>): boolean;

	/**
	 * Subscribes to the ref, allowing the subscriber to be notified of changes to
	 * the value, errors, and/or when the ref is completed.
	 *
	 * @param observer - an {@link Observer} object with callbacks for `next`, `error`, and/or `complete`.
	 * @returns a {@link Subscription} object that can be used to manage the subscription.
	 *
	 * @public
	 */
	subscribe(observer: Partial<Observer<TGet>>): Subscription;

	/**
	 * Subscribes to the ref, allowing the subscriber to be notified of changes to
	 * the value, errors, and/or when the ref is completed.
	 *
	 * @param onNext - the function to be called when the ref value changes.
	 * @param onError - (optional) the function to be called when an error occurs.
	 * @param onComplete - (optional) the function to be called when the ref is completed.
	 *
	 * @public
	 */
	subscribe(
		onNext: Observer<TGet>["next"],
		onError?: Observer<TGet>["error"],
		onComplete?: Observer<TGet>["complete"]
	): Subscription;

	/**
	 * A function that returns the ref instance itself. This is required when
	 * implementing custom observables to ensure interop with other observable libraries.
	 *
	 * @public
	 */
	[Symbol.observable](): Ref<TGet, TSet>;
}

/**
 * @public
 */
export const Ref: RefConstructor = Object.defineProperties(
	function Ref<T>(value?: T, options?: RefOptions) {
		return new BaseRef(value, options);
	},
	{
		[Symbol.hasInstance]: {
			value: (instance: unknown): boolean => isRef(instance),
			writable: false,
		},
		isRef: {
			value: isRef,
			writable: false,
		},
		computed: {
			value: computed,
			writable: false,
		},
	}
) as any;
