'use strict';
/*
 * MED Layout Toggle  v1.8.1
 * 一、排布切换：视图左上角按钮，横排 ⇄ 方形（蛇形分带）。排布按每张卡片的真实尺寸避让，
 *     排完自检重叠；若仍有重叠则自动加大间距重排，直到零重叠（最多 8 轮）。
 * 二、重叠合并：同类型节点（Content / Dialog / Choice）拖拽重叠时自动合并内容 ——
 *     目标块在前、移动块在后；左上角「合并：开/关」按钮可直接切换。
 * 只改 x/y、ui.view 与合并涉及的两块数据；其余一律不动。
 */
const { Plugin, Notice, PluginSettingTab, Setting } = require('obsidian');

/* ================================================================== */
/* 一、排布算法（纯函数，零重叠保证）                                   */
/* ================================================================== */
const DEF = {
  X0: 140, Y0: 80,
  gapX: 150, gapY: 90, bandGapY: 200,
  marginH: 1.10,            // 卡片高度安全系数（防他的插件渲染后变高）
  RowScale: 0.08, SquareScale: 0.3,
  maxRelax: 8,
};

function nodeW(n) { return n && n.width ? n.width : 480; }
function nodeH(n) { return n && n.height ? n.height : 160; }
function idIndex(id) {
  if (id === 'n_entry') return -1;
  const m = String(id).replace(/\D/g, '');
  return m ? parseInt(m, 10) : 0;
}

/** 估算渲染高度：取「已存高度」与「按文本估算」的较大值——宁大不小，避免排完又叠上 */
function estHeight(n) {
  const w = (typeof n.width === 'number' && n.width > 0) ? n.width : (n.type === 'Dialog' ? 420 : 480);
  const per = Math.max(8, Math.floor((w - 24) / 22));   // 每行可容纳字数（按宽度估算）
  if (n.type === 'Content') {
    let lines = 0;
    for (const seg of String(n.body || '').split('\n')) lines += Math.max(1, Math.ceil(seg.length / per));
    return 54 + lines * 26;
  }
  if (n.type === 'Dialog') {
    const turns = (Array.isArray(n.turns) && n.turns.length)
      ? n.turns.map((t) => `${(t && t.speaker) || ''}${(t && t.line) || ''}`)
      : String(n.body || '').split('\n').filter((s) => s.trim());
    let h = 30;
    for (const t of turns) h += Math.max(1, Math.ceil(String(t).length / per)) * 24 + 18;   // 逐句按换行数累加
    return h;
  }
  return 90;
}
function boxOf(n, o) {
  return { w: Math.round(nodeW(n)), h: Math.round(Math.max(nodeH(n), estHeight(n)) * o.marginH) };
}

/**
 * 让卡片框体容得下内容。合并会把正文/turns 拼长，框体必须跟着长，
 * 否则文字溢出框外——表现出来就是"框体丢失"。
 * 返回是否发生过改动。
 */
function fitNodeSize(node) {
  if (node.type !== 'Content' && node.type !== 'Dialog') return false;
  const need = Math.round(estHeight(node) * DEF.marginH);
  const cur = typeof node.height === 'number' ? node.height : 0;
  let changed = false;
  if (need > cur) { node.height = need; node.manualSize = true; changed = true; }
  if (typeof node.width !== 'number' || node.width <= 0) {
    node.width = node.type === 'Dialog' ? 420 : 480;
    changed = true;
  }
  return changed;
}

/**
 * 结构修复：
 *  1) 悬空连线——两端都在则桥接（X→缺失→Y 变 X→Y）；只有一端则丢弃
 *  2) 尺寸——Content/Dialog 缺尺寸或高度不够则补全/长高
 *  3) ui 选中项指向已删节点 → 清空
 * 返回统计；无改动时不触碰数据。
 */
function repairDoc(doc, opts) {
  const o = Object.assign({ sizes: true }, opts || {});   // sizes:false ＝ 只修连线，不碰任何卡片尺寸（合并路径用）
  const nodes = (doc.project && doc.project.nodes) || [];
  const links = (doc.project && doc.project.links) || [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out = { bridged: 0, dropped: 0, resized: 0, geom: 0 };

  const inbound = new Map();
  const outbound = new Map();
  const keep = [];
  for (const l of links) {
    const hasFrom = byId.has(l.from), hasTo = byId.has(l.to);
    if (hasFrom && hasTo) { keep.push(l); continue; }
    if (!hasFrom && !hasTo) { out.dropped += 1; continue; }
    if (!hasTo) { if (!inbound.has(l.to)) inbound.set(l.to, []); inbound.get(l.to).push(l); }
    else { if (!outbound.has(l.from)) outbound.set(l.from, []); outbound.get(l.from).push(l); }
  }
  for (const [missing, ins] of inbound) {
    const outs = outbound.get(missing) || [];
    for (const li of ins) {
      const lo = outs.shift();
      if (lo) {
        keep.push(Object.assign({}, li, { to: lo.to, toPort: lo.toPort || { side: 'left', t: 0.5 } }));
        out.bridged += 1;
      } else { out.dropped += 1; }
    }
  }
  for (const [, outs] of outbound) out.dropped += outs.length;
  if (out.bridged || out.dropped) {
    keep.forEach((l, i) => { l.id = 'l' + i; });
    doc.project.links = keep;
  }

  for (const n of nodes) {
    if (!o.sizes) break;                                    // 合并路径：不碰尺寸
    const lackedGeom = (typeof n.width !== 'number' || n.width <= 0) && (n.type === 'Content' || n.type === 'Dialog');
    if (fitNodeSize(n)) out.resized += 1;
    if (lackedGeom) out.geom += 1;
  }

  const live = doc.project.links || [];
  if (doc.ui) {
    if (doc.ui.selectedNodeId && !byId.has(doc.ui.selectedNodeId)) doc.ui.selectedNodeId = null;
    if (doc.ui.selectedLinkId && !live.some((l) => l.id === doc.ui.selectedLinkId)) doc.ui.selectedLinkId = null;
  }
  return out;
}

function graphInfo(doc) {
  const nodes = (doc && doc.project && doc.project.nodes) || [];
  const links = (doc && doc.project.links) || [];
  if (!nodes.length) throw new Error('文档没有节点');

  const idxOf = new Map();
  const adj = new Map();
  nodes.forEach((n, i) => { idxOf.set(n.id, i); adj.set(n.id, []); });
  const edges = [];
  for (const l of links) {
    if (!idxOf.has(l.from) || !idxOf.has(l.to)) continue;
    adj.get(l.from).push(l.to);
    edges.push([l.from, l.to]);
  }
  const hasEntry = nodes.some((n) => n.id === 'n_entry');
  const root = hasEntry ? 'n_entry' : nodes[0].id;

  // ① 可达性（只用来看哪些节点算"孤立/笔记卡"，照旧排到最后）
  const reach = new Set([root]);
  const queue = [root];
  while (queue.length) {
    const cur = queue.shift();
    for (const t of (adj.get(cur) || [])) if (!reach.has(t)) { reach.add(t); queue.push(t); }
  }

  // ② 流程深度 = SCC 缩点后的最长路径
  //    目的：节点排在它**所有上游之后**（而不是 BFS 最短路径），这样汇合点与 End 不会被"提前"到上/左端；
  //    环（梦境回环 hub、「回去吧」循环等）内部节点同层，不会把深度无限推高。
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
  for (const n of nodes) if (!index.has(n.id)) strongconnect(n.id);

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
          分量的入度永远降不到 0，会被静默跳过；sccDepth 拿不到值，下面兜底成 0，
          同一深度堆下上百个节点，placeRow 把它们竖排成一列，方形与横排都退化成竖条；
       2) **入队式松弛会提前出队**——环上分量在环内被反复发现，但一旦出队就不再传播，
          下游会停在偏小的深度。故这里跑到不动点：每轮全量检查，任何分量
          depth < max(上游 depth)+1 就抬升并继续，直到再无变化。
     环内节点本就该同层，与「SCC 缩点后同层」的设计一致。 */
  let rounds = 0;
  const MAXR = sccs.length + 2;
  for (;;) {
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
    if (++rounds > MAXR) break;               // 兜底：正常 DAG 上最多 |V| 轮
  }

  const depth = new Map();
  for (const n of nodes) {
    if (!reach.has(n.id)) continue;               // 不可达 → 下面统一排到最后
    const d = sccDepth.get(sccOf.get(n.id));
    depth.set(n.id, d === undefined ? 0 : d);
  }
  let maxD = 0;
  for (const v of depth.values()) if (v > maxD) maxD = v;
  for (const n of nodes) if (!depth.has(n.id)) { maxD += 1; depth.set(n.id, maxD); }

  const byDepth = new Map();
  for (const n of nodes) {
    const d = depth.get(n.id);
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d).push(n);
  }
  for (const arr of byDepth.values()) arr.sort((a, b) => idIndex(a.id) - idIndex(b.id));

  return { nodes, links, depth, byDepth, levels: maxD + 1 };
}

function depthList(g) { return [...g.byDepth.keys()].sort((a, b) => a - b); }

function colWidth(g, d, o) {
  let w = 0;
  for (const n of g.byDepth.get(d)) w = Math.max(w, boxOf(n, o).w);
  return w;
}
function stackHeight(g, d, o) {
  const arr = g.byDepth.get(d);
  let h = 0;
  arr.forEach((n, i) => { h += boxOf(n, o).h + (i ? o.gapY : 0); });
  return h;
}

/** 横排：所有深度排成一行；同一深度的多块纵向堆叠（按真实高度） */
function placeRow(g, o) {
  const ds = depthList(g);
  const x = new Map();
  let cx = o.X0;
  for (const d of ds) { x.set(d, cx); cx += colWidth(g, d, o) + o.gapX; }
  for (const d of ds) {
    let cy = o.Y0;
    for (const n of g.byDepth.get(d)) {
      const b = boxOf(n, o);
      n.x = x.get(d); n.y = cy;
      cy += b.h + o.gapY;
    }
  }
}

/** 方形：深度折成 cols 列的蛇形分带；每带列宽按该带真实卡片宽度累加 */
function squareMetrics(g, o, cols) {
  const ds = depthList(g);
  const bands = new Map();
  for (const d of ds) {
    const b = Math.floor(d / cols);
    if (!bands.has(b)) bands.set(b, []);
    bands.get(b).push(d);
  }
  let width = 0, height = o.Y0;
  for (const b of [...bands.keys()].sort((a, c) => a - c)) {
    const wByCol = new Map();
    let bandH = 0;
    for (const d of bands.get(b)) {
      const vc = (b % 2 === 0) ? (d % cols) : (cols - 1 - (d % cols));
      const w = Math.max(wByCol.get(vc) || 0, colWidth(g, d, o));
      wByCol.set(vc, w);
      bandH = Math.max(bandH, stackHeight(g, d, o));
    }
    let bw = 0;
    for (const c of [...wByCol.keys()].sort((a, c) => a - c)) bw += wByCol.get(c) + o.gapX;
    bw = bw > 0 ? bw - o.gapX : 0;
    width = Math.max(width, o.X0 + bw);
    height += bandH + o.bandGapY;
  }
  height = height - o.bandGapY;
  return { width, height };
}

function placeSquare(g, o, cols) {
  const ds = depthList(g);
  const bands = new Map();
  for (const d of ds) {
    const b = Math.floor(d / cols);
    if (!bands.has(b)) bands.set(b, []);
    bands.get(b).push(d);
  }
  let y = o.Y0;
  for (const b of [...bands.keys()].sort((a, c) => a - c)) {
    const bandDepths = bands.get(b);
    const wByCol = new Map();
    const colOf = new Map();
    for (const d of bandDepths) {
      const vc = (b % 2 === 0) ? (d % cols) : (cols - 1 - (d % cols));
      colOf.set(d, vc);
      wByCol.set(vc, Math.max(wByCol.get(vc) || 0, colWidth(g, d, o)));
    }
    const xByCol = new Map();
    let cx = o.X0;
    for (const c of [...wByCol.keys()].sort((a, c2) => a - c2)) { xByCol.set(c, cx); cx += wByCol.get(c) + o.gapX; }
    let bandBottom = y;
    for (const d of bandDepths) {
      let cy = y;
      for (const n of g.byDepth.get(d)) {
        const bx = boxOf(n, o);
        n.x = xByCol.get(colOf.get(d)); n.y = cy;
        cy += bx.h + o.gapY;
      }
      bandBottom = Math.max(bandBottom, cy - o.gapY);
    }
    y = bandBottom + o.bandGapY;
  }
}

/** 统计（用真实卡片盒子，保守）：包围盒 + 重叠对数 */
function measure(nodes, o) {
  const oo = Object.assign({}, DEF, o || {});
  const box = (n) => (o === undefined && n.__stored) ? { w: nodeW(n), h: nodeH(n) } : boxOf(n, oo);
  let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
  for (const n of nodes) {
    const b = box(n), x = n.x | 0, y = n.y | 0;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x + b.w > maxX) maxX = x + b.w;
    if (y + b.h > maxY) maxY = y + b.h;
  }
  let overlaps = 0;
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i], ab = box(a), ax = a.x | 0, ay = a.y | 0;
    for (let k = i + 1; k < nodes.length; k++) {
      const c = nodes[k], cb = box(c), cx = c.x | 0, cy = c.y | 0;
      if (ax < cx + cb.w && cx < ax + ab.w && ay < cy + cb.h && cy < ay + ab.h) overlaps += 1;
    }
  }
  const width = maxX - minX, height = maxY - minY;
  return { width, height, aspect: Math.round((width / Math.max(1, height)) * 100) / 100, overlaps };
}

function setView(doc, scale) {
  if (!doc.ui) doc.ui = {};
  doc.ui.view = { x: 0, y: 0, scale };
}

function layoutRow(doc, opts) {
  let o = Object.assign({}, DEF, opts || {});
  const g = graphInfo(doc);
  let stats = null;
  for (let i = 0; i < o.maxRelax; i++) {
    placeRow(g, o);
    stats = measure(g.nodes, o);
    if (stats.overlaps === 0) break;
    o = Object.assign({}, o, { gapY: Math.round(o.gapY * 1.3), gapX: Math.round(o.gapX * 1.15) });
  }
  setView(doc, o.RowScale);
  return Object.assign({ mode: 'row', cols: 1, bands: 1, levels: g.levels, relax: stats.overlaps === 0 }, stats);
}

function layoutSquare(doc, opts) {
  let o = Object.assign({}, DEF, opts || {});
  const g = graphInfo(doc);
  const levels = g.levels;

  const pick = (oo) => {
    let best = null;
    const range = [];
    if (oo.Cols > 0) range.push(oo.Cols); else for (let c = 4; c <= 16; c++) range.push(c);
    for (const c of range) {
      const m = squareMetrics(g, oo, c);
      const ratio = Math.max(m.width, m.height) / Math.min(m.width, m.height);
      if (!best || ratio < best.ratio) best = { cols: c, ratio, ...m };
    }
    return best;
  };

  let best = pick(o);
  let stats = null;
  for (let i = 0; i < o.maxRelax; i++) {
    placeSquare(g, o, best.cols);
    stats = measure(g.nodes, o);
    if (stats.overlaps === 0) break;
    o = Object.assign({}, o, { gapY: Math.round(o.gapY * 1.3), gapX: Math.round(o.gapX * 1.15), bandGapY: Math.round(o.bandGapY * 1.2) });
    best = pick(o);
  }
  setView(doc, o.SquareScale);
  return Object.assign({ mode: 'square', cols: best.cols, bands: Math.ceil(levels / best.cols), levels, relax: stats.overlaps === 0 }, stats);
}

function detectMode(doc) {
  const m = measure(graphInfo(doc).nodes, {});
  return m.aspect >= 2.5 ? 'row' : 'square';
}

function applyLayout(doc, mode, opts) {
  let m = mode;
  if (m === 'toggle') m = detectMode(doc) === 'row' ? 'square' : 'row';
  if (m === 'row') return layoutRow(doc, opts);
  if (m === 'square') return layoutSquare(doc, opts);
  throw new Error('未知排布模式：' + mode);
}

/**
 * 有重叠就重排到零重叠（模式沿用当前画布：横排仍是横排、方形仍是方形）。
 * 无重叠时一个坐标都不动 —— 返回 before/after 供提示使用。
 */
function flattenIfOverlapping(doc) {
  const before = measure(doc.project.nodes, {});
  if (before.overlaps === 0) return { before, after: before, moved: false, overlaps: 0 };
  const mode = detectMode(doc);
  applyLayout(doc, mode);
  let after = measure(doc.project.nodes, {});
  if (after.overlaps > 0) { applyLayout(doc, mode); after = measure(doc.project.nodes, {}); }   // 极端情况再来一轮
  return { before, after, moved: true, mode, overlaps: after.overlaps };
}

/* ================================================================== */
/* 二、重叠合并（纯函数）                                              */
/* ================================================================== */
const MERGE_TYPES = ['Content', 'Dialog'];
const CHOICE_TYPE = 'Choice';
const DEFAULT_MERGE_TYPES = ['Content', 'Dialog', 'Choice'];

/** 判定用的几何盒子：取「已存尺寸」与「按正文估算」的较大值——与他插件渲染出的实际尺寸解耦 */
function rectOf(n, o) {
  const oo = Object.assign({}, DEF, o || {});
  const b = boxOf(n, oo);
  return { x: n.x | 0, y: n.y | 0, w: b.w, h: b.h };
}
/** 移动块中心是否落进目标块（视觉上"压住了"的直观判据） */
function centerIn(a, b) {
  const cx = a.x + a.w / 2, cy = a.y + a.h / 2;
  return cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h;
}
function overlapArea(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}
function rectsSnapshot(doc) {
  const m = new Map();
  for (const n of (doc && doc.project && doc.project.nodes) || []) m.set(n.id, rectOf(n));
  return m;
}
function turnsOf(node) {
  if (Array.isArray(node.turns) && node.turns.length) {
    return node.turns.map((t) => ({ speaker: String((t && t.speaker) || ''), line: String((t && t.line) || '') }));
  }
  const out = [];
  for (const raw of String(node.body || '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const i = line.indexOf(':');
    if (i > 0) out.push({ speaker: line.slice(0, i).trim(), line: line.slice(i + 1).trim() });
    else out.push({ speaker: '', line });
  }
  return out;
}
function bodyFromTurns(turns) { return turns.map((t) => `${t.speaker}: ${t.line}`).join('\n'); }

function normalizeOptions(node) {
  if (Array.isArray(node.choiceOptions) && node.choiceOptions.length) {
    return node.choiceOptions.map((o, i) => ({
      id: (o && o.id) || 'opt_' + (i + 1),
      label: String((o && o.label) != null ? o.label : ((node.choices || [])[i] != null ? node.choices[i] : '')),
      requires: (o && o.requires) || '',
      effects: (o && Array.isArray(o.effects)) ? o.effects : [],
    }));
  }
  const labels = Array.isArray(node.choices) ? node.choices : [];
  return labels.map((l, i) => ({ id: 'opt_' + (i + 1), label: String(l), requires: '', effects: [] }));
}

function mergeChoiceInto(target, moved) {
  const tOpts = normalizeOptions(target);
  const mOpts = normalizeOptions(moved);
  const base = tOpts.length;
  const merged = tOpts.concat(mOpts.map((o, i) => ({
    id: 'opt_' + (base + i + 1),
    label: o.label,
    requires: o.requires || '',
    effects: o.effects || [],
  })));
  target.choices = merged.map((o) => o.label);
  target.choiceOptions = merged;
  return mOpts.map((o) => o.label);
}

function mergePair(target, moved) {
  if (target.type === 'Content' && moved.type === 'Content') {
    const a = String(target.body || '').trim();
    const b = String(moved.body || '').trim();
    target.body = [a, b].filter(Boolean).join('\n');
    return { type: 'Content', added: b.length };
  }
  if (target.type === 'Dialog' && moved.type === 'Dialog') {
    const t0 = turnsOf(target);
    const t1 = turnsOf(moved);
    const turns = t0.concat(t1);
    target.turns = turns;
    target.body = bodyFromTurns(turns);
    return { type: 'Dialog', added: t1.length };
  }
  if (target.type === CHOICE_TYPE && moved.type === CHOICE_TYPE) {
    const labels = mergeChoiceInto(target, moved);
    return { type: CHOICE_TYPE, added: labels.length, labels };
  }
  throw new Error('该类型不支持合并：' + target.type);
}

function contractEdges(doc, targetId, movedId, remap) {
  const links = doc.project.links || [];
  const existing = new Set(links.map((l) => `${l.from}\u0000${l.to}\u0000${l.choiceOptionId || ''}`));
  const kept = [];
  let rewired = 0;
  let dropped = 0;
  for (const l of links) {
    const touchesMoved = l.from === movedId || l.to === movedId;
    let nl = l;
    if (touchesMoved) {
      nl = Object.assign({}, l);
      if (nl.from === movedId) {
        nl.from = targetId;
        if (remap) {
          let oldIdx = null;
          if (typeof nl.choiceIndex === 'number') oldIdx = nl.choiceIndex;
          else if (nl.choiceOptionId) {
            const mm = /^opt_(\d+)$/.exec(String(nl.choiceOptionId));
            if (mm) oldIdx = parseInt(mm[1], 10) - 1;
          }
          if (oldIdx != null && remap.indexMap.has(oldIdx)) {
            const ni = remap.indexMap.get(oldIdx);
            nl.choiceIndex = ni;
            nl.choiceOptionId = 'opt_' + (ni + 1);
            if (!nl.label) nl.label = remap.labels[oldIdx] || '';
          }
        }
      }
      if (nl.to === movedId) nl.to = targetId;
      if (nl.from === nl.to) { dropped += 1; continue; }
      const key = `${nl.from}\u0000${nl.to}\u0000${nl.choiceOptionId || ''}`;
      if (existing.has(key)) { dropped += 1; continue; }
      existing.add(key);
      rewired += 1;
    }
    kept.push(nl);
  }
  kept.forEach((l, i) => { l.id = 'l' + i; });
  doc.project.links = kept;
  doc.project.nodes = (doc.project.nodes || []).filter((n) => n.id !== movedId);
  return { rewired, dropped };
}

function mergeOverlaps(doc, prevRects, opts) {
  const o = Object.assign({ ratio: 0.35, types: DEFAULT_MERGE_TYPES, centerRule: true }, opts || {});
  const log = { merged: [], rewired: 0, dropped: 0, skipped: [] };
  if (!prevRects) return log;

  // 每一轮都从当前图重新取数组：绝不复用旧引用（否则会把正文并进"已删除的节点"→ 两块一起消失）
  const live = () => (doc.project.nodes || []);
  const before0 = contentChars(doc);

  const movedIds = [];
  for (const n of live()) {
    const p = prevRects.get(n.id);
    if (!p || p.x !== (n.x | 0) || p.y !== (n.y | 0)) movedIds.push(n.id);
  }

  for (const mid of movedIds) {
    const moved = live().find((n) => n.id === mid);
    if (!moved || o.types.indexOf(moved.type) < 0) continue;
    const r = rectOf(moved);
    const rm = prevRects.get(mid);

    let best = null;
    for (const t of live()) {
      if (t.id === mid || t.type !== moved.type || o.types.indexOf(t.type) < 0) continue;
      const tr = rectOf(t);
      const rt = prevRects.get(t.id);
      const area = overlapArea(r, tr);
      if (area <= 0) continue;
      const before = (rm && rt) ? overlapArea(rm, rt) : 0;
      const minArea = Math.min(r.w * r.h, tr.w * tr.h);
      const ratio = minArea > 0 ? area / minArea : 0;
      const centered = !!o.centerRule && centerIn(r, tr);
      const grew = area > before + 1;
      if (!grew && !centered) {
        log.skipped.push({ movedId: mid, targetId: t.id, type: moved.type, ratio: Math.round(ratio * 100), reason: before > 0 ? '拖动后重叠未增加' : '无拖动信息' });
        continue;
      }
      if (!centered && ratio < o.ratio) {
        log.skipped.push({ movedId: mid, targetId: t.id, type: moved.type, ratio: Math.round(ratio * 100), reason: `重叠 ${Math.round(ratio * 100)}% < 阈值 ${Math.round(o.ratio * 100)}%` });
        continue;
      }
      if (!best || area > best.area) best = { target: t, area, ratio };
    }
    if (!best) continue;

    // 目标必须仍在当前图中（防"幽灵目标"）
    const targetId = best.target.id;
    if (!live().some((n) => n.id === targetId)) continue;

    let remap = null;
    if (moved.type === CHOICE_TYPE) {
      const tOpts = normalizeOptions(best.target);
      const mOpts = normalizeOptions(moved);
      const indexMap = new Map();
      mOpts.forEach((op, i) => indexMap.set(i, tOpts.length + i));
      remap = { indexMap, labels: mOpts.map((op) => op.label) };
    }
    const info = mergePair(best.target, moved);
    const c = contractEdges(doc, targetId, mid, remap);

    if (!live().some((n) => n.id === targetId)) throw new Error(`合并异常：目标块 ${targetId} 在合并后消失，已中止`);
    if (live().some((n) => n.id === mid)) throw new Error(`合并异常：被合并块 ${mid} 未被移除，已中止`);

    log.merged.push({ type: moved.type, targetId, movedId: mid, added: info.added, ratio: Math.round(best.ratio * 100) });
    log.rewired += c.rewired;
    log.dropped += c.dropped;
  }

  const after = contentChars(doc);
  if (after < before0) throw new Error(`合并异常：正文减少 ${before0 - after} 字，已中止（未写入）`);
  return log;
}

/**
 * 一键适配所有卡片的框体尺寸（Content / Dialog）：
 *  - 宽度：统一为标准宽度（opts.width，0＝不改宽度）
 *  - 高度：目标 = max(下限, 按新宽度估算的高度 × 1.10)，与现值相差 ≤15% 视为已合适
 *  - 只动 width/height/manualSize，不碰正文、连线、Choice 几何
 * 幂等：同一份内容连点两次，第二次必定 0 改动。
 */
function fitSizesSweep(doc, opts) {
  const o = Object.assign({ width: 440, tol: 0.15, margin: 1.10, minH: 90 }, opts || {});
  const out = { widened: 0, grown: 0, shrunk: 0, geom: 0, skipped: 0 };
  for (const n of ((doc.project && doc.project.nodes) || [])) {
    if (n.type === 'Entry' || n.type === 'End') continue;             // 不是卡片，不计入
    if (n.type !== 'Content' && n.type !== 'Dialog') { out.skipped += 1; continue; }

    let widthChanged = false;
    if (o.width > 0 && n.width !== o.width) {
      n.width = o.width;
      widthChanged = true;
      out.widened += 1;
    } else if (typeof n.width !== 'number' || n.width <= 0) {
      n.width = o.width > 0 ? o.width : (n.type === 'Dialog' ? 420 : 480);
      widthChanged = true;
      out.geom += 1;
    }

    const target = Math.max(o.minH, Math.round(estHeight(n) * o.margin));
    const cur = typeof n.height === 'number' ? n.height : 0;
    if (!cur) { n.height = target; n.manualSize = true; out.geom += 1; continue; }
    if (!widthChanged && Math.abs(target - cur) / Math.max(1, cur) <= o.tol) continue;   // 差异不大 → 不动
    if (target > cur) out.grown += 1; else if (target < cur) out.shrunk += 1;
    n.height = target;
    n.manualSize = true;
  }
  return out;
}

const MODE_LABEL = { row: '横排', square: '方形' };

/** 正文总量（body + turns.line + choices）——用于"合并绝不减少正文"的硬闸 */
function contentChars(doc) {
  let n = 0;
  for (const x of ((doc.project && doc.project.nodes) || [])) {
    n += String(x.body || '').replace(/\s/g, '').length;
    if (Array.isArray(x.turns)) for (const t of x.turns) n += String((t && t.line) || '').replace(/\s/g, '').length;
    if (Array.isArray(x.choices)) n += x.choices.join('').replace(/\s/g, '').length;
  }
  return n;
}

/** 写入前的滚动备份（%TEMP%\med-ncanvas-backups，每个文件保留最近 20 份） */
function backupFileText(text, filePath) {
  try {
    const fs = require('fs'); const os = require('os'); const pathMod = require('path');
    const dir = pathMod.join(os.tmpdir(), 'med-ncanvas-backups');
    fs.mkdirSync(dir, { recursive: true });
    const safe = pathMod.basename(filePath).replace(/[\\/:*?"<>|]/g, '_');
    const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
    const name = `${safe}.${stamp}.bak.ncanvas`;
    fs.writeFileSync(pathMod.join(dir, name), text, 'utf8');
    const list = fs.readdirSync(dir).filter((f) => f.startsWith(safe + '.')).sort();
    while (list.length > 20) { try { fs.unlinkSync(pathMod.join(dir, list.shift())); } catch (e) { break; } }
    return pathMod.join(dir, name);
  } catch (e) { return null; }
}

/* ================================================================== */
/* 三、设置                                                            */
/* ================================================================== */
const DEFAULT_SETTINGS = { autoMerge: true, overlapRatio: 0.35, mergeChoice: true, stdWidth: 440, noOverlap: true };

class MedLayoutToggleSettingTab extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'MED Layout Toggle' });

    new Setting(containerEl)
      .setName('拖拽同类自动合并')
      .setDesc('同类型块（Content / Dialog / Choice）拖拽重叠时自动合并内容（目标块在前、移动块在后），并删除移动块、把它的连线收缩到目标块。左上角「合并：开/关」按钮同此开关。')
      .addToggle((tog) => tog.setValue(this.plugin.settings.autoMerge).onChange(async (v) => {
        this.plugin.settings.autoMerge = v;
        await this.plugin.saveSettings();
        this.plugin.refreshButtons();
      }));

    new Setting(containerEl)
      .setName('重叠判定阈值')
      .setDesc('重叠面积占较小块的比例达到该值才合并（默认 35%）。')
      .addSlider((s) => s.setLimits(10, 80, 5).setValue(Math.round(this.plugin.settings.overlapRatio * 100)).setDynamicTooltip()
        .onChange(async (v) => {
          this.plugin.settings.overlapRatio = v / 100;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('允许合并 Choice（选项）')
      .setDesc('两个 Choice 块重叠时，把移动块的选项与分支一起并入目标块：目标选项在前、选项 id 与 choiceIndex 自动重编号、移动块出边重挂到目标块。关闭后 Choice 不参与合并。')
      .addToggle((tog) => tog.setValue(this.plugin.settings.mergeChoice).onChange(async (v) => {
        this.plugin.settings.mergeChoice = v;
        await this.plugin.saveSettings();
      }));

    new Setting(containerEl)
      .setName('卡片标准宽度（px）')
      .setDesc('「尺寸：整理」按钮会把所有 Content / Dialog 卡片统一到这个宽度，高度仍按内容自由伸缩。默认 440。（若某张画布想保留自己的宽度，别点整理即可）')
      .addSlider((s) => s.setLimits(320, 900, 20).setValue(this.plugin.settings.stdWidth).setDynamicTooltip()
        .onChange(async (v) => {
          this.plugin.settings.stdWidth = v;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('「尺寸：整理」后消除重叠')
      .setDesc('仅作用于「尺寸：整理」按钮：结束时若存在框体重叠，会自动重排一次（沿用当前是横排还是方形）直到零重叠。**合并类操作永不重排画布**——合并只动被合并的那两块，其余卡片位置一律不改。关闭此开关后整理也只提示重叠数、不动位置。')
      .addToggle((tog) => tog.setValue(this.plugin.settings.noOverlap).onChange(async (v) => {
        this.plugin.settings.noOverlap = v;
        await this.plugin.saveSettings();
      }));

    containerEl.createEl('p', {
      text: '左上角三个按钮：`排布：… ⇄`（横排⇄方形）、`合并：开/关`（拖拽同类自动合并）、`尺寸：整理`（一键适配所有卡片框体，幂等可反复点）。命令面板另有：切换排布、开关自动合并、整理框体尺寸、修复画布结构、诊断为什么没合并、恢复最近备份。排布按卡片真实尺寸避让并自检零重叠；后台只做合并，尺寸整理只在手动点击时执行，且输入框获得焦点时一律不打扰。',
      cls: 'setting-item-description',
    });
  }
}

/* ================================================================== */
/* 四、插件                                                            */
/* ================================================================== */
class MedLayoutToggle extends Plugin {
  async onload() {
    this.viewTypes = ['narrative-graph-view', 'narrative-canvas-view'];
    this.intervalMs = 2000;
    this.rectCache = new Map();      // file.path -> Map(nodeId -> rect) 上次见到的几何快照
    this.busy = new Set();           // 自己写入时的重入保护
    this.lastMtime = new Map();      // file.path -> mtime（轮询兜底）
    this.pendingCheck = new Map();   // file.path -> 待触发的定时器
    this.lastSkipNotice = 0;         // "未合并原因"提示限流
    this.repairedOnce = new Set();   // 本会话已做过悬空线清理的文件（避免反复写入）

    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.addSettingTab(new MedLayoutToggleSettingTab(this.app, this));

    try {
      const fs = require('fs'); const os = require('os'); const path = require('path');
      fs.writeFileSync(path.join(os.tmpdir(), 'med-layout-toggle.loaded'),
        new Date().toISOString() + '  v' + (this.manifest ? this.manifest.version : '?') + '\n', 'utf8');
    } catch (e) { /* 忽略 */ }

    this.addRibbonIcon('layout-grid', '切换画布排布（横排 ⇄ 方形）', () => this.runActive('toggle'));
    this.addCommand({ id: 'toggle', name: '切换排布（横排 ⇄ 方形）', callback: () => this.runActive('toggle') });
    this.addCommand({ id: 'to-row', name: '排布设为横排', callback: () => this.runActive('row') });
    this.addCommand({ id: 'to-square', name: '排布设为方形', callback: () => this.runActive('square') });
    this.addCommand({ id: 'merge-overlaps', name: '合并重叠的同类型节点', callback: () => this.mergeActiveNow() });
    this.addCommand({ id: 'diagnose-merge', name: '诊断：为什么没合并', callback: () => this.diagnose() });
    this.addCommand({ id: 'repair-canvas', name: '修复画布结构（悬空连线 / 卡片尺寸）', callback: () => this.repairActive() });
    this.addCommand({ id: 'restore-backup', name: '恢复：用最近自动备份覆盖当前画布', callback: () => this.restoreLatestBackup() });
    this.addCommand({ id: 'tidy-sizes', name: '整理框体尺寸（一键适配全部卡片）', callback: () => this.tidySizes() });
    this.addCommand({
      id: 'toggle-automerge',
      name: '开关：拖拽同类自动合并',
      callback: async () => { await this.toggleMerge(); },
    });

    const refresh = () => this.ensureButtons();
    this.registerEvent(this.app.workspace.on('layout-change', refresh));
    this.registerEvent(this.app.workspace.on('active-leaf-change', refresh));
    this.registerEvent(this.app.workspace.on('file-open', refresh));
    // 触发源一：Obsidian 文件保存事件（插件的 TextFileView.requestSave 会走这里）
    this.registerEvent(this.app.vault.on('modify', (file) => { this.scheduleMergeCheck(file, 320); }));
    // 触发源二：每 2 秒轮询各画布 mtime（保存若不触发 modify 也能兜住）
    this.registerInterval(window.setInterval(() => { refresh(); this.pollTick(); }, this.intervalMs));
    this.app.workspace.onLayoutReady(() => {
      refresh();
      for (const leaf of this.ncanvasLeaves()) {
        const f = this.leafFile(leaf);
        if (f) this.primeCache(f);
      }
    });
  }

  onunload() {
    document.querySelectorAll('.med-layout-tools').forEach((el) => el.remove());
  }

  async saveSettings() { await this.saveData(this.settings); }

  /* ---------------- 视图工具条 ---------------- */
  ncanvasLeaves() {
    const out = [];
    for (const t of this.viewTypes) for (const leaf of this.app.workspace.getLeavesOfType(t)) out.push(leaf);
    return out;
  }
  leafFile(leaf) {
    const v = leaf && leaf.view;
    if (v && v.file && v.file.extension === 'ncanvas') return v.file;
    return null;
  }

  ensureButtons() {
    for (const leaf of this.ncanvasLeaves()) {
      const v = leaf.view;
      const file = this.leafFile(leaf);
      const host = v && (v.contentEl || v.containerEl);
      if (!file || !host) continue;
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

      let bar = host.querySelector(':scope > .med-layout-tools');
      if (!bar) {
        bar = host.createDiv({ cls: 'med-layout-tools' });
        // 触发源三：画布上"拖动结束"后延迟检查（纯点击不算，避免打断正在输入的节点编辑器）
        let downX = 0, downY = 0;
        host.addEventListener('pointerdown', (ev) => { downX = ev.clientX; downY = ev.clientY; }, true);
        host.addEventListener('pointerup', (ev) => {
          const dragged = Math.abs(ev.clientX - downX) + Math.abs(ev.clientY - downY) > 6;
          if (dragged) this.scheduleMergeCheck(this.leafFile(leaf), 900);
        }, true);
        const layoutBtn = bar.createEl('button', { cls: 'med-layout-btn', text: '排布：…' });
        layoutBtn.addEventListener('click', (ev) => {
          ev.preventDefault(); ev.stopPropagation(); this.runActive('toggle', file);
        });
        const mergeBtn = bar.createEl('button', { cls: 'med-layout-merge', text: '合并：—' });
        mergeBtn.addEventListener('click', (ev) => {
          ev.preventDefault(); ev.stopPropagation(); this.toggleMerge();
        });
        const tidyBtn = bar.createEl('button', { cls: 'med-layout-tidy', text: '尺寸：整理' });
        tidyBtn.addEventListener('click', (ev) => {
          ev.preventDefault(); ev.stopPropagation(); this.tidySizes();
        });
      }
      this.paintTools(bar, file);
    }
  }

  refreshButtons() {
    for (const leaf of this.ncanvasLeaves()) {
      const v = leaf.view;
      const host = v && (v.contentEl || v.containerEl);
      if (!host) continue;
      const bar = host.querySelector(':scope > .med-layout-tools');
      if (bar) this.paintTools(bar, this.leafFile(leaf));
    }
  }

  paintTools(bar, file) {
    const mergeBtn = bar.querySelector('.med-layout-merge');
    if (mergeBtn) {
      const on = !!this.settings.autoMerge;
      mergeBtn.setText(`合并：${on ? '开' : '关'}`);
      mergeBtn.setAttribute('title', on ? '重叠合并已开启：同类块拖拽重叠时自动合并（点击关闭）' : '重叠合并已关闭（点击开启）');
      mergeBtn.toggleClass('is-off', !on);
    }
    const layoutBtn = bar.querySelector('.med-layout-btn');
    const tidyBtn = bar.querySelector('.med-layout-tidy');
    if (tidyBtn) tidyBtn.setAttribute('title', '一键适配所有卡片的框体尺寸（按正文计算；幂等，可反复点）');
    if (!layoutBtn || !file) return;
    layoutBtn.setText('排布：读取中…');
    layoutBtn.setAttribute('title', '点击在横排与方形之间切换（只改坐标，不动正文）');
    this.app.vault.cachedRead(file).then((raw) => {
      try {
        const doc = JSON.parse(raw);
        const mode = detectMode(doc);
        const m = measure(graphInfo(doc).nodes, {});
        layoutBtn.setText(`排布：${MODE_LABEL[mode]} ⇄`);
        layoutBtn.setAttribute('title', `${MODE_LABEL[mode]}｜${m.width}×${m.height}px 长宽比 ${m.aspect}｜重叠 ${m.overlaps}`);
      } catch (e) {
        layoutBtn.setText('排布：无法解析');
      }
    }).catch(() => layoutBtn.setText('排布：读取失败'));
  }

  async toggleMerge() {
    this.settings.autoMerge = !this.settings.autoMerge;
    await this.saveSettings();
    new Notice(`重叠合并：${this.settings.autoMerge ? '已开启' : '已关闭'}`, 3000);
    this.refreshButtons();
  }

  /* ---------------- 排布 ---------------- */
  activeNcanvasFile() {
    const f = this.app.workspace.getActiveFile();
    if (f && f.extension === 'ncanvas') return f;
    return this.leafFile(this.app.workspace.activeLeaf);
  }

  runActive(mode, file) {
    const target = file || this.activeNcanvasFile();
    if (!target) { new Notice('当前没有打开 .ncanvas 文件'); return; }
    this.applyTo(target, mode);
  }

  async applyTo(file, mode) {
    try {
      const raw = await this.app.vault.read(file);
      const doc = JSON.parse(raw);
      const stats = applyLayout(doc, mode);
      const bak = await this.writeDoc(file, doc, 'layout');
      new Notice(`排布 → ${MODE_LABEL[stats.mode]}｜${stats.width}×${stats.height}px 长宽比 ${stats.aspect}｜重叠 ${stats.overlaps}${stats.overlaps ? '（已达最大重试）' : '（零重叠）'}`, 4000);
      console.debug('[MED Layout Toggle] 排布写入', bak);
      this.refreshLeaves(file);
    } catch (e) {
      new Notice('排布切换失败：' + ((e && e.message) || e));
    }
  }

  /* ---------------- 同类合并 ---------------- */
  async primeCache(file) {
    try {
      const doc = JSON.parse(await this.app.vault.read(file));
      this.rectCache.set(file.path, rectsSnapshot(doc));
    } catch (e) { /* 忽略 */ }
  }

  /* ---- 三路触发的统一检查入口（modify / pointerup / mtime 轮询） ---- */
  scheduleMergeCheck(file, delay) {
    if (!file || file.extension !== 'ncanvas') return;
    const key = file.path;
    const old = this.pendingCheck.get(key);
    if (old) window.clearTimeout(old);
    const t = window.setTimeout(() => {
      this.pendingCheck.delete(key);
      this.mergeCheck(file);
    }, delay == null ? 320 : delay);
    this.pendingCheck.set(key, t);
  }

  pollTick() {
    for (const leaf of this.ncanvasLeaves()) {
      const f = this.leafFile(leaf);
      if (!f) continue;
      const m = (f.stat && f.stat.mtime) || 0;
      if (this.lastMtime.get(f.path) !== m) {
        this.lastMtime.set(f.path, m);
        this.scheduleMergeCheck(f, 150);
      }
    }
  }

  /** 统一的写入通道：先滚动备份，再写文件（任何写入都有后悔药） */
  async writeDoc(file, doc, tag) {
    let before = null;
    try { before = await this.app.vault.read(file); } catch (e) { /* 忽略 */ }
    const bak = before ? backupFileText(before, file.path) : null;
    this.busy.add(file.path);
    try {
      await this.app.vault.modify(file, JSON.stringify(doc, null, 2));
      this.rectCache.set(file.path, rectsSnapshot(doc));
    } finally { window.setTimeout(() => this.busy.delete(file.path), 800); }
    console.debug(`[MED Layout Toggle] 写入(${tag || '-'})`, bak || '（未备份）');
    return bak;
  }

  /** 恢复：用最近一份自动备份覆盖当前画布 */
  async restoreLatestBackup() {
    const file = this.activeNcanvasFile();
    if (!file) { new Notice('当前没有打开 .ncanvas 文件'); return; }
    try {
      const fs = require('fs'); const os = require('os'); const pathMod = require('path');
      const dir = pathMod.join(os.tmpdir(), 'med-ncanvas-backups');
      const safe = pathMod.basename(file.path).replace(/[\\/:*?"<>|]/g, '_') + '.';
      const list = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.startsWith(safe)).sort() : [];
      if (!list.length) { new Notice('没有该画布的自动备份（插件每次写入前会自动生成）'); return; }
      const newest = list[list.length - 1];
      const doc = JSON.parse(fs.readFileSync(pathMod.join(dir, newest), 'utf8'));
      await this.writeDoc(file, doc, 'restore');
      new Notice(`已恢复自备份：${newest}\n（共 ${list.length} 份，最早 ${list[0].slice(safe.length)}）`, 8000);
      this.refreshLeaves(file);
    } catch (e) {
      new Notice('恢复失败：' + ((e && e.message) || e));
    }
  }

  /** 正在输入？（节点编辑器/任何输入框获得焦点时一律不打扰） */
  isEditing() {
    try {
      const el = document.activeElement;
      if (!el) return false;
      const tag = (el.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
      if (el.isContentEditable) return true;
      if (el.closest && el.closest('.ng-editor,.ng-node-editor,.modal,.prompt')) return true;
      return false;
    } catch (e) { return false; }
  }

  async mergeCheck(file) {
    if (!file || file.extension !== 'ncanvas') return;
    if (this.busy.has(file.path)) return;
    // 正在输入就退避，1.2 秒后再看一次——绝不在这里动文件
    if (this.isEditing()) { this.scheduleMergeCheck(file, 1200); return; }
    let raw;
    try { raw = await this.app.vault.read(file); } catch (e) { return; }
    let doc;
    try { doc = JSON.parse(raw); } catch (e) { return; }
    const prev = this.rectCache.get(file.path);
    this.rectCache.set(file.path, rectsSnapshot(doc));
    this.lastMtime.set(file.path, (file.stat && file.stat.mtime) || 0);
    if (!this.settings.autoMerge || !prev) return;

    const types = this.settings.mergeChoice ? DEFAULT_MERGE_TYPES : MERGE_TYPES;
    // 在副本上操作：任何异常都不写入
    const working = JSON.parse(raw);
    let log;
    try {
      log = mergeOverlaps(working, prev, { ratio: this.settings.overlapRatio, types });
    } catch (e) {
      new Notice('合并已中止（未写入任何改动）：' + ((e && e.message) || e), 8000);
      console.error('[MED Layout Toggle] 合并中止', e);
      return;
    }

    if (log.merged.length) {
      // 只为"刚被合并的目标块"fit 框体——绝不做全画布尺寸巡检，也绝不重排其他卡片
      for (const m of log.merged) {
        const t = (working.project.nodes || []).find((n) => n.id === m.targetId);
        if (t) fitNodeSize(t);
      }
      let ov = 0;
      try { ov = measure(working.project.nodes, {}).overlaps; } catch (e) { /* 忽略 */ }
      const bak = await this.writeDoc(file, working, 'merge');
      const first = log.merged[0];
      const extra = log.merged.length > 1 ? `（共 ${log.merged.length} 组）` : '';
      new Notice(
        `已合并同类：${first.type}${extra}｜目标块在前｜重叠率 ${first.ratio}%｜重连 ${log.rewired} 条线` +
        (ov ? `｜其余卡片位置未动（当前有 ${ov} 处重叠，需要时点「尺寸：整理」）` : '｜零重叠'),
        6000);
      console.debug('[MED Layout Toggle] 合并完成（未重排）', log, { overlaps: ov }, bak);
      this.refreshLeaves(file);
      return;
    }

    // 没合并：只在"确有结构损坏（悬空连线）"且本会话尚未修过该文件时，静默清理一次（不刷新视图、不打断）
    const ghosts = (working.project.links || []).some((l) => {
      const ids = new Set((working.project.nodes || []).map((n) => n.id));
      return !ids.has(l.from) || !ids.has(l.to);
    });
    if (ghosts && !this.repairedOnce.has(file.path)) {
      this.repairedOnce.add(file.path);
      try {
        const rep = repairDoc(working, { sizes: false });   // 只清悬空线，不碰尺寸
        if (rep.bridged + rep.dropped) {
          await this.writeDoc(file, working, 'repair-dangling');
          new Notice(`已清理悬空连线（桥接 ${rep.bridged}｜丢弃 ${rep.dropped}）；若画面未更新，重开该标签页即可`, 6000);
          return;
        }
      } catch (e) { console.error('[MED Layout Toggle] 悬空线清理失败', e); }
    }

    if (log.skipped.length && Date.now() - this.lastSkipNotice > 10000) {
      this.lastSkipNotice = Date.now();
      const s = log.skipped[0];
      new Notice(`未合并：${s.type}（${s.reason}）｜把卡片压得更深些，或在设置里调低阈值`, 5000);
      console.debug('[MED Layout Toggle] 合并跳过', log.skipped);
    }
  }

  /* ---- 一键整理框体尺寸（手动触发，绝不在后台跑） ---- */
  async tidySizes() {
    const file = this.activeNcanvasFile();
    if (!file) { new Notice('当前没有打开 .ncanvas 文件'); return; }
    let raw;
    try { raw = await this.app.vault.read(file); } catch (e) { new Notice('读取失败：' + ((e && e.message) || e)); return; }
    const working = JSON.parse(raw);
    let sizes, rep;
    try {
      sizes = fitSizesSweep(working, { width: this.settings.stdWidth });
      rep = repairDoc(working);
    } catch (e) {
      new Notice('整理已中止（未写入任何改动）：' + ((e && e.message) || e), 8000);
      return;
    }
    const links = rep.bridged + rep.dropped;
    let flat;
    try {
      if (this.settings.noOverlap) flat = flattenIfOverlapping(working);
      else { const m = measure(working.project.nodes, {}); flat = { before: m, after: m, moved: false }; }
    } catch (e) { const m = measure(working.project.nodes, {}); flat = { before: m, after: m, moved: false }; }

    const total = sizes.widened + sizes.grown + sizes.shrunk + sizes.geom + links + (flat.moved ? 1 : 0);
    if (!total) {
      new Notice(`已是标准宽度 ${this.settings.stdWidth}px、高度合身、且零重叠（跳过 ${sizes.skipped} 个 Choice 等）`, 4000);
      return;
    }
    await this.writeDoc(file, working, 'tidy-sizes');
    new Notice(
      `已整理框体：统一宽度 ${sizes.widened}（→${this.settings.stdWidth}px）｜撑高 ${sizes.grown}｜收矮 ${sizes.shrunk}｜补缺 ${sizes.geom}` +
      (links ? `｜清理悬空线 ${links}` : '') +
      `｜重叠 ${flat.before.overlaps}→${flat.after.overlaps}${flat.moved ? '（已自动重排为当前排布样式）' : ''}`,
      7000);
    console.debug('[MED Layout Toggle] 尺寸整理', sizes, rep, flat);
    this.refreshLeaves(file);
  }

  /* ---- 结构修复（悬空连线 / 卡片尺寸） ---- */
  async repairActive() {
    const file = this.activeNcanvasFile();
    if (!file) { new Notice('当前没有打开 .ncanvas 文件'); return; }
    let doc;
    try { doc = JSON.parse(await this.app.vault.read(file)); } catch (e) { new Notice('解析失败：' + e.message); return; }
    const rep = repairDoc(doc);
    let ov = 0;
    try { ov = measure(doc.project.nodes, {}).overlaps; } catch (e) { /* 忽略 */ }
    const total = rep.bridged + rep.dropped + rep.resized + rep.geom;
    if (!total) { new Notice(`结构检查通过：无悬空连线、无缺失/过小尺寸${ov ? `（现有 ${ov} 处重叠，需要时点「尺寸：整理」）` : '、零重叠'}`, 4000); return; }
    await this.writeDoc(file, doc, 'repair');
    new Notice(`已修复画布结构：尺寸 ${rep.resized}｜桥接悬空线 ${rep.bridged}｜丢弃 ${rep.dropped}｜补几何 ${rep.geom}` +
      `｜位置未动${ov ? `（当前 ${ov} 处重叠）` : ''}`, 6000);
    console.debug('[MED Layout Toggle] 结构修复（未重排）', rep, { overlaps: ov });
    this.refreshLeaves(file);
  }

  /* ---- 诊断：为什么没合并 ---- */
  async diagnose() {
    const file = this.activeNcanvasFile();
    if (!file) { new Notice('当前没有打开 .ncanvas 文件'); return; }
    let doc;
    try { doc = JSON.parse(await this.app.vault.read(file)); } catch (e) { new Notice('解析失败：' + e.message); return; }
    const types = this.settings.mergeChoice ? DEFAULT_MERGE_TYPES : MERGE_TYPES;
    const nodes = doc.project.nodes || [];
    const pairs = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let k = i + 1; k < nodes.length; k++) {
        const a = nodes[i], b = nodes[k];
        if (a.type !== b.type || types.indexOf(a.type) < 0) continue;
        const ra = rectOf(a), rb = rectOf(b), area = overlapArea(ra, rb);
        if (area <= 0) continue;
        const ratio = Math.round((area / Math.min(ra.w * ra.h, rb.w * rb.h)) * 100);
        const centered = centerIn(ra, rb) || centerIn(rb, ra);
        pairs.push(`${a.id}↔${b.id} ${a.type} ${ratio}%${centered ? '（中心已压住→会合并）' : '（仅边缘相接）'}`);
      }
    }
    const mtimeOk = this.lastMtime.get(file.path) === ((file.stat && file.stat.mtime) || 0);
    const lines = [
      `自动合并 ${this.settings.autoMerge ? '开' : '关'}｜阈值 ${Math.round(this.settings.overlapRatio * 100)}%｜Choice ${this.settings.mergeChoice ? '参与' : '不参与'}`,
      `快照 ${this.rectCache.has(file.path) ? '已建立' : '缺失（首次只建快照）'}｜mtime 轮询 ${mtimeOk ? '已同步' : '待同步'}`,
      `重叠同类对：${pairs.length ? pairs.join('；') : '无（两块没压到一起）'}`,
    ];
    console.debug('[MED Layout Toggle] 诊断\n' + lines.join('\n'));
    new Notice(lines.join('\n'), 10000);
  }

  async mergeActiveNow() {
    const file = this.activeNcanvasFile();
    if (!file) { new Notice('当前没有打开 .ncanvas 文件'); return; }
    let doc;
    try { doc = JSON.parse(await this.app.vault.read(file)); } catch (e) { new Notice('解析失败：' + e.message); return; }

    const log = { merged: [], rewired: 0, dropped: 0 };
    const types = this.settings.mergeChoice ? DEFAULT_MERGE_TYPES : MERGE_TYPES;
    const done = new Set();
    const before0 = contentChars(doc);
    try {
      for (const m of doc.project.nodes.slice()) {
        if (done.has(m.id) || types.indexOf(m.type) < 0) continue;
        const cur = doc.project.nodes.find((n) => n.id === m.id);      // 实时解析，防幽灵
        if (!cur) continue;
        const r = rectOf(cur);
        let best = null;
        for (const t of doc.project.nodes) {
          if (t.id === cur.id || t.type !== cur.type || done.has(t.id)) continue;
          const area = overlapArea(r, rectOf(t));
          if (area <= 0) continue;
          const minArea = Math.min(r.w * r.h, rectOf(t).w * rectOf(t).h);
          if (area / minArea < 0.1) continue;
          if (!best || area > best.area) best = { target: t, area };
        }
        if (!best) continue;
        const targetId = best.target.id;
        if (!doc.project.nodes.some((n) => n.id === targetId)) continue;
        let remap = null;
        if (cur.type === CHOICE_TYPE) {
          const tOpts = normalizeOptions(best.target);
          const mOpts = normalizeOptions(cur);
          const indexMap = new Map();
          mOpts.forEach((op, i) => indexMap.set(i, tOpts.length + i));
          remap = { indexMap, labels: mOpts.map((op) => op.label) };
        }
        const info = mergePair(best.target, cur);
        const c = contractEdges(doc, targetId, cur.id, remap);
        done.add(cur.id);
        log.merged.push({ type: cur.type, targetId, movedId: cur.id, added: info.added });
        log.rewired += c.rewired; log.dropped += c.dropped;
      }
      if (contentChars(doc) < before0) throw new Error(`正文减少 ${before0 - contentChars(doc)} 字，已中止`);
    } catch (e) {
      new Notice('合并已中止（未写入任何改动）：' + ((e && e.message) || e), 8000);
      return;
    }
    if (!log.merged.length) { new Notice('没有发现可合并的重叠同类块'); return; }
    repairDoc(doc, { sizes: false });          // 只修连线，绝不重算其他卡片尺寸
    let ov = 0;
    try { ov = measure(doc.project.nodes, {}).overlaps; } catch (e) { /* 忽略 */ }
    await this.writeDoc(file, doc, 'merge-manual');
    new Notice(`手动合并 ${log.merged.length} 组｜重连 ${log.rewired} 条线｜丢弃 ${log.dropped} 条重复/自环线` +
      (ov ? `｜其余卡片位置未动（当前 ${ov} 处重叠）` : '｜零重叠'), 6000);
    this.refreshLeaves(file);
  }

  /* ---------------- 视图刷新（尽量不打断输入） ---------------- */
  refreshLeaves(file, attempt) {
    const n = attempt || 0;
    if (this.isEditing() && n < 8) {                    // 正在输入 → 延后，别抢焦点
      window.setTimeout(() => this.refreshLeaves(file, n + 1), 1500);
      return;
    }
    for (const leaf of this.ncanvasLeaves()) {
      const v = leaf.view;
      const f = this.leafFile(leaf);
      if (!f || !file || f.path !== file.path) continue;
      if (typeof v.onLoadFile === 'function') {
        try { v.onLoadFile(f); continue; } catch (e) { /* 退回重建视图 */ }
      }
      const state = leaf.getViewState();
      leaf.setViewState({ type: 'empty' }).then(() => leaf.setViewState(state)).catch(() => {});
    }
    window.setTimeout(() => this.ensureButtons(), 400);
  }
}

module.exports = MedLayoutToggle;
MedLayoutToggle.__test = {
  graphInfo, measure, boxOf, estHeight, colWidth, stackHeight, squareMetrics,
  layoutRow, layoutSquare, detectMode, applyLayout, flattenIfOverlapping,
  rectOf, overlapArea, rectsSnapshot, turnsOf, bodyFromTurns, mergePair, contractEdges, mergeOverlaps,
  normalizeOptions, mergeChoiceInto, fitNodeSize, fitSizesSweep, repairDoc, centerIn, contentChars,
  MODE_LABEL, MERGE_TYPES, DEFAULT_MERGE_TYPES, CHOICE_TYPE, DEF,
};
