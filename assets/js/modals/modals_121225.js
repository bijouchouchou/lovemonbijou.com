// ===========================================================
// modals.js - EV1 Stable Version (FIXED)
// Central modal hub for ProductModal and FabricationModal
// ===========================================================

import { ProductModal } from "./modalView.js";
import { FabricationModal } from "./modalFabrication.js";

console.log("modals.js loaded");

// ===========================================================
// INTERNAL STATE
// ===========================================================

// Map of all products indexed by reference/id
const productMap = new Map();
window.__productMap = productMap; // debug helper

// Modal instances
let productModal = null;
let fabricationModal = null;

// ===========================================================
// Build product map (called once)
// ===========================================================
function buildProductMap(products) {
    productMap.clear();

    products.forEach((p) => {
        if (!p) return;

        const keys = [];

        if (p.reference) keys.push(p.reference);
        if (p.Ref) keys.push(p.Ref);
        if (p.id) keys.push(p.id);
        if (p.sku) keys.push(p.sku);

        keys.forEach((k) => {
            if (k && !productMap.has(k)) {
                productMap.set(k, p);
            }
        });
    });

    console.log("Modals: indexed products:", productMap.size);
}

// ===========================================================
// Attach listeners to view buttons
// ===========================================================
function attachProductButtons() {
    console.log("Modals: attaching .view-btn listeners");

    const buttons = document.querySelectorAll(".view-btn");

    buttons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const ref = btn.dataset.ref;
            console.log("CLICK: view-btn -> ref =", ref);

            if (!ref) {
                console.error("Missing data-ref on button");
                return;
            }

            const product = productMap.get(ref);

            if (!product) {
                console.error("ProductModal: product null for ref", ref);
                return;
            }

            // ✅ APPEL CORRECT
            productModal.showProduct(product);
        });
    });

    console.log("Modals: listeners attached to", buttons.length, "buttons");
}

// ===========================================================
// Attach listeners for "fabrication" buttons
// ===========================================================
function attachFabricationButtons() {
    const buttons = document.querySelectorAll(".fabrication-btn");
    console.log("Modals: attaching fabrication buttons:", buttons.length);

    buttons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const ref = btn.dataset.ref;
            if (!ref) {
                console.error("Missing data-ref on fabrication button");
                return;
            }

            const product = productMap.get(ref);

            if (!product) {
                console.error("FabricationModal: product null for ref", ref);
                return;
            }

            fabricationModal.open(product);
        });
    });
}

// ===========================================================
// Main init function called from main.js
// ===========================================================
export function initModals(products) {
    console.log("initModals: starting with", products.length, "products");

    // 1. Build reference map
    buildProductMap(products);

    // 2. Create modal instances
    productModal = new ProductModal("product-modal");
    fabricationModal = new FabricationModal("fabrication-modal");

    // 3. Attach action buttons
    attachProductButtons();
    attachFabricationButtons();

    console.log("Modals ready: indexed products =", productMap.size);
}