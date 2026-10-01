# check_banned_wording.ps1
# Counts the word/pattern density limits defined in
# no-runaway-execution / SKILL.md section 8 (word frequency control).
#
# Usage:
#   pwsh -File check_banned_wording.ps1 -Path <file> [-Start N] [-End N]
#
# Exit code 0 = within limits, 1 = at least one limit exceeded.
# Matching is case-sensitive on purpose: the half-width letters in the
# mixed-script patterns are ASCII-only.

[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$Path,
  [int]$Start = 1,
  [int]$End = 0
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $Path)) {
  Write-Error "file not found: $Path"
  exit 2
}

$lines = [System.IO.File]::ReadAllLines($Path, [System.Text.Encoding]::UTF8)
if ($End -le 0 -or $End -gt $lines.Count) { $End = $lines.Count }
if ($Start -lt 1) { $Start = 1 }
if ($Start -gt $End) { Write-Error 'Start is past End'; exit 2 }

$text  = ($lines[($Start - 1)..($End - 1)]) -join "`n"

# Exemptions, both scoped to this checker's own documentation:
#   1. a line holding a backtick-quoted form of a banned pattern is naming the
#      rule, not violating it;
#   2. a Markdown table row is a mapping or rule table, and its cells exist to
#      name the banned form.
# Full-width quotation marks are NOT exempt: prose uses them for ordinary
# quoting, so treating them as rule definitions would hide real violations.
# Without these two, the rule table in SKILL.md section 8 would flag itself.
$quoted   = '`[^`]*`'
$tableRow = '^\s*\|.*\|\s*$'
$text = ($text -split "`n" | Where-Object { $_ -notmatch $quoted -and $_ -notmatch $tableRow }) -join "`n"

$chars = ($text -replace '\s', '').Length
$kchars = [Math]::Max($chars / 1000.0, 0.001e0)

$dash  = [string][char]0x2014
$quote = [string][char]0x201C

# Pattern / label / allowed occurrences per 1000 characters (0 = hard ban)
$rules = @(
  @{ Pat = '不是.{0,12}?而是';           Label = 'contrastive template bu-shi-er-shi'; Per1k = 0.0 },
  @{ Pat = '不是';                        Label = 'bu-shi';                             Per1k = 0.4 },
  @{ Pat = '而是';                        Label = 'er-shi';                             Per1k = 0.4 },
  @{ Pat = '并非';                        Label = 'bing-fei';                           Per1k = 0.2 },
  @{ Pat = '更[\u4e00-\u9fa5]';           Label = 'comparative geng+X';                 Per1k = 0.5 },
  @{ Pat = '一[\u4e00-\u9fa5]{0,2}[个种次场份套条位句篇名]'; Label = 'yi + classifier'; Per1k = 2.0 },
  @{ Pat = '首先|其次|最后说|综上所述|总的来说|值得注意的是|不难发现|众所周知|先说|再说'; Label = 'ai filler'; Per1k = 0.0 },
  @{ Pat = "[\u4e00-\u9fa5A-Za-z]$dash[\u4e00-\u9fa5A-Za-z]"; Label = 'decorative dash compound'; Per1k = 0.0 }
)

$exceeded = 0

Write-Host ("file      : {0}" -f $Path)
Write-Host ("range     : lines {0}-{1}" -f $Start, $End)
Write-Host ("characters: {0} (whitespace excluded)" -f $chars)
Write-Host ''

foreach ($r in $rules) {
  $hits  = [regex]::Matches($text, $r.Pat)
  $count = $hits.Count
  $cap   = [Math]::Floor($r.Per1k * $kchars)
  $ok    = $count -le $cap
  if (-not $ok) { $exceeded++ }

  $mark = 'OK  '
  if (-not $ok) { $mark = 'OVER' }

  Write-Host ("[{0}] {1,-38} count={2,-3} cap={3,-3}" -f $mark, $r.Label, $count, $cap)

  if (-not $ok) {
    foreach ($h in $hits) {
      $s = [Math]::Max(0, $h.Index - 20)
      $len = [Math]::Min(48, $text.Length - $s)
      $ctx = $text.Substring($s, $len) -replace '\r?\n', ' '
      Write-Host ("         ...{0}..." -f $ctx)
    }
  }
}

Write-Host ''
if ($exceeded -gt 0) {
  Write-Host ("RESULT: {0} pattern group(s) over limit" -f $exceeded)
  exit 1
}
Write-Host 'RESULT: within limits'
exit 0
