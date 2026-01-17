// assets/js/modals/modals.js
// Global modal hub - EV1 version
// Connects display buttons -> modalView -> modalFabrication

import { ProductModal } from './modalView.js';
import { FabricationModal } from './modalFabrication.js';

// Keep one instance of each modal
const productModal = new ProductModal();
const fabricationModal = new FabricationModal();

// Product map for fast lookup by REFERENCE
let productMap = new Map();

// Initialize modal hub
export function initModals(products) {
    if (!products || !Array.isArray(products)) {
        console.error("initModals: invalid product array");
        return;
    }

    // Build reference map
    productMap.clear();
    for (const p of products) {
        const ref =
            p.REFERENCE ||
            p.reference ||
            p.Ref ||
            p.ref;

        if (ref) {
            productMap.set(ref.trim(), p);
        }
    }

    // Attach event listeners globally
    bindViewButtons();
    bindFabricationButtons();

    console.log("Modals: ready. Products indexed:", productMap.size);
}

/* ---------------------------------------------------
   Bind events for product view buttons
--------------------------------------------------- */
function bindViewButtons() {
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".view-btn");
        if (!btn) return;

        const ref = btn.getAttribute("data-ref");
        if (!ref) {
            console.warn("view-btn clicked but no data-ref");
            return;
        }

        const product = productMap.get(ref);
        if (!product) {
            console.warn("No product found for ref", ref);
            return;
        }

        openProductModal(product);
    });
}

/* ---------------------------------------------------
   Bind events for fabrication buttons
--------------------------------------------------- */
function bindFabricationButtons() {
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".fabrication-btn");
        if (!btn) return;

        const ref = btn.getAttribute("data-ref");
        if (!ref) {
            console.warn("fabrication-btn clicked but no data-ref");
            return;
        }

        const product = productMap.get(ref);
        if (!product) {
            console.warn("No product found for ref", ref);
            return;
        }

        openFabricationModal(product);
    });
}

/* ---------------------------------------------------
   Public modal opening helpers
--------------------------------------------------- */

// Called by display.js and modalView.js
export function openProductModal(product) {
    productModal.openProduct(product);
}

// Called by modalView.js
export function openFabricationModal(product) {
    fabricationModal.showFabricationInfo(product);
}

/* ---------------------------------------------------
   Expose globally (optional but useful)
--------------------------------------------------- */
window.openProductModal = openProductModal;
window.openFabricationModal = openFabricationModal;

console.log("modals.js loaded");
