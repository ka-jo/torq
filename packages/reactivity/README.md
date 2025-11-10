# Sheen Reactivity System

This package contains the source code for Sheen's reactivity system. 

## Overall Philosophy

- Prioritize clean mental models over raw performance
- Match JavaScript ecosystem conventions wherever sensible
- Build primitives that feel native to the language
- Scale naturally to large dependency graphs

## Current Scope/Goals

- Fine-grained, signal-based reactivity
- Lazy evaluation for Computeds
- Computeds dispose themselves when no longer observed
- Version-based dirty checking for minimal recomputes
- Microtask-based batching for effects
- Effects self-schedule once per flush
- Support AbortSignal lifecycle for Ref, Struct, Effect
- Support linking signals (bidirectional binding)
- Provide means of 
- Symbol.observable compliance for interoperability

## Out of Scope / Future Goals

- Dependency depth sorting for flush ordering
- Better ergonomics for Scope-like resource ownership
- Utility for batching/deferring subscriber notification and recomputation 
- Type coercion for refs using valueOf, toString, and/or toPrimitive

## Architectural Assumptions

- Refs and Structs are separate concepts
- Structs proxy nested refs automatically
- Effects and Computeds share core infrastructure
- Refs/Structs can be disposed manually or by abort signals