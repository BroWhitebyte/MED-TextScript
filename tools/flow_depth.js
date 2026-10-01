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
for (const [a, b] of edges) {
  const A = sccOf.get(a), B = sccOf.get(b);
  if (A !== B && !succ[A].has(B)) succ[A].add(B);
}
const rootScc = sccOf.get(root);
const sccDepth = new Map([[rootScc, 0]]);
/* 缩点图是 DAG：深度 = 从 root 出发的最长路径长度。
   注意两点（都是 Event 202B 排布失效的根因）：
     1) **不能用 Kahn 的入度门控**（ind[w] 归零才入队）——图里只要有环，环及其下游
        分量的入度永远降不到 0，会被静默跳过，depth 兜底成 0，同一深度堆下上百个
        节点，排布退化成一列；
     2) **单遍「按 SCC 序号推进」不够**——Tarjan 的分量序号是逆拓扑序，从小往大扫
        等于顺拓扑序，看似一趟就够；但环上分量会被反复抬升，抬升后其下游必须重扫，
        否则会停在偏小的深度（202B 里 n47 停在 27，而上游 n46 已是 83）。
        故这里跑到真正的不动点。
   环内节点本就该同层，与「SCC 缩点后同层」的设计一致。 */
for (let round = 0; ; round++) {
  let changed = false;
  for (const A of succ.keys()) {
    const da = sccDepth.get(A);
    if (da === undefined) continue;
    for (const B of succ[A]) {
      const cur = sccDepth.has(B) ? sccDepth.get(B) : -1;
      if (cur < da + 1) { sccDepth.set(B, da + 1); changed = true; }
    }
  }
  if (!changed) break;
  if (round > sccs.length) break;            // 兜底：DAG 上最多 |V| 轮，正常远用不到
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
