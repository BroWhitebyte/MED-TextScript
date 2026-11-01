# tools/archive — 一次性手术脚本（2026-11-01 归档）

> 这里放**一次性手术/修复脚本**：需要时手工调用，不进 `med` 六命令，也不在日常流水线里。
> 归档不删除、保留可回滚；需要恢复时 `git mv tools/archive/<file> tools/` 即可。

| 脚本 | 用途 | 归档理由 |
|---|---|---|
| `repair_ncanvas.js` | 修复画布 JSON 的损坏节点 | 一次性修复，运行有覆盖风险 |
| `restore_nodes.js` | 从备份恢复画布节点 | 事故恢复用 |
| `patch_links.js` | 批量修补连线 | 一次性 |
| `loss_report.js` | 对比改动前后丢失的正文 | 改稿三步的辅助，非日常 |

## 仍在 tools/ 的常用脚本

`med.js`（六命令入口）、`med_check.js`、`med_brief.js`、`scan_canon.js`、`sync_skills.js`、
`audit_flow.js`、`audit_choice_cost.js`、`ncanvas_metrics.js`、`ncanvas_flow.js`、`flow_depth.js`、
`diff_ncanvas.js`、`report_overlaps.js`、`ncanvas_audit.js`、`kanglian_search.js`、`kanglian_page.js`、
`med-canvas-verify/`（引擎与扫描器）。
