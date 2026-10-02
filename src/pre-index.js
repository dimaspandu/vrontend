/**
 * Bundler entry point.
 *
 * This file is never loaded by the browser. It exists so the bundler has a
 * single starting point from which to discover every asset that must be copied
 * into dist/. The application itself is reached through the ./index.js import
 * at the bottom.
 */

// The HTML shell and the server-side 404 page are copied to dist/ as-is.
import "./index.html";
import "./404.html";

// Static assets, imported only to have them emitted to dist/.
import "./assets/css/styles.css";

import "./assets/images/favicon.svg";

// The application entry: browser code, emitted as dist/index.js.
import "./index.js";