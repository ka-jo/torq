import type { Observable, Observer } from "@/common/types";
import {
	$flags,
	$subscribersIndex,
	$dependenciesIndex,
	$observable,
	$observer,
	$subscribers,
	$value,
} from "@/common/symbols";
import { Flags } from "@/common/flags";
import { createObserver, NO_OP } from "@/common/util";

/**
 * A subscription implementation intended to be used to manage subscriptions for any
 * Observables in Mora (i.e. Refs and Structs).
 *
 * This class provides fine-grained control over subscription lifecycle, allowing
 * subscriptions to be enabled/disabled without full disposal. When disabled, the
 * subscription is removed from the observable's notification list for optimal
 * performance, but can be re-enabled and added back to the list.
 *
 * Additionally, subscriptions can act as dependency trackers for reactive computations,
 * storing snapshot values for change detection and maintaining position in dependency arrays.
 *
 * @public
 */
export class Subscription {
	/** @internal Bitwise flags for tracking subscription state */
	declare [$flags]: number;

	/** @internal Reference to the source observable */
	declare [$observable]: Observable;

	/** @internal Observer that receives notifications */
	declare [$observer]: Observer;

	/** @internal Index position in the observable's subscribers array */
	declare [$subscribersIndex]: number;

	/** @internal Index position in the dependant's dependencies array (for reactive tracking) */
	declare [$dependenciesIndex]: number;

	/** @internal Snapshot value for change detection in reactive computations */
	declare [$value]?: unknown;

	/**
	 * Creates a new subscription, adding an observable to the subscriber's array for an observable.
	 *
	 * @internal
	 *
	 * @param observable - The observable source to subscribe to
	 * @param observer - The observer that will receive notifications
	 * @param dependencyIndex - Index in the dependencies array, or -1 if not tracked
	 */
	private constructor(
		observable: Observable,
		observer: Observer<unknown>,
		subscriberIndex: number,
		dependencyIndex: number
	) {
		this[$flags] = Flags.Enabled;
		this[$observable] = observable;
		this[$observer] = observer;
		this[$subscribersIndex] = subscriberIndex;
		this[$dependenciesIndex] = dependencyIndex;
		this[$value] = observable[$value];
	}

	/**
	 * Whether this subscription has been permanently closed via `unsubscribe()`.
	 *
	 * @remarks
	 * Once closed, a subscription cannot be reopened. This is different from
	 * disabled subscriptions, which can be re-enabled.
	 */
	get closed(): boolean {
		return (this[$flags] & Flags.Disposed) === Flags.Disposed;
	}

	/**
	 * Whether this subscription is currently enabled and receiving notifications.
	 *
	 * @remarks
	 * Disabled subscriptions remain valid but are temporarily removed from the
	 * observable's notification list until re-enabled.
	 */
	get enabled(): boolean {
		return (this[$flags] & Flags.Enabled) === Flags.Enabled;
	}

	/**
	 * Permanently closes this subscription and removes it from the observable's
	 * notification list.
	 *
	 * @remarks
	 * After calling `unsubscribe()`, this subscription cannot be re-enabled.
	 * The subscription will be marked as closed and all internal references
	 * will be cleaned up to prevent memory leaks.
	 *
	 * Calling `unsubscribe()` multiple times is safe and will be ignored.
	 */
	unsubscribe(): void {
		if (this[$flags] & Flags.Disposed) return;

		const subscribers = this[$observable][$subscribers];
		const index = this[$subscribersIndex];

		// Pop and swap to remove this subscription from the array
		const lastSubscription = subscribers.pop()!;
		if (lastSubscription !== this) {
			subscribers[index] = lastSubscription;
			lastSubscription[$subscribersIndex] = index;
		}

		Subscription.cleanup(this);
	}

	/**
	 * Enables this subscription to receive notifications from the observable.
	 *
	 * @remarks
	 * When a disabled subscription is enabled, it is added back to the
	 * observable's notification list.
	 * If the subscription is already enabled, this method does nothing.
	 *
	 * **Timing Behavior**: Enabling a subscription during an active notification
	 * cycle will not cause it to receive the current notification - it will only
	 * receive subsequent notifications.
	 */
	enable(): void {
		if (this[$flags] & (Flags.Enabled | Flags.Disposed)) return;

		this[$flags] |= Flags.Enabled;

		const subscribers = this[$observable][$subscribers];
		this[$subscribersIndex] = subscribers.length;
		subscribers.push(this);
	}

	/**
	 * Disables this subscription, temporarily stopping it from receiving notifications.
	 *
	 * @remarks
	 * When a subscription is disabled, it is removed from the observable's
	 * notification list.
	 * If the subscription is already disabled, this method does nothing.
	 *
	 * Unlike `unsubscribe()`, disabled subscriptions can be re-enabled later
	 * using `enable()`.
	 *
	 * **Timing Behavior**: Unlike `enable()`, which always takes effect in the next
	 * notification cycle, `disable()` takes effect immediately. When called during
	 * an active notification cycle, it may or may not affect the current cycle
	 * depending on iteration order.
	 */
	disable(): void {
		if (!(this[$flags] & Flags.Enabled) || this[$flags] & Flags.Disposed) return;

		this[$flags] &= ~Flags.Enabled;

		const subscribers = this[$observable][$subscribers];
		const index = this[$subscribersIndex];

		// Pop and swap to remove this subscription from the array
		const lastSubscription = subscribers.pop()!;
		if (lastSubscription !== this) {
			subscribers[index] = lastSubscription;
			lastSubscription[$subscribersIndex] = index;
		}
	}

	/** @internal Singleton representing a permanently closed subscription */
	private static readonly CLOSED_SUBSCRIPTION: Subscription = Object.freeze({
		[$flags]: Flags.Disposed,
		unsubscribe: NO_OP,
		enable: NO_OP,
		disable: NO_OP,
		closed: true,
		enabled: false,
	}) as Subscription;

	static create(
		observable: Observable,
		onNextOrObserver: Partial<Observer> | Observer["next"],
		onError?: Observer["error"],
		onComplete?: Observer["complete"],
		dependencyIndex: number = -1
	): Subscription {
		const observer = createObserver(onNextOrObserver, onError, onComplete);
		if (observable[$flags] & Flags.Disposed) {
			observer.complete();
			return Subscription.CLOSED_SUBSCRIPTION;
		}
		const subscribers = observable[$subscribers];
		const subscription = new Subscription(
			observable,
			observer,
			subscribers.length,
			dependencyIndex
		);
		subscribers.push(subscription);
		return subscription;
	}

	/**
	 * Cleans up a subscription's internal state to prevent memory leaks.
	 *
	 * @internal
	 * This method is called when a subscription is permanently closed via
	 * `unsubscribe()`. It marks the subscription as aborted and nulls out
	 * all references to allow garbage collection.
	 *
	 * @param subscription - The subscription to clean up
	 */
	static cleanup(subscription: Subscription) {
		subscription[$flags] = Flags.Disposed;
		subscription[$observable] = null as any;
		subscription[$observer] = null as any;
		subscription[$subscribersIndex] = -1;
		subscription[$dependenciesIndex] = -1;
		subscription[$value] = null;
	}

	/**
	 * Notifies all subscriptions in an array with a new value.
	 *
	 * @internal
	 * This static method provides efficient broadcasting by iterating directly
	 * through the subscription array.
	 *
	 * @param subscribers - The array of subscriptions
	 * @param value - The value to broadcast to all subscribers
	 */
	static notifyAll<T>(subscribers: Subscription[], value: T): void {
		const length = subscribers.length;
		for (let i = 0; i < length; i++) {
			subscribers[i][$observer].next(value);
		}
	}

	/**
	 * Notifies all subscriptions in an array of an error.
	 *
	 * @internal
	 * @param subscribers - The array of subscriptions
	 * @param error - The error to broadcast to all subscribers
	 */
	static errorAll(subscribers: Subscription[], error: Error): void {
		const length = subscribers.length;
		for (let i = 0; i < length; i++) {
			subscribers[i][$observer].error(error);
		}
	}

	/**
	 * Notifies all subscriptions that the observable is complete and cleans them up.
	 *
	 * @internal
	 * @param subscribers - The array of subscriptions
	 */
	static completeAll(subscribers: Subscription[]): void {
		const length = subscribers.length;
		for (let i = 0; i < length; i++) {
			const subscription = subscribers[i];
			subscription[$flags] = Flags.Disposed;
			subscription[$observer].complete();
			subscription[$observable] = null as any;
			subscription[$observer] = null as any;
			subscription[$subscribersIndex] = -1;
		}
		subscribers.length = 0;
	}

	/**
	 * Notifies all subscriptions that their dependencies are dirty.
	 *
	 * @internal
	 * @param subscribers - The array of subscriptions
	 */
	static dirtyAll(subscribers: Subscription[]): void {
		const length = subscribers.length;
		for (let i = 0; i < length; i++) {
			subscribers[i][$observer].dirty();
		}
	}
}
