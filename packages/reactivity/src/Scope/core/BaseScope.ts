import { Observable } from "@/common/types";
import { $children, $dependencies, $index, $parent } from "@/common/symbols";
import type { ScopeOptions } from "@/Scope/types";
import { disposeScope, initScope, type Scope } from "@/Scope/Scope";
import { currentScope } from "@/common/current-scope";

/**
 * @internal
 */
export class BaseScope implements Scope {
	declare [$parent]: Scope | null;
	declare [$index]: number;
	declare [$children]: Scope[] | null;
	declare [$dependencies]: Set<Observable> | null;

	constructor(options?: ScopeOptions) {
		initScope(this, options);
		this[$dependencies] = new Set();
	}

	*observables(): IterableIterator<Observable> {
		if (this[$dependencies]) yield* this[$dependencies];
	}

	*scopes(): IterableIterator<Scope> {
		if (this[$children]) yield* this[$children];
	}

	get disposed(): boolean {
		return this[$children] === null;
	}

	observe(observable: Observable): void {
		if (this[$children] === null) return; // Already disposed

		this[$dependencies]!.add(observable);
	}

	dispose(): void {
		if (this[$dependencies] === null) return; // Already disposed

		this[$dependencies] = null;

		disposeScope(this);
	}
}
