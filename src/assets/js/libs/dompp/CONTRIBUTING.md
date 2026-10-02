# Contributing to DOMPP

Thanks for contributing to DOMPP.

DOMPP is intentionally designed as a lightweight native DOM enhancement layer focused on:

* deterministic mutation
* minimal abstraction
* explicit behavior
* native platform APIs
* progressive capability

Before contributing, please understand the core philosophy of the project.

---

# Philosophy First

DOMPP is not intended to become:

* a virtual DOM framework
* a template compiler
* a JSX-first runtime
* a hidden reconciliation engine
* a framework abstraction over the browser

DOMPP should remain:

```txt
native DOM
+
small chainable setters
+
optional reactivity
```

When proposing features, ask:

> Does this still feel like direct DOM programming?

If the answer becomes unclear, the feature may not belong in core DOMPP.

---

# Core Principles

## Prefer Explicit Behavior

Avoid:

* hidden mutation
* implicit reconciliation
* automatic diffing
* magical optimizations
* invisible runtime behavior

Prefer:

* direct mutation
* deterministic updates
* transparent APIs
* predictable execution flow

---

## Minimal Runtime Overhead

DOMPP intentionally avoids unnecessary abstraction.

Do not introduce:

* runtime-heavy orchestration
* unnecessary caching
* deep dependency tracking
* hidden schedulers
* virtual DOM layers

If developers want optimization logic, they should opt into it explicitly.

---

## Native DOM First

DOMPP extends native DOM prototypes.

This means:

```js
document.createElement("div")
```

should remain the primary mental model.

Avoid APIs that replace the browser platform with a framework-specific abstraction.

---

# Architecture Guidelines

As of `1.1.1`, DOMPP uses ESM modular architecture.

Current structure:

```txt
src/1.1.1/

  context/
  core/
  install/
  runtime/
  setters/
  utils/
```

Please keep responsibilities separated.

---

## context/

Contains DOM context builders.

Examples:

* createDomppContext
* createDomppSetterContext

These should remain:

* stateless
* predictable
* side-effect free

---

## runtime/

Contains:

* state runtime
* fine-grained signals
* wrappers
* scheduling

Runtime modules should remain:

* lightweight
* isolated
* composable

Avoid tightly coupling runtimes together.

---

## setters/

Contains chainable DOM setters.

Examples:

* setText
* setChildren
* setStyles
* setAttributes
* setEvents
* setState
* setEnhancement

Setter modules should:

* mutate directly
* avoid hidden logic
* stay deterministic
* avoid framework-like behavior

---

## utils/

Utility modules should remain:

* pure
* isolated
* independently testable

---

# Prototype Safety

DOMPP extends native prototypes globally.

This is powerful but sensitive.

Rules:

* Never override existing native methods
* Use collision-resistant names
* Keep setters deterministic
* Avoid modifying browser behavior
* Avoid non-standard side effects

Prototype extensions must always remain safe and predictable.

---

# Reactive Runtime Guidelines

DOMPP currently supports:

* stateful runtime (`setState`)
* fine-grained signals (`createSignal`)

These systems are intentionally optional.

Do not make:

* signals mandatory
* reactive runtime unavoidable
* mutation dependent on framework scheduling

DOMPP must continue working as plain native DOM enhancement.

---

# Fine-Grained Signals

Signals are designed to be:

* lightweight
* opt-in
* explicit
* granular

Avoid introducing:

* implicit subscriptions
* compiler-dependent behavior
* hidden dependency transforms
* automatic reactive graph mutation

The signal runtime should remain understandable from source code inspection alone.

---

# Existing DOM Enhancement

`setEnhancement()` exists to support:

* server-rendered HTML
* static HTML assimilation
* progressive enhancement
* hydration-like patterns

Without:

* virtual DOM hydration
* subtree recreation
* reconciliation engines

Please preserve this philosophy.

---

# Examples

Examples are extremely important in DOMPP.

Each example should:

* focus on one concept
* remain short
* remain understandable
* demonstrate a single architectural idea

Avoid examples that:

* combine too many concepts
* obscure native DOM behavior
* introduce unnecessary complexity

---

# Example Naming

Examples use numeric ordering:

```txt
01-basic-text
02-basic-styles
03-basic-attributes
```

Please preserve this convention.

---

# Running Local Dev Server

Run the local development server:

```bash
node server.js
```

Open:

```txt
http://localhost:5173
```

---

# Testing

DOMPP intentionally uses:

* native Node.js test runner
* native ESM
* minimal tooling
* zero test framework dependencies

Run tests:

```bash
npm test
```

or:

```bash
node --test
```

---

# Testing Philosophy

Focus tests on:

* pure runtime logic
* utilities
* signals
* scheduling
* deterministic mutation behavior

Browser behavior can be validated through:

* examples
* manual integration testing

Avoid introducing heavyweight testing stacks unless absolutely necessary.

---

# Pull Requests

Before opening large architectural PRs:

* explain the motivation
* explain tradeoffs
* explain runtime implications
* explain compatibility concerns

DOMPP values architectural clarity over feature quantity.

---

# Feature Discussions

Good contribution areas:

* runtime ergonomics
* scheduling strategies
* memory behavior
* fine-grained runtime improvements
* enhancement patterns
* documentation
* educational examples
* performance investigation

Potentially problematic areas:

* template compilers
* hidden diffing
* framework-like abstractions
* magical APIs
* excessive runtime orchestration

---

# Final Note

DOMPP is intentionally small.

A feature being technically possible does not automatically mean it belongs in core.

The project prioritizes:

* clarity
* explicitness
* native mental models
* predictable behavior
* architectural simplicity

Please help preserve that direction.
