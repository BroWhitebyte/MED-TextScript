'use strict';
/* ncanvas_metrics.js —— 画布文字量与时长估算（只读，无依赖）
 *
 * 用途：给每个事件件的「硬性审查结论」提供文字量与时长参数。
 *   总文字量 / 陈述文字量 / 对话文字量 / 选择肢数量 / 选择肢长度 / 完成时长估算
 *
 * 用法：
 *   node _tools\ncanvas_metrics.js <画布.ncanvas|代号> [...]     # 指定件（给单件时附明细）
 *   node _tools\ncanvas_metrics.js --all                        # 登记表全部编号件
 *   node _tools\ncanvas_metrics.js --all --with-unregistered     # 连未编号件一起（不含 DE 参考件）
 *   node _tools\ncanvas_metrics.js --all --json                  # 机读输出
 *
 * 口径（与《审查与索引_prompt逻辑与调用惯例.md》§4.3 一致）：
 *   · 陈述 = 非 Dialog 节点的 body（Content / End 等），不含以【】开头的内部卡
 *   · 对话 = Dialog 节点的 turns[].line（说话人名字属 UI 标签，不计入文字量）
 *   · 选择肢 = Choice 节点 choiceOptions[].label（缺则退回 choices[]）
 *   · 内部卡（【结算】【转场】【提示】【占位】等）单独计数，不进正文
 *   · 字数按非空白字符计（含标点）
 *   · 时长 = 阅读（基准 300 字/分；快 400／慢 250）＋ 翻页（1.5 秒/文本屏）
 *          ＋ 选择点（4 秒/处）＋ 选项比较（1.0 秒/项）
 *   上述常数可用 --speed / --page / --choice 覆盖。
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
  if (/^--/.test(a)) { flags.add(a.slice(2)); continue; }
  (opt._ = opt._ || []).push(a);
}
const has = (f) => flags.has(f);
const num = (v, d) => (v === undefined || isNaN(Number(v)) ? d : Number(v));

const SPEED = { base: num(opt.speed, 300), fast: num(opt['speed-fast'], 400), slow: num(opt['speed-slow'], 250) };
const COST = { page: num(opt.page, 1.5), choice: num(opt.choice, 4), option: num(opt.option, 1.0) };

const clen = (s) => String(s || '').replace(/\s/g, '').length;
const isCard = (s) => /^【/.test(String(s || '').trim());
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

function measure(p) {
  const j = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
  const P = j.project || j;
  const nodes = P.nodes || [];
  const base = path.basename(p, '.ncanvas');
  const m = base.match(/Event\s*(\d{2,3}[A-Z]?)/i);

  let narration = 0, dialogue = 0, optionChars = 0, cardChars = 0;
  let screens = 0, choicePoints = 0, optionCount = 0;
  const optLens = [];
  const biggest = [];

  for (const n of nodes) {
    const body = String(n.body || '');
    if (n.type === 'Dialog') {
      const lines = Array.isArray(n.turns) && n.turns.length ? n.turns.map((t) => t.line || '') : [body];
      const c = lines.reduce((a, s) => a + clen(s), 0);
      dialogue += c;
      if (c) { screens++; biggest.push([n.id, '对话', c]); }
      continue;
    }
    if (n.type === 'Choice') {
      const opts = Array.isArray(n.choiceOptions) && n.choiceOptions.length
        ? n.choiceOptions.map((o) => o.label || '')
        : (Array.isArray(n.choices) ? n.choices : []);
      choicePoints++;
      for (const l of opts) { const c = clen(l); optionChars += c; optionCount++; optLens.push(c); }
      if (clen(body)) { narration += clen(body); screens++; biggest.push([n.id, '选择·正文', clen(body)]); }
      else if (body) { cardChars += clen(body); }
      continue;
    }
    if (isCard(body)) { cardChars += clen(body); continue; }
    const c = clen(body);
    if (c) { narration += c; screens++; biggest.push([n.id, n.type === 'End' ? '结束' : '陈述', c]); }
  }

  const body_total = narration + dialogue;
  const total = body_total + optionChars;
  const readSec = (speed) => (total / speed) * 60;
  const interactSec = screens * COST.page + choicePoints * COST.choice + optionCount * COST.option;
  const dur = (speed) => (readSec(speed) + interactSec) / 60;

  biggest.sort((a, b) => b[2] - a[2]);

  return {
    code: m ? m[1].toUpperCase() : base,
    name: base,
    file: p.split(path.sep).join('/'),
    nodes: nodes.length,
    links: (P.links || []).length,
    narration, dialogue, optionChars, cardChars,
    body_total, total,
    screens, choicePoints, optionCount,
    optMin: optLens.length ? Math.min(...optLens) : 0,
    optMax: optLens.length ? Math.max(...optLens) : 0,
    optAvg: optLens.length ? Math.round(optionChars / optLens.length) : 0,
    dialShare: pct(dialogue, body_total),
    cardShare: pct(cardChars, cardChars + total),
    minutes: { base: dur(SPEED.base), fast: dur(SPEED.fast), slow: dur(SPEED.slow) },
    readShare: pct(readSec(SPEED.base), readSec(SPEED.base) + interactSec),
    top: biggest.slice(0, 5),
  };
}

function fmtMin(x) {
  const t = Math.round(x * 10) / 10;
  return (t >= 10 ? String(Math.round(t)) : String(t)) + ' 分';
}

function table(rows) {
  const head = ['代号', '节点', '陈述字', '对话字', '正文合计', '选项数', '选项字', '均长', '总文字量', '陈述/对话', '时长(基准)', '区间'];
  const lines = [head.join(' | ')];
  lines.push(head.map(() => '---').join(' | '));
  let t = { narration: 0, dialogue: 0, body_total: 0, optionCount: 0, optionChars: 0, total: 0, base: 0, fast: 0, slow: 0 };
  for (const r of rows) {
    lines.push([
      '`' + r.code + '`', r.nodes, r.narration, r.dialogue, r.body_total,
      r.optionCount, r.optionChars, r.optAvg, r.total,
      r.dialShare + '% 对话',
      fmtMin(r.minutes.base), fmtMin(r.minutes.fast) + ' – ' + fmtMin(r.minutes.slow),
    ].join(' | '));
    t.narration += r.narration; t.dialogue += r.dialogue; t.body_total += r.body_total;
    t.optionCount += r.optionCount; t.optionChars += r.optionChars; t.total += r.total;
    t.base += r.minutes.base; t.fast += r.minutes.fast; t.slow += r.minutes.slow;
  }
  lines.push(['**合计**', rows.reduce((a, r) => a + r.nodes, 0), t.narration, t.dialogue, t.body_total,
    t.optionCount, t.optionChars, t.optionCount ? Math.round(t.optionChars / t.optionCount) : 0, t.total,
    pct(t.dialogue, t.body_total) + '% 对话', fmtMin(t.base), fmtMin(t.fast) + ' – ' + fmtMin(t.slow)].join(' | '));
  return lines.join('\n');
}

/* ── 取件 ───────────────────────────────────────────── */
let targets = [];
if (has('all')) {
  if (!fs.existsSync(REG_PATH)) { console.error('✗ 找不到登记表：' + REG_PATH + '\n  先跑：node ".dsh\\skills\\med-canvas-verify\\scan_events.js" --write'); process.exit(2); }
  const reg = JSON.parse(fs.readFileSync(REG_PATH, 'utf8').replace(/^\uFEFF/, ''));
  targets = reg.events.map((e) => ({ code: e.code, file: path.join(ROOT, e.file) }));
  if (has('with-unregistered')) {
    for (const e of reg.unregistered || []) {
      if (/DiscoElysium|discoelysium/i.test(e.name)) continue;   // 参考导入件不计
      targets.push({ code: e.name, file: path.join(ROOT, e.file) });
    }
  }
} else {
  const specs = opt._ || [];
  if (!specs.length) { console.error('用法：node _tools\\ncanvas_metrics.js <画布.ncanvas|代号> [...] ｜ --all [--with-unregistered] [--json]'); process.exit(2); }
  const reg = fs.existsSync(REG_PATH) ? JSON.parse(fs.readFileSync(REG_PATH, 'utf8').replace(/^\uFEFF/, '')) : { events: [] };
  for (const s of specs) {
    if (/\.ncanvas$/i.test(s) && fs.existsSync(s)) { targets.push({ code: '', file: path.resolve(s) }); continue; }
    const hit = (reg.events || []).find((e) => String(e.code).toUpperCase() === String(s).toUpperCase() || String(e.alias || '').toUpperCase() === String(s).toUpperCase());
    if (!hit) { console.error('✗ 代号「' + s + '」不在登记表；可用：' + (reg.events || []).map((e) => e.code).join('、')); process.exit(1); }
    targets.push({ code: hit.code, file: path.join(ROOT, hit.file) });
  }
}

const rows = [];
for (const t of targets) {
  if (!fs.existsSync(t.file)) { console.error('✗ 文件不存在：' + t.file); continue; }
  rows.push(measure(t.file));
}

if (has('json')) { console.log(JSON.stringify(rows, null, 1)); process.exit(0); }

console.log(table(rows));

if (rows.length === 1) {
  const r = rows[0];
  console.log('\n### ' + r.code + '　' + r.name);
  console.log('- 文件：`' + r.file + '`｜节点 ' + r.nodes + '｜连线 ' + r.links);
  console.log('- 陈述 ' + r.narration + ' 字｜对话 ' + r.dialogue + ' 字（占正文 ' + r.dialShare + '%）｜正文合计 ' + r.body_total + ' 字');
  console.log('- 选择点 ' + r.choicePoints + ' 处／选项 ' + r.optionCount + ' 项／选项文字 ' + r.optionChars + ' 字（均长 ' + r.optAvg + '，最短 ' + r.optMin + '，最长 ' + r.optMax + '）');
  console.log('- 内部卡 ' + r.cardChars + ' 字（不进正文；占全部文本 ' + r.cardShare + '%）｜文本屏 ' + r.screens + ' 屏');
  const iSec = r.screens * COST.page + r.choicePoints * COST.choice + r.optionCount * COST.option;
  console.log('- 时长＝阅读 ' + fmtMin(r.minutes.base * (r.readShare / 100)) + '（占 ' + r.readShare + '%）＋交互 ' + Math.round(iSec) + ' 秒'
    + '　→　基准 ' + fmtMin(r.minutes.base) + '｜快 ' + fmtMin(r.minutes.fast) + '｜慢 ' + fmtMin(r.minutes.slow));
  console.log('- 最长文本节点：' + r.top.map(([id, k, c]) => id + '(' + k + ' ' + c + '字)').join('、'));
}

if (has('all')) {
  const totalCards = rows.reduce((a, r) => a + r.cardChars, 0);
  const totalOptions = rows.reduce((a, r) => a + r.optionCount, 0);
  const cp = rows.reduce((a, r) => a + r.choicePoints, 0);
  console.log('\n口径：陈述＝非 Dialog 节点 body（不含【】内部卡）；对话＝turns[].line（不含说话人名）；'
    + '选择肢＝choiceOptions[].label；字数按非空白字符计。');
  console.log('时长＝阅读（' + SPEED.base + ' 字/分基准，快 ' + SPEED.fast + '／慢 ' + SPEED.slow + '）＋ 翻页 ' + COST.page
    + ' 秒/屏 ＋ 选择点 ' + COST.choice + ' 秒/处 ＋ 选项 ' + COST.option + ' 秒/项。');
  console.log('全库：选择点 ' + cp + ' 处／选项 ' + totalOptions + ' 项／内部卡 ' + totalCards + ' 字。');
}
