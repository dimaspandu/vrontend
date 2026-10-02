// =====================================
// DOM++ Browser Build
// Stateful Included By Default
// Vanilla-Friendly
// =====================================
//
// DOM++ is intentionally designed as a
// lightweight prototype enhancement layer.
//
// Goals:
//
// - Zero abstraction over native DOM
// - Direct DOM mutation
// - Chainable APIs
// - Minimal runtime overhead
// - No virtual DOM
// - No dependency graph
// - No hidden diffing system
//
// Philosophy:
//
// DOM++ should not think for the developer.
// Mutations are explicit and deterministic.
//
// =====================================

(function () {

  // =====================================
  // Utilities
  // =====================================

  /**
   * Checks whether a value is a DOM Node.
   *
   * Used by setChildren() normalization.
   */
  const isNodeLike = (value) =>
    typeof Node !== "undefined" &&
    value instanceof Node;

  /**
   * Converts kebab-case CSS properties
   * into camelCase.
   *
   * Example:
   * background-color -> backgroundColor
   */
  const toCamelCase = (cssProp) =>
    cssProp.replace(
      /-([a-z])/g,
      (_, ch) => ch.toUpperCase()
    );

  /**
   * Reads current inline styles from a node.
   *
   * Returned object is used by
   * setter callback contexts.
   */
  const readInlineStyles = (node) => {

    const styles = {};
    const styleDecl = node.style;

    for (
      let i = 0;
      i < styleDecl.length;
      i += 1
    ) {

      const prop = styleDecl[i];

      styles[toCamelCase(prop)] =
        styleDecl.getPropertyValue(prop);
    }

    return styles;
  };

  /**
   * Reads current attributes from a node.
   *
   * Returned object is used by
   * setter callback contexts.
   */
  const readAttributes = (node) => {

    const attributes = {};

    for (
      const attr of Array.from(
        node.attributes ?? []
      )
    ) {

      attributes[attr.name] =
        attr.value;
    }

    return attributes;
  };

  /**
   * Reads currently registered DOM++
   * event handlers.
   */
  const readEvents = (node) => ({
    ...(node.__dompp_handlers ?? {})
  });

  /**
   * Normalizes arbitrary values into
   * a flat array of DOM nodes.
   *
   * Supported:
   *
   * - Node
   * - string
   * - number
   * - array
   * - nested arrays
   *
   * Ignored:
   *
   * - null
   * - undefined
   * - false
   */
  const toNodeList = (values) => {

    const out = [];

    const pushOne = (value) => {

      if (
        value == null ||
        value === false
      ) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(pushOne);
        return;
      }

      if (isNodeLike(value)) {
        out.push(value);
        return;
      }

      out.push(
        document.createTextNode(
          String(value)
        )
      );
    };

    values.forEach(pushOne);

    return out;
  };

  // =====================================
  // Context
  // =====================================

  /**
   * Builds generic DOM context.
   *
   * Used by all setter callbacks.
   */
  function createDomppContext(node) {

    return {

      /**
       * Current element.
       */
      el: node,

      /**
       * Element-only children.
       */
      children: Array.from(
        node.children ?? []
      ),

      /**
       * Raw childNodes.
       */
      childNodes: Array.from(
        node.childNodes ?? []
      ),

      /**
       * First child node.
       */
      firstChild:
        node.firstChild ?? null,

      /**
       * Last child node.
       */
      lastChild:
        node.lastChild ?? null
    };
  }

  /**
   * Builds setter-specific context.
   *
   * Example:
   *
   * setStyles(({ styles }) => ...)
   * setText(({ text }) => ...)
   */
  function createDomppSetterContext(
    node,
    setterName
  ) {

    const dom =
      createDomppContext(node);

    if (setterName === "setText") {

      return {
        ...dom,
        text:
          node.textContent ?? ""
      };
    }

    if (setterName === "setStyles") {

      return {
        ...dom,
        styles:
          readInlineStyles(node)
      };
    }

    if (
      setterName === "setAttributes"
    ) {

      return {
        ...dom,
        attributes:
          readAttributes(node)
      };
    }

    if (setterName === "setEvents") {

      return {
        ...dom,
        events:
          readEvents(node)
      };
    }

    if (setterName === "setState") {

      return {
        ...dom,
        state:
          node.__dompp_state ?? {}
      };
    }

    return dom;
  }

  // =====================================
  // Internal State
  // =====================================

  /**
   * Ensures element-local state storage.
   */
  function ensureState(el) {

    if (!el.__dompp_state) {

      /**
       * Local mutable state object.
       */
      el.__dompp_state = {};

      /**
       * Reactive bindings registry.
       */
      el.__dompp_bindings =
        new Set();

      /**
       * Prevents duplicate microtasks.
       */
      el.__dompp_flushScheduled =
        false;
    }
  }

  /**
   * Executes all reactive bindings.
   *
   * Snapshotting prevents iteration
   * mutation issues.
   */
  function flushBindings(el) {

    el.__dompp_flushScheduled =
      false;

    if (!el.__dompp_bindings) {
      return;
    }

    const runners = Array.from(
      el.__dompp_bindings
    );

    for (const run of runners) {
      run();
    }
  }

  /**
   * Schedules a microtask flush.
   *
   * Multiple synchronous mutations
   * result in a single flush pass.
   */
  function scheduleFlush(el) {

    if (el.__dompp_flushScheduled) {
      return;
    }

    el.__dompp_flushScheduled =
      true;

    queueMicrotask(() => {
      flushBindings(el);
    });
  }

  // =====================================
  // Prototype Installer
  // =====================================

  /**
   * Defines methods safely onto prototypes.
   *
   * Existing methods are never overridden.
   */
  function defineOn(
    proto,
    name,
    fn
  ) {

    if (!proto[name]) {

      Object.defineProperty(
        proto,
        name,
        {
          value: fn,
          writable: false,
          configurable: true
        }
      );
    }
  }

  // =====================================
  // Core Setters
  // =====================================

  /**
   * setText()
   *
   * Thin wrapper around textContent.
   *
   * Supports:
   *
   * - string
   * - number
   * - callback
   */
  function setText(text) {

    const nextText =
      typeof text === "function"
        ? text(
            createDomppSetterContext(
              this,
              "setText"
            )
          )
        : text;

    /**
     * DOM++ intentionally performs
     * direct mutation without
     * equality checks.
     */
    this.textContent = nextText;

    return this;
  }

  /**
   * setChildren()
   *
   * Replaces all children using
   * replaceChildren().
   *
   * DOM++ intentionally uses
   * full structural replacement
   * rather than diffing.
   */
  function setChildren(
    ...children
  ) {

    let nextChildren = children;

    /**
     * Callback mode:
     *
     * setChildren(ctx => ...)
     */
    if (
      children.length === 1 &&
      typeof children[0] ===
        "function"
    ) {

      const resolved =
        children[0](
          createDomppSetterContext(
            this,
            "setChildren"
          )
        );

      nextChildren =
        Array.isArray(resolved)
          ? resolved
          : [resolved];
    }

    this.replaceChildren(
      ...toNodeList(nextChildren)
    );

    return this;
  }

  // =====================================
  // Install Base Setters
  // =====================================

  defineOn(
    Element.prototype,
    "setText",
    setText
  );

  defineOn(
    Element.prototype,
    "setChildren",
    setChildren
  );

  /**
   * setStyles()
   *
   * Performs partial inline style updates.
   *
   * Existing styles are preserved unless
   * explicitly overwritten.
   */
  defineOn(
    Element.prototype,
    "setStyles",
    function (styles = {}) {

      const nextStyles =
        typeof styles === "function"
          ? styles(
              createDomppSetterContext(
                this,
                "setStyles"
              )
            )
          : styles;

      /**
       * Partial mutation.
       *
       * This does NOT replace the entire
       * style object.
       */
      Object.assign(
        this.style,
        nextStyles ?? {}
      );

      return this;
    }
  );

  /**
   * setAttributes()
   *
   * Applies attributes with
   * boolean semantics.
   *
   * Rules:
   *
   * true  -> empty attribute
   * false -> remove attribute
   * null  -> remove attribute
   */
  defineOn(
    Element.prototype,
    "setAttributes",
    function (attrs = {}) {

      const nextAttrs =
        typeof attrs === "function"
          ? attrs(
              createDomppSetterContext(
                this,
                "setAttributes"
              )
            )
          : attrs;

      for (const k in (
        nextAttrs ?? {}
      )) {

        const v = nextAttrs[k];

        if (
          v === false ||
          v == null
        ) {

          this.removeAttribute(k);

        } else {

          this.setAttribute(
            k,
            v === true
              ? ""
              : v
          );
        }
      }

      return this;
    }
  );

  /**
   * setEvents()
   *
   * Automatically replaces previous
   * handlers to prevent duplicates.
   */
  defineOn(
    Element.prototype,
    "setEvents",
    function (events = {}) {

      const nextEvents =
        typeof events === "function"
          ? events(
              createDomppSetterContext(
                this,
                "setEvents"
              )
            )
          : events;

      /**
       * Local handler registry.
       */
      this.__dompp_handlers ??= {};

      for (const e in (
        nextEvents ?? {}
      )) {

        /**
         * Remove previous handler first.
         */
        if (
          this.__dompp_handlers[e]
        ) {

          this.removeEventListener(
            e,
            this.__dompp_handlers[e]
          );
        }

        this.addEventListener(
          e,
          nextEvents[e]
        );

        this.__dompp_handlers[e] =
          nextEvents[e];
      }

      return this;
    }
  );

  /**
   * setState()
   *
   * Minimal local state container.
   *
   * IMPORTANT:
   *
   * DOM++ intentionally performs
   * no equality checks.
   *
   * Every setState() call schedules
   * reactive bindings.
   *
   * Philosophy:
   *
   * The developer controls mutations,
   * not the runtime.
   */
  defineOn(
    Element.prototype,
    "setState",
    function (next) {

      ensureState(this);

      /**
       * Functional mutation mode.
       */
      if (
        typeof next === "function"
      ) {

        next({

          state:
            this.__dompp_state,

          setState: (n) => {
            return this.setState(n);
          },

          ...createDomppContext(this)
        });

      }

      /**
       * Object mutation mode.
       */
      else {

        Object.assign(
          this.__dompp_state,
          next
        );
      }

      /**
       * Always schedule bindings.
       *
       * No diffing.
       * No equality checks.
       */
      scheduleFlush(this);

      return this;
    }
  );

  // =====================================
  // Fragment Support
  // =====================================

  /**
   * Fragments only support
   * semantic mutation helpers.
   */
  defineOn(
    DocumentFragment.prototype,
    "setText",
    setText
  );

  defineOn(
    DocumentFragment.prototype,
    "setChildren",
    setChildren
  );

  // =====================================
  // Reactive Wrappers
  // =====================================

  /**
   * Wraps setters to support
   * reactive callback bindings.
   *
   * Example:
   *
   * el.setText(({ state }) => ...)
   */
  function wrapSetterForState(name) {

    const original =
      Element.prototype[name];

    if (
      !original ||
      original.__dompp_wrapped
    ) {
      return;
    }

    function wrapped(...args) {

      const first = args[0];

      /**
       * Fast path for direct mutation.
       */
      if (
        typeof first !== "function"
      ) {

        return original.apply(
          this,
          args
        );
      }

      ensureState(this);

      /**
       * Previous computed result.
       *
       * Used for lightweight
       * memoization.
       */
      let previousResult;

      const runner = () => {

        const context = {

          state:
            this.__dompp_state,

          setState: (n) =>
            this.setState(n),

          ...createDomppContext(this),

          ...createDomppSetterContext(
            this,
            name
          )
        };

        const nextResult =
          first(context);

        /**
         * Prevents unnecessary
         * repeated mutations when
         * computed output is identical.
         *
         * This optimization exists only
         * inside reactive bindings,
         * not direct setter calls.
         */
        if (
          Object.is(
            previousResult,
            nextResult
          )
        ) {
          return;
        }

        previousResult = nextResult;

        /**
         * Normalize child arrays.
         */
        if (
          name === "setChildren"
        ) {

          const children =
            Array.isArray(
              nextResult
            )
              ? nextResult
              : [nextResult];

          original.call(
            this,
            ...children
          );

          return;
        }

        original.call(
          this,
          nextResult
        );
      };

      /**
       * Register reactive binding.
       */
      this.__dompp_bindings.add(
        runner
      );

      /**
       * Initial execution.
       */
      runner();

      return this;
    }

    wrapped.__dompp_wrapped =
      true;

    Object.defineProperty(
      Element.prototype,
      name,
      {
        value: wrapped,
        writable: false,
        configurable: true
      }
    );
  }

  /**
   * Enable reactive wrappers
   * for all mutable setters.
   */
  [
    "setText",
    "setChildren",
    "setStyles",
    "setAttributes",
    "setEvents"
  ].forEach(
    wrapSetterForState
  );

  // =====================================
  // Global API
  // =====================================

  window.DOMPP = {

    /**
     * Runtime version.
     */
    version: "1.0.0",

    /**
     * Public utilities.
     */
    createDomppContext,
    createDomppSetterContext
  };

})();