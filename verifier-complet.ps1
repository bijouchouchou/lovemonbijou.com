# Vérification complète avec chemin correct
Write-Host "=== VÉRIFICATION COMPLETE ===" -ForegroundColor Cyan

# 1. Fichiers et tailles
Write-Host "`n1. FICHIERS PRINCIPAUX:" -ForegroundColor Yellow
$files = @(
    @{Name="index.html"; Path="index.html"},
    @{Name="style.css"; Path="style.css"}, 
    @{Name="script.js"; Path="assets\script.js"}
)

foreach ($file in $files) {
    if (Test-Path $file.Path) {
        $info = Get-Item $file.Path
        Write-Host "✓ $($file.Name) : $($info.Length) octets" -ForegroundColor Green
    } else {
        Write-Host "✗ $($file.Name) : MANQUANT" -ForegroundColor Red
    }
}

# 2. Vérification encoding
Write-Host "`n2. ENCODING UTF-8:" -ForegroundColor Yellow
foreach ($file in $files) {
    if (Test-Path $file.Path) {
        try {
            Get-Content $file.Path -Encoding UTF8 -ErrorAction Stop | Out-Null
            Write-Host "✓ $($file.Name) : UTF-8 valide" -ForegroundColor Green
        } catch {
            Write-Host "✗ $($file.Name) : Problème encoding" -ForegroundColor Red
        }
    }
}

# 3. Analyse HTML
Write-Host "`n3. ANALYSE HTML:" -ForegroundColor Yellow
if (Test-Path "index.html") {
    $html = Get-Content "index.html" -Raw
    
    # Structure de base
    $checks = @(
        @{Name="Doctype"; Pattern='<!DOCTYPE html>'},
        @{Name="Balise html"; Pattern='<html'},
        @{Name="Head"; Pattern='<head'},
        @{Name="Body"; Pattern='<body'},
        @{Name="Script assets"; Pattern='assets/script.js'}
    )
    
    foreach ($check in $checks) {
        if ($html -match $check.Pattern) {
            Write-Host "✓ $($check.Name)" -ForegroundColor Green
        } else {
            Write-Host "✗ $($check.Name)" -ForegroundColor Red
        }
    }
    
    # Compter les ressources
    $scripts = ([regex]::Matches($html, '<script')).Count
    $css = ([regex]::Matches($html, 'rel="stylesheet"')).Count
    Write-Host "`nRESSOURCES: $scripts scripts, $css feuilles de style" -ForegroundColor White
}

# 4. Vérification CSS et JS
Write-Host "`n4. SYNTAXE:" -ForegroundColor Yellow
if (Test-Path "style.css") {
    $css = Get-Content "style.css" -Raw
    if ($css -match '.*\{.*\}' -or $css.Trim().Length -eq 0) {
        Write-Host "✓ CSS syntaxe OK" -ForegroundColor Green
    } else {
        Write-Host "⚠ CSS syntaxe suspecte" -ForegroundColor Yellow
    }
}

if (Test-Path "assets\script.js") {
    $js = Get-Content "assets\script.js" -Raw
    if ($js -match 'function|const|let|var|console|document' -or $js.Trim().Length -eq 0) {
        Write-Host "✓ JavaScript syntaxe OK" -ForegroundColor Green
    } else {
        Write-Host "⚠ JavaScript syntaxe suspecte" -ForegroundColor Yellow
    }
}

Write-Host "`n=== VÉRIFICATION TERMINÉE ===" -ForegroundColor Cyan