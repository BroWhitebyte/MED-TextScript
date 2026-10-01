'use strict';
/* 抗联资料全文检索库（本机 8080）批量查询
   用法: node kanglian_search.js [--limit=200] [--scope=page|book] [--books=4] [--len=160] <查询1> [查询2] ...
   说明: 单个查询内的多词用 "+" 连接（同页/同书命中，见 scope），多个查询用多个参数（各自成组）          */
const http = require('http');

const argv = process.argv.slice(2);
const opt = { limit: 200, scope: 'page', books: 4, len: 160 };
const queries = [];
for (const a of argv) {
  const m = a.match(/^--([a-z]+)=(.*)$/);
  if (m) opt[m[1]] = m[2]; else queries.push(a);
}

const get = (p) => new Promise((res) => {
  const q = http.get({ host: '127.0.0.1', port: 8080, path: p, timeout: 60000 }, (r) => {
    let b = ''; r.on('data', (d) => (b += d)); r.on('end', () => res(b));
  });
  q.on('error', (e) => res('{"error":"' + e.message + '"}'));
  q.on('timeout', () => { q.destroy(); res('{"error":"timeout"}'); });
});

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();

(async () => {
  for (const q of queries) {
    const url = `/api/search?q=${encodeURIComponent(q)}&limit=${opt.limit}&scope=${opt.scope}`;
    const raw = await get(url);
    let j; try { j = JSON.parse(raw); } catch (e) { console.log(`\n### ${q}\n  解析失败: ${raw.slice(0, 200)}`); continue; }
    const g = (j.groups && j.groups[0]) || {};
    console.log(`\n### ${q}   —— 命中 ${g.total ?? 0} 处／${(g.books || []).length} 本书（scope=${j.scope}）`);
    for (const b of (g.books || []).slice(0, Number(opt.books))) {
      console.log(`  · ${clean(b.title).slice(0, 72)}`);
      console.log(`      ${clean(b.src_pdf).split('\\').slice(0, 3).join(' \\ ')}｜页 ${b.pages}｜本内命中 ${b.hit_count}`);
      const hits = b.hits || b.pages_hit || b.matches || [];
      for (const h of hits.slice(0, 1)) {
        const text = clean(h.text || h.snippet || h.excerpt || '');
        if (text) console.log(`      p${h.page || h.page_no || '?'}: ${text.slice(0, Number(opt.len))}`);
      }
    }
  }
  console.log('\n（检索库：D:\\抗联整理_OCR成果 — 2132 本／652,358 页／3.7 亿字）');
})();
