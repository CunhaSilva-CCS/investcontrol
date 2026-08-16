"use strict";
// Applies the SQL migrations in prisma/migrations/*/migration.sql, in order, to a brand-new
// SQLite file. Only runs anything when the database file doesn't exist yet — every Electron
// install starts from an empty database, so there's no need to bundle the Prisma CLI (or track
// which migrations already ran) just to create the schema once on first launch.
//
// This intentionally does not handle applying *new* migrations to an *existing* database across
// app updates — out of scope for v1, since there have been no released versions to upgrade from
// yet. A future update mechanism will need real incremental migration tracking.

const fs = require("node:fs");
const path = require("node:path");

// better-sqlite3 is a native addon and must match the Electron (not system Node) ABI it's
// running under. The copy inside the traced standalone bundle is the one rebuilt for Electron
// (see the electron-rebuild step in package.json's build:standalone script). npm may nest a
// separate better-sqlite3 copy under @prisma/adapter-better-sqlite3's own node_modules when it
// conflicts with another version elsewhere in the tree — resolving through the adapter package,
// the same way Prisma itself does, guarantees this loads the exact binding the running app uses
// instead of guessing a top-level path that might hold an unrelated, unrebuilt copy.
function loadDatabase(standaloneDir) {
  const adapterEntry = require.resolve("@prisma/adapter-better-sqlite3", {
    paths: [path.join(standaloneDir, "node_modules")],
  });
  return require(require.resolve("better-sqlite3", { paths: [path.dirname(adapterEntry)] }));
}

function ensureDatabase(dbPath, migrationsDir, standaloneDir) {
  if (fs.existsSync(dbPath)) return;

  const Database = loadDatabase(standaloneDir);
  const db = new Database(dbPath);
  try {
    const migrationFolders = fs
      .readdirSync(migrationsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    for (const folder of migrationFolders) {
      const sqlPath = path.join(migrationsDir, folder, "migration.sql");
      if (!fs.existsSync(sqlPath)) continue;
      db.exec(fs.readFileSync(sqlPath, "utf8"));
    }
  } finally {
    db.close();
  }
}

module.exports = { ensureDatabase };
