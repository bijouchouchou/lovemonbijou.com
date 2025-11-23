# Vérification complète du projet
Write-Host "=== VÉRIFICATION COMPLETE DU PROJET ===" -ForegroundColor Cyan

# 1. Vérification encoding
Write-Host "`n1. ENCODAGE DES FICHIERS:" -ForegroundColor Yellow
$files = Get-ChildItem -Include "index.html", "style.css", "script.js" -ErrorAction SilentlyContinue

if (-not $files) {
    Write-Host "ERREUR: Fichiers non trouvés dans le dossier courant" -ForegroundColor Red
    Write-Host "Assurez-vous d'être dans le bon dossier" -ForegroundColor Yellow
    exit
}

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -Encoding Byte
        $bom = $content[0..2] -join ','
        
        if ($bom -eq '239,187,191') {
            Write-Host "✓ $($file.Name) : UTF-8 avec BOM" -ForegroundColor Green
        } else {
            # Test de lecture en UTF-8
            $testContent = Get-Content $file.FullName -Encoding UTF8 -ErrorAction Stop
            Write-Host "✓ $($file.Name) : UTF-8 sans BOM" -ForegroundColor Green
        }
    } catch {
        Write-Host "✗ $($file.Name) : Problème d'encodage (probablement pas UTF-8)" -ForegroundColor Red
    }
}

# 2. Analyse HTML
Write-Host "`n2. ANALYSE HTML:" -ForegroundColor Yellow
if (Test-Path "index.html") {
    $html = Get-Content "index.html" -Raw
    
    # Scripts
    $scripts = [regex]::Matches($html, '<script.*?src="(.*?)".*?>')
    Write-Host "Scripts trouvés ($($scripts.Count)):" -ForegroundColor White
    $scripts | ForEach-Object { Write-Host "  → $($_.Groups[1].Value)" -ForegroundColor Gray }
    
    # CSS
    $cssLinks = [regex]::Matches($html, '<link.*?href="(.*?)".*?rel="stylesheet".*?>')
    Write-Host "Feuilles de style ($($cssLinks.Count)):" -ForegroundColor White
    $cssLinks | ForEach-Object { Write-Host "  → $($_.Groups[1].Value)" -ForegroundColor Gray }
    
    # Doublons
    $duplicates = $scripts | Group-Object { $_.Groups[1].Value } | Where-Object Count -GT 1
    if ($duplicates) {
        Write-Host "ALERTE DOUBLONS:" -ForegroundColor Red
        $duplicates | ForEach-Object { Write-Host "  ✗ $($_.Name)" -ForegroundColor Red }
    }
}

# 3. Vérifications rapides
Write-Host "`n3. VERIFICATIONS RAPIDES:" -ForegroundColor Yellow

# HTML
if (Test-Path "index.html") {
    $html = Get-Content "index.html" -Raw
    $checks = @(
        @{Name="Doctype"; Pattern='<!DOCTYPE html>'},
        @{Name="Balise html"; Pattern='<html.*?>'},
        @{Name="Head"; Pattern='<head.*?>'},
        @{Name="Body"; Pattern='<body.*?>'}
    )
    
    foreach ($check in $checks) {
        if ($html -match $check.Pattern) {
            Write-Host "✓ $($check.Name)" -ForegroundColor Green
        } else {
            Write-Host "✗ $($check.Name) manquant" -ForegroundColor Red
        }
    }
}

# CSS
if (Test-Path "style.css") {
    $css = Get-Content "style.css" -Raw
    if ($css -match '.*\{.*\}' -or $css.Trim().Length -eq 0) {
        Write-Host "✓ CSS syntaxe OK" -ForegroundColor Green
    } else {
        Write-Host "⚠ CSS syntaxe suspecte" -ForegroundColor Yellow
    }
}

# JavaScript
if (Test-Path "script.js") {
    $js = Get-Content "script.js" -Raw
    if ($js -match 'function|const|let|var|console|document' -or $js.Trim().Length -eq 0) {
        Write-Host "✓ JS syntaxe OK" -ForegroundColor Green
    } else {
        Write-Host "⚠ JS syntaxe suspecte" -ForegroundColor Yellow
    }
}

# 4. Recommandations
Write-Host "`n4. RECOMMANDATIONS:" -ForegroundColor Cyan
Write-Host "• CSS dans head, scripts en fin de body" -ForegroundColor White
Write-Host "• Vérifier l'encoding dans VS Code (bas a droite)" -ForegroundColor White
Write-Host "• Pas de doublons de scripts" -ForegroundColor White

Write-Host "`n=== VERIFICATION TERMINEE ===" -ForegroundColor Cyan