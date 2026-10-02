/**
 * Configuration for the run.*.js scripts, loaded from a local .env file.
 *
 * Uses Node's built-in .env support (process.loadEnvFile, Node 20.12+), so no
 * dotenv dependency is needed. Every value has a default: the scripts run
 * without a .env file present.
 *
 * See .env.example for the available keys.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const baseDir = path.dirname(fileURLToPath(import.meta.url));

const envFile = path.join(baseDir, ".env");

if (fs.existsSync(envFile)) {
  try {
    process.loadEnvFile(envFile);
  } catch (error) {
    throw new Error(`Failed to read ${envFile}: ${error.message}`);
  }
}

const readString = (key, fallback) => {
  const value = process.env[key];
  return value === undefined || value === "" ? fallback : value;
};

const readNumber = (key, fallback) => {
  const value = readString(key, "");

  if (value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
    throw new Error(`Invalid ${key} in .env: expected a port number, got "${value}"`);
  }

  return parsed;
};

const readBoolean = (key, fallback) => {
  const value = readString(key, "").toLowerCase();

  if (value === "") {
    return fallback;
  }

  if (["1", "true", "yes", "on"].includes(value)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(value)) {
    return false;
  }

  throw new Error(`Invalid ${key} in .env: expected a boolean, got "${value}"`);
};

export const config = {
  // Dev and preview servers.
  port: readNumber("PORT", 7200),
  host: readString("HOST", "localhost"),

  // Production build. MINIFY=false skips minification entirely, which also
  // avoids ngapack's remote-minifier fallback when terser is unavailable.
  minify: readBoolean("MINIFY", true),
  jsxFactory: readString("JSX_FACTORY", "elementBuilder"),

  // Build output folder, relative to baseDir. Read by run.bundle.js when
  // writing and by run.start.js when serving, so the two stay in sync.
  outputDir: readString("OUTPUT_DIR", "dist")
};

export const resolveFromBase = (...segments) => path.join(baseDir, ...segments);