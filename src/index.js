import "./assets/js/libs/historypp/src/index.js";
import "./assets/js/libs/dompp/src/index.js";

import tasksHandler from "./assets/js/domain/tasks/handler.js";
import taskHandler from "./assets/js/domain/task/handler.js";
import notFoundHandler from "./assets/js/domain/notfound/handler.js";
import counterHandler from "./assets/js/domain/counter/handler.js";

const app = document.getElementById("app");

history.router("/", tasksHandler(app));
history.router("/task/:id", taskHandler(app));
history.router("/counter", counterHandler(app));
history.notFound(notFoundHandler(app));

document.addEventListener("click", onLinkClick);

history.navigateReplace(normalize(location.pathname) + location.search);

/**
 * Turns ordinary internal links into client-side navigation, so views can use
 * real <a href> markup instead of wiring every link to a click handler.
 */
function onLinkClick(event) {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const link = event.target.closest("a[href]");

  if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

  const href = link.getAttribute("href");

  if (!href || !href.startsWith("/")) return;

  event.preventDefault();
  history.navigatePush(normalize(href) + location.search);
}

// historypp matches exact paths, so a trailing slash would not match a route.
function normalize(path) {
  return path !== "/" && path.endsWith("/") ? path.slice(0, -1) : path;
}