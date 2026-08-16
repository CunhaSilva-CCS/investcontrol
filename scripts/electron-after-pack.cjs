"use strict";
// electron-builder applies its own npm-dependency-aware pruning to every directory named
// node_modules that it copies via extraResources, keyed off the root project's package.json:
// packages that resolve back to a *direct* dependency there (next, react, ...) survive, but
// better-sqlite3 — needed by electron/migrate.js and by the Next server itself at runtime —
// isn't one (only @prisma/adapter-better-sqlite3 is), so electron-builder silently dropped it
// even though scripts/copy-standalone-assets.mjs had copied it in correctly. That script instead
// writes it under standalone/vendor-native/node_modules, a name the pruning doesn't recognize,
// so it survives packaging intact.
//
// The Next server's bundled code still does a plain require("better-sqlite3") internally (via
// the Prisma adapter), which only resolves through a directory actually named node_modules that
// is an *ancestor* of the requiring file — vendor-native/node_modules doesn't qualify, since it
// sits as a sibling of .next/server, not a parent. So once packaging (and its pruning pass) is
// done, merge it into the standard standalone/node_modules where both the server and
// electron/migrate.js expect to find it via ordinary Node module resolution. This must be a
// merge, not a wholesale replace: standalone/node_modules already legitimately contains next,
// react, and everything else that *did* survive the pruning pass, and blowing that away would
// trade "better-sqlite3 missing" for "next itself missing".

const fs = require("node:fs");
const path = require("node:path");

exports.default = async function afterPack(context) {
  const { appOutDir, electronPlatformName } = context;

  const resourcesDir =
    electronPlatformName === "darwin"
      ? path.join(appOutDir, fs.readdirSync(appOutDir).find((f) => f.endsWith(".app")), "Contents", "Resources")
      : path.join(appOutDir, "resources");

  const standaloneDir = path.join(resourcesDir, "standalone");
  const vendorNodeModules = path.join(standaloneDir, "vendor-native", "node_modules");
  const targetNodeModules = path.join(standaloneDir, "node_modules");

  if (!fs.existsSync(vendorNodeModules)) {
    throw new Error(`afterPack: ${vendorNodeModules} não existe — o build:standalone rodou antes do empacotamento?`);
  }

  fs.mkdirSync(targetNodeModules, { recursive: true });
  for (const name of fs.readdirSync(vendorNodeModules)) {
    fs.rmSync(path.join(targetNodeModules, name), { recursive: true, force: true });
    fs.renameSync(path.join(vendorNodeModules, name), path.join(targetNodeModules, name));
  }
  fs.rmSync(path.join(standaloneDir, "vendor-native"), { recursive: true, force: true });
};
