// ===========================================================
// modals.js — EV1 FINAL STABLE (SECURED)
// Central hub for ProductModal & FabricationModal
// ===========================================================

import { ProductModal } from "./modalView.js";
import { FabricationModal } from "./modalFabrication.js";

console.log("modals.js loaded");

// ===========================================================
// INTERNAL STATE
// ===========================================================
const productMap = new Map();

let productModal = null;
let fabricationModal = null;
let listenersAttached = false;

// ===========================================================
// BUILD PRODUCT MAP
// ===========================================================
function buildProductMap(products) {
  productMap.clear();

  products.forEach((p) => {
    if (!p) return;

    [
      p.reference,
      p.REFERENCE,
      p.Ref,
      p.id,
      p.sku
    ]
      .filter(Boolean)
      .forEach((k) => {
        const key = String(k).trim();
        if (!productMap.has(key)) {
          productMap.set(key, p);
        }
      });
  });

  console.log("Modals: indexed products =", productMap.size);
}

// ===========================================================
// EVENT DELEGATION (ONE TIME ONLY)
// ===========================================================
function attachDelegatedListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  console.log("Modals: attaching delegated listeners");

  document.addEventListener("click", (e) => {
    const viewBtn = e.target.closest(".view-btn");
    const fabBtn = e.target.closest(".fabrication-btn");

    if (!viewBtn && !fabBtn) return;

    // Ne jamais bloquer un lien réel
    if (e.target.closest("a[href]")) return;

    e.preventDefault();
    e.stopPropagation();

    const btn = viewBtn || fabBtn;
    const ref = btn.dataset.ref?.trim();

    if (!ref) {
      console.error("Missing data-ref on modal button");
      return;
    }

    const product = productMap.get(ref);
    if (!product) {
      console.error("Product not found for ref =", ref);
      return;
    }

    if (viewBtn) {
      if (!productModal) {
        console.error("productModal not initialized");
        return;
      }
      productModal.showProduct(product);
    }

    if (fabBtn) {
      if (!fabricationModal) {
        console.error("fabricationModal not initialized");
        return;
      }
      fabricationModal.showFabricationInfo(product);
    }
  });

  console.log("Modals: delegated listeners ready");
}

// ===========================================================
// PUBLIC INIT
// ===========================================================
export function initModals(products) {
  if (!Array.isArray(products)) {
    console.error("initModals: invalid products array");
    return;
  }

  console.log("initModals: starting with", products.length, "products");

  buildProductMap(products);

  if (!productModal) {
    productModal = new ProductModal("product-modal");
  }

  if (!fabricationModal) {
    fabricationModal = new FabricationModal();
  }

  // Debug / backward compatibility
  window.productModal = productModal;
  window.fabricationModal = fabricationModal;

  window.openProductModal = (product) =>
    productModal?.showProduct(product);

  window.openFabricationModal = (product) =>
    fabricationModal?.showFabricationInfo(product);

  attachDelegatedListeners();
}
