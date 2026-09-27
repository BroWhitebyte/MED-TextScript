'use strict';
/* .ncanvas 结构审计：找出会导致"框体丢失/渲染异常"的成因
   用法: node ncanvas_audit.js <x.ncanvas> [...]                                        */
const fs = require('fs');

const KNOWN = ['Entry', 'Content', 'Dialog', 'Choice', 'End', 'Marker', 'Event'];
let bad = 0;

for (const file of process.argv.slice(2)) {
  console.log('===== ' + file.split(/[\\/]/).pop());
  let doc;
  try { doc = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { console.log('  ✘ JSON 解析失败：' + e.message); bad++; continue; }

  const nodes = (doc.project && doc.project.nodes) || [];
  const links = (doc.project && doc.project.links) || [];
  const ids = new Set();
  const dupIds = [];
  const noType = [], badType = [], noGeom = [], zeroSize = [], emptyNode = [], noId = [];
  const sizeHist = {};

  for (const n of nodes) {
    if (!n.id) { noId.push(JSON.stringify(n).slice(0, 60)); continue; }
    if (ids.has(n.id)) dupIds.push(n.id);
    ids.add(n.id);
    if (!n.type) noType.push(n.id);
    else if (KNOWN.indexOf(n.type) < 0) badType.push(n.id + ':' + n.type);
    if (typeof n.x !== 'number' || typeof n.y !== 'number') noGeom.push(n.id);
    const w = n.width, h = n.height;
    if (n.type === 'Content' || n.type === 'Dialog' || n.type === 'Choice') {
      if (w != null && (w <= 0)) zeroSize.push(n.id + ' w=' + w);
      if (h != null && (h <= 0)) zeroSize.push(n.id + ' h=' + h);
      const key = n.type + ' w=' + (w == null ? '缺失' : w) + ' h=' + (h == null ? '缺失' : h) + ' manual=' + (n.manualSize === true);
      sizeHist[key] = (sizeHist[key] || 0) + 1;
    }
    const hasBody = !!(n.body && String(n.body).trim());
    const hasTurns = Array.isArray(n.turns) && n.turns.length > 0;
    const hasChoices = Array.isArray(n.choices) && n.choices.length > 0;
    if (n.type === 'Content' && !hasBody) emptyNode.push(n.id + '(Content 空正文)');
    if (n.type === 'Dialog' && !hasTurns && !hasBody) emptyNode.push(n.id + '(Dialog 无 turns 无正文)');
    if (n.type === 'Choice' && !hasChoices) emptyNode.push(n.id + '(Choice 无选项)');
  }

  const dangling = [];
  for (const l of links) {
    if (!ids.has(l.from)) dangling.push(l.id + ' from=' + l.from);
    if (!ids.has(l.to)) dangling.push(l.id + ' to=' + l.to);
  }

  const choiceIssues = [];
  for (const n of nodes) {
    if (n.type !== 'Choice') continue;
    const labels = Array.isArray(n.choices) ? n.choices : [];
    const opts = Array.isArray(n.choiceOptions) ? n.choiceOptions : [];
    if (labels.length !== opts.length) choiceIssues.push(`${n.id} choices=${labels.length} choiceOptions=${opts.length}`);
    const oid = new Set();
    for (const o of opts) {
      if (!o || !o.id) choiceIssues.push(`${n.id} 有选项缺 id`);
      else if (oid.has(o.id)) choiceIssues.push(`${n.id} 选项 id 重复 ${o.id}`);
      else oid.add(o.id);
    }
    const outs = links.filter((l) => l.from === n.id);
    for (const l of outs) {
      if (typeof l.choiceIndex === 'number' && (l.choiceIndex < 0 || l.choiceIndex >= labels.length)) {
        choiceIssues.push(`${n.id} 出边 ${l.id} choiceIndex=${l.choiceIndex} 越界（选项数 ${labels.length}）`);
      }
    }
  }

  const linkIds = new Set();
  const dupLinks = [];
  for (const l of links) { if (linkIds.has(l.id)) dupLinks.push(l.id); linkIds.add(l.id); }

  const report = (label, arr) => {
    if (!arr.length) { console.log('  ✔ ' + label + '：无'); return; }
    bad += arr.length;
    console.log(`  ✘ ${label}（${arr.length}）：` + arr.slice(0, 12).join('；') + (arr.length > 12 ? ' …' : ''));
  };

  console.log(`  节点 ${nodes.length}｜连线 ${links.length}｜类型：` + JSON.stringify(nodes.reduce((m, n) => { m[n.type] = (m[n.type] || 0) + 1; return m; }, {})));
  report('缺 id', noId);
  report('id 重复', dupIds);
  report('缺 type', noType);
  report('未知 type（插件不认识→不画框）', badType);
  report('缺 x/y', noGeom);
  report('宽或高 ≤ 0', zeroSize);
  report('空节点（无正文/无 turns/无选项）', emptyNode);
  report('悬空连线（指向不存在的节点）', dangling);
  report('Choice 选项表问题', choiceIssues);
  report('连线 id 重复', dupLinks);
  console.log('  尺寸分布：');
  for (const k of Object.keys(sizeHist).sort()) console.log('    ' + k + '  ×' + sizeHist[k]);
  const est = nodes.filter((n) => n.type === 'Content' && n.width && n.height)
    .map((n) => {
      const per = Math.max(8, Math.floor((n.width - 24) / 22));
      let lines = 0;
      for (const seg of String(n.body || '').split('\n')) lines += Math.max(1, Math.ceil(seg.length / per));
      return { id: n.id, stored: n.height, est: 54 + lines * 26, ratio: Math.round((54 + lines * 26) / n.height * 100) / 100 };
    })
    .filter((x) => x.ratio > 1.3)
    .sort((a, b) => b.ratio - a.ratio);
  if (est.length) {
    console.log(`  文件高度明显小于文本估算（可能被裁切/看起来"没有框"）共 ${est.length} 个，最突出：` + est.slice(0, 8).map((x) => `${x.id} 存${x.stored} vs 估${x.est}（${x.ratio}×）`).join('；'));
    bad += est.length;
  } else {
    console.log('  ✔ 高度 vs 文本估算：无异常');
  }
}

console.log(bad ? `\n合计发现 ${bad} 处异常` : '\n未发现结构异常');
process.exit(bad ? 1 : 0);
