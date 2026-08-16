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
// running under. scripts/copy-standalone-assets.mjs copies the actual (already Electron-rebuilt)
// package here explicitly after the build, and scripts/electron-after-pack.cjs moves it into
// this standard location once electron-builder is done packaging (see the comments in both for
// why it can't just live here from the start) — Next's own file tracer proved unreliable for
// this specific native module, so this fixed path is the one guaranteed-correct source.
function loadDatabase(standaloneDir) {
  return require(path.join(standaloneDir, "node_modules", "better-sqlite3"));
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
