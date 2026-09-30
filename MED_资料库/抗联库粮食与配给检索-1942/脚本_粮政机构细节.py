# -*- coding: utf-8 -*-
"""第六轮: 关键专著/档案的粮政机构细节定向抽取 -> data\kanglian_liang_inst.md"""
import sqlite3
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

DB = r"I:\抗联整理_OCR成果\_index\library.db"
OUT = Path(r"C:\Users\white\Downloads\DS workspace\data\kanglian_liang_inst.md")

TARGETS = [
    "日本殖民统治与东北农民生活",
    "第14卷 《东北经济掠夺》",
    "日本侵占下东北经济的殖民地化",
    "满铁农村调查 总第4卷",
    "满铁农村调查（总第6卷",
    "伪满洲国的统治与内幕",
    "东北沦陷十四年大事编年",
    "佳木斯文史资料 第11辑",
    "东北抗日联军 文献",
    "黑龙江文史资料 第26辑",
    "吉林文史资料选辑 第24辑",
]
# 机构与零售细节词
KWS = ["配给店", "配给所", "配给制", "配给", "粮店", "米店", "粮栈", "粮库", "粮仓",
       "农产物交易场", "交易场", "兴农合作社", "出荷", "粮谷出荷", "粮食出荷",
       "粮价", "粮市", "买粮", "卖粮", "义仓", "积谷", "通帐", "通账", "配给本",
       "橡子面", "统制", "收买", "过秤", "验等", "粮秣", "军粮"]
CTX = 320
PER = 4


def window(t, kw, w=CTX):
    i = t.find(kw)
    a = max(0, i - w // 2) if i >= 0 else 0
    s = t[a:a + w].replace("\f", " ").replace("\n", " ")
    return ("…" if a > 0 else "") + s + "…"


def main():
    conn = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    books = [dict(r) for r in conn.execute("SELECT id,title,rel,pages FROM books")]
    sel = []
    for t in TARGETS:
        for b in books:
            if t in (b["title"] or "") and b not in sel:
                sel.append(b)

    lines = ["# 抗联全文库 · 粮政机构与零售细节 定向抽取", ""]
    for b in sel:
        rows = conn.execute("SELECT page_no,text FROM pages_fts WHERE book_id=? ORDER BY page_no",
                            (b["id"],)).fetchall()
        hits = []
        for r in rows:
            t = r["text"] or ""
            k = next((k for k in KWS if k in t), None)
            if k:
                hits.append((r["page_no"], k, t))
        if not hits:
            continue
        print(f'{len(hits):>4}  {b["title"][:70]}')
        lines.append(f"\n## {b['title']}")
        lines.append(f"- 源: {b['rel']} | 共 {b['pages']} 页 | 机构词命中 {len(hits)} 页")
        for pg, k, t in hits[:PER]:
            lines.append(f"\n**[第{pg}页]** 「{k}」")
            lines.append("> " + window(t, k))

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print("written:", OUT, OUT.stat().st_size)
    conn.close()


if __name__ == "__main__":
    main()
