'use strict';
/* 损失盘点：对每个 .ncanvas 报告 节点数/正文总量/悬空连线，并与备份目录中同名备份对比
   用法: node loss_report.js <x.ncanvas> [更多文件…] --bak=<备份目录>                       */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const bakIdx = args.findIndex((a) => a.startsWith('--bak='));
const bakDir = bakIdx >= 0 ? args[bakIdx].slice(6) : null;
const files = args.filter((a) => !a.startsWith('--bak='));

function stat(f) {
  const doc = JSON.parse(fs.readFileSync(f, 'utf8'));
  const nodes = (doc.project && doc.project.nodes) || [];
  const links = (doc.project && doc.project.links) || [];
  const ids = new Set(nodes.map((n) => n.id));
  const dangling = links.filter((l) => !ids.has(l.from) || !ids.has(l.to));
  let chars = 0;
  for (const n of nodes) {
    chars += String(n.body || '').replace(/\s/g, '').length;
    if (Array.isArray(n.turns)) for (const t of n.turns) chars += String((t && t.line) || '').replace(/\s/g, '').length;
    if (Array.isArray(n.choices)) chars += n.choices.join('').replace(/\s/g, '').length;
  }
  const ghosts = new Set();
  for (const l of dangling) { if (!ids.has(l.from)) ghosts.add(l.from); if (!ids.has(l.to)) ghosts.add(l.to); }
  return { nodes: nodes.length, links: links.length, chars, dangling: dangling.length, ghosts: [...ghosts], types: nodes.reduce((m, n) => { m[n.type] = (m[n.type] || 0) + 1; return m; }, {}) };
}

let baks = [];
if (bakDir && fs.existsSync(bakDir)) {
  baks = fs.readdirSync(bakDir).filter((f) => f.endsWith('.bak') || f.endsWith('.bak.ncanvas'));
}

for (const f of files) {
  const base = path.basename(f);
  let cur;
  try { cur = stat(f); } catch (e) { console.log(`ERR ${base} — ${e.message}`); continue; }
  const hit = baks.filter((b) => b.startsWith(base + '.')).sort().pop();
  let line = `${cur.dangling ? '✘' : '✔'} ${base}\n     当前：节点 ${cur.nodes}｜连线 ${cur.links}｜正文 ${cur.chars} 字｜悬空连线 ${cur.dangling}${cur.ghosts.length ? '（指向 ' + cur.ghosts.join(',') + '）' : ''}\n     类型：${JSON.stringify(cur.types)}`;
  if (hit) {
    try {
      const b = stat(path.join(bakDir, hit));
      const dn = cur.nodes - b.nodes;
      const dc = cur.chars - b.chars;
      line += `\n     备份 ${hit.slice(-22)}：节点 ${b.nodes}｜正文 ${b.chars} 字  →  差 ${dn >= 0 ? '+' : ''}${dn} 节点 / ${dc >= 0 ? '+' : ''}${dc} 字${dc < 0 ? '  ❗正文减少' : ''}`;
    } catch (e) { line += `\n     备份读取失败：${e.message}`; }
  } else if (bakDir) {
    line += `\n     （备份目录中无 ${base} 的快照）`;
  }
  console.log(line);
}
