# 伪满洲国资料链接抓取存档脚本
# 从各索引/资料md文件提取URL -> 抓取(直连/VPN代理) -> 转存为md -> 生成对应索引映射
$ErrorActionPreference = 'Continue'
$base = 'C:\Users\white\Downloads\DS workspace'
$outRoot = Join-Path $base '伪满洲国资料链接抓取存档'
$prox = 'http://127.0.0.1:7897'
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
$null = New-Item -ItemType Directory -Force -Path $outRoot

# 已抓取存档映射（核查材料子文件夹已有转换文本，避免重复抓取）
$mapSrc = 'C:\Users\white\Downloads\DS workspace\伪满洲国1942年1-2月点-核查材料'
$localMap = @{
  'https://news.12371.cn/2016/01/18/ARTI1453096665425851.shtml' = 'src_12371_1942.txt'
  'https://www.krzzjn.com/show-90-28010.html' = 'src_1941dsj.txt'
  'https://hgsr.dbw.cn/a/a/g/pc_content_39582.shtml' = 'src_zs_hegang.txt'
  'https://www.crt.com.cn/news2007/news/dbmzjh/1679163518AK8DB296C0D4DGKE461_2.html' = 'src_zs_crt2.txt'
  'http://www.81.cn/yw_208727/16408305.html' = 'src_kuchu81.txt'
  'http://www.81.cn/wh_208594/9884382.html' = 'src_jdl.txt'
  'https://news.cpd.com.cn/n12021581/n12021590/1025/t_1205275.html' = 'src_kuchu.txt'
  'https://www.krzzjn.com/show-90-66846.html' = 'src_jince.txt'
  'https://www.wyzxwk.com/Article/lishi/2024/11/500516.html' = 'src_wyzxwk.txt'
  'https://baike.baidu.com/item/王效明' = 'src_wxm.txt'
  'https://baike.baidu.com/item/柴世荣/62424881' = 'src_chsr.txt'
  'http://www.hebgcdy.com/qgds/system/2021/02/20/030482406.shtml' = 'src_hc.txt'
  'https://news.sohu.com/20050419/n225254537.shtml' = 'src_toulu.txt'
  'http://www.hljsdag.org.cn/index.php?a=index&aid=271794&c=View&m=home' = 'src_lianggu.txt'
  'https://en.wikipedia.org/wiki/88th_Independent_Brigade' = 'en_88th.txt'
  'https://en.wikipedia.org/wiki/Zhou_Baozhong' = 'en_zhoubaozhong.txt'
  'https://ja.wikipedia.org/wiki/東北抗日聯軍' = 'ja_touhoku.txt'
  'https://ru.wikipedia.org/wiki/88-я_отдельная_стрелковая_бригада' = 'ru_88wiki.txt'
  'https://ru.china-embassy.gov.cn/wlhz/lyjdjs_142844/fldwstk_143122/202504/t20250430_11611428.htm' = 'ru_embassy.txt'
  'https://k.sina.cn/article_1686546714_6486a91a04003738w.html?from=history' = 'zh_zbg.txt'
}

# 判定直连/代理
function Test-CnHost([string]$h) {
  if ($h.EndsWith('.cn')) { return $true }
  $cn = @('krzzjn.com','sohu.com','sina.com.cn','sina.cn','baidu.com','bkso.baidu.com','cnki.com.cn','cnki.net','people.com.cn','gmw.cn','12371.cn','dbw.cn','crt.com.cn','wyzxwk.com','81.cn','cpd.com.cn','toutiao.com','ximalaya.com','thepaper.cn','guancha.cn','rmzxw.com.cn','ssap.com.cn','ifeng.com','meipian.cn','360doc.com','xinhuanet.com','cctv.com','nlc.cn','scholarmate.com','fs7000.com','163.com','zhihu.com','zujuan.com','douban.com','crggcn.com','gzdafzxx.cn','xinwen.com')
  foreach ($c in $cn) { if ($h -eq $c -or $h.EndsWith('.' + $c)) { return $true } }
  return $false
}

function Enc-Url([string]$u) {
  $sb = New-Object System.Text.StringBuilder
  foreach ($ch in $u.ToCharArray()) {
    if ([int]$ch -le 126) { [void]$sb.Append($ch) }
    else {
      $b = [System.Text.Encoding]::UTF8.GetBytes([string]$ch)
      foreach ($x in $b) { [void]$sb.AppendFormat('%{0:X2}', $x) }
    }
  }
  return $sb.ToString()
}

function Get-DetectedText([byte[]]$bytes) {
  $head = [System.Text.Encoding]::ASCII.GetString($bytes, 0, [Math]::Min(4096, $bytes.Length))
  $m = [regex]::Match($head, 'charset=["'']?([\w-]+)')
  $enc = 'utf-8'
  if ($m.Success) { $cs = $m.Groups[1].Value.ToLower(); if ($cs -match 'gb|2312|936') { $enc = 'gbk' } }
  $t = [System.Text.Encoding]::UTF8.GetString($bytes)
  if ($enc -eq 'gbk' -or $t.Contains('锟斤拷') -or ($t -match '�')) {
    try { $t = [System.Text.Encoding]::GetEncoding(936).GetString($bytes) } catch {}
  }
  return $t
}

function Convert-ToText([string]$html) {
  $t = $html
  $t = $t -replace '(?s)<script.*?</script>', ' ' -replace '(?s)<style.*?</style>', ' ' -replace '(?s)<!--.*?-->', ' '
  $t = $t -replace '(?i)<br\s*/?>', "`n" -replace '(?i)</p>', "`n" -replace '(?i)</li>', "`n" -replace '(?i)</h[1-6]>', "`n" -replace '(?i)</tr>', "`n" -replace '(?i)</div>', "`n" -replace '(?i)</td>', ' | '
  $t = $t -replace '<[^>]+>', ' '
  $t = [System.Net.WebUtility]::HtmlDecode($t)
  $t = $t -replace '[ \t]+', ' ' -replace '(\r?\n\s*)+', "`n"
  return $t.Trim()
}

function Get-Title([string]$html) {
  $m = [regex]::Match($html, '(?is)<title>(.*?)</title>')
  if ($m.Success) { return ([System.Net.WebUtility]::HtmlDecode($m.Groups[1].Value)).Trim() }
  return ''
}

function Clean-FileName([string]$s, [int]$max = 50) {
  $s = $s -replace '[\\/:*?"<>|\r\n\t]', ' '
  $s = $s -replace '\s+', ' '
  if ($s.Length -gt $max) { $s = $s.Substring(0, $max) }
  return $s.Trim()
}

function Get-RouteArg([string]$hostName) {
  if (Test-CnHost $hostName) { return @('', 'direct') }
  return @("-x $prox", 'proxy')
}

$srcFiles = @(
  @{ File = '伪满洲国1941-1942年社会生态与民众生活-资料索引.md'; Dir = '00-社会生态与民众生活索引' },
  @{ File = '伪满洲国1942年1-2月点-民生统治管理政策.md'; Dir = '01-民生统治管理政策' },
  @{ File = '伪满洲国1942年1-2月点-抗联外文资料补充.md'; Dir = '02-抗联外文资料补充' },
  @{ File = '伪满洲国1942年1-2月点-完整汇总.md'; Dir = '03-完整汇总附录' },
  @{ File = '伪满洲国1942年1-2月点.md'; Dir = '04-主日编年史资料来源' }
)
$logAll = Join-Path $outRoot '抓取总日志.txt'
"伪满洲国资料链接抓取存档 - 抓取总日志" | Out-File -FilePath $logAll -Encoding UTF8
"开始时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File -FilePath $logAll -Append -Encoding UTF8

foreach ($sf in $srcFiles) {
  $mdPath = Join-Path $base $sf.File
  if (-not (Test-Path $mdPath)) { Write-Output "MISSING $mdPath"; continue }
  $dir = Join-Path $outRoot $sf.Dir
  $null = New-Item -ItemType Directory -Force -Path $dir
  $lines = Get-Content -Encoding UTF8 $mdPath
  $entries = New-Object System.Collections.ArrayList
  $n = 0
  $ctxTitle = ''
  foreach ($ln in $lines) {
    $clean = $ln -replace '^#+\s*', '' -replace '\*\*', '' -replace '\[|\]', '' -replace '`', '' -replace '^\s*[-*]\s*', '' -replace '^\s*\|.*$', ''
    if ($clean.Trim() -ne '' -and $clean -notmatch 'https?://') { $ctxTitle = $clean.Trim() }
    $ms = [regex]::Matches($ln, 'https?://[^\s）】》"''<>]+')
    if ($ms.Count -eq 0) { continue }
    $n++
    $title = $ctxTitle
    if ($title -eq '') { $title = $ln -replace '^#+\s*', '' -replace '\*\*', '' }
    if ($title.Length -gt 60) { $title = $title.Substring(0, 60) }
    $urls = @()
    foreach ($m in $ms) {
      $u = $m.Value
      $u = $u -replace '[（）【】「」『』《》，。；：！？、\s]+$', ''
      $u = $u.TrimEnd('。', '，', ',', '.', '；', ';', '（', '(', '）', ')')
      $urls += $u
    }
    $null = $entries.Add(@{ Idx = $n; Title = $title; Urls = $urls })
  }
  $dirReadme = New-Object System.Collections.ArrayList
  $ok = 0; $fail = 0; $copy = 0; $skip = 0
  foreach ($e in $entries) {
    $firstUrl = $e.Urls[0]
    $num = '{0:D2}' -f $e.Idx
    $safe = Clean-FileName $e.Title
    $mdOut = Join-Path $dir ($num + '-' + $safe + '.md')
    if (Test-Path $mdOut) {
      $logLine = "[$($sf.Dir)] $num | SKIP-existing | $firstUrl"
      $logLine | Out-File -FilePath $logAll -Append -Encoding UTF8
      $null = $dirReadme.Add("| $num | $($e.Title) | $firstUrl | SKIP-existing |")
      $skip++
      Write-Output $logLine
      continue
    }
    $status = 'OK'
    $note = ''
    try {
      $uri = New-Object System.Uri $firstUrl
      $hostN = $uri.Host
      $content = $null
      $srcTxt = $null
      if ($localMap.ContainsKey($firstUrl)) { $srcTxt = Join-Path $mapSrc $localMap[$firstUrl] }
      if ($srcTxt -and (Test-Path $srcTxt)) {
        $content = Get-Content -Raw -Encoding UTF8 $srcTxt
        $status = 'COPY'
        $copy++
      } else {
        $encUrl = Enc-Url $firstUrl
        $routes = @()
        if (Test-CnHost $hostN) { $routes = @('direct', 'proxy') } else { $routes = @('proxy', 'direct') }
        $got = $false
        foreach ($r in $routes) {
          $tmp = Join-Path $dir ('_tmp_' + [guid]::NewGuid().ToString('N') + '.bin')
          $arg = @()
          if ($r -eq 'proxy') { $arg = @('-x', $prox) }
          $null = & curl.exe -s -L --compressed --max-time 25 @arg -A $ua -o $tmp $encUrl 2>$null
          if ((Test-Path $tmp) -and ((Get-Item $tmp).Length -ge 300)) {
            $bytes = [System.IO.File]::ReadAllBytes($tmp)
            $sig = [System.Text.Encoding]::ASCII.GetString($bytes, 0, [Math]::Min(8, $bytes.Length))
            if ($sig.StartsWith('%PDF')) {
              $binOut = Join-Path $dir ($num + '-' + $safe + '.pdf')
              [System.IO.File]::WriteAllBytes($binOut, $bytes)
              $content = "（PDF二进制文件，已另存：$binOut）"
              $note = 'PDF'
            } elseif ($sig.StartsWith('PK')) {
              $binOut = Join-Path $dir ($num + '-' + $safe + '.bin')
              [System.IO.File]::WriteAllBytes($binOut, $bytes)
              $content = "（压缩/文档二进制文件，已另存：$binOut）"
              $note = 'BIN'
            } else {
              $html = Get-DetectedText $bytes
              $tt = Get-Title $html
              if ($tt -ne '') { $safe2 = Clean-FileName $tt; $mdOut = Join-Path $dir ($num + '-' + $safe2 + '.md') }
              $content = Convert-ToText $html
              if ($content.Length -lt 100) { $note = 'WARN-内容过短' }
            }
            $got = $true
            Remove-Item $tmp -Force -ErrorAction SilentlyContinue
            if ($r -eq 'proxy') { $status = 'OK-proxy' } else { $status = 'OK-direct' }
            break
          }
          Remove-Item $tmp -Force -ErrorAction SilentlyContinue
        }
        if (-not $got) { $status = 'FAIL'; $fail++ }
      }
      if ($null -ne $content) {
        $header = @"
# $($e.Title)

> **来源索引文件**：$($sf.File)
> **索引条目**：第 $($e.Idx) 条
> **链接**：$firstUrl
> **抓取状态**：$status $note
> **抓取时间**：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

---

$content
"@
        [System.IO.File]::WriteAllText($mdOut, $header, (New-Object System.Text.UTF8Encoding $false))
        $ok++
      }
    } catch {
      $status = 'ERR'
      $fail++
      $note = $_.Exception.Message
    }
    $logLine = "[$($sf.Dir)] $num | $status | $firstUrl"
    $logLine | Out-File -FilePath $logAll -Append -Encoding UTF8
    $null = $dirReadme.Add("| $num | $($e.Title) | $firstUrl | $status $note |")
    Write-Output $logLine
  }
  $readme = @"
# 链接抓取索引 - $($sf.Dir)

**来源索引文件**：$($sf.File)（共 $($entries.Count) 条带链接条目）
**抓取时间**：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**统计**：成功 $ok ｜ 本地存档复制 $copy ｜ 跳过(已存在) $skip ｜ 失败/受限 $fail

| 编号 | 条目 | 链接 | 状态 |
|---|---|---|---|
$($dirReadme -join "`n")
"@
  [System.IO.File]::WriteAllText((Join-Path $dir '00-本目录索引README.md'), $readme, (New-Object System.Text.UTF8Encoding $false))
}
"结束时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File -FilePath $logAll -Append -Encoding UTF8
Write-Output 'DONE'
