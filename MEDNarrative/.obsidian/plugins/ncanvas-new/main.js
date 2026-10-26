'use strict';
/*
 * NCanvas New —— 在任意文件夹里新建 .ncanvas
 *
 * 入口：
 *   1. 文件浏览器里右键任意文件夹（或任意文件 → 同级目录）
 *   2. 命令面板：「新建事件件（.ncanvas）」「新建空白画布（.ncanvas）」
 *   3. 左侧栏按钮
 *
 * 骨架三种：
 *   event  事件：Entry → Content → End（已连线）
 *   blank  空白：Entry → End（已连线）
 *   card   文本卡：单张 Content（不连线）
 *
 * 其他：自动推算下一个事件编号（同目录内 Event NNN 取最大值 +1）；
 *       文件名非法字符会被替换；重名自动加 -2、-3。
 */

const { Plugin, Modal, Setting, Notice, TFolder, TFile, normalizePath } = require('obsidian');

const SKELETON_EVENT = 'event';
const SKELETON_BLANK = 'blank';
const SKELETON_CARD = 'card';

/** 造一份最小合法的 .ncanvas 内容 */
function buildCanvas(title, kind) {
  const W = 440;
  const nodes = [];
  const links = [];

  if (kind === SKELETON_CARD) {
    /* 片段：只有 Entry → 正文，留待接进别的件 */
    nodes.push({
      id: 'n_entry',
      type: 'Entry',
      x: 140,
      y: 80,
      width: W,
      height: 88,
      body: 'Adventure Begins',
    });
    nodes.push({ id: 'n0', type: 'Content', x: 140, y: 240, width: W, height: 180, body: '' });
    links.push({ id: 'l0', from: 'n_entry', to: 'n0' });
  } else {
    nodes.push({
      id: 'n_entry',
      type: 'Entry',
      x: 140,
      y: 80,
      width: W,
      height: 88,
      body: 'Adventure Begins',
    });
    if (kind === SKELETON_EVENT) {
      nodes.push({ id: 'n0', type: 'Content', x: 140, y: 240, width: W, height: 180, body: '' });
      nodes.push({ id: 'n1', type: 'End', x: 140, y: 500, width: W, height: 88, body: '' });
      links.push({ id: 'l0', from: 'n_entry', to: 'n0' });
      links.push({ id: 'l1', from: 'n0', to: 'n1' });
    } else {
      nodes.push({ id: 'n1', type: 'End', x: 140, y: 240, width: W, height: 88, body: '' });
      links.push({ id: 'l0', from: 'n_entry', to: 'n1' });
    }
  }

  return JSON.stringify(
    {
      version: 1,
      savedAt: new Date().toISOString(),
      ui: {},
      project: {
        title: title,
        notes: '',
        variables: [],
        characters: [],
        nodes: nodes,
        links: links,
      },
    },
    null,
    ' '
  );
}

/** 去掉文件名里的非法字符 */
function sanitizeName(name) {
  return String(name || '')
    .replace(/[\\/:*?"<>|#^[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.ncanvas$/i, '');
}

module.exports = class NCanvasNewPlugin extends Plugin {
  async onload() {
    /* 记住上次用的文件夹，命令面板调用时继承 */
    const data = (await this.loadData()) || {};
    this.lastFolder = data.lastFolder || 'MEDNarrative/Flows';

    /* ① 命令：事件件 */
    this.addCommand({
      id: 'new-event',
      name: '新建事件件（.ncanvas）',
      callback: () => this.openDialog(this.resolveStartFolder(), SKELETON_EVENT),
    });

    /* ② 命令：空白画布 */
    this.addCommand({
      id: 'new-blank',
      name: '新建空白画布（.ncanvas）',
      callback: () => this.openDialog(this.resolveStartFolder(), SKELETON_BLANK),
    });

    /* ③ 命令：文本卡 */
    this.addCommand({
      id: 'new-card',
      name: '新建文本卡（.ncanvas）',
      callback: () => this.openDialog(this.resolveStartFolder(), SKELETON_CARD),
    });

    /* ④ 侧栏按钮 */
    this.addRibbonIcon('file-plus', '新建事件件（.ncanvas）', () =>
      this.openDialog(this.resolveStartFolder(), SKELETON_EVENT)
    );

    /* ⑤ 右键菜单：文件夹 → 在其内新建；文件 → 同级目录新建 */
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        let folder = null;
        if (file instanceof TFolder) folder = file;
        else if (file instanceof TFile && file.parent) folder = file.parent;
        if (!folder) return;

        const target = folder.path;
        menu.addSeparator();
        menu.addItem((item) =>
          item
            .setTitle('新建事件件（.ncanvas）')
            .setIcon('file-plus')
            .onClick(() => this.openDialog(target, SKELETON_EVENT))
        );
        menu.addItem((item) =>
          item
            .setTitle('新建空白画布（.ncanvas）')
            .setIcon('file-plus-2')
            .onClick(() => this.openDialog(target, SKELETON_BLANK))
        );
      })
    );
  }

  /** 命令面板调用时的起始文件夹：当前打开文件所在目录 → 上次目录 → Flows → 库根 */
  resolveStartFolder() {
    const active = this.app.workspace.getActiveFile();
    if (active && active.parent) return active.parent.path;
    const remembered = this.app.vault.getAbstractFileByPath(this.lastFolder);
    if (remembered instanceof TFolder) return remembered.path;
    const flows = this.app.vault.getAbstractFileByPath('MEDNarrative/Flows');
    if (flows instanceof TFolder) return flows.path;
    return '/';
  }

  /** 同目录里 Event NNN 取最大 +1，用来预填标题 */
  suggestNextTitle(folderPath) {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!(folder instanceof TFolder)) return 'Event 001 新事件';

    let max = 0;
    for (const child of folder.children) {
      if (!(child instanceof TFile)) continue;
      const m = child.basename.match(/^Event\s*(\d{1,3})([A-Z]?)/i);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    const next = String(max + 1).padStart(3, '0');
    return 'Event ' + next + ' 新事件';
  }

  openDialog(folderPath, kind) {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!(folder instanceof TFolder)) {
      new Notice('目标文件夹不存在：' + folderPath, 6000);
      return;
    }
    new NewNcanvasModal(this, folder, kind).open();
  }

  /** 真正落盘 */
  async createFile(folder, title, kind) {
    const clean = sanitizeName(title);
    if (!clean) {
      new Notice('名称为空，已取消。');
      return;
    }

    let path = normalizePath(folder.path + '/' + clean + '.ncanvas');
    let n = 2;
    while (this.app.vault.getAbstractFileByPath(path)) {
      path = normalizePath(folder.path + '/' + clean + ' ' + n + '.ncanvas');
      n += 1;
    }

    try {
      await this.app.vault.create(path, buildCanvas(clean, kind));
    } catch (e) {
      console.error('[ncanvas-new] 创建失败', e);
      new Notice('创建失败：' + (e && e.message ? e.message : e), 8000);
      return;
    }

    this.lastFolder = folder.path;
    await this.saveData({ lastFolder: this.lastFolder });

    new Notice('已创建：' + path, 5000);

    /* 打开（narrative-graph 会接管 .ncanvas） */
    const created = this.app.vault.getAbstractFileByPath(path);
    if (created instanceof TFile) {
      try {
        await this.app.workspace.getLeaf(false).openFile(created);
      } catch (e) {
        console.error('[ncanvas-new] 打开失败', e);
      }
    }
  }
};

/** 输入名称 + 选骨架 */
class NewNcanvasModal extends Modal {
  constructor(plugin, folder, kind) {
    super(plugin.app);
    this.plugin = plugin;
    this.folder = folder;
    this.kind = kind;
    this.title = plugin.suggestNextTitle(folder.path);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h3', { text: '新建 .ncanvas' });
    contentEl.createEl('div', {
      text: '位置：' + this.folder.path,
      cls: 'setting-item-description',
    });

    new Setting(contentEl)
      .setName('名称')
      .setDesc('决定文件名与 project.title；重名会自动加序号')
      .addText((t) => {
        t.setValue(this.title);
        t.onChange((v) => (this.title = v));
        t.inputEl.style.width = '320px';
        t.inputEl.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            this.submit();
          }
        });
        window.setTimeout(() => {
          t.inputEl.focus();
          t.inputEl.select();
        }, 30);
      });

    new Setting(contentEl)
      .setName('骨架')
      .addDropdown((d) => {
        d.addOption(SKELETON_EVENT, '事件：Entry → 正文 → End');
        d.addOption(SKELETON_BLANK, '空白：Entry → End');
        d.addOption(SKELETON_CARD, '片段：Entry → 正文（无 End）');
        d.setValue(this.kind);
        d.onChange((v) => (this.kind = v));
      });

    new Setting(contentEl)
      .addButton((b) => b.setButtonText('创建').setCta().onClick(() => this.submit()))
      .addButton((b) => b.setButtonText('取消').onClick(() => this.close()));
  }

  submit() {
    const folder = this.folder;
    const title = this.title;
    const kind = this.kind;
    this.close();
    this.plugin.createFile(folder, title, kind);
  }

  onClose() {
    this.contentEl.empty();
  }
}
