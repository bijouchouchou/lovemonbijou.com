# ============================================================
#      PREDEPLOY E-COMMERCE – VERSION ADAPTEE AU CSV
# ============================================================

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile = "logs/predeploy-ecommerce-$timestamp.log"
$htmlFile = "reports/predeploy-ecommerce-report.html"

New-Item -ItemType Directory -Force -Path logs | Out-Null
New-Item -ItemType Directory -Force -Path reports | Out-Null

function Log {
    param($msg)
    $msg | Out-File -Append $logFile
    Write-Host $msg
}

$html = @()

function HtmlLine {
    param($line)
    $global:html += $line
}

# Helper pour extraire un identifiant propre a partir de REFERENCE
function Get-ProductId {
    param($p)
    if ($null -ne $p -and $p.PSObject.Properties.Name -contains 'REFERENCE' -and $p.REFERENCE) {
        # Prend la partie avant la premiere virgule, et trim
        $raw = [string]$p.REFERENCE
        $firstPart = ($raw -split ',')[0]
        return $firstPart.Trim()
    }
    return "<inconnu>"
}

Log "=== PREDEPLOY E-COMMERCE $timestamp ==="

# ============================================================
# 1) CSV
# ============================================================

$csvPath = "C:\Users\User\Documents\site avec marketing paiement tailles mail commande\data\products.csv"

if (!(Test-Path $csvPath)) {
    Log "ERREUR CSV introuvable : $csvPath"
    HtmlLine "<p style='color:red'>CSV introuvable : $csvPath</p>"
    goto BuildReport
}

$products = Import-Csv $csvPath
Log "CSV charge : $($products.Count) produits"
HtmlLine "<h3>Produits CSV</h3>"
HtmlLine "<p>$($products.Count) produits trouves</p>"

# ============================================================
# 2) Colonnes (alignees avec ton CSV)
# ============================================================

# Noms EXACTS des colonnes dans ton fichier :
# REFERENCE,type de bijoux,description,image,couleur,TITRE,POIDS OR,
# type de pierres,Poids pierre,tailles disponibles,quantite par taille,
# price €,stock,fabrication_possible,evenement

$required = @(
    "REFERENCE",
    "TITRE",
    "description",
    "tailles disponibles",
    "Poids pierre"
)

$existingCols = $products[0].PSObject.Properties.Name

foreach ($col in $required) {
    if ($existingCols -notcontains $col) {
        Log "ERREUR colonne manquante : $col"
        HtmlLine "<p style='color:red'>Colonne manquante : $col</p>"
    } else {
        HtmlLine "<p style='color:green'>Colonne OK : $col</p>"
    }
}

# ============================================================
# 3) Images Cloudinary (basee sur REFERENCE)
# ============================================================

HtmlLine "<h3>Images Cloudinary</h3>"
$cBase = "https://res.cloudinary.com/dcak9pjrt/image/upload/"

foreach ($p in $products) {
    $id = Get-ProductId $p
    if ([string]::IsNullOrWhiteSpace($id)) {
        Log "REFERENCE vide ou invalide pour une ligne"
        HtmlLine "<p style='color:red'>REFERENCE vide pour une ligne</p>"
        continue
    }

    $url = "$cBase$id.jpg"

    try {
        Invoke-WebRequest -Uri $url -Method Head -ErrorAction Stop | Out-Null
        Log "Image OK : $id ($url)"
        HtmlLine "<p style='color:green'>Image OK : $id.jpg</p>"
    }
    catch {
        Log "Image manquante pour $id -> $url"
        HtmlLine "<p style='color:red'>Image manquante : $id.jpg</p>"
    }
}

# ============================================================
# 4) Champs produits (description / tailles / poids pierre)
# ============================================================

HtmlLine "<h3>Champs produits</h3>"

foreach ($p in $products) {

    $id = Get-ProductId $p
    $desc = $p.description
    $tailles = $p.'tailles disponibles'
    $poidsPierre = $p.'Poids pierre'

    if ([string]::IsNullOrWhiteSpace($desc)) {
        Log "Description vide : $id"
        HtmlLine "<p style='color:red'>Description vide : $id</p>"
    }

    if ([string]::IsNullOrWhiteSpace($tailles)) {
        Log "Tailles manquantes : $id"
        HtmlLine "<p style='color:red'>Tailles manquantes : $id</p>"
    }

    if (-not [string]::IsNullOrWhiteSpace($poidsPierre)) {
        # Autorise formats 0.120, 0,120, 1, 2 etc.
        if ($poidsPierre -notmatch '^[0-9]+([.,][0-9]+)?$') {
            Log "Poids pierre invalide : $id -> $poidsPierre"
            HtmlLine "<p style='color:red'>Poids pierre invalide pour : $id ($poidsPierre)</p>"
        }
    } else {
        Log "Poids pierre manquant : $id"
        HtmlLine "<p style='color:red'>Poids pierre manquant : $id</p>"
    }
}
# ============================================================
# 4bis) Champs avances : fabrication_possible / stock / prix
# ============================================================

foreach ($p in $products) {

    $id = Get-ProductId $p

    # -------------------------------------------------------
    # 1) fabrication_possible = OUI / NON
    # -------------------------------------------------------
    $fab = $p.fabrication_possible
    if (![string]::IsNullOrWhiteSpace($fab)) {
        $fabTrim = $fab.Trim().ToUpper()

        if ($fabTrim -notin @("OUI","NON")) {
            Log "Valeur fabrication_possible invalide : $id -> $fab"
            HtmlLine "<p style='color:red'>fabrication_possible invalide pour : $id ($fab)</p>"
        }
    } else {
        Log "fabrication_possible vide : $id"
        HtmlLine "<p style='color:orange'>fabrication_possible vide : $id</p>"
    }

    # -------------------------------------------------------
    # 2) Coherence stock vs quantite par taille
    # -------------------------------------------------------
    $qt = $p.'quantité par taille'
    $stock = $p.stock

    if (![string]::IsNullOrWhiteSpace($qt)) {
        # ex : "1,1,1,1,1"
        try {
            $quantites = $qt -split ',' | ForEach-Object { [int]$_ }
            $sommeQt = ($quantites | Measure-Object -Sum).Sum

            if ($stock -as [int] -ne $sommeQt) {
                Log "Incoherence stock : $id stock=$stock <> sommeQt=$sommeQt"
                HtmlLine "<p style='color:red'>Incoherence stock : $id (stock=$stock <> somme=$sommeQt)</p>"
            } else {
                HtmlLine "<p style='color:green'>Stock OK : $id</p>"
            }
        } catch {
            Log "Erreur dans quantite par taille : $id -> $qt"
            HtmlLine "<p style='color:red'>Erreur quantite par taille : $id ($qt)</p>"
        }
    } else {
        Log "quantite par taille vide : $id"
        HtmlLine "<p style='color:orange'>quantite par taille vide : $id</p>"
    }

    # -------------------------------------------------------
    # 3) Verification du prix
    # -------------------------------------------------------
    $price = $p.'price €'

    if ([string]::IsNullOrWhiteSpace($price)) {
        Log "Prix vide : $id"
        HtmlLine "<p style='color:orange'>Prix vide : $id</p>"
    }
    else {
        # Autorise : 149,99 ou 149.99 ou 149
        if ($price -notmatch '^[0-9]+([.,][0-9]+)?$') {
            Log "Prix invalide : $id -> $price"
            HtmlLine "<p style='color:red'>Prix invalide : $id ($price)</p>"
        } else {
            HtmlLine "<p style='color:green'>Prix OK : $id</p>"
        }
    }
}

# ============================================================
# 5) JS
# ============================================================

HtmlLine "<h3>JS</h3>"
$js = "assets/script.js"

if (Test-Path $js) {
    try {
        node --check $js | Out-Null
        Log "JS OK"
        HtmlLine "<p style='color:green'>script.js OK</p>"
    }
    catch {
        Log "Erreur JS"
        HtmlLine "<p style='color:red'>Erreur dans script.js</p>"
    }
} else {
    Log "script.js introuvable"
    HtmlLine "<p style='color:red'>script.js introuvable</p>"
}

# ============================================================
# 6) Bouton Fabrication
# ============================================================

HtmlLine "<h3>Bouton Fabrication</h3>"

$jsContent = if (Test-Path $js) { Get-Content $js -Raw } else { "" }

if ($jsContent -match "fabrication-btn") {
    Log "Bouton fabrication OK"
    HtmlLine "<p style='color:green'>Bouton Fabrication detecte</p>"
} else {
    Log "Bouton fabrication manquant"
    HtmlLine "<p style='color:red'>Bouton Fabrication NON detecte</p>"
}

if ($jsContent -match "openFabricationModal") {
    Log "openFabricationModal OK"
    HtmlLine "<p style='color:green'>Fonction openFabricationModal OK</p>"
} else {
    Log "openFabricationModal manquante"
    HtmlLine "<p style='color:red'>Fonction openFabricationModal manquante</p>"
}

# ============================================================
# 7) Panier
# ============================================================

HtmlLine "<h3>Panier</h3>"

if (Test-Path "panier.html") {
    Log "Panier OK"
    HtmlLine "<p style='color:green'>panier.html trouve</p>"
} else {
    Log "Panier introuvable"
    HtmlLine "<p style='color:red'>panier.html introuvable</p>"
}

# ============================================================
# 8) Build
# ============================================================

HtmlLine "<h3>Build</h3>"
try {
    npm run build | Out-Null
    Log "Build OK"
    HtmlLine "<p style='color:green'>Build OK</p>"
}
catch {
    Log "Build echouee"
    HtmlLine "<p style='color:red'>Build echouee</p>"
}

# ============================================================
# 9) Rapport HTML
# ============================================================

:BuildReport

$report = @"
<html>
<head>
<title>Predeploy Ecommerce</title>
<style>
body { font-family: Arial; margin:20px; }
h1 { color:#333; }
p { margin:3px 0; }
h3 { margin-top:15px; }
</style>
</head>
<body>
<h1>Rapport Predeploy</h1>
<p>Date : $timestamp</p>
$( $html -join "`n" )
</body>
</html>
"@

$report | Out-File -FilePath $htmlFile -Encoding UTF8

Log "Rapport genere : $htmlFile"

Start-Process $htmlFile

Log "=== FIN ==="
