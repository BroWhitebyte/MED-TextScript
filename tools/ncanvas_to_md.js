'use strict';
/* .ncanvas → Markdown（事件件体）
   用法: node ncanvas_to_md.js <x.ncanvas> <out.md> [--title "<# 行标题>"]
   处理：多选项（按 choices/choiceIndex 排序）、合流（⤴ 见上文）、回环（⤴ 循环）、多终点、孤立节点。
   每拍带 <!-- id type --> 注释，便于对照画布查逻辑。                                        */
const fs = require('fs');
const path = require('path');

const src = process.argv[2];
const out = process.argv[3];
if (!src || !out) { console.error('usage: node ncanvas_to_md.js <x.ncanvas> <out.md>'); process.exit(2); }

const doc = JSON.parse(fs.readFileSync(src, 'utf8'));
const nodes = doc.project.nodes || [];
const links = doc.project.links || [];
const byId = new Map(nodes.map((n) => [n.id, n]));

/* ---- 出边按 choiceIndex（无则原序）排序 ---- */
const outLinks = new Map();
for (const l of links) {
  if (!outLinks.has(l.from)) outLinks.set(l.from, []);
  outLinks.get(l.from).push(l);
}
for (const [k, arr] of outLinks) {
  arr.sort((a, b) => {
    const ai = typeof a.choiceIndex === 'number' ? a.choiceIndex : 999;
    const bi = typeof b.choiceIndex === 'number' ? b.choiceIndex : 999;
    return ai - bi;
  });
}
const inDeg = new Map();
for (const l of links) inDeg.set(l.to, (inDeg.get(l.to) || 0) + 1);

const root = nodes.find((n) => n.id === 'n_entry') ? 'n_entry' : (nodes[0] && nodes[0].id);
const summary = (n) => {
  if (!n) return '';
  const t = (n.body || '').replace(/\s+/g, ' ').trim() || (Array.isArray(n.choices) ? n.choices.join('/') : '');
  return t.slice(0, 26) + (t.length > 26 ? '…' : '');
};
const typeCount = nodes.reduce((m, n) => { m[n.type] = (m[n.type] || 0) + 1; return m; }, {});
const branchPoints = [...outLinks.entries()].filter(([id, arr]) => arr.length > 1 && byId.get(id) && byId.get(id).type === 'Choice');
const ends = nodes.filter((n) => n.type === 'End');

/* ---- 头部：从 project.title / notes 解析 ---- */
const title = doc.project.title || path.basename(src, '.ncanvas');
const tm = /^Event\s*([0-9]+[A-Za-z]?)\s*(.*)$/.exec(title);
const num = tm ? tm[1] : '???';
const name = tm ? tm[2] : title;
const notes = String(doc.project.notes || '');

const mDate = /(19\d{2}年\d{1,2}月\d{1,2}日)/.exec(notes);
const mKind = /（([^（）]*(?:固定|主线|支线|自由)[^（）]*)）/.exec(notes);
const mPeople = /人物：([^｜|]+)/.exec(notes);
let seg = '';
if (mDate) {
  const after = notes.slice(notes.indexOf(mDate[1]) + mDate[1].length);
  seg = (after.split(/[｜|]/)[0] || '').trim();
}
let place = '';
if (mDate) {
  const parts = notes.split(/[｜|]/);
  const pi = parts.findIndex((p) => /19\d{2}年/.test(p));
  if (pi >= 0 && parts[pi + 1]) place = parts[pi + 1].replace(/）.*$/, '').trim();
}

const L = [];
L.push(`# MED Event ${num} ${name}`);
L.push('');
L.push('- 时间');
L.push('');
L.push(mKind ? `（${mKind[1]}）` : '（见下方画布 notes）');
if (mDate) L.push(mDate[1]);
if (seg) L.push(seg);
L.push('');
L.push('- 地点');
L.push('');
L.push(place || '（见下方画布 notes）');
L.push('');
L.push('- 人物');
L.push('');
if (mPeople) {
  for (const p of mPeople[1].split(/、|；|;/).map((s) => s.trim()).filter(Boolean)) L.push(p);
} else {
  L.push('（见下方画布 notes）');
}
L.push('');
L.push(`> **来源**：由画布反向转换 —— \`${path.basename(src)}\`｜${new Date().toISOString().slice(0, 19).replace('T', ' ')}`);
L.push(`> **结构**：节点 ${nodes.length}／连线 ${links.length}｜分支点 ${branchPoints.length} 处｜终点 ${ends.length} 个｜${Object.entries(typeCount).map(([k, v]) => `${k} ${v}`).join('｜')}`);
L.push(`> **画布 notes**：${notes}`);
L.push('');
L.push('---');
L.push('');

/* ---- 遍历 ---- */
const emitted = new Set();
const stack = [];
const lines = L;
let beatCount = 0;

function emitBeat(node) {
  beatCount += 1;
  lines.push(`<!-- ${node.id} ${node.type} -->`);
  if (node.type === 'Content') {
    lines.push(String(node.body || '').trim());
  } else if (node.type === 'Dialog') {
    const turns = Array.isArray(node.turns) && node.turns.length
      ? node.turns
      : String(node.body || '').split('\n').filter((s) => s.trim()).map((s) => {
        const i = s.indexOf(':');
        return i > 0 ? { speaker: s.slice(0, i).trim(), line: s.slice(i + 1).trim() } : { speaker: '', line: s };
      });
    for (const t of turns) lines.push(`${t.speaker ? t.speaker + '：' : ''}${t.line}`);
  } else if (node.type === 'Choice') {
    const b = String(node.body || '').trim();
    if (b) lines.push(b);
  }
  lines.push('');
}

function walk(id, depth) {
  const node = byId.get(id);
  if (!node) { lines.push(`> ⚠ 缺失节点：${id}`); lines.push(''); return; }
  if (stack.indexOf(id) >= 0) {
    lines.push(`> ⤴ 循环：回到本分支上文「${summary(node)}」（${id}）`);
    lines.push('');
    return;
  }
  if (emitted.has(id)) {
    lines.push(`> ⤴ 合流：接上文「${summary(node)}」（${id}）`);
    lines.push('');
    return;
  }
  emitted.add(id);
  stack.push(id);

  if (node.type !== 'Entry') emitBeat(node);

  const outs = outLinks.get(id) || [];
  if (outs.length === 0) {
    if (node.type !== 'Entry') {
      lines.push(node.type === 'End' ? `**■ 终点 ${id}**` : `**■ 链尾 ${id}**`);
      lines.push('');
    }
  } else if (node.type === 'Choice' || outs.length > 1) {
    const labels = Array.isArray(node.choices) && node.choices.length ? node.choices : outs.map((o) => o.label || '');
    lines.push('## 玩家选择：');
    lines.push('');
    // 先按 choiceIndex 对齐写全部选项（含尚未接线的，避免静默漏项），再补无 choiceIndex 的出边
    const used = new Set();
    for (let i = 0; i < labels.length; i++) {
      const link = outs.find((o) => o.choiceIndex === i) || null;
      const lab = labels[i] || (link && link.label) || `（选项${i + 1}）`;
      lines.push(`### ${lab}`);
      lines.push('');
      if (link) {
        used.add(link);
        walk(link.to, depth + 1);
      } else {
        lines.push('> ⚠ 该选项在画布中尚未接线（无出边）');
        lines.push('');
      }
    }
    const rest = outs.filter((o) => !used.has(o) && typeof o.choiceIndex !== 'number');
    const seenRest = new Set();
    for (const o of rest) {
      const lab = o.label || '（无标签）';
      if (seenRest.has(lab)) continue;
      seenRest.add(lab);
      lines.push(`### ${lab}`);
      lines.push('');
      walk(o.to, depth + 1);
    }
  } else {
    walk(outs[0].to, depth);
  }
  stack.pop();
}

walk(root, 0);

/* ---- 未接入主干的节点 ---- */
const orphans = nodes.filter((n) => !emitted.has(n.id) && n.type !== 'Entry');
if (orphans.length) {
  lines.push('---');
  lines.push('');
  lines.push(`## 未接入主干（画布中孤立，共 ${orphans.length} 个）`);
  lines.push('');
  for (const n of orphans) {
    lines.push(`<!-- ${n.id} ${n.type} -->`);
    if (n.type === 'Content') lines.push(String(n.body || '').trim());
    else if (n.type === 'Dialog') {
      for (const t of (n.turns || [])) lines.push(`${t.speaker ? t.speaker + '：' : ''}${t.line}`);
    } else if (n.type === 'Choice') lines.push(`（选择：${(n.choices || []).join(' / ')}）`);
    lines.push('');
  }
}

fs.writeFileSync(out, lines.join('\n').replace(/\n{3,}/g, '\n\n'), 'utf8');

console.log('written:', out);
console.log(`  beats=${beatCount}  nodes=${nodes.length}  emitted=${emitted.size}  orphans=${orphans.length}`);
console.log(`  branches=${branchPoints.length}  ends=${ends.length}  lines=${lines.length}`);
