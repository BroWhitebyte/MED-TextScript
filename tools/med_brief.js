#!/usr/bin/env node
/**
 * med_brief.js — 一页写作简报（2026-11-01）
 * 用法：node tools/med_brief.js <代号>   例：node tools/med_brief.js 202
 * 读：events.json、canon/dates.tsv、canon/status.tsv、docs/清单.md、MED_考证索引/
 */
const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const code = (process.argv[2] || '').toUpperCase();
if (!code) { console.error('用法：node tools/med_brief.js <代号>'); process.exit(2); }

const readTsv = (p) => {
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').trim().split(/\r?\n/).slice(1)
    .map((l) => l.split('\t'));
};

const EV = JSON.parse(fs.readFileSync(path.join(repo, 'tools/med-canvas-verify/events.json'), 'utf8'));
const e = EV.events.find((x) => x.code.toUpperCase() === code || (x.alias || '').toUpperCase() === code);
if (!e) { console.error(`未登记代号：${code}（先跑 scan_events --write 或检查拼写）`); process.exit(1); }

const dates = readTsv(path.join(repo, 'canon/dates.tsv'));
const dRow = dates.find((c) => c[0] === e.date);
const status = readTsv(path.join(repo, 'canon/status.tsv'));
const sRows = status.filter((c) => (c[0] || '').includes(code) || (c[7] || '').includes(code));

const idxPath = path.join(repo, 'MED_考证索引', `${e.code}_索引.md`);
const idx = fs.existsSync(idxPath) ? `${e.code}_索引.md（已生成）` : '未生成';

const listPath = path.join(repo, 'docs/清单.md');
let listHits = [];
if (fs.existsSync(listPath)) {
  listHits = fs.readFileSync(listPath, 'utf8').split(/\r?\n/)
    .filter((l) => l.includes(code) && l.includes('|')).slice(0, 5);
}

console.log(`${e.code} ${e.title}`);
console.log(`${e.day} · ${e.date}${dRow ? ' ' + dRow[1] : ''} · ${e.segment || '—'}`);
console.log(`画布：${e.file}`);
console.log(`规模：${e.nodes} 节点 / ${e.links} 连线｜period ${e.period}`);
console.log(`索引：${idx}`);
if (sRows.length) {
  console.log('状态表：');
  for (const r of sRows) console.log(`  - ${r[0]} ${r[2]}${r[4] && r[4] !== '—' ? ' → ' + r[4] : ''}（${r[7] || ''}）`);
}
if (listHits.length) {
  console.log('清单相关：');
  for (const l of listHits) console.log('  ' + l.replace(/\|/g, '｜'));
}
