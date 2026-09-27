'use strict';
/* 画布流量审计：begin→end 通顺性（v2）
   硬问题（计入失败）：
     ① 孤岛：从 Entry 到不了的节点（排除纯笔记卡）
     ② 死路：文件里存在 End 时，能到达却走不到任何 End 的节点
     ③ 悬空连线：指向不存在节点
     ④ 未接线选项：Choice 的选项既无同号出边、也无同名 label 出边
     ⑤ 选项编号异常：同一 Choice 的出边 choiceIndex 重复
     ⑥ 结构：Entry ≠ 1、Entry 无出边
   提示（不计入失败）：
     · 文件没有 End（跨件接续体）——只列出链尾，便于人工确认接续目标
   用法: node audit_flow.js <x.ncanvas> [...]                                                  */
const fs = require('fs');
const path = require('path');

const isNote = (n) => {
  const t = (n.body || '').trim();
  return /^【/.test(t) || /^1、/.test(t) || /^（待|^待写|^【占位/.test(t);
};
const preview = (n) => {
  const t = (n.body || '').replace(/\s+/g, ' ').trim() || (Array.isArray(n.choices) ? '［选项］' + n.choices.join('/') : '');
  return t.slice(0, 26) + (t.length > 26 ? '…' : '');
};
const norm = (s) => String(s || '').replace(/[\s。，、；：！？…“”‘’（）《》\-—\.\*\|#>\uFF1A]/g, '');

let bad = 0;
const files = process.argv.slice(2);
if (!files.length) { console.error('usage: node audit_flow.js <x.ncanvas> [...]'); process.exit(2); }

for (const f of files) {
  const name = path.basename(f);
  let doc;
  try { doc = JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch (e) { console.log(`✘ ${name} — 解析失败：${e.message}`); bad++; continue; }

  const nodes = (doc.project && doc.project.nodes) || [];
  const links = (doc.project && doc.project.links) || [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const ids = new Set(byId.keys());
  const out = new Map(), inn = new Map();
  for (const l of links) {
    if (!out.has(l.from)) out.set(l.from, []);
    out.get(l.from).push(l);
    if (!inn.has(l.to)) inn.set(l.to, []);
    inn.get(l.to).push(l);
  }

  const entries = nodes.filter((n) => n.type === 'Entry');
  const ends = nodes.filter((n) => n.type === 'End');
  const entry = entries[0] || nodes[0];
  const hasEnd = ends.length > 0;

  const reach = new Set();
  if (entry) {
    const q = [entry.id]; reach.add(entry.id);
    while (q.length) { const c = q.shift(); for (const l of (out.get(c) || [])) if (!reach.has(l.to)) { reach.add(l.to); q.push(l.to); } }
  }
  const live = new Set();
  { const q = ends.map((e) => e.id); for (const id of q) live.add(id);
    while (q.length) { const c = q.shift(); for (const l of (inn.get(c) || [])) if (!live.has(l.from)) { live.add(l.from); q.push(l.from); } } }

  const orphans = nodes.filter((n) => n.type !== 'Entry' && !reach.has(n.id));
  const orphansReal = orphans.filter((n) => !isNote(n));
  const orphansNote = orphans.filter(isNote);
  const deadEnds = hasEnd ? nodes.filter((n) => reach.has(n.id) && n.type !== 'End' && !live.has(n.id)) : [];
  const tails = nodes.filter((n) => n.type !== 'End' && (out.get(n.id) || []).length === 0);
  const dangling = links.filter((l) => !ids.has(l.from) || !ids.has(l.to));

  const unlinked = [];
  const dupIdx = [];
  for (const n of nodes) {
    if (n.type !== 'Choice' || !Array.isArray(n.choices)) continue;
    const outs = out.get(n.id) || [];
    const idxs = outs.filter((l) => typeof l.choiceIndex === 'number').map((l) => l.choiceIndex);
    const dup = idxs.filter((v, i) => idxs.indexOf(v) !== i);
    if (dup.length) dupIdx.push(`${n.id} 出边 choiceIndex 重复：${[...new Set(dup)].join(',')}`);
    n.choices.forEach((lab, i) => {
      const byIdx = outs.some((l) => l.choiceIndex === i);
      const byLab = outs.some((l) => norm(l.label) && norm(l.label) === norm(lab));
      if (!byIdx && !byLab) unlinked.push(`${n.id}「${lab}」`);
    });
  }

  const hard = orphansReal.length + deadEnds.length + dangling.length + unlinked.length + dupIdx.length +
    (entries.length !== 1 ? 1 : 0) + (entry && (out.get(entry.id) || []).length === 0 ? 1 : 0);
  const head = hard ? '✘' : '✔';
  console.log(`${head} ${name}  节点 ${nodes.length}｜连线 ${links.length}｜Entry ${entries.length}｜End ${ends.length}｜可达 ${reach.size}/${nodes.length}${hasEnd ? `｜可终止 ${live.size}` : '（无 End·跨件接续体）'}`);
  if (!hard && !orphansNote.length) { console.log(hasEnd ? '    通顺：所有节点可从开始到达，且都能走到结束' : '    通顺（无 End：剧情在此接续到别的画布）'); continue; }
  if (hard) bad++;

  const list = (label, arr, fmt) => {
    if (!arr.length) return;
    console.log(`    ${label}（${arr.length}）：`);
    for (const x of arr.slice(0, 10)) console.log('      ' + fmt(x));
    if (arr.length > 10) console.log(`      …还有 ${arr.length - 10} 个`);
  };
  list('① 孤岛（非笔记）', orphansReal, (n) => `${n.id}（${n.type}）${preview(n)}`);
  list('① 笔记卡（可忽略）', orphansNote, (n) => `${n.id}（${n.type}）${preview(n)}`);
  list('② 死路：走不到结束', deadEnds, (n) => `${n.id}（${n.type}）出边 ${(out.get(n.id) || []).length}｜${preview(n)}`);
  if (!hasEnd) {
    console.log(`    ℹ 无 End 节点（跨件接续体）——链尾 ${tails.length} 个，请人工确认接续目标：`);
    for (const n of tails.slice(0, 8)) console.log(`      ${n.id}（${n.type}）${preview(n)}`);
  } else {
    list('③ 链尾（无出边且非 End）', tails.filter((n) => !live.has(n.id)), (n) => `${n.id}（${n.type}）${preview(n)}`);
  }
  list('④ 悬空连线', dangling, (l) => `${l.id} ${l.from}→${l.to}`);
  list('⑤ 未接线选项', unlinked, (s) => s);
  list('⑥ 选项编号异常', dupIdx, (s) => s);
  if (entries.length !== 1) console.log(`    ⚠ Entry 数量 ${entries.length}（应恰好 1）`);
  if (entry && (out.get(entry.id) || []).length === 0) console.log('    ⚠ Entry 没有出边');
}

console.log(bad ? `\n${bad} 个文件存在硬问题` : '\n全部文件通顺（含跨件接续体提示）');
process.exit(bad ? 1 : 0);
