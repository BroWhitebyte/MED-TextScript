'use strict';
/* 连线修补器（带备份）：按 patch 增/改/删连线，并重编号连线 id
   用法: node patch_links.js <x.ncanvas> <patch.json>
   patch.json:
   {
     "add":  [ { "from":"n85", "to":"n39", "choiceIndex":2, "label":"…" } ],
     "set":  [ { "from":"n84", "to":"n85", "choiceIndex":1, "choiceOptionId":"opt_2" } ],
     "remove":[ { "from":"n1", "to":"n2" } ]
   }
   只改连线；节点、正文一律不动。写入前备份到 %TEMP%\med-ncanvas-backups。            */
const fs = require('fs');
const os = require('os');
const path = require('path');

const [canvasPath, patchPath] = process.argv.slice(2);
if (!canvasPath || !patchPath) { console.error('usage: node patch_links.js <x.ncanvas> <patch.json>'); process.exit(2); }

const raw = fs.readFileSync(canvasPath, 'utf8');
const doc = JSON.parse(raw);
const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'));
const ids = new Set(doc.project.nodes.map((n) => n.id));
const links = doc.project.links || [];

const log = [];
const key = (l) => `${l.from}>${l.to}`;

for (const r of (patch.remove || [])) {
  const before = links.length;
  doc.project.links = links.filter((l) => !(l.from === r.from && l.to === r.to));
  if (doc.project.links.length === before) log.push(`  ⚠ 未找到要删的线 ${key(r)}`);
  else log.push(`  ✂ 删除 ${key(r)}`);
}
const live = doc.project.links;

for (const s of (patch.set || [])) {
  const l = live.find((x) => x.from === s.from && x.to === s.to);
  if (!l) { log.push(`  ⚠ 未找到要改的线 ${key(s)}`); continue; }
  const changes = [];
  for (const k of ['choiceIndex', 'choiceOptionId', 'label', 'to', 'from']) {
    if (s[k] !== undefined && l[k] !== s[k]) { changes.push(`${k}:${l[k]}→${s[k]}`); l[k] = s[k]; }
  }
  log.push(changes.length ? `  ✎ 改 ${key(s)}：${changes.join('，')}` : `  · ${key(s)} 无需改动`);
}

for (const a of (patch.add || [])) {
  if (!ids.has(a.from) || !ids.has(a.to)) { log.push(`  ⚠ 端点不存在，跳过 ${key(a)}`); continue; }
  if (live.some((l) => l.from === a.from && l.to === a.to && (l.choiceIndex === a.choiceIndex || a.choiceIndex === undefined))) {
    log.push(`  · ${key(a)} 已存在，跳过`);
    continue;
  }
  const nl = { id: 'tmp', from: a.from, to: a.to, toPort: { side: 'left', t: 0.5 } };
  if (a.choiceIndex !== undefined) nl.choiceIndex = a.choiceIndex;
  if (a.choiceOptionId !== undefined) nl.choiceOptionId = a.choiceOptionId;
  if (a.label !== undefined) nl.label = a.label;
  live.push(nl);
  log.push(`  ＋ 新增 ${key(a)}${a.choiceIndex !== undefined ? `（idx ${a.choiceIndex}${a.label ? '，' + a.label : ''}）` : ''}`);
}

live.forEach((l, i) => { l.id = 'l' + i; });

const dir = path.join(os.tmpdir(), 'med-ncanvas-backups');
fs.mkdirSync(dir, { recursive: true });
const bak = path.join(dir, path.basename(canvasPath).replace(/[\\/:*?"<>|]/g, '_') + '.' + Date.now() + '.bak.ncanvas');
fs.writeFileSync(bak, raw, 'utf8');
fs.writeFileSync(canvasPath, JSON.stringify(doc, null, 2), 'utf8');

console.log(`patching ${path.basename(canvasPath)}`);
for (const l of log) console.log(l);
console.log(`  连线数 ${JSON.parse(raw).project.links.length} → ${live.length}｜备份 ${bak}`);
