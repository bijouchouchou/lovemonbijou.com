// ===========================================================
// modals.js — EV1 FINAL STABLE
// Central hub for ProductModal & FabricationModal
// ===========================================================

import { ProductModal } from "./modalView.js";
import { FabricationModal } from "./modalFabrication.js";

console.log("modals.js loaded");

// ===========================================================
// INTERNAL STATE
// ===========================================================

// Product index
const productMap = new Map();

// Modal instances (module scope)
let productModal = null;
let fabricationModal = null;

// ===========================================================
// Build product map
// ===========================================================
function buildProductMap(products) {
    productMap.clear();

    products.forEach((p) => {
        if (!p) return;

        const keys = [
            p.reference,
            p.REFERENCE,
            p.Ref,
            p.id,
            p.sku
        ];

        keys.forEach((k) => {
            if (!k) return;
            const key = String(k).trim();
            if (!productMap.has(key)) {
                productMap.set(key, p);
            }
        });
    });

    console.log("Modals: indexed products =", productMap.size);
}

// ===========================================================
// Attach product view buttons
// ===========================================================
function attachProductButtons() {
    console.log("Modals: attaching .view-btn listeners");

    const buttons = document.querySelectorAll(".view-btn");
    console.log("View buttons found =", buttons.length);

    buttons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const rawRef = btn.dataset.ref;
            console.log("CLICK view-btn ref =", rawRef);

            if (!rawRef) {
                console.error("Missing data-ref on view button");
                return;
            }

            const ref = rawRef.trim();
            const product = productMap.get(ref);

            if (!product) {
                console.error("Product not found for ref =", ref);
                return;
            }

            if (!productModal) {
                console.error("productModal not initialized");
                return;
            }

            productModal.showProduct(product);
        });
    });

    console.log("Modals: listeners attached to", buttons.length, "view buttons");
}

// ===========================================================
// Attach fabrication buttons (outside modal)
// ===========================================================
function attachFabricationButtons() {
    const buttons = document.querySelectorAll(".fabrication-btn");
    console.log("Fabrication buttons found =", buttons.length);

    buttons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const rawRef = btn.dataset.ref;
            if (!rawRef) {
                console.error("Missing data-ref on fabrication button");
                return;
            }

            const ref = rawRef.trim();
            const product = productMap.get(ref);

            if (!product) {
                console.error("Fabrication product not found for ref =", ref);
                return;
            }

            if (!fabricationModal) {
                console.error("fabricationModal not initialized");
                return;
            }

            fabricationModal.open(product);
        });
    });
}

// ===========================================================
// PUBLIC INIT — called from main.js
// ===========================================================
export function initModals(products) {
    console.log("initModals: starting with", products.length, "products");

    // 1. Index products
    buildProductMap(products);

    // 2. Create modal instances
    productModal = new ProductModal("product-modal");
    fabricationModal = new FabricationModal("fabrication-modal");

    // 3. Expose globals (EV1 — deliberate & controlled)
    window.productModal = productModal;
    window.fabricationModal = fabricationModal;

    window.openProductModal = (product) =>
        productModal && productModal.showProduct(product);

    window.openFabricationModal = (product) =>
        fabricationModal && fabricationModal.open(product);

    // 4. Attach buttons
    attachProductButtons();
    attachFabricationButtons();

    console.log("Modals ready ✔");
}