# -*- coding: utf-8 -*-
"""
第五轮(精确化): 只保留"粮 + 伪满年代标记"同页的内容, 剔除新中国时期史料。
输出: data\kanglian_liang_1942.md
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
OUT = Path(r"C:\Users\white\Downloads\DS workspace\data\kanglian_liang_1942.md")

LIANG = ["粮库", "粮仓", "粮囤", "粮栈", "粮店", "粮行", "粮秣", "粮食", "食粮", "粮谷",
         "出荷", "配给", "配給", "橡子面", "军粮", "征粮", "筹粮", "藏粮", "抢粮",
         "断粮", "缺粮", "送粮", "运粮", "粮价", "粮市", "粮荒"]
ERA = ["伪满", "满洲国", "満洲", "康德", "大同二", "昭和", "出荷", "配给", "配給",
       "兴农合作社", "日伪", "关东军", "开拓团", "协和会", "粮谷统制", "农产品统制",
       "农产物", "日本帝国主义", "日本侵略", "沦陷", "殖民"]
YEARS = re.compile(r"19(3[2-9]|4[0-5])|一九(三[2-9]|四[0-5])")

# 只保留东北/伪满相关书名
TITLE_OK = re.compile(
    r"东北|伪满|满洲|満洲|抗联|黑龙江|吉林|辽宁|哈尔滨|长春|佳木斯|牡丹江|"
    r"文史资料|县志|日本|殖民|经济掠夺|满铁|滨江|三江|珠河|尚志|依兰|通河|方正|"
    r"延寿|巴彦|木兰|宾县|五常|榆树|扶余|双城|阿城|呼兰|绥化|海伦|密山|虎林|"
    r"饶河|宝清|富锦|桦川|汤原|通北|铁骊|庆城|绥棱|望奎|青冈|明水|拜泉|讷河|"
    r"克山|德都|北安|依安|泰来|甘南|龙江|景星|林甸|安达|肇州|肇东|肇源|郭尔罗斯|"
    r"抗日|革命|回忆|口述|人物|事件|档案|史料|志")
# 排除明显无关
TITLE_BAD = re.compile(r"华北|上海|南京|缅泰|菲律宾|劳工|辞典|文学大系|星火燎原|文艺史料|"
                       r"晋察冀|山东|胶东|武汉|第五战区|淮河|巴丹|荷兰|慰安妇|旗人妇女|"
                       r"师哲|今井武夫|对华回忆录|罗振玉|建国大学|二人转")

ORAL_TITLE = re.compile(r"口述|回忆|亲历|见闻|忆|自述|供述")
CTX = 300


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
    bmap = {}
    for r in conn.execute("SELECT id,title,rel,pages FROM books"):
        t = r["title"] or ""
        if TITLE_OK.search(t) and not TITLE_BAD.search(t):
            bmap[r["id"]] = dict(r)
    print("candidate books:", len(bmap))

    per_book = {}
    total = 0
    cur = conn.execute("SELECT book_id,page_no,text FROM pages_fts")
    while True:
        rows = cur.fetchmany(4000)
        if not rows:
            break
        for r in rows:
            bid = r["book_id"]
            if bid not in bmap:
                continue
            t = r["text"] or ""
            if "粮" not in t:
                continue
            era = next((e for e in ERA if e in t), None)
            if not era and not YEARS.search(t):
                continue
            kw = next((k for k in LIANG if k in t), None)
            if not kw:
                continue
            total += 1
            lst = per_book.setdefault(bid, [])
            if len(lst) < 26:
                lst.append((r["page_no"], kw, era or "年代", t))
    print("era+liang pages:", total, " books:", len(per_book))

    ranked = sorted(per_book.items(), key=lambda kv: -len(kv[1]))
    oral = [(b, h) for b, h in ranked if ORAL_TITLE.search(bmap[b]["title"])]

    def dump(title, items, cap_books, per_book_show):
        lines = [f"\n\n## {title}"]
        for bid, hits in items[:cap_books]:
            info = bmap[bid]
            lines.append(f"\n### {info['title']}")
            lines.append(f"- 源: {info['rel']}")
            lines.append(f"- 共 {info['pages']} 页 | 粮+年代 同页 {len(hits)} 页")
            for pg, kw, era, t in hits[:per_book_show]:
                lines.append(f"\n**[第{pg}页]** 「{kw}」/ 年代词「{era}」")
                lines.append("> " + window(t, kw))
        return lines

    lines = ["# 抗联全文库 · 粮 × 伪满年代 精确抽取", ""]
    lines += dump("一、非口述类: 粮政/粮库/出荷/配给", ranked, 26, 4)
    lines += dump("二、口述·回忆类", oral, 22, 5)

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print("written:", OUT, OUT.stat().st_size, "bytes")
    print("\n--- 非口述 top15 ---")
    for b, h in ranked[:15]:
        print(f"{len(h):>4}  {bmap[b]['title'][:76]}")
    print("\n--- 口述/回忆 top15 ---")
    for b, h in oral[:15]:
        print(f"{len(h):>4}  {bmap[b]['title'][:76]}")
    conn.close()


if __name__ == "__main__":
    main()
