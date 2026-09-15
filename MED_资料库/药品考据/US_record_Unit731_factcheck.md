# US Documentary Record on Japan's Biological Warfare Program (Unit 731 / Kwantung Army Epidemic Prevention & Water Supply Unit, Pingfang, Harbin)

Fact-check report. Every claim carries a source URL. Items are labelled **[FULL TEXT READ]** (I downloaded and extracted the document and read the relevant passage) or **[FRAGMENT / SECONDARY]** (I have only an abstract, a title, or a quotation reproduced by another author).

## Sources I actually obtained and read in full

| Source | What it is | URL |
|---|---|---|
| **Source A** | NARA / Interagency Working Group, *Researching Japanese War Crimes Records: Introductory Essays*, November 2006, 240 pp. Contains the chapter "Case Study: The Hunt for Knowledge about Japanese Biological Warfare Programs" (pp. 91–99) with footnoted archival citations. | https://www.archives.gov/files/iwg/japanese-war-crimes/introductory-essays.pdf |
| **Source B** | NARA / IWG, *Select Documents on Japanese War Crimes and Japanese Biological Warfare, 1934–2006*, compiled by William H. Cunliffe, November 2006, 170 pp. A chronological overview **plus a ~1,235-record database** giving each document's date, title, abstract/comment, RG number, entry, box, author and JWC control number. | https://www.archives.gov/files/iwg/japanese-war-crimes/select-documents.pdf |
| **Source C** | Tien-wei Wu, "A Preliminary Review of Studies of Japanese Biological Warfare and Unit 731 in the United States" (review of Williams & Wallace and of Harris). **[SECONDARY]** | https://web.archive.org/web/20121119074840/http://www.centurychina.com/wiihist/germwar/731rev.htm |
| **Source D** | Yang Yanjun 杨彦君, "七三一部队人体实验报告再解析——以美国馆藏史料为中心", 《抗日战争研究》 2022 (analysis of the A / G / Q reports and the Hill and Fell reports held at the US National Archives and Library of Congress). **[SECONDARY, Chinese]** | https://m.hswh.org.cn/index.php/wzzx/llyd/ls/2022-11-01/78378.html |
| **Source E** | Chinese state/party media and provincial archives on the 1940–41 field trials. **[SECONDARY / CHINESE PRIMARY DOCUMENTS]** | see URLs inline |

Method note: `web_fetch` cannot retrieve PDFs and `curl.exe` fails in this environment. Python 3.12 + `pypdf` over `urllib` works; helpers are in this workspace (`grab.py`, `wget.py`, `iasearch.py`). The scanned document images inside Source B are **not** OCR'd, so Source B yielded metadata and abstracts, not document bodies.

---

# QUESTION 1 — US technical assessment of Japanese BW capability

## 1.1 Who investigated, and when — now precisely dated

**[FULL TEXT READ]** Source A, pp. 95–96:

- **Murray Sanders** — "The first detailed postwar study of the Japanese biological warfare program, completed on **November 1, 1945**, by Lt. Col. Murray Sanders, notes that the Japanese Army embarked upon large-scale biological warfare experimentation in the early 1930s under Ishii's direction." It was "based solely on interviews with Japanese participants and laboratory examinations, not on any documentary evidence, which purportedly was destroyed during the war." It contains "a history of Japanese biological warfare efforts, the types of experiments carried out—**with no mention of human experimentation**—and the varieties of weapons the Japanese developed." https://www.archives.gov/files/iwg/japanese-war-crimes/introductory-essays.pdf
- **Arvo Thompson** — "At the end of December 1945, Army officials at Fort Detrick, Maryland, ordered Lt. Col. Arvo Thompson to follow up on Sanders' flawed findings. Thompson conducted his investigation from **January to March 1946**. His report is drawn mainly from interviews with Ishii himself." **[FULL TEXT READ]**, same URL.
- **[FRAGMENT]** Ishii's own interrogation ran **17 January – 25 February 1946**; Thompson "finished his investigation report at the **end of May 1946**, augmenting knowledge on manufacturing germ bombs and technique of mass production of germs achieved by Unit 731." Source C.
- **Norbert H. Fell** — sent to Japan in **April 1947** by Maj. Gen. Alden C. Waitt, Commander of the US Chemical Corps, "to assess the progress and level of achievement in biological warfare." Source C.

> **Correction to the task brief:** the Camp Detrick investigator is **Norbert H. Fell**, not "Joseph B. Fell". The **Hill report's co-author is Joseph Victor**. Source A p. 98: "In the autumn of 1947, two scientists from Fort Detrick, Maryland, **Edwin Hill and Joseph Victor**, carried out their own investigation." https://www.archives.gov/files/iwg/japanese-war-crimes/introductory-essays.pdf

- **Hill & Victor** — **[FULL TEXT READ]** Source A p. 98: they "interviewed Ishii and several other scientists and pathologists regarding their studies of plague, typhus, tick encephalitis, botulism, cholera, and other diseases," and "noted that 'no question of immunity guarantee from war crimes prosecution was ever raised during these interviews.'"
- **[FRAGMENT]** Yang Yanjun (Source D) adds that Fell interrogated members of Unit 731, the Army Medical College and **Kwantung Army Unit 100**, producing his report on **20 June 1947** (《日本生物战活动最新资料概要》 = *Brief Summary of New Information About Japanese BW Activities*); that Rear Admiral **Thos B. Inglis**, Director of US Naval Intelligence, reproduced the Fell Report's human-experiment data in full in his **30 August 1947** report; and that Hill went to Tokyo on **28 October 1947** and interrogated 20+ people including Ishii Shirō, Okamoto Kōzō, Ishikawa Tachio, and Kojima Saburō. https://m.hswh.org.cn/index.php/wzzx/llyd/ls/2022-11-01/78378.html
  - The Fell report's title, author and date are independently confirmed by Santa Clara University's catalogue entry: "Brief Summary of New Information About Japanese BW Activities", creator **Norbert Fell**, date **1947-06-20**, source `https://www.archives.gov/files/iwg/japanese-war-crimes/select-documents.pdf`. https://dh.scu.edu/exhibits/exhibits/show/world-war-ii-2024/item/5068

## 1.2 What they judged ADVANCED

**[FULL TEXT READ]** Source A p. 94 — the only explicit "advanced" judgement I can verify in an official NARA publication:

> "Interrogations of other Japanese medical officers led U.S. intelligence officials to conclude that the Japanese biological and chemical warfare program centered in Harbin was **quite advanced**."

Its archival cite (**Source A footnote 51**): NA, RG 319, Records of the Army Staff, entry 85, Intelligence Document ("ID") File, box 7264, ID #919284, **"Targets BW: Japan"** (location 270/13/31/5). Source A calls this file "invaluable… contains interrogations of Japanese POWs and other efforts to learn more about the Empire's biological and chemical warfare programs." https://www.archives.gov/files/iwg/japanese-war-crimes/introductory-essays.pdf

**[FULL TEXT READ]** Bomb design and 1941 output — a genuine US record. Source B, record **JWC 002/09** (RG 165, box 488, GHQ USAFPAC; interviewers **LTC Murray Sanders & LT Harry Young**, file 29-E-b), interview of **7 October 1945** with **Maj. Jun-ichi KANEKO**:

> "By the middle of 1941, at least **500 each of the Ha and Uji bombs** had been made and tested." Also that "**over 300 horses** had been expended in experimental trials."

The companion record **JWC 002/08** records that the same Sanders/Young series "provides details of **Uji, Ha & Ro bombs**," with Sanders' estimate that "the extent of the Japanese program is apparent for the first time." https://www.archives.gov/files/iwg/japanese-war-crimes/select-documents.pdf

**[FRAGMENT]** Mass production of bacteria — Source C attributes to Thompson's report the "**technique of mass production of germs** achieved by Unit 731." This is a secondary paraphrase, not a quotation; I found no verbatim US sentence on mass production that I can quote.

## 1.3 What they judged BACKWARD — **NEGATIVE FINDING**

I found **no** US text, in any source I could reach, asserting that Japanese **purification/concentration of bacteria, freeze-drying/lyophilization, safety, or quality control** were judged inferior to US or German work. Specifically I searched the full text of Source A (240 pp) and Source B (170 pp incl. the whole record database) for "purif-", "freeze", "lyophil-", "backward", "sophisticat-", "aerosol", "spray", "flea" — **zero hits** on all of these in Source A and Source B.

The only freeze-drying statement I found is about the **US** side, and it is secondary: "The most successful experimentation achieved by Detrick was the virus being freeze-dried that could be delivered to the enemy's territory." Source C: https://web.archive.org/web/20121119074840/http://www.centurychina.com/wiihist/germwar/731rev.htm

> **Do not assert a documented US finding that Japan lagged in lyophilization, purification, concentration, safety or QC, or that Japan led in aerosol/dispersal, on the strength of these sources.** Likewise no US source I read ranks Japanese dispersal technique as superior.

## 1.4 Did they write that the data was valuable — verbatim

**[FULL TEXT READ]** Source A, pp. 98–99 prints the full **Hill & Victor** passage (more complete than the usual three-line excerpt). Its archival citation is **Source A footnote 67**: *"Summary Report of B.W. Investigations," 12 Dec. 1947, p. 4*, NA, **RG 175**, Records of the Chemical Warfare Service, WNRC Accession #67A4900, General Administrative Files, 1945–54, Confidential, **box 217**, folder "Decimal 385, July–December 1954 … Warfare Investigations Summary report". https://www.archives.gov/files/iwg/japanese-war-crimes/introductory-essays.pdf

> "Evidence gathered in this investigation has greatly supplemented and amplified previous aspects of this field. It represents data which have been obtained by Japanese scientists at the expenditure of many millions of dollars and years of work. Information has accrued with respect to **human susceptibility to these diseases as indicated by specific infectious doses of bacteria**. **Such information could not be obtained in our own laboratories because of scruples attached to human experimentation.** These data were secured with a total outlay of **¥250,000** to date, **a mere pittance** by comparison with the actual cost of the studies. It is hoped that individuals who voluntarily contributed this information will be spared embarrassment because of it and that every effort will be taken to prevent this information from falling into other hands."

**[FRAGMENT]** The report's formal heading, per the Dugway Proving Ground Technical Library copy as catalogued in a Chinese documentary series: *"12 Dec. 1947: SUMMARY REPORT ON B.W. INVESTIGATIONS, TO: GENERAL ALDEN C. WAITT, Chief Chemical Corps, FROM: EDWIN V. HILL, M.D., Chief, Basic Sciences, Camp Detrick, Md."* https://www.crggcn.com/skwx_crgg/initDatabaseDetail?siteId=25&contentId=9637886&contentType=literature

**[FRAGMENT]** Fell's parallel judgement, in Yang Yanjun's Chinese rendering: "关于人体实验的资料，当我把他们与我们已有的动物实验资料联系在一起时，会证明其具有无比珍贵的价值。" ("The human-experiment data, when linked with our existing animal-experiment data, will prove to be of inestimable value.") Source D: https://m.hswh.org.cn/index.php/wzzx/llyd/ls/2022-11-01/78378.html

### What KIND of data — the three categories, as the US record itself describes them

**[FULL TEXT READ]** Source B, 1948–2006 section — the *types* of data acquired:

- **Human experimental data (pathology).** Report **"A" (Anthrax)**, 406 pp; Report **"G" (Glanders)**, 372 pp; Report **"Q" (Plague)**, 744 pp — each "was produced from **Japanese human experiments**, interviews by Army technical personnel, and reports by Army BW labs at **Ft. Detrick**. It provides detailed microscopic investigation of the reaction of human organs to [anthrax / glanders / plague]." (JWC 252, 251, 253.) https://www.archives.gov/files/iwg/japanese-war-crimes/select-documents.pdf
  - **[FRAGMENT]** Yang Yanjun gives slightly different page counts and case totals: A = 408 pp / 32 anthrax cases; G = 376 pp / 21 glanders cases; Q = 57 plague cases. He also records that **401 of 850** logged cases were "complete human case data," and that a further **291** cases (epidemic haemorrhagic fever 52, cholera 50, tuberculosis 41, typhoid 22, etc.) were **not** released. Source D.
- **Production / weapons know-how.** **[FRAGMENT]** Thompson's report "augmenting knowledge on manufacturing germ bombs and technique of mass production of germs"; Sanders/Young's interview records cover the **Uji, Ha and Ro** bomb models and their 1941 test quantities (this part is **[FULL TEXT READ]**, Source B JWC 002/08–09).
- **Field-trial results.** **[FULL TEXT READ]** Yang Yanjun's summary of the Fell Report lists sprayed-agent trials, bomb trials, field-infection and laboratory-infection data, and low-altitude aircraft spray trials with 30–100 % infection and ≥60 % mortality. Source D (secondary). The **US** record of 1940–41 field use is at §3 below.

**[FULL TEXT READ]** A distinct US claim about *human subjects*, from the Office of Naval Intelligence: the August 1947 **"Naval Aspects of Biological Warfare"** (Technical Intelligence Center, ONI) "claimed that the Japanese had experimented upon Chinese subjects during immunization and bacterial research conducted at Pingfan. Notably, this report asserted that **American and Russian POWs were used to provide blood samples**, while the more odious experimentation on humans was inflicted upon **Manchurian criminals already condemned to death**." It also "states that the **Emperor had forbidden** Ishii's projects," contradicting some SCAP records. Source A p. 98; cite via **Source A footnote 66** = NA, RG 330, Records of the Office of the Secretary of Defense, Central Decimal Files 1943–53, entry 199, box 103, folder CD 23-1-4 (3 of 7).

## 1.5 "Report on B" / "Summation" — **COULD NOT VERIFY**

I found **no** US document titled **"Report on B"** anywhere in Source A or Source B, and **no 1948 "Summation" report**. What I can verify exists:

1. *"Summary Report of B.W. Investigations,"* **12 December 1947**, by **Edwin V. Hill and Joseph Victor** — the report usually called "the Hill report," cited at Source A fn. 67 (RG 175, box 217).
2. Reports **A** (anthrax), **G** (glanders), **Q** (plague) — Japanese-authored, English-language, submitted with the Hill report (Source B, JWC 251–253; Source D).
3. The **Fell Report**, *Brief Summary of New Information About Japanese BW Activities*, 20 June 1947 (Source B JWC 123 & 228; Source D).
4. A **1977** US Army "Summation" of US BW activities 1942–1977 (《1942—1977年美军在生物战领域活动的总结报告》), mentioned by Source D, which I could **not** retrieve.

> If the brief's "1948 'Report on B' / 'Summation'" refers to anything else, it is unverified by me, and should not be asserted.

Also unverified: I have only titles, dates, archival locations and reproduced quotations for the **bodies** of the Sanders, Thompson, Fell and Hill/Victor reports. The scanned documents inside Source B are un-OCR'd images.

---

# QUESTION 2 — Relationships with other Japanese institutions

## 2.1 Kwantung Army Army Medical Supply Depot / 関東軍衛生材料廠

**[FULL TEXT READ — US record]** The closest item in the entire IWG select-document set is ATIS translation **1376**, logged **twice** on **7 July 1944**:

> "**Medical supply to Kwantung Army in relation to bacterial warfare.** [ATIS translation 1376] Field Manual dated **Aug. 31, 1941** instructs on precautions to be taken in boiling water & cooking food to kill germs. G-2 calls attention to tactical and sabotage employment of BW and use of airplanes & loosing infected animals as means."

Source B records **JWC 043/16** (RG 165, box 469, "G-2 Book IIIq BW / BWJ Book III") and **JWC 194** (RG 165, box 287 / P Files 194). https://www.archives.gov/files/iwg/japanese-war-crimes/select-documents.pdf

> **Caveat:** the phrase used is "medical supply **to** Kwantung Army", not "medical supply **depot**". **No depot is named, and no location is given.** This is the only US-record item I found linking Kwantung Army medical supply to BW.

**[SECONDARY — Japanese record, JACAR]** The depot itself is documented in Japanese archives, not US ones: 関東軍衛生材料廠 was located at **満洲国奉天市十港屯** (Fengtian/Mukden), site ≈400,000 tsubo, function "衛生材料の製造、補給並に貯蔵" (manufacture, supply and storage of medical materiel), with an in-unit 製薬工場 (~2,000 tsubo) making 食塩注射液, ブドー糖ビタミンB液 and tablets, and contract manufacture placed with civilian pharmaceutical factories in the Fengtian area; it supplied 全満各陸軍病院, the 野戦貨物廠 (Kwantung Army and North/Central China armies) and 在満各部隊. JACAR Ref. **C13010198500** (防衛省防衛研究所, 「満洲に於ける各種作戦の史的観察」). https://www.jacar.archives.go.jp/das/meta/C13010198500
A separate 23 July 1940 document (関東軍参謀長飯村穣 to 陸軍次官阿南惟幾, 「作戦資材整備状況の件」) names **奉天陸軍衛生材料支廠** and its **大連出張所**. JACAR Ref. **C01003610500**. https://www.jacar.archives.go.jp/das/meta/C01003610500
Do **not** conflate 関東軍衛生材料廠 with 関東軍兵器廠 / 関東軍補給廠. No US record naming 関東軍衛生材料廠 was found.

## 2.2 South Manchuria Railway Co. (Mantetsu / 満鉄)

**[FULL TEXT READ — NEGATIVE]** Source B contains **zero** occurrences of "Mantetsu" or "South Manchuria" — i.e. the IWG finding aid records **no** Mantetsu–BW-unit material link. Source A mentions the South Manchurian Railway Company once, in an **archival-location** context, not a BW context:

> "The South Manchurian Railway Company (SMRC) original documents were not returned to Japan, and about **70 percent of all SMRC records remain at the Library of Congress**. Others are scattered among six American and forty-four Japanese institutions. The Japan National Diet Library has microfilmed the Library of Congress holdings."

Source A, introduction. https://www.archives.gov/files/iwg/japanese-war-crimes/introductory-essays.pdf
> This is a **research lead** (where the records are), **not** evidence of a Mantetsu–Unit 731 link. No US claim of a Mantetsu research-body, personnel, funding, land, transport or product link to a BW unit was found.

## 2.3 The Kwantung Army Anti-Epidemic Water Supply Department branches

**[FULL TEXT READ — US record]** The names the US record actually used:

- **27 March 1945**, CPMB 1440 / 1442 series: "Verifies **Bacteriological Experimental Center, Harbin; the Hygiene & Water Purification Depts., Kwantung Army at Harbin & Hsinking.**" (JWC 314/13, 314/14, 052, 009; RG 319 box 85 and RG 165 box 287.) The same 27 March 1945 report identifies "a lab for contagious diseases at **Shinkyo (Hsinking)** that is a **joint enterprise of the University & the Manchurian government**," and names "the Bacteriological Experimental Center, Harbin; the Hygiene & Water Purification Dept., Harbin; the **BKU unit under ISHII**; the Field Hospital, 14 Army." https://www.archives.gov/files/iwg/japanese-war-crimes/select-documents.pdf
- **Unit 1644 (Nanjing)** — **12 December 1944**, SINTIC report **#213**: "[POW] detailed report on BW research in **Nanking**… **Includes diagram of Water Supply & Purification Dept., Nanking, China**" (JWC 314/12b, 314/12a; RG 165 box 486 / RG 319 box 85). The abstract adds the POW "Tells of **10,000 casualties at Chekiang, China in 1942** dying mostly of cholera. Bacteria dispersed over area by planes." A companion record (JWC 176/2) is titled "Japanese Preparations for Bacteriological Warfare in China — Supplement to SINTIC Item # 187."
- **Unit 100** — the US record calls it the **"Kwantung Army Quarantine Stables"**, not Unit 100. Throughout SCAP Legal **Case No. 330** (July 1946) the US asks Tokyo for the records of **Maj. Gen. Yujiro WAKAMATSU**, "former commander of the Kwantung Army Quarantine Stables"; **Major Yasutaro HOSAKA**, "formerly in charge of the Experiment Section of the Kwantung Army Quarantine Stables"; and **Lt. Col. YASUZAKA**, **Capt. Shiro MATSUSHITA**, **Major Honji YAMAGUCHI**, "believed to have served with the Kwantung Army Quarantine Stables or with the ISHII unit at Harbin" (JWC 258/01a–05b; also 261/05). https://www.archives.gov/files/iwg/japanese-war-crimes/select-documents.pdf
- **5 November 1946**: NISHIMURA [fnu] was "formerly a veterinarian employed in **No. 3 Station of the Kwantung Army Horse Disease Prevention Unit at Hsinking, China**" (JWC 258/13).
- **[FULL TEXT READ]** Source A: "In the 'Report on War Criminals,' Nishimura accuses Yamaguchi, et al., of the dissection of 'many prisoners of Allied Forces at the **outdoor dissecting ground of [Unit] No. 100 Army Corps at Hiainking, Manchuria**' and of infecting POWs with glanders." Also: SCAP Legal Section established war crimes Case No. 330 listing "Motoji YAMAGUCHI, Yujiro WAKAMATSU, Yasutaro HOSAKA, Shiro MATSUSHIDA, fnu YASUZAKA, and Shiro ISHII." **[FULL TEXT READ — US record]**
- **4 February 1947** — a US officer's report specifically on Unit 100's Changchun institute: Asst. Military Attaché, Manchuria, **Brig. Gen. Robert H. Soule**, file **R-54-47**: "**Japanese Bacteriological Research Institute, Changchun** — General report includes destruction of records" (Source B, JWC 070). A companion intercept of **20 February 1947** reports Russian arrest and detention of members of a "**Research Institute of Animals**" in Manchuria (JWC 231/34). https://www.archives.gov/files/iwg/japanese-war-crimes/select-documents.pdf
- **[FULL TEXT READ]** Source A records that the Khabarovsk trial (late 1949) tried twelve Japanese for BW crimes — "**six were members of Unit 731, two of Unit 100, an independent biological warfare entity, and four from elsewhere**." It further names, in the literature, "Japanese units stationed in **Beijing (Unit 1855), Nanjing (Unit 1644, or Tama Unit), and Canton (Unit 1688)**." *(Note: other literature uses **8604** for Canton; unresolved in my sources.)*
- **[FRAGMENT — secondary, Japanese]** Unit 100 origins: predecessor 関東軍病馬収容所 (Nov 1931); later 関東軍獣疫予防部; from 1936 under 獣医少将若松有次郎 at 長春孟家屯; May 1936 Imperial approval for the two Manchurian BW units. Chinese source: http://ccdqw.com/shgc/2013-01-06/749.html
- **[FRAGMENT — Chinese]** Unit 1644: cover name 中支那防疫給水部 / 多摩部隊; established April 1939 by Ishii Shirō, who was concurrent first commander. https://www.19371213.com.cn/sylm/xwzx/202509/t20250919_5652780.html

## 2.4 Dalian / Dairen Institute of Health (大連衛生研究所) and the Kwantung Government

**[FULL TEXT READ — NEGATIVE]** No US-record mention found. Source B: zero occurrences of "Dairen" or "Dalian". Source A: "Dairen"/"Dalian" appear only in unrelated contexts — the 1949 **"Operation Takematsu"** agent-infiltration plan ("to observe Soviet shipping between Port Arthur, Vladivostok, and Dairen") and a bibliography entry for the Dalian Municipal Archive. No US investigation of the institute, and no US-record link between it and Unit 731, was found.

**[FRAGMENT — Chinese]** The institute's predecessor was 満鉄衛生試験所 (operations from January 1926), renamed 満鉄衛生研究所 in April 1927; taken over by the Kwantung Army in 1938 citing "military need for serum and vaccine", renamed 大連衛生研究所, internally 関東軍防疫給水部大連出張所, also called 満州第319部隊, ~250 staff. https://www.sohu.com/a/936077905_349247
**[FRAGMENT — Japanese testimony]** A 11 August 1954 statement of former 関東州庁警察部長 潮海辰亥 that he approved a human experiment at the Dalian institute's request (Feb–Mar 1944); and 山内豊紀's statement that 500+ 石井式細菌培養罐 were dumped in the sea off Dalian. https://liaoning.nen.com.cn/network/liaoningnews/lnnewslndangan/2018/07/12/252446951012832266.shtml
> Note the overlap: the **満鉄** (Mantetsu) hygiene laboratory IS the institutional ancestor of the Dalian institute, according to this Chinese account — but that link is documented in Chinese/Japanese material, **not** in the US finding aids.

## 2.5 Japanese pharmaceutical manufacturers in Manchuria

**[FULL TEXT READ — US record]** The only US-record inter-institution transfer of biological agents I found, dated **23 April 1945**, MIS **121644**: "Reports **large quantities of plague, tuberculosis, & typhoid germs shipped from Osaka Chemical Research Institute to Shanghai**." (Source B, JWC 314/61; RG 319 box 85.) Note: Osaka, not Manchuria, and a research institute, not a commercial manufacturer.
The only Manchurian pharmaceutical-capacity fact I found is in the **Japanese** record: 関東軍衛生材料廠's in-unit 製薬工場 and its contracts with civilian Fengtian pharmaceutical factories (JACAR C13010198500, §2.1 above).
**[NEGATIVE]** No US-record name of any Japanese pharmaceutical manufacturer in Manchuria supplying a BW unit.

---

# QUESTION 3 — What was Unit 731 doing specifically in 1941?

## 3.1 Which years exactly, and what the US record says about the field trials

**[FULL TEXT READ]** Source B's own chronological overview: "**1941–1943** — U.S. intelligence acquired knowledge of Japanese tactical biological warfare (BW) incidents that resulted in localized outbreaks of plague or cholera. Captured Japanese documents began to reveal personnel and places for primary Japanese Army BW organizations operating under the title of **Water Supply & Purification Units**." https://www.archives.gov/files/iwg/japanese-war-crimes/select-documents.pdf

**[FULL TEXT READ]** Source A p. 95 — a dedicated **US study of the 1941 outbreak**:

> "In 1945, U.S. experts systematically examined the use of bubonic plague by the Japanese in China. **They focused on an outbreak that occurred in 1941.** In November of that year, a Japanese plane allegedly dropped rice grains, wheat, paper, and other particles embedded with bubonic plague bacilli over **Chengde**, in China's Hunan province. Shortly afterwards, an outbreak of plague swept over the province… The **1945 U.S. Army study 'Report on the Plague in Changteh, Hunan'** describes the circumstances leading to the suspicion of plague and other information gathered from several investigations."

Cite: **Source A footnote 53** = NA, **RG 112**, Office of the Army Surgeon General, entry 295A, Records of the Preventive Medicine Division: **Biological Warfare Specialized Files, 1941–47**, box 11, file 55: **"Plague Incident in China"** (location 390/18/24/2). Source A also records that "British officials offered a study of Japanese biological warfare intentions. Their **May 1945** report covers allegations of the use of biological warfare by both Allied and Japanese forces, including the incident at Chengde." https://www.archives.gov/files/iwg/japanese-war-crimes/introductory-essays.pdf

> **Quote this as printed and flag it:** the NARA volume's text says "**Chengde**", but the study it cites is titled "**Changteh**" — so "Chengde" is almost certainly a typographical error for **Changteh / Changde (常德), Hunan**.

**[FULL TEXT READ]** The accompanying 1945 finding: the **July 1945** Military Intelligence Service report "**Japanese Biological Warfare**", distributed to several US agencies including the OSS, "indicates that **Hsinking and Harbin were centers of biological warfare research in China** and notes that Ishii was in charge of the program at Harbin," and "in an acknowledgement of the Chengde incident, **noted that the Japanese had indeed already deployed plague bacteria in China at least once**." (Source A p. 95; cite via fn. 54 = NA, RG 226, OSS, entry 134, Washington Registry Office Radio and Cable Files, box 42, file "M/8 Japan".) https://www.archives.gov/files/iwg/japanese-war-crimes/introductory-essays.pdf

### US records describing the 1941 attacks (Source B abstracts, **[FULL TEXT READ]** as abstracts)

| Date of US record | JWC | What it records about 1941 |
|---|---|---|
| 1942/12/02 | 042/16 | FCC transmission (RG 165 box 489, "BWJ Book III"): plague in Changteh "**first broke out on November 11, 1941, a week after enemy raiders had dropped bombs.**" Belief the Japanese were employing bacteriological warfare. |
| 1944/08/22 | 047/01 | OSS R&A, folder 3383, Kunming: "**Reports Nov. 4, 1941 offensive use of BW by Japanese in Changteh, China by dropping plague infested grain, paper felt & cotton from an airplane. Reports 6 persons died of plague in the period of Nov. 11–25, 1941.**" |
| 1944/08/24 | 043/21 | SWPA cable C16562: translation of a **14 November 1941** Japanese announcement of an award to Maj. Gen. **ISHII Shiro**; G-2 speculates the award may have been for invention of the bacillus bomb. |
| 1945/06/28 | 060 | "Central China — Japanese Use of BW at **Ch'ang Te, Hunan** Province… **Testimony of a Chinese doctor on Japanese BW testing in Nov. 1941.**" Author Maj. James R. Geddes, R-713-CH-45. |
| 1947/06/27 | 159 | CINCFE **C-53663**: "**Strong circumstantial evidence**" of BW use at **Chuhsien, Kinghwa & Changteh** & elsewhere. IPS believes ISHII did violate rules of land warfare but does not recommend charges — "**IPS SAYS IT LACKS EVIDENCE FOR A TRIAL**." A companion message "Relates **Oct. 27, 1940** incident of Japanese planes scattering plague infested grain over **Ningpao** and numerous other BW incidents in China." |

All: https://www.archives.gov/files/iwg/japanese-war-crimes/select-documents.pdf

**[FULL TEXT READ]** Source A also records the state of US knowledge: a **January 1943** US intelligence summary "reports an outbreak of bubonic plague in China that likely had its origins in a Japanese biological attack. **Notably absent, however, is any report on the development of biological weapons in Manchuria or elsewhere.**" (fn. 48 = NA, RG 112, entry 295A, box 9, file "Current Intelligence, Gen."). And for 1941 specifically: "In 1941, one of the few pieces of evidence about Japanese **chemical** warfare was an account by an American reporter who claimed to have seen at least ten gas victims in a military hospital in Chongqing" (fn. 47 = NA, RG 226, OSS, entry 210, box 340, folder 4: "**Far East Report Edgar Mowrer 1941**"). https://www.archives.gov/files/iwg/japanese-war-crimes/introductory-essays.pdf

### Dates and places beyond the US record — dates firmly documented vs contested

**[FRAGMENT — Chinese secondary / Chinese primary documents]**

- **Firmly documented 1941 event: 4 November 1941, Changde (常德), Hunan.** One Japanese aircraft, just after dawn in heavy fog; dropped no bombs but scattered grain, wheat, cotton wadding and rag strips; collected, these came to four to five hundred *jin*. Unit 731's own records give **1.6 kg of plague fleas** dropped. First victim **Cai Tao'er (蔡桃儿), aged 12** — fell ill the evening of **11 November** and died the morning of **13 November**; autopsy confirmed septicaemic plague. https://www.xinhuanet.com/politics/2019-08/30/c_1124939340.htm
- Hunan Provincial Archives declassified the case file on **9 June 2015**, including 《防治湘西鼠疫經過報告書》 covering 1941–42 in Changde and Taoyuan, with autopsy data on 50+ victims; US Red Cross and Canadian medical teams arrived. http://m.news.cntv.cn/2015/06/10/ARTI1433946902010668.shtml
- **7,643 plague deaths** were established by a 1990s oral-history survey of 15,000+ statements; accepted by the Tokyo District Court on **27 August 2002**. **Xinhua explicitly notes these were victims with names, addresses, case histories *and surviving relatives*, and that the true total is higher — do not present 7,643 as the total death toll.** https://www.xinhuanet.com/politics/2019-08/30/c_1124939340.htm
- **Contemporaneous 1941 Chinese state document:** Zhejiang Provincial Archives holds the Health Administration's classified letter to the Executive Yuan Secretariat dated **22 February 1941**, signed by Director Jin Baoshan (金寶善), quoting Li Jishen's telegram "為敵機飛浙撒播鼠疫菌" (enemy aircraft flying over Zhejiang scattering plague bacteria) and Chiang Kai-shek's **20 December 1940** telegram; recording an emergency meeting with **League of Nations plague expert Dr. Pollitzer (伯力士)**; and reporting Yinxian Kaiming St./Donghou St. plague found 30 October, 253 quarantined, 61 dead, 22,343 inoculated. https://www.zjda.gov.cn/art/2014/8/20/art_1378529_12510681.html
- **Pollitzer took charge of Changde plague control from December 1941** and technically confirmed the outbreak was caused by Japanese BW. http://data.gzdafzxx.cn/KCMS/detail/detailall.aspx?filename=bjlb201702009&dbcode=CJFD&dbname=CJFD2017
- **CONTESTED / DISPUTED:** (i) **Ningbo** drop date 27 Oct 1940 vs first confirmed cases 30 Oct 1940 — reconcilable, but must not be conflated; (ii) Ningbo flea quantity: **2 kg** (Kaneko thesis) vs **"as much as 5 kg"** (Chinese official account) — directly contradictory; (iii) Ningbo deaths **61** (Health Administration letter) vs **111** named (museum account) vs **1,554** infected (Kaneko) — different definitions, not reconcilable as one number; (iv) Changde death toll 7,643 is a floor, not a total; (v) the Kaneko thesis date is given as both **December 1943** and **1949** in different Chinese reports.
- **Agents at Changde November 1941:** every source reached specifies **plague-infected fleas only**. I found **no** reliable documentation for typhoid, paratyphoid or anthrax at Changde in 1941. One biography of Chen Wengui claims "cholera and plague bacteria"; this is **unsupported elsewhere**.
- **1941 attacks at Jinhua, Shangrao, Suiyuan or Baotou: NOT VERIFIED.** Suiyuan/綏西 plague BW is dated **1942**; Jinhua and Yushan appear in the **1940** and **1942** operations, not 1941. A distinct **1941 Ningbo *attack*** is not documented — what is documented is a 1941 plague **recurrence** under Japanese occupation reported in the 時事公報 of **9 May and 30 May 1941**. https://www.kunming.cn/news/c/2012-05-31/2971426.shtml
- **"Naha Unit": NOT VERIFIED.** No source found connecting a "Naha Unit" to Ningbo or to 1941.
- China's National Archives Administration declassified Soviet interrogation archives of Unit 731 in November 2025; the summary states Unit 731 conducted **three** BW operations outside Northeast China — Ningbo 1940, **Changde 1941**, and the Zhejiang–Jiangxi railway 1942 — and that Soviet forensic analysis concluded the bacteria were cultured to kill, not to make vaccine. https://global.chinadaily.com.cn/a/202512/13/WS693d0253a310d6866eb2e783_2.html

## 3.2 Documented 1941 production expansion, personnel numbers, budget

**[FULL TEXT READ — US record]** The one hard 1941 production figure in the US record is the bomb count in the Sanders/Young interview of 7 October 1945 (Source B, JWC 002/09): "**By the middle of 1941, at least 500 each of the Ha and Uji bombs had been made and tested.**" Also "over 300 horses had been expended in experimental trials." https://www.archives.gov/files/iwg/japanese-war-crimes/select-documents.pdf

**[FULL TEXT READ — US record]** The US Air Technical Intelligence / CWS item **JWC 187/04** (15 August 1944, Chemical Warfare Service, Intelligence Branch, Decimal 385): "**Reports that in April 1941 ISHII 'Conducted experiments at the Army Medical School at Harbin, Manchuria with bacillus bombs.'**" Same URL.

**[FRAGMENT — Chinese]** Ceramic bacterial bombs: "from **1937 to 1942**, Unit 731 produced about **2,000 ceramic bacterial bombs**; plague fleas — **45 kg could be bred every three to four months**." **Note the range is 1937–1942, not a 1941 figure.** Each aircraft could carry several tens of bombs, each holding **5,000 plague fleas**; under test, 70 % of horses and 90 % of sheep at the detonation point died within one to two hours. Bombs were called "Ishii ceramic bombs"; ceramic was chosen because metal casings needed heat that killed the bacteria. http://m.people.cn/n4/2017/0926/c677-9919718.html

**COULD NOT VERIFY:** Unit 731 **personnel strength specifically for 1941**; any **Kwantung Army 1941 budget line** for BW; **monthly** bacterial, bomb-casing or flea output for 1941; any **1941 completion date** for the Pingfang buildings; and the **kana block designations ro / i / ha / ni / ho / he / to / chi** for Pingfang Buildings 1–8 — I found **no source** for these designations at all. The only Pingfang building description I could verify is "本部一棟 (HQ Building 1), a central corridor, and 本部二棟 (HQ Building 2)", with the General Affairs and Clinic Departments in HQ Building 1 and the weapons store and equipment-supply department in HQ Building 2; restoration of Ishii's office, the photography section and officers' rooms opened 15 August 2015. http://cngongji.cn/2015-07/25/c_134443767.htm

## 3.3 Kwantung Army Special Manoeuvre / Kantokuen (関東軍特種演習, 1941)

**[FULL TEXT READ — NEGATIVE for the US record]** I grepped the full text of Source A (240 pp), Source B (170 pp incl. the entire record database) and Source C for "Kantokuen", 関特演, "Kwantung Army Special Manoeuvre/Maneuver" and "Special Maneuver": **zero occurrences**. The US finding aids contain **no** documentation of BW-unit participation in Kantokuen.

**[FRAGMENT — Russian state source]** TASS, reporting archive materials presented by the Russian presidential National Center for Historical Memory, describes Kantokuen as the Japanese General Staff's plan to attack the USSR, contingent on a German capture of Leningrad; up to 20 divisions and tank units massed in Manchuria. Critically, the plan "envisaged, along with military measures, acts of terror and sabotage on a large scale, **including bacteriological sabotage against the Red Army**." A Shanghai agent message received in Moscow in **September 1941** says Japan's top brass considered war with the USSR settled and awaited only a pretext. https://tass.com/society/1806545

**[FRAGMENT — Chinese secondary, footnotes not reachable]** A Chinese account alleges that in **June 1941** the Chief of the General Staff sent an "instruction letter" to Unit 731 ordering intensified research on plague bacteria as a weapon against the USSR, specifically instructing mass cultivation of fleas ("plague fleas have enormous strategic significance"); that Imperial General Headquarters instructed the Kwantung Army Commander-in-Chief to "begin preparations for biological warfare against the USSR"; and that he convened a special meeting on the question. **These are allegations I could not verify against the underlying documents.** http://www.cngongji.cn/2014-07/15/c_126756559_3.htm
The same source states that after Pearl Harbor (December 1941) the military decided to further develop bio-chemical weapons, citing a 14-page operations-section document found in December 1994 by Rikkyo University lecturer **Ikō Toshiya (伊香俊哉)** at the Japan Defense Research Institute library calling for further expansion of Unit 731.

**COULD NOT VERIFY:** plans to attack **Khabarovsk, Blagoveshchensk or Voroshilov (Ussuriysk)** with BW in 1941 — no source names a city; **Unit 100 or Unit 1644 participation in Kantokuen** — no verifiable documentation found. Unit 1644 appears only in connection with the 1940 Zhejiang attacks, the 1941 Changde attack, and the 1942 Zhejiang–Jiangxi operation.

> **Correction to a claim in circulation:** your brief asked whether US records describe 1941 directly. A prior summary asserted "no US archival record directly describes 1941." That is too strong: **five US records are themselves dated 1941**, and roughly a dozen more, dated 1942–1947, describe 1941 events by name and date (§3.1 table, §3.4 below).

## 3.4 US records specifically dated 1941 (all five, **[FULL TEXT READ]** as Source B abstracts)

| Date | JWC | Title / abstract | Author / provenance |
|---|---|---|---|
| 1941/02/03 | 059 | "**Japanese attempts to secure virulent strains of yellow fever virus** — Concludes 'Japanese are endeavoring to obtain virulent strains of yellow fever virus for the purpose of waging bacterial warfare.'" | War Dept.; COL Simmons Smith, LTC Ralph C.; G-2/10568-40 folder 47B |
| 1941/03/13 | 075 | "**Japanese Bacteriological and Parachute Troops** — BW in the Philippines; subterfuge and cloak-and-dagger stories from a researcher, Glasounoff." | Medical Corps, Asst. Chief of Staff WPD, Col. Larry B. McAfee, folder 26 |
| 1941 (year only) | 042/15 | Extract from *Volcanic Isle* by Wilfred Fleisher — Matsuoka's warning that in a war with Japan she "**would not shrink from bacteria warfare, the use of poison gas, and …to create some new death ray.**" | WD, NDD, "BWJ Book III" |
| 1941/05/01 | 131/08 | Japanese Army report **No. 305**, "**Preparation of Culture Media for Determining Cause of Diseases in the Field**," by **Col ISHII**, Immunological Research Laboratory, Army Medical College & CPT Yoshio HAYAMA | CIA Foreign Documents Branch, CIA/FDB #102, Vol. I |
| 1941/06/30 | 132/01 | Japanese Army report **No. 320**, "**Tests on the Survival of Cholera Vibrio on Various Types of Food**," by **COL Shiro ISHII**, Army Medical College & Army Surgeon Maj. Takeo INOUYE | CIA/FDB #102, Vol. II |

Plus, dated later but recording 1941: **JWC 043/16 & 194** (ATIS 1376, 7 July 1944 — "medical supply to Kwantung Army in relation to bacterial warfare," keyed to a Japanese Field Manual dated **31 August 1941**); **JWC 187/04** (15 Aug 1944 — Ishii's April 1941 bacillus-bomb experiments at Harbin); **JWC 047/01** (22 Aug 1944 — the 4 Nov 1941 Changteh attack); **JWC 043/21** (24 Aug 1944 — the 14 Nov 1941 award to Ishii); **JWC 239** (16 Sep 1944 — ATIS Interrogation Report No. 449, "Shiro ISHII's work on a bacillus bomb in Harbin **in 1941**"); **JWC 057** (27 Dec 1944 — MID seeking POW information on "bacillus tactics" of water purification units); **JWC 042/16** (2 Dec 1942) and **JWC 060** (28 Jun 1945) on Changteh/Nov 1941; **JWC 002/08–09** (7 Oct 1945 — the Ha and Uji bomb count "by the middle of 1941"). All: https://www.archives.gov/files/iwg/japanese-war-crimes/select-documents.pdf

**COULD NOT VERIFY for 1941:** any US military-attaché report, ONI report, War Department G-2 report, State Department cable, American consulate report, Rockefeller Foundation International Health Division record, or League of Nations record **dated 1941** on Japanese BW in China beyond the five items above; and I could not read the bodies of those five.

---

# CONSOLIDATED "COULD NOT VERIFY" LIST

1. **No US document titled "Report on B"** and **no 1948 US "Summation" report** exists anywhere in Source A or Source B. Verified real: the **12 Dec 1947 "Summary Report of B.W. Investigations"** (Hill & Victor); Reports **A/G/Q**; the **20 June 1947 Fell Report**; and a **1977** US Army summation of US BW activities 1942–1977 (mentioned by Source D, not retrieved).
2. **No US text ranking Japanese purification/concentration of bacteria, freeze-drying/lyophilization, safety or quality control as backward or inferior** to US or German work. **No US text ranking Japanese aerosol/dispersal as superior.**
3. **No US-record mention** of the **Dalian/Dairen Institute of Health**, of **Mantetsu / South Manchuria Railway** in a BW-supply role, of **Japanese pharmaceutical manufacturers in Manchuria** supplying a BW unit, or of **関東軍衛生材料廠 / 奉天陸軍衛生材料支廠** by name.
4. **No 1941 US-record figure** for Unit 731 personnel strength, Pingfang building completion, monthly bacterial/bomb/flea output, or a Kwantung Army 1941 BW budget line.
5. **No US-record documentation of BW-unit participation in Kantokuen** (関東軍特種演習).
6. **Bodies of the four assessment reports** (Sanders, Thompson, Fell, Hill/Victor) were not read — only titles, dates, archival locations and reproduced quotations. Source B's scanned images are un-OCR'd.
7. **Pingfang Buildings 1–8 kana designations** (ro/i/ha/ni/ho/he/to/chi) — no source found at all.
8. **No "Naha Unit"** connection to the 1940 Ningbo or any 1941 China attack.
9. **No reliable documentation of typhoid, paratyphoid or anthrax at Changde in November 1941** — plague fleas only.
10. **No 1941 attacks at Jinhua, Shangrao, Suiyuan or Baotou**; **no distinct 1941 Ningbo air attack** (only a 1941 recurrence under occupation).
11. **Plans to attack Khabarovsk / Blagoveshchensk / Voroshilov with BW in 1941** — unverified; no source names a city.
12. **Unit designation for Canton** — Source A's text says **Unit 1688**; other literature uses **8604**. Unresolved in my sources.

# CONTESTED / DISPUTED

- **Ningbo**: drop 27 Oct 1940 vs first confirmed cases 30 Oct 1940 (reconcilable — do not conflate).
- **Ningbo flea quantity**: 2 kg (Kaneko) vs "as much as 5 kg" (Chinese official account).
- **Ningbo deaths**: 61 (Health Administration letter) / 111 named (museum) / 1,554 infected (Kaneko).
- **Changde deaths**: 7,643 is a documented **floor**, not a total — Xinhua itself says the true figure is higher.
- **Kaneko thesis date**: December 1943 vs 1949 in different Chinese reports.
- **NARA's "Chengde"** for the November 1941 attack — almost certainly a typo for **Changteh/Changde**; quote as printed and flag.
- **Report A/G page counts**: 406/372 pp (NARA finding aid) vs 408/376 pp (Yang Yanjun).

---

# SUPPLEMENT — second-pass findings on institutional links (source-type labelled)

Labels: **(a) US record**, **(b) Japanese record (JACAR / NIDS / published rosters / monograph)**, **(c) Chinese source**, **(d) Japanese testimony / trial record**.
Companion file: `Unit731_material_logistics_factcheck.md` (same folder).

## S1. The single best-documented BW materiel movement through Mukden and Dairen — **(d)**, full trial record

The English record of the **Khabarovsk trial** (*Materials on the Trial of Former Servicemen of the Japanese Army Charged with Manufacturing and Employing Bacteriological Weapons*, Moscow 1950) contains an **"ORDER OF THE FIELD RAILWAY ADMINISTRATION OF THE KWANTUNG ARMY"**, issued at **Hsinking, July 26**, signed by the Chief of the Field Railway of the Kwantung Army, **Lt. Gen. Kusaba**:

> "The chiefs of the Harbin, Mukden and Chinchow departments to draw up a plan and despatch the military unit **Nara**… The departments mentioned to be responsible for supplies along the route."

Distribution included the Naval Transport Administration and **the Dairen branch of Naval Transport Administration and its agency in Mukden**. The waybill covers **"unit Nara (part of unit Tsuboi now in Pingfan), 40 officers and men, with equipment (secret weapons and materiel)"**, routed **Pingfan → Harbin → Hsinking → Mukden → Shanhaikwan → Tientsin → Pukow**, destinations **Shanghai and Dairen**; **"1st consignment must arrive in Dairen by August 3, the 2nd by August 5, the 3rd by the evening of August 8"**; and **"This freight consists of special material which calls for secrecy and for this reason is not named in the waybill."**

Source: https://elearning.trree.org/file.php/1/MaterialsTrial-JapaneseArmy-1950.pdf — also in Johnson 2021, *JHMAS* 77(1):24–47, doi 10.1093/jhmas/jrab044, citing the same document. This is the strongest documentary link between a BW unit and the **Mukden and Dairen rail/port nodes**.

Related, same record: Onoue's Branch 643 "received equipment for cultivating bacteria, and **75 tons of materials for preparing the culture medium** necessary for the production of lethal bacteria"; Detachment 731 had "boilers for preparing culture media" with output of **300 kg plague/month, 800–900 kg anthrax, 1,000 kg cholera**; **Ei 1644** ≥10 kg plague per cycle; **4,500 flea incubators**; "731 and 100 were supplied with the necessary equipment," with 731 unable to supply new laboratory equipment itself.

## S2. 1941 supply of equipment to Unit 731 — **(c)**, archival release — partially fills the 1941 gap in §3.2

**Harbin Municipal Archives, December 2025**, first release of 20 holdings: **「日本特殊工業株式会社」** (Japan Special Industrial Co.) procured for Unit 731, **1940–1942** — 培養罐 (culture tanks), 濾水機 (water filters), 冷凍機 (refrigerators), **内藤式血清乾燥機** (Naito-type serum dryer), 野戦孵卵車 (field incubator vehicle), 野戦消毒車 (field disinfection vehicle), 電気機関車 (electric locomotive); each item from tens of thousands to millions of yen. **In January–August 1941 alone, 3,000 culture tanks.** Named individuals: 高瀬彰一 (executive director) writing to 高岡儀三郎 (Harbin branch manager) acknowledging installation of the 内藤式血清乾燥機; one document is an inventory table of bacterial-experiment supplies with unpaid balances.
Source: https://www.hrbdag.org.cn/zhxw/wddt/2025/12/20937.html *(page is GB18030-encoded)*
> **This is the only 1941-dated equipment-procurement figure found anywhere in this project, and it is a Chinese archival release — not a US record.**

## S3. 関東軍衛生材料廠 — location corrected to FENGTIAN/MUKDEN — **(b)**

JACAR C13010198500 (防衛省防衛研究所, 「満洲に於ける各種作戦の史的観察」, Shōwa 7–16) gives 「関東軍衛生材料廠」: **(1) 所在地 満洲国奉天市十港屯**; 敷地約四十万坪; 機能及設備 = 衛生材料の製造、補給並に貯蔵. In-unit 製薬工場 ~2,000 tsubo made 食塩注射液, ブドー糖ビタミンB液 and tablets; production was also ordered annually from **civilian pharmaceutical factories in the Fengtian area** and stored in unit warehouses. It supplied 全満各陸軍病院, the 野戦貨物廠 (Kwantung Army and North/Central China armies) and 在満各部隊. https://www.jacar.archives.go.jp/das/meta/C13010198500
JACAR C01003610500 (23 July 1940, 関東軍参謀長飯村穣 → 陸軍次官阿南惟幾, 「作戦資材整備状況の件」) names **奉天陸軍衛生材料支廠** and its **大連出張所**. https://www.jacar.archives.go.jp/das/meta/C01003610500
> **The working hypothesis that the depot sat at Hsinking/Changchun is wrong** — it was at Fengtian/Mukden. 衛生材料廠 is also the only body consistent with the English rendering "Kwantung Army Medical Supply Depot"; no evidence it translates 関東軍兵器廠 or 関東軍補給廠.

## S4. Cover names and unit designations — **(b)**, official 留守名簿

不二出版, 「十五年戦争陸軍留守名簿資料集」 (ed. 西山勝夫), ISBN 978-4-8350-8462-6: **関東軍防疫給水部 = 七三一部隊 = 「満洲第六五九部隊」**; **関東軍軍馬防疫廠 = 「満洲第100部隊」** (original roster title 「留守名簿 関東軍軍馬防疫廠 768」); separate volumes for 北支那防疫給水部 and 南方軍防疫給水部. https://www.fujishuppan.co.jp/books/rusumeibo5/
**(c)** Unit 1644 = 中支那防疫給水部 / 多摩部隊, established April 1939 by Ishii at the former Nanjing Central Hospital; 留守名簿 shows >2,700 personnel. https://www.19371213.com.cn/sylm/xwzx/202509/t20250919_5652780.html
**(c)** Unit 8604 = 南支那防疫給水部, 波第8604部隊; the 1945 「南支那防疫給水部波第八六零四部隊留守名簿」 (860 members) was donated by 松野誠也 to the Guangdong Archives and released May 2025. http://www.zgdazxw.com.cn/m/2025-07/17/content_503158.html
> **Unresolved discrepancy:** the NARA/IWG essay names Canton as **"Unit 1688"**, whereas Japanese and Chinese sources give 波第8604部隊.

## S5. Unit 100 — **(d)** Khabarovsk record adds organisation and a Dairen branch

Unit 100 was "the secret name of the **veterinary-bacteriological experimental detachment of the Kwantung Army**", working **"under the immediate guidance of Lieutenant General Takahashi Takaatsu, Chief of the Veterinary Service of the Kwantung Army"**; HQ and main personnel at **Changchun near the Chinese settlement Menchiangtung**; **branches at Kiamusze, Kokuzan and Dairen**; four divisions (2nd Division chief, five sections until 1943); personnel **"roughly 600 to 800"**; "The detachment had a **branch in Dairen**, and there were also **hippo-epizootic branches in Dairen and Hailar**." Same source: a **December 1943** joint conference with Wakamatsu, Lt. Col. Hosaka Koremichi, Maj. Yamaguchi Bunji, engineer Ida Kiyoshi and Lt. Gen. Takahashi. https://elearning.trree.org/file.php/1/MaterialsTrial-JapaneseArmy-1950.pdf
**(c)** Unit 100's 第四部 was a **資材補給部** (materials-supply division); its 第三部 manufactured serum and vaccines and injectables for military animals; 協力機構 included 馬疫研究処, 衛生技術廠, 東京大学伝染病研究所, 陸軍獣医学校. https://vipcard.cnki.net/ec/ffxs70/wz/LBYT201520050.html

## S6. Mantetsu → BW: the strongest Japanese-language link is a Mantetsu veterinary institute — **(b)/(c)**

**(b)** 小河孝, 『満州における軍馬の鼻疽と関東軍：**奉天獣疫研究所**・馬疫研究処・**100部隊**』, 文理閣, March 2020, 10+123 pp, ISBN 978-4-89259-861-6. Catalogue annotation states it elucidates 「奉天獣疫研究所、馬疫研究処、１００部隊（関東軍軍馬防疫廠）の設立の背景、鼻疽に関する研究と防疫活動、関係者を含む各機関の相互のつながり」. https://ci.nii.ac.jp/ncid/BB30761492
**(c)** 陳敬瑞, 「奉天满铁兽疫研究所与日本的侵华行动」, in 《九一八事变与日本侵华战争》, 社科文献出版社, June 2023 — the institute's activities are split 1925–1938 and 1938–1945. https://marxism.ssap.com.cn/skwx_marxism/LiteratureDetail.aspx?ID=19798 ; also 陳敬瑞, 「技術殖民視域下滿鐵獸疫研究所的防疫活動」, 《澳門學刊》 no. 6 (2024) p. 75. https://www.macaudata.mo/showbook?bno=j590006
> A **Mantetsu** institute (奉天獣疫研究所) with a documented research lineage into **Unit 100** — documented in Japanese and Chinese scholarship, **not** in the US finding aids. This is the closest thing found to a Mantetsu–BW link, and it runs through **research institutes, not funding, land or personnel transfers**.

## S7. Dalian Institute + Kwantung Government — **(d)/(b)** link, **(a)** negative

**(d)** 潮海辰亥, former **関東州庁警察部長** (Kwantung Government police chief), stated on **11 August 1954** that in **February–March 1944** "哈尔滨石井细菌部队所辖的大连细菌研究所" asked him to authorise the use of a living person from 西崛红十字医院 for a bacterial experiment; he recalled approving once and accepted responsibility. https://liaoning.nen.com.cn/network/liaoningnews/lnnewslndangan/2018/07/12/252446951012832266.shtml
**(b)** Reported via Xinhua (18 March 2026), 松野誠也 interview: in the 「陸軍高等文官名簿」 (compiled by the Army Ministry 1944 and 1945; found at the National Archives of Japan in 2024), **安東洪次 — "731部队大连分支机构的负责人"** — received the highest evaluation, followed by 石光薫, 岡本良三, 吉村寿人, 二木秀雄. *(Japanese document, Chinese state-media reporting channel.)* http://www.news.cn/20260318/e4aa9935a5f6411bbfd8519b7f2b3e6a/c.html
**(a) NEGATIVE:** no US documentary evidence of any US investigation of the Dalian Institute; "Dairen"/"Dalian" are absent from the IWG database. US Dalian-area coverage runs through Mukden POW Camp Hoten and through rail logistics.

## S8. Manufacturers — **(c)** archive plus **(a)** negatives

See **S2**. **(a)** US-record negatives: 26 April 1945, **CPMB 1514T** — "Identifies Kitazato Institute for Infectious Diseases as a **civilian facility with NO affiliations to the military**"; 27 March 1945, CPMB 41J-2982-MI — a POW identifies a large lab sponsored jointly by Tokyo Imperial University and the Japanese Government, "believes it is major producer of serums & vaccines"; 23 April 1945, MIS 121644 — germs shipped from Osaka Chemical Research Institute to Shanghai. **No occurrence of "pharmaceutical" and no named Japanese commercial pharma firm supplying BW units anywhere in the IWG database.**

## S9. Additional items from the 1,235-record IWG database — **(a)**

- **October 1945**, RG 165 box 488 file 181, GHQ USAFPAC, **LTC Murray Sanders & LT Harry Young** — five documents: "**Organization Table of the KW Water Purification Department (Boeki Kyusuibu)**… personnel under ISHII"; "**Sketch Map Showing Distribution of Units in the Water Purification Department**" (Japan, Philippines, SE Asia, China & Manchuria); "**Annual Production Capacity of Vaccines and Serums by the Kwantung Army Water Purification Department**"; "**Chain of Command of Water Purification Department**… WPU under the Ministry of War for Japan proper and under the Imperial Staff and Kwantung Army outside of Japan"; "**Duties of the Water Purification Department**… defensive in nature."
- **1944 (January–June)**, JWC 77/1 — intelligence revealed "extensive production of bacteria sources both in Japan and Manchuria; of **supplies on hand in Shanghai, Nanking, and Mukden**; and potential means of delivery in bacillus bombs or free balloons."
- Complete negatives in that database: **zero** occurrences of "Dairen", "Dalian", "Mantetsu", "South Manchuria", "pharmaceutical"; no US document names 関東軍衛生材料廠; no itemised transfer **from** the depot **to** 731/100/1644.

## S10. Additional "COULD NOT VERIFY" (this supplement)

1. No US document names the Kwantung Army Medical Supply Depot; its location, functions and distribution exist **only** in the Japanese NIDS/JACAR record.
2. No itemised transfer from the depot to Units 731 / 100 / 1644.
3. Depot 出張所 list is truncated in the JACAR catalogue text.
4. **満鉄調査部 and 満鉄中央試験所: nothing found** on BW involvement; likewise no Mantetsu funding, land or personnel transfer to a BW unit.
5. No US investigation of the Dalian Institute found.
6. No US-record establishment dates for Units 1855 / 8604 / 9420; Unit 1644's April 1939 date is Chinese-source only.
7. IWG "Unit 1688" vs 8604 for Canton unresolved.
8. No named Japanese pharmaceutical manufacturer supplying BW units in any US record.
9. Maker of the 石井式培養罐 unidentified; 内藤式血清乾燥機 ↔ 内藤良一 **not verified**.
10. Harris and Williams & Wallace were **not** read at first hand — every attribution to them is second-hand.
11. Tsuneishi's Asia-Pacific Journal article (apjjf.org) returned 403 — not read.
12. "満洲第319部隊" and the "8,000 victims" / "8,000 labourers" figures appear **only** in Chinese sources — treat as Chinese-source only.
13. 満鉄衛生研究所 founding date inconsistent (Aug 1925 vs Jan 1926 start of operations).
14. **Unit 100's command relationship conflicts between two Chinese sources** (Kwantung Army C-in-C vs nominal Kwantung Army HQ but direct IGHQ/General Staff command).
15. The Niigata University repository paper downloaded but its text extraction produced unusable mojibake (custom font encoding) — not used.
