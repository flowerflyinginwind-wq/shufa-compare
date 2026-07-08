# Build and deploy to Gitee Pages (gh-pages branch)
# Usage:
#   powershell -File scripts\deploy-gitee.ps1 -GiteeUrl "https://gitee.com/yz2023/shufa-compare.git"

param(
    [Parameter(Mandatory = $true)]
    [string]$GiteeUrl,
    [string]$RepoName = "shufa-compare",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $ProjectRoot

Write-Host "Project: $ProjectRoot" -ForegroundColor Cyan
Write-Host "Gitee:   $GiteeUrl" -ForegroundColor Cyan
Write-Host "Base:    /$RepoName/" -ForegroundColor Cyan

if (-not $SkipBuild) {
    Write-Host "Building for Gitee Pages..." -ForegroundColor Cyan
    if ($RepoName -eq "shufa-compare") {
        npm run build:gitee
    } else {
        npx tsc -b
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        npx vite build --base "/$RepoName/"
    }
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if (-not (Test-Path "dist\index.html")) {
    Write-Host "ERROR: dist\index.html not found. Run npm run build:gitee first." -ForegroundColor Red
    exit 1
}

$tempDir = Join-Path $env:TEMP "shufa-gitee-deploy-$(Get-Random)"
New-Item -ItemType Directory -Path $tempDir | Out-Null

try {
    Copy-Item -Path "dist\*" -Destination $tempDir -Recurse -Force

    Set-Location $tempDir
    git init | Out-Null
    git add .
    git commit -m "deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')" | Out-Null
    git branch -M gh-pages

    git remote add gitee $GiteeUrl 2>$null
    git push -f gitee gh-pages

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS: gh-pages branch pushed." -ForegroundColor Green
        Write-Host "Next: Gitee repo -> Services -> Gitee Pages -> Update" -ForegroundColor Yellow
        Write-Host "URL:  https://yz2023.gitee.io/$RepoName" -ForegroundColor Green
    } else {
        Write-Host "FAILED: git push failed. Check Gitee login and repo URL." -ForegroundColor Red
        exit $LASTEXITCODE
    }
} finally {
    Set-Location $ProjectRoot
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
