# Japanese domestic sulfonamide (サルファ剤 / スルフアミン剤) production, 1937–1945
## Research findings, sources and gaps — compiled from ~70 distinct searches + direct fetches

**Evidence labels used below**
- **[VERIFIED-FETCH]** — I fetched the page/document myself and quote its text.
- **[SNIPPET]** — text extracted by the search engine's index of the document; I could **not** open the document itself (image-only PDF, paywall, or blocked). Treat as strong but second-hand.
- **[CATALOGUE]** — bibliographic/archival metadata only (title, date, call number); contents not read.
- **[UNVERIFIED]** — secondary/tertiary web source, no archival or scholarly backing found.

**Hard technical limits hit in this session (important for follow-up work)**
- The sandbox has **no outbound network from the shell** (`Invoke-WebRequest` to any host fails), so no local PDF download/OCR was possible.
- `web_fetch` cannot read `application/pdf` ("unsupported content type"), **cannot read images** (`image/jpeg`), and truncates long pages at ~100 KB.
- J-Stage, NDL IIIF, NLM `digirepo`, and archive.org serve the key primary sources **only as scanned page images**. JACAR's search UI is a JS app whose query API is not reachable by URL parameter.
- Therefore: the *documents that contain the tonnage figures have been located and identified exactly*, but their **numeric contents could not be machine-read in this session**. They are readable by a human in a browser, or by an OCR-capable pipeline.

---

## 1. The known JACAR lead — CONFIRMED, with an important correction

**[VERIFIED-FETCH]** JACAR (アジア歴史資料センター) Ref. **C12121812500**
- Title: 「提出書類目録　化学工業統制会」
- Author: 三井化学工業株式会社 / 組織歴: 陸軍省
- Date: **昭和20年10月2日** (2 Oct 1945)
- Holding: 防衛省防衛研究所, 請求番号 **中央-軍事行政軍需動員-259**
- Parent 簿冊: Ref. C12121811700 「軍需品軍需工場の処理に関する綴」 (186 pp., 41 items)
- URL: https://www.jacar.archives.go.jp/das/meta/C12121812500

The 「内容」 (OCR'd contents) field reads verbatim:

> 提出書類目録 一 第二陸軍造兵廠荒尾製造所利用計画三井化学工業株式会社 一 陸軍坂市工場利用計画 三井化学工業株式会社 (日本文、英文各一通) 一 宇治製造所 日本窒素肥料株式会社 (日本文、英文各一通) 一岩鼻製造所 日本火薬製造株式会社 滌料部薬品部 (日本文、英文各一通) ○一岩鼻製造所転用願 日本火薬製造株式会社 火薬部 (日本文、英文各一通) ○一陸軍板橋火薬製造所王子場転用計画保土谷化学工業株式会社 (日本文、英文各一通) (表)第二陸軍造兵廠荒尾製造所利用計画 三井化学工業株式会社 商品ノ種類 能力(年) 設備使用範囲 職員 人員 現有材料 記事 医薬品 サツカリン 三〇〇屯 スルフアミン剤 三〇〇屯

**Numbers: サッカリン 300 屯/年 and スルフアミン剤 300 屯/年 (1 屯 = 1 ton).**

**Two corrections that matter for how this number is used:**
1. The column header is **能力(年)** = *annual capacity*, **not** actual output and **not** a wartime production figure.
2. The document is dated **2 October 1945** — six weeks *after* the surrender — and is part of a 陸軍省 file on 「軍需品軍需工場の処理」 (disposal/conversion of munitions plants). It is a **plant-utilisation ("転用"/"利用") plan for the former 第二陸軍造兵廠荒尾製造所**, i.e. a demobilisation-era capacity claim, not a wartime production record. Arao (荒尾, Kumamoto) is the Mitsui Mining/Mitsui Chemical site.
3. The same 目録 lists parallel plans for 陸軍坂市工場 (三井化学), 宇治製造所 (日本窒素肥料), 岩鼻製造所 (日本火薬), and 陸軍板橋火薬製造所王子場 (保土谷化学) — i.e. **five named plants with pharmaceutical/dye capability**, which is the closest thing to a "list of factories" that I verified.

**Neighbouring items in the same 簿冊** (identified from the 件名一覧 of C12121811700):
- C12121811900 軍需品今後の処理要領の検討
- C12121812000 「日本軍に於て引渡済…連合軍最高司令官覚書」に関する質疑応答概要 昭和20年9月28日
- C12121812300 陳情書 昭和20年9月10日 三菱化成工業株式会社取締役社長池田亀三郎
- C12121812400 東京第二陸軍造兵廠関係 昭和20年9月27日
- C12121812600 大蔵省国有財産部書類 目次

---

## 2. The primary statistical series that answers "tons per year" and "military vs civilian" — LOCATED

**[CATALOGUE]** These are the documents that actually contain the tonnage tables. All are Public Domain Mark, digitised from the USSBS record group (RG 243, Entry 41), held by the **National Diet Library Digital Collections**, call number **USB-13 R089A**, sub-series *The Effects of Bombing on Health and Medical Services in Japan (final report and original draft): Medical supplies*, **Report No. 12f**:

| Report | Title | NDL ID / link | Extent |
|---|---|---|---|
| 12f(1) | Lists of drugs in short supply, Japan (part Japanese) | NDL8319746 — https://dl.ndl.go.jp/pid/8319746 | — |
| **12f(2)** | **List of allotment of production – 43 essential drugs, 1942–45** ← *this is the military/civilian allocation* | NDL8319747 — https://dl.ndl.go.jp/pid/8319747 | — |
| **12f(3)** | **Actual annual production – 43 essential drugs – 1936–44** ← *this is tons per year* | NDL8319748 — https://dl.ndl.go.jp/pid/8319748 | **3 pages**, dated 1945.11, call no. USB-13 R089A: 0293–0295 |
| 12f(4) | Actual quarterly production – 43 essential drugs – 1941–44 | NDL8319619 — https://dl.ndl.go.jp/pid/8319619 | — |
| **12f(7)** | **Tables of production – various sulfa drugs – 1943–45 (part Japanese)** | NDL8319751 — https://dl.ndl.go.jp/pid/8319751 | **6 pages**, call no. USB-13 R089A: 0318–0323 |

- IIIF manifests are readable and I verified them directly, e.g. https://dl.ndl.go.jp/api/iiif/8319748/manifest.json and https://dl.ndl.go.jp/api/iiif/8319751/manifest.json (page counts, dates, call numbers above come from those manifests).
- Wikimedia Commons mirrors of the same NDL scans (Commons OCRs them, which is how the search engine can quote them):
  - https://commons.wikimedia.org/wiki/File:NDL8319748_Actual_annual_production-43_essential_drugs-_1936-44._Report_No._12f(3),_USSBS_Index_Section_2.pdf
  - https://commons.wikimedia.org/wiki/File:NDL8319746_Lists_of_drugs_in_short_supply,_Japan_(part_Japanese)._Report_No._12f(1),_USSBS_Index_Section_2.pdf
  - https://commons.m.wikimedia.org/wiki/File:NDL8319619_Actual_quarterly_production-43_essential_drugs-1941-44._Report_No._12f(4),_USSBS_Index_Section_2.pdf
- NDL Search records: https://ndlsearch.ndl.go.jp/books/R100000039-I8319748 and https://ndlsearch.ndl.go.jp/books/R100000039-I8319747

**I could not read the cells.** They are page images; NDL provides no OCR text layer for these USSBS items. This is the single highest-value follow-up: open 12f(2), 12f(3), 12f(4), 12f(7) at the NDL viewer and transcribe the rows — that yields tons/year 1936–44 plus the 1942–45 allotment split directly.

---

## 3. USSBS final report, Chapter XI "Medical Supplies" — military priority, in the report's own words

**[SNIPPET]** USSBS, *The Effects of Bombing on Health and Medical Services in Japan*, Medical Division, June 1947 (survey dates 24 Oct – 31 Nov 1945). Chapter XI "MEDICAL SUPPLIES" begins p. 225; tables run to No. 163.
- Full text: https://archive.org/download/effectsofbombing00unit/effectsofbombing00unit_bw.pdf (the table is on the PDF's p. 69 region)
- Alternate scan (typescript, Medical Division): https://digirepo.nlm.nih.gov/ext/dw/30710570R/PDF/30710570R.pdf

Two passages the search engine extracted verbatim from the digirepo typescript:

> "In the treatment of bacillary dysentery, the supply of sulfaguanadine was so small that it was used only by the Army, despite th…"

> "It will be noted from Tables 158 and 160 that production quotas for pharmaceuticals were set higher in 1943 and 1944 than in 194…"

And from the archive.org scan, the **structure** of the sulfa table (header row only, body truncated by the indexer):

> `<table><tr><td rowspan="2">Year</td><td colspan="3">Kilograms</td><td colspan="3">Percent</td></tr><tr><td>Military</td><td>Civi…`

i.e. **the report does tabulate sulfa-drug output in kilograms by year with an explicit Military / Civilian percentage split.**

**[VERIFIED-FETCH, partial]** I obtained the first ~100 KB of the archive.org OCR text through a CORS proxy. That covers pp. 1–20 (front matter, medical education, etc.). Chapter XI is beyond the truncation limit. The text I did get confirms the report's provenance, e.g. it lists the Medical Division staff (Lt-Col. Harold B. Hilton, A.U.S. = medical supplies) and the Table of Contents entry "XI. MEDICAL SUPPLIES 225".
- Search-engine mirror of the same text: https://www.scribd.com/document/60048460/USSBS-Report-12-Effects-of-Bombing-on-Health-and-Medical-Services-in-Japan-OCR [SNIPPET]

---

## 4. Japanese archival: the FY1943 state pharmaceutical supply-demand plan

**[VERIFIED-FETCH]** JACAR Ref. **A03023610400** (国立公文書館, 請求番号 **別00266100**)
- Title: 「昭和十八年度医薬品等需給計画策定ニ関スル件」
- Date: **昭和18年5月17日** (17 May 1943); 閣議決定 18 May 1943
- Author: **企画院総裁 鈴木貞一**, addressed to **内閣総理大臣 東条英機**
- 機密レベル: **極秘**; extent **78 pages**
- File: 公文別録・国家総動員計画及物資動員計画関係書類・昭和四年～昭和二十年・第二巻・昭和十八年 (parent Ref. A03023609800)
- URL: https://www.jacar.archives.go.jp/das/meta/A03023610400

「内容」 (cover/proposal text only — the plan tables are in the 78 image pages), verbatim:

> 企画院総裁上申 昭和十八年度医薬品等需給計画策定ニ関スル件 右閣議ニ供ス 通牒案 昭和十八年五月一八日 内閣書記官長 企画院総裁宛 依命通牒 昭和十七年五月十七日上申（企画院上申第一一九号）… 企計Ｍ物Ｆ〇〇三号 一連番号第１００号 企画院 …

**[VERIFIED-FETCH]** National Archives of Japan Digital Archive viewer for the same item:
- https://www.digital.archives.go.jp/img/631648 — 件名番号 009, 請求番号 別00266100, 年月日 昭和18年5月18日, 作成・取得者 内閣, 関連事項 閣甲百四十一, 利用制限 **公開**, 6 images.
- **Its 翻刻 (transcription/OCR) pane contains only 「就 就 就」** — i.e. effectively **no machine-readable text**; the plan must be read from the page images.

---

## 5. Company / capacity evidence

**[VERIFIED-FETCH]** Mitsui Chemicals corporate history timeline (三井化学「The Roots」年表) — records that in wartime the Ōmuta complex expanded 合成染料・硝酸・医薬品 (synthetic dyes, nitric acid, pharmaceuticals), and gives a calibration example of how fast Mitsui's organic-chemical lines scaled: indigo 695 t (1934), exported to China from 1935, 980 t (1937), collapsed to 57 t in 1943.
- https://jp.mitsuichemicals.com/jp/corporate/history/chronology/index.htm
- No sulfonamide tonnage is given.

**[UNVERIFIED]** 徳島県製薬協会「徳島のくすりの歴史」 — states that after Japan entered the war the military absorbed pharmaceuticals in large quantities, manufacturers' output was severely restricted, and in **昭和18年 (1943), under 企業整備令**, every Tokushima drug firm **except three** (大塚製薬工場, 富田製薬所, 富松製薬株式会社) was merged into a single control company, 「徳島県製薬株式会社」.
- https://www.toku-seiyakukyo.jp/history/
- This is the only concrete, dated evidence I found on **factory numbers / consolidation**, and it is a prefectural-industry source rather than an archival one.

**[VERIFIED-FETCH]** Prewar Army capacity surveys — the same 軍需動員 archival stratum, one decade earlier:
- JACAR Ref. **C12121615000** 「１５．資企Ｍ９０８１号（１） 昭和８年１２月１１日 応急計画調書目録医薬品全生産力調書」, 資源局企画部/資源局, 昭和8年12月11日, 防衛省防衛研究所 中央-軍事行政軍需動員-65, 7 pp. Its sampled table is *per-resource national annual capacity*: 硼酸 (boric acid) 全国 全生産力(年) **2,280 瓩**, 平時生産額 403,414 — with rows listed for 硼酸, キニーネ, 安息香酸… **Sulfonamides do not appear** (nothing was in production in 1933). https://www.jacar.archives.go.jp/das/meta/C12121615000
- JACAR Ref. **C12121614700** 「１３．資企Ｍ６０２１号 昭和９年１月３０日 ２月１日原料材料Ｄ班委員会（医薬品）開催通知」 — lists the four documents tabled on 1 Feb 1934: 医薬品現況調書 M9080, **医薬品全生産力調書 M9081**, 医薬品計画綱領研究案 M9082, 医薬品ニ関スル参考資料 M9083. https://www.jacar.archives.go.jp/das/meta/C12121614700
- JACAR Ref. **C12121612800** 「資企Ｍ９０６０号（１） 昭和９年１月２０日 応急計画調書工業薬品現況調書（２）」 — industrial-chemicals survey; sampled row 精製ベンゾール 全国 生産額 **6,722 瓲**, 輸入 1,928, 消費 8,650. https://www.jacar.archives.go.jp/das/meta/C12121612800
  → These three are the **methodological template** for how the Japanese state tabulated drug/chemical capacity (資源局 応急計画調書, unit 瓩/瓲, columns 全生産力(年)/平時生産額). No 1937–45 equivalent with sulfa rows was found in JACAR by keyword search.

---

## 6. Contemporary industry-press ("業界情勢") and technical literature — located, contents not machine-readable

**[CATALOGUE, VERIFIED-FETCH of the article landing pages]**
- 有機合成化学協会誌 **2巻2号 (1944) p.259–263**, 業界情勢 — a *wartime* industry-conditions piece. Article DOI 10.5059/yukigoseikyokaishi.2.2_259. https://www.jstage.jst.go.jp/article/yukigoseikyokaishi1943/2/2/2_2_259/_article/-char/ja
- 有機合成化学協会誌 **9巻11号 (1951) p.239–240**, 業界情勢 — https://www.jstage.jst.go.jp/article/yukigoseikyokaishi1943/9/11/9_11_239/_article/-char/ja
- 有機合成化学協会誌 **10巻10号 (1952) p.378–**, 13巻10号 p.489–, 14巻11号 p.686–, 18巻7号 (1960) p.422–, 40巻8号「ケミカルス覚え書き」 — further 業界情勢 / review items.

J-Stage serves these **only as scanned PDFs** with a JS-only "テキスト" tab; the PDF endpoint returns `application/pdf`, which this session's fetcher cannot open. **The 1944 業界情勢 article is the most likely single Japanese source to print wartime production numbers in tons — it should be read directly.**

**[SNIPPET]** 日本化学会誌 43巻9号 (1943) p.687 「スルフォンアミド剤發展の跡を眺めると Uleron (Domagk 1936), Sulfapyridin (Whitby 1938), Albucid (Dohrn 1938) が夫々一轉期を割してゐる」 / 「スルファニル酸アミド系化合物の合成と其の應用」 — a 1943 Japanese review of sulfonamide development. https://www.jstage.jst.go.jp/article/nikkashi1898/43/9/43_9_687/_pdf/-char/ja
**[SNIPPET]** 薬学雑誌 68巻3-4号 (1948) 「熔融法によるスルフアミン劑の製法」 https://www.jstage.jst.go.jp/article/yakushi1947/68/3-4/68_3-4_87/_article/-char/ja

**[VERIFIED-FETCH]** Legal framework: **染料医薬品製造奨励法**, 大正4年6月21日 法律第19号 (promulgated 19 June 1915, repealed 昭和29年 法律第138号). Art. 1 defines 染料 as aniline salt/aniline dyes/alizarin/synthetic indigo and 医薬品 as those designated by 勅令; Art. 2 grants subsidies for ten years to Japanese-controlled joint-stock companies manufacturing them; Art. 3 sets the subsidy at the amount needed to bring dividends to 8 % p.a. The Diet proposal summary (AI-generated on that site from the 第36回帝国議会 record) says the subsidy was extended to pharmaceuticals because the wartime cut-off of imports threatened **衛生上・軍事上** (public-health and military) needs.
- https://jahis.law.nagoya-u.ac.jp/lawdb/l/204a0019
This is the origin of the state-sponsored aniline→dye→drug industrial complex that sulfonamides later plugged into.

---

## 7. What I could NOT find — 查不到

| Question | Status | Closest circumstantial evidence |
|---|---|---|
| **Sulfonamide tons/year, 1937–1945 (any single year)** | **查不到.** No figure could be read from any accessible source. | USSBS Report 12f(3) *Actual annual production – 43 essential drugs – 1936–44* (NDL8319748) and 12f(7) *Tables of production – various sulfa drugs – 1943–45* (NDL8319751) contain exactly this; and USSBS final report Ch. XI Table ~158/159/160 tabulates sulfa output in **kilograms** by year with a **Military/Civilian %** split. |
| **Number of sulfonamide factories / plants** | **查不到** (no national count). | JACAR C12121812500 names **five** plants with drug/dye capability in the Oct-1945 conversion files (荒尾=三井化学, 坂市=三井化学, 宇治=日本窒素肥料, 岩鼻=日本火薬, 王子=保土谷化学). 徳島県 1943 企業整備令 merged all but **three** local firms into one control company — showing the direction of travel but not a national total. |
| **Aniline supply (t/year)** | **查不到.** | JACAR C12121612800 (Jan 1934) gives 精製ベンゾール 全国 6,722 瓲/yr and the 応急計画調書 methodology; USSBS *Chemicals in Japan's War* (Report 49, NDL pid 8818678; Report 50 appendix, NDL pid 8818998) is the obvious place for wartime aniline/benzene capacity, but is image-only. |
| **Acetic anhydride supply (t/year)** | **查不到.** | Only an unrelated snippet about 日本合成化学工業 / 三池染料工業所 and acetic-acid derivatives in a Nagoya Gakuin University repository paper. |
| **p-Aminobenzenesulfonamide (スルファニルアミド) feedstock volumes** | **查不到.** No source at all found. |
| **Military vs civilian split, in numbers** | **查不到 numerically**, but the *existence and form* of the statistic is documented. | USSBS 12f(2) *List of allotment of production – 43 essential drugs, 1942–45* (NDL8319747, public domain) is the allotment document. Verbal confirmation: "the supply of sulfaguanadine was so small that it was used only by the Army". |

---

## 8. Recommended next steps (highest yield first)

1. **Open and transcribe USSBS 12f(2), 12f(3), 12f(4), 12f(7)** at the NDL viewer (pids 8319747, 8319748, 8319619, 8319751). Public domain, no login, no copyright issue. This alone answers tons/year and the allotment question.
2. **Read Chapter XI "Medical Supplies" of the USSBS final report** (archive.org `effectsofbombing00unit`, pp. 225–233 + Tables 158–163) for the English narrative and the Military/Civilian percentage table.
3. **Pull 有機合成化学協会誌 2巻2号 (1944) 業界情勢, pp. 259–263** — the wartime Japanese industry report.
4. **Order/reproduce 国立公文書館 別00266100** (JACAR A03023610400, 78 pp., 極秘, 17 May 1943) — the FY1943 医薬品等需給計画 with its 別紙 tables; the OCR is unusable, so images only.
5. **Mine USSBS 12f(1) "Lists of drugs in short supply"** for the civilian-shortage side of the allocation story.
6. Search JACAR by hand in the browser for 「スルフアミン」 (the OCR spelling with フア, not ファ) — the site's JS search does index the 内容 field, but its query API is not URL-addressable, so it must be done interactively.

---

## Appendix — every distinct search query issued this session

Japanese: サルファ剤 生産量 昭和 トン 統計 / スルファミン 生産 昭和18年 昭和19年 / 医薬品 生産動態統計 昭和 サルファ剤 / サルファ剤 増産 軍需 昭和17年 / 有機合成化学協会誌 業界情勢 サルファ剤 / 日本薬学会誌 サルファ剤 製造 昭和 / スルファミン 製造工場 昭和 一覧 / サルファ剤 自給 日本 通商産業省 昭和 / 薬事工業生産動態統計 昭和 サルファ / 日本 スルファ剤 生産能力 年産 / 武田薬品 サルファ剤 生産 昭和 / 三共 スルファミン 生産量 / 山之内製薬 サルファ剤 生産 自給 / 住友化学 スルファミン / 三井化学 スルファミン 荒尾 / 日本窒素肥料 スルファミン / 医薬品 物資動員計画 昭和 サルファ剤 / スルファチアゾール 生産 日本 昭和 / サルファピリジン 国産 昭和 製造 / サルファ剤 統制 配給 昭和18年 医薬品 / 化学工業統制会 医薬品部会 スルファミン / 新村拓 医薬品 物資動員計画 サルファ剤 生産 / アニリン 生産 日本 昭和18年 トン / 無水酢酸 生産 日本 昭和 トン / スルファミン剤 生産 昭和17年 昭和18年 増産 / サルファ剤 国内自給 達成 昭和 年産 / 日本 サルファ剤 生産 昭和18年 トン 軍需 民需 / スルファミン剤 製造工場 数 昭和 日本 / 医薬品 生産 昭和19年 サルファ剤 減少 / サルファ剤 開発 生産 歴史 日本 論文 国産化 / スルファニルアミド 国産化 日本 昭和 歴史 / 日本 製薬 産業史 サルファ剤 生産量 統計 / 医薬品 軍需 民需 配分 昭和 サルファ剤 / 日本 無水酢酸 生産 昭和 トン / 日本 アニリン 生産量 昭和18年 / 医薬品 生産額 昭和18年 日本 統計 製薬 / 製薬会社 統廃合 昭和 企業整備 数 1943 / スルファチアゾール 国産 日本 昭和 製造 開始 / 陸軍 医薬品 調達 昭和19年 サルファ剤 需給 / 昭和18年度医薬品等需給計画策定ニ関スル件 閣議決定 全文 / 医薬品等需給計画 昭和18年度 閣議決定 サルファ剤 増産 / 有機合成化学協会誌 昭和18年 1巻 業界情勢 医薬品 生産 / 厚生省 医薬品 増産 昭和18年 サルファ剤 計画 トン / 日本薬剤師会雑誌 昭和 サルファ剤 統制 配給 生産 / 化学工業統制会 医薬品部会 生産計画 昭和18年 / サルファ剤 原料 アニリン 無水酢酸 日本 昭和 製造 / 医薬品 工場数 昭和18年 製薬工場 統合 数 / 日本 スルファニルアミド 製造 開始 昭和 国産第一号 / サルファ剤 民需 不足 闇 価格 昭和19年 / 「スルフアミン」 「瓲」 生産 昭和 日本 / 「スルファミン剤」 生産 「瓲」 昭和 年産 / 染料医薬品製造奨励法 大正4年 サルファ剤 国産 奨励 医薬品 自給 / 化学工業統制会 医薬品部会 昭和18年 設立 統制 / 日本薬史学会 製薬 昭和 サルファ剤 国産 生産 統計 統制 / 薬事工業生産動態統計 開始 昭和23年 医薬品 生産統計 歴史 / 日本のサルファ剤 生産量 は昭和18年 昭和19年 に何トンでしたか / サルファ剤 生産量 トン 日本 1944年 統計値 / 日本 医薬品 生産指数 昭和 サルファ剤 USSBS 統計 / スルファミン 生産 屯 年産 昭和 日本 / サルファ剤 月産 トン 昭和 製薬 / サルファ剤 生産高 昭和19年 医薬品 統計 / 有機合成化学協会誌 業界情勢 スルファミン 生産 屯 / 日本 サルファ剤 生産 昭和 軍 民 配分 資料 / スルファミン 昭和19年 生産 日本 トン
English: sulfonamide production Japan 1943 1944 tons wartime / Japan drug production statistics 1941 1942 sulfa / jacar スルフアミン剤 屯 能力 / jacar 化学工業統制会 医薬品 / site:jacar.archives.go.jp (スルフアミン / スルフアミド / 宇治製造所 利用計画 / 化学工業統制会 / サルファ剤 生産 陸軍 / スルファミン 製造能力 / 医薬品 増産 昭和18年 / スルフアミン剤 / 医薬品 屯 能力 年 / 利用計画 製造所 昭和20年 / 宇治製造所 日本窒素肥料) / "Sulfa drugs" Japan production table Military Civilian Percent 1943 1944 1945 kilograms / effectsofbombing00unit sulfa drugs 1943 1944 1945 kilograms military civilian / Japan wartime production "sulfa drugs" tons 1943 1944 1945 statistics / "It will be noted from Tables 158 and 160" production quotas pharmaceuticals / "sulfaguanadine was so small that it was used only by the Army, despite" / site:collections.nlm.nih.gov sulfa Japan production / collections.nlm.nih.gov ocr 30710570R medical services Japan / NLM digital collections Japanese pharmaceutical production sulfonamide report / "The Effects of Bombing on Health and Medical Services in Japan" full text / USSBS Report 12f(7) sulfa drugs production 1943 1945 / dl.ndl.go.jp スルファ剤 生産 USSBS / "Effects of Bombing on Health and Medical Services in Japan" sulfa drugs military civilian table / "Actual annual production" "43 essential drugs" 1936-44 USSBS sulfa / "List of allotment of production" "43 essential drugs" 1942-45 USSBS / NDL8319748 OR NDL8319747 commons USSBS essential drugs / USSBS "essential drugs" Japan production 1936 1944 sulfathiazole sulfapyridine tons / "Report No. 12f(2)" allotment production 43 essential drugs dl.ndl.go.jp pid / "Report No. 12f" USSBS Medical supplies 国立国会図書館デジタルコレクション / dl.ndl.go.jp pid 8319747 OR 8319749 OR 8319750 USSBS medical supplies / "Chemicals in Japan's War" USSBS aniline production capacity tons Japan 1944 / NDL8819701 aniline acetic anhydride production Japan wartime / "Preliminary draft of Report on Chemicals in Japan's War" pharmaceuticals drugs / USSBS "Chemicals in Japan's War" Report 49 pharmaceutical industry Japan capacity / NDL8818998 Chemicals in Japan's War appendix oil chemical division drugs production / "Table 159" sulfa drugs Japan production 1943 1944 1945 USSBS / Cohen "Japan's Economy in War and Reconstruction" drug production sulfa / "production quotas for pharmaceuticals were set higher in 1943 and 1944" Japan / How many tons of sulfa drugs did Japan produce in 1944? wartime production volume / Japan sulfonamide production volume tons per year 1943 1944 1945 statistics / "Effects of Bombing on Health and Medical Services in Japan" dokumen.pub OR vdoc.pub OR epdf OR text / "medical supplies" chapter USSBS Japan 1945 sulfa drugs quota production text online

**Total: 115 distinct search queries executed** (plus ~45 direct document fetches).
