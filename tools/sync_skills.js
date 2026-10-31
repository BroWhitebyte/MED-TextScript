#!/usr/bin/env node
/**
 * sync_skills.js — 技能层唯一来源校验与同步（2026-10-31）
 *
 * 唯一维护源：<workspace>/.dsh/skills/<skill>/
 * 只读镜像：  <repo>/MEDSystem/写作手册/<skill>/、<workspace>/14_个人创作/<skill>/
 *
 * 用法：
 *   node tools/sync_skills.js          校验（有差异退出码 1）
 *   node tools/sync_skills.js --fix    从源覆盖镜像的 references/ 文件
 *
 * 说明：SKILL.md 只检查存在性——镜像头部允许有「只读镜像」声明，
 * 内容比对只看 references/，避免声明行造成假差异。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repo = path.resolve(__dirname, '..');
const workspace = path.resolve(repo, '..', '..');
const SRC_ROOT = path.join(workspace, '.dsh', 'skills');

const SKILLS = [
  {
    name: 'tonglan-narrative-style',
    mirrors: [
      path.join(repo, 'MEDSystem', '写作手册', 'tonglan-narrative-style'),
      path.join(workspace, '14_个人创作', 'tonglan-narrative-style'),
    ],
  },
  {
    name: 'baiguangda-writing-style',
    mirrors: [path.join(repo, 'MEDSystem', '写作手册', 'baiguangda-writing-style')],
  },
];

const fix = process.argv.includes('--fix');
const md5 = (p) => crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
const walk = (dir, base = dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, base, out);
    else out.push(path.relative(base, p));
  }
  return out;
};

let diffs = 0;
let copies = 0;

for (const skill of SKILLS) {
  const src = path.join(SRC_ROOT, skill.name);
  if (!fs.existsSync(src)) {
    console.log(`[missing-src] ${skill.name}: 源目录不存在 ${src}`);
    diffs++;
    continue;
  }
  const srcRef = path.join(src, 'references');
  const srcFiles = walk(srcRef);

  for (const m of skill.mirrors) {
    if (!fs.existsSync(m)) {
      console.log(`[missing-mirror] ${skill.name}: ${m}`);
      diffs++;
      continue;
    }
    if (!fs.existsSync(path.join(m, 'SKILL.md'))) {
      console.log(`[missing-skill-md] ${skill.name}: ${m}`);
      diffs++;
    }
    const mRef = path.join(m, 'references');
    const seen = new Set();
    for (const rel of srcFiles) {
      const a = path.join(srcRef, rel);
      const b = path.join(mRef, rel);
      seen.add(rel);
      if (!fs.existsSync(b)) {
        console.log(`[missing] ${skill.name} ${rel} → ${path.relative(workspace, m)}`);
        diffs++;
        if (fix) { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b); copies++; }
      } else if (md5(a) !== md5(b)) {
        console.log(`[diff] ${skill.name} ${rel} → ${path.relative(workspace, m)}`);
        diffs++;
        if (fix) { fs.copyFileSync(a, b); copies++; }
      }
    }
    for (const rel of walk(mRef)) {
      if (!seen.has(rel)) console.log(`[extra] ${skill.name} ${rel}（镜像多出，未处理）`);
    }
  }
}

console.log(`\n结果：差异 ${diffs}，复制 ${copies}${fix ? '（--fix）' : ''}`);
process.exit(diffs && !fix ? 1 : 0);
