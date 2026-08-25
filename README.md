# MED-TextScript

伪满洲国 1942 年背景的文字冒险叙事项目素材库。
基于 Obsidian 的工作流: **流程设计 (Flow) → 对话编写 (Dialogue) → 导出游戏可用文件**。

## 目录结构

| 目录 | 内容 |
|------|------|
| `MEDNarrative/` | Obsidian 叙事库: 角色卡 `Characters/`、主线流程 `Flows/`、对话导出 `Exports/` |
| `MEDSystem/` | 系统规则: 时间 / 地图 / NPC势力 / 属性状态 / 行动 / 任务 / 资源道具 / 分支对话 / 术语表 |
| `MED_Demo Event/` | 示例事件 (1942年1月30日 ~ 2月1日) |
| `MED_Demo Rule/` | 示例规则与问题清单 (含 `Hidden_Meaning/` 分支索引) |
| `MED_资料库/` | 历史考据: 论据索引、汇集报告、核查材料、链接抓取存档 |
| `tools/` | Git 工具 (见下方) |

## 快速开始 (合作者)

```powershell
git clone <repo-url>
cd MED-TextScript
git config commit.template .gitmessage   # 启用提交模板
```

- 提交与推送规范见 [CONTRIBUTING.md](CONTRIBUTING.md), 请先阅读;
- 将 `tools/` 加入 PATH 后可调用 git 子命令工具:
  ```powershell
  $env:Path += ";$PWD\tools"
  ```

## 工具

| 命令 | 用途 |
|------|------|
| `git split-init-commit` | 将初始巨型提交拆分为语义化提交 (仅限单提交仓库) |