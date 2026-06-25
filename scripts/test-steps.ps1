# 分步测试脚本 - 书法临摹对比工具
# 用法: powershell -ExecutionPolicy Bypass -File scripts\test-steps.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

function Step($num, $name, $script) {
    Write-Host ""
    Write-Host "========== 步骤 $num : $name ==========" -ForegroundColor Cyan
    try {
        & $script
        Write-Host "[通过] 步骤 $num" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "[失败] 步骤 $num : $_" -ForegroundColor Red
        return $false
    }
}

$allOk = $true

# 步骤 1: 依赖安装
$allOk = (Step 1 "安装依赖" {
    if (-not (Test-Path "node_modules")) {
        npm install
    } else {
        Write-Host "node_modules 已存在，跳过安装"
    }
    if (-not (Test-Path "node_modules\vite")) { throw "vite 未安装" }
}) -and $allOk

# 步骤 2: TypeScript 编译
$allOk = (Step 2 "TypeScript 编译检查" {
    npx tsc -b
}) -and $allOk

# 步骤 3: 单元测试
$allOk = (Step 3 "单元测试 (vitest)" {
    npm test
}) -and $allOk

# 步骤 4: 生产构建
$allOk = (Step 4 "Vite 构建" {
    npm run build
    if (-not (Test-Path "dist\index.html")) { throw "dist/index.html 未生成" }
}) -and $allOk

# 步骤 5: 检查关键源文件
$allOk = (Step 5 "源文件完整性" {
    $files = @(
        "src\App.tsx",
        "src\components\ImageUpload.tsx",
        "src\components\ComparisonCanvas.tsx",
        "src\components\TransformControls.tsx",
        "src\components\ModeToolbar.tsx",
        "src\lib\imageDiff.ts",
        "src\lib\transform.ts",
        "public\test-original.svg",
        "public\test-copy.svg"
    )
    foreach ($f in $files) {
        if (-not (Test-Path $f)) { throw "缺少文件: $f" }
        Write-Host "  OK $f"
    }
}) -and $allOk

# 步骤 6: 预览服务 HTML 检查（需先 build）
$allOk = (Step 6 "预览页面内容检查" {
    $job = Start-Job { Set-Location $using:root; npx vite preview --port 4173 --strictPort 2>&1 }
    Start-Sleep -Seconds 3
    try {
        $html = (Invoke-WebRequest -Uri "http://localhost:4173" -UseBasicParsing -TimeoutSec 5).Content
        if ($html -notmatch "书法临摹对比") { throw "页面未包含标题「书法临摹对比」" }
        Write-Host "  页面标题检查通过"
    } finally {
        Stop-Job $job -ErrorAction SilentlyContinue
        Remove-Job $job -Force -ErrorAction SilentlyContinue
        Get-NetTCPConnection -LocalPort 4173 -ErrorAction SilentlyContinue |
            ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    }
}) -and $allOk

Write-Host ""
if ($allOk) {
    Write-Host "全部 6 步测试通过！运行 npm run dev 后在浏览器手动测试上传与对比功能。" -ForegroundColor Green
    exit 0
} else {
    Write-Host "部分步骤失败，请查看上方错误信息。" -ForegroundColor Red
    exit 1
}
