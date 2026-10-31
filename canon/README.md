# canon · 唯一真源

> 本目录存放**机器可读的单一真源**。文档（`docs/`、`MEDSystem/`、`MED_Demo Rule/`）只引用，不重复硬编码。
> 生成物与镜像不得手改；改真源走提交。

| 文件 | 作用 | 使用方 |
|---|---|---|
| `dates.tsv` | 日历锚点（公历↔农历、天号） | 写作手册、考证索引、`med brief` |
| `timeline.tsv` | 节点时间线（含状态：已落画布／策划案） | 交接稿、总索引 |
| `rules.tsv` | 口径规则表（从裁定档案拆出，机器读） | `lint`、检查器 |
| `status.tsv` | 可追踪对象状态（active／blocked／done／superseded） | `med refs`、`med handoff` |
| `terms.tsv` | 术语表（药铺/药房、通兰、纪年） | 写作手册、校对 |
| `lexicon.tsv` | 词表（迁移自 `tools/med-canvas-verify/`） | `lint`、`index` |

## 维护规则

1. 只增不改语义；字段废弃标 `deprecated`，不删行。
2. 每行必须有唯一主键（date／id／term）。
3. 改真源必须同步改引用方，否则 `scan_canon` 报冲突。
4. 日历以 `dates.tsv` 为准：**2/8＝腊月廿三（小年）**，1942 年腊月为小月，腊月廿九即除夕。
