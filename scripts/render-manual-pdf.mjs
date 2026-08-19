#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const markdown = fs.readFileSync(
  path.join(root, "docs/MANUAL-DO-USUARIO.md"),
  "utf8",
);
const esc = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (value) =>
  esc(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
const lines = markdown.split(/\r?\n/);
let html = "";
let index = 0;
let code = false;
let codeText = "";
while (index < lines.length) {
  const line = lines[index];
  if (line.startsWith("```")) {
    if (code) {
      html += `<pre><code>${esc(codeText)}</code></pre>`;
      codeText = "";
      code = false;
    } else code = true;
    index += 1;
    continue;
  }
  if (code) {
    codeText += `${line}\n`;
    index += 1;
    continue;
  }
  if (!line.trim()) {
    index += 1;
    continue;
  }
  if (line.startsWith("![")) {
    const match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (match)
      html += `<img src="file://${path.resolve(root, "docs", match[2])}" alt="${match[1]}">`;
    index += 1;
    continue;
  }
  if (/^#{1,2} /.test(line)) {
    const match = line.match(/^(#+) (.*)/);
    html += `<h${match[1].length}>${inline(match[2])}</h${match[1].length}>`;
    index += 1;
    continue;
  }
  if (line.startsWith("> ")) {
    html += `<blockquote>${inline(line.slice(2))}</blockquote>`;
    index += 1;
    continue;
  }
  if (line.startsWith("|")) {
    const rows = [];
    while (index < lines.length && lines[index].startsWith("|")) {
      if (!/^\|\s*-/.test(lines[index]))
        rows.push(
          lines[index]
            .split("|")
            .slice(1, -1)
            .map((cell) => cell.trim()),
        );
      index += 1;
    }
    if (rows.length)
      html += `<table><thead><tr>${rows[0].map((cell) => `<th>${inline(cell)}</th>`).join("")}</tr></thead><tbody>${rows
        .slice(1)
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join("")}</tr>`,
        )
        .join("")}</tbody></table>`;
    continue;
  }
  if (/^- /.test(line)) {
    const items = [];
    while (index < lines.length && /^- /.test(lines[index])) {
      items.push(`<li>${inline(lines[index].slice(2))}</li>`);
      index += 1;
    }
    html += `<ul>${items.join("")}</ul>`;
    continue;
  }
  if (/^\d+\. /.test(line)) {
    const items = [];
    while (index < lines.length && /^\d+\. /.test(lines[index])) {
      items.push(`<li>${inline(lines[index].replace(/^\d+\. /, ""))}</li>`);
      index += 1;
    }
    html += `<ol>${items.join("")}</ol>`;
    continue;
  }
  html += `<p>${inline(line)}</p>`;
  index += 1;
}
const css = `@page{size:A4;margin:17mm 15mm}*{box-sizing:border-box}body{margin:0;background:#fff;color:#20201d;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:10.5pt;line-height:1.5}.manual{max-width:180mm;margin:auto}h1{font-size:24pt;line-height:1.15;color:#70551d;border-bottom:2px solid #d4af37;padding-bottom:8px;margin:0 0 14px}h2{font-size:16pt;color:#70551d;border-bottom:1px solid #e4dccb;padding-bottom:4px;margin:24px 0 9px}h3{font-size:12pt;color:#70551d;margin:16px 0 6px}p{margin:6px 0}a{color:#70551d}strong{font-weight:700}code{background:#f3efe4;border-radius:3px;padding:1px 4px;font-family:ui-monospace,monospace;font-size:9pt}pre{background:#211d14;color:#f6f1e5;padding:10px;border-radius:5px;white-space:pre-wrap;font-size:8.5pt;line-height:1.4}blockquote{border-left:3px solid #d4af37;background:#faf8f2;padding:7px 10px;margin:10px 0;color:#5e594f}ul,ol{padding-left:22px;margin:6px 0}li{margin:2px 0}table{width:100%;border-collapse:collapse;margin:10px 0;font-size:9pt;break-inside:avoid}th{background:#f1ede2;color:#4d4638;text-align:left;font-weight:700}th,td{border:1px solid #ded7c9;padding:5px 6px;vertical-align:top}img{max-width:100%;max-height:75mm;display:block;margin:10px auto;object-fit:contain}h2,h3{break-after:avoid}`;
const htmlPath = path.join(root, "docs", ".manual-print.html");
fs.writeFileSync(
  htmlPath,
  `<!doctype html><html><head><meta charset="utf-8"><title>Manual do Usuário — Investe Valor</title><style>${css}</style></head><body><main class="manual">${html}</main></body></html>`,
);
console.log(htmlPath);
