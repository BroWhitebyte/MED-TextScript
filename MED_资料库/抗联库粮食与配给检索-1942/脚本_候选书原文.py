# -*- coding: utf-8 -*-
"""
第二轮: 对候选书做定向抽取, 输出"书名 + 页码 + 原文片段"清单。
输出: data\kanglian_liang_detail.md
"""
import re
import sqlite3
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

DB = r"D:\抗联整理_OCR成果\_index\library.db"
OUT = Path(r"C:\Users\white\Downloads\DS workspace\data\kanglian_liang_detail.md")

# 目标书(按标题子串匹配)
TARGETS = [
    "双鸭山文史资料 第8辑",
    "抗联一路军在蒙江",
    "日本殖民统治与东北农民生活",
    "伪满洲国的统治与内幕",
    "我的抗联岁月",
    "过去的年代",
    "满铁农村调查",
    "东北经济掠夺",
    "一个伪满少将的回忆",
    "忠骨 抗联名将王明贵",
    "沃土喋血",
    "风雨征程",
    "黑暗下的星火",
    "周保中东北抗日游击日记",
    "黑龙江文史资料 第38辑",
    "鹤岗文史资料 第6辑",
    "长白山抗联故事",
    "日本侵占下东北经济的殖民地化",
    "满铁内密文书",
    "伪满官员供述",
]

# 抽取关键词(有序: 越靠前越优先显示)
KWS = [
    "粮库", "粮仓", "粮囤", "粮栈", "粮店", "粮秣", "粮食", "食粮", "粮谷",
    "出荷", "配给", "兴农合作社", "橡子面", "橡子", "军粮", "征粮", "筹粮",
    "抢粮", "藏粮", "送粮", "运粮", "断粮", "缺粮", "饿死", "挨饿", "饥荒",
    "康德九年", "昭和十七年", "1942",
]
ORAL = ["口述", "回忆", "亲历", "见闻", "忆述"]

MAX_CTX_PER_BOOK = 26
CTX = 260


def window(t, kw, w=CTX):
    i = t.find(kw)
    if i < 0:
        return t[:w].replace("\f", " ").replace("\n", " ")
    a = max(0, i - w // 2)
    s = t[a:i + w // 2].replace("\f", " ").replace("\n", " ")
    return ("…" if a > 0 else "") + s + "…"


def main():
    conn = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    books = [dict(r) for r in conn.execute(
        "SELECT id,title,rel,pages,chars FROM books")]

    sel = []
    for t in TARGETS:
        for b in books:
            if t in (b["title"] or "") and b not in sel:
                sel.append(b)
    print("selected books:", len(sel))
    for b in sel:
        print("  ", b["title"][:70], "| pages:", b["pages"])

    lines = ["# 抗联全文库 · 粮食/粮库 定向抽取", ""]
    for b in sel:
        rows = conn.execute(
            "SELECT page_no, text FROM pages_fts WHERE book_id=? ORDER BY page_no",
            (b["id"],)).fetchall()
        recs = []
        oral_pages = []
        for r in rows:
            t = r["text"] or ""
            hits = [k for k in KWS if k in t]
            if not hits:
                continue
            if any(o in t for o in ORAL):
                oral_pages.append(r["page_no"])
            recs.append((r["page_no"], hits, t))
        if not recs:
            continue
        lines.append(f"\n## {b['title']}")
        lines.append(f"- 源: {b.get('rel')} | 共 {b['pages']} 页 / {b.get('chars')} 字 "
                     f"| 含粮相关词页数 {len(recs)}")
        lines.append(f"- 含口述/回忆字样的粮相关页: {oral_pages[:40]}")
        shown = 0
        for pg, hits, t in recs:
            if shown >= MAX_CTX_PER_BOOK:
                break
            kw = hits[0]
            lines.append(f"\n**[第{pg}页]** 命中词: {'、'.join(hits[:8])}")
            lines.append("> " + window(t, kw))
            shown += 1
        lines.append(f"\n_(该书共 {len(recs)} 个粮相关页, 此处列前 {shown} 页)_")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print("written:", OUT, OUT.stat().st_size, "bytes")
    conn.close()


if __name__ == "__main__":
    main()
