import { $flags, $ref, $subscribers, $value, $id } from "@/common/symbols";
import { Observer } from "@/common/types";
import { createObserver } from "@/common/util";
import { Subscription } from "@/common/Subscription";
import { Ref } from "@/Ref";
import { getNextRefId } from "@/common/ref-id";

export class StructRef<T = unknown> implements Ref<T, T> {
	declare [$value]: T;
	declare [$flags]: number;
	declare [$subscribers]: Subscription[];
	declare [$ref]: Ref<T, T>;
	declare [$id]: number;

	constructor(value: T) {
		this[$flags] = 0;
		this[$subscribers] = [];
		this[$ref] = this;
		this[$id] = getNextRefId();
	}

	get disposed(): boolean {
		throw new Error("Method not implemented.");
	}

	get(): T {
		throw new Error("Method not implemented.");
	}

	set(value: T): boolean {
		throw new Error("Method not implemented.");
	}

	subscribe(
		onNextOrObserver: Partial<Observer<T>> | Observer<T>["next"],
		onError?: Observer<T>["error"],
		onComplete?: Observer<T>["complete"]
	): Subscription {
		return Subscription.create(this, createObserver(onNextOrObserver, onError, onComplete));
	}

	[Symbol.observable](): Ref<T, T> {
		return this;
	}

	dispose(): void {
		throw new Error("Method not implemented.");
	}
}
