// assets/js/modals/modals.js
// Global modal hub EV1 (stable)

import { ProductModal } from "./modalView.js";
import { FabricationModal } from "./modalFabrication.js";

const productModal = new ProductModal();
const fabricationModal = new FabricationModal();

let productMap = new Map();

// --------------------------------------------
// Init with products list (from CSV loader)
// --------------------------------------------
export function initModals(products) {

    if (!products || !Array.isArray(products)) {
        console.error("initModals: invalid product array");
        return;
    }

    productMap.clear();

    products.forEach(p => {
        const ref =
            p.reference ||
            p.REFERENCE ||
            p.ref ||
            "";

        if (ref) productMap.set(ref.trim(), p);
    });

    bindViewButtons();
    bindFabricationButtons();

    console.log("Modals ready:", productMap.size, "products indexed");
}


// --------------------------------------------
// 1. Product details buttons
// --------------------------------------------
function bindViewButtons() {

    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".view-btn");
        if (!btn) return;

        const ref = btn.dataset.ref;
        if (!ref) return console.warn("view-btn missing data-ref");

        const product = productMap.get(ref);
        if (!product) return console.warn("Unknown product ref:", ref);

        openProductModal(product);
    });
}


// --------------------------------------------
// 2. Custom fabrication buttons
// --------------------------------------------
function bindFabricationButtons() {

    document.addEventListener("click", (e) => {

        // FIX: match modalView.js class exactly
        const btn = e.target.closest(".modal-fabrication-btn");
        if (!btn) return;

        const ref = btn.dataset.ref;
        if (!ref) return console.warn("fabrication-btn missing data-ref");

        const product = productMap.get(ref);
        if (!product) return console.warn("Unknown product ref:", ref);

        openFabricationModal(product);
    });
}


// --------------------------------------------
// Public API
// --------------------------------------------
export function openProductModal(product) {
    productModal.open(product);
}

export function openFabricationModal(product) {
    fabricationModal.showFabricationInfo(product);
}


// --------------------------------------------
// Global expose (optional)
// --------------------------------------------
window.openProductModal = openProductModal;
window.openFabricationModal = openFabricationModal;

console.log("modals.js loaded");