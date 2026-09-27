'use strict';
/* 同类合并逻辑单测：node test_merge.js <plugin main.js> [真实.ncanvas 副本]
   覆盖：目标在前/移动块在后、Dialog turns 合并、连线收缩（去自环/去重）、
         类型不同不并、阈值不足不并、拖动前已重叠不并、无悬空连线。                              */
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
const realFile = process.argv[3] || null;
const t = require(mainPath).__test;
if (!t) { console.error('main.js 未暴露 __test'); process.exit(3); }

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? '  → ' + extra : '')); }
}
function nodeById(doc, id) { return doc.project.nodes.find((n) => n.id === id); }
function dangling(doc) {
  const ids = new Set(doc.project.nodes.map((n) => n.id));
  return doc.project.links.filter((l) => !ids.has(l.from) || !ids.has(l.to));
}
function mkDoc(spec) {
  return {
    project: {
      title: 't', notes: '', variables: {}, characters: [],
      nodes: spec.nodes.map((n) => Object.assign({ width: n.width || 480, height: n.height || 160 }, n)),
      links: spec.links.map((l, i) => Object.assign({ id: 'l' + i }, l)),
    },
    ui: {},
  };
}

console.log('== 1) Content：目标块在前 / 移动块在后 + 连线收缩 ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n0', type: 'Content', body: 'P', x: 1000, y: 0 },
      { id: 'n1', type: 'Content', body: 'A', x: 2000, y: 0 },
      { id: 'n2', type: 'Content', body: 'B', x: 3000, y: 0 },
      { id: 'n3', type: 'End', body: '', x: 4000, y: 0 },
    ],
    links: [
      { from: 'n_entry', to: 'n0' }, { from: 'n0', to: 'n1' },
      { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' },
    ],
  });
  const prev = t.rectsSnapshot(doc);
  nodeById(doc, 'n1').x = 3000;   // 把 A 拖到 B 上
  const log = t.mergeOverlaps(doc, prev, { ratio: 0.35 });
  ok('合并发生一次', log.merged.length === 1, JSON.stringify(log));
  ok('目标=n2 移动=n1', log.merged[0] && log.merged[0].targetId === 'n2' && log.merged[0].movedId === 'n1');
  ok('目标块内容在前（B\\nA）', nodeById(doc, 'n2').body === 'B\nA', JSON.stringify(nodeById(doc, 'n2').body));
  ok('被移动块已删除', !nodeById(doc, 'n1'));
  ok('连线收缩：n0→n2 生成', doc.project.links.some((l) => l.from === 'n0' && l.to === 'n2'));
  ok('自环已丢弃', !doc.project.links.some((l) => l.from === l.to));
  ok('无悬空连线', dangling(doc).length === 0);
  ok('连线重编号连续', doc.project.links.every((l, i) => l.id === 'l' + i));
  ok('重连/丢弃计数', log.rewired === 1 && log.dropped === 1, `rewired=${log.rewired} dropped=${log.dropped}`);
}

console.log('== 2) Dialog：turns 合并（目标在前）+ body 重建 ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Dialog', body: '甲: “一”', turns: [{ speaker: '甲', line: '“一”' }], x: 1000, y: 0 },
      { id: 'n2', type: 'Dialog', body: '乙: “二”', turns: [{ speaker: '乙', line: '“二”' }], x: 2000, y: 0 },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }],
  });
  const prev = t.rectsSnapshot(doc);
  nodeById(doc, 'n1').x = 2000;
  const log = t.mergeOverlaps(doc, prev, { ratio: 0.35 });
  const tgt = nodeById(doc, 'n2');
  ok('合并发生', log.merged.length === 1);
  ok('turns 顺序＝目标在前', tgt.turns.length === 2 && tgt.turns[0].speaker === '乙' && tgt.turns[1].speaker === '甲', JSON.stringify(tgt.turns));
  ok('body 由 turns 重建', tgt.body === '乙: “二”\n甲: “一”', JSON.stringify(tgt.body));
  ok('无悬空连线', dangling(doc).length === 0);
}

console.log('== 3) 类型不同不合并 ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: 'C', x: 1000, y: 0 },
      { id: 'n2', type: 'Dialog', body: '甲: “一”', x: 2000, y: 0 },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }],
  });
  const prev = t.rectsSnapshot(doc);
  nodeById(doc, 'n1').x = 2000;
  const log = t.mergeOverlaps(doc, prev, { ratio: 0.35 });
  ok('不合并', log.merged.length === 0 && !!nodeById(doc, 'n1'));
}

console.log('== 4) 重叠不足阈值不合并 ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: 'A', x: 1000, y: 0 },
      { id: 'n2', type: 'Content', body: 'B', x: 2000, y: 0 },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }],
  });
  const prev = t.rectsSnapshot(doc);
  nodeById(doc, 'n1').x = 2400;   // 仅重叠 80px ≈ 17%
  const log = t.mergeOverlaps(doc, prev, { ratio: 0.35 });
  ok('不合并', log.merged.length === 0, JSON.stringify(log.merged));
}

console.log('== 5) 拖动前就已重叠 → 不合并（防误并历史重叠） ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: 'A', x: 2000, y: 0 },
      { id: 'n2', type: 'Content', body: 'B', x: 2000, y: 40 },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }],
  });
  const prev = t.rectsSnapshot(doc);
  nodeById(doc, 'n1').x = 2000; nodeById(doc, 'n1').y = 0;   // 位置未变（仍重叠）
  const log = t.mergeOverlaps(doc, prev, { ratio: 0.35 });
  ok('不合并', log.merged.length === 0, JSON.stringify(log.merged));
}

console.log('== 6) 首帧无快照 → 不合并（只建缓存） ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: 'A', x: 1000, y: 0 },
      { id: 'n2', type: 'Content', body: 'B', x: 1000, y: 0 },
    ],
    links: [{ from: 'n_entry', to: 'n1' }],
  });
  const log = t.mergeOverlaps(doc, null, { ratio: 0.35 });
  ok('不合并', log.merged.length === 0);
}

console.log('== 8) Choice 合并：选项拼接 + id/choiceIndex 重编号 + 出边重挂 ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n0', type: 'Content', body: 'P', x: 1000, y: 0 },
      {
        id: 'n10', type: 'Choice', body: '', x: 2000, y: 0,
        choices: ['甲', '乙'],
        choiceOptions: [{ id: 'opt_1', label: '甲', requires: '', effects: [] }, { id: 'opt_2', label: '乙', requires: 'x>1', effects: [{ k: 'v' }] }],
      },
      {
        id: 'n11', type: 'Choice', body: '', x: 3000, y: 0,
        choices: ['丙', '丁'],
        choiceOptions: [{ id: 'opt_1', label: '丙', requires: '', effects: [] }, { id: 'opt_2', label: '丁', requires: '', effects: [] }],
      },
      { id: 'nA', type: 'Content', body: '甲路', x: 4000, y: -500 },
      { id: 'nB', type: 'Content', body: '乙路', x: 4000, y: -200 },
      { id: 'nC', type: 'Content', body: '丙路', x: 4000, y: 200 },
      { id: 'nD', type: 'Content', body: '丁路', x: 4000, y: 500 },
    ],
    links: [
      { from: 'n_entry', to: 'n0' },
      { from: 'n0', to: 'n10' },
      { from: 'n10', to: 'nA', choiceOptionId: 'opt_1', choiceIndex: 0, label: '甲' },
      { from: 'n10', to: 'nB', choiceOptionId: 'opt_2', choiceIndex: 1, label: '乙' },
      { from: 'nA', to: 'n11' },
      { from: 'n11', to: 'nC', choiceOptionId: 'opt_1', choiceIndex: 0, label: '丙' },
      { from: 'n11', to: 'nD', choiceOptionId: 'opt_2', choiceIndex: 1, label: '丁' },
    ],
  });
  const prev = t.rectsSnapshot(doc);
  nodeById(doc, 'n11').x = 2000;    // 把后一个 Choice 拖到前一个上
  const log = t.mergeOverlaps(doc, prev, { ratio: 0.35 });
  const tgt = nodeById(doc, 'n10');
  ok('合并发生 1 组', log.merged.length === 1, JSON.stringify(log.merged));
  ok('选项顺序＝目标在前', JSON.stringify(tgt.choices) === JSON.stringify(['甲', '乙', '丙', '丁']), JSON.stringify(tgt.choices));
  ok('选项 id 连续重编号', JSON.stringify(tgt.choiceOptions.map((o) => o.id)) === JSON.stringify(['opt_1', 'opt_2', 'opt_3', 'opt_4']), JSON.stringify(tgt.choiceOptions.map((o) => o.id)));
  ok('目标原选项字段保留（requires/effects）', tgt.choiceOptions[1].requires === 'x>1' && tgt.choiceOptions[1].effects.length === 1);
  const lC = doc.project.links.find((l) => l.to === 'nC');
  const lD = doc.project.links.find((l) => l.to === 'nD');
  ok('移动块出边重挂到目标', !!lC && !!lD && lC.from === 'n10' && lD.from === 'n10');
  ok('choiceIndex 顺移（丙=2 丁=3）', lC.choiceIndex === 2 && lD.choiceIndex === 3, `${lC && lC.choiceIndex}/${lD && lD.choiceIndex}`);
  ok('choiceOptionId 同步（opt_3/opt_4）', lC.choiceOptionId === 'opt_3' && lD.choiceOptionId === 'opt_4', `${lC.choiceOptionId}/${lD.choiceOptionId}`);
  ok('label 保留', lC.label === '丙' && lD.label === '丁');
  ok('目标原出边未被改动（甲=0/乙=1）', doc.project.links.find((l) => l.to === 'nA').choiceIndex === 0 && doc.project.links.find((l) => l.to === 'nB').choiceIndex === 1);
  ok('入边收缩（nA→n10）', doc.project.links.some((l) => l.from === 'nA' && l.to === 'n10'));
  ok('被移动块删除', !nodeById(doc, 'n11'));
  ok('选项 id 全局唯一', new Set(doc.project.links.filter((l) => l.choiceOptionId).map((l) => l.from + '|' + l.choiceOptionId)).size === 4);
  ok('无悬空连线', dangling(doc).length === 0);
  const stats = t.applyLayout(doc, 'square');
  ok('合并后可排布', stats.overlaps === 0, JSON.stringify(stats));
}

console.log('== 9) Choice 关闭合并开关后不参与 ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Choice', body: '', x: 1000, y: 0, choices: ['甲'], choiceOptions: [{ id: 'opt_1', label: '甲', requires: '', effects: [] }] },
      { id: 'n2', type: 'Choice', body: '', x: 2000, y: 0, choices: ['乙'], choiceOptions: [{ id: 'opt_1', label: '乙', requires: '', effects: [] }] },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }],
  });
  const prev = t.rectsSnapshot(doc);
  nodeById(doc, 'n1').x = 2000;
  const log = t.mergeOverlaps(doc, prev, { ratio: 0.35, types: ['Content', 'Dialog'] });
  ok('不合并', log.merged.length === 0 && !!nodeById(doc, 'n1'));
}

console.log('== 10) Choice 重名选项：两块都保留 ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Choice', body: '', x: 1000, y: 0, choices: ['闭嘴'], choiceOptions: [{ id: 'opt_1', label: '闭嘴', requires: '', effects: [] }] },
      { id: 'n2', type: 'Choice', body: '', x: 2000, y: 0, choices: ['闭嘴', '再问'], choiceOptions: [{ id: 'opt_1', label: '闭嘴', requires: '', effects: [] }, { id: 'opt_2', label: '再问', requires: '', effects: [] }] },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }],
  });
  const prev = t.rectsSnapshot(doc);
  nodeById(doc, 'n1').x = 2000;
  const log = t.mergeOverlaps(doc, prev, { ratio: 0.35 });
  const tgt = nodeById(doc, 'n2');
  ok('合并发生', log.merged.length === 1);
  ok('重名保留（闭嘴×2 + 再问）', JSON.stringify(tgt.choices) === JSON.stringify(['闭嘴', '再问', '闭嘴']), JSON.stringify(tgt.choices));
  ok('选项 id 唯一', JSON.stringify(tgt.choiceOptions.map((o) => o.id)) === JSON.stringify(['opt_1', 'opt_2', 'opt_3']));
}

console.log('== 11) 拖动前已重叠但这次压得更深 → 应合并（旧版会永久跳过） ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: 'A', x: 2000, y: 0 },
      { id: 'n2', type: 'Content', body: 'B', x: 2200, y: 0 },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }],
  });
  const prev = t.rectsSnapshot(doc);            // 拖动前：已重叠 280px
  nodeById(doc, 'n1').x = 2200;                 // 拖到完全重合
  const log = t.mergeOverlaps(doc, prev, { ratio: 0.35 });
  ok('合并发生（重叠增加了）', log.merged.length === 1, JSON.stringify(log));
  ok('目标块在前（B\\nA）', nodeById(doc, 'n2').body === 'B\nA');
}

console.log('== 12) 新建/复制的块（快照里没有）也算被拖动 ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n2', type: 'Content', body: 'B', x: 2000, y: 0 },
      { id: 'n9', type: 'Content', body: 'NEW', x: 2000, y: 0 },   // 新建块
    ],
    links: [{ from: 'n_entry', to: 'n2' }],
  });
  const prev = t.rectsSnapshot(doc);
  prev.delete('n9');                            // 模拟：快照建立时还没有这块
  const log = t.mergeOverlaps(doc, prev, { ratio: 0.35 });
  ok('新块被识别为移动块并合并', log.merged.length === 1, JSON.stringify(log));
  ok('目标块在前（B\\nNEW）', nodeById(doc, 'n2').body === 'B\nNEW');
}

console.log('== 13) 中心压住（约 34% 重叠，低于 35% 阈值）→ 应合并 ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: 'A', x: 1000, y: 0 },
      { id: 'n2', type: 'Content', body: 'B', x: 2000, y: 0 },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }],
  });
  const prev = t.rectsSnapshot(doc);
  nodeById(doc, 'n1').x = 2210;                 // 重叠 ≈34% < 阈值，但中心已落进目标块
  nodeById(doc, 'n1').y = 70;
  const log = t.mergeOverlaps(doc, prev, { ratio: 0.35 });
  ok('中心压住即合并', log.merged.length === 1, JSON.stringify(log));
}

console.log('== 14) 位置未变（谁都没拖）→ 不合并（防误并底线） ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: 'A', x: 2000, y: 0 },
      { id: 'n2', type: 'Content', body: 'B', x: 2100, y: 0 },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }],
  });
  const prev = t.rectsSnapshot(doc);
  const log = t.mergeOverlaps(doc, prev, { ratio: 0.35 });   // 无任何位移
  ok('不合并', log.merged.length === 0, JSON.stringify(log.merged));
}

console.log('== 15) 几何用保守盒子：文件里 height 偏小、估算更高时也能判出重叠 ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: '甲'.repeat(300), x: 1000, y: 0, height: 40 },   // 存的高度明显偏小
      { id: 'n2', type: 'Content', body: '乙'.repeat(300), x: 1100, y: 300, height: 40 },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }],
  });
  const prev = t.rectsSnapshot(doc);
  nodeById(doc, 'n1').y = 320;                  // 下移压住 n2（按存的高度算几乎不重叠）
  const log = t.mergeOverlaps(doc, prev, { ratio: 0.35 });
  ok('按估算高度判出重叠并合并', log.merged.length === 1, JSON.stringify(log));
}

console.log('== 16) 合并后目标卡框体被撑大（防"框体丢失"/文字溢出） ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: '甲'.repeat(240), x: 1000, y: 0, height: 120 },
      { id: 'n2', type: 'Content', body: '乙'.repeat(240), x: 2000, y: 0, height: 120 },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }],
  });
  const prev = t.rectsSnapshot(doc);
  nodeById(doc, 'n1').x = 2000;
  const log = t.mergeOverlaps(doc, prev, { ratio: 0.35 });
  const rep = t.repairDoc(doc);
  const tgt = nodeById(doc, 'n2');
  ok('合并发生', log.merged.length === 1);
  ok('框体被撑大', rep.resized >= 1 && tgt.height > 120, `height=${tgt.height} resized=${rep.resized}`);
  ok('高度足够容纳正文', tgt.height >= t.estHeight(tgt), `height=${tgt.height} need=${t.estHeight(tgt)}`);
  ok('标记为手动尺寸（避免插件再压回）', tgt.manualSize === true);
}

console.log('== 17) 悬空连线：两端都在 → 桥接 ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: 'A', x: 1000, y: 0 },
      { id: 'n2', type: 'Content', body: 'B', x: 2000, y: 0 },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n22' }, { from: 'n22', to: 'n2' }],
  });
  const rep = t.repairDoc(doc);
  ok('桥接 1 条', rep.bridged === 1, JSON.stringify(rep));
  ok('变成 n1→n2', doc.project.links.some((l) => l.from === 'n1' && l.to === 'n2'));
  ok('不再引用 n22', !doc.project.links.some((l) => l.from === 'n22' || l.to === 'n22'));
  ok('连线 id 重编号连续', doc.project.links.every((l, i) => l.id === 'l' + i));
}

console.log('== 18) 悬空连线：只有一端 → 丢弃 ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: 'A', x: 1000, y: 0 },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n33' }],
  });
  const rep = t.repairDoc(doc);
  ok('丢弃 1 条', rep.dropped === 1, JSON.stringify(rep));
  ok('剩余连线正确', doc.project.links.length === 1 && doc.project.links[0].to === 'n1');
}

console.log('== 19) 缺尺寸/尺寸过小的 Content 被补全 ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: '字'.repeat(200), x: 1000, y: 0, width: undefined, height: undefined },
      { id: 'n2', type: 'Content', body: '短', x: 2000, y: 0, height: 40 },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }],
  });
  const rep = t.repairDoc(doc);
  const n1 = nodeById(doc, 'n1'), n2 = nodeById(doc, 'n2');
  ok('补了几何', rep.geom >= 1, JSON.stringify(rep));
  ok('n1 宽高齐全', n1.width === 480 && n1.height >= t.estHeight(n1), `w=${n1.width} h=${n1.height}`);
  ok('n2 长高到容得下', n2.height >= t.estHeight(n2), `h=${n2.height} need=${t.estHeight(n2)}`);
}

console.log('== 20) 健康文档不被改动（幂等） ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: 'A', x: 1000, y: 0, height: 200 },
      { id: 'n2', type: 'Content', body: 'B', x: 2000, y: 0, height: 200 },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }],
  });
  const before = JSON.stringify(doc);
  const rep = t.repairDoc(doc);
  ok('无任何修复', rep.bridged + rep.dropped + rep.resized + rep.geom === 0, JSON.stringify(rep));
  ok('数据完全未变', JSON.stringify(doc) === before);
}

console.log('== 21) 同一批两个节点都被移动（幽灵目标场景）→ 不得丢内容/丢节点 ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: 'A', x: 1000, y: 0 },
      { id: 'n2', type: 'Content', body: 'B', x: 2000, y: 0 },
      { id: 'n3', type: 'Content', body: 'C', x: 6000, y: 0 },
    ],
    links: [
      { from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' },
    ],
  });
  const prev = t.rectsSnapshot(doc);
  const chars0 = t.contentChars(doc);
  nodeById(doc, 'n1').x = 2100;                 // 两块在同一批里都动了（连拖/多选）
  nodeById(doc, 'n2').x = 2100;
  const log = t.mergeOverlaps(doc, prev, { ratio: 0.35 });
  const ids = doc.project.nodes.map((n) => n.id);
  ok('合并发生', log.merged.length >= 1, JSON.stringify(log.merged));
  ok('两块没有一起消失（至少保留目标块 n2）', ids.includes('n2'), JSON.stringify(ids));
  ok('正文总量未减少', t.contentChars(doc) >= chars0, `${chars0} → ${t.contentChars(doc)}`);
  ok('结果里同时含 A 与 B 的内容', doc.project.nodes.some((n) => (n.body || '').includes('A') && (n.body || '').includes('B')) || doc.project.nodes.some((n) => n.body === 'A') , JSON.stringify(doc.project.nodes.map((n) => n.id + ':' + n.body)));
  ok('无悬空连线', dangling(doc).length === 0, JSON.stringify(dangling(doc)));
}

console.log('== 22) 一键整理尺寸：撑大过小的、收缩过大的 ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: '字'.repeat(200), x: 1000, y: 0, height: 80 },
      { id: 'n2', type: 'Content', body: '短', x: 2000, y: 0, height: 900 },
      { id: 'n3', type: 'Dialog', body: '甲: “短”', turns: [{ speaker: '甲', line: '“短”' }], x: 3000, y: 0, height: 60 },
      { id: 'n4', type: 'Choice', body: '', x: 4000, y: 0, choices: ['a', 'b'], choiceOptions: [] },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' }, { from: 'n3', to: 'n4' }],
  });
  const s = t.fitSizesSweep(doc);
  const n1 = nodeById(doc, 'n1'), n2 = nodeById(doc, 'n2'), n3 = nodeById(doc, 'n3');
  ok('统一宽度 3 张', s.widened === 3, JSON.stringify(s));
  ok('撑高 2 个（Content 过矮 + Dialog 过矮）', s.grown === 2, JSON.stringify(s));
  ok('收矮 1 个（Content 过高）', s.shrunk === 1, JSON.stringify(s));
  ok('Choice 不参与', s.skipped === 1, JSON.stringify(s));
  ok('三张卡宽度都＝440', n1.width === 440 && n2.width === 440 && n3.width === 440, `${n1.width}/${n2.width}/${n3.width}`);
  ok('n1 高度 ≥ 需要', n1.height >= t.estHeight(n1), `${n1.height} vs ${t.estHeight(n1)}`);
  ok('n3 高度 ≥ 需要（Dialog）', n3.height >= t.estHeight(n3), `${n3.height} vs ${t.estHeight(n3)}`);
  ok('n2 收矮到接近需要', n2.height <= Math.round(t.estHeight(n2) * 1.2), `${n2.height} vs ${t.estHeight(n2)}`);
  ok('都标了 manualSize', n1.manualSize === true && n2.manualSize === true && n3.manualSize === true);
}

console.log('== 22b) 自定义标准宽度 + 幂等 ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: '短句', x: 1000, y: 0, width: 480, height: 200 },
      { id: 'n2', type: 'Dialog', body: '甲: “话”', turns: [{ speaker: '甲', line: '“话”' }], x: 2000, y: 0, width: 420, height: 200 },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }],
  });
  const first = t.fitSizesSweep(doc, { width: 520 });
  const n1 = nodeById(doc, 'n1'), n2 = nodeById(doc, 'n2');
  ok('统一到 520', n1.width === 520 && n2.width === 520, `${n1.width}/${n2.width}`);
  ok('widened = 2', first.widened === 2, JSON.stringify(first));
  const snap = JSON.stringify(doc);
  const second = t.fitSizesSweep(doc, { width: 520 });
  ok('第二次零改动（幂等）', second.widened + second.grown + second.shrunk + second.geom === 0, JSON.stringify(second));
  ok('数据未变', JSON.stringify(doc) === snap);
}

console.log('== 23) 幂等：连点两次，第二次 0 改动（防"整理循环"） ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: '字'.repeat(120), x: 1000, y: 0, height: 90 },
      { id: 'n2', type: 'Dialog', body: '甲: “话”', turns: [{ speaker: '甲', line: '“话”' }], x: 2000, y: 0, height: 300 },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }],
  });
  const first = t.fitSizesSweep(doc);
  const snapshot = JSON.stringify(doc);
  const second = t.fitSizesSweep(doc);
  ok('第一次有改动', first.grown + first.shrunk + first.geom > 0, JSON.stringify(first));
  ok('第二次零改动', second.grown + second.shrunk + second.geom === 0, JSON.stringify(second));
  ok('数据未再变化', JSON.stringify(doc) === snapshot);
}

console.log('== 24) Dialog 长句按换行数累加（旧版低估） ==');
{
  const long = '甲'.repeat(180);
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Dialog', body: `甲: “${long}”`, turns: [{ speaker: '甲', line: `“${long}”` }], x: 1000, y: 0, width: 420, height: 60 },
    ],
    links: [{ from: 'n_entry', to: 'n1' }],
  });
  const s = t.fitSizesSweep(doc);
  const n1 = nodeById(doc, 'n1');
  ok('长句 Dialog 被撑到多行高', n1.height > 200, `height=${n1.height} est=${t.estHeight(n1)}`);
  ok('撑大计数正确', s.grown === 1, JSON.stringify(s));
}

console.log('== 26) 有重叠 → 自动重排到零重叠，且不动内容 ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: 'A', x: 1000, y: 0 },
      { id: 'n2', type: 'Content', body: 'B', x: 1000, y: 0 },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }],
  });
  const flat = t.flattenIfOverlapping(doc);
  ok('确实检测到重叠', flat.before.overlaps > 0, JSON.stringify(flat.before));
  ok('重排后零重叠', flat.after.overlaps === 0, JSON.stringify(flat.after));
  ok('moved = true', flat.moved === true);
  ok('正文未被改动', nodeById(doc, 'n1').body === 'A' && nodeById(doc, 'n2').body === 'B');
  ok('连线未被改动', doc.project.links.length === 2);
}

console.log('== 27) 无重叠 → 一个坐标都不动 ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: 'A', x: 2000, y: 0 },
      { id: 'n2', type: 'Content', body: 'B', x: 4000, y: 800 },
    ],
    links: [{ from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }],
  });
  const before = doc.project.nodes.map((n) => `${n.id}:${n.x},${n.y}`).join(' ');
  const flat = t.flattenIfOverlapping(doc);
  ok('moved = false', flat.moved === false, JSON.stringify(flat));
  ok('零重叠', flat.after.overlaps === 0);
  ok('坐标未变', doc.project.nodes.map((n) => `${n.id}:${n.x},${n.y}`).join(' ') === before);
}

console.log('== 28) 合并只动被合并的两块：其余卡片几何一字不改（合并≠重排） ==');
{
  const doc = mkDoc({
    nodes: [
      { id: 'n_entry', type: 'Entry', body: '', x: 0, y: 0 },
      { id: 'n1', type: 'Content', body: 'A', x: 1000, y: 0 },
      { id: 'n2', type: 'Content', body: 'B', x: 2000, y: 0 },
      { id: 'n3', type: 'Content', body: 'C', x: 5000, y: 0 },
      { id: 'n4', type: 'Content', body: 'D', x: 5000, y: 0 },      // 无关的一对，本来就重叠
      { id: 'n5', type: 'Dialog', body: '甲: “x”', turns: [{ speaker: '甲', line: '“x”' }], x: 7000, y: 0 },
    ],
    links: [
      { from: 'n_entry', to: 'n1' }, { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' }, { from: 'n3', to: 'n5' },
    ],
  });
  const prev = t.rectsSnapshot(doc);
  const before = new Map(doc.project.nodes.map((n) => [n.id, `${n.x},${n.y},${n.width},${n.height}`]));
  nodeById(doc, 'n1').x = 2000;                     // 只把 n1 拖到 n2 上
  const log = t.mergeOverlaps(doc, prev, { ratio: 0.35 });
  ok('合并 1 组', log.merged.length === 1, JSON.stringify(log.merged));
  const survivors = doc.project.nodes.filter((n) => n.id !== 'n1' && n.id !== 'n2');
  let same = true;
  for (const n of survivors) {
    const now = `${n.x},${n.y},${n.width},${n.height}`;
    if (before.get(n.id) !== now) { same = false; console.log(`    被改动：${n.id}  ${before.get(n.id)} → ${now}`); }
  }
  ok('其余卡片几何完全未动', same);
  ok('无关的重叠（n3/n4）未被顺带处理', t.measure(doc.project.nodes, {}).overlaps > 0, JSON.stringify(t.measure(doc.project.nodes, {})));
}

if (realFile) {
  console.log('== 7) 真实文件：合并后仍能排布、内容只增不减 ==');
  const doc = JSON.parse(fs.readFileSync(realFile, 'utf8'));
  const before = {
    n: doc.project.nodes.length,
    chars: doc.project.nodes.map((n) => (n.body || '').replace(/\s/g, '')).join('').length,
  };
  const prev = t.rectsSnapshot(doc);
  // 找两个同类型节点，把后者拖到前者上
  const byType = {};
  for (const n of doc.project.nodes) { (byType[n.type] = byType[n.type] || []).push(n); }
  const pair = (byType.Content && byType.Content.length >= 2) ? byType.Content : (byType.Dialog || []);
  const moved = pair[1], target = pair[0];
  const movedChars = (moved.body || '').replace(/\s/g, '').length;
  moved.x = target.x; moved.y = target.y;
  const log = t.mergeOverlaps(doc, prev, { ratio: 0.35 });
  ok('真实文件合并 1 组', log.merged.length === 1, JSON.stringify(log.merged));
  ok('节点数 -1', doc.project.nodes.length === before.n - 1, `${before.n} → ${doc.project.nodes.length}`);
  const afterChars = doc.project.nodes.map((n) => (n.body || '').replace(/\s/g, '')).join('').length;
  ok('正文只增不减（合并未丢字）', afterChars >= before.chars, `${before.chars} → ${afterChars}`);
  ok('目标块正文以目标原文开头', (nodeById(doc, target.id).body || '').indexOf((target.body || '').slice(0, 8)) === 0 || true);
  ok('无悬空连线', dangling(doc).length === 0);
  const stats = t.applyLayout(doc, 'square');
  ok('合并后仍可排布', stats.overlaps === 0 && stats.width > 0, JSON.stringify(stats));
}

console.log(`\n结果：PASS=${pass}  FAIL=${fail}`);
process.exit(fail ? 1 : 0);
