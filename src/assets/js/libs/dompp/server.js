import { createServer }
from "http";

import {
  existsSync,
  createReadStream,
  statSync
}
from "fs";

import {
  extname,
  join,
  dirname
}
from "path";

import {
  fileURLToPath
}
from "url";

// =====================================
// PATHS
// =====================================

const __filename =
  fileURLToPath(
    import.meta.url
  );

const __dirname =
  dirname(__filename);

const ROOT_DIR =
  __dirname;

const PORT =
  process.env.PORT || 5173;

// =====================================
// MIME TYPES
// =====================================

const mimeTypes = {

  ".html":
    "text/html",

  ".js":
    "text/javascript",

  ".mjs":
    "text/javascript",

  ".css":
    "text/css",

  ".json":
    "application/json",

  ".svg":
    "image/svg+xml",

  ".png":
    "image/png",

  ".jpg":
    "image/jpeg",

  ".jpeg":
    "image/jpeg",

  ".webp":
    "image/webp",

  ".md":
    "text/markdown",

  ".txt":
    "text/plain"
};

// =====================================
// SERVE FILE
// =====================================

function serveFile(
  res,
  filePath
) {

  if (
    !existsSync(filePath)
  ) {

    res.writeHead(404);

    res.end(
      "Not found"
    );

    return;
  }

  const ext =
    extname(filePath);

  const contentType =
    mimeTypes[ext] ||
    "application/octet-stream";

  res.writeHead(200, {
    "Content-Type":
      contentType
  });

  createReadStream(filePath)
    .pipe(res);
}

// =====================================
// SERVER
// =====================================

createServer((req, res) => {

  let urlPath =
    req.url.split("?")[0];

  console.log(
    "REQ:",
    urlPath
  );

  // =================================
  // ROOT
  // =================================

  if (
    urlPath === "/"
  ) {

    return serveFile(
      res,
      join(
        ROOT_DIR,
        "index.html"
      )
    );
  }

  // =================================
  // NORMAL FILE PATH
  // =================================

  const filePath =
    join(
      ROOT_DIR,
      urlPath
    );

  // =================================
  // DIRECT FILE
  // =================================

  if (
    existsSync(filePath) &&
    !statSync(filePath)
      .isDirectory()
  ) {

    return serveFile(
      res,
      filePath
    );
  }

  // =================================
  // DIRECTORY -> index.html
  // =================================

  if (
    existsSync(filePath) &&
    statSync(filePath)
      .isDirectory()
  ) {

    const indexFile =
      join(
        filePath,
        "index.html"
      );

    if (
      existsSync(indexFile)
    ) {

      return serveFile(
        res,
        indexFile
      );
    }
  }

  // =================================
  // HTML FILE SUPPORT
  // /about -> /about.html
  // =================================

  const htmlFile =
    join(
      ROOT_DIR,
      urlPath + ".html"
    );

  if (
    existsSync(htmlFile)
  ) {

    return serveFile(
      res,
      htmlFile
    );
  }

  // =================================
  // NOT FOUND
  // =================================

  res.writeHead(404);

  res.end(
    "Not found"
  );

}).listen(PORT, () => {

  console.log("");

  console.log(
    "DOMPP Dev Server"
  );

  console.log("");

  console.log(
    `Local:` +
    ` http://localhost:${PORT}`
  );

  console.log("");
});