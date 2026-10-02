import minifyHTML from "../main.js";
import runTest from "../../../../utils/tester.js";

/**
 * BASIC HTML
 */

runTest(
  "Minify HTML - simple tag",
  minifyHTML(`<div></div>`),
  "<div></div>"
);

runTest(
  "Minify HTML - remove newlines and indentation",
  minifyHTML(`
    <div>
      <span></span>
    </div>
  `),
  "<div><span></span></div>"
);

runTest(
  "Minify HTML - remove comments",
  minifyHTML(`<div><!-- comment --><span></span></div>`),
  "<div><span></span></div>"
);

/**
 * ATTRIBUTES
 */

runTest(
  "Minify HTML - attributes spacing",
  minifyHTML(`<div   class="box"    id="a"></div>`),
  `<div class="box" id="a"></div>`
);

runTest(
  "Minify HTML - single attribute",
  minifyHTML(`<img    src="x.png"    />`),
  `<img src="x.png"/>`
);

runTest(
  "Minify HTML - attribute with spaces in value",
  minifyHTML(`<div title="hello   world"></div>`),
  `<div title="hello   world"></div>`
);

/**
 * TEXT NODES (IMPORTANT)
 */

runTest(
  "Minify HTML - preserve text whitespace",
  minifyHTML(`<span> hello   world </span>`),
  `<span> hello   world </span>`
);

runTest(
  "Minify HTML - text between tags",
  minifyHTML(`
    <p>
      Hello
      <b>World</b>
    </p>
  `),
  `<p>Hello <b>World</b></p>`
);

runTest(
  "Minify HTML - multiline text nodes collapse to single space",
  minifyHTML(`
    <p class="hero__description">
      Website error, web app issues, database broken,
      or sudden production down? We help find the root cause
      and fix it.
    </p>
  `),
  `<p class="hero__description">Website error, web app issues, database broken, or sudden production down? We help find the root cause and fix it.</p>`
);

runTest(
  "Minify HTML - inline element between text nodes",
  minifyHTML(`
    <p class="hero__note">
      No need to know what the problem is.
      <strong>That's our part.</strong>
    </p>
  `),
  `<p class="hero__note">No need to know what the problem is. <strong>That's our part.</strong></p>`
);

runTest(
  "Minify HTML - inline element followed by text",
  minifyHTML(`
    <p>
      <span class="terminal__success">✓</span>
      DNS
    </p>
  `),
  `<p><span class="terminal__success">✓</span> DNS</p>`
);

/**
 * SELF CLOSING & VOID
 */

runTest(
  "Minify HTML - self closing tag",
  minifyHTML(`<br />`),
  `<br/>`
);

runTest(
  "Minify HTML - multiple void elements",
  minifyHTML(`
    <img src="a.png" />
    <img src="b.png" />
  `),
  `<img src="a.png"/><img src="b.png"/>`
);

/**
 * SVG
 */

runTest(
  "Minify SVG - simple svg",
  minifyHTML(`
    <svg width="100" height="100">
      <circle cx="50" cy="50" r="40" />
    </svg>
  `),
  `<svg width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>`
);

runTest(
  "Minify SVG - preserve text",
  minifyHTML(`<text x="0" y="0"> Hello SVG </text>`),
  `<text x="0" y="0"> Hello SVG </text>`
);

/**
 * XML / DOCTYPE
 */

runTest(
  "Minify HTML - doctype preserved",
  minifyHTML(`
    <!DOCTYPE html>
    <html>
      <body></body>
    </html>
  `),
  `<!DOCTYPE html><html><body></body></html>`
);

runTest(
  "Minify XML - xml declaration",
  minifyHTML(`<?xml version="1.0" ?><root> a </root>`),
  `<?xml version="1.0"?><root> a </root>`
);

/**
 * EDGE CASES
 */

runTest(
  "Minify HTML - empty input",
  minifyHTML(``),
  ``
);

runTest(
  "Minify HTML - only whitespace",
  minifyHTML(`   \n   `),
  ``
);

runTest(
  "Minify HTML - multiline tag with attributes",
  minifyHTML(`
    <button
      class="menu-toggle"
      type="button"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
  `),
  `<button class="menu-toggle" type="button"><span></span><span></span><span></span></button>`,
  true
);
