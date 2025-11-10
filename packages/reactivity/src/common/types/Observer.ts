import { Observable } from "@/common/types/Observable";
import { $observer } from "../symbols";

/**
 * The Observer interface defines the structure of an object used to subscribe to an
 * {@link Observable}.
 *
 * @public
 */
export interface Observer<T = unknown> {
	/**
	 * Callback to use when the observable emits a new value.
	 *
	 * @param value - The value emitted by the observable.
	 */
	next(value: T): void;
	/**
     * Callback to use when the observable encounters an error.
     * 
     * @param err - The error that occurred.
     * 
     * @remarks
     * Unlike other observable implementations, this callback can be called multiple times.
     * The error parameter is ensured to be an instance of Error; it coerces any non-error value
     * into a string and then passes the stringified value to the Error constructor.

     * @privateRemarks
     * Currently, only computed refs will trigger this callback
     */
	error(err: Error): void;
	/**
	 * Callback to use when the observable is complete.
	 *
	 * @privateRemarks
	 * Disposing Refs will trigger this callback and is currently the only way to complete an
	 * observable in Sheen
	 */
	complete(): void;
	/**
	 * Callback to use when the observable is dirty. This would be the case when a dependency of
	 * a computed ref is updated before it is re-evaluated.
	 *
	 * @privateRemarks
	 * This is not a standard part of the observer interface, but instead of inventing another
	 * means of notifying subscribers of a dirty observable, we've extended the observer to
	 * include this hook.
	 *
	 * @internal	 */
	dirty(): void;
}
