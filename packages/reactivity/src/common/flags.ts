/**
 * Bitwise flags used throughout the Torq reactivity system for efficient state tracking.
 *
 * @internal
 */
export const enum Flags {
	/** Indicates a subscription is active and should receive notifications */
	Enabled = 1 << 0,

	/** Indicates an observable or subscription has been permanently closed/disposed */
	Disposed = 1 << 1,

	/**
	 * Indicates a computed observable needs re-evaluation because its dependencies changed.
	 *
	 * **Critical architectural constraint**: Only computed observables (ComputedRef, BaseEffect)
	 * can have this flag set. Simple refs and structs never become dirty because they hold
	 * immediate values rather than computed ones.
	 *
	 * **Performance guarantee**: Any observable with this flag set is guaranteed to have a
	 * `[$compute]` method, eliminating the need for existence checks in hot paths.
	 *
	 * This flag enables lazy evaluation - computed observables only re-compute when:
	 * 1. They are marked dirty (dependencies changed)
	 * 2. They are actually accessed via `.get()` or have active subscribers
	 */
	Dirty = 1 << 2,

	/** Indicates a computed observable is scheduled for microtask-based re-computation */
	Queued = 1 << 3,

	/** Indicates a ref should not auto-convert object values to reactive structs */
	Shallow = 1 << 4,
}
