# Daily Balaji - finish deploy (run after deploy.ps1)
# From project folder:  powershell -ExecutionPolicy Bypass -File .\deploy2.ps1
$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot

$AUTH_SECRET = "db7f4c1e9a2b6d8f3c5e7a9b1d4f6c8e2a5b7d9f1c3e5a7b9d2f4c6e8a1b3d5f7"

Write-Host "`n=== 1/5 Admin credentials in Vercel ===" -ForegroundColor Cyan
foreach ($target in @("production", "preview", "development")) {
  "pradeepkumar34299@gmail.com" | vercel env add ADMIN_EMAIL $target --force 2>$null
  "Balaji@2026"                 | vercel env add ADMIN_PASSWORD $target --force 2>$null
}
Write-Host "  set ADMIN_EMAIL / ADMIN_PASSWORD"

Write-Host "`n=== 2/5 Blob store (product images) ===" -ForegroundColor Cyan
vercel blob create-store dailybalaji-images 2>&1
Write-Host "  (if it says the store was created but NOT connected: Dashboard -> Storage -> dailybalaji-images -> Connect Project)" -ForegroundColor Yellow

Write-Host "`n=== 3/5 Push code to GitHub ===" -ForegroundColor Cyan
git rm --cached deploy-log.txt 2>$null
git add .
git commit -m "Self-setup: db push at build, /api/setup bootstrap" 2>$null
git push

Write-Host "`n=== 4/5 Production deploy (creates tables during build) ===" -ForegroundColor Cyan
$out = vercel --prod --yes 2>&1 | Tee-Object -Variable deployOut
$prodUrl = ($deployOut | Select-String -Pattern "https://[a-z0-9\-]+\.vercel\.app" -AllMatches | ForEach-Object { $_.Matches } | Select-Object -Last 1).Value
if (-not $prodUrl) { $prodUrl = "https://dailybalaji.vercel.app" }
Write-Host "  Deployed: $prodUrl"

Write-Host "`n=== 5/5 Seed admin + company settings ===" -ForegroundColor Cyan
Start-Sleep -Seconds 5
try {
  $r = Invoke-RestMethod -Uri "$prodUrl/api/setup?key=$AUTH_SECRET" -Method GET -TimeoutSec 60
  $r | ConvertTo-Json -Depth 4
} catch {
  Write-Host "  Setup call failed: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "  Open this in your browser instead: $prodUrl/api/setup?key=$AUTH_SECRET" -ForegroundColor Yellow
}

Write-Host "`nDONE. Admin login: $prodUrl/login?admin=1" -ForegroundColor Green
Write-Host "Email: pradeepkumar34299@gmail.com   Password: Balaji@2026" -ForegroundColor Green
