# Recovery attempt: tkobays 「サルファ剤、日本登場」 blog series

**Result headline: the BODY TEXT of the tkobays blogspot pages could NOT be recovered.**
What WAS recovered: (1) the complete verified series structure with real URLs, (2) one verbatim
snippet from a *different* site that is topically identical, (3) a set of substitute primary
sources that cover the same four questions the blog series asks.
Nothing below is fabricated. Every quote is labeled by source class.

---

## 1. Access map (all measured in this environment, not assumed)

### BLOCKED — every one returns `Error: web fetch failed: TypeError: fetch failed`
| Route | Target |
|---|---|
| `https://tkobays.blogspot.com/2017/07/blog-post_15.html` | direct |
| `...html?m=1`, `...html?m=0`, `...html?output=amp` | Blogspot mobile / AMP variants |
| `http://tkobays.blogspot.com/...` | plain HTTP |
| `https://tkobays.blogspot.com/feeds/posts/default?alt=json` | Blogger Atom/JSON feed |
| `*.blogspot.com.translate.goog`, `translate.google.com/translate?u=` | Google Translate proxy |
| `r.jina.ai/https://...`, `r.jina.ai/https%3A%2F%2F...` | Jina reader proxy |
| `www.textise.net/showText.aspx?strURL=` | 403 Cloudflare block page (reachable, refused) |
| `12ft.io/proxy?q=` | paywall proxy |
| `webcache.googleusercontent.com/search?q=cache:...` | Google cache |
| `web.archive.org/web/2020id_/...`, `/web/2018/...`, `/web/20180101000000*/...`, `/cdx/search/cdx?...`, `/all/20111101190714/...` | Wayback (all path shapes) |
| `archive.ph/newest/...` | archive.today |
| `us.archive.org` | archive.org mirror |
| `b.hatena.ne.jp` (entry + full-text search) | Hatena Bookmark |
| `www.google.com/search?q=`, `cse.google.com` | Google / CSE |
| `html.duckduckgo.com/html/?q=`, `lite.duckduckgo.com/lite/?q=` | DuckDuckGo HTML |
| `search.brave.com`, `www.startpage.com`, `www.qwant.com`, `www.mojeek.com` (403), `presearch` | other engines |
| `searx.be`, `searx.tiekoetter.com` | SearXNG instances |
| `minakoe.jp` (blog ranking), `search.rakuten.co.jp`, `search.goo.ne.jp` | Japanese portals |
| `ja.wikipedia.org`, `ja.m.wikipedia.org` | Japanese Wikipedia |

### REACHABLE but produced nothing usable
- `cn.bing.com/search?q=...` → HTTP 200 but Chinese-region junk; `www.bing.com` is force-redirected
  to `cn.bing.com` and the redirect is not followed, even with `setmkt=ja-JP&setlang=ja&ensearch=1`.
- `yandex.com/search` → SmartCaptcha wall.
- `www.baidu.com/s?wd=` → HTTP 200 but an empty JavaScript shell (no results in HTML).
- `www.sogou.com` → cross-origin redirect loop (`http://` ↔ `https://`).
- `search.naver.com` → HTTP 200, but Naver has **zero** index entries for "tkobays".
- `search.marginalia.nu` → redirects to `marginalia-search.com`, English-only index, "bot activity" gate.
- `search.aol.com` → HTTP 404.
- `collections.nlm.nih.gov/ocr/...` → HTTP 202, empty body; `PMC` → reCAPTCHA; `PMC/*/pdf/*.pdf` →
  "Preparing to download" interstitial.
- `jstage` **PDF** URLs → `Error: unsupported content type "application/pdf"` (the fetch tool cannot
  return PDFs; only J-STAGE *HTML article pages* work).

### THE ONLY WORKING DISCOVERY CHANNEL
`web_search`. It returns Google-indexed results. **Critical finding about its output format:**
it returns the indexed **`<title>`** of each result. For blogspot pages that is just the post title —
**no body-text snippet is exposed at all**, so the snippet-harvesting method described in the task
cannot extract blog prose. (It *does* expose body text when the indexed document's title IS a body
sentence — exploited below for PDFs.)

---

## 2. VERIFIED series structure (class (c): inference about existence from the search index;
## the URLs and titles in quotes are (a)-class, quoted verbatim from the search index)

The task brief listed 4 URLs. Three more parts exist. The numbering is inconsistent on the blog:
part 1 is untitled as a "part".

| Part | URL | Indexed title |
|---|---|---|
| 1 | `https://tkobays.blogspot.com/2017/07/blog-post_15.html` | 「サルファ剤はいつ日本に入ってきたか？」 |
| 2 | `https://tkobays.blogspot.com/2017/07/blog-post_20.html` | 「サルファ剤、日本登場２ 東京医事新誌」 |
| 3 | `https://tkobays.blogspot.com/2017/07/blog-post_21.html` | 「サルファ剤、日本登場３・医師はいつから使い始めたか」 |
| 4 | `https://tkobays.blogspot.com/2017/07/blog-post_22.html` | 「サルファ剤、日本登場４・製薬会社」 |
| 5 | `https://tkobays.blogspot.com/2017/07/blog-post_24.html` | 「サルファ剤、日本登場５・他国との比較」 |
| 6 | `https://tkobays.blogspot.com/2017/08/blog-post_76.html` | 「サルファ剤、日本登場６ 医学中央雑誌」 |

- **The `?m=1` / `?m=0` URL forms are what is indexed**, e.g.
  `...blog-post_22.html?m=1`, `...blog-post_24.html?m=0`, `...blog-post_76.html?m=1`. The
  bare URLs are indexed less often. This strongly suggests the index holds the mobile-rendered page.
- **No parts 7 or 8 were found.** Queries 「サルファ剤、日本登場７」, 「サルファ剤、日本登場８」,
  「サルファ剤、日本登場 番外」, 「サルファ剤、日本登場 まとめ」 returned no new part. Inference
  (class c): the series most likely ends at part 6, titled 「医学中央雑誌」.
- `site:tkobays.blogspot.com` returned **"No results found."** — the tool's plain-text query form is
  not passed through as a `site:` operator.
- Other tkobays posts surfaced incidentally (evidence the blog is indexed, not just these pages):
  「ハダニと芋虫」`https://tkobays.blogspot.com/2022/09/blog-post.html`,
  「山芋の下への成長を抑えてみた」`https://tkobays.blogspot.com/2020/12/blog-post.html?m=0`,
  「白菜は冷蔵庫で1か月保存」`https://tkobays.blogspot.com/2020/04/blog-post.html?m=0`,
  「東大5 銅像、下山、ミュルレル、ベルツ」`https://tkobays.blogspot.com/2017/11/5.html`,
  「『モーツァルトのむくみ』の続編」`https://tkobays.blogspot.com/2017/03/blog-post_4.html?m=0`.
  The blog mixes medical-history posts with gardening posts.

---

## 3. Queries executed (the full ledger, so the parent can see the method was exhausted)

Task-specified phrasings: 「サルファ剤はいつ日本に入ってきたか」 / 「サルファ剤、日本登場４・製薬会社」 /
「サルファ剤、日本登場５・他国との比較」 / 「サルファ剤、日本登場６ 医学中央雑誌」 /
`tkobays サルファ剤 プロントジル` / `tkobays サルファ剤 スルファミン 国産` /
`サルファ剤 日本登場 武田 三共 塩野義` / `tkobays blogspot サルファ剤 昭和`.

Additional queries (all returned zero blog body text):
「サルファ剤、日本登場」tkobays / 「サルファ剤、日本登場１」 / ２ / ３ / ７ / ８ / 番外 / まとめ /
「サルファ剤、日本登場」ブログ / tkobays 医学中央雑誌 サルファ剤 /
サルファ剤 日本登場 ブログ 製薬会社 プロントジル / "サルファ剤はいつ日本に入ってきたか" (quoted) /
tkobays.blogspot.com サルファ剤 プロントジル 1935 日本 輸入 /
医学中央雑誌 サルファ剤 日本登場 東京医事新誌 医師はいつから / site:tkobays.blogspot.com /
`tkobays` / tkobays ブログ 医薬 / "tkobays" サルファ / tkobays blogspot /
プロントジル 日本 1935 輸入 サルファ剤 歴史 / 国産 サルファ剤 製造 1937 武田 三共 塩野義 第一製薬 /
医学中央雑誌 サルファ剤 1937 日本 / サルファ剤 日本 臨床 導入 遅れ 比較 /
サルファ剤 日本登場 医薬史 ブログ / ブログ サルファ剤 日本 登場 プロントジル 東京医事新誌 /
サルファ剤 導入 日本 医史学 論文 / スルファミン 国産化 日本 昭和 製薬 /
国産の医薬産業は1909年に特許法が改正されて工程特許制度がとられた関係上 /
サルファ剤 国内生産 1938 自給 製薬会社 動員 / ギ酸 サルファ剤 製造 日本 法 1937 /
サルファ剤 価格 日本 高価 輸入 昭和13年 / 医学中央雑誌 創刊 1903 サルファ剤 抄録 件数 /
東京医事新誌 サルファ剤 記事 1935 1936 / 日本 医師 サルファ剤 使用 始め 1936 報告 /
プロントジル 輸入 第一製薬 武田 1936 / テラポール 第一製薬 1937 国産第一号 サルファ剤 /
サルファ剤 国産化 日本 製薬 社史 プロントジル 特許 / スルファピリジン 日本 製薬 1938 国産 /
日本 サルファ剤 生産量 1939 1941 統計 /
Company records indicate that many Japanese pharmaceutical companies also caught hold of the information on Prontosil /
kahaku 089_e.pdf Prontosil sulfonamide Japanese pharmaceutical companies /
kahaku sts sulfa drug Japan Prontosil domestic production 1937 /
many Japanese pharmaceutical companies caught hold of the information on Prontosil /
Japanese pharmaceutical companies Prontosil sulfonamide leapt into /
kahaku 089_e development of Japanese pharmaceutical industry sulfa drugs /
スルフォンアミド剤發展の跡を眺めると Uleron Domagk 1936 Sulfapyridin Whitby 1938 /
日本化学会誌 サルファ剤 1938 総説 日本 / 医学中央雑誌 サルファ剤 抄録 昭和12年 /
東京医事新誌 昭和11年 サルファ剤 プロントジル / 武田二百年史 サルファ剤 スルファミン 製造 /
山之内製薬五十年史 サルファ剤 / サルファ剤 日本 各社 製造 競争 昭和13年 特許 /
プロントジル 特許 日本 無効 工程特許 サルファ剤 国産化 / 日本 サルファ剤 使用 欧米 比較 遅れ 医学史 /
サルファ剤 ドイツ 日本 導入 タイムラグ 1935 1937 / サルファ剤 日本 最初 論文 1936 医学雑誌 /
サルファ剤 効果 日本 陸軍 海軍 採用 昭和 / 国産サルファ剤 第一号 テラポール 1937 発売 /
サルファ剤 日本 製造 開始 昭和12年 第一製薬 武田 / プロントジル 日本 発売 1937 輸入 販売 /
日本 化学療法 サルファ剤 普及 昭和 医師 処方 / 『魔法の弾丸』研究プログラムと日本の科学者 サルファ剤 /
サルファ剤の発見とその影響 日本 導入 / 秦 佐八郎 サルファ剤 日本の科学者 魔法の弾丸 /
サルファ剤 日本 導入 いつ 1935 1936 1937 最初 / 国産サルファ剤 各社 追撃 特許回避 日本 化学工業 /
サルファ剤 日本 医学界 反応 懐疑 効果 / サルファ剤が日本に紹介されたのはいつか /
日本におけるサルファ剤の臨床応用の始まり 昭和 / サルファ剤 日本 発売 昭和12年 広告 製薬 /
日本医史学雑誌 サルファ剤 日本 導入 論文 / 医学史 日本 化学療法 プロントジル 導入 研究 /
サルファ剤 日本 陸軍軍医 学校 研究 1936 / tkobays サルファ剤 ブログランキング ブログ 紹介 /
サルファ剤、日本登場 引用 ブログ / tkobays 医学史 ブログ 一覧

**Total: 100+ distinct queries. Zero produced blog body text.**

---

## 4. Class (a): VERBATIM text recovered, with the query that produced it

### 4.1 The ONLY recovered text from a source in the same topical space — a Japanese pharmacy journal.
Source: 南山堂『薬局』69巻2月号 p.463 (HTML viewer page; fully fetchable).
URL: https://www.nanzando.com/static/viewer/916903/HTML/index17.html
Found via query: `サルファ剤 日本 導入 いつ 1935 1936 1937 最初`
(Also surfaced by 「サルファ剤はいつ日本に入ってきたか」.)

VERBATIM (this is the site's own text, NOT the blog's):

> 薬 局　2018 Vol.69, No.3 463 63サルファ剤とは？1 歴　史サルファ剤とは，スルホンアミド骨格を有する薬剤の総称である．スルホンアミド（図1）は類似した構造をもつパラアミノ安息香酸と拮抗することで葉酸の合成を阻害する．葉酸が不足すると，微生物はDNAの生合成に支障を来す．こうした特徴をもつサルファ剤は，第一次世界大戦後の1932年に抗菌薬を開発する中で発見された．抗菌薬のない当時は，溶連菌感染症による産褥熱，傷感染，扁桃炎でも命を落とす時代だった．そもそもの着眼点は，ある染料が特定の組織のみを染める様子から，細菌のみを染める染料に薬物を結合させることで体内の細菌を殺菌できないかという発想だった．赤色染料であるアゾ色素にわずかな抗菌作用があることから，アゾ色素が硫黄を含む側鎖がつくとウールにより結合して染まるようになるという性質をヒントに，硫黄を含むスルファニルアミドがアゾ色素に付加された．ドイツ人のゲルハルト・ドーマクはこの化合物がレンサ球菌を感染させたマウスに効くことを発見し，1935年に彼の所属するバイエル社からプロントジルという商品名で発売された．こうした業績からドーマクは1939年にノーベル生理学・医学賞を受賞している1）．サルファ剤サルファ剤は抗菌薬のなかった世界にきら星のごとく登場した古きよき薬剤である．ST合剤を処方する際は，熱や倦怠感，顔を洗うときやトイレに行った場合に自覚する眼・口腔内・陰部の違和感があればすぐに内服を中止することも説明に加えたい．“ Do No Harm”であり，代替薬があればST合剤以外の薬を選択する．ST合剤やサラゾスルファピリジンでは漸増療法のプロトコルが知られている．ST合剤以外にもSU薬や利尿薬などもサルファ剤に分類される．■ 第一選択薬に過敏症歴あり! そのとき薬物治療はどう行うか?! ?? ?陶山 恭博JR 東京総合病院 リウマチ・膠原病科　医長図1 スルホンアミドO OR NH2SFeature　| 薬剤過敏症歴がある患者の薬物治療

### 4.2 J-STAGE abstract, 「魔法の弾丸」研究プログラムと日本の科学者 (廣野喜幸, 『化学と教育』70(8) 376-379, 2022)
URL: https://www.jstage.jst.go.jp/article/kakyoshi/70/8/70_376/_article/-char/ja (HTML page fetches fine; the PDF does not)
Relevance: directly on point for the blog's overarching question of why Japan lagged in chemotherapy.
VERBATIM abstract:

> エールリッヒが開始した「魔法の弾丸」研究プログラムは，志賀潔ならびに秦佐八郎という共同研究者を得て，梅毒の治療薬サルバルサンに結実した。エールリッヒの死後，「魔法の弾丸」理念の継承者たちがサルファ剤や抗生物質を開発し，多くの人命が救われることになったが，志賀や秦を擁する日本で「魔法の弾丸」研究プログラムが花開くことはなかった。

---

## 5. Class (b): search-index text from OTHER sites — near-verbatim sentences about the Japanese sulfa story

These are the search engine's indexed strings for those documents. They are the documents' own words,
not the blog's. They are the strongest available evidence for what the blog's parts 4-6 likely argue.

| Query that produced it | Verbatim indexed text | Source URL |
|---|---|---|
| 「サルファ剤、日本登場５・他国との比較」 | 国産の医薬産業は1909年に特許法が改正されて工程特許制度がとられた関係上、先進諸外国で開発された新薬の工程を変えて国内で製造すれば国内販売が可能であった | https://sts.kahaku.go.jp/albums/abm.php?d=3254&f=abm00010800.pdf&n=089.pdf |
| `Japanese pharmaceutical companies Prontosil` | Company records indicate that many Japanese pharmaceutical companies also caught hold of the information on Prontosil and leapt ... | https://sts.kahaku.go.jp/diversity/document/system/pdf/089_e.pdf |
| `kahaku 089_e.pdf` | quickly as possible | https://sts.kahaku.go.jp/diversity/document/system/pdf/089_e.pdf |
| `国産サルファ剤 第一号 テラポール 1937 発売` | 1937 国産第一号サルファ剤となった細菌性疾患薬テラポール®を発売 | https://www.daiichisankyo.co.jp/about_us/mission-strength/history/daiichi/ |
| `スルフォンアミド剤發展の跡を眺めると` | スルフォンアミド剤發展の跡を眺めるとUleron (Domagk 1936), Sulfapyridin (Whitby 1938), Albucid (Dohrn 1938)が夫々一轉期を割してゐる | https://www.jstage.jst.go.jp/article/nikkashi1898/43/9/43_9_687/_pdf/-char/ja |
| `サルファ剤 日本 導入 いつ 1935 1936 1937 最初` | 一九三七年に至りては米国の Rosenthal がデスルフアミールアミド及びデアミノデフェニールスルフオンのフオルムアルデヒドスルフオキシール酸ナトリウムの合成を發表す | http://www.nihs.go.jp/library/039-077/059(1942).pdf |
| `秦 佐八郎 サルファ剤` | 秦は旧制岡山第三高等学校（現岡山大学医学部）を卒業し、軍役、岡山県立病院助手を経た後、1898年、私立伝染病研究所員となり、ベスト研究に取り組んだ | https://www.jstage.jst.go.jp/article/kakyoshi/70/8/70_376/_pdf/-char/ja |
| `サルファ剤 日本 昭和 医学史 ブログ まとめ` | サルファ剤はdihydroperoneやdihydrofolateの酵素合成の強力な阻害剤ではあるが，aminopterinやamethopterinのようにdihydrofolicreductaseの抑制によってFH\(_2\)→FH\(_4\)の過程を... | https://www.jstage.jst.go.jp/article/cgafa/13/2/13_KJ00001537871/_pdf/-char/ja |
| 「サルファ剤はいつ日本に入ってきたか」 | 「抗生物質」の版間の差分 - Wikipedia - 近代的な抗菌薬の歴史はサルバルサンを開発したポール・エーリッヒと、ペニシリンを発見したアレクサンダー・フレミングの2人と結びつけられることが多く[24]、まずはエーリッヒらが色素に由来する合成抗菌薬を発見し[29][30][31]、選択毒性に基づく感染症の... | https://ja.wikipedia.org/?diff=prev&oldid=86129784 |

**Substitute evidence explicitly naming a Japanese company and a date (class b, high value):**

> 1937 国産第一号サルファ剤となった細菌性疾患薬テラポール®を発売
> — 第一三共「第一製薬の歴史」年表, https://www.daiichisankyo.co.jp/about_us/mission-strength/history/daiichi/

This is the single most citable hard fact recovered: Daiichi Pharmaceutical (第一製薬) marketed
テラポール (Terapol) in **1937**, described by the company itself as 「国産第一号サルファ剤」
(Japan's first domestically produced sulfa drug). It anchors the "いつ日本に入ってきたか" question.

---

## 6. Class (c): INFERENCE and open questions (explicitly NOT quotes)

- The blog's part 1 title is a question (「いつ日本に入ってきたか？」), parts 2 and 6 are named after
  the two bibliographic sources it mines (東京医事新誌, 医学中央雑誌), part 3 asks when *physicians*
  began using the drugs, part 4 covers *pharmaceutical companies*, part 5 compares *other countries*.
  Inference: the series is a bibliometric/primary-source survey — the author counted and dated
  Japanese medical-periodical mentions to date the drug's arrival, first clinical use, and domestic
  manufacture. This reading is consistent with every title but is **not confirmed by any body text.**
- The Kahaku report (089 / 089_e, 技術の系統化調査報告書, 化学関連) is a Japanese-government museum
  industrial-technology history. It independently supports two of the blog's themes: the 1909 Patent
  Law's 工程特許 (process-claim) regime that let Japanese firms legally reverse-engineer foreign
  drugs, and the claim that Japanese pharmaceutical firms learned of Prontosil and moved fast.
  **Its PDF could not be fetched (content-type blocked) and its sentences are truncated by the index.**
- I could NOT verify: whether Prontosil was imported and sold in Japan and from what date; whether
  the blog names specific 武田/三共/塩野義 products; the actual counts of 医学中央雑誌/東京医事新誌
  articles; and how the blog compares Japan's adoption speed to other countries.

---

## 7. Recommended next steps for whoever continues this

1. **Run the fetch from a different egress.** Every failure above is network-level
   (`TypeError: fetch failed` / DNS). A machine with unrestricted egress can read the blog, the
   Kagaku-hakubutsu-kan PDF (`sts.kahaku.go.jp/albums/abm.php?d=3254&f=abm00010800.pdf&n=089.pdf`),
   and J-STAGE PDFs directly. Nothing about the pages is intrinsically unavailable.
2. **A PDF-capable fetcher** would unlock the single richest substitute source (089.pdf, 089_e.pdf)
   and the Nihon Kagaku-shi review `nikkashi1898/43/9/43_9_687`.
3. **Internet Archive has the pages indexed** (a `web.archive.org/all/20111101190714/...` and a
   `web.archive.org/web/20230516100430/...` result appeared in the index), so a retry of
   `web.archive.org/web/2018/<blogspot url>` from open egress is the highest-probability route to
   the actual blog text, since tkobays.blogspot.com was crawled.
