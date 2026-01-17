// ===========================================================
// modals.js - Correction
// ===========================================================

import { ProductModal } from "./modalView.js";
import { FabricationModal } from "./modalFabrication.js";

// Déclarez les variables en tant que propriétés d'un objet exporté
export const modalInstances = {
    productModal: null,
    fabricationModal: null
};

// Map de produits
const productMap = new Map();
window.__productMap = productMap;

function buildProductMap(products) {
    // ... votre code existant
}

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

            // Utilisez l'instance exportée
            modalInstances.productModal.open(product);
        });
    });
}

function attachFabricationButtons() {
    // ... utilisez modalInstances.fabricationModal
}

export function initModals(products) {
    console.log("initModals: starting with", products.length, "products");

    // 1. Build reference map
    buildProductMap(products);

    // 2. Create modal instances ET les assigner à l'objet exporté
    modalInstances.productModal = new ProductModal("product-modal");
    modalInstances.fabricationModal = new FabricationModal("fabrication-modal");
    
    // 3. Exposez également sur window pour débogage
    window.productModal = modalInstances.productModal;
    window.fabricationModal = modalInstances.fabricationModal;
    console.log("Instances exposées sur window");

    // 4. Attach action buttons
    attachProductButtons();
    attachFabricationButtons();

    console.log("Modals ready: indexed products =", productMap.size);
    
    return modalInstances;
}