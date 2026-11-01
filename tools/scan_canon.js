#!/usr/bin/env node
/**
 * scan_canon.js — 扫描文档里的日期与农历是否与 canon/dates.tsv 一致（2026-11-01）
 *
 * 用法：node tools/scan_canon.js [--dir 目录[,目录]]
 * 默认扫描：docs/、MEDSystem/、MED_Demo Rule/、MED_考证索引/
 * 退出码：有冲突为 1
 */
const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const datesFile = path.join(repo, 'canon', 'dates.tsv');
if (!fs.existsSync(datesFile)) { console.error('缺少 canon/dates.tsv'); process.exit(2); }

const rows = fs.readFileSync(datesFile, 'utf8').trim().split(/\r?\n/).slice(1)
  .map((l) => l.split('\t')).filter((c) => c.length >= 2)
  .map((c) => ({ date: c[0], lunar: c[1] }));
const lunarSet = rows.map((r) => r.lunar);

const argIdx = process.argv.indexOf('--dir');
const dirs = (argIdx > -1 ? process.argv[argIdx + 1] : 'docs,MEDSystem,MED_Demo Rule,MED_考证索引')
  .split(',').map((d) => path.join(repo, d.trim()));

const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.md$/.test(e.name)) out.push(p);
  }
  return out;
};

let conflicts = 0, checked = 0;
for (const dir of dirs) {
  for (const file of walk(dir)) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      const re = /1942-(\d{2})-(\d{2})/g;
      let m;
      while ((m = re.exec(line))) {
        const date = `1942-${m[1]}-${m[2]}`;
        const expect = rows.find((r) => r.date === date);
        if (!expect) continue;
        checked++;
        // 取日期两侧各 14 字符作为配对窗口：窗口内出现期望农历即通过；
        // 期望农历缺席、却出现别的农历词才算冲突（兼容「腊月十五＝1942-01-31」倒装写法）
        const win = line.slice(Math.max(0, m.index - 14), m.index + m[0].length + 18);
        if (win.includes(expect.lunar)) continue;
        const wrong = lunarSet.filter((l) => l !== expect.lunar && win.includes(l));
        if (wrong.length) {
          console.log(`[冲突] ${path.relative(repo, file)}:${i + 1}  ${date} 应为「${expect.lunar}」，其附近出现「${wrong.join('」「')}」`);
          conflicts++;
        }
      }
    });
  }
}
console.log(`\n扫描完成：含日期的行 ${checked}，冲突 ${conflicts}`);
process.exit(conflicts ? 1 : 0);
