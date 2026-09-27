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

  $bandTop = @{}
  $acc = 80
  for ($b = 0; $b -lt $best.bands; $b++) {
    $bandTop[$b] = $acc
    $rn = 1
    if ($bandRows.ContainsKey($b)) { $rn = [math]::Max(1, [int]$bandRows[$b]) }
    $acc += $rn * $Dy + $Pad
  }

  foreach ($d in @($byDepth.Keys)) {
    $band = [int][math]::Floor($d / $cols)
    $col = $d % $cols
    $vcol = if ($band % 2 -eq 0) { $col } else { $cols - 1 - $col }
    $slot = 0
    foreach ($n in $byDepth[$d]) {
      SetV $n 'x' (140 + $vcol * $Dx)
      SetV $n 'y' ([int]$bandTop[$band] + $slot * $Dy)
      $slot++
    }
  }
  Set-CanvasView $Doc $Scale
  $m = Measure-Canvas $g.nodes
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
