# -*- coding: utf-8 -*-
"""
中医·风寒·咳嗽 检索 第二轮: 定向抽取原文
输出: data\kanglian_tcm_detail.md
"""
import sqlite3
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

DB = r"D:\抗联整理_OCR成果\_index\library.db"
OUT = Path(r"C:\Users\white\Downloads\DS workspace\data\kanglian_tcm_detail.md")

TARGETS = [
    "吉林市文史资料 第10辑 吉林中医百年",
    "长春文史资料  第60辑  长春老字号",
    "吉林市文史资料 第15辑 吉林市老字号",
    "齐齐哈尔工商史料",
    "辽宁文史资料 第26辑 工商专辑",
    "锦州文史资料 第10辑 工商财贸专辑",
    "东北民俗资料荟萃",
    "吉林市文史资料 第17辑",
    "铁岭文史资料 第3辑",
    "营口文史资料 第4辑",
    "桦甸文史资料 第6辑",
    "黑龙江文史资料 第12辑",
    "鹤岗文史资料 第9辑",
    "鹤岗文史资料 第8辑",
    "满洲开发四十年史 下",
    "伪满洲国史料 15",
    "满洲山怪",
    "长白山抗联故事",
    "铁窗丹心",
    "最后的抗联",
]
# 中医专有词(高价值) 与 泛词(低价值)
CORE = ["风寒", "咳嗽", "伤风", "感冒", "着凉", "受寒", "麻黄", "桂枝", "杏仁",
        "甘草", "桔梗", "贝母", "半夏", "陈皮", "生姜", "葱白", "冰糖", "红糖",
        "汤药", "煎药", "偏方", "土方", "单方", "验方", "坐堂", "郎中", "药铺",
        "药王", "诊费", "出诊", "把脉", "开方", "方子", "汉医", "针灸", "拔罐", "刮痧"]
GEN = ["中医", "中药", "药房", "药材", "草药", "药商", "生药"]
CTX = 420
CAP = 16


def window(t, kw, w=CTX):
    i = t.find(kw)
    a = max(0, i - w // 3) if i >= 0 else 0
    return ("…" if a > 0 else "") + t[a:a + w].replace("\f", " ").replace("\n", " ") + "…"


def main():
    conn = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    books = [dict(r) for r in conn.execute("SELECT id,title,rel,pages FROM books")]
    sel = []
    for t in TARGETS:
        for b in books:
            if t in (b["title"] or "") and b not in sel:
                sel.append(b)

    lines = ["# 中医 · 风寒 · 咳嗽 —— 资料库原文抽取", ""]
    for b in sel:
        rows = conn.execute("SELECT page_no,text FROM pages_fts WHERE book_id=? ORDER BY page_no",
                            (b["id"],)).fetchall()
        core_hits, gen_hits = [], []
        for r in rows:
            t = r["text"] or ""
            k = next((k for k in CORE if k in t), None)
            if k:
                core_hits.append((r["page_no"], k, t))
                continue
            k2 = next((k for k in GEN if k in t), None)
            if k2:
                gen_hits.append((r["page_no"], k2, t))
        if not core_hits and not gen_hits:
            continue
        print(f'核心 {len(core_hits):>4} / 泛 {len(gen_hits):>4}  {b["title"][:66]}')
        lines.append(f"\n## {b['title']}")
        lines.append(f"- 源: {b['rel']}")
        lines.append(f"- 共 {b['pages']} 页 | 中医核心词命中 {len(core_hits)} 页 | 泛词 {len(gen_hits)} 页")
        lines.append(f"- 核心词命中页: {[p for p, _, _ in core_hits][:80]}")
        for pg, k, t in core_hits[:CAP]:
            lines.append(f"\n**[第{pg}页]** 「{k}」")
            lines.append("> " + window(t, k))
        if len(core_hits) < 3:
            for pg, k, t in gen_hits[:6]:
                lines.append(f"\n**[第{pg}页]** （泛）「{k}」")
                lines.append("> " + window(t, k, 260))

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print("\nwritten:", OUT, OUT.stat().st_size)
    conn.close()


if __name__ == "__main__":
    main()
