# Push shufa-compare to GitHub
# Usage: powershell -ExecutionPolicy Bypass -File scripts\push-github.ps1

$ErrorActionPreference = 'Stop'
$RepoUrl = 'https://github.com/flowerflyinginwind-wq/shufa-compare.git'
$LogFile = Join-Path $env:USERPROFILE 'shuFa_push_result.txt'

function Log($msg) {
    $line = "$(Get-Date -Format 'HH:mm:ss') $msg"
    Write-Host $line
    Add-Content -Path $LogFile -Value $line
}

Set-Location (Split-Path $PSScriptRoot -Parent)

"" | Set-Content $LogFile
Log "Working directory: $(Get-Location)"

if (-not (Test-Path .git)) {
    Log 'Initializing git repository...'
    git init
    git add .
    git commit -m "书法临摹对比工具初版"
    git branch -M main
} else {
    Log 'Git repository already exists.'
    $status = git status --porcelain
    if ($status) {
        Log 'Staging and committing changes...'
        git add .
        git commit -m "书法临摹对比工具初版"
    }
    git branch -M main 2>$null
}

$remotes = git remote 2>$null
if ($remotes -notcontains 'origin') {
    Log "Adding remote origin: $RepoUrl"
    git remote add origin $RepoUrl
} else {
    $current = git remote get-url origin
    if ($current -ne $RepoUrl) {
        Log "Updating remote origin: $current -> $RepoUrl"
        git remote set-url origin $RepoUrl
    }
}

Log 'Pushing to origin main...'
git push -u origin main
Log 'Done.'
