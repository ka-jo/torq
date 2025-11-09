import { Flags } from "@/common/flags";
import {
	$subscribers,
	$options,
	$flags,
	$ref,
	$value,
	$dependencies,
	$observable,
	$compute,
	$observer,
	$parent,
	$children,
	$index,
	$id,
} from "@/common/symbols";
import type { Observable, Observer } from "@/common/types";
import { Subscription } from "@/common/Subscription";
import type { ComputedRefOptions, WritableComputedRefOptions } from "@/Ref/types";
import type { Ref } from "@/Ref/Ref";
import { disposeScope, initScope, SubscriptionScope, type Scope } from "@/Scope/Scope";
import {
	createDependency,
	currentScope,
	dependencyIndex,
	removeDependencies,
	reuseDependency,
	setActiveScope,
} from "@/common/current-scope";
import { createObserver } from "@/common/util";
import { getNextRefId } from "@/common/ref-id";

/** We use this to mark a ref that hasn't been computed yet. */
const INITIAL_VALUE: any = $value;

/**
 * @internal
 */
export class ComputedRef<TGet = unknown, TSet = TGet>
	implements Ref<TGet, TSet>, SubscriptionScope
{
	declare [$subscribers]: Subscription[];
	declare [$dependencies]: Subscription[];
	declare [$flags]: number;
	declare [$value]: TGet;
	declare [$ref]: ComputedRef<TGet, TSet>;
	declare [$options]: ComputedRefOptions<TGet> | WritableComputedRefOptions<TGet, TSet>;
	declare [$observer]: Observer;
	declare [$parent]: Scope | null;
	declare [$children]: Scope[] | null;
	declare [$index]: number;
	declare [$id]: number;

	constructor(options: ComputedRefOptions<TGet> | WritableComputedRefOptions<TGet, TSet>) {
		this[$subscribers] = [];
		this[$dependencies] = [];
		this[$flags] = Flags.Dirty;
		this[$value] = INITIAL_VALUE;
		this[$ref] = this;
		this[$options] = options;
		this[$observer] = ComputedRef.initObserver(this);
		this[$id] = getNextRefId();

		initScope(this, options);

		if (options.signal) {
			if (options.signal.aborted) {
				this[$flags] = Flags.Disposed;
			} else {
				this.dispose = this.dispose.bind(this);
				options.signal.addEventListener("abort", this.dispose);
			}
		}
	}

	get disposed(): boolean {
		return (this[$flags] & Flags.Disposed) !== 0;
	}

	get(): TGet {
		if (this[$flags] & Flags.Disposed) {
			return this[$value] as TGet;
		}

		if (this[$flags] & Flags.Dirty) {
			this[$compute]();
		}

		// We don't want to observe a computed ref until it's been computed
		if (currentScope) {
			currentScope.observe(this);
		}

		return this[$value] as TGet;
	}

	set(value: TSet): boolean {
		if (this[$flags] & Flags.Disposed) return false;

		if (!("set" in this[$options]))
			throw new TypeError("Cannot set a computed ref defined without a setter");

		this[$options].set(value);
		return true;
	}

	subscribe(
		onNextOrObserver: Partial<Observer<TGet>> | Observer<TGet>["next"],
		onError?: Observer<TGet>["error"],
		onComplete?: Observer<TGet>["complete"]
	): Subscription {
		// If the ref hasn't been computed yet, we need to compute the current value
		// in order to notify the subscriber of future values
		if (this[$value] === INITIAL_VALUE && !(this[$flags] & Flags.Disposed))
			try {
				this[$compute]();
			} catch (e) {
				// As much as possible, the compute triggered in this case should be
				// "invisible". The subscriber should be able to think of the ref as
				// already having a value, and they're subscribing to future changes.
				// Only calls to `get` should throw, so we swallow the error here.
			}

		return Subscription.create(this, onNextOrObserver, onError, onComplete);
	}

	[$observable]() {
		return this;
	}

	*observables(): IterableIterator<Observable> {
		if (this[$flags] & Flags.Disposed) return;

		for (const subscription of this[$dependencies]) {
			yield subscription[$observable];
		}
	}

	*scopes(): IterableIterator<Scope> {
		if (this[$children]) yield* this[$children];
	}

	observe(observable: Observable): void {
		if (currentScope !== this || this[$flags] & Flags.Disposed) return;

		const existingDependency = this[$dependencies][dependencyIndex];
		if (existingDependency) {
			if (existingDependency[$observable] === observable) {
				return reuseDependency(existingDependency);
			} else {
				removeDependencies(this, dependencyIndex);
			}
		}
		createDependency(this, observable);
	}

	dispose(): void {
		if (this[$flags] & Flags.Disposed) return;

		disposeScope(this);

		removeDependencies(this);

		Subscription.completeAll(this[$subscribers]);

		this[$flags] |= Flags.Disposed;
		this[$dependencies] = null as any;

		if (this[$options]?.signal) {
			this[$options].signal.removeEventListener("abort", this.dispose);
		}
	}

	[$compute](): void {
		// A ref may have been queued to compute but was computed before the queue was flushed.
		// This would be the case if `get` was called on the ref or a dependency of the ref
		if (!(this[$flags] & Flags.Dirty)) return;

		if (this[$value] !== INITIAL_VALUE && !ComputedRef.hasOutdatedDependenciesAfterCompute(this))
			return;

		const prevScope = currentScope;
		const prevDependencyIndex = dependencyIndex;

		setActiveScope(this);

		try {
			const computedValue = this[$options].get();

			if (this[$dependencies].length > dependencyIndex) {
				// remove any stale dependencies
				removeDependencies(this, dependencyIndex);
			}

			if (!Object.is(computedValue, this[$value])) {
				this[$value] = computedValue;
				Subscription.notifyAll(this[$subscribers], computedValue);
			}

			// Clear flags after computation is complete
			this[$flags] &= ~(Flags.Dirty | Flags.Queued);
		} catch (e) {
			if (e instanceof Error === false) e = new Error(String(e));

			throw e;
		} finally {
			setActiveScope(prevScope, prevDependencyIndex);
		}
	}

	/**
	 * Callback to use when an observable dependency changes.
	 * @param ref - The computed ref to be notified
	 * @returns
	 */
	private static onDependencyChange(ref: ComputedRef<any>): void {
		ComputedRef.onDependencyDirty(ref);

		if (ref[$flags] & Flags.Queued || ref[$subscribers].length === 0) return;

		ref[$flags] |= Flags.Queued;

		queueMicrotask(() => ref[$compute]());
	}

	/**
	 * Callback to use when an observable dependency is marked dirty but hasn't recomputed yet.
	 * We propagate the dirty flag to subscribers but don't queue recomputation since the
	 * dependency's value hasn't actually changed yet.
	 * @param ref - The computed ref to be notified
	 * @returns
	 */
	private static onDependencyDirty(ref: ComputedRef<any>): void {
		// If already dirty, we've already propagated the dirty signal downstream
		if (ref[$flags] & Flags.Dirty) return;

		ref[$flags] |= Flags.Dirty;

		Subscription.dirtyAll(ref[$subscribers]);
	}

	private static initObserver(ref: ComputedRef<any>): Observer {
		return createObserver({
			next: ComputedRef.onDependencyChange.bind(ComputedRef, ref),
			dirty: ComputedRef.onDependencyDirty.bind(ComputedRef, ref),
		});
	}

	/**
	 * Confirms if any dependencies are outdated ensuring that any dirty dependencies are
	 * computed first.
	 * @param ref
	 * @returns true if any of the dependencies are outdated, false otherwise
	 */
	private static hasOutdatedDependenciesAfterCompute(ref: ComputedRef): boolean {
		for (let i = 0, len = ref[$dependencies].length; i < len; i++) {
			const dep = ref[$dependencies][i];
			const observable = dep[$observable];
			// If dependency is dirty, recompute it first (only computable observables can be dirty)
			if (observable[$flags] & Flags.Dirty) observable[$compute]!();

			// Check if observable value has changed since this dependency was created
			if (!Object.is(observable[$value], dep[$value])) return true;
		}
		return false;
	}
}
