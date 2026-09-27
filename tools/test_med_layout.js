'use strict';
/* 单测：把插件 main.js 里的排布算法跑在真实 .ncanvas 上，并可与 PowerShell 版交叉验证。
   用法: node test_med_layout.js <plugin main.js> <file.ncanvas> <row|square|toggle>            */
const Module = require('module');
const fs = require('fs');

class PluginStub { constructor() {} }
const obsidianStub = {
  Plugin: PluginStub,
  Notice: class { constructor(msg) { this.msg = msg; } },
  PluginSettingTab: class { constructor() {} },
  Setting: class { constructor() {} },
};
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'obsidian') return obsidianStub;
  return origLoad.apply(this, arguments);
};

const mainPath = process.argv[2];
const filePath = process.argv[3];
const mode = process.argv[4] || 'toggle';
if (!mainPath || !filePath) {
  console.error('usage: node test_med_layout.js <plugin main.js> <file.ncanvas> <row|square|toggle>');
  process.exit(2);
}

const Mod = require(mainPath);
const t = Mod.__test;
if (!t) { console.error('main.js 未暴露 __test'); process.exit(3); }

const doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const sig = (d) => JSON.stringify({
  n: d.project.nodes.length,
  l: d.project.links.length,
  bodies: d.project.nodes.map((x) => x.body || '').join(''),
  links: d.project.links.map((x) => x.from + '>' + x.to).join(','),
  notes: d.project.notes || '',
  title: d.project.title || '',
});
const before = sig(doc);
const currentMode = t.detectMode(doc);
const stats = t.applyLayout(doc, mode);
const after = sig(doc);

fs.writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf8');

console.log('currentMode =', currentMode);
console.log('stats =', JSON.stringify(stats));
console.log('contentPreserved =', before === after);
console.log('nodes/links =', doc.project.nodes.length + '/' + doc.project.links.length);
const sample = doc.project.nodes.slice(0, 3).map((n) => `${n.id}(${n.x},${n.y})`).join(' ');
console.log('first nodes =', sample);
