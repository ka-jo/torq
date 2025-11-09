import type { ScopeOptions, ScopeConstructor } from "@/Scope/types";
import { BaseScope } from "@/Scope/core/BaseScope";
import { isScope } from "@/Scope/isScope";
import { $children, $dependencies, $index, $observer, $parent } from "@/common/symbols";
import { Observable, Observer } from "@/common/types";
import { currentScope } from "@/common/current-scope";
import type { Subscription } from "@/common/Subscription";

/**
 * The `Scope` interface represents a hierarchical context for tracking dependencies. Scopes can be
 * nested, forming a tree structure where each scope can have a parent and multiple children. Scopes
 * are used to manage the lifecycle of dependecies, allowing for automatic cleanup when a scope is
 * disposed.
 * @public
 */
export interface Scope {
	/**
	 * Internal link to the parent scope, or null if detached.
	 * @internal
	 */
	[$parent]: Scope | null;

	/**
	 * Internal list of immediate child scopes. Set to null when the scope is disposed.
	 * @internal
	 */
	[$children]: Array<Scope> | null;

	/**
	 * Internal index within the parent's children array for efficient removal.
	 * @internal
	 */
	[$index]: number;

	/**
	 * Returns true if this scope has been disposed.
	 *
	 * @remarks
	 * Once disposed, a scope cannot be reactivated. Disposed scopes have cleaned up
	 * all dependencies and child scopes.
	 *
	 * @public
	 */
	readonly disposed: boolean;

	/**
	 * Returns an iterator of all observables that have been observed by this scope.
	 * @remarks
	 * Iteration order is not guaranteed and the iterator is live; observables could be added or
	 * removed during iteration. If you need a stable snapshot, use `Array.from(scope.observables())`.
	 * @public
	 */
	observables(): IterableIterator<Observable>;

	/**
	 * Returns an iterator of all child scopes.
	 * @remarks
	 * Iteration order is not guaranteed and the iterator is live; children could be added or
	 * removed during iteration. If you need a stable snapshot, use `Array.from(scope.scopes())`.
	 * @public
	 */
	scopes(): IterableIterator<Scope>;

	/** Dispose this scope and all of its descendants. Idempotent. */
	dispose(): void;

	/**
	 * Observe an observable value within the scope's current collection window. No-op if
	 * the scope isn't actively collecting dependencies.
	 */
	observe(observable: Observable): void;
}

/**
 * The `SubscriptionScope` interface is an internal extension of the `Scope` interface that is used
 * to manage subscriptions to observables. It includes additional properties for tracking active
 * subscriptions and the observer used for subscribing to observables.
 * @internal
 */
export interface SubscriptionScope extends Scope {
	/**
	 * The active subscriptions to this scope's observables
	 */
	[$dependencies]: Array<Subscription>;

	/**
	 * The observer used to subscribe to this scope's observables
	 */
	[$observer]: Observer;
}

/**
 * @public
 */
export const Scope: ScopeConstructor = Object.defineProperties(
	function Scope(options?: ScopeOptions) {
		return new BaseScope(options);
	},
	{
		[Symbol.hasInstance]: {
			value: isScope,
			writable: false,
		},
		isScope: {
			value: isScope,
			writable: false,
		},
	}
) as any;

/**
 * Intializes a scope instance, setting the parent, index, and children properties.
 * This will add the scope to the children of the specified parent scope, or the current scope if
 * none is specified.
 * @param scope
 * @param options
 * @internal
 */
export function initScope(scope: Scope, options?: ScopeOptions): void {
	const parent = options?.scope ?? currentScope;
	if (parent) {
		const parentChildren = parent[$children];
		if (parentChildren === null) {
			throw new Error("Cannot add scope to disposed parent");
		}
		scope[$parent] = parent;
		scope[$index] = parentChildren.length;
		parentChildren.push(scope);
	} else {
		scope[$parent] = null;
	}
	scope[$children] = [];
}

/**
 * Disposes a scope and all of its descendants, removing it from its parent if applicable.
 * This function is not idempotent so callers should ensure the scope hasn't already been disposed.
 * @param scope
 * @internal
 */
export function disposeScope(scope: Scope): void {
	const children = scope[$children]!;
	scope[$children] = null;

	for (let i = 0, len = children.length; i < len; i++) {
		children[i].dispose();
	}

	const parent = scope[$parent];
	scope[$parent] = null;
	if (parent) {
		const parentChildren = parent[$children];
		if (parentChildren) {
			const index = scope[$index];
			const lastChild = parentChildren[parentChildren.length - 1];
			parentChildren[index] = lastChild;
			lastChild[$index] = index;
			parentChildren.pop();
		}
	}
}
