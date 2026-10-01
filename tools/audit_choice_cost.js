'use strict';
/* 选择代价审计：逐个 Choice 追出每条选项的"独占支"（节点数／字数／【结算・提示・按钮】卡），
   找出汇合点，并标出"零差别选项"（选项指向同一节点、或独占支为空/极小、无任何结算卡）。
   用法: node audit_choice_cost.js <x.ncanvas> [...]                                          */
const fs = require('fs');

const txt = (n) => {
  const parts = [];
  if (Array.isArray(n.turns) && n.turns.length) for (const t of n.turns) parts.push(t.line || '');
  else parts.push(n.body || '');
  if (Array.isArray(n.choices)) parts.push(...n.choices);
  return parts.join('');
};
const CARD = /^【(结算|提示|按钮|机制|伏笔|跨件|占位|收束)/;

for (const p of process.argv.slice(2)) {
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  const P = j.project;
  const N = {}; for (const n of P.nodes) N[n.id] = n;
  const out = {}; for (const l of P.links) (out[l.from] = out[l.from] || []).push(l);
  const name = p.split(/[\\/]/).pop().replace('.ncanvas', '');
  const choices = P.nodes.filter((n) => n.type === 'Choice');
  if (!choices.length) { console.log(`\n### ${name}  —— 无选择点（线性件）`); continue; }
  console.log(`\n### ${name}  —— 选择点 ${choices.length}`);
  let nOpt = 0, nZero = 0, nThin = 0, nCard = 0, nRich = 0;

  for (const ch of choices) {
    const opts = ch.choiceOptions || [];
    const links = (out[ch.id] || []).filter((l) => l.label);
    // 每条选项可达集合
    const reach = new Map();
    for (const o of opts) {
      const l = links.find((x) => x.choiceOptionId === o.id) || links.find((x) => x.label === o.label);
      const seen = new Set(); const stack = l ? [l.to] : [];
      while (stack.length) { const c = stack.pop(); if (seen.has(c)) continue; seen.add(c); for (const nx of (out[c] || [])) stack.push(nx.to); }
      reach.set(o.id, { opt: o, to: l ? l.to : null, seen });
    }
    const ids = [...reach.keys()];
    const conv = ids.length ? [...reach.get(ids[0]).seen].filter((nid) => ids.every((k) => reach.get(k).seen.has(nid))) : [];
    // 汇合点＝所有选项都能到的、且其前驱不全在交集里的节点：取 BFS 深度最小者
    const depth = {}; { const q = [[ch.id, 0]]; const vis = new Set([ch.id]); while (q.length) { const [c, d] = q.shift(); depth[c] = d; for (const l of (out[c] || [])) if (!vis.has(l.to)) { vis.add(l.to); q.push([l.to, d + 1]); } } }
    const convNode = conv.length ? conv.reduce((a, b) => (depth[a] ?? 1e9) <= (depth[b] ?? 1e9) ? a : b) : null;

    console.log(`  [${ch.id}] ${opts.map((o) => '「' + o.label + '」').join(' / ')}`);
    for (const k of ids) {
      const r = reach.get(k);
      const others = ids.filter((x) => x !== k).map((x) => reach.get(x).seen);
      const excl = [...r.seen].filter((nid) => !others.some((s) => s.has(nid)));
      const chars = excl.reduce((a, nid) => a + txt(N[nid] || {}).length, 0);
      const cards = excl.map((nid) => N[nid]).filter((n) => n && CARD.test(String(n.body || '').trim())).map((n) => String(n.body).split('\n')[0].slice(0, 46));
      const flag = excl.length === 0 ? '  ← 与其它选项同路（零差别）' : (chars < 60 && !cards.length ? '  ← 支路过薄' : '');
      nOpt++;
      if (excl.length === 0) nZero++; else if (chars < 60 && !cards.length) nThin++; else nRich++;
      if (cards.length) nCard++;
      console.log(`      「${r.opt.label}」→${r.to || '（未接线）'}  独占支 ${String(excl.length).padStart(2)} 节点／${String(chars).padStart(4)} 字` + (cards.length ? `  卡:${cards.join(' | ')}` : '  卡:无') + flag);
    }
    console.log(`      汇合点：${convNode ? convNode + '「' + String(N[convNode].body || (N[convNode].turns ? N[convNode].turns[0].line : '')).replace(/\s+/g, ' ').slice(0, 28) + '」' : '（无共同汇合点／多 End）'}`);
  }
  console.log(`  ▸ 小结：选项 ${nOpt}｜有实质支 ${nRich}｜支路过薄 ${nThin}｜零差别 ${nZero}｜带结算/提示卡 ${nCard}`);
}
