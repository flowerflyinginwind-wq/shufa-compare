# 构建并上传到阿里云 OSS
# 使用前请修改下方 $BucketName 和 $Endpoint

param(
    [string]$BucketName = "shufa-compare-你的后缀",
    [string]$Endpoint = "oss-cn-hangzhou.aliyuncs.com",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $ProjectRoot

Write-Host "项目目录: $ProjectRoot" -ForegroundColor Cyan

if ($BucketName -match "你的后缀") {
    Write-Host ""
    Write-Host "请先在脚本中修改 BucketName，或运行时指定：" -ForegroundColor Yellow
    Write-Host '  powershell -File scripts\deploy-aliyun.ps1 -BucketName "你的Bucket名"' -ForegroundColor Yellow
    Write-Host ""
    Write-Host "完整说明见 DEPLOY-ALIYUN.md" -ForegroundColor Yellow
    exit 1
}

if (-not $SkipBuild) {
    Write-Host "正在构建..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if (-not (Test-Path "dist\index.html")) {
    Write-Host "错误: dist\index.html 不存在，请先 npm run build" -ForegroundColor Red
    exit 1
}

$ossutil = Get-Command ossutil -ErrorAction SilentlyContinue
if (-not $ossutil) {
    Write-Host ""
    Write-Host "未找到 ossutil。请先安装并配置：" -ForegroundColor Yellow
    Write-Host "  https://help.aliyun.com/document_detail/120075.html" -ForegroundColor Yellow
    Write-Host "  ossutil config" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "或手动在 OSS 控制台上传 dist 目录内的文件。" -ForegroundColor Yellow
    exit 1
}

$target = "oss://$BucketName/"
Write-Host "上传到 $target ..." -ForegroundColor Cyan
ossutil cp dist/ $target -r -f --meta "Cache-Control:no-cache"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "上传完成！" -ForegroundColor Green
    Write-Host "访问地址（将 Bucket 名和地域换成你的）：" -ForegroundColor Green
    Write-Host "  https://$BucketName.$Endpoint" -ForegroundColor Green
} else {
    Write-Host "上传失败，请检查 ossutil 配置与 Bucket 名称。" -ForegroundColor Red
    exit $LASTEXITCODE
}
