# Torq Reactivity

A fine-grained reactivity system built for JavaScript. Torq provides signal-based primitives that aim to feel native to the language while delivering precise, efficient reactive updates.

## Features

- **Fine-grained reactivity** - Track dependencies at the property level for minimal re-computation
- **Built on Observables** - Reactive primitives are observables compliant with the TC39 Observable proposal
- **Lazy by default** - Computed values only evaluate when accessed or observed
- **Automatic cleanup** - Scopes automatically dispose child effects and dependencies
- **Batched updates** - Effects batch multiple synchronous changes into a single run
- **Lifecycle control** - Dispose refs, effects, and scopes manually or via `AbortSignal`

## Installation

```bash
npm install @torq-js/reactivity
```

## Quick Start

### Refs - Reactive Values

Refs are reactive containers for values that implement the Observable protocol. Read with `.get()`, write with `.set()`, and subscribe to changes.

```javascript
import { Ref } from '@torq-js/reactivity';

const count = Ref(0);

console.log(count.get()); // 0

count.set(5);
console.log(count.get()); // 5
```

Assigning a source ref to another target ref, will keep the target up to date with the source until the target is assigned another value
```javascript
const source = Ref(0);
const target = Ref(source);

source.set(1);

console.log(target.get()); // 1

target.set(999); // reassigning the target ref will break the connection

console.log(target.get()); // 999

source.set(2); 

console.log(target.get()); // still 999
```

### Computed - Derived Values

Computed refs derive their values from other refs. They're lazy and cache automatically.

```javascript
const count = Ref(1);
const doubled = Ref.computed(() => count.get() * 2);

console.log(doubled.get()); // 2

count.set(5);
console.log(doubled.get()); // 10
```

Computed refs support both getters and setters:

```javascript
const firstName = Ref('Rick');
const lastName = Ref('Sanchez');

const fullName = Ref.computed({
  get: () => `${firstName.get()} ${lastName.get()}`,
  set: (value) => {
    const [first, last] = value.split(' ');
    firstName.set(first);
    lastName.set(last);
  }
});

console.log(fullName.get()); // "Rick Sanchez"

fullName.set('Morty Smith');
console.log(firstName.get()); // "Morty"
console.log(lastName.get()); // "Smith"
```

### Effects - Reactive Side Effects

Effects automatically track their dependencies and re-run when those dependencies change. Updates are batched in a microtask.

```javascript
import { Effect } from '@torq-js/reactivity';

const count = Ref(0);

Effect(() => {
  console.log('Count is:', count.get());
});
// Logs: "Count is: 0"

count.set(1);
count.set(2);
count.set(3);
// After microtask, logs once: "Count is: 3"
```

Effects can be controlled programmatically:

```javascript
const effect = Effect(() => {
  console.log(count.get());
});

effect.disable(); // Stop reacting to changes
effect.enable();  // Resume reacting
effect.dispose(); // Permanently cleanup
```

### Structs - Reactive Objects

Structs are objects where each property is backed by a stable ref. When you access a property, you get the unwrapped value. When you set a property, the underlying ref is updated and subscribers are notified.

```javascript
import { Struct } from '@torq-js/reactivity';

const user = Struct({
  firstName: 'Rick',
  lastName: 'Sanchez'
});

// Property access returns unwrapped values
console.log(user.firstName); // "Rick"

// Property assignment updates the underlying ref
user.firstName = 'Morty';

// Computed refs track struct properties automatically
const greeting = Ref.computed(() => 
  `Hello, ${user.firstName} ${user.lastName}!`
);

console.log(greeting.get()); // "Hello, Morty Sanchez!"

// Access the underlying ref for a property
const firstNameRef = Struct.ref(user, 'firstName');
console.log(firstNameRef.get()); // "Morty"
```

Structs automatically unwrap refs when assigned to properties:

```javascript
const count = Ref(0);
const data = Struct({ value: 0 });

// Assigning a ref unwraps it automatically
data.value = count;
console.log(data.value); // 0 (unwrapped)

// Just like when assigning to a ref, until it is assigne to again, 
// the struct property will stay in sync with the assigned ref
count.set(5);
console.log(data.value); // 5 (updates automatically)
```

Structs support getters and setters:

```javascript
const person = Struct({
  firstName: 'Rick',
  lastName: 'Sanchez',
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  },
  set fullName(value) {
    const [first, last] = value.split(' ');
    this.firstName = first;
    this.lastName = last;
  }
});

console.log(person.fullName); // "Rick Sanchez"
person.fullName = 'Morty Smith';
console.log(person.firstName); // "Morty"
```

### Scopes - Lifecycle Management

Scopes manage the lifecycle of effects and their dependencies. When a scope disposes, all its children dispose too.

```javascript
import { Scope } from '@torq-js/reactivity';

const scope = Scope(() => {
    Effect(() => {
        console.log('This effect is scoped!')
    })
});

Effect(() => {
  console.log('This effect is scoped too!');
}, { scope });

// Cleanup everything
scope.dispose();
```

## Core Concepts

### Refs are Signals

Torq's refs are inspired by the [TC39 Signals proposal](https://github.com/tc39/proposal-signals), sharing the same core API pattern of `.get()` and `.set()` methods for reactive values. If you're familiar with signals from other frameworks or the proposal itself, refs will feel immediately familiar:

```javascript
const count = Ref(0);

console.log(count.get()); // 0

count.set(5);

console.log(count.get()); // 5
```

### Refs are Observables

Torq also embraces the [TC39 Observable proposal](https://github.com/tc39/proposal-observable) as a first-class feature. Every ref is an observable that you can directly subscribe to:

```javascript
const count = Ref(0);

count.subscribe((value) => console.log('Value:', value));

count.set(1); // Logs: "Value: 1"
```

This makes refs fully interoperable with any library or framework that understands observables. Think of refs as the union of signals and observables: you get both automatic dependency tracking and explicit subscription control in one primitive.

### Dependency Tracking

Torq uses automatic dependency tracking. When you call `.get()` inside a computed ref or effect, that ref is tracked as a dependency.

```javascript
const condition = Ref(true);
const a = Ref(1);
const b = Ref(2);

const result = Ref.computed(() => {
  return condition.get() ? a.get() : b.get();
});

// Initially depends on 'condition' and 'a'
console.log(result.get()); // 1

condition.set(false);
// Now depends on 'condition' and 'b' (not 'a')
console.log(result.get()); // 2
```

### Smart Caching

Computed refs cache their results and only recalculate when dependencies actually change, using equality checking to minimize recomputation:

```javascript
const count = Ref(1);
const isOdd = Ref.computed(() => count.get() % 2 === 1);

Effect(() => {
  console.log('Is odd:', isOdd.get());
});
// Logs: "Is odd: true"

count.set(3); // Both odd, isOdd doesn't change
// Effect doesn't re-run!

count.set(2); // Now even
// Logs: "Is odd: false"
```

### Lifecycle Control

Torq provides multiple approaches to manage the lifecycle of reactive primitives:

**Manual disposal** - Call `dispose()` directly on refs, effects, or scopes:

```javascript
const effect = Effect(() => console.log('Running'));
effect.dispose();
```

**AbortSignal** - Use standard `AbortSignal` for automatic cleanup:

```javascript
const controller = new AbortController();

const effect = Effect(() => {
  console.log(count.get());
}, { signal: controller.signal });

controller.abort(); // Disposes the effect
```

**Scopes** - Group related effects and dispose them all at once:

```javascript
import { Scope } from '@torq-js/reactivity';

const scope = Scope();

// All effects created with this scope will be cleaned up together
Effect(() => console.log('Effect 1'), { scope });
Effect(() => console.log('Effect 2'), { scope });
Effect(() => console.log('Effect 3'), { scope });

// Disposes all three effects and their dependencies
scope.dispose();
```

Scopes automatically form parent-child hierarchies. When a scope is disposed, all of its child scopes and their effects are disposed as well, making it easy to manage complex reactive graphs.

## Advanced Features

### Batched Updates and Scheduling

Both effects and computed refs intelligently handle multiple dependency changes using microtask-based batching. Multiple synchronous updates are coalesced into a single recomputation:

```javascript
const a = Ref(1);
const b = Ref(2);
const c = Ref(3);

// Effect batches multiple changes
Effect(() => {
  console.log('Sum:', a.get() + b.get() + c.get());
});
// Logs: "Sum: 6"

// Computed ref with subscriber also batches
const product = Ref.computed(() => a.get() * b.get() * c.get());
product.subscribe((value) => console.log('Product:', value));

// Multiple synchronous updates
a.set(10);
b.set(20);
c.set(30);

// After microtask:
// Logs "Sum: 60" once
// Logs "Product: 6000" once
```

### Nested Scope Structure

Scopes form parent-child hierarchies automatically. When you create effects, computed refs, or scopes inside a reactive context, they become children of that context. Disposing a parent scope disposes the entire tree:

```javascript
// Create a parent scope with a setup function
const parentScope = Scope(() => {
  // Create child scopes within the parent
  Scope(() => console.log('Child scope 1'));
  
  // Can also create effects as children
  Effect(() => console.log('Child effect'));

  // And computeds
  Ref.computed(() => someComputeFunction());
});

parentScope.dispose(); // All children are disposed
```
You can also explicitly specify a parent scope using the `scope` option:

```javascript
const parentScope = Scope();

// Explicitly attach to parent scope
Effect(() => console.log('Effect 1'), { scope: parentScope });
Scope(() => console.log('Child scope'), { scope: parentScope });

const computed = Ref.computed(() => someValue.get(), { scope: parentScope });

// Disposing parent disposes all explicitly attached children
parentScope.dispose();
```

This hierarchical structure makes it easy to manage complex reactive graphs without manual cleanup.

### Effects and Computeds are Scopes

Effects and computed refs are themselves scopes. This means they automatically participate in the scope hierarchy and can have child scopes of their own:

```javascript
const count = Ref(0);

const doubled = Ref.computed(() => {
  console.log('Computing doubled');
  
  // Computed refs can have child scopes! But they shouldn't...😅
  Scope(() => {
    Effect(() => console.log('Side effect from computed'));
  });
  
  return count.get() * 2;
});
```

### Detached Scopes

Scopes can be created without a parent by explicitly passing `null` as the scope option. This creates a detached scope that won't be automatically disposed when any parent context ends:

```javascript
Scope(() => {
  // This effect is detached - it won't be disposed when the effect re-runs
  const detachedEffecct = Effect(() => {
    console.log('Detached scope setup');
  }, { scope: null });
});
```

Detached scopes are useful when you need reactive computations to outlive their creation context, but remember you're responsible for disposing them manually.

### Observing Dependencies

Scopes track all observables that are accessed within them. You can inspect these dependencies using the `observables()` iterator:

```javascript
const count = Ref(0);
const name = Ref('Alice');

const scope = Scope(() => {
  count.get();
  name.get();
});

// Inspect what observables this scope depends on
for (const observable of scope.observables()) {
  console.log('Scope observes:', observable);
}

const dependencies = Array.from(scope.observables());
console.log(`Scope has ${dependencies.length} dependencies`);
```

This is particularly useful for debugging, introspection, or building developer tools that need to understand the reactive graph.

### Inspecting Child Scopes

Scopes also expose their child scopes through the `scopes()` iterator, allowing you to traverse the entire scope hierarchy:

```javascript
const parentScope = Scope(() => {
  Scope(() => console.log('Child 1'));
  Effect(() => console.log('Child effect'));
  Ref.computed(() => someComputeFunction());
});

// Iterate over direct children
for (const child of parentScope.scopes()) {
  console.log('Child scope:', child);
}

// Convert to array
const children = Array.from(parentScope.scopes());
console.log(`Parent has ${children.length} child scopes`);

// Recursively traverse the entire tree
function traverseScopes(scope, depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}Scope`);
  
  for (const child of scope.scopes()) {
    traverseScopes(child, depth + 1);
  }
}

traverseScopes(parentScope);
```

This enables powerful introspection capabilities for debugging complex reactive applications or building development tools that visualize the reactive graph structure.

## Design Philosophy and Goals

Torq is built on the principle that **the chief concern of reactivity systems is providing a means of subscribing to changes**. This is why refs are observables first and foremost and why subscriptions aren't hidden or secondary, they're central to the design.

From this philosophy, Torq was built with these goals in mind:
- **Feel native to JavaScript** - Match ecosystem conventions and work with standard protocols
- **Composable primitives** - Small, focused building blocks that combine naturally
- **Scale to complexity** - Handle large dependency graphs efficiently

## License

MIT