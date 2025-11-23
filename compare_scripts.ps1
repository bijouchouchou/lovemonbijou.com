# === 🔍 Vérification des fichiers script.js ===
chcp 65001 > $null
Clear-Host
Write-Host "=== 💎 Vérification des scripts Bijoux Chouchou ===" -ForegroundColor Cyan

# --- Dossier de travail (à adapter si besoin) ---
$basePath = "C:\Users\User\Documents\site avec marketing paiement tailles mail commande"

# --- Liste des fichiers à comparer ---
$files = @(
    "$basePath\assets\script.js",
    "$basePath\script_0811.js",
    "$basePath\script_backup_ok_20251111_1117.js"
)

Write-Host "`n--- 📁 Vérification de l'existence des fichiers ---" -ForegroundColor Yellow
foreach ($file in $files) {
    if (Test-Path $file) {
        $info = Get-Item $file
        Write-Host "✅ $($info.Name) trouvé ($([math]::Round($info.Length / 1KB, 1)) Ko, $((Get-Content $file).Count) lignes)"
    } else {
        Write-Host "⚠️ Fichier manquant : $file" -ForegroundColor Red
    }
}

# --- Vérification encodage UTF-8 ---
Write-Host "`n--- 🔤 Vérification de l'encodage UTF-8 ---" -ForegroundColor Yellow
foreach ($file in $files) {
    if (Test-Path $file) {
        try {
            Get-Content -Path $file -Encoding UTF8 | Out-Null
            Write-Host "✅ $([System.IO.Path]::GetFileName($file)) est lisible en UTF-8"
        } catch {
            Write-Host "⚠️ Problème d'encodage : $file" -ForegroundColor Red
        }
    }
}

# --- Recherche de doublons dans script.js ---
Write-Host "`n--- 🧮 Vérification des doublons dans script.js ---" -ForegroundColor Yellow
$mainScript = "$basePath\assets\script.js"
if (Test-Path $mainScript) {
    $lines = Get-Content $mainScript
    $dupes = $lines | Group-Object | Where-Object { $_.Count -gt 1 }
    if ($dupes.Count -gt 0) {
        Write-Host "⚠️ Lignes dupliquées détectées :" -ForegroundColor Red
        $dupes | ForEach-Object { Write-Host "↳ $($_.Name)" }
    } else {
        Write-Host "✅ Aucun doublon trouvé."
    }
}

# --- Comparaison du contenu ---
Write-Host "`n--- 🧾 Comparaison du contenu des scripts ---" -ForegroundColor Yellow
$compare = Compare-Object (Get-Content $files[0]) (Get-Content $files[1]) -IncludeEqual -PassThru
if ($compare) {
    Write-Host "🪶 Différences entre assets/script.js et script_0811.js :"
    $diff = Compare-Object (Get-Content $files[0]) (Get-Content $files[1])
    if ($diff) {
        $diff | ForEach-Object {
            $side = if ($_.SideIndicator -eq '=>') { '→ script_0811.js' } else { '← script.js' }
            Write-Host "$side : $($_.InputObject)" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "✅ Les deux fichiers sont identiques."
    }
}

# --- Vérification basique de la structure JS ---
Write-Host "`n--- 🧩 Vérification de la structure JavaScript ---" -ForegroundColor Yellow
$content = Get-Content $mainScript -Raw
$openBraces = ($content -split '{').Count
$closeBraces = ($content -split '}').Count
if ($openBraces -eq $closeBraces) {
    Write-Host "✅ Accolades équilibrées ($openBraces ouvrantes / $closeBraces fermantes)"
} else {
    Write-Host "⚠️ Il manque $($openBraces - $closeBraces) accolade(s) fermante(s) !" -ForegroundColor Red
}

# --- Résumé final ---
Write-Host "`n=== ✅ Vérification terminée ===" -ForegroundColor Green
