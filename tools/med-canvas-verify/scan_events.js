'use strict';
/* 扫描 Flows 下全部 .ncanvas，生成事件登记表 events.json
   —— 供 med_verify.js 把「101」这类代号解析成文件路径 + 时点
   用法: node tools\med-canvas-verify\scan_events.js [--write]
        （工作区技能目录 .dsh\skills\med-canvas-verify\ 下同样可跑）
   位置无关：Flows 目录与登记表内的文件路径都按「仓库根」折算，
   仓库根的标志＝该目录下有 MEDNarrative\Flows。
*/
const fs = require('fs');
const path = require('path');

/* 仓库根：从本文件向上找 MEDNarrative\Flows；找不到再试 cwd 的两种形态 */
const REPO_ROOT = (() => {
  const cands = [];
  let d = __dirname;
  for (let i = 0; i < 8; i++) {
    cands.push(d);
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  return cands.find((p) => fs.existsSync(path.join(p, 'MEDNarrative', 'Flows'))) || null;
})();
const FLOWS_CANDS = [
  ...(REPO_ROOT ? [path.join(REPO_ROOT, 'MEDNarrative', 'Flows')] : []),
  path.join(process.cwd(), 'MEDNarrative', 'Flows'),
  path.join(process.cwd(), '06_MED_TextScript', 'MED-TextScript', 'MEDNarrative', 'Flows'),
  '06_MED_TextScript\\MED-TextScript\\MEDNarrative\\Flows',
];
const ROOT = FLOWS_CANDS.find((p) => fs.existsSync(p)) || FLOWS_CANDS[0];
/* 登记表内的路径：仓库内运行为仓库相对；工作区运行为旧格式（带仓库名前缀） */
const relPath = (f) => (REPO_ROOT && f.startsWith(REPO_ROOT) ? path.relative(REPO_ROOT, f) : f).split(path.sep).join('/');
const OUT = path.join(__dirname, 'events.json');

/* 按裁定不索引的件：取自 rules.json.noIndex.codes（重建登记表时写回每条记录的 noIndex 字段） */
const NO_INDEX = (() => {
  try {
    const r = JSON.parse(fs.readFileSync(path.join(__dirname, 'rules.json'), 'utf8').replace(/^\uFEFF/, ''));
    return new Set(((r.noIndex && r.noIndex.codes) || []).map((c) => String(c).toUpperCase()));
  } catch (e) { return new Set(); }
})();

/* 目录（天）→ 日期与时间段：取自画布 notes 与《写作手册》《D3 处决日设计定案》 */
const DAY = {
  '【主线】序章': { day: '序章', date: '1942-01-30', dateLabel: '1942年1月30日 黄昏', period: '1942-01', segment: '黄昏' },
  '【主线】第一天': { day: 'D1', date: '1942-01-31', dateLabel: '1942年1月31日', period: '1942-01', segment: '' },
  '【主线】第二天': { day: 'D2', date: '1942-02-01', dateLabel: '1942年2月1日', period: '1942-02', segment: '' },
  '【主线】第三天': { day: 'D3', date: '1942-02-02', dateLabel: '1942年2月2日', period: '1942-02', segment: '' },
};
/* DE 参考导入件、TEST/试验稿不参与登记——否则同代号会出现两件，登记表还会被 TEST 抢走代号 */
const EXCLUDE = /DiscoElysium|discoelysium|(^|[\s_])TEST([\s_.]|$)/i;

const SEG = /(清晨|上午之前|上午|午间|中午|下午|黄昏|傍晚|深夜|午夜|夜|凌晨)/;

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.ncanvas')) out.push(p);
  }
  return out;
}

const files = walk(ROOT, []);
const events = [];
const unregistered = [];

for (const f of files) {
  const base = path.basename(f, '.ncanvas');
  const dirName = path.basename(path.dirname(f));
  const dayInfo = DAY[dirName] || { day: '?', date: '', dateLabel: '', period: '', segment: '' };
  let j, title = base, notes = '', nodes = 0, links = 0;
  try {
    j = JSON.parse(fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, ''));
    const p = j.project || j;
    title = p.title || base;
    notes = String(p.notes || '');
    nodes = (p.nodes || []).length;
    links = (p.links || []).length;
  } catch (e) { /* 留空 */ }

  const ref = EXCLUDE.test(base);
  // 代号以**文件名**为准：画布内部 title 沿用的是重编号前的旧号（如 202A 内部仍写 204A），
  // 文件名才是当前口径；内部号另存 alias 供回溯。
  const mFile = base.match(/Event\s*([0-9]{2,3}[A-Z]?)/i);
  const mTitle = title.match(/Event\s*([0-9]{2,3}[A-Z]?)/i);
  const code = mFile ? mFile[1].toUpperCase() : '';
  const alias = mTitle && (!mFile || mTitle[1].toUpperCase() !== code) ? mTitle[1].toUpperCase() : '';
  // 从 notes 抽更精确的日期（notes 是画布自带元信息，优先于目录推断）
  const mDate = notes.match(/(19\d{2})年(\d{1,2})月(\d{1,2})日/);
  const date = mDate ? `${mDate[1]}-${String(mDate[2]).padStart(2, '0')}-${String(mDate[3]).padStart(2, '0')}` : dayInfo.date;
  const dateLabel = mDate ? `${mDate[1]}年${+mDate[2]}月${+mDate[3]}日` : dayInfo.dateLabel;
  // 时段：画布 notes 里的时段标注可能描述的是件内**别的**时点（如 106 的梦境件 notes 里写「清晨」
  // 说的是前一件 105 的内容），故：notes 只在前 220 字内命中才采信，否则退回文件名，再退回目录。
  const segNote = notes.slice(0, 220).match(SEG);
  const segFile = base.match(SEG);
  const seg = (segNote && segNote[1]) || (segFile && segFile[1]) || dayInfo.segment || '';
  const segFrom = segNote ? 'notes' : segFile ? 'filename' : dayInfo.segment ? 'daymap' : '';
  const period = date ? date.slice(0, 7) : dayInfo.period;

  const rec = {
    code, alias, title, name: base, day: dayInfo.day, date, dateLabel, segment: seg, segFrom, period,
    file: relPath(f),
    kind: code ? (/^[123]/.test(code) ? '主线/支线' : '事件') : '未编号',
    nodes, links, ref,
  };
  if (code && NO_INDEX.has(code)) rec.noIndex = true;
  if (!code || ref) unregistered.push(rec); else events.push(rec);
}

events.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : (a.code < b.code ? -1 : a.code > b.code ? 1 : 0)));
unregistered.sort((a, b) => (a.name < b.name ? -1 : 1));

const reg = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: ROOT.split('\\').join('/'),
  note: '代号 → 画布文件 + 时点。period 用于 med_verify 的时点闸门；date/segment 取自画布 notes，缺则按天目录推断。',
  dayMap: DAY,
  events, unregistered,
};

console.log(`登记 ${events.length} 件（编号件）｜未编号/参考 ${unregistered.length} 件`);
for (const e of events) console.log(`  ${e.code.padEnd(5)} ${e.day.padEnd(4)} ${e.date} ${(e.segment || '全时段').padEnd(5)}[${e.segFrom.slice(0, 4).padEnd(4)}] ${String(e.nodes).padStart(4)}节点  ${e.title.slice(0, 38)}${e.alias ? '  (内部号 ' + e.alias + ')' : ''}${e.noIndex ? '  〔裁定不索引〕' : ''}`);
console.log('  ── 未编号/参考 ──');
for (const e of unregistered) console.log(`  ${(e.ref ? '[参考]' : '[未编号]').padEnd(7)} ${String(e.nodes).padStart(4)}节点  ${e.name.slice(0, 52)}`);

if (process.argv.includes('--write')) {
  fs.writeFileSync(OUT, JSON.stringify(reg, null, 1), 'utf8');
  console.log('\n→ 已写 ' + OUT);
} else console.log('\n（dry-run：加 --write 落盘 events.json）');
