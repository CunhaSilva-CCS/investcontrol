#!/usr/bin/env node
// Next's `output: "standalone"` build produces a minimal server.js but, by design, does not
// copy the public/ and .next/static/ folders into it (Next expects those to be served by a
// CDN in a typical deployment). We're serving them ourselves inside Electron, so copy them in
// manually, exactly as Next's own docs for standalone output instruct.
//
// better-sqlite3 gets the same treatment, but for a different reason: Next's file tracer
// (outputFileTracingIncludes in next.config.ts) is supposed to pull the native .node binary
// into standalone/node_modules on its own, but has proven unreliable specifically when
// electron-rebuild has just replaced the binary before the build runs (observed: the traced
// output directory existed but was left completely empty, silently breaking both the app's own
// database calls and electron/migrate.js). Copying it ourselves, resolved the same way Node
// actually resolves it, removes the guesswork — this becomes the authoritative copy regardless
// of whatever the tracer did or didn't do.

import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const standaloneDir = path.join(root, ".next", "standalone");
const require = createRequire(import.meta.url);

if (!existsSync(standaloneDir)) {
  console.error(`${standaloneDir} não existe — rode "next build" com output: "standalone" primeiro.`);
  process.exit(1);
}

const adapterEntry = require.resolve("@prisma/adapter-better-sqlite3");
const betterSqlite3PkgJson = require.resolve("better-sqlite3/package.json", {
  paths: [path.dirname(adapterEntry)],
});
const betterSqlite3Dir = path.dirname(betterSqlite3PkgJson);

const copies = [
  { from: path.join(root, "public"), to: path.join(standaloneDir, "public") },
  { from: path.join(root, ".next", "static"), to: path.join(standaloneDir, ".next", "static") },
  { from: betterSqlite3Dir, to: path.join(standaloneDir, "node_modules", "better-sqlite3") },
];

for (const { from, to } of copies) {
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
  console.log(`Copiado ${path.relative(root, from)} -> ${path.relative(root, to)}`);
}
