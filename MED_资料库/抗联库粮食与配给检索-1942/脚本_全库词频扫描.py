# -*- coding: utf-8 -*-
"""
单遍扫描抗联全文库索引, 统计"粮食/粮库"相关词的全部命中。
只读打开 library.db, 顺序读 pages_fts 一次, 在内存里对每个词做子串判定,
避免对 4.3GB 索引做十几次全表 LIKE。
输出: data\kanglian_liang_scan.json
"""
import json
import sqlite3
import sys
import time
from collections import Counter
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

DB = r"I:\抗联整理_OCR成果\_index\library.db"
OUT = Path(r"C:\Users\white\Downloads\DS workspace\data\kanglian_liang_scan.json")

KW = {
    "粮库": ["粮库", "粮仓", "粮食库", "粮囤", "粮垛"],
    "粮食": ["粮食", "食粮", "粮谷", "粮秣"],
    "粮店": ["粮店", "粮栈", "粮行", "配给店"],
    "军粮": ["军粮", "征粮", "筹粮", "抢粮", "藏粮", "送粮", "借粮", "打粮", "运粮"],
    "断粮": ["断粮", "缺粮", "没粮", "无粮", "绝粮"],
    "出荷": ["出荷", "出荷粮", "粮食出荷"],
    "配给": ["配给", "配給", "统制配给"],
    "食物": ["橡子面", "橡子", "苞米", "苞米面", "高粱米", "高粱", "大豆", "大米", "面粉", "窝头", "糠", "树皮", "草根", "野菜"],
    "饥饿": ["饿死", "饿", "饥饿", "挨饿", "饥荒"],
    "日伪粮政": ["粮政", "粮食统制", "农产品统制", "农产物", "兴农合作社", "粮谷奉纳"],
    "ERA1942": ["1942", "一九四二", "康德九年", "昭和十七年"],
    "ERA1941": ["1941", "一九四一", "康德八年", "昭和十六年"],
    "口述回忆": ["口述", "回忆", "亲历", "见闻", "忆述", "访谈", "记略"],
}
ORAL_MARK = ["口述", "回忆", "亲历", "见闻", "忆述", "访谈"]
LIANG_MARK = ["粮", "食", "饥", "饿"]


def snippet(text, kw, width=110):
    i = text.find(kw)
    if i < 0:
        return text[:width].replace("\f", " ").replace("\n", " ")
    a = max(0, i - width // 2)
    s = text[a:a + width].replace("\f", " ").replace("\n", " ")
    return ("…" if a else "") + s + "…"


def main():
    t0 = time.time()
    conn = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row

    cols = [r[1] for r in conn.execute("PRAGMA table_info(books)")]
    print("books cols:", cols)
    bmap = {}
    for r in conn.execute("SELECT * FROM books"):
        d = dict(r)
        bmap[d["id"]] = {
            "title": d.get("title"),
            "rel": d.get("rel"),
            "pages": d.get("pages"),
            "src_pdf": d.get("src_pdf"),
        }
    print(f"books loaded: {len(bmap)}")

    flat = [(g, k) for g, ks in KW.items() for k in ks]
    print(f"keywords: {len(flat)}")

    pages_total = 0
    # per keyword: page count, per-book Counter, snippets {(kw,book): [..]}
    pagecnt = Counter()
    bookcnt = {g: Counter() for g in KW}
    snips = {}
    book_has = {g: set() for g in KW}
    era_pairs = Counter()

    cur = conn.execute("SELECT book_id, page_no, text FROM pages_fts")
    while True:
        rows = cur.fetchmany(4000)
        if not rows:
            break
        for r in rows:
            pages_total += 1
            t = r["text"] or ""
            if not t:
                continue
            bid = r["book_id"]
            hit_groups = set()
            has_l = ("粮" in t) or ("食" in t)
            for g, k in flat:
                if k in t:
                    pagecnt[k] += 1
                    bookcnt[g][bid] += 1
                    book_has[g].add(bid)
                    hit_groups.add(g)
                    key = (k, bid)
                    lst = snips.get(key)
                    if lst is None:
                        snips[key] = [{"page": r["page_no"], "text": snippet(t, k)}]
                    elif len(lst) < 3:
                        lst.append({"page": r["page_no"], "text": snippet(t, k)})
            if has_l:
                if "1942" in t or "康德九年" in t or "昭和十七年" in t:
                    era_pairs["粮+1942"] += 1
                if "口述" in t or "回忆" in t or "亲历" in t:
                    era_pairs["粮+口述回忆"] += 1
        if pages_total % 100000 < 4000:
            print(f"  ...{pages_total} pages  {time.time()-t0:.0f}s", flush=True)

    print(f"pages scanned: {pages_total}  {time.time()-t0:.0f}s")

    # 书目级汇总
    liang_books = set()
    for g in ("粮库", "粮食", "粮店", "军粮", "断粮", "出荷", "配给", "食物", "饥饿", "日伪粮政"):
        liang_books |= book_has[g]

    out = {
        "db": DB,
        "books_total": len(bmap),
        "pages_total": pages_total,
        "scan_seconds": round(time.time() - t0, 1),
        "keyword_page_hits": dict(pagecnt.most_common()),
        "group_book_counts": {g: len(book_has[g]) for g in KW},
        "era_cooccur": dict(era_pairs),
        "liang_books_total": len(liang_books),
        "groups": {},
    }

    for g in KW:
        top = bookcnt[g].most_common(60)
        items = []
        for bid, n in top:
            info = bmap.get(bid, {})
            title = info.get("title") or ""
            items.append({
                "title": title,
                "rel": info.get("rel"),
                "pages": info.get("pages"),
                "hit_pages": n,
                "is_oral": any(m in title for m in ORAL_MARK),
                "snippets": [],
            })
        # 补每本书若干片段(取该组内任一关键词的片段)
        for it in items:
            bid = next((b for b, _ in top if (bmap.get(b, {}).get("title") or "") == it["title"]), None)
            if bid is None:
                continue
            for k in KW[g]:
                lst = snips.get((k, bid))
                if lst:
                    it["snippets"].append({"kw": k, "hits": lst})
                    if len(it["snippets"]) >= 2:
                        break
        out["groups"][g] = {"book_count": len(book_has[g]), "top_books": items}

    # 书名含"粮/食"或"口述/回忆"的书
    title_hits = {"grain_title": [], "oral_title": []}
    for bid, info in bmap.items():
        tt = info["title"] or ""
        if any(m in tt for m in LIANG_MARK):
            title_hits["grain_title"].append(tt)
        if any(m in tt for m in ORAL_MARK):
            title_hits["oral_title"].append(tt)
    out["title_hits"] = title_hits

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print("written:", OUT)
    print("elapsed:", round(time.time() - t0, 1), "s")

    print("\n=== 词页命中 ===")
    for k, v in pagecnt.most_common(40):
        print(f"{k}\t{v}")
    print("\n=== 组书数 ===")
    for g in KW:
        print(f"{g}\t{len(book_has[g])}")
    print("\n=== 共现 ===", dict(era_pairs))
    print("\n=== 粮食类书 top20 (粮食组) ===")
    for it in out["groups"]["粮食"]["top_books"][:20]:
        print(f'{it["hit_pages"]:>5}  {it["title"]}')
    print("\n=== 粮库组 top30 ===")
    for it in out["groups"]["粮库"]["top_books"][:30]:
        print(f'{it["hit_pages"]:>5}  {it["title"]}')
    print("\n=== 口述/回忆书名 ===")
    for tt in sorted(title_hits["oral_title"]):
        print("  ", tt)
    conn.close()


if __name__ == "__main__":
    main()
