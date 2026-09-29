'use strict';
/* 流程深度（与插件 med-layout-toggle 的 graphInfo 同算法）：SCC 缩点后的最长路径
   输入 JSON（文件路径作 argv[2]）：{ "root": "n_entry", "nodes": ["n1", ...], "links": [["n1","n2"], ...] }
   输出 JSON（stdout）：{ "depth": { "n1": 0, ... }, "levels": N }
   用法: node flow_depth.js <graph.json>                                                       */
const fs = require('fs');

const g = JSON.parse(fs.readFileSync(process.argv[2], 'utf8').replace(/^\uFEFF/, ''));
const ids = g.nodes.slice();
const idSet = new Set(ids);
const root = idSet.has(g.root) ? g.root : ids[0];

const adj = new Map(ids.map((id) => [id, []]));
const edges = [];
for (const [a, b] of (g.links || [])) {
  if (!idSet.has(a) || !idSet.has(b)) continue;
  adj.get(a).push(b);
  edges.push([a, b]);
}

// 可达性（用于把孤立/笔记卡排到最后）
const reach = new Set([root]);
const q0 = [root];
while (q0.length) { const u = q0.shift(); for (const w of adj.get(u)) if (!reach.has(w)) { reach.add(w); q0.push(w); } }

// Tarjan SCC
const index = new Map(), low = new Map(), onStack = new Set(), stack = [], sccOf = new Map(), sccs = [];
let counter = 0;
const strongconnect = (v) => {
  index.set(v, counter); low.set(v, counter); counter += 1; stack.push(v); onStack.add(v);
  for (const w of adj.get(v)) {
    if (!index.has(w)) { strongconnect(w); low.set(v, Math.min(low.get(v), low.get(w))); }
    else if (onStack.has(w)) low.set(v, Math.min(low.get(v), index.get(w)));
  }
  if (low.get(v) === index.get(v)) {
    const comp = [];
    for (;;) { const w = stack.pop(); onStack.delete(w); sccOf.set(w, sccs.length); comp.push(w); if (w === v) break; }
    sccs.push(comp);
  }
};
for (const id of ids) if (!index.has(id)) strongconnect(id);

const succ = sccs.map(() => new Set());
const indeg = sccs.map(() => 0);
for (const [a, b] of edges) {
  const A = sccOf.get(a), B = sccOf.get(b);
  if (A !== B && !succ[A].has(B)) { succ[A].add(B); indeg[B] += 1; }
}
const rootScc = sccOf.get(root);
const sccDepth = new Map([[rootScc, 0]]);
const dq = [rootScc];
const ind = indeg.slice();
while (dq.length) {
  const u = dq.shift();
  for (const w of succ[u]) {
    const want = (sccDepth.get(u) || 0) + 1;
    if ((sccDepth.has(w) ? sccDepth.get(w) : -1) < want) sccDepth.set(w, want);
    ind[w] -= 1;
    if (ind[w] === 0) dq.push(w);
  }
}

const depth = {};
for (const id of ids) {
  if (!reach.has(id)) continue;
  const d = sccDepth.get(sccOf.get(id));
  depth[id] = d === undefined ? 0 : d;
}
let maxD = 0;
for (const k of Object.keys(depth)) if (depth[k] > maxD) maxD = depth[k];
for (const id of ids) if (depth[id] === undefined) { maxD += 1; depth[id] = maxD; }

process.stdout.write(JSON.stringify({ depth, levels: maxD + 1 }));
