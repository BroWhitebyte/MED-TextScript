# -*- coding: utf-8 -*-
"""
中医·风寒·咳嗽 检索 第一轮:
  A) 书目总表里所有 医/药/本草/方剂/卫生 类书名
  B) 全库单遍扫描, 统计各组关键词的页命中与书目排名
输出: data\kanglian_tcm_scan.json  +  控制台摘要
"""
import csv
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
CSV = r"I:\抗联整理_OCR成果\_index\书目总表.csv"
OUT = Path(r"C:\Users\white\Downloads\DS workspace\data\kanglian_tcm_scan.json")

KW = {
    "医者药铺": ["中医", "汉医", "国医", "中药", "汉药", "草药", "药材", "药铺",
                 "中药铺", "药房", "药局", "坐堂", "郎中", "药王"],
    "病证": ["风寒", "伤风", "感冒", "着凉", "受寒", "咳嗽", "气喘", "痰",
             "发热", "发烧", "头疼", "头痛", "伤寒"],
    "治法": ["偏方", "土方", "单方", "验方", "汤药", "煎药", "拔罐", "刮痧",
             "针灸", "艾灸", "推拿", "姜汤", "红糖", "熬药"],
    "药名": ["麻黄", "桂枝", "甘草", "杏仁", "生姜", "陈皮", "半夏", "桔梗",
             "贝母", "川贝", "枇杷", "桑白皮", "紫苏", "荆芥", "防风", "薄荷",
             "柴胡", "黄芩", "连翘", "银花", "板蓝根", "葱白", "冰糖", "贯众"],
    "方剂": ["麻黄汤", "桂枝汤", "小青龙", "银翘散", "桑菊", "二陈汤", "三拗汤",
             "麻杏石甘", "通宣理肺", "杏苏散", "败毒散", "止咳"],
    "制度机构": ["药商", "生药", "医师法", "药剂师", "满洲医科大学", "汉医讲习",
                 "药柜", "戥子", "药王庙"],
    "抗联医药": ["卫生员", "密营医院", "伤病员", "采药", "红伤药", "医务所"],
    "时代标记": ["伪满", "康德", "昭和", "满洲国"],
}
TITLE_MED = ["中医", "中药", "汉医", "汉药", "本草", "方剂", "医案", "医话",
             "药", "卫生", "医院", "医学", "针灸", "脉", "病"]


def main():
    t0 = time.time()
    rows = list(csv.DictReader(open(CSV, encoding="utf-8-sig", newline="")))
    print(f"书目总表 {len(rows)} 条")
    print("\n=== A. 书名含 医/药/本草/方剂/卫生 等 ===")
    seen = set()
    for r in rows:
        t = r["书名"]
        if any(m in t for m in TITLE_MED) and t not in seen:
            seen.add(t)
            print("  ", t[:120])

    conn = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    bmap = {r["id"]: dict(r) for r in conn.execute("SELECT id,title,rel,pages FROM books")}

    flat = [(g, k) for g, ks in KW.items() for k in ks]
    pagecnt = Counter()
    bookcnt = {g: Counter() for g in KW}
    snips = {}
    npages = 0

    cur = conn.execute("SELECT book_id,page_no,text FROM pages_fts")
    while True:
        batch = cur.fetchmany(4000)
        if not batch:
            break
        for r in batch:
            npages += 1
            t = r["text"] or ""
            if not t:
                continue
            bid = r["book_id"]
            for g, k in flat:
                if k in t:
                    pagecnt[k] += 1
                    bookcnt[g][bid] += 1
                    key = (k, bid)
                    lst = snips.get(key)
                    if lst is None:
                        snips[key] = [(r["page_no"], t)]
                    elif len(lst) < 2:
                        lst.append((r["page_no"], t))
        if npages % 200000 < 4000:
            print(f"  ...{npages}  {time.time()-t0:.0f}s", flush=True)

    print(f"\n扫描 {npages} 页, {time.time()-t0:.0f}s")
    print("\n=== B. 词页命中(前 45) ===")
    for k, v in pagecnt.most_common(45):
        print(f"  {k}\t{v}")

    print("\n=== C. 各组书目数 ===")
    for g in KW:
        print(f"  {g}\t{len(bookcnt[g])}")

    # 只看东北/伪满/抗联/文史资料/医 类书名, 排除无关大部头
    OK = ("东北", "伪满", "满洲", "抗联", "黑龙江", "吉林", "辽宁", "哈尔滨", "长春",
          "文史资料", "县志", "日本", "回忆", "口述", "抗日", "革命", "医", "药",
          "卫生", "方", "本草", "档案", "史料")
    BAD = ("华北", "上海", "南京", "缅泰", "辞典", "文学大系", "星火燎原", "文艺史料",
           "晋察冀", "山东", "胶东", "武汉", "巴丹", "荷兰", "慰安妇", "师大", "数学")

    out = {"pages": npages, "page_hits": dict(pagecnt.most_common()),
           "group_books": {g: len(bookcnt[g]) for g in KW}, "groups": {}}
    for g in KW:
        items = []
        for bid, n in bookcnt[g].most_common(80):
            ti = bmap.get(bid, {}).get("title") or ""
            if not any(o in ti for o in OK) or any(b in ti for b in BAD):
                continue
            items.append((n, bid, ti))
        out["groups"][g] = [{"title": ti, "hits": n} for n, _, ti in items[:22]]
        print(f"\n=== D.{g} 候选书 ===")
        for n, bid, ti in items[:18]:
            print(f"  {n:>5}  {ti[:88]}")
            for k in KW[g]:
                lst = snips.get((k, bid))
                if lst:
                    print(f"           [{k}] p{lst[0][0]}")
                    break

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print("\nwritten:", OUT)
    conn.close()


if __name__ == "__main__":
    main()
