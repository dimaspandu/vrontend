import compileJSX from "../main.js";
import runTest from "../../../utils/tester.js";

/**
 * FACTORY NAME - DEFAULT
 */

runTest(
  "JSX - basic element",
  compileJSX(`const x = <div>Hello</div>;`),
  `const x = d("div", null, "Hello");`
);

runTest(
  "JSX - element with className",
  compileJSX(`<div className="foo" />`),
  `d("div", { "className": "foo" })`
);

runTest(
  "JSX - self-closing with attributes",
  compileJSX(`<img src="x.png" alt="img" />`),
  `d("img", { "src": "x.png", "alt": "img" })`
);

runTest(
  "JSX - nested elements",
  compileJSX(`<div><span>A</span><span>B</span></div>`),
  `d("div", null, d("span", null, "A"), d("span", null, "B"))`
);

runTest(
  "JSX - expression child",
  compileJSX(`<h1>{title}</h1>`),
  `d("h1", null, title)`
);

runTest(
  "JSX - mixed children",
  compileJSX(`<div>Text <span>{val}</span></div>`),
  `d("div", null, "Text", d("span", null, val))`
);

runTest(
  "JSX - boolean attribute",
  compileJSX(`<input disabled />`),
  `d("input", { "disabled": true })`
);

runTest(
  "JSX - spread attributes",
  compileJSX(`<div {...props} />`),
  `d("div", { ...(props) })`
);

runTest(
  "JSX - object expression attribute",
  compileJSX(`<button on={{ click: handler }}>Click</button>`),
  `d("button", { "on": { click: handler } }, "Click")`
);

runTest(
  "JSX - template literal expression",
  compileJSX('<strong>{`Count: ${count}`}</strong>'),
  'd("strong", null, `Count: ${count}`)'
);

runTest(
  "JSX - template literal in attribute",
  compileJSX('<div style={`color: red`} />'),
  'd("div", { "style": `color: red` })'
);

runTest(
  "JSX - JSX inside JS function",
  compileJSX(`
    return (
      <div>Hello</div>
    );
  `),
  `
    return (
      d("div", null, "Hello")
    );
  `
);

/**
 * FACTORY NAME - CUSTOM PARAMETER
 */

runTest(
  "JSX - custom factory parameter",
  compileJSX(`<div />`, "h"),
  `h("div", null)`
);

runTest(
  "JSX - custom factory with children",
  compileJSX(`<div>Hello <span>x</span></div>`, "jsx"),
  `jsx("div", null, "Hello", jsx("span", null, "x"))`
);

/**
 * FACTORY NAME - @jsx PRAGMA
 */

runTest(
  "JSX - @jsx pragma parsed from source",
  compileJSX(`
    /** @jsx h */
    const x = <div />;
  `),
  `
    const x = h("div", null);
  `
);

runTest(
  "JSX - @jsx pragma with children",
  compileJSX(`
    /** @jsx h */
    <div>Hello</div>
  `),
  `
    h("div", null, "Hello")
  `
);

/**
 * FRAGMENTS
 */

runTest(
  "JSX - fragment",
  compileJSX(`<><div>A</div><div>B</div></>`),
  `d.fragment(d("div", null, "A"), d("div", null, "B"))`
);

runTest(
  "JSX - fragment with custom factory",
  compileJSX(`<><span>x</span></>`, "h"),
  `h.fragment(h("span", null, "x"))`
);

/**
 * ERROR HANDLING
 */

runTest(
  "JSX - unmatched closing tag",
  (() => {
    try {
      compileJSX(`<div></span>`);
      return "no error";
    } catch (e) {
      return "SyntaxError";
    }
  })(),
  "SyntaxError"
);

/**
 * COMPLEX DEMO-LIKE
 */

runTest(
  "JSX - card-like component",
  compileJSX(`
    function card(title, description, content) {
      return (
        <section className="card">
          <h2>{title}</h2>
          <small>{description}</small>
          {content}
        </section>
      );
    }
  `),
  `
    function card(title, description, content) {
      return (
        d("section", { "className": "card" }, d("h2", null, title), d("small", null, description), content)
      );
    }
  `,
  true
);
