'use strict';
/* 命令行结构修复：node repair_ncanvas.js <plugin main.js> <x.ncanvas> [...]
   修复内容：悬空连线（桥接/丢弃）、卡片尺寸缺失或过小、ui 选中项指向已删节点。
   原文件备份写到系统临时目录；结构正常时不动文件。                                    */
const Module = require('module');
const fs = require('fs');
const os = require('os');
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
if (!mainPath || !files.length) { console.error('usage: node repair_ncanvas.js <plugin main.js> <x.ncanvas> [...]'); process.exit(2); }
const t = require(mainPath).__test;
if (!t || !t.repairDoc) { console.error('main.js 未暴露 repairDoc'); process.exit(3); }

let fixed = 0;
for (const f of files) {
  let doc;
  try { doc = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.log(`ERR  ${f} — 解析失败 ${e.message}`); continue; }
  const rep = t.repairDoc(doc);
  const total = rep.bridged + rep.dropped + rep.resized + rep.geom;
  if (!total) { console.log(`OK   ${path.basename(f)} — 结构已正常`); continue; }
  const bak = path.join(os.tmpdir(), path.basename(f) + '.' + Date.now() + '.bak');
  fs.copyFileSync(f, bak);
  fs.writeFileSync(f, JSON.stringify(doc, null, 2), 'utf8');
  console.log(`FIX  ${path.basename(f)} — 尺寸${rep.resized} 桥接悬空线${rep.bridged} 丢弃${rep.dropped} 补几何${rep.geom}｜备份 ${bak}`);
  fixed += 1;
}
console.log(fixed ? `共修复 ${fixed} 个文件` : '无需修复');
process.exit(0);
