# === VERIFICATION COMPLETE DU PROJET BIJOUX CHOUCHOU ===
chcp 65001 > $null
Clear-Host

# --- Dossier racine du projet ---
$basePath = "C:\Users\User\Documents\site avec marketing paiement tailles mail commande"
$timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$rapport = "$basePath\rapport_verif_$timestamp.txt"

Start-Transcript -Path $rapport -Force | Out-Null

Write-Host "=== VERIFICATION DU PROJET BIJOUX CHOUCHOU ==="
Write-Host "(Rapport : rapport_verif_$timestamp.txt)"
Write-Host ""

# --- Fichiers JS et autres ---
$jsFiles = @(
    "$basePath\assets\script.js",
    "$basePath\script_0811.js",
    "$basePath\script_backup_ok_20251111_1117.js"
)
$otherFiles = @(
    "$basePath\index.html",
    "$basePath\style.css",
    "$basePath\products.csv"
)

# --- Verification existence ---
Write-Host "--- Verification de la presence des fichiers ---"
foreach ($file in $jsFiles + $otherFiles) {
    if (Test-Path $file) {
        $info = Get-Item $file
        $lines = (Get-Content $file).Count
        Write-Host ("OK: {0} ({1} Ko, {2} lignes)" -f $info.Name, [math]::Round($info.Length / 1KB,1), $lines)
    } else {
        Write-Host "Manquant: $file"
    }
}

# --- Verification encodage UTF-8 ---
Write-Host ""
Write-Host "--- Verification de l'encodage UTF-8 ---"
foreach ($file in $jsFiles + $otherFiles) {
    if (Test-Path $file) {
        try {
            Get-Content -Path $file -Encoding UTF8 | Out-Null
            Write-Host "OK: $([System.IO.Path]::GetFileName($file)) lisible en UTF-8"
        } catch {
            Write-Host "Erreur encodage: $file"
        }
    }
}

# --- Doublons dans script.js ---
Write-Host ""
Write-Host "--- Recherche de doublons dans script.js ---"
$mainScript = "$basePath\assets\script.js"
if (Test-Path $mainScript) {
    $lines = Get-Content $mainScript
    $dupes = $lines | Group-Object | Where-Object { $_.Count -gt 1 }
    if ($dupes.Count -gt 0) {
        Write-Host "Doublons detectes:"
        $dupes | ForEach-Object { Write-Host " - $($_.Name)" }
    } else {
        Write-Host "Aucun doublon trouve."
    }
}

# --- Comparaison JS ---
Write-Host ""
Write-Host "--- Comparaison des fichiers JS ---"
if (Test-Path $jsFiles[0] -and Test-Path $jsFiles[1]) {
    $diff = Compare-Object (Get-Content $jsFiles[0]) (Get-Content $jsFiles[1])
    if ($diff) {
        Write-Host "Differences entre script.js et script_0811.js:"
        $diff | ForEach-Object {
            if ($_.SideIndicator -eq '=>') {
                Write-Host " > script_0811.js: $($_.InputObject)"
            } else {
                Write-Host " < script.js: $($_.InputObject)"
            }
        }
    } else {
        Write-Host "Les deux fichiers sont identiques."
    }
}

# --- Structure JS ---
Write-Host ""
Write-Host "--- Verification structure JavaScript ---"
$content = Get-Content $mainScript -Raw
$openBraces = ($content -split '{').Count
$closeBraces = ($content -split '}').Count
if ($openBraces -eq $closeBraces) {
    Write-Host "Accolades OK ($openBraces / $closeBraces)"
} else {
    Write-Host "Desaccord: $openBraces ouvrantes / $closeBraces fermantes"
}

# --- Test syntaxe JS avec Node.js ---
Write-Host ""
Write-Host "--- Test syntaxe JavaScript (Node.js) ---"
if (Get-Command node -ErrorAction SilentlyContinue) {
    try {
        node --check $mainScript 2>$null
        Write-Host "Syntaxe OK"
    } catch {
        Write-Host "Erreur de syntaxe detectee"
    }
} else {
    Write-Host "Node.js non trouve - test ignore"
}

# --- HTML / CSS ---
Write-Host ""
Write-Host "--- Verification HTML et CSS ---"
if (Test-Path "$basePath\index.html") {
    $html = Get-Content "$basePath\index.html" -Raw
    if ($html -match "<html" -and $html -match "</html>") {
        Write-Host "index.html OK"
    } else {
        Write-Host "index.html incomplet"
    }
}
if (Test-Path "$basePath\style.css") {
    $css = Get-Content "$basePath\style.css" -Raw
    if ($css -match "{") {
        Write-Host "style.css OK"
    } else {
        Write-Host "style.css vide ou mal forme"
    }
}

# --- CSV ---
Write-Host ""
Write-Host "--- Verification du CSV ---"
if (Test-Path "$basePath\products.csv") {
    try {
        $csv = Import-Csv "$basePath\products.csv"
        if ($csv.Count -gt 0) {
            Write-Host "products.csv contient $($csv.Count) entrees"
        } else {
            Write-Host "products.csv vide"
        }
    } catch {
        Write-Host "Erreur lecture CSV"
    }
}

Write-Host ""
Write-Host "=== VERIFICATION TERMINEE ==="
Write-Host "Rapport: $rapport"

Stop-Transcript | Out-Null
