'use strict';
/* 命令行一键整理框体尺寸：统一宽度 + 高度合身（幂等）
   用法: node tidy_sizes.js <plugin main.js> [--width=440] <x.ncanvas> [...]                */
const Module = require('module');
const fs = require('fs');
const os = require('os');
const path = require('path');

const orig = Module._load;
Module._load = function (r) {
  if (r === 'obsidian') return { Plugin: class {}, Notice: class {}, PluginSettingTab: class {}, Setting: class {} };
  return orig.apply(this, arguments);
};

const args = process.argv.slice(2);
const wArg = args.find((a) => a.startsWith('--width='));
const width = wArg ? parseInt(wArg.slice(8), 10) : 440;
const files = args.filter((a) => !a.startsWith('--'));
const mainPath = files.shift();
const t = require(mainPath).__test;
if (!t || !t.fitSizesSweep) { console.error('main.js 未暴露 fitSizesSweep'); process.exit(3); }

let changed = 0;
for (const f of files) {
  let raw;
  try { raw = fs.readFileSync(f, 'utf8'); } catch (e) { console.log(`ERR  ${path.basename(f)} — ${e.message}`); continue; }
  let doc;
  try { doc = JSON.parse(raw); } catch (e) { console.log(`ERR  ${path.basename(f)} — 解析失败`); continue; }
  const before = t.measure(doc.project.nodes, {});
  const s = t.fitSizesSweep(doc, { width });
  const rep = t.repairDoc(doc);
  let flat = { before: { overlaps: before.overlaps }, after: { overlaps: before.overlaps }, moved: false };
  try { flat = t.flattenIfOverlapping(doc); } catch (e) { console.log('   重排失败：' + e.message); }
  const total = s.widened + s.grown + s.shrunk + s.geom + rep.bridged + rep.dropped + (flat.moved ? 1 : 0);
  if (!total) { console.log(`OK   ${path.basename(f)} — 已是标准宽度 ${width}px、高度合身、零重叠`); continue; }
  const dir = path.join(os.tmpdir(), 'med-ncanvas-backups');
  fs.mkdirSync(dir, { recursive: true });
  const bak = path.join(dir, path.basename(f).replace(/[\\/:*?"<>|]/g, '_') + '.' + Date.now() + '.bak.ncanvas');
  fs.writeFileSync(bak, raw, 'utf8');
  fs.writeFileSync(f, JSON.stringify(doc, null, 2), 'utf8');
  const after = t.measure(doc.project.nodes, {});
  console.log(
    `FIX  ${path.basename(f)} — 统一宽度 ${s.widened}｜撑高 ${s.grown}｜收矮 ${s.shrunk}｜补缺 ${s.geom}` +
    `${rep.bridged + rep.dropped ? '｜悬空线 ' + (rep.bridged + rep.dropped) : ''}` +
    `｜重叠 ${before.overlaps}→${after.overlaps}${flat.moved ? '（已自动重排）' : ''}` +
    `${after.overlaps ? '  ❗仍有重叠' : ''}`);
  changed += 1;
}
console.log(changed ? `共整理 ${changed} 个文件（备份在 %TEMP%\\med-ncanvas-backups）` : '无需整理');
console.log('提示：整理后请在 Obsidian 里重载（Ctrl+R）或重开标签页，避免用内存旧状态覆盖。');
