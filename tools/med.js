#!/usr/bin/env node
/**
 * med.js — MED 写作插件 CLI（2026-11-01）
 *
 * 六命令：
 *   node tools/med.js check [--lint]        画布与登记/索引对账（转 med_check）
 *   node tools/med.js brief <代号>          一页写作简报（转 med_brief）
 *   node tools/med.js index <代号>          生成考证索引（转 med_verify index --write）
 *   node tools/med.js query <词> [--n 3]    自由词查抗联 OCR 库（页数/书数/样本）
 *   node tools/med.js refs                  引用检查（superseded 与断链）
 *   node tools/med.js handoff               生成 docs/交接_auto.md
 */
const fs = require('fs');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');

const repo = path.resolve(__dirname, '..');
const args = process.argv.slice(3);
const run = (script, argv) => {
  const r = spawnSync(process.execPath, [path.join(repo, script), ...argv], { cwd: repo, stdio: 'inherit' });
  process.exit(r.status === null ? 1 : r.status);
};
const readTsv = (p) => {
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').trim().split(/\r?\n/).slice(1).map((l) => l.split('\t'));
};
const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
};

const cmd = process.argv[2];
switch (cmd) {
  case 'check': run('tools/med_check.js', args); break;
  case 'brief': run('tools/med_brief.js', args); break;
  case 'index': {
    const code = args[0];
    if (!code) { console.error('用法：med index <代号>'); process.exit(2); }
    run('tools/med-canvas-verify/med_verify.js', ['index', '--event', code, '--write']);
    break;
  }
  case 'query': {
    const word = args[0];
    if (!word) { console.error('用法：med query <词> [--n 3]'); process.exit(2); }
    const nIdx = args.indexOf('--n');
    const n = nIdx > -1 ? Number(args[nIdx + 1]) : 3;
    const rules = JSON.parse(fs.readFileSync(path.join(repo, 'tools/med-canvas-verify/rules.json'), 'utf8'));
    const db = rules.lib.db;
    if (!fs.existsSync(db)) { console.error(`检索库不可达：${db}`); process.exit(2); }
    const py = [
      'import sqlite3,sys',
      `db=sqlite3.connect(r"${db}")`,
      `w=sys.argv[1]`,
      `n=int(sys.argv[2])`,
      `c=db.cursor()`,
      `like=len(w)<3`,
      `q="select count(*) from pages_fts where " + ("text like ?" if like else "pages_fts match ?")`,
      `p=("%"+w+"%") if like else w`,
      `pages=c.execute(q,(p,)).fetchone()[0]`,
      `books=c.execute("select count(distinct book_id) from pages_fts where " + ("text like ?" if like else "pages_fts match ?"),(p,)).fetchone()[0]`,
      `rows=c.execute("select b.title, f.page_no, f.text from pages_fts f join books b on b.id=f.book_id where " + ("f.text like ?" if like else "pages_fts match ?") + " limit ?",(p,n)).fetchall()`,
      `print(f"页 {pages} / 书 {books}")`,
      `[print(f"  ·{t[:30]} p{pg}: …{txt[max(0,txt.find(w)-40):txt.find(w)+len(w)+60]}…".replace(chr(10)," ")) for t,pg,txt in rows]`,
    ].join('\n');
    const r = spawnSync('python', ['-X', 'utf8', '-c', py, word, String(n)], {
      encoding: 'utf8',
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });
    if (r.status !== 0) { console.error(r.stderr || '查询失败'); process.exit(1); }
    console.log(`### ${word}`);
    console.log(r.stdout.trim());
    break;
  }
  case 'refs': {
    const status = readTsv(path.join(repo, 'canon/status.tsv'));
    const sup = status.filter((r) => r[2] === 'superseded');
    const ids = new Set(status.map((r) => r[0]));
    const dirs = ['docs', 'MED_Demo Rule', 'MED_考证索引', 'MEDSystem'].map((d) => path.join(repo, d));
    const files = dirs.flatMap((d) => walk(d));
    let hits = 0, refCount = 0, broken = 0;
    for (const s of sup) {
      const refs = [];
      for (const f of files) {
        const txt = fs.readFileSync(f, 'utf8');
        if (!txt.includes(s[0])) continue;
        const lines = txt.split(/\r?\n/);
        lines.forEach((l, i) => { if (l.includes(s[0])) refs.push(`${path.relative(repo, f)}:${i + 1}`); });
      }
      if (refs.length) {
        hits++;
        refCount += refs.length;
        console.log(`[superseded] ${s[0]}${s[6] ? ' → ' + s[6] : ''}`);
        for (const r of refs) console.log(`  ${r}`);
      }
    }
    console.log(`\nsuperseded 对象 ${sup.length}，有引用的 ${hits}，引用位置合计 ${refCount}`);
    // 断链：status.tsv 里的 id 在 docs 里一次都没出现（仅供参考）
    for (const r of status) {
      const id = r[0];
      if (!id || id.startsWith('Q-') || id.startsWith('C-')) continue;
      const seen = files.some((f) => fs.readFileSync(f, 'utf8').includes(id));
      if (!seen) { console.log(`[孤立] ${id}（status.tsv 有，文档未引用）`); broken++; }
    }
    console.log(`孤立条目 ${broken}`);
    break;
  }
  case 'handoff': {
    const status = readTsv(path.join(repo, 'canon/status.tsv'));
    const tl = readTsv(path.join(repo, 'canon/timeline.tsv'));
    let log = '';
    try { log = execFileSync('git', ['log', '-6', '--oneline'], { cwd: repo, encoding: 'utf8' }); } catch (e) { log = '（git 不可用）'; }
    const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
    const by = (st) => status.filter((r) => r[2] === st);
    const out = [
      '# 交接（自动生成部分）',
      '',
      `> 生成：${new Date().toISOString().slice(0, 16).replace('T', ' ')}｜HEAD \`${head}\`｜本文件由 \`med handoff\` 覆盖，人工内容写 \`docs/交接.md\`。`,
      '',
      '## 阻塞',
      '',
      '| id | 事项 | owner | next |',
      '|---|---|---|---|',
      ...by('blocked').map((r) => `| ${r[0]} | ${r[7] || ''} | ${r[3] || ''} | ${r[4] || ''} |`),
      '',
      '## 进行中 / 待办',
      '',
      '| id | 状态 | 事项 | next |',
      '|---|---|---|---|',
      ...[...by('active'), ...by('pending')].map((r) => `| ${r[0]} | ${r[2]} | ${r[7] || ''} | ${r[4] || ''} |`),
      '',
      '## 节点时间线',
      '',
      '| 日期 | 农历 | 节点 | 状态 |',
      '|---|---|---|---|',
      ...tl.map((c) => `| ${c[0]} | ${c[1]} | ${c[4] || ''} | ${c[5] || ''} |`),
      '',
      '## 最近提交',
      '',
      '```',
      log.trim(),
      '```',
      '',
    ].join('\n');
    const p = path.join(repo, 'docs', '交接_auto.md');
    fs.writeFileSync(p, out);
    console.log(`已写入 ${path.relative(repo, p)}（阻塞 ${by('blocked').length}，进行中 ${by('active').length + by('pending').length}）`);
    break;
  }
  default:
    console.log('用法：node tools/med.js <check|brief|index|query|refs|handoff> [参数]');
    process.exit(2);
}
