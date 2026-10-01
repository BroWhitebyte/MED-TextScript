#!/usr/bin/env node
/**
 * 白广大风格写作校验器（linter）
 * 用法：node scripts/style_lint.js <稿件.md>
 * 规则与阈值见《白广大风格校验工具层.md》；语料依据见 data/evidence.json 与 data/corpus_compare.txt
 */
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) {
  console.error('用法: node scripts/style_lint.js <稿件.md>');
  process.exit(2);
}
const raw = fs.readFileSync(file, 'utf8');

// ---- 预处理 1：剥离「元讨论区块」——自检清单 / 校验说明 / lint:off 区段 ----
// 这些区块会引用规则名（如"无『先说/再说』句式"），不属于正文，必须排除以免误报。
function stripMetaSections(src) {
  // 显式忽略标记
  let out = src.replace(/<!--\s*lint:off\s*-->[\s\S]*?<!--\s*lint:on\s*-->/g, '\n');
  // 按二级标题切块，丢弃标题含「自检/清单/校验/检查/评分/工具层/负样本」的块
  const blocks = out.split(/\n(?=#{2,3}\s)/);
  const kept = blocks.filter((b) => {
    const head = (b.match(/^#{2,3}\s*(.+)/) || [])[1] || '';
    return !/自检|清单|校验|检查|评分|工具层|负样本|lint/i.test(head);
  });
  out = kept.join('\n');
  // 丢弃逐行自检标记（✅/❌ 开头的列表项）
  out = out.split('\n').filter((l) => !/^\s*[-*]?\s*(✅|❌|☑|✗)/.test(l)).join('\n');
  // 丢弃加粗元区块（**执行自检**／**参考资料**／**诚实声明** 等开头的段落及其后内容）
  out = out.replace(/\n\*\*(执行自检|校验|参考|诚实声明|版本|说明)[\s\S]*$/m, '\n');
  return out;
}
const deduped = stripMetaSections(raw);

// ---- 预处理 2：剥离代码块、行内代码、markdown 链接（含其括号），不参与中文行文检查 ----
const codeBlocks = [];
const text = deduped
  .replace(/```[\s\S]*?```/g, (m) => { codeBlocks.push(m); return '\n@@CODE@@\n'; })
  .replace(/`[^`\n]*`/g, (m) => { codeBlocks.push(m); return '@@CODE@@'; })
  .replace(/！?（\[[^\]]*\]\([^)]*\)）|\[[^\]]*\]\([^)]*\)/g, '') // 链接及其包裹括号
  .replace(/https?:\/\/\S+/g, '');
const lines = text.split('\n');
const body = text;
const cn = (s) => s.replace(/[^\u4e00-\u9fa5]/g, '');
const chars = cn(body).length;
const per1k = (n) => chars ? +(n / chars * 1000).toFixed(2) : 0;

const A = []; // 硬错误
const B = []; // 警告
const C = {}; // 体检

function locate(re) {
  const hits = [];
  lines.forEach((l, i) => {
    if (re.test(l)) hits.push({ line: i + 1, text: l.trim().slice(0, 60) });
    re.lastIndex = 0;
  });
  return hits;
}

// ===== A 级 =====
// A1 ASCII 直引号（中文行文中的 "）
const asciiQuoteHits = [];
lines.forEach((l, i) => {
  if (l.includes('@@CODE@@')) return;
  const m = l.match(/[\u4e00-\u9fa5][^"\n]{0,40}"|"[^"\n]{0,40}[\u4e00-\u9fa5]/g);
  if (m) asciiQuoteHits.push({ line: i + 1, text: l.trim().slice(0, 60), count: m.length });
});
if (asciiQuoteHits.length) A.push({ code: 'A1', name: '中文行文混用 ASCII 直引号', hits: asciiQuoteHits, fix: '替换为中文弯引号 “ ”' });

// A2 元叙述
const a2 = locate(/先说|再说|先聊|再聊|最后说说|先说好/);
if (a2.length) A.push({ code: 'A2', name: '元叙述句（先说/再说）', hits: a2, fix: '删除序数引导，直接开写' });

// A3 不是…而是…（要求中间有实际内容，避免命中"不是而是"这类规则名引用）
const a3 = locate(/不是[^。；！？\n]{1,24}而是/);
if (a3.length) A.push({ code: 'A3', name: '"不是……而是……"模板', hits: a3, fix: '改为"然而/但是/不过"或拆成两句' });

// A4 黑名单
const blacklist = /综上所述|总的来说|总而言之|值得注意的是|不难发现|随着[^。\n]{0,10}的发展|在当今[^。\n]{0,8}的时代|首先[^。\n]{0,30}其次|众所周知|值得我们深思|在[^。\n]{0,12}的背景下|这不仅[^。\n]{0,10}更是/;
const a4 = locate(blacklist);
if (a4.length) A.push({ code: 'A4', name: 'AI 腔黑名单句式', hits: a4, fix: '改写为具体陈述' });

// ===== B 级 =====
const countAll = (re) => (body.match(re) || []).length;

const signWords = [
  ['坦率地说', 1], ['不解释。', 1], ['醍醐味', 1], ['图一乐', 1], ['味儿', 2],
];
for (const [w, max] of signWords) {
  const n = countAll(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
  if (n > max) B.push({ code: 'B1', name: `签名表达超量：${w} ×${n}（上限 ${max}）`, fix: '删至上限内，签名是点缀' });
}
const bracket = countAll(/（笑）|（误）|（？）|（无贬义）|（指本人）|（大雾）|（捂脸）|（划掉）/g);
if (bracket > 2) B.push({ code: 'B2', name: `括号吐槽超量 ×${bracket}（上限 2）`, fix: '保留最贴合语境的一两处' });

// B3 句长落差
const sents = body.split(/[。！？!?]+/).map((s) => cn(s)).filter((s) => s.length > 0);
const lens = sents.map((s) => s.length);
const avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
const sd = lens.length ? Math.sqrt(lens.reduce((a, b) => a + (b - avg) ** 2, 0) / lens.length) : 0;
const shortRatio = lens.length ? lens.filter((l) => l <= 10).length / lens.length * 100 : 0;
if (sents.length > 20 && (sd < 12 || shortRatio < 2)) {
  B.push({ code: 'B3', name: `句长落差不足（标准差 ${sd.toFixed(1)}，短句占比 ${shortRatio.toFixed(1)}%）`, fix: '高潮处插入四到八字短句独立成段' });
}

// B4 引用出处
const cite = countAll(/——/g);
if (chars > 2000 && cite === 0) B.push({ code: 'B4', name: '全文无引用出处（——）', fix: '至少补 2 处可核查出处' });

// B5 数字密度
const years = countAll(/\d{4}年/g);
const numbers = countAll(/\d+(\.\d+)?%|\d+(万|亿|人|次|年|月|日|公里|小时)/g);
if (chars > 1000 && (years < 3 || numbers === 0)) {
  B.push({ code: 'B5', name: `数字密度不足（年份 ${years} 处 / 数量 ${numbers} 处）`, fix: '补具体日期与可核查数字' });
}

// B6 破折号/括号密度
const dashPerK = per1k(countAll(/——/g));
const parenPerK = per1k(countAll(/（/g));
if (chars > 500 && dashPerK < 1) B.push({ code: 'B6', name: `破折号密度偏低（${dashPerK}/千字，基准 1.44）`, fix: '适度使用破折号承担补充与转折' });
if (parenPerK > 3) B.push({ code: 'B6', name: `括号密度偏高（${parenPerK}/千字，基准 1.73）`, fix: '减少插入语' });

// B7 段落均匀
const paras = body.split(/\n\s*\n/).map((p) => cn(p)).filter((p) => p.length > 0);
if (paras.length > 5) {
  const shortParas = paras.filter((p) => p.length < 60).length;
  const midParas = paras.filter((p) => p.length >= 100 && p.length <= 200).length;
  if (shortParas === 0 && midParas / paras.length > 0.7) {
    B.push({ code: 'B7', name: '段落长度过于均匀（无短段）', fix: '穿插一到两句的短段制造节奏' });
  }
}

// ===== C 级 =====
C['字数（中文字符）'] = chars;
C['段落数'] = paras.length;
C['句数 / 均长 / 标准差'] = `${sents.length} / ${avg.toFixed(1)} / ${sd.toFixed(1)}`;
C['短句占比'] = `${shortRatio.toFixed(1)}%（基准 4.4%）`;
C['口语句式密度'] = `其实${per1k(countAll(/其实/g))} 就是${per1k(countAll(/就是/g))} 然后${per1k(countAll(/然后/g))}（书面基准 0.30/0.99/0.15；口播可到 2.0/2.4/0.9）`;
C['引用出处数'] = cite;
C['年份数 / 数量词'] = `${years} / ${numbers}`;
C['破折号 / 括号'] = `${dashPerK} / ${parenPerK} 每千字`;

// 结尾识别（取正文最后一个以句末标点收束的段落）
const bodyParas = body.split(/\n\s*\n/).map((p) => p.trim())
  .filter((p) => p && !/^#{2,3}/.test(p) && !/^\*\*/.test(p) && !/^[-*_]{3,}$/.test(p) && !/^[-*]\s/.test(p));
const complete = bodyParas.filter((p) => /[。！？!?]\s*[”"』」]?\s*$/.test(p));
const tail = (complete.length ? complete : bodyParas).slice(-2).join(' ');
let ending = '未识别';
if (/[？?]\s*$/.test(tail)) ending = '设问收束';
else if (/(祝|愿).{0,20}(好运|顺利|快乐|如意|大吉)/.test(tail)) ending = '祝福式';
else if (/(敬请期待|持续关注|下期|下一篇|后续)/.test(tail)) ending = '预告式';
else if (/(感谢阅读|收工|水文|啰嗦完|抱歉|耽搁)/.test(tail)) ending = '自嘲/彩蛋式';
else if (/[》""”]\s*$/.test(tail)) ending = '引用/诗化留白式';
else if (/(才刚刚开始|永远不会|永存|永不|最好的|真正的)/.test(tail)) ending = '升华式';
C['结尾方式'] = ending;

// 标题检查
const firstLine = (raw.split('\n').find((l) => l.trim().startsWith('#')) || '').replace(/^#+\s*/, '');
const titleHooks = [];
if (/[：:]/.test(firstLine)) titleHooks.push('冒号');
if (/[？?]/.test(firstLine)) titleHooks.push('问句');
if (/\d/.test(firstLine)) titleHooks.push('数字');
if (/《/.test(firstLine)) titleHooks.push('书名号');
if (/\|/.test(firstLine)) titleHooks.push('竖线');
if (/【/.test(firstLine)) titleHooks.push('【】前缀');
C['标题'] = firstLine ? `${firstLine.slice(0, 40)}（钩子：${titleHooks.join('、') || '无'}）` : '未找到标题';
if (titleHooks.length === 0 && firstLine) B.push({ code: 'C3', name: '标题缺少钩子元素', fix: '补冒号/问句/数字/书名号/竖线之一' });

// ===== 报告 =====
const hardPenalty = A.length * 10;
const warnPenalty = B.length * 3;
const score = Math.max(0, 100 - hardPenalty - warnPenalty);

console.log(`\n==== 白广大风格校验报告：${path.basename(file)} ====\n`);
console.log(`【A 级 · 硬错误】${A.length ? A.length + ' 项' : '无 ✅'}`);
for (const a of A) {
  console.log(`  ✗ ${a.code} ${a.name} —— ${a.fix}`);
  for (const h of a.hits.slice(0, 5)) console.log(`      第 ${h.line} 行：${h.text}`);
  if (a.hits.length > 5) console.log(`      ...共 ${a.hits.length} 处`);
}
console.log(`\n【B 级 · 警告】${B.length ? B.length + ' 项' : '无 ✅'}`);
for (const b of B) console.log(`  ! ${b.code} ${b.name} —— ${b.fix}`);
console.log('\n【C 级 · 体检】');
for (const [k, v] of Object.entries(C)) console.log(`  · ${k}: ${v}`);
console.log(`\n【预估得分】${score} / 100（A 级每项 −10，B 级每项 −3；≥85 可发布，70—84 修订，<70 重写）`);
console.log(`参考：负样本库 白广大风格负样本库.md ｜ 规则表 白广大风格校验工具层.md\n`);

process.exit(A.length > 0 ? 1 : 0);
