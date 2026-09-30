# -*- coding: utf-8 -*-
"""《吉林中医百年》专抽: 风寒/咳嗽/方药/医案 -> data\kanglian_tcm_jl.md"""
import sqlite3
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

DB = r"I:\抗联整理_OCR成果\_index\library.db"
OUT = Path(r"C:\Users\white\Downloads\DS workspace\data\kanglian_tcm_jl.md")
TITLE = "吉林市文史资料 第10辑 吉林中医百年"

# 处方/病证专用词
RX = ["风寒", "咳嗽", "感冒", "伤风", "着凉", "受寒", "气喘", "痰",
      "麻黄", "桂枝", "杏仁", "甘草", "半夏", "桔梗", "贝母", "陈皮",
      "生姜", "葱白", "银花", "连翘", "柴胡", "黄芩", "桑叶", "菊花",
      "汤药", "煎药", "处方", "方剂", "汤剂", "医案", "治验", "主治",
      "辨证", "温病", "伤寒论", "金匮", "汤头", "脉", "舌苔", "针灸"]
CTX = 620


def window(t, kw, w=CTX):
    i = t.find(kw)
    a = max(0, i - w // 3) if i >= 0 else 0
    return ("…" if a > 0 else "") + t[a:a + w].replace("\f", " ").replace("\n", " ") + "…"


def main():
    conn = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    b = conn.execute("SELECT id,title,rel,pages FROM books WHERE title LIKE ?",
                     (f"%{TITLE}%",)).fetchone()
    print("book:", b["title"], b["pages"], "pages")
    rows = conn.execute("SELECT page_no,text FROM pages_fts WHERE book_id=? ORDER BY page_no",
                        (b["id"],)).fetchall()
    lines = [f"# 《{b['title']}》专抽", f"- 源: {b['rel']}", f"- 共 {b['pages']} 页"]
    n = 0
    pages_hit = []
    for r in rows:
        t = r["text"] or ""
        hits = [k for k in RX if k in t]
        if not hits:
            continue
        pages_hit.append((r["page_no"], hits))
        n += 1
        lines.append(f"\n**[第{r['page_no']}页]** 命中: {'、'.join(hits[:10])}")
        lines.append("> " + window(t, hits[0]))
    lines.insert(3, f"- 命中页 {n} 页: {[p for p,_ in pages_hit]}")
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"命中 {n} 页, written {OUT.stat().st_size} bytes")
    print("页码:", [p for p, _ in pages_hit])
    conn.close()


if __name__ == "__main__":
    main()
