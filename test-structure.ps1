# test-structure.ps1
Write-Host "=== TEST STRUCTURE LOVE MON BIJOU ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"

# Vérifier les dossiers essentiels
$requiredDirs = @(
    "assets\js\core",
    "assets\js\products", 
    "assets\js\modals",
    "assets\js\cart",
    "assets\js\filters",
    "assets\js\email",
    "assets\css",
    "assets\data"
)

Write-Host "1. VERIFICATION DES DOSSIERS:" -ForegroundColor Yellow
foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Write-Host "   [OK] $dir" -ForegroundColor Green
    } else {
        Write-Host "   [MANQUANT] $dir" -ForegroundColor Red
    }
}

# Vérifier les fichiers essentiels
$requiredFiles = @(
    "assets\js\core\config.js",
    "assets\js\core\state.js",
    "assets\js\core\utils.js",
    "assets\js\products\csvLoader.js",
    "assets\js\products\display.js",
    "assets\js\main.js",
    "assets\css\style.css",
    "assets\data\products.csv"
)

Write-Host "`n2. VERIFICATION DES FICHIERS:" -ForegroundColor Yellow
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length / 1KB
        Write-Host "   [OK] $file ($([math]::Round($size, 2)) Ko)" -ForegroundColor Green
    } else {
        Write-Host "   [MANQUANT] $file" -ForegroundColor Red
    }
}

# Vérifier fichiers manquants (à créer)
$missingFiles = @(
    "assets\js\modals\modalBase.js",
    "assets\js\modals\modalView.js",
    "assets\js\modals\modalFabrication.js",
    "assets\js\cart\cartCore.js",
    "assets\js\cart\cartCheckout.js",
    "assets\js\filters\filters.js",
    "assets\js\email\emailService.js"
)

Write-Host "`n3. FICHIERS A CREER:" -ForegroundColor Yellow
foreach ($file in $missingFiles) {
    Write-Host "   [A CREER] $file" -ForegroundColor Gray
}

# Tester le CSV
Write-Host "`n4. TEST DU CSV:" -ForegroundColor Yellow
if (Test-Path "assets\data\products.csv") {
    $csvLines = (Get-Content "assets\data\products.csv" | Measure-Object -Line).Lines
    $csvSample = Get-Content "assets\data\products.csv" -First 3
    Write-Host "   [OK] CSV trouve ($csvLines lignes)" -ForegroundColor Green
    Write-Host "   Exemple:`n   $($csvSample[0])`n   $($csvSample[1])" -ForegroundColor Gray
} else {
    Write-Host "   [MANQUANT] CSV" -ForegroundColor Red
}

# Vérifier index.html
Write-Host "`n5. INDEX.HTML:" -ForegroundColor Yellow
if (Test-Path "index.html") {
    $html = Get-Content "index.html" -Raw
    $hasModules = $html -match "type=.module"
    $hasMainJS = $html -match "main\.js"
    
    if ($hasModules) {
        Write-Host "   [OK] Utilise les modules ES6" -ForegroundColor Green
    } else {
        Write-Host "   [ATTENTION] Doit utiliser type='module'" -ForegroundColor Yellow
    }
    
    if ($hasMainJS) {
        Write-Host "   [OK] Reference main.js" -ForegroundColor Green
    } else {
        Write-Host "   [ERREUR] Doit inclure main.js" -ForegroundColor Red
    }
} else {
    Write-Host "   [MANQUANT] index.html" -ForegroundColor Red
}

Write-Host "`n=== FIN DU TEST ===" -ForegroundColor Cyan
Write-Host "PROCHAINES ETAPES: Creer les modales" -ForegroundColor Magenta
