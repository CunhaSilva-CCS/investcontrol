#!/usr/bin/env node
// Next's `output: "standalone"` build produces a minimal server.js but, by design, does not
// copy the public/ and .next/static/ folders into it (Next expects those to be served by a
// CDN in a typical deployment). We're serving them ourselves inside Electron, so copy them in
// manually, exactly as Next's own docs for standalone output instruct.

import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const standaloneDir = path.join(root, ".next", "standalone");

if (!existsSync(standaloneDir)) {
  console.error(`${standaloneDir} não existe — rode "next build" com output: "standalone" primeiro.`);
  process.exit(1);
}

const copies = [
  { from: path.join(root, "public"), to: path.join(standaloneDir, "public") },
  { from: path.join(root, ".next", "static"), to: path.join(standaloneDir, ".next", "static") },
];

for (const { from, to } of copies) {
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
  console.log(`Copiado ${path.relative(root, from)} -> ${path.relative(root, to)}`);
}
