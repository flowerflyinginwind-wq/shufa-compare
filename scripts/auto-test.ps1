# 自动化测试 - 结果写入 test-results.txt
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$log = Join-Path $root "test-results.txt"
$results = @()

function Log($msg) {
    $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
    $script:results += $line
    Write-Host $line
}

function Test-Step($name, $action) {
    Log ">>> $name"
    try {
        & $action
        if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) { throw "exit code $LASTEXITCODE" }
        Log "PASS: $name"
        return $true
    } catch {
        Log "FAIL: $name - $_"
        return $false
    }
}

Log "=== 书法临摹对比 自动测试 ==="
$ok = $true

$ok = (Test-Step "依赖检查" {
    if (-not (Test-Path "node_modules\vite")) { npm install }
}) -and $ok

$ok = (Test-Step "TypeScript 编译" { npx tsc -b }) -and $ok

$ok = (Test-Step "单元测试" { npm test }) -and $ok

$ok = (Test-Step "生产构建" { npm run build }) -and $ok

$ok = (Test-Step "构建产物检查" {
    if (-not (Test-Path "dist\index.html")) { throw "dist/index.html missing" }
}) -and $ok

$ok = (Test-Step "源文件检查" {
    @("src\App.tsx","src\components\ImageUpload.tsx","src\lib\transform.ts","public\test-original.svg") |
        ForEach-Object { if (-not (Test-Path $_)) { throw "missing $_" } }
}) -and $ok

$ok = (Test-Step "预览页面检查" {
    $proc = Start-Process -FilePath "npx" -ArgumentList "vite","preview","--port","4173","--strictPort" -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 4
    try {
        $html = (Invoke-WebRequest -Uri "http://localhost:4173" -UseBasicParsing -TimeoutSec 8).Content
        if ($html -notmatch "书法临摹对比") { throw "title not found" }
    } finally {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
}) -and $ok

Log ""
if ($ok) { Log "=== 全部通过 ===" } else { Log "=== 存在失败项 ===" }
$results | Out-File -FilePath $log -Encoding utf8
if (-not $ok) { exit 1 }
