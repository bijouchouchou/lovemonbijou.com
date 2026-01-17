# test-final.ps1 - Vérification complète
Write-Host "=== TEST FINAL STRUCTURE ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm')`n"

# 1. Vérifier fichiers essentiels
$requiredFiles = @(
    "index.html",
    "assets/css/style.css",
    "assets/css/style-modals.css",
    "assets/js/main.js",
    "assets/js/core/config.js",
    "assets/js/core/state.js",
    "assets/js/core/utils.js",
    "assets/js/products/csvLoader.js",
    "assets/js/products/display.js",
    "assets/js/modals/modalBase.js",
    "assets/js/modals/modalView.js",
    "assets/js/modals/modalFabrication.js",
    "assets/data/products.csv"
)

Write-Host "1. FICHIERS ESSENTIELS:" -ForegroundColor Yellow
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        $size = "{0:N2}" -f ((Get-Item $file).Length / 1KB)
        Write-Host "   ✅ $file ($size Ko)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file (MANQUANT)" -ForegroundColor Red
    }
}

# 2. Vérifier HTML
Write-Host "`n2. VERIFICATION HTML:" -ForegroundColor Yellow
$html = Get-Content "index.html" -Raw

if ($html -match 'type="module"') {
    Write-Host "   ✅ Utilise les modules ES6" -ForegroundColor Green
} else {
    Write-Host "   ❌ Doit utiliser type='module'" -ForegroundColor Red
}

if ($html -match 'style-modals\.css') {
    Write-Host "   ✅ Inclut style-modals.css" -ForegroundColor Green
} else {
    Write-Host "   ❌ Doit inclure style-modals.css" -ForegroundColor Red
}

if ($html -match 'id="filters-container"') {
    Write-Host "   ✅ Conteneur filtres présent" -ForegroundColor Green
} else {
    Write-Host "   ❌ Conteneur filtres manquant" -ForegroundColor Red
}

if ($html -match 'id="products-container"') {
    Write-Host "   ✅ Conteneur produits présent" -ForegroundColor Green
} else {
    Write-Host "   ❌ Conteneur produits manquant" -ForegroundColor Red
}

# 3. Vérifier CSV
Write-Host "`n3. VERIFICATION CSV:" -ForegroundColor Yellow
if (Test-Path "assets/data/products.csv") {
    $lines = (Get-Content "assets/data/products.csv" | Measure-Object -Line).Lines
    $sample = Get-Content "assets/data/products.csv" -First 2
    Write-Host "   ✅ CSV: $lines lignes" -ForegroundColor Green
    Write-Host "   Exemple: $($sample[1])" -ForegroundColor Gray
} else {
    Write-Host "   ❌ CSV manquant" -ForegroundColor Red
}

# 4. Vérifier structure JS
Write-Host "`n4. STRUCTURE JS:" -ForegroundColor Yellow
$jsDirs = @("core", "products", "modals", "cart", "filters", "email")
foreach ($dir in $jsDirs) {
    $path = "assets/js/$dir"
    if (Test-Path $path) {
        $files = (Get-ChildItem $path -Filter *.js -ErrorAction SilentlyContinue).Count
        Write-Host "   📁 $dir: $files fichier(s)" -ForegroundColor Cyan
    } else {
        Write-Host "   📁 $dir: (absent)" -ForegroundColor Gray
    }
}

Write-Host "`n=== RECOMMANDATIONS ===" -ForegroundColor Magenta
Write-Host "Prochaines étapes:" -ForegroundColor White
Write-Host "1. Ouvrir index.html dans un navigateur moderne" -ForegroundColor Gray
Write-Host "2. Vérifier la console (F12) pour les erreurs" -ForegroundColor Gray
Write-Host "3. Créer cart/cartCore.js pour le panier" -ForegroundColor Gray
Write-Host "4. Tester les modales (clic sur produit)" -ForegroundColor Gray

Write-Host "`n✅ Test terminé !" -ForegroundColor Green
