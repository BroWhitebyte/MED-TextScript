/* Imagery Hints v0.3 —— 意象线性序列（引用式）
 *
 * 核心：正文只在 body / turns 里存一份；sequence 只存顺序与引用（第几段）+ 指纹。
 *       冲突 = 指纹不符（引用漂移），只冻结出问题的卡，不冻结画布。
 *
 * 数据：
 *   customFields.sequence = [
 *     { t:'visual'|'sound'|'effect'|'mood', text:'…' },
 *     { t:'para', i:0, fp:'前8|后8|长度' },      // Content/Choice/End
 *     { t:'turn', i:1, fp:'…' }                  // Dialog
 *   ]
 *   customFields.sequenceVersion = 1
 *
 * 闸：① 检出即锁（有漂移的卡禁止写 body）② 写前留底 ③ 撤销贯通
 */

const { Plugin, Menu, Modal, Notice } = require('obsidian');

const VIEW_TYPE_GRAPH = 'narrative-graph-view';
const STATUS_CLASS = 'ih-status';

const KINDS = [
  { key: 'visual', label: '画面', cls: 'ih-visual' },
  { key: 'sound', label: '声音', cls: 'ih-sound' },
  { key: 'effect', label: '效果', cls: 'ih-effect' },
  { key: 'mood', label: '情绪', cls: 'ih-mood' },
];
const IMAGERY_KEYS = KINDS.map((k) => k.key);
const KIND_MAP = new Map(KINDS.map((k) => [k.key, k]));
const BLOCK_TYPES = ['visual', 'sound', 'effect', 'mood', 'para', 'turn'];
const SUPPORTED_TYPES = new Set(['Entry', 'Content', 'Dialog', 'Choice', 'End']);
/* Entry 只挂意象（开场演出用），不写正文块——body 是"Adventure Begins"占位，不参与叙事 */
const NO_BODY_TYPES = new Set(['Entry']);

const BLOCK_LABEL = {
  visual: '画面', sound: '声音', effect: '效果', mood: '情绪',
  para: '正文', turn: '对话',
};

/* ─────────────────────── 纯函数：切分 / 指纹 / 取值 ─────────────────────── */

function toArr(v) {
  if (Array.isArray(v)) return v.map((x) => String(x == null ? '' : x)).filter((s) => s.trim() !== '');
  if (typeof v === 'string') return v.trim() ? [v] : [];
  return [];
}

/** body → 段落数组（按空行切，去空段） */
function splitParas(body) {
  return String(body || '')
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s !== '');
}
function joinParas(arr) {
  return arr.join('\n\n');
}

/** 指纹：前 8 字 | 后 8 字 | 字数（按码点计） */
function fpOf(text) {
  const t = String(text == null ? '' : text).trim();
  if (!t) return '||0';
  const a = Array.from(t);
  return a.slice(0, 8).join('') + '|' + a.slice(-8).join('') + '|' + a.length;
}

function turnText(t) {
  return String((t && t.line) || '');
}

/** 取第 i 轮的说话人 */
function speakerOf(node, i) {
  if (!node || node.type !== 'Dialog') return '';
  const t = (Array.isArray(node.turns) ? node.turns : [])[i];
  return String((t && t.speaker) || '').trim();
}

/** 显示用：对话轮 → 「说话人：台词」；正文 → 该段原文 */
function displayUnit(node, i) {
  if (!Number.isInteger(i) || i < 0) return null;
  if (node && node.type === 'Dialog') {
    const arr = Array.isArray(node.turns) ? node.turns : [];
    const t = arr[i];
    if (!t) return null;
    const sp = String(t.speaker || '').trim();
    const line = String(t.line || '');
    return sp ? sp + '：' + line : line;
  }
  const paras = splitParas(node && node.body);
  return paras[i] == null ? null : paras[i];
}

/** 取当前段/轮的文本列表 */
function unitsOf(node) {
  if (!node) return [];
  if (node.type === 'Dialog') return (Array.isArray(node.turns) ? node.turns : []).map(turnText);
  return splitParas(node.body);
}

function imageryOf(node) {
  const cf = node && node.customFields;
  if (!cf || typeof cf !== 'object') return null;
  const im = cf.imagery;
  return im && typeof im === 'object' ? im : null;
}

function seqOf(node) {
  const cf = node && node.customFields;
  if (!cf || typeof cf !== 'object') return null;
  return Array.isArray(cf.sequence) ? cf.sequence : null;
}

function ensureSeq(node) {
  if (!node.customFields || typeof node.customFields !== 'object') node.customFields = {};
  const cf = node.customFields;
  if (!Array.isArray(cf.sequence)) cf.sequence = [];
  cf.sequenceVersion = 1;
  return cf.sequence;
}

/** 写时复制：任何"要改序列"的操作前先调这个。
 *  若还没有真序列，则把当前显示的虚拟序列（旧 imagery + 正文段）整份落盘，
 *  避免直接 ensureSeq 造出空数组、把原有内容"覆盖没了"。 */
function materializeSeq(node) {
  const cur = seqOf(node);
  if (cur && cur.length) return cur;
  const vs = virtualSeq(node);
  if (!node.customFields || typeof node.customFields !== 'object') node.customFields = {};
  node.customFields.sequence = JSON.parse(JSON.stringify(vs || []));
  node.customFields.sequenceVersion = 1;
  return node.customFields.sequence;
}

/** 旧数据 → 虚拟序列（不落盘，仅用于显示） */
function virtualSeq(node) {
  const blocks = [];
  const im = imageryOf(node) || {};
  for (const k of IMAGERY_KEYS) {
    for (const text of toArr(im[k])) blocks.push({ t: k, text });
  }
  if (node.type === 'Dialog') {
    (Array.isArray(node.turns) ? node.turns : []).forEach((t, i) => blocks.push({ t: 'turn', i, fp: fpOf(turnText(t)) }));
  } else if (!NO_BODY_TYPES.has(node.type)) {
    splitParas(node.body).forEach((p, i) => blocks.push({ t: 'para', i, fp: fpOf(p) }));
  }
  return blocks;
}

/** 显示用序列：有真序列用真序列，否则用虚拟序列 */
function displaySeq(node) {
  const s = seqOf(node);
  return s && s.length ? s : virtualSeq(node);
}

/** 漂移检测：返回 [{idx, block, expected, actual}] */
function detectDrift(node) {
  const seq = seqOf(node);
  if (!seq || !seq.length) return [];
  const units = unitsOf(node);
  const out = [];
  seq.forEach((blk, idx) => {
    if (!blk) return;
    if (blk.t !== 'para' && blk.t !== 'turn') return;
    const i = Number(blk.i);
    if (!Number.isInteger(i) || i < 0 || i >= units.length) {
      out.push({ idx, block: blk, expected: blk.fp, actual: '(该段已不存在)', code: 'missing' });
      return;
    }
    const actual = fpOf(units[i]);
    if (actual !== blk.fp) out.push({ idx, block: blk, expected: blk.fp, actual, code: 'changed', text: units[i] });
  });
  return out;
}

/* ─────────────────────── 视图/数据访问 ─────────────────────── */

function getGraphViews(app) {
  return app.workspace.getLeavesOfType(VIEW_TYPE_GRAPH).map((l) => l && l.view).filter((v) => v && v._state && v._state.project);
}
function getGraphView(app) {
  const vs = getGraphViews(app);
  return vs.length ? vs[0] : null;
}
function nodesOf(view) {
  const p = view && view._state && view._state.project;
  return p && Array.isArray(p.nodes) ? p.nodes : [];
}
function findNode(view, id) {
  return nodesOf(view).find((n) => n && n.id === id) || null;
}
function fileOfView(view) {
  try {
    return view.file ? view.file.path : (view._file && view._file.path) || '';
  } catch (e) {
    return '';
  }
}
function commit(view) {
  try {
    if (typeof view._afterMutation === 'function') view._afterMutation();
    else if (typeof view.requestSave === 'function') view.requestSave();
    else if (typeof view.scheduleSave === 'function') view.scheduleSave();
  } catch (e) {
    console.error('[imagery-hints] 保存失败', e);
  }
}

/* ───────────────────────────── 插件 ───────────────────────────── */

module.exports = class ImageryHintsPlugin extends Plugin {
  async onload() {
    this.undoStack = [];
    this.collapsed = new Set();
    this.rafPending = false;
    this.conflicts = [];        // {file, nodeId, type, idx, expected, actual, text}
    this.ignored = (await this.loadData()) || {};  // key → {fp}
    this.ignored = this.ignored.ignored || this.ignored;

    this.statusEl = this.addStatusBarItem();
    this.statusEl.addClass(STATUS_CLASS);
    this.statusEl.style.cursor = 'pointer';
    this.statusEl.style.display = 'none';
    this.statusEl.addEventListener('click', () => this.openConflictModal());
    this.renderStatus();

    this.addCommand({ id: 'open-menu', name: '意象：为当前节点新建/编辑', callback: () => this.openMenuForActiveNode() });
    this.addCommand({ id: 'undo-delete', name: '意象：撤销上次删除', hotkeys: [{ modifiers: ['Mod', 'Alt'], key: 'Z' }], callback: () => this.undo() });
    this.addCommand({ id: 'toggle-collapse', name: '意象：收起 / 展开全部', callback: () => this.toggleAllCollapsed() });
    this.addCommand({ id: 'check-conflicts', name: '意象：检查引用漂移', callback: () => { this.checkAll(); this.openConflictModal(); } });
    this.addCommand({ id: 'only-ignored', name: '意象：只看已忽略的冲突', callback: () => this.openConflictModal(true) });

    this.registerDomEvent(window, 'contextmenu', (ev) => this.handleContextMenu(ev), { capture: true });
    this.registerEvent(this.app.workspace.on('layout-change', () => { this.scheduleScan(); this.scheduleCheck(); }));
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => { this.scheduleScan(); this.scheduleCheck(); }));
    this.registerEvent(this.app.vault.on('modify', (f) => {
      if (!f || !/\.ncanvas$/i.test(f.path)) return;
      this.scheduleScan();
      this.scheduleCheck();
    }));

    this.scheduleScan();
    this.scheduleCheck();
  }

  onunload() {
    document.querySelectorAll('.ih-block, .ih-add, .ih-optline').forEach((el) => el.remove());
    if (this.statusEl) this.statusEl.remove();
  }

  /* ── 状态栏 ── */

  renderStatus() {
    const active = new Set();
    const other = new Set();
    const curFile = fileOfView(getGraphView(this.app));
    for (const c of this.conflicts) {
      if (c.file === curFile) active.add(c.file + c.nodeId + c.idx);
      else other.add(c.file + c.nodeId + c.idx);
    }
    const n = active.size;
    const m = other.size;
    if (!n && !m) {
      this.statusEl.style.display = 'none';
      this.statusEl.setText('');
      return;
    }
    this.statusEl.style.display = '';
    const parts = [];
    if (n) parts.push('⚠ 引用漂移 ' + n);
    if (m) parts.push('+' + m + ' 其他文件');
    this.statusEl.setText(parts.join(' '));
    this.statusEl.title = '点击查看引用漂移清单';
  }

  /* ── 扫描与渲染 ── */

  scheduleScan() {
    if (this.rafPending) return;
    this.rafPending = true;
    window.requestAnimationFrame(() => {
      this.rafPending = false;
      this.scan();
    });
  }

  scan() {
    const views = getGraphViews(this.app);
    for (const view of views) {
      const root = view.containerEl;
      if (!root) continue;
      if (!view.__ihObserver) {
        view.__ihObserver = new MutationObserver(() => this.scheduleScan());
        view.__ihObserver.observe(root, { childList: true, subtree: true });
        this.register(() => view.__ihObserver && view.__ihObserver.disconnect());
      }
      const byId = new Map(nodesOf(view).map((n) => [n.id, n]));
      for (const el of root.querySelectorAll('.ng-node[data-node-id]')) {
        const node = byId.get(el.dataset.nodeId);
        if (node) this.decorateCard(el, node);
      }
    }
    this.renderStatus();
  }

  nodeDrift(node) {
    return detectDrift(node);
  }

  decorateCard(el, node) {
    /* ＋ 按钮 */
    const header = el.querySelector('.ng-node__header');
    if (header && SUPPORTED_TYPES.has(node.type) && !header.querySelector('.ih-add')) {
      const btn = document.createElement('button');
      btn.className = 'ih-add';
      btn.type = 'button';
      btn.textContent = '＋';
      btn.title = '新建意象 / 插入块';
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        this.openMenu(node.id, null, btn.getBoundingClientRect());
      });
      header.appendChild(btn);
    }

    /* 冲突红点 */
    const drift = this.nodeDrift(node);
    if (header) {
      const old = header.querySelector('.ih-dot');
      if (drift.length && !old) {
        const dot = document.createElement('span');
        dot.className = 'ih-dot';
        dot.textContent = '●';
        dot.title = drift.length + ' 条引用漂移未处理';
        header.appendChild(dot);
      } else if (!drift.length && old) old.remove();
    }

    const body = el.querySelector('.ng-node__body') || el;
    const seq = displaySeq(node);
    const sig = JSON.stringify(seq) + '|' + (this.collapsed.has(node.id) ? 'c' : 'e') + '|' + drift.length + '|' + JSON.stringify(unitsOf(node));
    const existing = body.querySelector(':scope > .ih-block');

    if (!seq || !seq.length) {
      if (existing) existing.remove();
    } else if (existing) {
      if (existing.dataset.ihSig !== sig) this.renderBlock(existing, node, seq, drift);
    } else {
      const block = document.createElement('div');
      block.className = 'ih-block';
      body.appendChild(block);
      this.renderBlock(block, node, seq, drift);
    }

    /* Choice 选项级数值 */
    const im = imageryOf(node);
    if (node.type === 'Choice' && im && im.optionNumeric && typeof im.optionNumeric === 'object') {
      for (const optEl of el.querySelectorAll('.ng-node__option[data-option-id]')) {
        const oid = optEl.dataset.optionId;
        const arr = toArr(im.optionNumeric[oid]);
        const old = optEl.querySelector('.ih-optline');
        if (!arr.length) {
          if (old) old.remove();
          continue;
        }
        const text = arr.join(' · ');
        if (old) {
          if (old.textContent !== text) old.textContent = text;
        } else {
          const line = document.createElement('div');
          line.className = 'ih-optline';
          line.textContent = text;
          line.title = '选项数值意象（双击编辑）';
          line.addEventListener('dblclick', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            this.editOptionNumeric(node, oid);
          });
          optEl.appendChild(line);
        }
      }
    }
  }

  renderBlock(block, node, seq, drift) {
    const units = unitsOf(node);
    block.textContent = '';
    block.dataset.ihSig =
      JSON.stringify(seq) + '|' + (this.collapsed.has(node.id) ? 'c' : 'e') + '|' + drift.length + '|' + JSON.stringify(units);
    block.classList.toggle('ih-collapsed', this.collapsed.has(node.id));

    const head = document.createElement('div');
    head.className = 'ih-block__head';
    head.textContent = (this.collapsed.has(node.id) ? '意象 ▸' : '意象 ▾') + (drift.length ? ' · 漂移 ' + drift.length : '');
    head.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (this.collapsed.has(node.id)) this.collapsed.delete(node.id);
      else this.collapsed.add(node.id);
      this.scan();
    });
    block.appendChild(head);

    /* 块序列 */
    seq.forEach((blk, idx) => {
      block.appendChild(this.renderGap(node, seq, idx));
      block.appendChild(this.renderSeqBlock(node, seq, blk, idx, units, drift));
    });
    block.appendChild(this.renderGap(node, seq, seq.length, true));

    /* 卡级数值（不进序列） */
    const im = imageryOf(node);
    if (im && Object.prototype.hasOwnProperty.call(im, 'numeric')) {
      block.appendChild(this.renderNumericRow(node, im));
    }
  }

  renderSeqBlock(node, seq, blk, idx, units, drift) {
    const t = blk && blk.t;
    const row = document.createElement('div');
    const kind = KIND_MAP.get(t);
    row.className = 'ih-row ' + (kind ? kind.cls : t === 'para' ? 'ih-para' : 'ih-turn');
    row.dataset.ihBlock = String(idx);

    const tag = document.createElement('span');
    tag.className = 'ih-tag';

    const body = document.createElement('span');
    body.className = 'ih-text';

    if (kind) {
      /* 意象块 */
      tag.textContent = kind.label;
      body.textContent = String(blk.text || '') || '（空）';
      if (!blk.text) body.classList.add('ih-empty');
      row.title = '双击编辑 · 右键删除/上下移';
      row.addEventListener('dblclick', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        this.editImageryBlock(node, idx);
      });
    } else if (t === 'para' || t === 'turn') {
      const i = Number(blk.i);
      const text = Number.isInteger(i) && units[i] != null ? units[i] : null;
      const bad = drift.some((d) => d.idx === idx);
      if (t === 'turn') {
        row.classList.add('ih-turn-row');
        const sp = Number.isInteger(i) ? speakerOf(node, i) : '';
        tag.textContent = sp || '旁白';
      } else {
        tag.textContent = '正文';
      }
      if (text == null) {
        body.textContent = t === 'turn' ? '（该轮已不存在 · 未挂接）' : '（该段已不存在 · 未挂接）';
        body.classList.add('ih-empty', 'ih-orphan');
        row.classList.add('ih-row--orphan');
      } else {
        body.textContent = text;
      }
      if (bad) {
        row.classList.add('ih-row--drift');
        const mark = document.createElement('span');
        mark.className = 'ih-drift';
        mark.textContent = '漂移';
        mark.title = '该段指纹与序列不符，正文可能被外部改过';
        mark.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          this.openConflictModal();
        });
        row.appendChild(mark);
      }
      row.title = '双击编辑这段正文';
      row.addEventListener('dblclick', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        this.editUnit(node, Number(blk.i));
      });
    } else {
      tag.textContent = String(t || '?');
      body.textContent = '（未知块类型）';
      body.classList.add('ih-empty');
    }

    row.insertBefore(tag, row.firstChild);
    row.insertBefore(body, tag.nextSibling);

    row.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      this.openBlockMenu(node, idx, ev);
    });
    return row;
  }

  renderGap(node, seq, at, last) {
    const gap = document.createElement('div');
    gap.className = 'ih-gap';
    const btn = document.createElement('button');
    btn.className = 'ih-gap__btn';
    btn.type = 'button';
    btn.textContent = '＋';
    btn.title = '在此插入一块';
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      this.openInsertMenu(node, at, btn.getBoundingClientRect());
    });
    gap.appendChild(btn);
    return gap;
  }

  renderNumericRow(node, im) {
    const arr = toArr(im.numeric);
    const row = document.createElement('div');
    row.className = 'ih-row ih-numeric';
    const tag = document.createElement('span');
    tag.className = 'ih-tag';
    tag.textContent = '数值';
    row.appendChild(tag);
    const body = document.createElement('span');
    body.className = 'ih-text';
    if (!arr.length) {
      body.textContent = '（空）';
      body.classList.add('ih-empty');
    } else {
      arr.forEach((v, i) => {
        if (i) {
          const sep = document.createElement('span');
          sep.className = 'ih-sep';
          sep.textContent = '·';
          body.appendChild(sep);
        }
        const chip = document.createElement('span');
        chip.className = 'ih-chip';
        chip.textContent = v;
        body.appendChild(chip);
      });
    }
    row.appendChild(body);
    row.title = '卡级数值（不进序列）· 右键编辑';
    row.addEventListener('dblclick', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      this.editNumeric(node);
    });
    row.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      this.openNumericMenu(node, ev);
    });
    return row;
  }

  /* ── 冲突检测 ── */

  scheduleCheck() {
    if (this.checkTimer) window.clearTimeout(this.checkTimer);
    this.checkTimer = window.setTimeout(() => this.checkAll(), 450);
  }

  ignoreKey(file, nodeId, idx) {
    return file + '::' + nodeId + '::' + idx;
  }

  checkAll() {
    const all = [];
    for (const view of getGraphViews(this.app)) {
      const file = fileOfView(view);
      for (const node of nodesOf(view)) {
        if (!SUPPORTED_TYPES.has(node.type)) continue;
        const drift = detectDrift(node);
        if (!drift.length) continue;
        const units = unitsOf(node);
        for (const d of drift) {
          const actualFp = Number.isInteger(Number(d.block.i)) && units[Number(d.block.i)] != null ? fpOf(units[Number(d.block.i)]) : '(none)';
          const key = this.ignoreKey(file, node.id, d.idx);
          const ig = this.ignored[key];
          if (ig && ig.fp === actualFp) continue; /* 已忽略且正文未再变 */
          all.push({ file, nodeId: node.id, type: node.type, idx: d.idx, expected: d.expected, actual: actualFp, text: d.text || '', key, actualFp });
        }
      }
    }
    this.conflicts = all;
    this.renderStatus();
    this.scheduleScan();
  }

  async saveIgnored() {
    await this.saveData({ ignored: this.ignored });
  }

  /* ── 冲突清单 ── */

  openConflictModal(onlyIgnored) {
    new ConflictModal(this, onlyIgnored).open();
  }

  /* ── 右键菜单 ── */

  handleContextMenu(ev) {
    const target = ev.target;
    if (!(target instanceof Element)) return;
    if (target.closest('.ih-row, .ih-chip, .ih-gap, .ih-block, .ih-add, .ih-optline, .ih-dot')) return;

    const cardEl = target.closest('.ng-node[data-node-id]');
    if (!cardEl) return;
    const view = getGraphViews(this.app).find((v) => v.containerEl && v.containerEl.contains(cardEl));
    if (!view) return;
    const node = findNode(view, cardEl.dataset.nodeId);
    if (!node || !SUPPORTED_TYPES.has(node.type)) return;

    const optEl = target.closest('.ng-node__option[data-option-id]');
    ev.preventDefault();
    ev.stopPropagation();
    this.openMenu(node.id, optEl ? optEl.dataset.optionId : null, null, ev);
  }

  openMenu(nodeId, optionId, rect, evt) {
    const view = getGraphViews(this.app).find((v) => findNode(v, nodeId));
    const node = view && findNode(view, nodeId);
    if (!node) return;
    const menu = new Menu();
    const seq = displaySeq(node);
    const drift = detectDrift(node);

    if (optionId) {
      const im = imageryOf(node) || {};
      const arr = toArr((im.optionNumeric || {})[optionId]);
      const label = Array.isArray(node.choiceOptions)
        ? (node.choiceOptions.find((o) => o && o.id === optionId) || {}).label
        : '';
      menu.addItem((i) => i.setTitle('选项：' + (label || optionId)).setDisabled(true));
      menu.addItem((i) => i.setTitle((arr.length ? '编辑' : '新建') + '本选项数值意象…').setIcon('plus').onClick(() => this.editOptionNumeric(node, optionId)));
      if (arr.length) menu.addItem((i) => i.setTitle('删除本选项数值意象').setIcon('trash').onClick(() => this.deleteOptionNumeric(node, optionId)));
      this.showMenu(menu, rect, evt);
      return;
    }

    menu.addItem((i) => i.setTitle('在末尾追加').setDisabled(true));
    for (const k of KINDS) {
      menu.addItem((i) => i.setTitle(k.label).setIcon('plus').onClick(() => this.addImageryBlock(node, k.key, seq.length)));
    }
    if (node.type === 'Dialog') {
      menu.addItem((i) => i.setTitle('对话轮').setIcon('message-square').onClick(() => this.addTurnBlock(node, seq.length)));
    } else if (!NO_BODY_TYPES.has(node.type)) {
      menu.addItem((i) => i.setTitle('正文段').setIcon('paragraph').onClick(() => this.addParaBlock(node, seq.length)));
    }
    menu.addItem((i) =>
      i
        .setTitle('数值（卡级 · 不进序列）…')
        .setIcon('hash')
        .onClick(() => this.editNumeric(node))
    );

    menu.addSeparator();
    menu.addItem((i) => i.setTitle('编辑全部意象…').setIcon('edit').onClick(() => new ImageryModal(this, node).open()));
    menu.addItem((i) => i.setTitle(this.collapsed.has(node.id) ? '展开本卡' : '收起本卡').setIcon('chevrons-down').onClick(() => {
      if (this.collapsed.has(node.id)) this.collapsed.delete(node.id);
      else this.collapsed.add(node.id);
      this.scan();
    }));

    if (drift.length) {
      menu.addSeparator();
      menu.addItem((i) => i.setTitle('⚠ 本卡有 ' + drift.length + ' 条引用漂移').setIcon('alert-triangle').onClick(() => this.openConflictModal()));
      menu.addItem((i) => i.setTitle('重新挂接引用').setIcon('link').onClick(() => this.realignNode(node)));
    }

    menu.addSeparator();
    menu.addItem((i) => i.setTitle('转成线性序列（写入文件）').setIcon('list').onClick(() => this.materialize(node)));
    menu.addItem((i) => i.setTitle('清空本卡意象').setIcon('trash').onClick(() => this.clearCard(node)));

    if (this.undoStack.length) {
      menu.addItem((i) => i.setTitle('撤销上次操作').setIcon('undo').onClick(() => this.undo()));
    }
    this.showMenu(menu, rect, evt);
  }

  openInsertMenu(node, at, rect) {
    const menu = new Menu();
    menu.addItem((i) => i.setTitle('在此插入').setDisabled(true));
    for (const k of KINDS) {
      menu.addItem((i) => i.setTitle(k.label).setIcon('plus').onClick(() => this.addImageryBlock(node, k.key, at)));
    }
    if (node.type === 'Dialog') {
      menu.addItem((i) => i.setTitle('对话轮').setIcon('message-square').onClick(() => this.addTurnBlock(node, at)));
    } else if (!NO_BODY_TYPES.has(node.type)) {
      menu.addItem((i) => i.setTitle('正文段').setIcon('paragraph').onClick(() => this.addParaBlock(node, at)));
    }
    if (!NO_BODY_TYPES.has(node.type)) {
      menu.addItem((i) =>
        i
          .setTitle(node.type === 'Dialog' ? '引用已有对话轮…' : '引用已有正文段…')
          .setIcon('link')
          .onClick(() => this.pickExistingUnit(node, at))
      );
    }
    this.showMenu(menu, rect, null);
  }

  openBlockMenu(node, idx, ev) {
    const seq = displaySeq(node);
    const blk = seq[idx];
    if (!blk) return;
    const kind = KIND_MAP.get(blk.t);
    const menu = new Menu();
    menu.addItem((i) => i.setTitle((kind ? kind.label : BLOCK_LABEL[blk.t] || blk.t) + ' · 第 ' + (idx + 1) + ' 块').setDisabled(true));

    if (kind) {
      menu.addItem((i) => i.setTitle('编辑').setIcon('edit').onClick(() => this.editImageryBlock(node, idx)));
      menu.addItem((i) => i.setTitle('上移').setIcon('arrow-up').onClick(() => this.moveBlock(node, idx, -1)));
      menu.addItem((i) => i.setTitle('下移').setIcon('arrow-down').onClick(() => this.moveBlock(node, idx, 1)));
      menu.addItem((i) => i.setTitle('删除这一块').setIcon('trash').onClick(() => this.deleteBlock(node, idx)));
    } else if (blk.t === 'para' || blk.t === 'turn') {
      menu.addItem((i) => i.setTitle('编辑这段正文').setIcon('edit').onClick(() => this.editUnit(node, Number(blk.i))));
      menu.addItem((i) => i.setTitle('删除这条引用（不动正文）').setIcon('unlink').onClick(() => this.deleteBlock(node, idx)));
    }
    menu.addSeparator();
    menu.addItem((i) => i.setTitle('在本块之前插入').setIcon('plus').onClick(() => this.openInsertMenu(node, idx, null)));
    this.showMenu(menu, null, ev);
  }

  openNumericMenu(node, ev) {
    const menu = new Menu();
    menu.addItem((i) => i.setTitle('数值意象（卡级）').setDisabled(true));
    menu.addItem((i) => i.setTitle('编辑数值…').setIcon('edit').onClick(() => this.editNumeric(node)));
    menu.addItem((i) => i.setTitle('清空数值').setIcon('trash').onClick(() => this.clearNumeric(node)));
    this.showMenu(menu, null, ev);
  }

  showMenu(menu, rect, evt) {
    if (evt) menu.showAtMouseEvent(evt);
    else if (rect) menu.showAtPosition({ x: rect.left, y: rect.bottom + 4 });
    else menu.showAtPosition({ x: 200, y: 200 });
  }

  openMenuForActiveNode() {
    const view = getGraphView(this.app);
    if (!view) {
      new Notice('请先打开一个 .ncanvas 画布');
      return;
    }
    let id = null;
    const sel = view._selection || view.selection;
    if (sel && typeof sel === 'object') {
      if (typeof sel.nodeId === 'string') id = sel.nodeId;
      else if (sel.nodes && sel.nodes.size) id = [...sel.nodes][0];
      else if (Array.isArray(sel.nodes) && sel.nodes.length) id = sel.nodes[0];
    }
    if (!id) id = view._state && view._state.ui && view._state.ui.selectedNodeId;
    if (!id) {
      new Notice('先在画布上选中一个节点');
      return;
    }
    this.openMenu(id, null, null);
  }

  /* ── 写入辅助（闸 1 / 闸 2 / 闸 3） ── */

  guardBodyWrite(node) {
    const drift = detectDrift(node);
    if (drift.length) {
      new Notice('本卡有 ' + drift.length + ' 条引用漂移，已锁定正文写入。请先处理漂移。', 7000);
      this.openConflictModal();
      return false;
    }
    return true;
  }

  backupBody(node, view) {
    if (!node.customFields || typeof node.customFields !== 'object') node.customFields = {};
    node.customFields._bodyBackup = {
      body: node.body == null ? null : String(node.body),
      turns: Array.isArray(node.turns) ? JSON.parse(JSON.stringify(node.turns)) : null,
      at: new Date().toISOString(),
      by: 'imagery-hints',
    };
  }

  pushUndo(node, label) {
    this.undoStack.push({
      nodeId: node.id,
      label,
      body: node.body == null ? null : String(node.body),
      turns: Array.isArray(node.turns) ? JSON.parse(JSON.stringify(node.turns)) : null,
      seq: seqOf(node) ? JSON.parse(JSON.stringify(seqOf(node))) : null,
      imagery: imageryOf(node) ? JSON.parse(JSON.stringify(imageryOf(node))) : null,
    });
    if (this.undoStack.length > 40) this.undoStack.shift();
  }

  undo() {
    const item = this.undoStack.pop();
    if (!item) {
      new Notice('没有可撤销的操作');
      return;
    }
    const view = getGraphViews(this.app).find((v) => findNode(v, item.nodeId));
    const node = view && findNode(view, item.nodeId);
    if (!node) {
      new Notice('节点不在当前画布，无法撤销');
      return;
    }
    node.body = item.body;
    if (item.turns) node.turns = item.turns;
    if (!node.customFields || typeof node.customFields !== 'object') node.customFields = {};
    if (item.seq) node.customFields.sequence = item.seq;
    else delete node.customFields.sequence;
    if (item.imagery) node.customFields.imagery = item.imagery;
    else delete node.customFields.imagery;
    node.customFields.sequenceVersion = 1;
    commit(view);
    this.scan();
    new Notice('已撤销：' + item.label);
  }

  /* ── 块操作 ── */

  materialize(node) {
    const view = getGraphViews(this.app).find((v) => findNode(v, node.id));
    const seq = displaySeq(node);
    if (!seq.length) {
      new Notice('本卡没有可转成序列的内容');
      return;
    }
    this.pushUndo(node, '转成线性序列');
    const cf = node.customFields && typeof node.customFields === 'object' ? node.customFields : (node.customFields = {});
    cf.sequence = JSON.parse(JSON.stringify(seq));
    cf.sequenceVersion = 1;
    commit(view);
    this.scan();
    new Notice('已转成线性序列（' + seq.length + ' 块）');
  }

  addImageryBlock(node, key, at) {
    const view = getGraphViews(this.app).find((v) => findNode(v, node.id));
    const kind = KIND_MAP.get(key);
    new TextModal(this, {
      title: kind.label + '（新建）',
      placeholder: '写这一屏的' + kind.label + '…',
      onSave: (text) => {
        const t = String(text).trim();
        if (!t) return;
        this.pushUndo(node, '新建' + kind.label);
        const seq = materializeSeq(node);
        const idx = Math.max(0, Math.min(at, seq.length));
        seq.splice(idx, 0, { t: key, text: t });
        commit(view);
        this.scan();
      },
    }).open();
  }

  /** 新建对话轮：写进 turns，并在序列里加一条 turn 引用（插在「前面最近的对话块」之后） */
  addTurnBlock(node, at) {
    if (node.type !== 'Dialog') return this.addParaBlock(node, at);
    if (!this.guardBodyWrite(node)) return;
    const seqNow = displaySeq(node) || [];
    const seqAt = Math.max(0, Math.min(at, seqNow.length));
    new TurnModal(this, {
      title: '新建对话轮',
      speaker: '',
      line: '',
      onSave: (speaker, line) => {
        const l = String(line || '').trim();
        if (!l) {
          new Notice('台词为空，未创建');
          return;
        }
        const view = getGraphViews(this.app).find((v) => findNode(v, node.id));
        this.pushUndo(node, '新建对话轮');
        this.backupBody(node, view);
        if (!Array.isArray(node.turns)) node.turns = [];
        const seq = materializeSeq(node);
        let insertAt = 0;
        for (let k = seqAt - 1; k >= 0; k--) {
          const b = seq[k];
          if (b && b.t === 'turn' && Number.isInteger(Number(b.i))) {
            insertAt = Number(b.i) + 1;
            break;
          }
        }
        const sp = String(speaker || '').trim();
        node.turns.splice(insertAt, 0, sp ? { speaker: sp, line: l } : { line: l });
        for (const b of seq) {
          if (b && b.t === 'turn' && Number(b.i) >= insertAt) b.i = Number(b.i) + 1;
        }
        seq.splice(seqAt, 0, { t: 'turn', i: insertAt, fp: fpOf(l) });
        commit(view);
        this.scan();
        this.scheduleCheck();
      },
    }).open();
  }

  /** 插入正文段：写进 body，规则＝插在「前面最近的正文块」之后 */
  addParaBlock(node, at) {
    if (node.type === 'Dialog') return this.addTurnBlock(node, at);
    if (NO_BODY_TYPES.has(node.type)) {
      new Notice('该节点类型不写入正文块（Entry 的 body 是占位）');
      return;
    }
    if (!this.guardBodyWrite(node)) return;
    new TextModal(this, {
      title: '新建正文段',
      placeholder: '写这一段正文…',
      onSave: (text) => {
        const t = String(text).trim();
        if (!t) return;
        const view = getGraphViews(this.app).find((v) => findNode(v, node.id));
        this.pushUndo(node, '新建正文段');
        this.backupBody(node, view);

        const paras = splitParas(node.body);
        /* 找 at 之前最近的 para 块，取它的 i；没有则插到开头 */
        const seq = materializeSeq(node);
        let insertAtIndex = 0;
        for (let k = Math.min(at, seq.length) - 1; k >= 0; k--) {
          const b = seq[k];
          if (b && b.t === 'para' && Number.isInteger(Number(b.i))) {
            insertAtIndex = Number(b.i) + 1;
            break;
          }
        }
        paras.splice(insertAtIndex, 0, t);
        node.body = joinParas(paras);

        /* 后续 para 引用整体后移 */
        for (const b of seq) {
          if (b && b.t === 'para' && Number(b.i) >= insertAtIndex) b.i = Number(b.i) + 1;
        }
        seq.splice(Math.max(0, Math.min(at, seq.length)), 0, { t: 'para', i: insertAtIndex, fp: fpOf(t) });
        commit(view);
        this.scan();
      },
    }).open();
  }

  pickExistingUnit(node, at) {
    const view = getGraphViews(this.app).find((v) => findNode(v, node.id));
    const units = unitsOf(node);
    if (!units.length) {
      new Notice('本卡还没有正文段');
      return;
    }
    const menu = new Menu();
    menu.addItem((i) => i.setTitle('引用已有' + (node.type === 'Dialog' ? '对话轮' : '正文段')).setDisabled(true));
    units.forEach((u, i) => {
      const shown = displayUnit(node, i);
      menu.addItem((item) =>
        item
          .setTitle(String(i + 1) + '. ' + String(shown == null ? u : shown).slice(0, 28))
          .onClick(() => {
            this.pushUndo(node, '插入引用');
            const seq = materializeSeq(node);
            seq.splice(Math.max(0, Math.min(at, seq.length)), 0, {
              t: node.type === 'Dialog' ? 'turn' : 'para',
              i,
              fp: fpOf(u),
            });
            commit(view);
            this.scan();
          })
      );
    });
    menu.showAtPosition({ x: 240, y: 240 });
  }

  editImageryBlock(node, idx) {
    const view = getGraphViews(this.app).find((v) => findNode(v, node.id));
    const seq = materializeSeq(node);
    const blk = seq[idx];
    if (!blk) return;
    const kind = KIND_MAP.get(blk.t);
    new TextModal(this, {
      title: (kind ? kind.label : blk.t) + '（编辑）',
      initial: String(blk.text || ''),
      onSave: (text) => {
        const t = String(text).trim();
        this.pushUndo(node, '编辑' + (kind ? kind.label : '块'));
        if (!t) seq.splice(idx, 1);
        else blk.text = t;
        commit(view);
        this.scan();
      },
    }).open();
  }

  moveBlock(node, idx, delta) {
    const view = getGraphViews(this.app).find((v) => findNode(v, node.id));
    const seq = materializeSeq(node);
    const j = idx + delta;
    if (!seq[idx] || !seq[j]) return;
    this.pushUndo(node, '移动块');
    const tmp = seq[idx];
    seq[idx] = seq[j];
    seq[j] = tmp;
    commit(view);
    this.scan();
  }

  deleteBlock(node, idx) {
    const view = getGraphViews(this.app).find((v) => findNode(v, node.id));
    const seq = materializeSeq(node);
    if (!seq[idx]) return;
    this.pushUndo(node, '删除块');
    seq.splice(idx, 1);
    commit(view);
    this.scan();
  }

  /** 编辑某段正文 / 某轮对话 */
  editUnit(node, i) {
    if (!Number.isInteger(i) || i < 0) {
      new Notice('这一段已不存在');
      return;
    }
    if (!this.guardBodyWrite(node)) return;
    if (node.type === 'Dialog') {
      const turns = Array.isArray(node.turns) ? node.turns : [];
      const t = turns[i];
      if (!t) return;
      new TurnModal(this, {
        title: '第 ' + (i + 1) + ' 轮对话',
        speaker: String(t.speaker || ''),
        line: String(t.line || ''),
        onSave: (speaker, line) => {
          const view = getGraphViews(this.app).find((v) => findNode(v, node.id));
          this.pushUndo(node, '编辑对话');
          this.backupBody(node, view);
          const sp = String(speaker || '').trim();
          if (sp) t.speaker = sp;
          else delete t.speaker;          /* 空说话人＝旁白 */
          t.line = String(line);
          const seq = seqOf(node) || [];
          for (const b of seq) {
            if (b && b.t === 'turn' && Number(b.i) === i) b.fp = fpOf(t.line);
          }
          commit(view);
          this.scan();
          this.scheduleCheck();
        },
      }).open();
      return;
    }

    const paras = splitParas(node.body);
    if (paras[i] == null) return;
    new TextModal(this, {
      title: '第 ' + (i + 1) + ' 段正文',
      initial: paras[i],
      onSave: (text) => {
        const t = String(text).trim();
        const view = getGraphViews(this.app).find((v) => findNode(v, node.id));
        this.pushUndo(node, '编辑正文段');
        this.backupBody(node, view);
        if (!t) paras.splice(i, 1);
        else paras[i] = t;
        node.body = joinParas(paras);
        const seq = seqOf(node) || [];
        if (!t) {
          /* 删掉这一段：移除引用并前移后续 */
          for (let k = seq.length - 1; k >= 0; k--) {
            const b = seq[k];
            if (b && b.t === 'para' && Number(b.i) === i) seq.splice(k, 1);
            else if (b && b.t === 'para' && Number(b.i) > i) b.i = Number(b.i) - 1;
          }
        } else {
          for (const b of seq) {
            if (b && b.t === 'para' && Number(b.i) === i) b.fp = fpOf(t);
          }
        }
        commit(view);
        this.scan();
        this.scheduleCheck();
      },
    }).open();
  }

  /* ── 数值（卡级） ── */

  editNumeric(node) {
    const view = getGraphViews(this.app).find((v) => findNode(v, node.id));
    const im = imageryOf(node) || {};
    new TextModal(this, {
      title: '数值意象（卡级 · 一行一条）',
      initial: toArr(im.numeric).join('\n'),
      placeholder: '如：体力 -1（跑了一趟脚行）',
      onSave: (text) => {
        this.pushUndo(node, '编辑数值');
        if (!node.customFields || typeof node.customFields !== 'object') node.customFields = {};
        if (!node.customFields.imagery || typeof node.customFields.imagery !== 'object') node.customFields.imagery = {};
        const lines = String(text).split('\n').map((s) => s.trim()).filter(Boolean);
        node.customFields.imagery.numeric = lines;
        commit(view);
        this.scan();
      },
    }).open();
  }

  clearNumeric(node) {
    const view = getGraphViews(this.app).find((v) => findNode(v, node.id));
    const im = imageryOf(node);
    if (!im) return;
    this.pushUndo(node, '清空数值');
    delete im.numeric;
    commit(view);
    this.scan();
  }

  editOptionNumeric(node, optionId) {
    const view = getGraphViews(this.app).find((v) => findNode(v, node.id));
    const im = imageryOf(node) || {};
    new TextModal(this, {
      title: '选项数值意象（一行一条）',
      initial: toArr((im.optionNumeric || {})[optionId]).join('\n'),
      onSave: (text) => {
        this.pushUndo(node, '选项数值');
        if (!node.customFields || typeof node.customFields !== 'object') node.customFields = {};
        if (!node.customFields.imagery || typeof node.customFields.imagery !== 'object') node.customFields.imagery = {};
        const im2 = node.customFields.imagery;
        if (!im2.optionNumeric || typeof im2.optionNumeric !== 'object') im2.optionNumeric = {};
        const lines = String(text).split('\n').map((s) => s.trim()).filter(Boolean);
        if (lines.length) im2.optionNumeric[optionId] = lines;
        else delete im2.optionNumeric[optionId];
        commit(view);
        this.scan();
      },
    }).open();
  }

  deleteOptionNumeric(node, optionId) {
    const view = getGraphViews(this.app).find((v) => findNode(v, node.id));
    const im = imageryOf(node);
    if (!im || !im.optionNumeric) return;
    this.pushUndo(node, '删除选项数值');
    delete im.optionNumeric[optionId];
    commit(view);
    this.scan();
  }

  clearCard(node) {
    const view = getGraphViews(this.app).find((v) => findNode(v, node.id));
    this.pushUndo(node, '清空本卡意象');
    if (node.customFields && typeof node.customFields === 'object') {
      delete node.customFields.sequence;
      delete node.customFields.imagery;
    }
    commit(view);
    this.scan();
  }

  /* ── 重对齐 ── */

  realignNode(node) {
    const view = getGraphViews(this.app).find((v) => findNode(v, node.id));
    const seq = seqOf(node);
    if (!seq) {
      new Notice('本卡还没有序列');
      return;
    }
    const units = unitsOf(node);
    const fps = units.map(fpOf);
    const used = new Set();
    let fixed = 0;
    let orphan = 0;

    for (const blk of seq) {
      if (!blk || (blk.t !== 'para' && blk.t !== 'turn')) continue;
      const want = blk.fp;
      let hit = -1;
      for (let k = 0; k < fps.length; k++) {
        if (!used.has(k) && fps[k] === want) {
          hit = k;
          break;
        }
      }
      if (hit >= 0) {
        if (Number(blk.i) !== hit) fixed++;
        blk.i = hit;
        used.add(hit);
      } else {
        orphan++;
        blk.i = -1;
      }
    }
    this.pushUndo(node, '重新挂接引用');
    commit(view);
    this.scan();
    this.scheduleCheck();
    new Notice('重挂接完成：修正 ' + fixed + ' 条，未挂接 ' + orphan + ' 条');
  }

  toggleAllCollapsed() {
    const view = getGraphView(this.app);
    if (!view) return;
    const nodes = nodesOf(view).filter((n) => displaySeq(n).length);
    const all = nodes.length > 0 && nodes.every((n) => this.collapsed.has(n.id));
    this.collapsed.clear();
    if (!all) nodes.forEach((n) => this.collapsed.add(n.id));
    this.scan();
  }
};

/* ───────────────────────────── 弹窗 ───────────────────────────── */

class TextModal extends Modal {
  constructor(plugin, opts) {
    super(plugin.app);
    this.opts = opts;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h3', { text: this.opts.title });
    const ta = contentEl.createEl('textarea', { cls: 'ih-modal-input' });
    ta.value = this.opts.initial || '';
    ta.rows = 5;
    ta.placeholder = this.opts.placeholder || '';
    ta.style.width = '100%';
    const bar = contentEl.createEl('div', { cls: 'ih-modal-bar' });
    const ok = bar.createEl('button', { text: '保存', cls: 'mod-cta' });
    const cancel = bar.createEl('button', { text: '取消' });
    const save = () => {
      const v = ta.value;
      this.close();
      this.opts.onSave(v);
    };
    ok.addEventListener('click', save);
    cancel.addEventListener('click', () => this.close());
    ta.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault();
        save();
      } else if (ev.key === 'Escape') {
        ev.preventDefault();
        this.close();
      }
    });
    window.setTimeout(() => ta.focus(), 30);
  }
  onClose() {
    this.contentEl.empty();
  }
}

class TurnModal extends Modal {
  constructor(plugin, opts) {
    super(plugin.app);
    this.opts = opts;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h3', { text: this.opts.title });

    const w1 = contentEl.createEl('div', { cls: 'ih-modal-field ih-turn' });
    w1.createEl('label', { cls: 'ih-modal-label', text: '说话人（留空＝旁白）' });
    const sp = w1.createEl('input', { cls: 'ih-modal-input' });
    sp.type = 'text';
    sp.value = this.opts.speaker || '';
    sp.style.width = '100%';

    const w2 = contentEl.createEl('div', { cls: 'ih-modal-field ih-turn' });
    w2.createEl('label', { cls: 'ih-modal-label', text: '台词' });
    const ta = w2.createEl('textarea', { cls: 'ih-modal-input' });
    ta.value = this.opts.line || '';
    ta.rows = 4;
    ta.style.width = '100%';

    const bar = contentEl.createEl('div', { cls: 'ih-modal-bar' });
    const ok = bar.createEl('button', { text: '保存', cls: 'mod-cta' });
    const cancel = bar.createEl('button', { text: '取消' });
    ok.addEventListener('click', () => {
      const s = sp.value;
      const l = ta.value;
      this.close();
      this.opts.onSave(s, l);
    });
    cancel.addEventListener('click', () => this.close());
    ta.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault();
        ok.click();
      } else if (ev.key === 'Escape') {
        ev.preventDefault();
        this.close();
      }
    });
    window.setTimeout(() => ta.focus(), 30);
  }
  onClose() {
    this.contentEl.empty();
  }
}

class ImageryModal extends Modal {
  constructor(plugin, node) {
    super(plugin.app);
    this.plugin = plugin;
    this.node = node;
    this.draft = {};
    this.enabled = {};
    const im = imageryOf(node) || {};
    for (const k of KINDS) {
      this.draft[k.key] = toArr(im[k.key]).join('\n');
      this.enabled[k.key] = toArr(im[k.key]).length > 0 || Object.prototype.hasOwnProperty.call(im, k.key);
    }
    this.numeric = toArr(im.numeric).join('\n');
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h3', { text: '编辑全部意象（卡级，旧形态）' });
    contentEl.createEl('div', {
      text: '这里是 v0.2 的卡级意象。要排成线性流请用卡片上的 ＋ 或右键「转成线性序列」。',
      cls: 'setting-item-description',
    });
    for (const k of KINDS) {
      const wrap = contentEl.createEl('div', { cls: 'ih-modal-field ' + k.cls });
      const head = wrap.createEl('label', { cls: 'ih-modal-label' });
      const cb = head.createEl('input');
      cb.type = 'checkbox';
      cb.checked = this.enabled[k.key];
      cb.addEventListener('change', () => (this.enabled[k.key] = cb.checked));
      head.appendText(' ' + k.label);
      const ta = wrap.createEl('textarea', { cls: 'ih-modal-input' });
      ta.value = this.draft[k.key];
      ta.rows = 3;
      ta.style.width = '100%';
      ta.placeholder = '一行一条';
      ta.addEventListener('input', () => {
        this.draft[k.key] = ta.value;
        if (!cb.checked) {
          cb.checked = true;
          this.enabled[k.key] = true;
        }
      });
    }
    const wrapN = contentEl.createEl('div', { cls: 'ih-modal-field ih-numeric' });
    wrapN.createEl('label', { cls: 'ih-modal-label', text: '数值（卡级）' });
    const taN = wrapN.createEl('textarea', { cls: 'ih-modal-input' });
    taN.value = this.numeric;
    taN.rows = 3;
    taN.style.width = '100%';
    taN.addEventListener('input', () => (this.numeric = taN.value));

    const bar = contentEl.createEl('div', { cls: 'ih-modal-bar' });
    const ok = bar.createEl('button', { text: '保存', cls: 'mod-cta' });
    const cancel = bar.createEl('button', { text: '取消' });
    ok.addEventListener('click', () => {
      this.save();
      this.close();
    });
    cancel.addEventListener('click', () => this.close());
  }
  save() {
    const node = this.node;
    const view = getGraphViews(this.plugin.app).find((v) => findNode(v, node.id));
    this.plugin.pushUndo(node, '编辑全部意象');
    if (!node.customFields || typeof node.customFields !== 'object') node.customFields = {};
    if (!node.customFields.imagery || typeof node.customFields.imagery !== 'object') node.customFields.imagery = {};
    const im = node.customFields.imagery;
    for (const k of KINDS) {
      if (!this.enabled[k.key]) {
        delete im[k.key];
        continue;
      }
      im[k.key] = String(this.draft[k.key] || '').split('\n').map((s) => s.trim()).filter(Boolean);
    }
    im.numeric = String(this.numeric || '').split('\n').map((s) => s.trim()).filter(Boolean);
    commit(view);
    this.plugin.scan();
    new Notice('已保存');
  }
  onClose() {
    this.contentEl.empty();
  }
}

class ConflictModal extends Modal {
  constructor(plugin, onlyIgnored) {
    super(plugin.app);
    this.plugin = plugin;
    this.onlyIgnored = !!onlyIgnored;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    const list = this.plugin.conflicts || [];
    const ignoredEntries = Object.entries(this.plugin.ignored || {});
    contentEl.createEl('h3', { text: this.onlyIgnored ? '已忽略的冲突' : '引用漂移（' + list.length + '）' });
    contentEl.createEl('div', {
      text: '含义：序列记录的那一段，其正文已被外部改动（插件编辑器／脚本／合并）。正文文字没有丢，只是位置对不上了。',
      cls: 'setting-item-description',
    });

    if (this.onlyIgnored) {
      if (!ignoredEntries.length) {
        contentEl.createEl('div', { text: '（没有已忽略项）' });
      } else {
        for (const [key, v] of ignoredEntries) {
          const row = contentEl.createEl('div', { cls: 'ih-conflict' });
          row.createEl('div', { text: key, cls: 'ih-conflict__head' });
          row.createEl('div', { text: '忽略时指纹：' + (v && v.fp), cls: 'setting-item-description' });
          const un = row.createEl('button', { text: '取消忽略' });
          un.addEventListener('click', async () => {
            delete this.plugin.ignored[key];
            await this.plugin.saveIgnored();
            this.plugin.checkAll();
            this.onOpen();
          });
        }
      }
      const bar = contentEl.createEl('div', { cls: 'ih-modal-bar' });
      const close = bar.createEl('button', { text: '关闭' });
      close.addEventListener('click', () => this.close());
      return;
    }

    if (!list.length) {
      contentEl.createEl('div', { text: '（当前没有引用漂移）' });
    }

    const byFile = new Map();
    for (const c of list) {
      if (!byFile.has(c.file || '(未命名)')) byFile.set(c.file || '(未命名)', []);
      byFile.get(c.file || '(未命名)').push(c);
    }

    for (const [file, items] of byFile) {
      const sec = contentEl.createEl('details', { cls: 'ih-conflict-group' });
      sec.open = true;
      sec.createEl('summary', { text: file + '（' + items.length + '）' });
      for (const c of items) {
        const row = sec.createEl('div', { cls: 'ih-conflict' });
        row.createEl('div', { text: c.nodeId + ' · ' + c.type + ' · 第 ' + (c.idx + 1) + ' 块', cls: 'ih-conflict__head' });
        row.createEl('div', { text: '序列期望：' + c.expected, cls: 'setting-item-description' });
        row.createEl('div', { text: '当前正文：' + (c.text ? String(c.text).slice(0, 60) : c.actual), cls: 'setting-item-description' });
        const bar = row.createEl('div', { cls: 'ih-conflict__bar' });
        const b1 = bar.createEl('button', { text: '重新挂接' });
        b1.addEventListener('click', () => {
          const view = getGraphViews(this.plugin.app).find((v) => (v.file && v.file.path === c.file) || fileOfView(v) === c.file);
          const node = view && findNode(view, c.nodeId);
          if (!node) {
            new Notice('找不到该节点');
            return;
          }
          this.plugin.realignNode(node);
          this.plugin.checkAll();
          this.onOpen();
        });
        const b2 = bar.createEl('button', { text: '忽略' });
        b2.addEventListener('click', async () => {
          this.plugin.ignored[c.key] = { fp: c.actualFp, at: new Date().toISOString() };
          await this.plugin.saveIgnored();
          this.plugin.checkAll();
          this.onOpen();
        });
        const b3 = bar.createEl('button', { text: '定位' });
        b3.addEventListener('click', () => {
          const view = getGraphViews(this.plugin.app).find((v) => fileOfView(v) === c.file);
          if (view && view.containerEl) {
            const el = view.containerEl.querySelector('.ng-node[data-node-id="' + c.nodeId + '"]');
            if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        });
      }
    }

    const bar = contentEl.createEl('div', { cls: 'ih-modal-bar' });
    const all = bar.createEl('button', { text: '全部重新挂接' });
    all.addEventListener('click', () => {
      const seen = new Set();
      for (const c of list) {
        const k = c.file + '::' + c.nodeId;
        if (seen.has(k)) continue;
        seen.add(k);
        const view = getGraphViews(this.plugin.app).find((v) => fileOfView(v) === c.file);
        const node = view && findNode(view, c.nodeId);
        if (node) this.plugin.realignNode(node);
      }
      this.plugin.checkAll();
      this.onOpen();
    });
    const close = bar.createEl('button', { text: '关闭' });
    close.addEventListener('click', () => this.close());
  }
  onClose() {
    this.contentEl.empty();
  }
}
