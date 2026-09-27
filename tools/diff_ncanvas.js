'use strict';
/* 两个 .ncanvas 的差异比对（找回丢失内容）
   用法: node diff_ncanvas.js <旧文件/备份> <新文件>                                       */
const fs = require('fs');

function load(f) {
  const doc = JSON.parse(fs.readFileSync(f, 'utf8'));
  const map = new Map();
  for (const n of doc.project.nodes) {
    let text = String(n.body || '');
    if (Array.isArray(n.turns) && n.turns.length) text = n.turns.map((t) => `${t.speaker}: ${t.line}`).join('\n');
    if (Array.isArray(n.choices) && n.choices.length && !text) text = '［选项］' + n.choices.join(' / ');
    map.set(n.id, { type: n.type, text, chars: text.replace(/\s/g, '').length });
  }
  return { doc, map, links: (doc.project.links || []).map((l) => `${l.from}>${l.to}`) };
}

const A = load(process.argv[2]);
const B = load(process.argv[3]);
console.log(`旧：${A.map.size} 节点 / ${[...A.map.values()].reduce((s, v) => s + v.chars, 0)} 字`);
console.log(`新：${B.map.size} 节点 / ${[...B.map.values()].reduce((s, v) => s + v.chars, 0)} 字`);

const removed = [...A.map.keys()].filter((k) => !B.map.has(k));
const added = [...B.map.keys()].filter((k) => !A.map.has(k));
console.log(`\n只在旧文件里的节点 ${removed.length} 个：`);
for (const k of removed) {
  const v = A.map.get(k);
  console.log(`  ■ ${k}（${v.type}，${v.chars} 字）原文：`);
  console.log('    ' + v.text.split('\n').join('\n    '));
}
console.log(`\n只在新文件里的节点 ${added.length} 个：${added.join(', ') || '（无）'}`);

console.log('\n同 id 但正文变短的节点（丢失嫌疑）：');
let lost = 0;
for (const [k, va] of A.map) {
  const vb = B.map.get(k);
  if (!vb) continue;
  if (vb.chars < va.chars) {
    lost += va.chars - vb.chars;
    console.log(`  ▼ ${k}（${va.type}）${va.chars} → ${vb.chars} 字，少 ${va.chars - vb.chars}`);
    console.log(`    旧：${va.text.replace(/\n/g, ' ⏎ ').slice(0, 300)}`);
    console.log(`    新：${vb.text.replace(/\n/g, ' ⏎ ').slice(0, 300)}`);
  }
}
const netA = [...A.map.values()].reduce((s, v) => s + v.chars, 0);
const netB = [...B.map.values()].reduce((s, v) => s + v.chars, 0);
console.log(`\n正文净变化：${netB - netA} 字${netB < netA ? '  ❗净减少（合并本不该减少正文）' : ''}`);
console.log(`连线条数：${A.links.length} → ${B.links.length}`);
const onlyA = A.links.filter((l) => !B.links.includes(l));
const onlyB = B.links.filter((l) => !A.links.includes(l));
if (onlyA.length) console.log('  仅在旧文件中的连线：' + onlyA.join(' '));
if (onlyB.length) console.log('  仅在新文件中的连线：' + onlyB.join(' '));
