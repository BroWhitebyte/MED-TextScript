$ErrorActionPreference = 'Continue'
$root = 'C:\Users\white\Downloads\DS workspace\伪满洲国资料链接抓取存档'
$d0 = Join-Path $root '00-社会生态与民众生活索引'
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'

function Save-Page([string]$u, [string]$title, [string]$out) {
  $tmp = Join-Path $env:TEMP ('f_' + [guid]::NewGuid().ToString('N') + '.bin')
  & curl.exe -s -L --compressed --max-time 25 -A $ua -o $tmp $u
  if ((Test-Path $tmp) -and ((Get-Item $tmp).Length -ge 300)) {
    $b = [System.IO.File]::ReadAllBytes($tmp)
    $h = [System.Text.Encoding]::ASCII.GetString($b, 0, [Math]::Min(2048, $b.Length))
    $t = [System.Text.Encoding]::UTF8.GetString($b)
    if ($h -match 'charset=["'']?gb' -or $t.Contains('锟斤拷')) { try { $t = [System.Text.Encoding]::GetEncoding(936).GetString($b) } catch {} }
    $t = $t -replace '(?s)<script.*?</script>', ' ' -replace '(?s)<style.*?</style>', ' ' -replace '(?s)<!--.*?-->', ' '
    $t = $t -replace '(?i)<br\s*/?>', "`n" -replace '(?i)</p>', "`n" -replace '(?i)</li>', "`n" -replace '(?i)</h[1-6]>', "`n" -replace '(?i)</div>', "`n" -replace '<[^>]+>', ' '
    $t = [System.Net.WebUtility]::HtmlDecode($t)
    $t = $t -replace '[ \t]+', ' ' -replace '(\r?\n\s*)+', "`n"
    $t = $t.Trim()
    if ($t.Length -gt 2500) { $t = $t.Substring(0, 2500) + "`n...(截断)" }
    $hdr = "# $title`n`n> **来源索引文件**：伪满洲国1941-1942年社会生态与民众生活-资料索引.md`n> **链接**：$u`n> **抓取状态**：OK-direct（站点首页）`n> **抓取时间**：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n---`n`n$t"
    [System.IO.File]::WriteAllText($out, $hdr, (New-Object System.Text.UTF8Encoding $false))
    Write-Output "saved $out"
  } else {
    Write-Output "FAIL $u"
  }
  Remove-Item $tmp -Force -ErrorAction SilentlyContinue
}

Save-Page 'https://www.hljszw.org.cn' '黑龙江史志网（数字方志）' (Join-Path $d0 '06-黑龙江史志网（数字方志）.md')
Save-Page 'https://dfz.jl.gov.cn' '吉林省地方志编纂委员会' (Join-Path $d0 '07-吉林省地方志编纂委员会.md')

# 02目录11号：科瓦尔丘克报告（PDF），内容复用00目录45号
$src45 = Get-ChildItem $d0 -Filter '45-*.md' | Select-Object -First 1
if ($src45) {
  $src = Get-Content -Raw -Encoding UTF8 $src45.FullName
  $u = 'https://xn--80aphn.xn--p1ai/ssl/u/c9/604c589d1511f0bd94d8b0e69748be/-/Доклад%20«Маньчжурский%20спецназ%20Сталина».%20В.Н.%20Ковальчук.%20Хабаровск.16.09.2025.pdf'
  $hdr2 = "# 科瓦尔丘克《满洲的斯大林特种部队》（88旅专题报告，PDF）`n`n> **来源索引文件**：伪满洲国1942年1-2月点-抗联外文资料补充.md`n> **链接**：$u`n> **抓取状态**：OK-proxy（PDF二进制，内容同00目录45号条目）`n`n---`n`n$src"
  $out2 = Join-Path $root '02-抗联外文资料补充\11-科瓦尔丘克报告.pdf.md'
  [System.IO.File]::WriteAllText($out2, $hdr2, (New-Object System.Text.UTF8Encoding $false))
  Write-Output "saved $out2"
}
Write-Output 'DONE'
