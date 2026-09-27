'use strict';
/* 只读体检：报告每个 .ncanvas 当前排布下的重叠对数（不做任何修改）
   用法: node report_overlaps.js <plugin main.js> <x.ncanvas> [...]          */
const Module = require('module');
const fs = require('fs');
const path = require('path');

const origLoad = Module._load;
Module._load = function (request) {
  if (request === 'obsidian') {
    return { Plugin: class {}, Notice: class {}, PluginSettingTab: class {}, Setting: class {} };
  }
  return origLoad.apply(this, arguments);
};

const mainPath = process.argv[2];
const files = process.argv.slice(3);
const t = require(mainPath).__test;

let worst = 0;
for (const f of files) {
  const doc = JSON.parse(fs.readFileSync(f, 'utf8'));
  const m = t.measure(doc.project.nodes, {});
  const bad = m.overlaps > 0;
  if (m.overlaps > worst) worst = m.overlaps;
  console.log(`${bad ? '✘' : '✔'} ${path.basename(f)}  节点 ${doc.project.nodes.length}  包围盒 ${m.width}×${m.height}（${m.aspect}）  重叠 ${m.overlaps}`);
}
console.log(worst ? `\n有文件存在重叠（最多 ${worst} 对）——点一次「排布」按钮即可重新铺开` : '\n全部零重叠');
process.exit(0);
