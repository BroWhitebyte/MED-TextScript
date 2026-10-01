'use strict';
/* ncanvas_flow.js —— 按阅读顺序导出画布全文（只读，无依赖）
 *
 * 用途：审查时要通读正文与台词，并按分支看清接线；本工具从 Entry 出发沿连线遍历，
 *       打印每个节点的 id／类型／正文或台词，Choice 节点列出各选项及其去向。
 *
 * 用法：
 *   node _tools\ncanvas_flow.js <画布.ncanvas|代号> [--notes-only] [--no-text] [--id n55] [--depth N]
 *
 * 选项：
 *   --notes-only  只打印 project.notes 与 variables（改稿先看设计意图）
 *   --no-text     只打印结构骨架（id／类型／连线），不打印正文
 *   --id <n>      只打印指定节点及其后续
 *   --depth <N>   限制遍历深度
 */
const fs = require('fs');
const path = require('path');

/* 登记表定位：仓库内 tools\med-canvas-verify\events.json，或工作区 .dsh\skills\med-canvas-verify\events.json */
const REG_CANDS = (() => {
  const out = [];
  let d = __dirname;
  for (let i = 0; i < 8; i++) {
    out.push(path.join(d, 'tools', 'med-canvas-verify', 'events.json'));
    out.push(path.join(d, '.dsh', 'skills', 'med-canvas-verify', 'events.json'));
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  return out;
})();
const REG_PATH = REG_CANDS.find((p) => fs.existsSync(p)) || REG_CANDS[0];
/* 登记表内路径的基准根：.dsh 形态 → 工作区根；tools 形态 → 仓库根 */
const ROOT = /[\\/]\.dsh[\\/]/.test(REG_PATH)
  ? REG_PATH.replace(/[\\/]\.dsh[\\/].*$/, '')
  : path.dirname(path.dirname(path.dirname(REG_PATH)));

const argv = process.argv.slice(2);
const opt = {};
const flags = new Set();
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  const m = a.match(/^--([A-Za-z-]+)=(.*)$/);
  if (m) { opt[m[1]] = m[2]; continue; }
  if (/^--/.test(a) && !/\.ncanvas$/i.test(a)) { flags.add(a.slice(2)); continue; }
  (opt._ = opt._ || []).push(a);
}
const has = (f) => flags.has(f);

function resolve(spec) {
  if (/\.ncanvas$/i.test(spec)) return fs.existsSync(spec) ? path.resolve(spec) : null;
  if (!fs.existsSync(REG_PATH)) return null;
  const reg = JSON.parse(fs.readFileSync(REG_PATH, 'utf8').replace(/^\uFEFF/, ''));
  const hit = (reg.events || []).find((e) => String(e.code).toUpperCase() === String(spec).toUpperCase()
    || String(e.alias || '').toUpperCase() === String(spec).toUpperCase());
  if (hit) return path.join(ROOT, hit.file);
  const un = (reg.unregistered || []).find((e) => e.name === spec);
  return un ? path.join(ROOT, un.file) : null;
}

function load(p) {
  const j = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
  const P = j.project || j;
  const N = {}; for (const n of P.nodes || []) N[n.id] = n;
  const out = {};
  for (const l of P.links || []) (out[l.from] = out[l.from] || []).push(l);
  return { P, N, out };
}

function dump(p) {
  const { P, N, out } = load(p);
  const base = path.basename(p, '.ncanvas');
  console.log('## ' + base);
  console.log('   notes：' + String(P.notes || '（无）').replace(/\n/g, '\n          '));
  console.log('   variables：' + (P.variables && Object.keys(P.variables).length ? JSON.stringify(P.variables) : '（空）'));
  if (has('notes-only')) return;

  const seen = new Set();
  const start = opt.id ? opt.id : (P.nodes.find((n) => n.type === 'Entry') || P.nodes[0] || {}).id;
  const maxDepth = opt.depth ? Number(opt.depth) : Infinity;

  const walk = (id, d, mark) => {
    const n = N[id];
    if (!n) { console.log('   '.repeat(d) + '✗ ' + id + '（节点不存在）'); return; }
    if (seen.has(id)) { console.log('   '.repeat(d) + '↩ ' + id + '（已出现，见上文）'); return; }
    seen.add(id);
    const pad = '   '.repeat(d) + (mark || '');
    if (has('no-text')) {
      console.log(pad + '[' + id + ' ' + n.type + ']');
    } else if (n.type === 'Dialog') {
      const turns = Array.isArray(n.turns) && n.turns.length ? n.turns : [{ speaker: '', line: n.body || '' }];
      for (const t of turns) console.log(pad + '[' + id + ' 对话] ' + (t.speaker ? t.speaker + '：' : '') + String(t.line || '').replace(/\n/g, ' / '));
    } else {
      console.log(pad + '[' + id + ' ' + n.type + '] ' + String(n.body || '').replace(/\n/g, ' / '));
    }
    const ls = out[id] || [];
    if (n.type === 'Choice') {
      for (const o of n.choiceOptions || []) {
        const l = ls.find((x) => x.choiceOptionId === o.id) || ls.find((x) => x.label === o.label);
        const ex = [];
        if (o.requires) ex.push('需:' + o.requires);
        if (o.effects && o.effects.length) ex.push('效:' + JSON.stringify(o.effects));
        console.log('   '.repeat(d) + '   ○ 「' + (o.label || '') + '」' + (ex.length ? ' [' + ex.join(' ') + ']' : '') + ' → ' + (l ? l.to : '未接线'));
      }
      if (!(n.choiceOptions || []).length) console.log('   '.repeat(d) + '   ○ （无 choiceOptions，退回 choices：' + JSON.stringify(n.choices || []) + '）');
    }
    if (d >= maxDepth) return;
    const targets = [];
    if (n.type === 'Choice') {
      for (const o of n.choiceOptions || []) {
        const l = ls.find((x) => x.choiceOptionId === o.id) || ls.find((x) => x.label === o.label);
        if (l) targets.push(l.to);
      }
    } else {
      for (const l of ls) targets.push(l.to);
    }
    for (const t of targets) walk(t, d + 1, '');
  };
  walk(start, 0, '');

  const rest = (P.nodes || []).filter((n) => !seen.has(n.id));
  if (rest.length) {
    console.log('   ── 未遍历节点（孤岛或笔记卡）：');
    for (const n of rest) {
      if (has('no-text')) console.log('      [' + n.id + ' ' + n.type + ']');
      else if (n.type === 'Dialog') for (const t of n.turns || []) console.log('      [' + n.id + ' 对话] ' + (t.speaker ? t.speaker + '：' : '') + String(t.line || ''));
      else console.log('      [' + n.id + ' ' + n.type + '] ' + String(n.body || '').replace(/\n/g, ' / '));
    }
  }
}

const specs = opt._ || [];
if (!specs.length) { console.error('用法：node _tools\\ncanvas_flow.js <画布.ncanvas|代号> [--notes-only] [--no-text] [--id n55]'); process.exit(2); }
for (const s of specs) {
  const p = resolve(s);
  if (!p) { console.error('✗ 找不到：' + s + '（代号需在 events.json 登记；新画布先跑 scan_events.js --write）'); process.exit(1); }
  dump(p);
}
