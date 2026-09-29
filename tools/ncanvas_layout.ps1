# Shared layouts for narrative-canvas .ncanvas documents.
#   Mode 'square' : snake bands, bounding box ~square (default for conversions)
#   Mode 'row'    : one long horizontal run (single row, siblings stacked vertically)
# Dictionary-safe: works on both PSCustomObject (parsed JSON) and [ordered] hashtables (built in memory).

function GetV($o, [string]$k) {
  if ($null -eq $o) { return $null }
  if ($o -is [System.Collections.IDictionary]) { return $o[$k] }
  $p = $o.PSObject.Properties[$k]
  if ($p) { return $p.Value }
  return $null
}
function SetV($o, [string]$k, $v) {
  if ($o -is [System.Collections.IDictionary]) { $o[$k] = $v; return }
  $p = $o.PSObject.Properties[$k]
  if ($p) { $p.Value = $v } else { $o | Add-Member -NotePropertyName $k -NotePropertyValue $v -Force }
}

function Get-CanvasGraph($Doc) {
  $proj = GetV $Doc 'project'
  $nodes = @(GetV $proj 'nodes')
  $links = @(GetV $proj 'links')
  if ($nodes.Count -eq 0) { throw 'document has no nodes' }

  $adj = @{}
  foreach ($l in $links) {
    $f = [string](GetV $l 'from'); $t = [string](GetV $l 'to')
    if (-not $adj.ContainsKey($f)) { $adj[$f] = New-Object System.Collections.ArrayList }
    [void]$adj[$f].Add($t)
  }

  $root = 'n_entry'
  $hasEntry = $false
  foreach ($n in $nodes) { if ([string](GetV $n 'id') -eq 'n_entry') { $hasEntry = $true } }
  if (-not $hasEntry) { $root = [string](GetV $nodes[0] 'id') }

  $depth = @{}
  # 流程深度＝SCC 缩点后的最长路径（与插件 med-layout-toggle 同算法，共用 tools/flow_depth.js）
  # 目的：节点排在其所有上游之后，汇合点与 End 不会被"提前"到上/左端；环内节点同层。
  $flowJs = $null
  foreach ($cand in @(
      $(if ($PSScriptRoot) { Join-Path $PSScriptRoot 'flow_depth.js' } else { $null }),
      'C:\Users\white\Downloads\MED Project\06_MED_TextScript\MED-TextScript\tools\flow_depth.js',
      'C:\Users\white\Downloads\DS workspace\_tools\flow_depth.js'
    )) {
    if ($cand -and (Test-Path -LiteralPath $cand)) { $flowJs = $cand; break }
  }
  $usedShared = $false
  if ($flowJs -and (Test-Path -LiteralPath $flowJs)) {
    $nodeIds = New-Object System.Collections.ArrayList
    foreach ($n in $nodes) { [void]$nodeIds.Add([string](GetV $n 'id')) }
    $edgePairs = New-Object System.Collections.ArrayList
    foreach ($l in $links) { [void]$edgePairs.Add(@([string](GetV $l 'from'), [string](GetV $l 'to'))) }
    $payload = @{ root = $root; nodes = @($nodeIds); links = @($edgePairs) } | ConvertTo-Json -Depth 6 -Compress
    $tmp = Join-Path $env:TEMP ('flowdepth_' + [guid]::NewGuid().ToString('N') + '.json')
    [System.IO.File]::WriteAllText($tmp, $payload, (New-Object System.Text.UTF8Encoding($false)))
    try {
      $out = & node $flowJs $tmp 2>$null
      if ($LASTEXITCODE -eq 0 -and $out) {
        $parsed = $out | ConvertFrom-Json
        foreach ($p in $parsed.depth.PSObject.Properties) { $depth[$p.Name] = [int]$p.Value }
        $usedShared = $true
      }
    } finally { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue }
  }
  if (-not $usedShared) {
    # 兜底：旧 BFS（flow_depth.js 不在时）
    $depth[$root] = 0
    $q = New-Object System.Collections.Queue
    $q.Enqueue($root)
    while ($q.Count -gt 0) {
      $cur = $q.Dequeue()
      if (-not $adj.ContainsKey($cur)) { continue }
      foreach ($t in $adj[$cur]) {
        if (-not $depth.ContainsKey($t)) { $depth[$t] = [int]$depth[$cur] + 1; $q.Enqueue($t) }
      }
    }
  }
  $maxD = 0
  foreach ($k in @($depth.Keys)) { if ([int]$depth[$k] -gt $maxD) { $maxD = [int]$depth[$k] } }
  foreach ($n in $nodes) {
    $id = [string](GetV $n 'id')
    if (-not $depth.ContainsKey($id)) { $maxD++; $depth[$id] = $maxD }
  }

  $idxOf = @{}
  foreach ($n in $nodes) {
    $id = [string](GetV $n 'id')
    $v = -1
    if ($id -ne 'n_entry') { $v = [int]($id -replace '\D', '') }
    $idxOf[$id] = $v
  }
  $byDepth = @{}
  foreach ($n in $nodes) {
    $d = [int]$depth[[string](GetV $n 'id')]
    if (-not $byDepth.ContainsKey($d)) { $byDepth[$d] = New-Object System.Collections.ArrayList }
    [void]$byDepth[$d].Add($n)
  }
  foreach ($d in @($byDepth.Keys)) {
    $byDepth[$d] = @($byDepth[$d] | Sort-Object -Property @{ Expression = { $idxOf[[string](GetV $_ 'id')] } })
  }

  return [PSCustomObject]@{
    nodes   = $nodes
    links   = $links
    depth   = $depth
    byDepth = $byDepth
    levels  = $maxD + 1
  }
}

function Set-CanvasView($Doc, [double]$Scale) {
  $ui = GetV $Doc 'ui'
  if ($null -eq $ui) { return }
  $view = [ordered]@{ x = 0; y = 0; scale = $Scale }
  if ($ui -is [System.Collections.IDictionary]) { $ui['view'] = $view }
  else {
    $p = $ui.PSObject.Properties['view']
    if ($p) { $p.Value = $view } else { $ui | Add-Member -NotePropertyName 'view' -NotePropertyValue $view -Force }
  }
}

function Measure-Canvas($nodes) {
  $minX = [double]::MaxValue; $minY = [double]::MaxValue; $maxX = 0; $maxY = 0
  foreach ($n in $nodes) {
    $x = [int](GetV $n 'x'); $y = [int](GetV $n 'y')
    $w = GetV $n 'width'; if (-not $w) { $w = 480 } else { $w = [int]$w }
    $h = GetV $n 'height'; if (-not $h) { $h = 160 } else { $h = [int]$h }
    if ($x -lt $minX) { $minX = $x }
    if ($y -lt $minY) { $minY = $y }
    if (($x + $w) -gt $maxX) { $maxX = $x + $w }
    if (($y + $h) -gt $maxY) { $maxY = $y + $h }
  }
  $ov = 0
  for ($i = 0; $i -lt $nodes.Count; $i++) {
    $a = $nodes[$i]
    $ax = [int](GetV $a 'x'); $ay = [int](GetV $a 'y')
    $aw = GetV $a 'width'; if (-not $aw) { $aw = 480 } else { $aw = [int]$aw }
    $ah = GetV $a 'height'; if (-not $ah) { $ah = 160 } else { $ah = [int]$ah }
    for ($k = $i + 1; $k -lt $nodes.Count; $k++) {
      $b = $nodes[$k]
      $bx = [int](GetV $b 'x'); $by = [int](GetV $b 'y')
      $bw = GetV $b 'width'; if (-not $bw) { $bw = 480 } else { $bw = [int]$bw }
      $bh = GetV $b 'height'; if (-not $bh) { $bh = 160 } else { $bh = [int]$bh }
      if (($ax -lt $bx + $bw) -and ($bx -lt $ax + $aw) -and ($ay -lt $by + $bh) -and ($by -lt $ay + $ah)) { $ov++ }
    }
  }
  $w = [int]($maxX - $minX); $h = [int]($maxY - $minY)
  return [PSCustomObject]@{
    width    = $w
    height   = $h
    aspect   = [math]::Round($w / [math]::Max(1, $h), 2)
    overlaps = $ov
  }
}

function Invoke-RowLayout {
  param(
    [Parameter(Mandatory = $true)]$Doc,
    [int]$Dx = 620,
    [int]$Dy = 280,
    [double]$Scale = 0.08
  )
  $g = Get-CanvasGraph $Doc
  foreach ($d in @($g.byDepth.Keys)) {
    $slot = 0
    foreach ($n in $g.byDepth[$d]) {
      SetV $n 'x' (140 + [int]$d * $Dx)
      SetV $n 'y' (80 + $slot * $Dy)
      $slot++
    }
  }
  Set-CanvasView $Doc $Scale
  $m = Measure-Canvas $g.nodes
  return [PSCustomObject]@{
    mode = 'row'; cols = 1; bands = 1; levels = $g.levels
    width = $m.width; height = $m.height; aspect = $m.aspect; overlaps = $m.overlaps
  }
}

function Invoke-SquareLayout {
  param(
    [Parameter(Mandatory = $true)]$Doc,
    [int]$Cols = 0,
    [int]$Dx = 620,
    [int]$Dy = 280,
    [int]$Pad = 160,
    [double]$Scale = 0.3
  )
  $g = Get-CanvasGraph $Doc
  $byDepth = $g.byDepth
  $levels = $g.levels

  function Get-BandRows($byDepth, $cols) {
    $rows = @{}
    foreach ($d in @($byDepth.Keys)) {
      $b = [int][math]::Floor($d / $cols)
      if (-not $rows.ContainsKey($b)) { $rows[$b] = 0 }
      $cnt = @($byDepth[$d]).Count
      if ($cnt -gt $rows[$b]) { $rows[$b] = $cnt }
    }
    return $rows
  }

  $range = if ($Cols -gt 0) { @($Cols) } else { 4..16 }
  $best = $null
  foreach ($c in $range) {
    $bands = [int][math]::Ceiling($levels / $c)
    $rows = Get-BandRows $byDepth $c
    $h = 0
    for ($b = 0; $b -lt $bands; $b++) {
      $rn = 1
      if ($rows.ContainsKey($b)) { $rn = [math]::Max(1, [int]$rows[$b]) }
      $h += $rn * $Dy + $Pad
    }
    $w = $c * $Dx
    $ratio = [math]::Max($w, $h) / [math]::Min($w, $h)
    if ($null -eq $best -or $ratio -lt $best.ratio) {
      $best = [PSCustomObject]@{ cols = $c; bands = $bands; ratio = $ratio }
    }
  }
  $cols = [int]$best.cols
  $bandRows = Get-BandRows $byDepth $cols

  # 放置 + 松弛：重叠则逐次放大间距（与插件 maxRelax 同思路），直到 overlaps=0 或跑满 8 轮
  $m = $null
  $scale = 1.0
  for ($try = 0; $try -lt 8; $try++) {
    $DyS = [int][math]::Round($Dy * $scale)
    $PadS = [int][math]::Round($Pad * $scale)
    $bandTop = @{}
    $acc = 80
    for ($b = 0; $b -lt $best.bands; $b++) {
      $bandTop[$b] = $acc
      $rn = 1
      if ($bandRows.ContainsKey($b)) { $rn = [math]::Max(1, [int]$bandRows[$b]) }
      $acc += $rn * $DyS + $PadS
    }
    foreach ($d in @($byDepth.Keys)) {
      $band = [int][math]::Floor($d / $cols)
      $col = $d % $cols
      $vcol = if ($band % 2 -eq 0) { $col } else { $cols - 1 - $col }
      $slot = 0
      foreach ($n in $byDepth[$d]) {
        SetV $n 'x' (140 + $vcol * $Dx)
        SetV $n 'y' ([int]$bandTop[$band] + $slot * $DyS)
        $slot++
      }
    }
    $m = Measure-Canvas $g.nodes
    if ($m.overlaps -eq 0) { break }
    $scale *= 1.25
  }
  Set-CanvasView $Doc $Scale
  return [PSCustomObject]@{
    mode = 'square'; cols = $cols; bands = [int]$best.bands; levels = $levels
    width = $m.width; height = $m.height; aspect = $m.aspect; overlaps = $m.overlaps
  }
}

function Get-CanvasLayoutMode($Doc) {
  $g = Get-CanvasGraph $Doc
  $m = Measure-Canvas $g.nodes
  if ($m.aspect -ge 2.5) { return 'row' }
  return 'square'
}

function Invoke-CanvasLayout {
  param(
    [Parameter(Mandatory = $true)]$Doc,
    [string]$Mode = 'square',
    [int]$Cols = 0
  )
  switch ($Mode) {
    'row'    { return Invoke-RowLayout -Doc $Doc }
    'square' { return Invoke-SquareLayout -Doc $Doc -Cols $Cols }
    'toggle' {
      $cur = Get-CanvasLayoutMode $Doc
      if ($cur -eq 'row') { return Invoke-SquareLayout -Doc $Doc -Cols $Cols }
      return Invoke-RowLayout -Doc $Doc
    }
    default { throw "unknown layout mode: $Mode (use row|square|toggle)" }
  }
}
