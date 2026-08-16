import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Next's file tracer can miss native addons that are require()'d dynamically
  // by their loader (better-sqlite3's prebuild-install / bindings.js lookup).
  // @prisma/adapter-better-sqlite3 pins its own better-sqlite3 version, which
  // npm nests under its own node_modules whenever it conflicts with another
  // copy elsewhere in the tree (e.g. the prisma CLI's own devDependency) — so
  // include both the top-level and the adapter-nested location, whichever
  // ends up holding the real binary after `npm install`.
  // This copies whatever .node file is on disk *right now* — for the Electron
  // build, package.json's build:standalone script runs electron-rebuild before
  // this, so the file this grabs is already rebuilt for Electron's ABI instead
  // of plain Node's.
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/better-sqlite3/**/*.node",
      "./node_modules/@prisma/adapter-better-sqlite3/node_modules/better-sqlite3/**/*.node",
    ],
  },
};

export default nextConfig;
