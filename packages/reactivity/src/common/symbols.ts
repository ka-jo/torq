import Symbol_observable from "symbol-observable";

export const $observable: typeof Symbol.observable = Symbol_observable as any;
export const $value: unique symbol = Symbol("value");
export const $subscribers: unique symbol = Symbol("subscribers");
export const $subscribersIndex: unique symbol = Symbol("subscribersIndex");
export const $dependenciesIndex: unique symbol = Symbol("dependenciesIndex");
export const $flags: unique symbol = Symbol("flags");
export const $ref: unique symbol = Symbol("ref");
export const $options: unique symbol = Symbol("options");
export const $dependencies: unique symbol = Symbol("dependencies");
export const $compute: unique symbol = Symbol("compute");
export const $observer: unique symbol = Symbol("observer");
export const $store: unique symbol = Symbol("store");
export const $effect: unique symbol = Symbol("effect");
export const $id: unique symbol = Symbol("id");

/**
 * Internal link to a scope's parent. Not part of the public API.
 * Used for lifecycle propagation and ownership checks.
 */
export const $parent: unique symbol = Symbol("parent");

/**
 * Internal list of a scope's immediate children. Not part of the public API.
 * Children are disposed before their parent and cannot be added after dispose.
 */
export const $children: unique symbol = Symbol("children");

/**
 * Internal index of a child scope within its parent's children. Not part of the public API.
 */
export const $index: unique symbol = Symbol("index");
