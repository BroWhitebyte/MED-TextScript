'use strict';
/* 从备份里把丢失的节点还原回当前画布（按原邻居位置插回链路）
   用法: node restore_nodes.js <当前文件> <备份文件> <节点id,逗号分隔>                        */
const fs = require('fs');
const os = require('os');
const path = require('path');

const [curPath, bakPath, idList] = process.argv.slice(2);
if (!curPath || !bakPath || !idList) { console.error('usage: node restore_nodes.js <current> <backup> <id,id>'); process.exit(2); }
const want = idList.split(',').map((s) => s.trim()).filter(Boolean);

const cur = JSON.parse(fs.readFileSync(curPath, 'utf8'));
const bak = JSON.parse(fs.readFileSync(bakPath, 'utf8'));
const curIds = new Set(cur.project.nodes.map((n) => n.id));
const bakNodes = new Map(bak.project.nodes.map((n) => [n.id, n]));
const bakLinks = bak.project.links || [];

// 备份中每个节点的前后邻居（用于插回）
function neighborsOf(id) {
  const prev = bakLinks.filter((l) => l.to === id && !l.choiceOptionId);
  const next = bakLinks.filter((l) => l.from === id && !l.choiceOptionId);
  return { prev: prev.map((l) => l.from), next: next.map((l) => l.to) };
}

const restored = [];
for (const id of want) {
  if (curIds.has(id)) { console.log(`SKIP ${id} — 当前文件已有该节点`); continue; }
  const src = bakNodes.get(id);
  if (!src) { console.log(`SKIP ${id} — 备份里没有该节点`); continue; }
  const nb = neighborsOf(id);
  const alive = (x) => x && curIds.has(x);
  const from = nb.prev.find(alive) || nb.next.find(alive);
  const after = nb.next.find((x) => x && curIds.has(x));

  const node = JSON.parse(JSON.stringify(src));
  cur.project.nodes.push(node);
  curIds.add(id);

  const links = cur.project.links;
  // 情况一：原前驱与后继都在 → 拆掉它们的直连，插回本节点
  if (alive(nb.prev[0]) && alive(nb.next[0])) {
    const direct = links.find((l) => l.from === nb.prev[0] && l.to === nb.next[0] && !l.choiceOptionId);
    if (direct) {
      direct.to = id;
      links.push({ id: 'tmp', from: id, to: nb.next[0], toPort: { side: 'left', t: 0.5 } });
      restored.push(`${id}（插回 ${nb.prev[0]} → ${id} → ${nb.next[0]}）`);
      continue;
    }
  }
  // 情况二：只有一个活动邻居 → 挂在其后/其前
  if (from && alive(nb.next[0])) {
    links.push({ id: 'tmp', from: from, to: id, toPort: { side: 'left', t: 0.5 } });
    links.push({ id: 'tmp', from: id, to: nb.next[0], toPort: { side: 'left', t: 0.5 } });
    restored.push(`${id}（挂在 ${from} → ${id} → ${nb.next[0]}）`);
    continue;
  }
  restored.push(`${id}（无可用邻居，作为游离节点还原，需你手工接线）`);
}

// 尺寸补全 + 连线 id 重编号
const per = (n) => { const w = n.width || 480; return Math.max(8, Math.floor((w - 24) / 22)); };
for (const n of cur.project.nodes) {
  if (n.type !== 'Content' && n.type !== 'Dialog') continue;
  if (!n.width) n.width = n.type === 'Dialog' ? 420 : 480;
  let need;
  if (n.type === 'Dialog') {
    const turns = (Array.isArray(n.turns) && n.turns.length) ? n.turns.length : String(n.body || '').split('\n').filter((s) => s.trim()).length;
    need = 54 + Math.max(1, turns) * 46;
  } else {
    let lines = 0;
    for (const seg of String(n.body || '').split('\n')) lines += Math.max(1, Math.ceil(seg.length / per(n)));
    need = 54 + lines * 26;
  }
  if (need * 1.1 > (n.height || 0)) { n.height = Math.round(need * 1.1); n.manualSize = true; }
}
cur.project.links.forEach((l, i) => { l.id = 'l' + i; });

const bakOut = path.join(os.tmpdir(), path.basename(curPath) + '.' + Date.now() + '.prerestore.bak');
fs.copyFileSync(curPath, bakOut);
fs.writeFileSync(curPath, JSON.stringify(cur, null, 2), 'utf8');

let chars = 0;
for (const n of cur.project.nodes) {
  chars += String(n.body || '').replace(/\s/g, '').length;
  if (Array.isArray(n.turns)) for (const t of n.turns) chars += String((t && t.line) || '').replace(/\s/g, '').length;
}
console.log('还原结果：');
for (const r of restored) console.log('  ✔ ' + r);
console.log(`  节点 ${cur.project.nodes.length}｜连线 ${cur.project.links.length}｜正文 ${chars} 字`);
console.log(`  还原前状态已备份：${bakOut}`);
