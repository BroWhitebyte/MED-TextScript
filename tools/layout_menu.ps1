param(
  [string]$Path = '',
  [string]$Mode = '',
  [switch]$NoOpen
)
# MED 画布排布切换（横排 / 方形）—— 交互菜单；也可带参数直接跑：
#   powershell -File layout_menu.ps1 -Path "…\X.ncanvas" -Mode row|square|toggle [-NoOpen]
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'ncanvas_layout.ps1')

$repoRoot = Split-Path $PSScriptRoot -Parent
$flowsDir = Join-Path $repoRoot 'MEDNarrative\Flows'

function Read-Doc([string]$p) {
  return ([System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($p))) | ConvertFrom-Json
}
function Save-Doc($doc, [string]$p) {
  $json = $doc | ConvertTo-Json -Depth 12
  # ConvertTo-Json 会把非 ASCII 转成 \uXXXX，这里还原成真正的汉字
  $json = [regex]::Replace($json, '\\u([0-9a-fA-F]{4})', { param($m) [string][char][int]('0x' + $m.Groups[1].Value) })
  [System.IO.File]::WriteAllText($p, $json, (New-Object System.Text.UTF8Encoding($false)))
}
function ModeName([string]$m) { if ($m -eq 'row') { return '横排（长条）' } else { return '方形（蛇形分带）' } }

Write-Host ''
Write-Host '=============================================='
Write-Host '  MED 画布排布切换：横排 / 方形'
Write-Host '=============================================='

# ---------- 1) 选定目标文件 ----------
$target = $Path
if (-not $target) {
  $files = @(Get-ChildItem -LiteralPath $flowsDir -Recurse -Filter *.ncanvas -ErrorAction SilentlyContinue | Sort-Object FullName)
  if ($files.Count -eq 0) { Write-Host "未找到 .ncanvas：$flowsDir"; exit 1 }
  Write-Host ''
  Write-Host '可选画布：'
  for ($i = 0; $i -lt $files.Count; $i++) {
    Write-Host ("  [{0,2}] {1}" -f ($i + 1), $files[$i].FullName.Substring($repoRoot.Length + 1))
  }
  $sel = Read-Host '输入编号（回车＝1）'
  if (-not $sel) { $sel = '1' }
  $idx = [int]$sel - 1
  if ($idx -lt 0 -or $idx -ge $files.Count) { Write-Host '编号无效，退出。'; exit 1 }
  $target = $files[$idx].FullName
}
if (-not (Test-Path -LiteralPath $target)) { Write-Host "文件不存在：$target"; exit 1 }

$doc = Read-Doc $target
$curMode = Get-CanvasLayoutMode $doc
$name = [System.IO.Path]::GetFileName($target)

# ---------- 2) 选定排布 ----------
if (-not $Mode) {
  Write-Host ''
  Write-Host ("目标：{0}" -f $name)
  Write-Host ("当前：{0}" -f (ModeName $curMode))
  Write-Host ''
  Write-Host '  [1] 横排 —— 一条长龙，便于顺着分支逐段读逻辑'
  Write-Host '  [2] 方形 —— 蛇形分带，便于一屏总览'
  Write-Host '  [3] 切换 —— 自动判断当前排布并切到另一种'
  Write-Host '  [0] 退出'
  $m = Read-Host '选择'
  switch ($m) {
    '1' { $Mode = 'row' }
    '2' { $Mode = 'square' }
    '3' { $Mode = 'toggle' }
    default { Write-Host '已取消。'; exit 0 }
  }
}
if ($Mode -notin @('row', 'square', 'toggle')) { Write-Host "模式无效：$Mode（应为 row / square / toggle）"; exit 1 }
$effective = if ($Mode -eq 'toggle') { if ($curMode -eq 'row') { 'square' } else { 'row' } } else { $Mode }

# ---------- 3) 备份 → 变换 → 写回（失败回滚） ----------
$bak = Join-Path $env:TEMP ("{0}.{1}.bak.ncanvas" -f [System.IO.Path]::GetFileNameWithoutExtension($target), (Get-Date -Format 'yyyyMMdd-HHmmss'))
Copy-Item -LiteralPath $target -Destination $bak -Force
try {
  $stats = Invoke-CanvasLayout -Doc $doc -Mode $Mode
  Save-Doc $doc $target
  Write-Host ''
  Write-Host ("完成：{0}" -f $name)
  Write-Host ("  排布：{0}" -f (ModeName $stats.mode))
  Write-Host ("  结构：{0} 列 × {1} 带（深度 {2}）" -f $stats.cols, $stats.bands, $stats.levels)
  Write-Host ("  包围盒：{0} × {1} px（长宽比 {2}）  重叠节点对：{3}" -f $stats.width, $stats.height, $stats.aspect, $stats.overlaps)
  Write-Host ("  备份：{0}" -f $bak)
} catch {
  if (Test-Path -LiteralPath $bak) { Copy-Item -LiteralPath $bak -Destination $target -Force }
  Write-Host "失败：$_"
  Write-Host '已从备份回滚。'
  exit 1
}

# ---------- 4) 可选：在 Obsidian 中打开 ----------
$rel = $null
if ($target.StartsWith($repoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  $rel = $target.Substring($repoRoot.Length + 1).Replace('\', '/')
}
if ($NoOpen -or $env:NO_OPEN -eq '1') { exit 0 }
if (-not $rel) {
  Write-Host '该文件不在库（仓库根）内，跳过“在 Obsidian 中打开”。'
  exit 0
}
$enc = ($rel -split '/' | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/'
$vault = [uri]::EscapeDataString((Split-Path $repoRoot -Leaf))
$uri = "obsidian://open?vault=$vault&file=$enc"
$ans = Read-Host '现在用 Obsidian 打开看效果？(Y/N，回车＝N)'
if ($ans -and $ans.Trim().ToUpper().StartsWith('Y')) {
  Start-Process $uri
  Write-Host ("已发送打开请求：{0}" -f $uri)
  Write-Host '提示：若该画布已打开，请关闭该标签页后重新打开（或 Ctrl+R 重载），否则看到的仍是旧排布。'
}
exit 0
