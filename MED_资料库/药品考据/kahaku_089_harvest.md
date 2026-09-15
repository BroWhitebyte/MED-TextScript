# Harvest: 梅津浩平「医薬品創製技術の系統化調査」国立科学博物館「技術の系統化調査報告書」第22集 (2015)

## Access status (IMPORTANT, read first)

- PDF: https://sts.kahaku.go.jp/albums/abm.php?d=3254&f=abm00010800.pdf&n=089.pdf (JA, 7.1 MB)
- PDF: https://sts.kahaku.go.jp/diversity/document/system/pdf/089_e.pdf (EN)
- Landing page: https://sts.kahaku.go.jp/research/taikei/IX.html — **fetched successfully (HTTP 200)**
- Direct PDF retrieval: **IMPOSSIBLE from this session.**
  - `web_fetch` returns `unsupported content type application/pdf` / `TypeError: fetch failed`.
  - Shell network is blocked (`Invoke-WebRequest` → "基础连接已经关闭: 接收时发生错误" on both HTTPS and HTTP), so no local PDF download / `pdftotext`.
  - PDF-to-text proxies (r.jina.ai) are also unreachable.
  - No HTML full text of this report exists.
- Therefore content was harvested **only** via `web_search` title-snippets of the two PDFs. The search index surfaces only **1–2 distinct passages per PDF** for every one of ~35 differently-worded queries attempted. See "Negative results" below.

## VERBATIM snippets harvested from the TARGET report

### Snippet 1 — ENGLISH version (indexed from p.40 of 089_e.pdf)
URL: https://sts.kahaku.go.jp/diversity/document/system/pdf/089_e.pdf#40#9
(wording of query that surfaced it: `"Company records indicate that many Japanese pharmaceutical companies also caught hold of the information on Prontosil"`)

> "Company records indicate that many Japanese pharmaceutical companies also caught hold of the information on Prontosil and leapt ..."

- TRUNCATED with an ellipsis by the search engine. The remainder of the sentence is **not obtained**.
- A second, shorter snippet from the same PDF page anchor is a bare fragment:
  URL: https://sts.kahaku.go.jp/diversity/document/system/pdf/089_e.pdf#40#12 → text: "quickly as possible"
- Reconstructable reading (NOT verbatim, INFERENCE ONLY): "...also caught hold of the information on Prontosil and leapt [into sulfonamide production/into the sulfonamide business] as quickly as possible."

### Snippet 2 — JAPANESE version (indexed from p.45 of the report)
URL: https://sts.kahaku.go.jp/albums/abm.php?d=3254&f=abm00010800.pdf&n=089.pdf#45#14

> 「国産の医薬産業は1909年に特許法が改正されて工程特許制度がとられた関係上、先進諸外国で開発された新薬の工程を変えて国内で製造すれば国内販売が可能であった」

(Complete sentence; not truncated. Content: Japan's 1909 Patent Law revision adopted a **process-patent (工程特許) system**, so a drug developed abroad could be made and sold domestically as long as the **production process was altered**.)

### Snippet 3 — Japanese version, title-page confirmation
URL: https://sts.kahaku.go.jp/albums/abm.php?d=3254&f=abm00010800.pdf&n=089.pdf#45#1 → text: 「医薬品創製技術の系統化調査」
URL: https://sts.kahaku.go.jp/diversity/document/system/pdf/089_e.pdf#40#1 → text: "Systematized Survey on the History of Drug Discovery with Technical Development"

## Landing page description (full text, fetched OK)
https://sts.kahaku.go.jp/research/taikei/IX.html — 「医薬品創製技術の系統化調査」梅津 浩平 第22集 2015:

> 「今までの人生で薬の世話になったことがない人はほとんどいないであろう。人類と密接な関係にある医薬であるが、その歴史は古い。本論文は医聖ヒポクラテスや古代中国の時代の医薬の記述から始まっているが、その中心はパスツール、エールリッヒ等によって拓かれた近代創薬にある。構成は大きく２つに分けることができる。３章までの、近代創薬にいたる一般的歴史と、４章の、生活習慣病の薬についての歴史記述である。因みに４章の対生活習慣病薬としては、糖尿病薬、降圧薬、高脂血症薬、血液系作用薬、痛風・高尿酸血症薬の創薬の歴史を綴っている。…創薬の歴史には病原菌説、免疫、抗生物質などといった明確なパラダイムが存在することである。」

Key structural fact: per the museum's own summary the report is organised as **chs.1–3 = general history up to modern drug discovery; ch.4 = lifestyle-disease drugs** (diabetes, antihypertensives, lipid-lowering, blood-acting, gout/hyperuricemia). Therefore the **sulfonamide/Prontosil passage sits inside chs.1–3 (modern drug discovery)**, near JA p.45 / EN p.40 — the report is NOT primarily a sulfonamide monograph.
Images on the landing page: 089_01 アスピリンの構造図, 089_02 ピタバスタチの構造図, 089_03 生薬から現代薬までの流れ.

## Target questions (a)–(f): status
- (a) When/how Japan learned of Prontosil — **partially obtained**: Snippet 1 (EN, "company records indicate … caught hold of the information on Prontosil"), wording hedged ("indicate"). No date given in any retrievable text.
- (b) Which companies / licences / years — **NOT OBTAINED** from the report. Report text names no company in any retrievable snippet.
- (c) Japanese trade names of sulfonamides — **NOT OBTAINED** from the report.
- (d) Japanese domestic production volumes/capacity — **NOT OBTAINED** from the report (no numeric text surfaced).
- (e) Sulfadiazine in Japan — **NOT OBTAINED** from the report.
- (f) Military (陸軍/海軍) and sulfonamides — **NOT OBTAINED** from the report; no 陸軍/海軍 text surfaced in ~10 dedicated queries.

## Negative results (queries that returned NOTHING new from the report — evidence of index ceiling)
Searched (EN): "sulphonamide" variant; "sulfapyridine Japan 1939"; "albucid Japan"; "Yamanouchi/Takeda/Sankyo/Shionogi/Daiichi/Meiji + Prontosil/license"; "Japanese Army/Navy + sulfonamide"; "domestic production + sulfonamide + tons"; "Japanese trade names + sulfonamide"; "process patent + Germany + Japan 1909"; site-scoped `site:sts.kahaku.go.jp 089_e.pdf sulfonamide`; page-anchor guesses `"089_e.pdf#41/#42/#39"`; Google-Books/CiNii/NDL/J-GLOBAL/Internet Archive routes.
Searched (JA): サルファ剤 国産化 陸軍/海軍; プロントジル 日本 情報/輸入/ライセンス; スルファミン 日本 製造開始; サルファダイアジン 國産; 日本 サルファ剤 生産量 トン; 商品名 一覧; ドイツ特許 回避; 陸軍軍醫學校/海軍軍醫; and ~20 further paraphrase permutations.
Result: the same 2 report snippets, or unrelated documents. **No new report text was extractable.**

## Lead that may unlock the report body
- NDL (National Diet Library) holds the print volume; two catalogue records exist and may expose a table of contents: https://ndlsearch.ndl.go.jp/books/R100000039-I11546701 and https://ndlsearch.ndl.go.jp/books/R100000039-I11546699 (both `web_fetch`-blocked from here; a normal browser or a working fetch would resolve them).
- Other library records: 山形県立図書館 opac.lib.pref.yamagata.jp (bibid=1103452524), 福岡市総合図書館 bibid=1101368867, 神奈川県立 klnet bibid=1104592698, 熊本県立, 水産大学校, 農林水産研究情報.
- CiNii journal record for the series: https://ci.nii.ac.jp/ncid/AA12031302
- A future session **with a working PDF fetcher** (or a browser) can get the whole text; the PDF is text-based (not a scan) — proven by the clean extractable Japanese sentence above.
