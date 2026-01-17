// assets/js/modals/modals.js - EV1 HUB PRODUITS
// - indexe les produits par référence
// - connecte les boutons "Détails" / "Sur mesure"
// - délègue l’affichage à ProductModal et FabricationModal

import { ProductModal } from "./modalView.js";
import { FabricationModal } from "./modalFabrication.js";

// ===============================
// INSTANCES DE MODALES
// ===============================
const productModal     = new ProductModal("product-modal");
const fabricationModal = new FabricationModal("fabrication-modal");

// Map de tous les produits indexés par référence / id / sku, etc.
const productMap = new Map();
// 👉 pour debug dans la console
window.__productMap = productMap;

// ===============================
// OUTIL : NORMALISATION DES CLÉS
// ===============================
function normalizeKey(value) {
    if (!value) return "";
    return value.toString().trim();
}

// on accepte plusieurs variantes pour être TRES tolérant
function addKeyForProduct(key, product) {
    const k = normalizeKey(key);
    if (!k) return;
    productMap.set(k, product);
    productMap.set(k.toUpperCase(), product);
    productMap.set(k.toLowerCase(), product);
}

// ===============================
// INDEXATION DES PRODUITS
// ===============================
function indexProducts(products) {
    productMap.clear();

    if (!Array.isArray(products)) {
        console.error("initModals: products n’est pas un tableau", products);
        return;
    }

    products.forEach((p) => {
        if (!p) return;

        const candidates = [
            p.reference,
            p.REFERENCE,
            p.ref,
            p.Ref,
            p.id,
            p.sku
        ];

        const uniques = [...new Set(candidates.filter(Boolean))];

        uniques.forEach((key) => addKeyForProduct(key, p));
    });

    console.log("Modals: produits indexés :", productMap.size);
}

// ===============================
// RECHERCHE D’UN PRODUIT
// ===============================
function findProduct(refOrProduct) {
    // on nous donne déjà un objet ?
    if (refOrProduct && typeof refOrProduct === "object") {
        return refOrProduct;
    }

    const raw = refOrProduct;
    const key = normalizeKey(raw);
    if (!key) return null;

    const direct =
        productMap.get(key) ||
        productMap.get(key.toUpperCase()) ||
        productMap.get(key.toLowerCase());

    if (!direct) {
        console.warn(
            "[modals] Produit introuvable pour ref =",
            raw,
            " — clés présentes (extrait) :",
            Array.from(productMap.keys()).slice(0, 10)
        );
    }

    return direct || null;
}

// ===============================
// OUVERTURE DES MODALES
// ===============================
export function openProductModal(refOrProduct) {
    const product = findProduct(refOrProduct);
    if (!product) {
        console.error("openProductModal: produit null pour", refOrProduct);
        return;
    }
    productModal.showProduct(product);
}

export function openFabricationModal(refOrProduct) {
    const product = findProduct(refOrProduct);
    if (!product) {
        console.error("openFabricationModal: produit null pour", refOrProduct);
        return;
    }
    fabricationModal.showFabricationInfo(product);
}

// Expose sur window pour appels manuels (debug, autres scripts)
window.openProductModal = openProductModal;
window.openFabricationModal = openFabricationModal;

// ===============================
// BIND DES BOUTONS
// ===============================
function bindViewButtons() {
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".view-btn");
        if (!btn) return;

        const ref =
            btn.dataset.ref ||
            btn.getAttribute("data-ref") ||
            "";

        // DEBUG rapide si besoin
        // console.log("click view-btn ref =", ref);

        openProductModal(ref);
    });
}

function bindFabricationButtons() {
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".fabrication-btn, .sur-mesure-btn");
        if (!btn) return;

        const ref =
            btn.dataset.ref ||
            btn.getAttribute("data-ref") ||
            "";

        openFabricationModal(ref);
    });
}

// ===============================
// INIT PRINCIPALE APPELÉE PAR main.js
// ===============================
export function initModals(products) {
    console.log("initModals: démarrage avec", products?.length, "produits");

    indexProducts(products);
    bindViewButtons();
    bindFabricationButtons();

    console.log("Modals prêtes :",
        "produits indexés =", productMap.size
    );
}

console.log("modals.js EV1 hub chargé");
