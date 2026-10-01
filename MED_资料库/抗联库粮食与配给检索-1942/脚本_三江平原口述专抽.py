# -*- coding: utf-8 -*-
"""第七轮: 佳木斯/三江平原粮谷出荷口述专抽 + 书目总表检索 -> data\kanglian_liang_jms.md"""
import csv
import sqlite3
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

DB = r"D:\抗联整理_OCR成果\_index\library.db"
CSV = r"D:\抗联整理_OCR成果\_index\书目总表.csv"
OUT = Path(r"C:\Users\white\Downloads\DS workspace\data\kanglian_liang_jms.md")

KWS = ["出荷", "粮谷", "粮食", "粮库", "粮栈", "配给", "橡子面", "饿", "粮"]


def main():
    # 1) 书目总表: 找粮食/出荷/经济专题的文史资料与志书
    rows = []
    with open(CSV, encoding="utf-8-sig", newline="") as f:
        for r in csv.DictReader(f):
            rows.append(r)
    print("书目总表:", len(rows), "列:", list(rows[0].keys()) if rows else "")
    hits = []
    for r in rows:
        t = (r.get("title") or r.get("书名") or "")
        if any(k in t for k in ["粮食", "粮谷", "出荷", "粮油", "食物", "副食", "物资", "配给"]):
            hits.append(t)
    print("\n--- 书名含粮食/出荷/物资 等 ---")
    for t in sorted(set(hits)):
        print("  ", t[:110])
    Path(OUT).write_text("", encoding="utf-8")

    # 2) 佳木斯文史资料 第11辑 + 黑龙江/鹤岗/桦南 相关 专抽
    conn = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    books = [dict(x) for x in conn.execute("SELECT id,title,rel,pages FROM books")]
    sel = [b for b in books if ("佳木斯文史资料 第11辑" in (b["title"] or "")
                                or "桦南" in (b["title"] or "")
                                or "汤原" in (b["title"] or ""))]
    lines = ["# 三江平原粮谷出荷口述 专抽", ""]
    for b in sel:
        rs = conn.execute("SELECT page_no,text FROM pages_fts WHERE book_id=? ORDER BY page_no",
                          (b["id"],)).fetchall()
        got = [(r["page_no"], r["text"]) for r in rs
               if r["text"] and ("出荷" in r["text"] or "粮谷" in r["text"])]
        if not got:
            continue
        print(f'\n== {b["title"][:70]}  出荷/粮谷页 {len(got)}')
        print("   页码:", [p for p, _ in got][:60])
        lines.append(f"\n## {b['title']}\n- 源: {b['rel']} | 共 {b['pages']} 页")
        lines.append(f"- 出荷/粮谷命中页: {[p for p,_ in got]}")
        for pg, t in got[:14]:
            body = t.replace("\f", " ").replace("\n", " ")
            lines.append(f"\n**[第{pg}页]**\n> {body[:900]}")
    (OUT).write_text("\n".join(lines), encoding="utf-8")
    print("\nwritten:", OUT, OUT.stat().st_size)
    conn.close()


if __name__ == "__main__":
    main()
