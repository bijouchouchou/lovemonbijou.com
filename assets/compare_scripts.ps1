# ================================
# 🔍 Comparateur de scripts JS
# ================================

Write-Host "`n=== 🔎 Vérification des fichiers script.js ===`n" -ForegroundColor Cyan

# --- Liste des fichiers à comparer ---
$files = @(
    "assets\script.js",
    "script_0811.js",
    "script_backup_ok_20251111_1117.js"
)

# --- Vérifier existence et infos ---
foreach ($file in $files) {
    if (Test-Path $file) {
        $info = Get-Item $file
        $lines = (Get-Content $file).Count
        Write-Host "✅ $($info.Name)"
        Write-Host "   Taille : $($info.Length) octets"
        Write-Host "   Lignes : $lines"
        Write-Host "   Modifié : $($info.LastWriteTime)"
        Write-Host ""
    } else {
        Write-Host "⚠️ Fichier manquant : $file" -ForegroundColor Red
    }
}

# --- Comparer le contenu ---
Write-Host "`n=== 📊 Comparaison du contenu ===" -ForegroundColor Yellow

if ((Test-Path "assets\script.js") -and (Test-Path "script_backup_ok_20251111_1117.js")) {
    $diff = Compare-Object (Get-Content "assets\script.js") (Get-Content "script_backup_ok_20251111_1117.js")
    if ($diff) {
        Write-Host "⚠️ Différences entre script.js et script_backup_ok_20251111_1117.js" -ForegroundColor Red
        Write-Host "   → Le fichier actuel diffère du backup !" -ForegroundColor DarkYellow
    } else {
        Write-Host "✅ script.js et script_backup_ok_20251111_1117.js sont identiques."
    }
}

if ((Test-Path "assets\script.js") -and (Test-Path "script_0811.js")) {
    $diff2 = Compare-Object (Get-Content "assets\script.js") (Get-Content "script_0811.js")
    if ($diff2) {
        Write-Host "⚠️ Différences entre script.js et script_0811.js" -ForegroundColor Red
    } else {
        Write-Host "✅ script.js et script_0811.js sont identiques."
    }
}

# --- Vérification de l'équilibre des accolades ---
Write-Host "`n=== 🧮 Vérification de la structure JS ===" -ForegroundColor Yellow

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $open = ($content.ToCharArray() | Where-Object { $_ -eq '{' }).Count
        $close = ($content.ToCharArray() | Where-Object { $_ -eq '}' }).Count
        $diff = $open - $close
        if ($diff -eq 0) {
            Write-Host "✅ $file : accolades équilibrées"
        } else {
            Write-Host "⚠️ $file : $diff accolade(s) ouverte(s) non fermée(s)" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== ✅ Vérification terminée ===`n" -ForegroundColor Green
