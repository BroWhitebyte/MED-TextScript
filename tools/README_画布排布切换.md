# 画布排布切换工具（横排 ⇄ 方形）

给 `MEDNarrative/Flows/**/*.ncanvas` 换排布用：**横排**适合顺着分支逐段读逻辑，**方形**（蛇形分带）适合一屏总览。只改节点坐标与视图缩放，**不动任何正文、连线与元数据**，并在改动前自动备份、失败自动回滚。

## 三种用法

| 用法 | 操作 |
|---|---|
| 双击 | 双击 `切换画布排布.bat` → 列出 `MEDNarrative/Flows` 下所有 `.ncanvas` → 输编号 → 选排布 |
| 拖放 | 把某个 `.ncanvas` 直接拖到 `切换画布排布.bat` 上 → 只选排布 |
| 命令行 | `powershell -NoProfile -ExecutionPolicy Bypass -File layout_menu.ps1 -Path "…\X.ncanvas" -Mode row\|square\|toggle [-NoOpen]` |

菜单里的 **[3] 切换**：脚本按包围盒长宽比自动判断当前是哪种（≥2.5 视为横排），然后切到另一种。

## 输出示例

```
完成：Event 102 固定-主线-第一次送药.ncanvas
  排布：方形（蛇形分带）
  结构：7 列 × 11 带（深度 73）
  包围盒：4200 × 5016 px（长宽比 0.84）  重叠节点对：0
  备份：C:\Users\…\Temp\Event 102 ….<时间戳>.bak.ncanvas
```

## 注意

1. **Obsidian 里已打开的画布不会自动跟随**：改完请关闭该标签页再打开，或 `Ctrl+R` 重载，否则看到的是旧排布。
2. **改前先别在画布里拖节点**：Obsidian 保存时会用内存里的坐标覆盖文件。
3. 备份放在系统临时目录（`%TEMP%`），不污染仓库；失败会立刻回滚。
4. `tools\` 文件夹在 Obsidian 库里可见；如不想看到，把 `tools` 加进 Obsidian 设置 →「文件与链接 → 排除的文件」。
5. 中文提示需要 PowerShell 读 UTF-8 带 BOM 的 `.ps1`；`layout_menu.ps1` 已是带 BOM 的 UTF-8，**编辑时请保持该编码**，否则中文会变乱码（Windows PowerShell 5.1 会把无 BOM 的脚本按 ANSI 解析）。

## 文件

| 文件 | 作用 |
|---|---|
| `切换画布排布.bat` | 启动器（ASCII 内容 + `chcp 65001`，拖放/双击用） |
| `layout_menu.ps1` | 菜单、文件选择、备份/回滚、在 Obsidian 中打开 |
| `ncanvas_layout.ps1` | 排布算法：`Invoke-RowLayout` / `Invoke-SquareLayout` / `Get-CanvasLayoutMode` / `Invoke-CanvasLayout -Mode row\|square\|toggle` |
