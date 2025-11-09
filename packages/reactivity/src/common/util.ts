import type { Observer } from "@/common/types";
import { $observer } from "@/common/symbols";

export const NO_OP = function noop() {};

export const EMPTY_ITERATOR: IterableIterator<any> = {
	next: () => ({ value: undefined, done: true }),
	[Symbol.iterator]() {
		return this;
	},
};

export function createObserver<T>(
	onNextOrObserver: Observer<T>["next"] | Partial<Observer<T>>,
	onError?: Observer<T>["error"],
	onComplete?: Observer<T>["complete"]
): Observer<T> {
	//@ts-expect-error: we use the symbol to cache the resolved observer on the first argument
	// itself. This means that given the same function or observer object, we will always
	// return the same resolved observer. Typescript doesn't like us trying to add a new symbol
	// that it's unaware of though, so we need to use `@ts-expect-error` here.
	let observer: Observer<T> = onNextOrObserver[$observer];

	if (observer) return observer;

	if (typeof onNextOrObserver === "function") {
		observer = {
			next: onNextOrObserver,
			error: onError || NO_OP,
			complete: onComplete || NO_OP,
			dirty: NO_OP,
		};
	} else {
		observer = {
			next: onNextOrObserver.next || NO_OP,
			error: onNextOrObserver.error || NO_OP,
			complete: onNextOrObserver.complete || NO_OP,
			dirty: onNextOrObserver.dirty || NO_OP,
		};
	}
	//@ts-expect-error
	observer[$observer] = observer;
	//@ts-expect-error
	return (onNextOrObserver[$observer] = observer);
}

export function isObject(value: unknown): value is Record<PropertyKey, unknown> {
	return typeof value === "object" && value !== null;
}

export function isSymbol(value: unknown): value is symbol {
	return typeof value === "symbol";
}

/**
 * This function retrieves the property descriptor for a given property on an object, including
 * properties inherited from the prototype chain. It traverses up the prototype chain until it
 * finds the property or reaches the end of the chain in which case it returns `undefined`.
 *
 * @param obj - The object to search for the property descriptor.
 * @param prop - The property key to look for in the object.
 * @returns a `PropertyDescriptor` if found for the given prop, otherwise `undefined`.
 *
 * @privateRemarks
 * The original motivation for this function was to enable inheritance of getters/setters in
 * structs
 */
export function getPropertyDescriptor(
	obj: object,
	prop: PropertyKey
): PropertyDescriptor | undefined {
	while (obj) {
		const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
		if (descriptor) return descriptor;
		obj = Object.getPrototypeOf(obj);
	}
	return undefined;
}
