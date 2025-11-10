import type { Observer } from "@/common/types";
import type { Subscription } from "@/common/Subscription";
import { $compute, $flags, $subscribers, $value } from "@/common/symbols";

/**
 * @privateRemarks
 * Sheen uses the Observable as the core primitive for its reactive philosophy internally.
 * Externally, this will be represented as a Ref, but internally, the Observable is the
 * primitive that is common to all features/namespaces.
 *
 * Sheen's philosophy is that the chief concern of reactivity is the ability to subscribe
 * to data — not necessarily the means of retrieving and updating it.
 *
 * Sheen's Observable is meant to mirror the TC39 proposal and the larger Observable
 * ecosystem as a whole, but due to the fact that Refs are the only observable type in
 * Sheen and are a much more focused use case, there are some notable divergences:
 * - Sheen has no concept of "unicast" observables; Refs are multicast by design
 * - Sheen has no concept of "hot" or "cold" observables; Refs are hot by design
 * - The `error` callback can be called multiple times; just because a Ref encounters an
 *   error doesn't mean it can't recover or that it stops existing
 * - All Observables in Sheen produce values and some Observables must be computed to get the
 *   most recent value
 * - Observers subscribe to *future* values, not current values
 *
 * This Observable type is meant to model how Observables are used internally in Sheen,
 * not necessarily how Observables are used by the ecosystem as a whole.
 *
 * @public
 */
export interface Observable<T = unknown> {
	subscribe(observer: Partial<Observer<T>>): Subscription;
	subscribe(
		onNext: Observer<T>["next"],
		onError?: Observer<T>["error"],
		onComplete?: Observer<T>["complete"]
	): Subscription;
	[Symbol.observable](): Observable<T>;
	/**
	 * @internal
	 */
	[$value]: T;
	/**
	 * @internal
	 */
	[$subscribers]: Subscription[];
	/**
	 * @internal
	 */
	[$flags]: number;
	/**
	 * @internal
	 */
	[$compute]?: () => void;
}
