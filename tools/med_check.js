#!/usr/bin/env node
/**
 * med_check.js — 画布体检一键跑（2026-11-01）
 *
 * 扫描 Flows 下 .ncanvas → 对比 events.json 登记 → 对照 MED_考证索引 →
 * 可选 --lint 逐件跑 med_verify（离线闸门）。
 *
 * 用法：
 *   node tools/med_check.js           只做登记/索引对账
 *   node tools/med_check.js --lint    追加逐件 lint（较慢）
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repo = path.resolve(__dirname, '..');
const evFile = path.join(repo, 'tools', 'med-canvas-verify', 'events.json');
const rulesFile = path.join(repo, 'tools', 'med-canvas-verify', 'rules.json');
const idxDir = path.join(repo, 'MED_考证索引');
const flows = path.join(repo, 'MEDNarrative', 'Flows');

if (!fs.existsSync(evFile)) { console.error('缺少 events.json'); process.exit(2); }
const EV = JSON.parse(fs.readFileSync(evFile, 'utf8'));
const rules = fs.existsSync(rulesFile) ? JSON.parse(fs.readFileSync(rulesFile, 'utf8')) : {};
const noIndex = new Set(((rules.noIndex || {}).codes) || []);

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.ncanvas')) out.push(p);
  }
  return out;
};
const rel = (p) => path.relative(repo, p).split(path.sep).join('/');

const canvases = walk(flows);
const registered = new Map(EV.events.map((e) => [e.file, e]));
const unregistered = canvases.filter((f) => !registered.has(rel(f)));
const coversInParent = (code) => {
  const parent = code.replace(/[A-Z]+$/, '');
  if (parent === code) return false;
  const p = path.join(idxDir, `${parent}_索引.md`);
  return fs.existsSync(p) && fs.readFileSync(p, 'utf8').includes(code);
};
const missingIndex = EV.events.filter(
  (e) => !noIndex.has(e.code)
    && !fs.existsSync(path.join(idxDir, `${e.code}_索引.md`))
    && !coversInParent(e.code)
);
const skipped = EV.events.filter((e) => noIndex.has(e.code));

console.log(`画布 ${canvases.length} 件｜登记 ${EV.events.length}｜索引 ${EV.events.length - missingIndex.length - skipped.length}｜按裁定不索引 ${skipped.length}`);

if (unregistered.length) {
  console.log(`\n[未登记] ${unregistered.length} 件（画布存在，events.json 无记录）`);
  for (const f of unregistered) console.log(`  - ${rel(f)}`);
} else {
  console.log('\n[未登记] 0');
}

if (missingIndex.length) {
  console.log(`\n[未索引] ${missingIndex.length} 件（登记了但没有 <代号>_索引.md）`);
  for (const e of missingIndex) console.log(`  - ${e.code} ${e.title}`);
} else {
  console.log('\n[未索引] 0');
}

if (noIndex.size) {
  console.log(`\n[按裁定不索引] ${[...noIndex].join(', ')}`);
}

if (process.argv.includes('--lint')) {
  const verifier = path.join(repo, 'tools', 'med-canvas-verify', 'med_verify.js');
  console.log('\n[lint] 逐件跑离线闸门…');
  let bad = 0;
  for (const e of EV.events) {
    if (noIndex.has(e.code)) continue;
    try {
      const out = execFileSync(process.execPath, [verifier, 'lint', '--event', e.code, '--all'], {
        cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
      });
      const m = out.match(/覆盖[：:].*?error\s*(\d+).*?warn\s*(\d+)/i) || out.match(/(\d+)\s*error.*?(\d+)\s*warn/i);
      console.log(`  ${e.code}: ${m ? `error ${m[1]} / warn ${m[2]}` : '通过'}`);
      if (m && Number(m[1]) > 0) bad++;
    } catch (err) {
      const msg = (err.stdout || err.stderr || '').toString().trim().split(/\r?\n/).slice(-1)[0] || err.message;
      console.log(`  ${e.code}: 失败（${msg.slice(0, 80)}）`);
      bad++;
    }
  }
  if (bad) { console.log(`\nlint 有问题的件：${bad}`); process.exit(1); }
}

process.exit(unregistered.length || missingIndex.length ? 1 : 0);
