import { $flags, $struct, $subscribers, $value } from "@/common/symbols";
import { Observable, Observer } from "@/common/types";
import { Subscription } from "@/common/Subscription";
import { createObserver, getPropertyDescriptor, isObject, isSymbol } from "@/common/util";
import type { Struct } from "@/Struct/Struct";
import type { Ref, WritableComputedRefOptions } from "@/Ref";
import { isRef } from "@/Ref/isRef";
import { ComputedRef } from "@/Ref/core/ComputedRef";
import { BaseRef } from "@/Ref/core/BaseRef";
import { currentScope } from "@/common/current-scope";

/**
 * The base struct class enables the creation of a reactive object with automatic ref unwrapping via
 * the Proxy API. The struct instance itself acts as the proxy handler. In reactive contexts, the
 * struct will create refs for each property in the original object and further reads/writes to that
 * property will be delegated to the property ref. This means that over time, the original object's
 * properties will be replaced with refs as needed, so it's important to note that the consumer
 * should not keep references to nor interact with the original object directly. We could
 * technically avoid defining refs on the original object because after a property ref is created,
 * further reads/writes will go through it, but I don't like the idea of a struct's object falling
 * out of sync with the struct's refs.
 *
 * The struct currently keeps a map of refs for each property to act as a hot path in reads/writes:
 * if the property ref already exists, we can skip quite a few conditions (e.g. checking if the
 * property in the original object is a ref, checking if the new value is a ref, etc.)
 *
 * Unlike other "Base" classes, the BaseStruct is a bit different in that the consumer won't
 * directly interact with it. The consumer will interact with a proxy and the struct is created
 * behind the scenes as the handler.
 *
 * @internal
 */
export class BaseStruct<T extends Record<PropertyKey, unknown> = Record<PropertyKey, unknown>>
	implements ProxyHandler<T>, Observable<T>
{
	declare [$flags]: number;
	declare [$value]: T;
	declare [$subscribers]: Subscription[];
	declare [$struct]: BaseStruct<T>;

	declare proxy: Struct<T>;
	declare refs: Record<PropertyKey, Ref>;

	// Because the proxy must be created after the struct, a BaseStruct instance must be created via
	// the static create method, so the constructor is private.
	private constructor(object: T) {
		this[$flags] = 0;
		this[$value] = object;
		this[$subscribers] = [];
		this[$struct] = this;
		Object.defineProperty(object, $struct, {
			value: this,
			enumerable: false,
			configurable: false,
			writable: false,
		});

		this.refs = Object.create(null);
	}

	subscribe(
		onNextOrObserver: Partial<Observer<T>> | Observer<T>["next"],
		onError?: Observer<T>["error"],
		onComplete?: Observer<T>["complete"]
	): Subscription {
		return Subscription.create(this, createObserver(onNextOrObserver, onError, onComplete));
	}

	[Symbol.observable](): Observable<T> {
		return this;
	}

	get(target: T, prop: PropertyKey, receiver: T) {
		if (this.refs[prop]) return this.refs[prop].get();

		if (isSymbol(prop)) return target[prop];

		// If it's a tracking context, we need to ensure that the property ref is initialized
		if (currentScope) return BaseStruct.initPropertyRef(this, prop).get();

		const targetValue = target[prop];
		if (isRef(targetValue)) {
			// If the property used to create the struct is a ref, we'll use it as the property ref
			// to ensure that it remains stable
			this.refs[prop] = targetValue;
			return targetValue.get();
		}

		if (isObject(targetValue)) return BaseStruct.initPropertyRef(this, prop).get();

		return targetValue;
	}

	set(target: T, prop: PropertyKey, value: unknown, receiver: T): boolean {
		if (this.refs[prop]) return this.refs[prop].set(value);

		if (isRef(value)) {
			// We've already established a ref doesn't exist for this property, and if a ref is
			// assigned to a struct, we need to ensure the struct has a property ref to link to it.
			BaseStruct.initPropertyRef(this, prop, value);
			return true;
		}

		const targetValue = target[prop];
		if (isRef(targetValue)) {
			// If the property used to create the struct is a ref, we'll use it as the property ref
			// to ensure that it remains stable
			this.refs[prop] = targetValue;
			return targetValue.set(value);
		}

		return Reflect.set(target, prop, value, receiver);
	}

	static create<T extends Record<PropertyKey, unknown>>(object: T): Struct<T> {
		if (object[$struct]) {
			return (object[$struct] as BaseStruct<T>).proxy;
		}
		const struct = new BaseStruct(object);
		const proxy = new Proxy(object, struct) as Struct<T>;
		struct.proxy = proxy;
		return proxy;
	}

	/**
	 * This function initializes a struct ref for a given struct and property key. This function
	 * assumes that the struct doesn't already have a ref for the property key, so it should only
	 * be called once determined that a struct's ref map doesn't have the property key.
	 *
	 * @param struct
	 * @param prop
	 * @param value - (optional) The value to use for the ref. If not provided, the value will be taken from the struct's value object.
	 * @returns a ref instance for the property key.
	 */
	private static initPropertyRef(struct: BaseStruct, prop: PropertyKey, value?: unknown): Ref {
		const structValue = struct[$value][prop];
		if (isRef(structValue)) {
			struct.refs[prop] = structValue;

			if (arguments.length > 2) structValue.set(value);

			return structValue;
		}

		const descriptor = getPropertyDescriptor(struct[$value], prop);
		if (descriptor && (descriptor.get || descriptor.set)) {
			const ref = new ComputedRef({
				get: descriptor.get?.bind(struct),
				set: descriptor.set?.bind(struct),
			} as WritableComputedRefOptions<unknown>);

			struct[$value][prop] = struct.refs[prop] = ref;

			if (arguments.length > 2) ref.set(value);

			return ref;
		}

		if (arguments.length > 2) {
			return (struct[$value][prop] = struct.refs[prop] = new BaseRef(value, { shallow: false }));
		} else {
			return (struct[$value][prop] = struct.refs[prop] = new BaseRef(structValue, { shallow: false }));
		}
	}
}
