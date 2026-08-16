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
// running under. Next's file tracer bundles the adapter package's own JS straight into the
// server chunk (it never ends up as a real package under standalone/node_modules), so it can't
// be used as a resolution anchor — only the native binary gets copied out as a raw file, per the
// outputFileTracingIncludes glob in next.config.ts. npm may nest a separate better-sqlite3 copy
// under @prisma/adapter-better-sqlite3's own node_modules when it conflicts with another version
// elsewhere in the tree, so that nested location is tried first, matching next.config.ts.
function loadDatabase(standaloneDir) {
  const nodeModulesDir = path.join(standaloneDir, "node_modules");
  const candidatePaths = [
    path.join(nodeModulesDir, "@prisma", "adapter-better-sqlite3", "node_modules"),
    nodeModulesDir,
  ];
  return require(require.resolve("better-sqlite3", { paths: candidatePaths }));
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
