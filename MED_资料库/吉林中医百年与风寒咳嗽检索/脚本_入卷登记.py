# -*- coding: utf-8 -*-
"""《吉林中医百年》制度段专抽: 汉医讲习会/考试/取缔/执照 -> 控制台"""
import sqlite3
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

DB = r"D:\抗联整理_OCR成果\_index\library.db"
TITLE = "吉林市文史资料 第10辑 吉林中医百年"
KEYS = ["汉医讲习", "取缔", "考试", "执照", "许可", "登录", "登记", "限制", "压制",
        "满洲中央汉医会", "中医公会", "国药同业", "诊治传染病"]

conn = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
conn.row_factory = sqlite3.Row
b = conn.execute("SELECT id,title FROM books WHERE title LIKE ?", (f"%{TITLE}%",)).fetchone()
rows = conn.execute("SELECT page_no,text FROM pages_fts WHERE book_id=? ORDER BY page_no",
                    (b["id"],)).fetchall()
for r in rows:
    t = r["text"] or ""
    hits = [k for k in KEYS if k in t]
    if len(hits) >= 1 and any(k in t for k in ["汉医讲习", "取缔", "满洲中央汉医会", "执照", "许可"]):
        print(f"\n===== 第{r['page_no']}页 | {'、'.join(hits)} =====")
        print(t.replace("\f", " ").replace("\n", " ")[:2200])
conn.close()
