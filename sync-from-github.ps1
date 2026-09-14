# 以 GitHub origin/main 為準，更新本機工作複本。
# 預設：有未提交變更則停止；用快轉 pull。
# 放棄本機未提交／未推送變更並對齊網上：.\sync-from-github.ps1 -Force
param(
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

function Assert-GitRepo {
    git rev-parse --is-inside-work-tree 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error '這裡不是 Git 倉庫。請在專案根目錄執行。'
    }
}

Assert-GitRepo

Write-Host '正在向 GitHub 取得最新 main…'
git fetch origin
if ($LASTEXITCODE -ne 0) {
    Write-Error 'git fetch origin 失敗。請檢查網路與登入。'
}

$dirty = git status --porcelain
if ($dirty -and -not $Force) {
    Write-Host '本機有未提交變更，已停止以免覆蓋。檔案：' -ForegroundColor Yellow
    git status --short
    Write-Host ''
    Write-Host '請先提交或還原本機修改，或確定可放棄時再執行：.\sync-from-github.ps1 -Force'
    exit 1
}

git checkout main
if ($LASTEXITCODE -ne 0) {
    Write-Error '無法切換到 main 分支。'
}

if ($Force) {
    Write-Host '以 -Force 對齊 origin/main（本機未提交與未推送的 commit 會被丟棄）。' -ForegroundColor Yellow
    git reset --hard origin/main
    if ($LASTEXITCODE -ne 0) {
        Write-Error 'git reset --hard origin/main 失敗。'
    }
} else {
    git pull --ff-only origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Host '無法快轉合併。本機可能有未推送的 commit。' -ForegroundColor Yellow
        Write-Host '若要以網上為準並放棄那些 commit，請執行：.\sync-from-github.ps1 -Force'
        exit 1
    }
}

Write-Host ''
Write-Host '本機已與 GitHub main 對齊：'
git log -1 --oneline
git status -sb
exit 0
