# -*- coding: utf-8 -*-
"""
第三轮: 主题化定向抽取, 产出可直接给写作用的"原文候选"清单。
输出: data\kanglian_liang_themes.md
"""
import sqlite3
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

DB = r"D:\抗联整理_OCR成果\_index\library.db"
OUT = Path(r"C:\Users\white\Downloads\DS workspace\data\kanglian_liang_themes.md")

ORAL = ["口述", "回忆", "亲历", "见闻", "忆述", "文史资料", "志"]

THEMES = [
    ("A 粮库·粮仓·粮囤·储运实体", ["粮库", "粮仓", "粮囤", "粮垛", "粮食仓库"], 34),
    ("B 粮栈·粮店·粮谷交易", ["粮栈", "粮店", "粮行", "粮谷市场", "粮食市场"], 34),
    ("C 出荷·统制·1942", ["出荷", "粮谷统制", "粮食统制", "农产物交易场", "兴农合作社"], 30),
    ("D 配给·配给店·通帐", ["配给", "配给店", "配给所", "通帐", "通账", "配给本"], 30),
    ("E 军粮·筹粮·藏粮·断粮", ["军粮", "筹粮", "征粮", "藏粮", "抢粮", "断粮", "缺粮"], 30),
    ("F 代食品·饥饿·橡子面", ["橡子面", "橡子", "树皮", "草根", "饿死", "挨饿", "饥荒", "糠"], 30),
    ("G 口述回忆中的粮(1941-1943)", ["口述", "回忆", "亲历"], 34),
]

CTX = 200
ERA = ["1942", "康德九年", "昭和十七年", "1941", "康德八年", "昭和十六年", "1943", "康德十年"]


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
    bmap = {r["id"]: dict(r) for r in conn.execute(
        "SELECT id,title,rel,pages FROM books")}

    lines = ["# 抗联全文库 · 粮食主题原文候选", ""]
    for name, kws, cap in THEMES:
        per_book = {}
        total_pages = 0
        cur = conn.execute("SELECT book_id,page_no,text FROM pages_fts")
        while True:
            rows = cur.fetchmany(4000)
            if not rows:
                break
            for r in rows:
                t = r["text"] or ""
                if not t or "粮" not in t and "食" not in t and "橡" not in t:
                    continue
                hit = next((k for k in kws if k in t), None)
                if not hit:
                    continue
                if name.startswith("G"):
                    if not any(o in t for o in ORAL) or not any(e in t for e in ERA):
                        continue
                    if "粮" not in t:
                        continue
                total_pages += 1
                lst = per_book.setdefault(r["book_id"], [])
                if len(lst) < 4:
                    lst.append((r["page_no"], hit, t, any(e in t for e in ERA)))
        ranked = sorted(per_book.items(), key=lambda kv: -len(kv[1]))
        lines.append(f"\n\n# 主题 {name}   (命中页 {total_pages}, 涉及 {len(per_book)} 本)")
        shown = 0
        picked = []
        # 每个主题各取: 优先 1942 相关 + 文史/口述类
        for bid, hits in ranked:
            if shown >= cap:
                break
            info = bmap.get(bid, {})
            title = info.get("title") or ""
            if "满铁农村调查" in title and shown > cap * 0.6:
                continue
            picked.append((bid, hits, info))
            shown += len(hits[:2])
        for bid, hits, info in picked:
            title = info.get("title") or ""
            lines.append(f"\n### {title}")
            lines.append(f"- 源: {info.get('rel')} | 共 {info.get('pages')} 页")
            for pg, hit, t, era in hits[:2]:
                tag = "★1942前后" if era else ""
                lines.append(f"\n**[第{pg}页]** 「{hit}」{tag}")
                lines.append("> " + window(t, hit))

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print("written:", OUT, OUT.stat().st_size, "bytes")
    conn.close()


if __name__ == "__main__":
    main()
