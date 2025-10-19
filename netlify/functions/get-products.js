<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Catalogue Interactif</title>
<style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    select { margin: 10px 5px; padding: 5px; }
    table { border-collapse: collapse; width: 100%; margin-top: 15px; }
    th, td { border: 1px solid #333; padding: 8px; text-align: left; }
</style>
</head>
<body>

<h1>Catalogue Interactif</h1>

<label for="typeSelect">Type de produit:</label>
<select id="typeSelect">
    <option value="">--Tous les types--</option>
</select>

<label for="titleSelect">Titre du produit:</label>
<select id="titleSelect">
    <option value="">--Tous les titres--</option>
</select>

<label for="priceSort">Trier par prix:</label>
<select id="priceSort">
    <option value="">--Aucun--</option>
    <option value="asc">Prix croissant</option>
    <option value="desc">Prix décroissant</option>
</select>

<table id="productTable">
    <thead>
        <tr>
            <th>Titre</th>
            <th>Couleur</th>
            <th>Or</th>
            <th>Poids</th>
            <th>Quantités par taille</th>
            <th>Prix (€)</th>
        </tr>
    </thead>
    <tbody></tbody>
</table>

<script>
let products = [];

async function loadProducts() {
    try {
        const res = await fetch('/.netlify/functions/get-products');
        if (!res.ok) throw new Error('Erreur lors du chargement des produits');
        products = await res.json();

        populateTypeDropdown();
        populateTable();
    } catch (err) {
        console.error(err);
        alert('Impossible de charger le catalogue. Vérifiez la console.');
    }
}

function populateTypeDropdown() {
    const typeSelect = document.getElementById('typeSelect');
    const types = [...new Set(products.map(p => p.couleur))];
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
    });
}

function populateTitleDropdown(selectedType) {
    const titleSelect = document.getElementById('titleSelect');
    titleSelect.innerHTML = '<option value="">--Tous les titres--</option>';
    const filtered = selectedType ? products.filter(p => p.couleur === selectedType) : products;
    const titles = [...new Set(filtered.map(p => p.titre))];
    titles.forEach(title => {
        const option = document.createElement('option');
        option.value = title;
        option.textContent = title;
        titleSelect.appendChild(option);
    });
}

function parseSizes(sizesField) {
    if (!sizesField) return '';
    try {
        const sizesArray = JSON.parse(sizesField);
        return sizesArray.map(s => `${s.size}: ${s.quantity}`).join('<br>');
    } catch (err) {
        console.warn('Impossible de parser les tailles:', sizesField);
        return sizesField;
    }
}

function populateTable() {
    const tbody = document.querySelector('#productTable tbody');
    tbody.innerHTML = '';

    const selectedType = document.getElementById('typeSelect').value;
    const selectedTitle = document.getElementById('titleSelect').value;
    const priceSort = document.getElementById('priceSort').value;

    let filtered = products;
    if (selectedType) filtered = filtered.filter(p => p.couleur === selectedType);
    if (selectedTitle) filtered = filtered.filter(p => p.titre === selectedTitle);

    // Tri par prix si demandé
    if (priceSort === 'asc') filtered.sort((a, b) => a.prix - b.prix);
    if (priceSort === 'desc') filtered.sort((a, b) => b.prix - a.prix);

    filtered.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.titre}</td>
            <td>${p.couleur}</td>
            <td>${p.or}</td>
            <td>${p.poids}</td>
            <td>${parseSizes(p.autre_pierre)}</td>
            <td>${p.prix.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('typeSelect').addEventListener('change', e => {
    const type = e.target.value;
    populateTitleDropdown(type);
    populateTable();
});

document.getElementById('titleSelect').addEventListener('change', populateTable);
document.getElementById('priceSort').addEventListener('change', populateTable);

loadProducts();
</script>

</body>
</html>
