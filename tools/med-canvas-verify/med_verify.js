'use strict';
/* med_verify.js —— MED 画布史料核验（DSH 技能 med-canvas-verify 的引擎）
 *
 * 用法
 *   node med_verify.js list                                                     # 事件登记表（代号 → 文件 + 时点）
 *   node med_verify.js lint    --event <代号|路径> [--period A..B] [--out <md>] [--all] [--debug]
 *   node med_verify.js index   --event <代号|路径> [--write] [--out <md>] [--refresh] [--quiet]
 *   node med_verify.js search  --event <代号|路径> [--cache <json>] [--scope page|book]
 *   node med_verify.js terms   --event <代号|路径>
 *   node med_verify.js history                                                  # 历次运行汇总
 *   node med_verify.js lexicon / build-citations
 *
 *   --event 可写代号（101 / 103A / 202B，亦接受内部旧号 204A）或直接给 .ncanvas 路径。
 *   时点优先级：显式 --period ＞ 登记表该件 period ＞ rules.json 默认。
 *   代号解析依赖 events.json；新增/改名画布后跑：node scan_events.js --write
 *
 * 设计约束
 *   · 只读：绝不写 .ncanvas；仅输出 md/json 索引文件
 *   · 默认 dry-run：index 落到文件需显式 --write
 *   · 硬配额：见 rules.json caps（超限即停并报账）
 *   · 缓存优先：--cache 文件存在则默认复用，不再打库（--refresh 强制重查）
 *   · 确定性：输出排序固定（section → lexicon id → book_id → page）
 *   · 全流程 UTF-8 no-BOM / LF；不经过 PowerShell
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const SKILL_DIR = __dirname;
const RULES = JSON.parse(fs.readFileSync(path.join(SKILL_DIR, 'rules.json'), 'utf8'));
const LEX_PATH = process.env.MED_VERIFY_LEXICON || path.join(SKILL_DIR, 'lexicon.tsv');
const CIT_PATH = path.join(SKILL_DIR, 'citations.jsonl');
const SEED_PATH = path.join(SKILL_DIR, 'citations.seed');

/* ───────────── 位置无关化（2026-10-01 入库） ─────────────
   引擎同时支持两种安放位置，数据（lexicon/rules/citations/events）都跟引擎同目录：
     · 仓库内  06_MED_TextScript\MED-TextScript\tools\med-canvas-verify\
     · 工作区  .dsh\skills\med-canvas-verify\
   仓库根的判定标志＝该目录下有 MEDNarrative\Flows。输出目录与登记表里的画布路径按仓库根
   解析；老格式（带 06_MED_TextScript\MED-TextScript\ 前缀）与绝对路径都仍然认。
   库地址可用环境变量覆盖：MED_LIB_DB / MED_LIB_API。 */
const REPO_ROOT = (() => {
  let d = __dirname;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(d, 'MEDNarrative', 'Flows'))) return d;
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  return process.cwd();
})();
const stripPrefix = (s) => String(s).replace(/^.*?MED-TextScript[\\/]/, '');
const resolveCanvasPath = (rel) => {
  const cands = [path.resolve(REPO_ROOT, stripPrefix(rel)), path.resolve(REPO_ROOT, rel), path.resolve(process.cwd(), rel)];
  return cands.find((p) => fs.existsSync(p)) || cands[0];
};
RULES.outDir = (() => {
  const raw = String(RULES.outDir || 'MED_考证索引');
  if (path.isAbsolute(raw)) return raw;
  const cands = [path.join(REPO_ROOT, stripPrefix(raw)), path.resolve(process.cwd(), raw), path.join(REPO_ROOT, raw)];
  return cands.find((p) => fs.existsSync(p)) || cands[0];
})();
if (process.env.MED_LIB_DB) RULES.lib.db = process.env.MED_LIB_DB;
if (process.env.MED_LIB_API) RULES.lib.api = process.env.MED_LIB_API;

/* ───────────────────────── 基础工具 ───────────────────────── */
const argv = process.argv.slice(2);
const CMD = argv[0] || 'help';
const opt = {};
const flags = new Set();
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  const m = a.match(/^--([A-Za-z-]+)=(.*)$/);
  if (m) { opt[m[1]] = m[2]; continue; }
  if (/^--/.test(a)) { flags.add(a.slice(2)); continue; }
  if (!opt._) opt._ = a;
}
const has = (f) => flags.has(f);
const log = (...a) => { if (!has('quiet')) console.error(...a); };
const die = (m, c = 1) => { console.error('✗ ' + m); process.exit(c); };
const readText = (p) => fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
const writeText = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s, 'utf8'); };

const loadLexicon = () => {
  const rows = [];
  for (const raw of readText(LEX_PATH).split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const f = raw.split('^').map((s) => s.trim());
    if (f.length < 9) continue;
    rows.push({
      id: f[0], term: f[1], group: f[2],
      aliases: f[3] ? f[3].split('|').map((s) => s.trim()).filter(Boolean) : [],
      disambig: f[4] || '',
      kind: f[5], cls: f[6], timeGuard: f[7] || '', note: f[8], extra: f[9] || '',
    });
  }
  return rows;
};

const loadCitations = () => {
  if (!fs.existsSync(CIT_PATH)) return [];
  return readText(CIT_PATH).split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
};

/* ───────────────────────── 事件登记表（代号 → 文件 + 时点） ───────────────────────── */
const REG_PATH = path.join(SKILL_DIR, 'events.json');
const loadRegistry = () => (fs.existsSync(REG_PATH) ? JSON.parse(readText(REG_PATH)) : { events: [], unregistered: [] });
/* 解析 --event 的取值：代号（101 / 103A / 202B）、代号+别名、含"新序章"等名称片段，或直接给路径 */
function resolveEventSpec(spec) {
  if (!spec) return null;
  const looksPath = /[\\/]/.test(spec) || /\.ncanvas$/i.test(spec);
  if (looksPath) {
    const abs = resolveCanvasPath(spec);
    if (!fs.existsSync(abs)) die('画布不存在: ' + spec);
    return { file: abs, entry: null };
  }
  const reg = loadRegistry();
  const key = String(spec).trim();
  const up = key.toUpperCase();
  let hit = reg.events.find((e) => e.code === up)                        // 101 / 103A
    || reg.events.find((e) => e.alias && e.alias === up)                 // 用内部旧号也能命中（204A）
    || reg.events.find((e) => e.name.includes(key))                      // 名称片段
    || reg.events.find((e) => (e.title || '').includes(key))
    || (reg.unregistered || []).find((e) => e.name.includes(key) && !e.ref);
  if (!hit) {
    const codes = reg.events.map((e) => e.code).join(', ');
    die(`代号「${spec}」在登记表中未命中。可用代号：${codes}\n  （未编号件：${(reg.unregistered || []).filter((e) => !e.ref).map((e) => e.name).join('、')}）\n  重新扫描：node ${path.relative(process.cwd(), path.join(SKILL_DIR, 'scan_events.js'))} --write`);
  }
  if (!fs.existsSync(hit.file)) {
    const abs0 = resolveCanvasPath(hit.file);
    if (!fs.existsSync(abs0)) die(`登记表指向的文件不存在（可能已改名）：${hit.file}\n  重新扫描：node ${path.relative(process.cwd(), path.join(SKILL_DIR, 'scan_events.js'))} --write`);
    return { file: abs0, entry: hit };
  }
  return { file: resolveCanvasPath(hit.file), entry: hit };
}

/* 检索 / 闸门历史（汇总用） */
const HIST_PATH = path.join(SKILL_DIR, '.cache', 'history.jsonl');
function appendHistory(rec) {
  try {
    fs.mkdirSync(path.dirname(HIST_PATH), { recursive: true });
    fs.appendFileSync(HIST_PATH, JSON.stringify(rec) + '\n', 'utf8');
  } catch (e) { log('· 历史写入失败（忽略）：' + e.message); }
}
const loadHistory = () => {
  if (!fs.existsSync(HIST_PATH)) return [];
  const out = [];
  for (const l of readText(HIST_PATH).split(/\r?\n/)) {
    if (!l.trim()) continue;
    try { out.push(JSON.parse(l)); } catch (e) { /* 跳过坏行 */ }
  }
  return out;
};

/* 词级缓存：同一查询串（含消歧词）的结果跨事件复用。
   动机：2 字词只能整表 LIKE（3–5 秒/次），而「煤」「当铺」这类词在 20 个事件件里反复出现，
   不缓存就等于把同一张表扫 20 遍。键＝实际查询串，故词表改了自然失效。 */
const TERM_CACHE_PATH = path.join(SKILL_DIR, '.cache', 'terms.json');
const loadTermCache = () => {
  if (!fs.existsSync(TERM_CACHE_PATH)) return { version: 1, terms: {} };
  try { const j = JSON.parse(readText(TERM_CACHE_PATH)); if (!j.terms) j.terms = {}; return j; } catch (e) { return { version: 1, terms: {} }; }
};
const saveTermCache = (c) => {
  try { c.updatedAt = new Date().toISOString(); writeText(TERM_CACHE_PATH, JSON.stringify(c)); } catch (e) { log('· 词级缓存写入失败（忽略）：' + e.message); }
};

/* 异体字／习见异写归一化：检索词与正文**都单向映射到同一个代表字**后再比，
   避免"账/帐""著/着"这类一字之差漏报。
   关键：映射必须单向且唯一（曾用对称交换，导致正文→帐、检索词→账 而互不相等）。
   归一化只用于匹配，不改变词表与画布内容。 */
const VARIANT_GROUPS = [
  ['帐', '账'],           // 代表字取"帐"
  ['著', '着'],           // 代表字取"著"
  ['祗', '祇', '只'],
  ['麽', '么'],
  ['唸', '念'],
  ['甯', '宁'],
  ['牠', '它'],
  ['─', '－', '-', '—', '–'],
  ['祢', '你'],
];
const VARIANT_MAP = (() => {
  const m = new Map();
  for (const g of VARIANT_GROUPS) { const canon = g[0]; for (const c of g) m.set(c, canon); }
  return m;
})();
const normVar = (s) => String(s || '').split('').map((c) => VARIANT_MAP.get(c) || c).join('');
const probeHit = (text, probe) => {
  if (text.includes(probe)) return true;
  return normVar(text).includes(normVar(probe));
};

/* ───────────────────────── ncanvas 解析 ───────────────────────── */
function loadCanvas(p) {
  const j = JSON.parse(readText(p));
  const proj = j.project || j;
  const nodes = (proj.nodes || []).map((n) => {
    const parts = [];
    if (typeof n.body === 'string' && n.body.trim()) parts.push(n.body);
    if (Array.isArray(n.turns)) for (const t of n.turns) parts.push(`${t.speaker || ''}: ${t.line || ''}`);
    if (Array.isArray(n.choices)) for (const c of n.choices) parts.push(String(c));
    if (Array.isArray(n.choiceOptions)) for (const c of n.choiceOptions) if (c && c.label) parts.push(String(c.label));
    return {
      id: n.id, type: n.type, title: n.title || '',
      text: parts.join('\n'),
      speaker: Array.isArray(n.turns) && n.turns[0] ? n.turns[0].speaker : '',
    };
  });
  const links = (proj.links || []).length;
  return { title: proj.title || path.basename(p, path.extname(p)), nodes, links, raw: j };
}

/* 跳过非游戏文本卡与元层豁免
   非游戏文本卡＝以【】开头的内部卡（【结算】【转场】【提示】等，见 _tools\audit_decisions.md「内部卡前缀」）。
   元层豁免（rules.json.exempt.metaLayer）是在**件级**生效的：命中即整件不查——因为该件含元层
   （打破第四面墙）文本，现代语属有意设计，机器判不出哪句是元层。
   代价是：该件的**现实层**（1942 口径）也一并失去检索。故豁免必须**显式可见**，
   由人工决定是否拆层——不允许它静默变成"这件没东西可查"。 */
const INTERNAL = /^【/;
function gameNodes(cv, eventKey) {
  const meta = RULES.exempt && RULES.exempt.metaLayer;
  const key = String(eventKey || cv.title);
  if (meta && meta.match && key.includes(meta.match)) {
    return { nodes: [], skipped: 'metaLayer', reason: meta.note, match: meta.match, total: cv.nodes.length };
  }
  return { nodes: cv.nodes.filter((n) => !INTERNAL.test((n.text || '').trim())), skipped: null };
}

/* ───────────────────────── 待查词编译 ───────────────────────── */
function compileTerms(cv, lex) {
  const g = gameNodes(cv, opt.event);
  if (g.skipped) return [];
  const all = g.nodes.map((n) => n.text).join('\n');
  const hits = [];
  for (const e of lex) {
    if (e.cls === 'X' && e.kind === 'speech') continue;      // 纯闸门词不检索
    if (e.kind === 'calendar') continue;                     // 岁时词由闸门处理
    const probes = [e.term, ...e.aliases];
    let n = 0, first = null;
    for (const p of probes) {
      if (probeHit(all, p)) { n += all.split(p).length - 1 || 1; if (!first) first = p; }
    }
    if (n > 0) hits.push({ lex: e, count: n, matched: first });
  }
  hits.sort((a, b) => (a.lex.id < b.lex.id ? -1 : a.lex.id > b.lex.id ? 1 : 0));
  return hits;
}

/* ───────────────────────── P2 闸门 ───────────────────────── */
const ym = (s) => { const m = String(s).match(/^(\d{4})-(\d{2})/); return m ? m[1] + m[2] : ''; };
const DEPRECATED_MARK = /【用词裁定】|【禁用】|【建议改词】/;
function runGates(cv, lex, period) {
  const g = gameNodes(cv, opt.event);
  const findings = [];
  const coverage = { tested: 0, hit: new Set(), miss: [] };
  if (g.skipped === 'metaLayer') {
    return { findings: [{ level: 'info', gate: 'exempt', lexId: '', node: '', msg: `命中元层豁免（${RULES.exempt.metaLayer.note}），全部闸门跳过` }], coverage };
  }
  const byNode = g.nodes;
  const pf = ym(period.from);
  const seen = new Set();
  const gapAgg = new Map();
  const push = (f) => { const k = [f.gate, f.lexId, f.node, f.msg].join('¦'); if (!seen.has(k)) { seen.add(k); findings.push(f); } };

  for (const e of lex) {
    const probes = [e.term, ...e.aliases].filter(Boolean);
    coverage.tested++;
    let found = false;
    for (const n of byNode) {
      const hit = probes.find((p) => probeHit(n.text || '', p));
      if (!hit) continue;
      found = true;
      // a) 时点闸门
      if (e.timeGuard && e.timeGuard.startsWith('from:')) {
        const from = ym(e.timeGuard.slice(5));
        if (pf && from && pf < from) {
          const forbidden = e.cls === 'X';
          push({
            level: forbidden ? 'error' : (RULES.gates.timeGuard.level || 'warn'),
            gate: forbidden ? 'timeGuardForbidden' : 'timeGuard',
            lexId: e.id, node: n.id,
            msg: `「${hit}」${forbidden ? '在本时点尚不存在' : '口径晚于本时点'}：${e.timeGuard.slice(5)} 起；当前 period=${period.label}。${e.note.replace(/^【[^】]*】/, '')}`,
          });
        }
      }
      // b) 用词裁定
      if (DEPRECATED_MARK.test(e.note)) {
        push({
          level: RULES.gates.deprecatedTerm.level || 'warn',
          gate: 'deprecatedTerm', lexId: e.id, node: n.id,
          msg: `「${hit}」用词待裁定：${e.note.replace(/^【[^】]*】/, '').split('。')[0] || e.note}`,
        });
      }
      // c) 缺口词（按词聚合，避免同一词在多节点重复刷屏）
      if (e.cls === 'C') {
        if (!gapAgg.has(e.id)) gapAgg.set(e.id, { lex: e, nodes: [], hit });
        gapAgg.get(e.id).nodes.push(n.id);
      }
    }
    if (found) coverage.hit.add(e.id); else if (e.cls === 'X') coverage.miss.push(e.id);
  }
  for (const [, a] of gapAgg) {
    push({
      level: RULES.gates.gapTerm.level || 'info',
      gate: 'gapTerm', lexId: a.lex.id, node: a.nodes.slice(0, 6).join(',') + (a.nodes.length > 6 ? ` 等${a.nodes.length}处` : ''),
      msg: `「${a.hit}」属库中缺口（class=C，出现 ${a.nodes.length} 处）：${a.lex.note.replace(/^【[^】]*】/, '').split('。')[0]}`,
    });
  }
  // d) 专名重复计数
  if (RULES.gates.properNounRepeat.enabled) {
    const cnt = new Map();
    const all = byNode.map((n) => n.text).join('\n');
    for (const m of all.matchAll(/([\u4e00-\u9fa5]{2,3})(掌柜|当铺|饭庄|药铺)/g)) {
      const k = m[0];
      cnt.set(k, (cnt.get(k) || 0) + 1);
    }
    for (const [k, v] of cnt) if (v >= 5) {
      push({ level: 'info', gate: 'properNounRepeat', lexId: '', node: '', msg: `「${k}」出现 ${v} 次（供人工判断称呼密度）` });
    }
  }
  const rank = { error: 0, warn: 1, info: 2 };
  findings.sort((a, b) => (rank[a.level] - rank[b.level]) || (a.gate < b.gate ? -1 : a.gate > b.gate ? 1 : 0) || (a.lexId < b.lexId ? -1 : 1));
  return { findings, coverage };
}

/* ───────────────────────── 检索后端 ───────────────────────── */
const getJson = (url) => new Promise((res) => {
  const q = http.get(url, { timeout: 60000 }, (r) => { let b = ''; r.on('data', (d) => (b += d)); r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { res({ error: 'parse' }); } }); });
  q.on('error', (e) => res({ error: e.message }));
  q.on('timeout', () => { q.destroy(); res({ error: 'timeout' }); });
});
async function apiAlive() {
  const j = await getJson(RULES.lib.api + '/api/stats');
  return !j.error;
}
function openDb() {
  const { DatabaseSync } = require('node:sqlite');
  const db = new DatabaseSync(RULES.lib.db, { readOnly: true });
  // 打开的句柄会让事件循环（以及通过管道读 stdout 的父进程）一直等，表现为"固定多等 ~20 秒"
  DB_HANDLES.push(db);
  return db;
}
const DB_HANDLES = [];
const closeDbs = () => { while (DB_HANDLES.length) { try { DB_HANDLES.pop().close(); } catch (e) { /* 已关 */ } } };
process.on('exit', closeDbs);
const ftsQuote = (w) => '"' + w.replace(/"/g, '""') + '"';
const snip = (text, words, width = 130) => {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  let pos = -1;
  for (const w of words) { const i = s.indexOf(w); if (i >= 0 && (pos < 0 || i < pos)) pos = i; }
  if (pos < 0) return s.slice(0, width);
  const st = Math.max(0, pos - Math.floor(width * 0.35));
  return (st > 0 ? '…' : '') + s.slice(st, st + width) + (st + width < s.length ? '…' : '');
};
/* 直连索引库检索。
   要点：索引库 pages_fts 用 tokenize='trigram' —— **2 字词永远匹配不到**（trigram 需 ≥3 字），
   必须走 LIKE；而 LIKE 是整表扫描（约 3–5 秒/次）。
   因此混合：≥3 字的词走 FTS5 MATCH（毫秒级），<3 字的词补 LIKE 条件。
   实测「经济犯+警察」由 ~5000ms 降到 ~13ms。 */
function dbSearch(db, term, scope) {
  const words = term.split(/[\s+＋&|]+/).map((s) => s.trim()).filter(Boolean);
  if (!words.length) return { term, total: 0, books: [], via: 'db' };
  const longW = words.filter((w) => w.length >= 3);
  const shortW = words.filter((w) => w.length < 3);
  const conds = [], params = [];
  let why = '';
  if (longW.length) {
    const m = longW.map(ftsQuote).join(' AND ');
    try {
      db.prepare('SELECT count(*) c FROM pages_fts WHERE pages_fts MATCH ? LIMIT 1').get(m);
      conds.push('pages_fts MATCH ?'); params.push(m); why = 'match';
    } catch (e) { /* 表达式非法则整组退回 LIKE */ }
  }
  if (shortW.length) { for (const w of shortW) { conds.push('text LIKE ?'); params.push('%' + w + '%'); } why = why ? 'match+like' : 'like'; }
  if (!conds.length) { for (const w of words) { conds.push('text LIKE ?'); params.push('%' + w + '%'); } why = 'like'; }

  let rows = [];
  const cap = RULES.caps.window || 20000;
  const sql = `SELECT book_id, page_no, text FROM pages_fts WHERE ${conds.join(' AND ')} ` +
    (why === 'match' ? 'ORDER BY rank ' : '') + 'LIMIT ?';
  try { rows = db.prepare(sql).all(...params, cap); } catch (e) { rows = []; }
  const by = new Map();
  for (const r of rows) { if (!by.has(r.book_id)) by.set(r.book_id, []); by.get(r.book_id).push(r); }
  const ranked = [...by.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, RULES.caps.booksPerQuery);
  const books = [];
  for (const [bid, hits] of ranked) {
    const info = db.prepare('SELECT id,title,rel,pages FROM books WHERE id=?').get(bid);
    if (!info) continue;
    books.push({
      bookId: bid, title: info.title, pages: info.pages,
      hitCount: hits.length,
      hits: hits.slice(0, RULES.caps.hitsPerBook).map((h) => ({ page: h.page_no, snippet: snip(h.text, words) })),
    });
  }
  return { term, total: by.size, books, via: 'db:' + why, capped: rows.length >= cap };
}
function apiSearchOne(j, term) {
  const books = (j.books || []).slice(0, RULES.caps.booksPerQuery).map((b) => ({
    bookId: b.book_id, title: b.title, pages: b.pages, hitCount: b.hit_count,
    hits: (b.hits || []).slice(0, RULES.caps.hitsPerBook).map((h) => ({ page: h.page, snippet: String(h.snippet || '').replace(/<\/?mark>/g, '') })),
  }));
  return { term, total: j.total || 0, books, via: 'api' };
}
/* 统一检索后端选择：prefer=db（默认，毫秒级）或 api；任一路不通则回退另一路 */
async function makeSearcher() {
  const prefer = (opt.via || (RULES.backend && RULES.backend.prefer) || 'db').toLowerCase();
  const tryDb = () => { const db = openDb(); return { label: 'db:直连索引库', run: async (q) => dbSearch(db, q, opt.scope || 'page') }; };
  const tryApi = () => ({
    label: 'api:8080', run: async (q) => {
      const j = await getJson(RULES.lib.api + '/api/search?q=' + encodeURIComponent(q) + '&limit=' + RULES.caps.booksPerQuery + '&per=' + RULES.caps.hitsPerBook);
      return j.error ? { term: q, total: 0, books: [], via: 'api', error: j.error } : apiSearchOne(j, q);
    },
  });
  const order = prefer === 'api' ? ['api', 'db'] : ['db', 'api'];
  /* 词级缓存包装：命中即跳过实际检索（跨事件复用） */
  const termCache = has('no-term-cache') ? null : loadTermCache();
  let cacheHit = 0, cacheMiss = 0;
  const wrap = (base) => ({
    label: base.label,
    run: async (q) => {
      if (termCache && termCache.terms[q] && !has('refresh')) { cacheHit++; return termCache.terms[q]; }
      const r = await base.run(q);
      cacheMiss++;
      if (termCache && !r.error) { termCache.terms[q] = r; }
      return r;
    },
    flush: () => { if (termCache && cacheMiss) saveTermCache(termCache); },
    stats: () => ({ cacheHit, cacheMiss }),
  });
  for (const k of order) {
    if (k === 'db') { try { return wrap(tryDb()); } catch (e) { log('· 直连索引库不可用（' + e.message + '），改用 8080'); } }
    else { if (await apiAlive()) return wrap(tryApi()); log('· 8080 未响应，改用直连索引库'); }
  }
  die('两种检索后端都不可用：索引库打不开，且 8080 未响应。');
}

/* ───────────────────────── 出处匹配 ───────────────────────── */
const norm = (s) => String(s || '').replace(/[《》〈〉（）()［］\[\]·、，,。：:；;—\-–~\s"'"']/g, '').slice(0, 16);
/* 由库内全名推出可读短名：截到第一个分隔特征为止 */
const shortWork = (title) => {
  let t = String(title || '');
  t = t.split(/\s+--\s+/)[0];             // Z-Library / Anna 长尾
  t = t.split(/[(（]/)[0];                 // 首个括号前
  t = t.replace(/\s*_+\s*/g, '——');       // 下划线连接的副题
  t = t.replace(/\s+/g, ' ').trim();
  return t.length > 46 ? t.slice(0, 46) + '…' : t;
};
function matchCitations(term, books, cits) {
  const out = [];
  const seen = new Set();
  for (const c of cits) {
    const linked = (c.terms || []).includes(term.id);
    // 无 terms 关联时，只有主词**逐字出现在文章标题里**才算命中（避免泛词乱配）
    const byTitle = !linked && c.article && String(c.article).includes(term.term) && term.term.length >= 3;
    if (!linked && !byTitle) continue;
    // 同一出处（书＋页）合并，避免重复行
    const key = String(c.srcId) + '|' + c.pdfPage;
    if (seen.has(key)) continue;
    seen.add(key);
    const hit = books.find((b) => b.bookId === Number(String(c.srcId).replace('kl:', '')) || norm(b.title) === norm(c.work) || norm(b.title).includes(norm(c.work)) || norm(c.work).includes(norm(b.title)));
    out.push({ cit: c, book: hit || null });
  }
  return out;
}

/* ───────────────────────── 输出：索引 MD ───────────────────────── */
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
function renderIndex(cv, period, terms, results, cits, gates, coverage) {
  /* 出处栏显示名：优先短名；若台账里只剩 @id:NNN（无库模式建台账的后遗症），
     用 bookmap.titles 反查真实书名，避免输出里出现 @id:877 这类串。 */
  const bookTitles = (() => {
    const p = path.join(SKILL_DIR, 'bookmap.json');
    if (!fs.existsSync(p)) return {};
    try { return (JSON.parse(readText(p)).titles) || {}; } catch (e) { return {}; }
  })();
  const dispName = (c) => {
    let s = c.short || shortWork(c.work);
    const m = String(s).match(/^@id:(\d+)$/);
    if (m && bookTitles[m[1]]) s = shortWork(bookTitles[m[1]]);
    return s;
  };
  const L = [];
  const now = new Date().toISOString().slice(0, 10);
  L.push(`# ${cv.title} · 史料检索与比对索引`);
  L.push('');
  const evLabel = opt.event || (opt._resolved ? opt._resolved.file : '');
  L.push(`> **画布**：\`${evLabel}\`（${cv.nodes.length} 节点／${cv.links} 连线）｜**时点**：${period.label}`);
  L.push(`> **检索库**：本机抗联 OCR 全文库（${RULES.lib.db}）｜**生成**：${now}｜**工具**：\`med_verify.js\`（med-canvas-verify 技能）`);
  L.push(`> **口径唯一真相**：\`${RULES.truthSource}\`；本文件只提供史料坐标与差异提示，不做故事的逐项"真实度"裁断。`);
  L.push('');
  L.push('## 一 闸门结果（离线，不依赖语料）');
  L.push('');
  const gmeta = gameNodes(cv, opt.event);
  if (gmeta.skipped === 'metaLayer') {
    L.push(`> ⚠ **本件命中元层豁免，整件未做检索与闸门**（匹配 \`${gmeta.match}\`）。`);
    L.push(`> 裁据：${gmeta.reason}`);
    L.push(`> 影响：本件 ${gmeta.total} 张卡（含现实层）一并跳过。**这不是"无史料可查"**——`);
    L.push('> 如需现实层的考证，请拆出元层后单独跑，或临时用 `--event <路径>` ＋ 改 `rules.json` 的豁免匹配（须先确认口径）。');
    L.push('');
  }
  if (!gates.length) L.push('- 无提示。');
  else {
    L.push('| 级别 | 闸门 | 词 | 节点 | 说明 |');
    L.push('|---|---|---|---|---|');
    for (const f of gates) L.push(`| ${f.level} | \`${f.gate}\` | ${f.lexId || '—'} | ${f.node || '—'} | ${String(f.msg).replace(/\|/g, '／')} |`);
  }
  L.push('');
  L.push('## 二 时点红线（本时点不可用／需注意的词）');
  L.push('');
  L.push('X 类词**只做闸门、不做检索**；下表按词表穷举，`命中` 为空即本件正文未出现——**未出现不等于可用，只说明当前没踩**。');
  L.push('');
  L.push('| 词 | 词表 | 起始 | 级别 | 本件命中 | 说明 |');
  L.push('|---|---|---|---|---|---|');
  for (const e of loadLexicon().filter((x) => x.timeGuard || x.cls === 'X')) {
    const from = e.timeGuard ? e.timeGuard.slice(5) : '—';
    const lv = e.cls === 'X' ? '**禁用**' : '需注意';
    const hit = gates.filter((g) => g.lexId === e.id);
    const where = hit.length ? hit.map((h) => h.node).filter(Boolean).join(',') || '（全件级）' : '';
    L.push(`| ${e.term} | \`${e.id}\` | ${from} | ${lv} | ${where || '—'} | ${String(e.note).replace(/^【[^】]*】/, '').replace(/\|/g, '／')} |`);
  }
  L.push('');
  L.push('## 三 主题索引（正文）');
  L.push('');
  L.push('出处栏标记：**✓** = 已取回整页逐字核对；**·** = 仅检索片段（引用前需补取整页）；`〔未取页〕` = 仅命中、未核对原文。');
  for (const sec of RULES.sections) {
    const rows = terms.filter((t) => t.lex.group === sec.key);
    if (!rows.length) continue;
    L.push('');
    L.push(`### ${sec.title}`);
    L.push('');
    L.push('| 词 | 词表 | 对位 | 时点 | 命中 | 出处（著作—页数—文章标题） | 原文要点 |');
    L.push('|---|---|---|---|---|---|---|');
    for (const t of rows) {
      const res = results[t.lex.id] || { books: [], total: 0 };
      const ms = matchCitations(t.lex, res.books, cits);
      const src = ms.length
        ? ms.map((m) => {
            const pg = `p${m.cit.pdfPage}${m.cit.bookPage ? `（书页 ${m.cit.bookPage}）` : ''}`;
            const art = m.cit.article && !/^p?\d/.test(m.cit.article) ? ` ${m.cit.article}` : '';
            const mark = m.cit.verified === 'page' ? '✓' : '·';
            return `${mark}${dispName(m.cit)} — ${pg}${art ? ' —' + art : ''}`;
          }).join('<br>')
        : (res.books.length
            ? res.books.slice(0, 3).map((b) => `${shortWork(b.title)} — p${b.hits[0] ? b.hits[0].page : '?'}〔未取页〕`).join('<br>')
            : '**库中未见**');
      const pt = ms.length ? ms.map((m) => m.cit.point).filter(Boolean).slice(0, 2).join('；') : (res.books[0] && res.books[0].hits[0] ? res.books[0].hits[0].snippet.slice(0, 90) : '—');
      const tm = t.lex.timeGuard ? (t.lex.cls === 'X' ? `△${t.lex.timeGuard.slice(5)}起` : `≥${t.lex.timeGuard.slice(5)}`) : '—';
      const hitCell = res.total ? `${res.total} 本` : (ms.length ? '—（库中未命中该词，出处于相邻词条）' : '0 本');
      L.push(`| ${t.lex.term} | \`${t.lex.id}\` | ${t.lex.cls} | ${tm} | ${hitCell} | ${src} | ${String(pt).replace(/\|/g, '／')} |`);
    }
  }
  L.push('');
  L.push('## 四 泛词体检（检索范围质量）');
  L.push('');
  const broad = terms.map((t) => ({ t, n: (results[t.lex.id] || { total: 0 }).total }))
    .filter((x) => x.n >= Number(opt.broad || 300))
    .sort((a, b) => b.n - a.n);
  if (!broad.length) L.push('- 无命中过宽的词（阈值 ' + (opt.broad || 300) + ' 本）。');
  else {
    L.push('| 词 | 词表 | 命中本数 | 建议 |');
    L.push('|---|---|---|---|');
    for (const b of broad) {
      const sug = b.t.lex.disambig ? `已有消歧词 \`${b.t.lex.disambig}\`（仍未收窄，建议再加一层限定）` : '**建议补消歧词**（lexicon 第 5 列）';
      L.push(`| ${b.t.lex.term} | \`${b.t.lex.id}\` | ${b.n} | ${sug} |`);
    }
  }
  L.push('');
  L.push('## 五 检索台账');
  L.push('');
  const allText = cv.nodes.map((n) => n.text || '').join('\n');
  if (/【占位[·・]?待写】|正文尚未撰写|待补[:：]/.test(allText)) {
    L.push('> ⚠ **本件含"占位·待写"标记**：正文尚未撰写（现有内容为设计备注），故检索范围有限，**"命中 0 词"不代表无史料可查**。');
    L.push('');
  }
  const qn = Object.keys(results).length;
  const pn = Object.values(results).reduce((a, r) => a + (r.books || []).length, 0);
  L.push(`- 待查词 ${terms.length} 个／实际检索 ${qn} 个（配额 ${RULES.caps.queries}）｜返回书目条目 ${pn}｜出处台账 ${cits.length} 条`);
  L.push(`- 闸门：error ${gates.filter((g) => g.level === 'error').length}／warn ${gates.filter((g) => g.level === 'warn').length}／info ${gates.filter((g) => g.level === 'info').length}`);
  if (coverage) L.push(`- 闸门覆盖：检查 ${coverage.tested} 词／命中 ${coverage.hit.size} 词｜未命中的禁用词：${coverage.miss.join('、') || '（无）'}`);
  L.push(`- 取证强度：\`verified=page\`（已取整页）${cits.filter((c) => c.verified === 'page').length} 条／\`verified=snippet\`（仅片段，引用前需补取）${cits.filter((c) => c.verified === 'snippet').length} 条`);
  L.push('');
  return L.join('\n');
}

/* ───────────────────────── 命令 ───────────────────────── */
if (process.env.MED_VERIFY_EXPORT === '1') {
  module.exports = { probeHit, normVar, loadLexicon, loadCanvas, compileTerms, runGates, resolvePeriod, gameNodes, RULES };
  return;
}
function requireEvent() {
  const p = opt.event || opt._;
  if (!p) die('缺少 --event（可用代号，如 --event 101；或直接给 .ncanvas 路径）');
  const r = resolveEventSpec(p);
  opt._resolved = r;
  return r.file;
}
function resolvePeriod() {
  const p = { ...RULES.period };
  const ent = opt._resolved && opt._resolved.entry;
  // 优先级：显式 --period > 登记表该件的 period > rules.json 默认
  if (ent && ent.period) {
    p.from = ent.period; p.to = ent.period;
    p.label = ent.period + (ent.date ? `（${ent.dateLabel}${ent.segment ? ' ' + ent.segment : ''}）` : '');
    p.fromRegistry = true;
  }
  if (opt.period) {
    const m = String(opt.period).match(/^(\d{4}-\d{2})(?:\.\.(\d{4}-\d{2}))?$/);
    if (m) { p.from = m[1]; p.to = m[2] || m[1]; p.label = m[2] ? `${m[1]}..${m[2]}` : m[1]; delete p.fromRegistry; }
    else log('· --period 格式无法解析（应为 YYYY-MM 或 YYYY-MM..YYYY-MM），已忽略：' + opt.period);
  }
  return p;
}
function defaultOut(cv) {
  const ent = opt._resolved && opt._resolved.entry;
  const tag = ent && ent.code ? ent.code : cv.title;
  return path.join(RULES.outDir, `${tag}_索引.md`);
}

(async () => {
  const lex = loadLexicon();

  if (CMD === 'list') {
    const reg = loadRegistry();
    if (!reg.events.length) die(`登记表为空。先跑：node ${path.relative(process.cwd(), path.join(SKILL_DIR, 'scan_events.js'))} --write`);
    console.log(`事件登记表（生成于 ${reg.generatedAt || '?'}）｜${reg.events.length} 件`);
    console.log('  代号   天    日期        时段    节点  文件名');
    let cur = '';
    for (const e of reg.events) {
      if (e.day !== cur) { cur = e.day; console.log('  ── ' + cur + ' ──'); }
      console.log(`  ${e.code.padEnd(5)} ${e.day.padEnd(4)} ${e.date} ${(e.segment || '全').padEnd(5)} ${String(e.nodes).padStart(4)}  ${e.name.slice(0, 46)}${e.alias ? '  (内部号 ' + e.alias + ')' : ''}`);
    }
    const un = (reg.unregistered || []).filter((e) => !e.ref);
    if (un.length) { console.log('  ── 未编号件 ──'); for (const e of un) console.log(`  ${'—'.padEnd(5)} ${(e.day || '?').padEnd(4)} ${e.date || '—'}       ${String(e.nodes).padStart(4)}  ${e.name}`); }
    return;
  }

  if (CMD === 'history') {
    const h = loadHistory();
    if (!h.length) { console.log('（暂无历史）'); return; }
    console.log('时间              代号  时点     词数 取本  命中  闸门(错/警/信)  后端        产出');
    for (const r of h.slice(-40)) {
      const g = r.gates || {};
      const per = String(r.date || r.period || '').replace(/（.*$/, '').slice(0, 8);
      console.log(`${String(r.at).slice(0, 19)}  ${String(r.code || '—').padEnd(5)} ${per.padEnd(8)} ${String(r.terms || 0).padStart(3)} ${String(r.books || 0).padStart(4)} ${String(r.hits || 0).padStart(5)}   ${String(g.error || 0)}/${String(g.warn || 0)}/${String(g.info || 0)}        ${String(r.via || '').slice(0, 10).padEnd(11)} ${r.wrote ? '已写' : 'dry'}${r.batch ? '（批）' : ''}`);
    }
    console.log(`— 共 ${h.length} 次运行｜累计待查词 ${h.reduce((a, r) => a + (r.terms || 0), 0)}｜累计取回本数 ${h.reduce((a, r) => a + (r.books || 0), 0)}｜缓存命中 ${h.filter((r) => r.cacheHit).length} 次｜error 合计 ${h.reduce((a, r) => a + ((r.gates && r.gates.error) || 0), 0)}`);
    return;
  }

  if (CMD === 'help' || !CMD) {
    console.log(readText(__filename).split(/\r?\n/).filter((l) => /^\s*\*/.test(l)).join('\n'));
    return;
  }

  if (CMD === 'lexicon') {
    const cits = loadCitations();
    const ids = new Set(lex.map((e) => e.id));
    let bad = 0;
    for (const c of cits) for (const t of (c.terms || [])) if (!ids.has(t)) { console.log('✗ 台账引用了不存在的词表 id: ' + t + ' @ ' + c.work + ' p' + c.pdfPage); bad++; }
    const used = new Set(cits.flatMap((c) => c.terms || []));
    console.log(`词表 ${lex.length} 条｜台账 ${cits.length} 条｜有出处的词 ${used.size} 条｜无出处的词 ${lex.filter((e) => !used.has(e.id)).map((e) => e.id).join(',') || '（无）'}`);
    console.log('对位分布: ' + JSON.stringify(lex.reduce((a, e) => (a[e.cls] = (a[e.cls] || 0) + 1, a), {})));
    if (bad) process.exit(1);
    return;
  }

  if (CMD === 'build-citations') {
    let db = null; try { db = openDb(); } catch (e) { log('· 索引库暂不可用：' + e.message); }
    /* 静态书名→id 兜底：I: 盘不可用时仍能解析书名（bookmap.json 由库在线时确认） */
    const bookMap = (() => {
      const p = path.join(SKILL_DIR, 'bookmap.json');
      if (!fs.existsSync(p)) return {};
      try { return (JSON.parse(readText(p)).map) || {}; } catch (e) { return {}; }
    })();
    const seedRows = readText(SEED_PATH).split(/\r?\n/)
      .filter((l) => l.trim() && !l.trim().startsWith('#'));
    const needResolve = seedRows
      .filter((l) => { const w = l.split('|')[0].trim(); return w && !w.startsWith('@id:'); }).length;
    /* 兜底：沿用上一次已解析的 srcId（键＝seed 首列原文＋页码），这样库临时不可用时也能安全重建 */
    const prevMap = new Map();
    if (fs.existsSync(CIT_PATH)) {
      try {
        for (const l of readText(CIT_PATH).split(/\r?\n/)) {
          if (!l.trim()) continue;
          const o = JSON.parse(l);
          if (o.srcId && o.srcId !== 'kl:?') prevMap.set(String(o.workShort) + '|' + String(o.pdfPage), o.srcId);
        }
        log(`· 已有台账可沿用：${prevMap.size} 条已解析 srcId`);
      } catch (e) { /* 旧台账不可解析则忽略 */ }
    }
    /* 安全阀：库不可用且无法沿用 → 会写成 kl:?，等于写坏台账（且覆盖既有好数据）。
       默认拒绝写盘；确需在无库状态重建时用 --force。 */
    if (!db && needResolve > 0 && !prevMap.size && !has('force')) {
      die(`索引库不可用，而种子台账里有 ${needResolve} 行依赖书名匹配（现在会写成 kl:?）。\n` +
          `  已保持 ${path.basename(CIT_PATH)} 不变，避免写坏既有数据。\n` +
          `  待库（I: 盘）恢复后重跑；确需强制重建：--force`);
    }
    const out = []; let miss = 0, reused = 0;
    for (const raw of seedRows) {
      const c = raw.split('|').map((s) => s.trim());
      if (c.length < 9) { console.log('✗ 列数不足: ' + raw.slice(0, 60)); miss++; continue; }
      const [work, pdfPage, bookPage, article, terms, cls, verified, quote, point] = c;
      let srcId = '', libPages = null, title = work;
      if (work.startsWith('@id:')) { srcId = 'kl:' + work.slice(4); }
      if (!db) {
        // 静态映射优先于 seed 内写的 @id 与上次结果——bookmap 是人工核对过的修正层，
        // 否则 seed 里写错的 id（如 381/380）永远改不掉。
        if (bookMap[work]) { srcId = 'kl:' + bookMap[work]; reused++; }
        else if (!work.startsWith('@id:')) {
          const pk = work + '|' + pdfPage;
          if (prevMap.has(pk)) { srcId = prevMap.get(pk); reused++; }
        }
      }
      if (db) {
        const r = srcId
          ? db.prepare('SELECT id,title,pages FROM books WHERE id=?').get(Number(srcId.slice(3)))
          : db.prepare('SELECT id,title,pages FROM books WHERE title LIKE ? LIMIT 1').get('%' + work + '%');
        if (r) { srcId = 'kl:' + r.id; title = r.title; libPages = r.pages; }
        else { miss++; console.log('✗ 书目未命中: ' + work); }
      }
      out.push({ srcId: srcId || 'kl:?', work: title, workShort: work.replace(/^@id:\d+$/, ''), short: shortWork(title), libPages, pdfPage, bookPage, article, terms: terms.split(',').map((s) => s.trim()).filter(Boolean), cls, verified, quote, point });
    }
    writeText(CIT_PATH, out.map((o) => JSON.stringify(o)).join('\n') + '\n');
    const bad = out.filter((o) => o.srcId === 'kl:?').length;
    console.log(`citations.jsonl 已生成：${out.length} 条（书目未命中 ${miss}｜沿用上次 srcId ${reused}｜仍为空 ${bad}）` + (db ? '' : '｜⚠ 无库模式'));
    return;
  }

  if (CMD === 'terms') {
    const cv = loadCanvas(requireEvent());
    const hits = compileTerms(cv, lex);
    for (const h of hits) console.log(`${h.lex.id}\t${h.lex.term}\t×${h.count}\t${h.lex.group}\t${h.lex.cls}${h.lex.disambig ? '\t+' + h.lex.disambig : ''}`);
    console.log(`— 共 ${hits.length} 个词命中画布正文`);
    return;
  }

  if (CMD === 'lint') {
    const evPath = requireEvent();
    const cv = loadCanvas(evPath);
    const period = resolvePeriod();
    if (has('debug')) {
      const g0 = gameNodes(cv, evPath);
      const pf0 = ym(period.from);
      console.log(`[debug] period=${period.label} pf=${pf0}`);
      for (const e of lex) {
        const probes = [e.term, ...e.aliases].filter(Boolean);
        const hits = g0.nodes.filter((n) => probes.some((p) => probeHit(n.text || '', p))).map((n) => n.id);
        if (!hits.length) continue;
        const from = e.timeGuard && e.timeGuard.startsWith('from:') ? ym(e.timeGuard.slice(5)) : '';
        console.log(`[debug] ${e.id} term=${e.term} cls=${e.cls} guard=${e.timeGuard || '-'} from=${from || '-'} fires=${!!(from && pf0 && pf0 < from)} nodes=${hits.join(',')}`);
      }
    }
    const { findings: gates, coverage } = runGates(cv, lex, period);
    const g = gameNodes(cv, evPath);
    console.log(`【${cv.title}】${cv.nodes.length} 节点／${cv.links} 连线｜参与闸门 ${g.nodes.length} 张文本卡｜时点 ${period.label}`);
    if (!gates.length) console.log('  ✔ 闸门无提示');
    for (const f of gates) console.log(`  [${f.level}] ${f.gate} ${f.lexId}${f.node ? ' ' + f.node : ''} — ${f.msg}`);
    const errs = gates.filter((x) => x.level === 'error').length;
    console.log(`  — error ${errs}／warn ${gates.filter((x) => x.level === 'warn').length}／info ${gates.filter((x) => x.level === 'info').length}`);
    console.log(`  — 覆盖：检查 ${coverage.tested} 词／命中 ${coverage.hit.size} 词` + (has('all') || has('coverage') ? `／未命中的禁用词 ${coverage.miss.length ? coverage.miss.join(',') : '（无）'}` : ''));
    if (opt.out) {
      writeText(opt.out, `# ${cv.title} 闸门报告（${period.label}）\n\n` +
        gates.map((f) => `- **[${f.level}] ${f.gate}** ${f.lexId} ${f.node} — ${f.msg}`).join('\n') +
        `\n\n## 覆盖\n\n- 检查 ${coverage.tested} 词｜命中 ${coverage.hit.size} 词｜未命中的禁用词：${coverage.miss.join(',') || '（无）'}\n`);
      console.log('  → 已写 ' + opt.out);
    }
    process.exitCode = errs ? 1 : 0;
    return;
  }

  if (CMD === 'search' || CMD === 'index') {
    const evPath = requireEvent();
    const cv = loadCanvas(evPath);
    const period = resolvePeriod();
    const terms = compileTerms(cv, lex);
    let results = {};
    let cacheHitUsed = false;
    const cacheFile = opt.cache || path.join(SKILL_DIR, '.cache', `${cv.title}.search.json`);

    /* 事件缓存以「逐词完整」为准：缓存非空但缺了本次要查的某个词，必须补查——
       否则新增词表词后，只要缓存里有旧词就会被永久跳过（曾因此漏检 29 个新词）。 */
    if (CMD === 'index' && fs.existsSync(cacheFile) && !has('refresh')) {
      try {
        results = JSON.parse(readText(cacheFile)).results || {};
        const want = terms.map((t) => t.lex.id);
        const miss = want.filter((id) => !results[id]);
        cacheHitUsed = want.length > 0 && miss.length === 0;
        if (miss.length) log(`· 缓存缺 ${miss.length} 词（${miss.slice(0, 6).join(',')}${miss.length > 6 ? '…' : ''}），将补查`);
        else log('· 复用缓存 ' + cacheFile + `（${want.length} 词全命中）`);
      } catch (e) { results = {}; }
    }
    const needTerms = terms.filter((t) => !results[t.lex.id]);
    if (needTerms.length) {
      if (terms.length > RULES.caps.queries) die(`待查词 ${terms.length} 超过配额 ${RULES.caps.queries}；请先收敛词表或提高 caps.queries`);
      const searcher = await makeSearcher();
      log(`· 后端：${searcher.label}｜本次需查 ${needTerms.length} 词（共 ${terms.length} 词）`);
      let i = 0;
      for (const t of needTerms) {
        const q = t.lex.disambig ? `${t.lex.term}+${t.lex.disambig}` : t.lex.term;
        results[t.lex.id] = await searcher.run(q);
        if (++i % 10 === 0) log(`  … ${i}/${needTerms.length}`);
      }
      if (searcher.flush) searcher.flush();
      if (searcher.stats) { const st = searcher.stats(); log(`· 词级缓存：命中 ${st.cacheHit}／新查 ${st.cacheMiss}`); }
      writeText(cacheFile, JSON.stringify({ generatedAt: new Date().toISOString(), period, via: searcher.label, results }, null, 1));
      log('· 检索结果已缓存 ' + cacheFile);
    }

    const cits = loadCitations();
    const { findings: gates, coverage } = runGates(cv, lex, period);
    const md = renderIndex(cv, period, terms, results, cits, gates, coverage);
    const outPath = opt.out || defaultOut(cv);
    const ent = opt._resolved && opt._resolved.entry;
    const gateCount = { error: gates.filter((g) => g.level === 'error').length, warn: gates.filter((g) => g.level === 'warn').length, info: gates.filter((g) => g.level === 'info').length };
    const pageHits = Object.values(results).reduce((a, r) => a + (r.books || []).length, 0);
    console.log(md);
    if (CMD === 'index' && has('write')) {
      writeText(outPath, md);
      console.log('\n→ 已写 ' + outPath);
    } else {
      console.log('\n（dry-run：加 --write 落盘到 ' + outPath + '）');
    }
    appendHistory({
      at: new Date().toISOString(),
      code: ent ? ent.code : '', name: cv.title, day: ent ? ent.day : '', date: ent ? ent.date : '',
      period: period.label, periodFrom: period.fromRegistry ? 'registry' : (opt.period ? 'flag' : 'rules'),
      file: opt._resolved ? opt._resolved.file : '',
      terms: terms.length, via: cacheHitUsed ? 'cache' : 'search',
      books: pageHits, hits: Object.values(results).reduce((a, r) => a + (r.total || 0), 0),
      cits: cits.length,
      gates: gateCount, cacheHit: cacheHitUsed, wrote: CMD === 'index' && has('write'), out: CMD === 'index' && has('write') ? outPath : '',
    });
    return;
  }

  if (CMD === 'index-events') {
    const reg = loadRegistry();
    if (!reg.events.length) die('登记表为空。先跑 scan_events.js --write');
    const hist = loadHistory();
    const noIdx = new Set((((RULES.noIndex || {}).codes) || []).map((c) => String(c).toUpperCase()));
    const lastOf = (code) => [...hist].reverse().find((r) => r.code === code);
    const outDir = RULES.outDir;
    const L = [];
    L.push('# MED 事件件总索引（考证）');
    L.push('');
    L.push(`> **生成**：${new Date().toISOString().slice(0, 10)}｜**来源**：\`${reg.source}\`｜**登记件数**：${reg.events.length} 件（另有参考导入件 ${(reg.unregistered || []).filter((e) => e.ref).length} 件、未编号件 ${(reg.unregistered || []).filter((e) => !e.ref).length} 件）`);
    L.push('> **用途**：按代号查证并生成单个事件件的考据索引。用法见 `.dsh\\skills\\med-canvas-verify\\SKILL.md`。');
    L.push('> **口径唯一真相**：`_tools\\audit_decisions.md`（豁免）＋ `.dsh\\skills\\med-canvas-verify\\lexicon.tsv`（时点与用词裁决）。');
    L.push('');
    L.push('| 代号 | 天 | 日期 | 时段 | 节点/连线 | 件名 | 时点闸门(错/警) | 索引文件 |');
    L.push('|---|---|---|---|---|---|---|---|');
    // 进度以**产物文件是否存在**为准（不依赖 history.jsonl —— 日志可被清理，文件不会撒谎）
    const idxPath = (code) => path.join(RULES.outDir, `${code}_索引.md`);
    const hasIdx = (code) => fs.existsSync(idxPath(code));
    for (const e of reg.events) {
      const h = lastOf(e.code);
      const g = h && h.gates ? `${h.gates.error}/${h.gates.warn}` : (hasIdx(e.code) ? '见件内' : '—');
      const idx = noIdx.has(e.code) ? '**按裁定不索引**' : (hasIdx(e.code) ? `[\`${e.code}_索引.md\`](${e.code}_索引.md)` : '（未生成）');
      L.push(`| \`${e.code}\` | ${e.day} | ${e.date} | ${e.segment || '全'} | ${e.nodes}/${e.links} | ${e.title.replace(/^Event\s*[0-9A-Z]+\s*/i, '')}${e.alias ? `（内部号 ${e.alias}）` : ''} | ${g} | ${idx} |`);
    }
    L.push('');
    const todo = reg.events.filter((e) => !noIdx.has(e.code));
    const done = todo.filter((e) => hasIdx(e.code)).length;
    const miss = todo.filter((e) => !hasIdx(e.code)).map((e) => e.code);
    L.push(`**进度**：已生成索引 ${done}/${todo.length} 件${noIdx.size ? `（另有 ${noIdx.size} 件按裁定不索引：${[...noIdx].join('、')}）` : ''}${miss.length ? `；待生成：${miss.join('、')}` : ''}。`);
    L.push('');
    L.push('## 未编号件与参考件');
    L.push('');
    L.push('| 类别 | 件名 | 节点 | 文件 |');
    L.push('|---|---|---|---|');
    for (const e of (reg.unregistered || [])) L.push(`| ${e.ref ? 'DE 参考' : '未编号'} | ${e.name} | ${e.nodes} | \`${e.file}\` |`);
    L.push('');
    L.push('## 天（时点）对照');
    L.push('');
    L.push('| 天 | 日期 | 时点闸门 period | 备注 |');
    L.push('|---|---|---|---|');
    const notes = { '序章': '游戏 D0／1 月 30 日黄昏（新序章）', 'D1': '1/31＝康德九年腊月十五（小年），训练日', 'D2': '2/1，领粮日／强迫出诊', 'D3': '2/2，处决日（D3 定案）' };
    for (const [k, v] of Object.entries(reg.dayMap || {})) L.push(`| ${v.day} | ${v.date} | \`${v.period}\` | ${notes[v.day] || ''} |`);
    L.push('');
    L.push('*时点纪律（闸门词）见同目录插件 `lexicon.tsv` 的 `timeGuard` 列；本表只列件与天。*');
    L.push('');
    const md = L.join('\n');
    const outPath = opt.out || path.join(outDir, '_事件总索引.md');
    if (has('write')) { writeText(outPath, md); console.log('→ 已写 ' + outPath + `（${reg.events.length} 件）`); }
    else { console.log(md); console.log('\n（dry-run：加 --write 落盘到 ' + outPath + '）'); }
    return;
  }

  if (CMD === 'batch') {
    const reg = loadRegistry();
    if (!reg.events.length) die('登记表为空。先跑 scan_events.js --write');
    const noIdx = new Set((((RULES.noIndex || {}).codes) || []).map((c) => String(c).toUpperCase()));
    const selAll = opt.only
      ? String(opt.only).split(/[,，\s]+/).filter(Boolean).map((s) => s.toUpperCase())
      : reg.events.map((e) => e.code);
    // 按裁定不索引的件默认跳过（显式 --only 指定时才跑，便于临时复核）
    const skipped = selAll.filter((c) => noIdx.has(c) && !opt.only);
    const sel = selAll.filter((c) => !skipped.includes(c));
    const known = new Map(reg.events.map((e) => [e.code, e]));
    const bad = sel.filter((c) => !known.has(c));
    if (bad.length) die('登记表中无此代号：' + bad.join(', '));
    if (sel.length > Number(opt.max || 30)) die(`本次选中 ${sel.length} 件，超过 --max=${opt.max || 30} 安全上限`);
    if (skipped.length) log(`· 按裁定不索引，已跳过：${skipped.join(', ')}（见 rules.json.noIndex；如需临时跑，显式 --only ${skipped.join(',')}）`);
    log(`· 批量：${sel.length} 件（${sel.join(', ')}）｜每件跑 lint + index${has('write') ? ' 并落盘' : '（dry-run）'}`);
    const rows = [];
    for (const code of sel) {
      const e = known.get(code);
      const t0 = Date.now();
      opt._resolved = { file: e.file, entry: e };
      const cv = loadCanvas(e.file);
      const period = resolvePeriod();
      const { findings: gates } = runGates(cv, lex, period);
      const g = { error: gates.filter((x) => x.level === 'error').length, warn: gates.filter((x) => x.level === 'warn').length, info: gates.filter((x) => x.level === 'info').length };
      const terms = compileTerms(cv, lex);
      let results = {};
      let cacheHitUsed = false;
      const cacheFile = path.join(SKILL_DIR, '.cache', `${cv.title}.search.json`);
      if (fs.existsSync(cacheFile) && !has('refresh')) {
        try {
          results = JSON.parse(readText(cacheFile)).results || {};
          const miss = terms.map((t) => t.lex.id).filter((id) => !results[id]);
          cacheHitUsed = terms.length > 0 && miss.length === 0;
        } catch (err) { results = {}; }
      }
      const needTerms = terms.filter((t) => !results[t.lex.id]);
      let note = '';
      let viaLabel = 'cache';
      if (needTerms.length) {
        if (terms.length > RULES.caps.queries) { note = '超配额，未检索'; }
        else {
          let searcher = null;
          try { searcher = await makeSearcher(); } catch (err) { note = '无后端'; }
          if (searcher) {
            viaLabel = searcher.label;
            log(`  · 后端 ${searcher.label}｜补查 ${needTerms.length} 词（共 ${terms.length}）`);
            for (const t of needTerms) {
              const q = t.lex.disambig ? `${t.lex.term}+${t.lex.disambig}` : t.lex.term;
              results[t.lex.id] = await searcher.run(q);
            }
            if (searcher.flush) searcher.flush();
            writeText(cacheFile, JSON.stringify({ generatedAt: new Date().toISOString(), period, via: searcher.label, results }, null, 1));
          }
        }
      }
      const cits = loadCitations();
      const md = renderIndex(cv, period, terms, results, cits, gates, null);
      const outPath = path.join(RULES.outDir, `${code}_索引.md`);
      if (has('write') && !note) writeText(outPath, md);
      const booksN = Object.values(results).reduce((a, r) => a + (r.books || []).length, 0);
      const hitN = Object.values(results).reduce((a, r) => a + (r.total || 0), 0);
      const wrote = has('write') && !note;
      rows.push({ code, name: cv.title, period: period.label, terms: terms.length, books: booksN, hits: hitN, gates: g, wrote, out: wrote ? outPath : '', note, ms: Date.now() - t0 });
      appendHistory({ at: new Date().toISOString(), code, name: cv.title, day: e.day, date: e.date, period: period.label, periodFrom: period.fromRegistry ? 'registry' : 'rules', file: e.file, terms: terms.length, via: viaLabel, books: booksN, hits: hitN, cits: cits.length, gates: g, cacheHit: cacheHitUsed, wrote, out: wrote ? outPath : '', batch: true });
      log(`  ${code.padEnd(5)} ${String(terms.length).padStart(2)}词 取${String(booksN).padStart(3)}本/命中${String(hitN).padStart(5)}本 闸门 ${g.error}/${g.warn}/${g.info}  ${(rows[rows.length - 1].ms / 1000).toFixed(1)}s${note ? '  ⚠ ' + note : ''}`);
    }
    const L = [];
    L.push(`# 批量考证执行汇总（${new Date().toISOString().slice(0, 19).replace('T', ' ')}）`);
    L.push('');
    L.push(`本次 ${rows.length} 件${has('write') ? '，已落盘' : '（dry-run 未落盘）'}。`);
    L.push('');
    L.push('| 代号 | 时点 | 待查词 | 取回本数 | 命中总本数 | 闸门(错/警/信) | 耗时 | 索引 | 备注 |');
    L.push('|---|---|---|---|---|---|---|---|---|');
    for (const r of rows) L.push(`| \`${r.code}\` | ${r.period} | ${r.terms} | ${r.books} | ${r.hits} | ${r.gates.error}/${r.gates.warn}/${r.gates.info} | ${(r.ms / 1000).toFixed(1)}s | ${r.wrote ? '已写' : '—'} | ${r.note || ''} |`);
    const sum = { terms: rows.reduce((a, r) => a + r.terms, 0), books: rows.reduce((a, r) => a + r.books, 0), hits: rows.reduce((a, r) => a + r.hits, 0), err: rows.reduce((a, r) => a + r.gates.error, 0), warn: rows.reduce((a, r) => a + r.gates.warn, 0), info: rows.reduce((a, r) => a + r.gates.info, 0), ms: rows.reduce((a, r) => a + r.ms, 0) };
    L.push('');
    L.push(`**合计**：待查词 ${sum.terms}｜取回本数 ${sum.books}（每词上限 ${RULES.caps.booksPerQuery}）｜命中总本数 ${sum.hits}｜闸门 error ${sum.err}／warn ${sum.warn}／info ${sum.info}｜总耗时 ${(sum.ms / 1000).toFixed(1)}s`);
    const h = loadHistory();
    L.push('');
    L.push(`**累计**（history.jsonl，共 ${h.length} 次运行）：待查词 ${h.reduce((a, r) => a + (r.terms || 0), 0)}｜取回本数 ${h.reduce((a, r) => a + (r.books || 0), 0)}｜缓存命中 ${h.filter((r) => r.cacheHit).length} 次｜error 合计 ${h.reduce((a, r) => a + ((r.gates && r.gates.error) || 0), 0)}`);
    const md = L.join('\n');
    const outPath = opt.out || path.join(RULES.outDir, '_批量执行汇总.md');
    if (has('write')) { writeText(outPath, md); console.log('\n→ 汇总已写 ' + outPath); }
    else console.log('\n' + md + '\n（dry-run：汇总未落盘，加 --write）');
    process.exitCode = sum.err ? 1 : 0;
    return;
  }

  die('未知命令: ' + CMD + '（lint | index | batch | index-events | search | terms | list | lexicon | history | build-citations）');
})();
