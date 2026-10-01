'use strict';
/* 从抗联 OCR 成果里按"书名关键字 + 页码"取原文
   用法: node kanglian_page.js "<书名关键字>" <页码[,页码...]> [--len=1200] [--root=D:\抗联整理_OCR成果]
   例:   node kanglian_page.js 服务纵横 106,110,112 --len=1200                              */
const fs = require('fs');
const path = require('path');

// 成果目录: --root= 优先, 其次环境变量 KL_ROOT, 再取存在的默认路径(I 盘, 拔走后落到 D 盘副本)
const rootArg = process.argv.find((a) => a.startsWith('--root='));
const root = [rootArg && rootArg.slice(7), process.env.KL_ROOT,
              'D:\\抗联整理_OCR成果', 'D:\\抗联整理_OCR成果'].filter(Boolean).find((r) => fs.existsSync(r));
if (!root) { console.log('  成果目录不存在(I 盘与 D 盘副本均未找到)'); process.exit(2); }
const positional = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const key = positional[0];
const pages = String(positional[1] || '').split(',').map((s) => parseInt(s, 10)).filter((n) => !isNaN(n));
const lenArg = process.argv.find((a) => a.startsWith('--len='));
const cap = lenArg ? parseInt(lenArg.slice(6), 10) : 1200;
const grepArg = process.argv.find((a) => a.startsWith('--grep='));
const grepWords = grepArg ? grepArg.slice(7).split('|') : null;
const maxHits = (() => { const a = process.argv.find((x) => x.startsWith('--hits=')); return a ? parseInt(a.slice(7), 10) : 2; })();

function findDirs(dir, depth) {
  if (depth > 6) return [];
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const p = path.join(dir, e.name);
    if (e.name.includes(key)) out.push(p);
    out = out.concat(findDirs(p, depth + 1));
  }
  return out;
}
const dirs = findDirs(root, 0);
if (!dirs.length) { console.log('  未找到书名含「' + key + '」的目录'); process.exit(2); }
for (const d of dirs) {
  const jl = fs.readdirSync(d).find((f) => f.endsWith('.pages.jsonl'));
  if (!jl) continue;
  console.log('  ▸ ' + path.basename(d));
  const recs = fs.readFileSync(path.join(d, jl), 'utf8').split(/\r?\n/).filter(Boolean);
  const parsed = recs.map((l) => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
  if (grepWords) {
    let hits = 0;
    for (const r of parsed) {
      const t = String(r.text || '');
      if (grepWords.some((w) => t.includes(w))) {
        console.log(`\n----- p${r.no}（命中 ${grepWords.filter((w) => t.includes(w)).join('/')}）-----`);
        console.log('  ' + t.replace(/\s+/g, ' ').trim().slice(0, cap));
        if (++hits >= maxHits) break;
      }
    }
    if (!hits) console.log('  （无关键词命中）');
    continue;
  }
  for (const n of pages) {
    const rec = parsed.find((r) => r.no === n);
    console.log(`\n===== ${path.basename(d).slice(0, 40)} p${n} =====`);
    console.log(rec ? '  ' + String(rec.text).replace(/\s+/g, ' ').trim().slice(0, cap) : '  （该页无记录）');
  }
}
