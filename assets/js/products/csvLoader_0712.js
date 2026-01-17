// ============================================
// CHARGEMENT & TRAITEMENT CSV (version corrigee)
// ============================================

import CONFIG from '../core/config.js';
import { setProducts } from '../core/state.js';
import { showNotification } from '../core/utils.js';

// ============================================
// FONCTION PRINCIPALE
// ============================================

export async function loadProductsCSV() {
    console.log('💎 Chargement des bijoux depuis CSV...');

    try {
        showNotification('Chargement du catalogue...', 'info');

        const response = await fetch(CONFIG.csvUrl, {
            headers: { 'Cache-Control': 'no-cache' }
        });

        if (!response.ok) throw new Error("Erreur HTTP " + response.status);

        const csvText = await response.text();
        const rawProducts = parseCSV(csvText);

        console.log("📦", rawProducts.length, "bijoux parsés depuis le CSV");

        const processedProducts = processBijoux(rawProducts);

        setProducts(processedProducts);

        showNotification(`${processedProducts.length} bijoux disponibles`, 'success');

        return processedProducts;

    } catch (error) {
        console.error('❌ Erreur chargement CSV:', error);
        showNotification('Erreur chargement du catalogue', 'error');
        setProducts([]);
        return [];
    }
}

// ============================================
// PARSER CSV
// ============================================

function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(l => l.trim() !== '');
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0], ';')
        .map(h => h.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_'));

    const products = [];

    for (let i = 1; i < lines.length; i++) {
        try {
            const values = parseCSVLine(lines[i], ';');
            const product = {};

            headers.forEach((h, index) => {
                let v = values[index] ? values[index].trim() : '';
                if (h === 'reference') v = v.replace(/\s+/g, '');
                product[h] = v;
            });

            if (product.reference && product.price_euros) {
                products.push(product);
            } else {
                console.warn("⚠️ Ligne ignorée (manque données)", product);
            }

        } catch (e) {
            console.warn("⚠️ Ligne ignorée (erreur parsing):", e.message);
        }
    }

    return products;
}

function parseCSVLine(line, delimiter = ';') {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const next = line[i + 1];

        if (char === '"' && !inQuotes) inQuotes = true;
        else if (char === '"' && inQuotes && next === '"') { current += '"'; i++; }
        else if (char === '"' && inQuotes) inQuotes = false;
        else if (char === delimiter && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current);
    return values;
}

// ============================================
// 💎 CLOUDINARY — VERSION PARFAITE (PNG + JPG)
// ============================================

function generateCloudinaryImage(reference) {
    return CONFIG.getCloudinaryUrl(reference);
}

// ============================================
// TRAITEMENT DES OBJETS PRODUITS
// ============================================

function processBijoux(rawProducts) {
    return rawProducts.map(bijou => ({
        id: bijou.reference,
        reference: bijou.reference,
        sku: bijou.reference,

        name: bijou.titre || "",
        title: bijou.titre || "",
        description: bijou.description || "",

        category: "bijoux",
        type: bijou.type_de_bijoux,
        sub_type: bijou.type_de_bijoux,

        metal: "or",
        metal_color: bijou.couleur || "",
        metal_weight: normalizePoids(bijou.poids_or),
        carat: "9",

        stone_type: bijou.type_de_pierres,
        stone_weight: normalizePoids(bijou.poids_pierre),
        stone_color: bijou.couleur || "",
        has_stone: bijou.type_de_pierres && bijou.type_de_pierres.toLowerCase() !== "aucune",

        price: parseFloat(bijou.price_euros.replace(',', '.')),
        stock: parseInt(bijou.stock) || 0,

        available_sizes: parseSizes(bijou.tailles_disponibles),
        stock_by_size: parseStockBySize(bijou.tailles_disponibles, bijou.quantite_par_taille),
        default_size: getDefaultSize(bijou.tailles_disponibles),

        custom_made: bijou.fabrication_possible === "OUI",
        customizable: bijou.fabrication_possible === "OUI",

        events: parseEvents(bijou.evenement),
        primary_event: getPrimaryEvent(bijou.evenement),

        image: generateCloudinaryImage(bijou.reference),
        images: [generateCloudinaryImage(bijou.reference)],

        weight: normalizePoids(bijou.poids_or) + normalizePoids(bijou.poids_pierre),
        dimensions: "Variable",
        material: "Or 9 carats",

        featured: false,
        new: Math.random() > 0.7,
        bestseller: false,

        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }));
}

// ============================================
// OUTILS
// ============================================

function normalizePoids(p) {
    if (!p) return 0;
    return parseFloat(p.replace(',', '.')) || 0;
}

function parseSizes(str) {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(s => s);
}

function parseStockBySize(sizes, stocks) {
    if (!sizes || !stocks) return {};
    const s = parseSizes(sizes);
    const st = stocks.split(',').map(v => parseInt(v.trim()) || 0);
    const out = {};
    s.forEach((size, i) => out[size] = st[i] || 0);
    return out;
}

function getDefaultSize(str) {
    const sizes = parseSizes(str);
    if (!sizes.length) return "unique";
    const nums = sizes.filter(s => !isNaN(s));
    return nums.length ? nums.sort((a,b)=>a-b)[0] : sizes[0];
}

function parseEvents(str) {
    if (!str) return [];
    return str.split(',').map(e => e.trim().toLowerCase()).filter(e => e);
}

function getPrimaryEvent(str) {
    const ev = parseEvents(str);
    return ev[0] || "general";
}

// ============================================
// EXPORT PRINCIPAL
// ============================================
