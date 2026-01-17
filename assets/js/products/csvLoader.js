// ============================================
// CSV LOADER - EV1 CLEAN VERSION (NO ACCENTS)
// Compatible with display.js, modals.js, cartCore
// ============================================

import CONFIG from '../core/config.js';
import { normalizeProduct } from "../core/utils.js";

// ============================================
// MAIN FUNCTION
// ============================================
function normalizeStone(value) {
  if (!value) return null;

  const v = value.toString().trim().toLowerCase();

  if (
    v === "" ||
    v === "aucune" ||
    v === "aucune pierre" ||
    v === "sans pierre"
  ) {
    return null;
  }

  return v;
}

export async function loadProductsCSV() {
    console.log("Load products from CSV");

    try {
        const response = await fetch(CONFIG.csvUrl, {
            headers: { 'Cache-Control': 'no-cache' }
        });

        if (!response.ok) throw new Error("HTTP " + response.status);

        const csvText = await response.text();
        const rawProducts = parseCSV(csvText);

        console.log("Parsed:", rawProducts.length, "rows");

        const processedProducts = processProducts(rawProducts);
        const normalizedProducts = processedProducts.map(normalizeProduct);

        console.log("Processed:", normalizedProducts.length, "products");
        return normalizedProducts;

    } catch (err) {
        console.error("CSV ERROR:", err);
        return [];
    }
}

// ============================================
// CSV PARSER
// ============================================

function parseLine(line, delimiter) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(l => l.trim() !== '');
    if (lines.length < 2) return [];

    const headers = parseLine(lines[0], ';').map(h =>
        h.trim()
         .toLowerCase()
         .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
         .replace(/\s+/g, '_')
    );

    const products = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i], ';');
        const obj = {};

        headers.forEach((h, index) => {
            let v = values[index] ? values[index].trim() : '';
            if (h === "reference") v = v.replace(/\s+/g, '');
            obj[h] = v;
        });

        if (obj.reference) products.push(obj);
    }

    return products;
}

// ============================================
// CLOUDINARY
// ============================================

function imgUrl(reference) {
    return CONFIG.getCloudinaryUrl(reference);
}

// ============================================
// PROCESS NORMALIZED PRODUCT
// ============================================

function processProducts(list) {
    return list.map(p => {
        const sizes = parseSizes(p.tailles_disponibles);
        const stockSize = parseStockBySize(p.tailles_disponibles, p.quantite__par__taille);

        return {
            // identifiers
            id: p.reference,
            reference: p.reference,
            sku: p.reference,

            // main text
            title: p.titre || "",
            name: p.titre || "",
            description: p.description || "",

            // classification
            category: "bijoux",
            type: p.type_de_bijoux,

            // metal
            metal: "or",
            metal_color: p.couleur || "",
            metal_weight: normalizeFloat(p.poids_or),
            carat: "9",

            // stones
            stone_type: normalizeStone(p.type_de_pierres),
            stone_weight: normalizeFloat(p.poids_pierre),
            has_stone:
                p.type_de_pierres &&
                p.type_de_pierres.toLowerCase() !== "aucune",

            // prices
            price: normalizeFloat(p.price_euros),
            stock: parseInt(p.stock) || 0,

            // sizes
            available_sizes: sizes,
            stock_by_size: stockSize,
            default_size: getDefaultSize(p.tailles_disponibles),

            // fabrication
            custom_made: p.fabrication_possible === "OUI",
            fabrication_possible: p.fabrication_possible === "OUI",

            // events
            events: parseEvents(p.evenement),
            primary_event: getPrimaryEvent(p.evenement),

            // images
            image: imgUrl(p.reference),
            images: [imgUrl(p.reference)]
        };
    });
}

// ============================================
// HELPERS
// ============================================

function normalizeFloat(txt) {
    if (!txt) return 0;
    return parseFloat(txt.replace(',', '.')) || 0;
}

function parseSizes(str) {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
}

function parseStockBySize(sizeStr, stockStr) {
    if (!sizeStr || !stockStr) return {};

    const sizes = parseSizes(sizeStr);
    const stockList = stockStr.split(',').map(s => parseInt(s.trim()) || 0);

    const out = {};
    sizes.forEach((s, i) => out[s] = stockList[i] ?? 0);
    return out;
}

function getDefaultSize(s) {
    const arr = parseSizes(s);
    if (!arr.length) return "unique";
    const nums = arr.filter(v => !isNaN(v));
    return nums.length ? nums.sort((a,b)=>a-b)[0] : arr[0];
}

function parseEvents(str) {
    if (!str) return [];
    return str.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

function getPrimaryEvent(str) {
    const e = parseEvents(str);
    return e[0] || "general";
}