# 画布考证核验工具（med-canvas-verify）

本目录是项目**第四类体检**——史料考证核验的引擎与数据，随仓库版本化。
工作区技能目录 `.dsh\skills\med-canvas-verify\` 是同一套东西在 DSH 里的安放位置：
**两边同源，改动后请同步另一处**（工作区侧另有 `.cache\` 与 `bookmap.json` 两个运行期文件）。

## 文件

| 文件 | 角色 |
|---|---|
| `med_verify.js` | 引擎（Node，无第三方依赖）：`list`／`terms`／`lint`／`index`／`search`／`batch`／`index-events`／`history`／`lexicon`／`build-citations` |
| `scan_events.js` | 扫描 `MEDNarrative\Flows` 重建登记表 `events.json`（代号 → 画布文件 + 时点） |
| `lexicon.tsv` | **查什么**：词表（主词／别名／消歧／证据等级／时点闸门／用词裁定），`^` 分隔 10 列 |
| `rules.json` | **怎么判**：时点、闸门级别、配额、输出目录、主题分组、元层豁免 |
| `citations.seed` | 出处台账源文件（人写，`\|` 分隔 9 列） |
| `citations.jsonl` | 出处台账编译产物（`build-citations` 生成，勿手改） |
| `events.json` | 事件登记表（`scan_events.js` 生成；路径为仓库相对） |

规范全文见 `MEDSystem\写作手册\画布检查规范_考证篇.md` 与 `画布考证核验_操作.md`。

## 用法

```powershell
# 在仓库根（MED-TextScript\）执行
node tools\med-canvas-verify\scan_events.js --write          # 画布新增/改名后
node tools\med-canvas-verify\med_verify.js list
node tools\med-canvas-verify\med_verify.js lint  --event 101 --all
node tools\med-canvas-verify\med_verify.js index --event 101 --write
node tools\med-canvas-verify\med_verify.js batch --only 101,102 --write
```

行为约定：**只读画布**（任何模式都不写 `.ncanvas`）；`index`／`batch` 默认 dry-run，落盘要 `--write`；
`lint` 有 error 时退出码 1；配额见 `rules.json.caps`（查询 120／取页 40），超限即停并报账。

## 外来依赖

- **检索库**：本机抗联 OCR 全文库，默认 `D:\抗联整理_OCR成果\_index\library.final.db`
  （见 `rules.json.lib`）。换机器用环境变量覆盖：`MED_LIB_DB`、`MED_LIB_API`。
  **库不可达时只有 `lint` 可用**——索引整节降级为「待核」，这是设计使然。
- **`bookmap.json`**（书名 → 库内 id）由库在线时生成，不入库（见 `.gitignore`）；
  缺它时 `build-citations` 会退回库内解析。
- 相关工具（同目录层级）：`tools\ncanvas_metrics.js`（文字量与时长六参数）、
  `tools\ncanvas_flow.js`（按阅读顺序导出全文）、`tools\audit_choice_cost.js`（选项代价）、
  `tools\audit_flow.js`（结构闭环）、`tools\report_overlaps.js`（框体重叠）。
