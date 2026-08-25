# MED-TextScript 提交与推送规范

> 合作者必读。本仓库为伪满洲国 1942 年背景的文字冒险叙事素材库,
> 以 Markdown / Obsidian 文件为主。提交规范的目标是:
> **一行能看懂, 一条能回滚**。

## 1. 提交信息格式

每条提交由「标题 + 空行 + 正文」组成:

```
<type>(<scope>): <标题>

- 正文要点 1
- 正文要点 2
```

| 要素 | 规则 |
|------|------|
| 标题 | ≤ 50 字符, 概括「做了什么」, 中文建议 25~35 字 |
| 正文 | 空一行后写「为什么 / 依据 / 待办」, 每行 ≤ 72 字符 |
| 语言 | 标题用中文, type / scope 固定英文小写 |

### type / scope 速查

| type | 含义 | 本库 scope |
|------|------|-----------|
| `feat` | 新增内容 | `characters`(角色卡) `flow`(剧情) `system`(规则) `demo`(示例) `research`(考据) |
| `fix` | 修正矛盾 / 错误 | 同上, 如 `fix(research): 修正肺癌确诊年份` |
| `docs` | 文档与裁定落档 | `decisions`(讨论落档) `guide`(使用说明) |
| `chore` | 配置与工具 | `git`(仓库配置) `obsidian`(工作区/插件) |
| `refactor` | 结构重构, 不改行为 | 按需 |
| `test` | 测试 | 按需 |

### 正例 / 反例

```text
✓ feat(characters): 新增角色卡 中野三郎
✓ fix(research): 修正粮谷出荷数据引注
✓ docs(decisions): 落档角色卡模糊点21项裁定

✗ 角色卡模糊点21项裁定完成: 慎介中文纸面足口语生; 晓梅知情多渠道; ……(超长标题)
✗ update files (无 type/scope, 无法检索)
✗ 更新了一堆东西 (看不出改动范围)
```

## 2. 提交粒度

- 一个提交只做一件事: 一个裁定落档 / 一个场景 / 一批考据材料 / 一条规则修订;
- 完成即提交, 不要攒批; 未完成的半成品把「待办」写进正文, 或不开提交;
- 每个提交后仓库应保持可用 (不要提交半截文件导致 Obsidian 报错)。

## 3. 本地环境配置 (一次性)

```powershell
# 启用提交模板 (git 自动填充, # 注释行自动剥离)
git config commit.template .gitmessage

# 编辑器 (可选): 用 VSCode 写提交信息
git config core.editor "code --wait"

# 将 tools/ 加入 PATH, 即可直接使用 git 子命令工具
$env:Path += ";$PWD\tools"          # 仅当前会话
# setx Path "$env:Path;$PWD\tools"  # 永久生效 (新开终端后可用)
```

Git Bash:

```bash
export PATH="$PWD/tools:$PATH"
```

## 4. 推送流程

1. 提交前自查: `git status`, 确认没有误加运行时文件
   (`workspace*.json` / 插件 `data.json` 已在 .gitignore 中);
2. 先同步再推: `git pull --rebase origin main` (保持线性历史);
3. 小步推送: 完成一批改动就 push, 不要攒一个月推一次;
4. 大改动走分支 + PR:
   ```bash
   git checkout -b feat/chapter2
   git push -u origin feat/chapter2
   # GitHub 上发起 PR, 评审通过后合并
   ```
5. 历史保护: 已推送的提交禁止 rebase / amend; 确需重写时用
   `git push --force-with-lease`, 并提前告知协作者;
6. 冲突预防: `.canvas` / `.ncanvas` / `.dialogue` 是 Obsidian 生成的 JSON,
   多人同时编辑同一文件极易冲突 —— 按场景分工、编辑前先 pull、错峰修改。

## 5. 一键拆分工具 git split-init-commit

> 仅用于「初始巨型提交」的仓库 (当前分支只有 1 个提交)。

```powershell
git split-init-commit
```

行为:

1. 安全检查: 提交数必须为 1, 工作区不得有无关改动;
2. 自动创建备份分支 `backup/init-commit` (指向原提交, 可随时恢复);
3. 按 角色卡 / 剧情 / 系统 / 示例 / 考据 / 说明 / 裁定 / 配置 分批重建提交;
4. 完成后打印校验结果与推送命令。

推送前确认无协作者 clone 过本仓库, 然后:

```powershell
git push --force-with-lease origin main
git branch -D backup/init-commit   # 确认无误后删除备份
```