# ===============================
# DEPLOY - SIMPLE & RAPIDE
# ===============================

param(
    [string]$msg = "update"
)

Write-Host "`n=== GIT ADD ==="
git add .

Write-Host "`n=== GIT COMMIT ==="
git commit -m "$msg"

Write-Host "`n=== GIT PUSH ==="
git push

Write-Host "`n=== NETLIFY DEPLOY ==="
netlify deploy --prod

Write-Host "`n=== TERMINÉ ✔ ==="
