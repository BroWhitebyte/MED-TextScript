'use strict';
/* 零重叠保证测试：node test_layout_overlap.js <plugin main.js> [真实.ncanvas ...]
   1) 随机极端尺寸文档（长文本 / 超宽 / 超高 / 分支）→ 横排与方形都必须 overlaps === 0
   2) 真实文件 → 两种模式都必须 overlaps === 0，且正文与连线不变                       */
const Module = require('module');
const fs = require('fs');

class PluginStub { constructor() {} }
const origLoad = Module._load;
Module._load = function (request) {
  if (request === 'obsidian') {
    return {
      Plugin: PluginStub,
      Notice: class { constructor(m) { this.m = m; } },
      PluginSettingTab: class { constructor() {} },
      Setting: class { constructor() {} },
    };
  }
  return origLoad.apply(this, arguments);
};

const mainPath = process.argv[2];
const realFiles = process.argv.slice(3);
const t = require(mainPath).__test;
if (!t) { console.error('main.js 未暴露 __test'); process.exit(3); }

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? '  → ' + extra : '')); }
}

/* 简易可复现随机 */
let seed = 20260927;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }

function makeDoc(nodeCount) {
  const nodes = [{ id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0, width: 200, height: 60 }];
  const links = [];
  const types = ['Content', 'Content', 'Dialog', 'Choice'];
  for (let i = 0; i < nodeCount; i++) {
    const type = types[Math.floor(rnd() * types.length)];
    const w = [480, 480, 420, 800, 900][Math.floor(rnd() * 5)];
    const h = [80, 160, 320, 600][Math.floor(rnd() * 4)];
    const node = { id: 'n' + i, type, body: '', x: 0, y: 0, width: w, height: h };
    if (type === 'Content') {
      const lines = 1 + Math.floor(rnd() * 12);                    // 长正文 → 估算很高
      node.body = Array.from({ length: lines }, (_, k) => `第${k}行` + '字'.repeat(Math.floor(rnd() * 60))).join('\n');
    } else if (type === 'Dialog') {
      const turns = 1 + Math.floor(rnd() * 8);
      node.turns = Array.from({ length: turns }, (_, k) => ({ speaker: '甲', line: `“台词${k}”` + '字'.repeat(Math.floor(rnd() * 30)) }));
      node.body = node.turns.map((x) => `${x.speaker}: ${x.line}`).join('\n');
    } else {
      node.choices = ['甲', '乙'];
      node.choiceOptions = [{ id: 'opt_1', label: '甲', requires: '', effects: [] }, { id: 'opt_2', label: '乙', requires: '', effects: [] }];
    }
    nodes.push(node);
    if (i === 0) links.push({ from: 'n_entry', to: 'n' + i });
    else links.push({ from: 'n' + (i - 1), to: 'n' + i });
    if (type === 'Choice' && i > 2) {                              // 制造分支，让同一深度出现多块
      links.push({ from: 'n' + i, to: 'n' + (i - 1), choiceOptionId: 'opt_1', choiceIndex: 0, label: '甲' });
    }
  }
  return { project: { title: 'stress', notes: '', variables: {}, characters: [], nodes, links }, ui: {} };
}

console.log('== 1) 随机极端尺寸：横排 / 方形都零重叠 ==');
{
  const doc = makeDoc(60);
  const sigBefore = JSON.stringify(doc.project.nodes.map((n) => n.body || '')) + '|' + doc.project.links.length;

  const row = t.applyLayout(doc, 'row');
  ok('横排 overlaps === 0', row.overlaps === 0, JSON.stringify(row));
  ok('横排 relax 收敛', row.relax === true);
  ok('横排无 NaN 坐标', doc.project.nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y)));

  const sq = t.applyLayout(doc, 'square');
  ok('方形 overlaps === 0', sq.overlaps === 0, JSON.stringify(sq));
  ok('方形 relax 收敛', sq.relax === true);
  const sigAfter = JSON.stringify(doc.project.nodes.map((n) => n.body || '')) + '|' + doc.project.links.length;
  ok('排布不动内容（正文与连线数不变）', sigBefore === sigAfter);
}

console.log('== 2) 单深度多块（分支兄弟）堆叠不重叠 ==');
{
  const doc = {
    project: {
      title: 'branch', notes: '', variables: {}, characters: [],
      nodes: [
        { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0, width: 200, height: 60 },
        { id: 'n0', type: 'Choice', body: '', x: 0, y: 0, width: 480, height: 160, choices: ['a', 'b', 'c'], choiceOptions: [] },
        { id: 'n1', type: 'Content', body: '甲'.repeat(400), x: 0, y: 0, width: 480, height: 160 },
        { id: 'n2', type: 'Content', body: '乙'.repeat(400), x: 0, y: 0, width: 480, height: 600 },
        { id: 'n3', type: 'Content', body: '丙'.repeat(400), x: 0, y: 0, width: 900, height: 160 },
      ],
      links: [
        { from: 'n_entry', to: 'n0' },
        { from: 'n0', to: 'n1', choiceOptionId: 'opt_1', choiceIndex: 0, label: 'a' },
        { from: 'n0', to: 'n2', choiceOptionId: 'opt_2', choiceIndex: 1, label: 'b' },
        { from: 'n0', to: 'n3', choiceOptionId: 'opt_3', choiceIndex: 2, label: 'c' },
      ],
    },
    ui: {},
  };
  const sq = t.applyLayout(doc, 'square');
  ok('方形零重叠（含 900 宽 / 600 高节点）', sq.overlaps === 0, JSON.stringify(sq));
  const row = t.applyLayout(doc, 'row');
  ok('横排零重叠（含 900 宽 / 600 高节点）', row.overlaps === 0, JSON.stringify(row));
}

console.log('== 3) 长链（深度 120）：两模式零重叠 ==');
{
  const doc = makeDoc(120);
  const row = t.applyLayout(doc, 'row');
  ok('横排零重叠', row.overlaps === 0, JSON.stringify(row));
  const sq = t.applyLayout(doc, 'square');
  ok('方形零重叠', sq.overlaps === 0, JSON.stringify(sq));
  ok('方形近方形（长宽比 < 3）', sq.aspect < 3, 'aspect=' + sq.aspect);
}

for (const f of realFiles) {
  const name = f.split(/[\\/]/).pop();
  console.log('== 真实文件：' + name + ' ==');
  const raw = fs.readFileSync(f, 'utf8');
  const d1 = JSON.parse(raw);
  const before = JSON.stringify(d1.project.nodes.map((n) => n.body || '')) + '|' + d1.project.links.map((l) => l.from + '>' + l.to).join(',') + '|' + (d1.project.notes || '');
  const row = t.applyLayout(d1, 'row');
  ok('横排零重叠（节点 ' + d1.project.nodes.length + '）', row.overlaps === 0, JSON.stringify(row));
  const d2 = JSON.parse(raw);
  const sq = t.applyLayout(d2, 'square');
  ok('方形零重叠（节点 ' + d2.project.nodes.length + '）', sq.overlaps === 0, JSON.stringify(sq));
  const after = JSON.stringify(d2.project.nodes.map((n) => n.body || '')) + '|' + d2.project.links.map((l) => l.from + '>' + l.to).join(',') + '|' + (d2.project.notes || '');
  ok('内容零改动', before === after);
}

console.log(`\n结果：PASS=${pass}  FAIL=${fail}`);
process.exit(fail ? 1 : 0);
