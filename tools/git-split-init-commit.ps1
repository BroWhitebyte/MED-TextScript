#requires -Version 5.1
<#
.SYNOPSIS
    git split-init-commit - 将 MED-TextScript 初始巨型提交拆分为语义化提交

.DESCRIPTION
    适用条件: 当前分支只有 1 个初始提交(或拆分未完成), 且工作区无无关改动。
    执行流程: 安全检查 -> 创建备份分支 backup/init-commit -> 清空历史
    -> 按 角色卡/剧情/系统/示例/考据/说明/裁定/配置 分批重建提交
    -> 校验提交数并打印推送命令。支持中断后重跑, 已完成的批次自动跳过。

.EXAMPLE
    git split-init-commit
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2.0

function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][object[]]$GitArgs)
    $cmd = @()
    foreach ($x in $GitArgs) {
        if ($x -is [System.Array]) { $cmd += @($x) } else { $cmd += [string]$x }
    }
    & git @cmd
    if ($LASTEXITCODE -ne 0) {
        throw "git 命令失败: git $($cmd -join ' ') (exit $LASTEXITCODE)"
    }
}

# ---- 批次定义 ----
$batches = @(
    @{ Subject = 'feat(characters): 导入全部角色卡'
       Body    = @('- 41 个角色卡, 覆盖中野三郎、晓梅、佟三爷等主要人物', '- 含角色裁定要点与关系网备注')
       Paths   = @('MEDNarrative/Characters') },
    @{ Subject = 'feat(flow): 导入主线剧情流程与对话导出'
       Body    = @('- 序章、第一章、第二天主线画布(.canvas/.ncanvas)', '- 9 个 .dialogue 导出文件, 供 Godot Dialogue Manager 读取')
       Paths   = @('MEDNarrative/Flows', 'MEDNarrative/Exports') },
    @{ Subject = 'feat(system): 导入系统规则文档'
       Body    = @('- 时间、地图、NPC势力、属性状态、行动、任务、资源道具、分支对话', '- 含术语表与地图网格定位表')
       Paths   = @('MEDSystem') },
    @{ Subject = 'feat(demo): 导入示例事件与规则'
       Body    = @('- MED_Demo Event 示例事件 17 个', '- MED_Demo Rule 示例规则 16 个, 含 Hidden_Meaning 子模块')
       Paths   = @('MED_Demo Event', 'MED_Demo Rule') },
    @{ Subject = 'feat(research): 导入1942年伪满考据资料'
       Body    = @('- 军粮供应、县城医疗、城门岗哨、粮谷出荷等论据索引与汇集报告', '- 含核查材料、链接抓取存档与收藏夹图片')
       Paths   = @('MED_资料库') },
    @{ Subject = 'docs(guide): 导入叙事工作流使用说明'
       Body    = @('- Obsidian 内「流程设计→对话编写→导出」全流程说明(v1.3)')
       Paths   = @('MEDNarrative/使用说明.md') },
    @{ Subject = 'docs(decisions): 落档角色卡模糊点裁定速查'
       Body    = @('- 21 项裁定要点: 慎介、晓梅、中野、H56、H69、王小等', '- 供 Obsidian 快速填写对应字段')
       Paths   = @('MEDNarrative/讨论结果落档速查（Obsidian快速填写对应）.md') },
    @{ Subject = 'chore(obsidian): 导入Obsidian工作区与插件配置'
       Body    = @('- narrative-canvas / narrative-tool 插件及配置', '- workspace*.json 与插件 data.json 已加入 .gitignore')
       Paths   = @('MEDNarrative/.obsidian') },
    @{ Subject = 'chore(git): 导入提交规范与仓库工具'
       Body    = @('- 新增 .gitmessage 提交模板与 CONTRIBUTING.md 规范', '- 新增 README 与 tools/git-split-init-commit 一键拆分工具')
       Paths   = @('.gitattributes', '.gitignore', '.gitmessage', 'CONTRIBUTING.md', 'README.md', 'tools') }
)

# 允许出现的未跟踪新文件/目录 (属于各批次)
$allowedPaths = @('.gitmessage', 'CONTRIBUTING.md', 'README.md', 'tools')
foreach ($b in $batches) { foreach ($p in $b.Paths) { $allowedPaths += $p } }
# 允许被修改的已跟踪配置文件 (最终批次会一并提交)
$allowModified = @('.gitattributes', '.gitignore')
# 已知批次标题 (用于区分「原始单提交」与「拆分中途」状态)
$knownSubjects = @($batches | ForEach-Object { $_.Subject })

Write-Host "== git split-init-commit =="

# ---- 0. 定位仓库根目录 ----
$rootArgs = @('rev-parse', '--show-toplevel')
$root = Invoke-Git @rootArgs
Set-Location -LiteralPath $root

# ---- 1. 安全检查 ----
$countArgs = @('rev-list', '--count', 'HEAD')
$count = (Invoke-Git @countArgs).Trim()
if ([int]$count -gt $batches.Count) {
    throw "当前分支有 $count 个提交, 超出预期(1~$($batches.Count)), 本工具不适用。"
}
if ($count -eq '0') { throw "当前分支没有提交, 无法拆分。" }
$branchArgs = @('symbolic-ref', '--short', 'HEAD')
$branch = Invoke-Git @branchArgs
if ($branch -ne 'main' -and $branch -ne 'master') {
    throw "当前分支为 $branch, 请先切换到 main/master 再执行。"
}

# 工作区检查: 只允许批次相关的新文件/目录, 以及允许修改的配置文件
$untracked = @(& git @('-c', 'core.quotepath=false', 'ls-files', '--others', '--exclude-standard'))
foreach ($p in $untracked) {
    $allowed = $false
    foreach ($f in $allowedPaths) {
        if ($p -eq $f) { $allowed = $true; break }
        if ($p.StartsWith($f + '/')) { $allowed = $true; break }
    }
    if (-not $allowed) { throw "存在不属于任何批次的无跟踪文件: $p (请先提交或删除)" }
}
$modified = @(& git @('-c', 'core.quotepath=false', 'diff', '--name-only')) + @(& git @('-c', 'core.quotepath=false', 'diff', '--cached', '--name-only'))
foreach ($p in $modified) {
    if ($allowModified -notcontains $p) { throw "工作区存在未预期的改动: $p (请先提交或还原)" }
}

# ---- 2. 判断状态: 原始单提交 vs 拆分中途 ----
$headSubject = (& git log '-1' '--format=%s')
$isOriginal = ($count -eq '1' -and $knownSubjects -notcontains $headSubject)

if ($isOriginal) {
    # ---- 3a. 原始状态: 记录作者、备份、清空历史 ----
    $initAuthorName  = (& git log '-1' '--format=%an')
    $initAuthorEmail = (& git log '-1' '--format=%ae')
    if (-not (& git branch '--list' 'backup/init-commit')) {
        Invoke-Git @('branch', 'backup/init-commit', 'HEAD')
        Write-Host "已创建备份分支: backup/init-commit"
    }
    else {
        Write-Host "备份分支 backup/init-commit 已存在, 沿用"
    }
    if (-not (& git config user.name)) {
        Invoke-Git @('config', 'user.name', $initAuthorName)
        Write-Host "user.name 未配置, 已沿用初始提交作者: $initAuthorName"
    }
    if (-not (& git config user.email)) {
        Invoke-Git @('config', 'user.email', $initAuthorEmail)
        Write-Host "user.email 未配置, 已沿用: $initAuthorEmail"
    }
    Invoke-Git @('update-ref', '-d', ("refs/heads/" + $branch))
    Invoke-Git @('read-tree', '--empty')
    Write-Host "已清空分支 $branch 的历史, 文件保留在工作区"
}
else {
    Write-Host "检测到拆分已在进行, 跳过历史清空, 继续完成剩余批次"
}

# ---- 4. 逐批提交 (已完成的批次自动跳过) ----
$i = 0
foreach ($b in $batches) {
    $i++
    foreach ($p in $b.Paths) {
        if (-not (Test-Path -LiteralPath $p)) { throw "路径不存在: $p (第 $i 批)" }
    }
    $uArgs = @('-c', 'core.quotepath=false', 'ls-files', '--others', '--exclude-standard', '--'); $uArgs += $b.Paths
    $batchUntracked = @(& git @uArgs)
    $dArgs = @('-c', 'core.quotepath=false', 'diff', '--name-only', '--'); $dArgs += $b.Paths
    $batchModified = @(& git @dArgs)
    if ($batchUntracked.Count -eq 0 -and $batchModified.Count -eq 0) {
        Write-Host ("[{0}/{1}] 跳过(已完成): {2}" -f $i, $batches.Count, $b.Subject)
        continue
    }
    $addArgs = @('add', '--'); $addArgs += $b.Paths
    Invoke-Git @addArgs
    $commitArgs = @('commit', '-m', $b.Subject, '-m', ($b.Body -join "`n"))
    Invoke-Git @commitArgs
    Write-Host ("[{0}/{1}] {2}" -f $i, $batches.Count, $b.Subject)
}

# ---- 5. 校验 ----
$finalArgs = @('rev-list', '--count', 'HEAD')
$finalCount = (Invoke-Git @finalArgs).Trim()
if ($finalCount -ne $batches.Count.ToString()) {
    throw "拆分异常: 实际提交数 $finalCount != 预期 $($batches.Count), 请用 backup/init-commit 恢复"
}
Write-Host ""
Write-Host "拆分完成, 共 $finalCount 个提交:"
Invoke-Git @('log', '--oneline')
Write-Host ""
Write-Host "下一步 (确认无协作者 clone 过本仓库后):"
Write-Host "  git push --force-with-lease origin $branch"
Write-Host "确认无误后删除备份分支:"
Write-Host "  git branch -D backup/init-commit"