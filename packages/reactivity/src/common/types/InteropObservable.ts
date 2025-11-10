import type { Observer } from "@/common/types/Observer";
import type { Subscription } from "@/common/Subscription";

/**
 * Observable interface for interoperability with TC39-compliant reactive libraries.
 *
 /**
 * This interface represents the minimal contract for observables that Sheen can
 * interoperate with. All TC39-compliant observables (including RxJS) implement
 * both subscribe() and Symbol.observable.
 *
 * @public
 */
export interface InteropObservable<T = unknown> {
	subscribe(observer: Partial<Observer<T>>): Subscription;
	subscribe(
		onNext: Observer<T>["next"],
		onError?: Observer<T>["error"],
		onComplete?: Observer<T>["complete"]
	): Subscription;
	[Symbol.observable](): InteropObservable<T>;
}
