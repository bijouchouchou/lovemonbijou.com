# ===============================
# Script : verif_projet.ps1
# Vérification des fichiers du projet e-commerce
# ===============================

Write-Host "=== 🔍 Vérification du projet e-commerce ===" -ForegroundColor Cyan
Write-Host ""

# --- Fichiers à vérifier ---
$files = @(
    "assets\script.js",
    "style.css",
    "index.html",
    "products.csv"
)

# --- 1️⃣ Vérification de l'encodage UTF-8 ---
Write-Host "🧩 Vérification de l'encodage UTF-8..." -ForegroundColor Yellow
foreach ($file in $files) {
    if (Test-Path $file) {
        try {
            Get-Content $file -Encoding UTF8 | Out-Null
            Write-Host "✅ $file est lisible en UTF-8"
        } catch {
            Write-Host "⚠️  Problème d'encodage avec $file" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Fichier manquant : $file" -ForegroundColor Red
    }
}
Write-Host ""

# --- 2️⃣ Vérifier les doublons dans script.js ---
if (Test-Path "assets\script.js") {
    Write-Host "🧩 Recherche de doublons exacts dans script.js..." -ForegroundColor Yellow
    $dupes = Get-Content "assets\script.js" | Group-Object | Where-Object { $_.Count -gt 1 }
    if ($dupes) {
        Write-Host "⚠️  Lignes dupliquées détectées :" -ForegroundColor Red
        $dupes | ForEach-Object { Write-Host "  → Ligne : $($_.Name)" }
    } else {
        Write-Host "✅ Aucun doublon trouvé."
    }
    Write-Host ""
}

# --- 3️⃣ Vérification de la syntaxe JavaScript ---
Write-Host "🧩 Vérification de la syntaxe JS..." -ForegroundColor Yellow
if (Get-Command cscript -ErrorAction SilentlyContinue) {
    try {
        cscript //nologo //e:jscript "assets\script.js" | Out-Null
        Write-Host "✅ Aucune erreur de syntaxe détectée."
    } catch {
        Write-Host "⚠️  Erreur de syntaxe détectée dans script.js" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  cscript non disponible. (Node.js recommandé pour vérification JS)"
}
Write-Host ""

# --- 4️⃣ Vérifier l'équilibre et repérer la ligne problématique ---
if (Test-Path "assets\script.js") {
    Write-Host "🧩 Vérification de la structure du code JS..." -ForegroundColor Yellow
    $lines = Get-Content "assets\script.js"
    $stack = @()
    $lineNumber = 0
    $errorFound = $false

    foreach ($line in $lines) {
        $lineNumber++
        foreach ($char in $line.ToCharArray()) {
            switch ($char) {
                '{' { $stack += '}' }
                '(' { $stack += ')' }
                '[' { $stack += ']' }
                '}' { if ($stack.Count -eq 0 -or $stack[-1] -ne '}') { 
                            Write-Host "⚠️  Fermeture '}' inattendue à la ligne $lineNumber" -ForegroundColor Red
                            $errorFound = $true
                            break
                       } else { $stack = $stack[0..($stack.Count -2)] } }
                ')' { if ($stack.Count -eq 0 -or $stack[-1] -ne ')') { 
                            Write-Host "⚠️  Fermeture ')' inattendue à la ligne $lineNumber" -ForegroundColor Red
                            $errorFound = $true
                            break
                       } else { $stack = $stack[0..($stack.Count -2)] } }
                ']' { if ($stack.Count -eq 0 -or $stack[-1] -ne ']') { 
                            Write-Host "⚠️  Fermeture ']' inattendue à la ligne $lineNumber" -ForegroundColor Red
                            $errorFound = $true
                            break
                       } else { $stack = $stack[0..($stack.Count -2)] } }
            }
        }
        if ($errorFound) { break }
    }

    if (-not $errorFound) {
        if ($stack.Count -eq 0) {
            Write-Host "✅ Parenthèses, crochets et accolades équilibrés."
        } else {
            Write-Host "⚠️  Il manque $($stack.Count) fermeture(s) à la fin du fichier !" -ForegroundColor Red
        }
    }
    Write-Host ""
}

# --- 5️⃣ Vérifier structure HTML & CSS ---
Write-Host "🧩 Vérification structure HTML et CSS..." -ForegroundColor Yellow
if ((Get-Content "index.html" -Raw) -match "<html") {
    Write-Host "✅ index.html contient une balise <html>"
} else {
    Write-Host "⚠️  Structure HTML absente ou incomplète" -ForegroundColor Red
}
if ((Get-Content "style.css" -Raw) -match "{") {
    Write-Host "✅ style.css contient des règles CSS"
} else {
    Write-Host "⚠️  style.css semble vide ou corrompu" -ForegroundColor Red
}
Write-Host ""

# --- 6️⃣ Vérifier le CSV ---
Write-Host "🧩 Vérification du fichier CSV..." -ForegroundColor Yellow
try {
    $csv = Import-Csv "products.csv" | Select-Object -First 5
    if ($csv) {
        Write-Host "✅ products.csv lisible et structuré."
    } else {
        Write-Host "⚠️  Fichier CSV vide ou mal formé." -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️  Erreur lors de la lecture de products.csv" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== ✅ Vérification terminée ===" -ForegroundColor Green
