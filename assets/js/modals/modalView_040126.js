// ============================================
// MODAL VIEW — PRODUIT (EV1 STABLE)
// ============================================

import { ModalBase } from "./modalBase.js";
import CONFIG from "../core/config.js";
import { formatPrice } from "../core/utils.js";

export class ProductModal extends ModalBase {
  constructor(id = "product-modal") {
    super(id);
    console.log("ProductModal prêt :", id);
  }

  // ======================================================
  // API PUBLIQUE
  // ======================================================
  showProduct(product) {
    if (!product || !product.id) {
      console.error("ProductModal.showProduct : produit invalide", product);
      return;
    }

    this.setContent(this.render(product));
    this.open();
    this.bindEvents(product);
  }

  // ======================================================
  // RENDER HTML
  // ======================================================
    render(p) {
    const reference =
    p.reference ||
    p.REFERENCE ||
    p.Ref ||
    p.id ||
    "—";

      const sizes = Array.isArray(p.available_sizes) ? p.available_sizes : [];

    const sizeOptions = sizes.map(size => {
      const qty = p.stock_by_size?.[size] ?? 0;
      const disabled = qty <= 0;
      return `
        <option value="${size}" ${disabled ? "disabled" : ""}>
          ${size}${disabled ? " (épuisé)" : ""}
        </option>
      `;
    }).join("");

    return `
      <div class="modal-product-grid">

        <!-- IMAGE -->
        <div class="modal-left">
          <img
            src="${p.image}"
            alt="${p.titleLabel}"
            onerror="this.src='${CONFIG.placeholder}'"
          />
        </div>

        <!-- INFOS -->
        <div class="modal-right">
          <h2 class="modal-title">${p.titleLabel}</h2>
          <div class="modal-price">${formatPrice(p.price)}</div>

          <ul class="modal-details">
  <li><strong>Référence :</strong> ${reference}</li>
  <li><strong>Type :</strong> ${p.type || "—"}</li>

  <li>
    <strong>Pierre :</strong>
    ${p.has_stone ? p.stone_type : "Sans pierre"}
    ${p.has_stone && p.stone_weight
      ? ` • ${p.stone_weight.toFixed(3)} ct`
      : ""}
  </li>

  <li>
    <strong>Poids or :</strong>
    ${p.metal_weight ? `${p.metal_weight.toFixed(2)} g` : "—"}
  </li>

  <li>
    <strong>Couleur :</strong>
    ${p.colorLabel || "—"}
  </li>

  ${
    p.carat
      ? `<li><strong>Titrage :</strong> ${p.carat}k</li>`
      : ""
  }
</ul>

          <!-- TAILLES -->
          ${
            sizes.length
              ? `
                <div class="modal-sizes">
                  <label for="modal-size-select">Taille</label>
                  <select id="modal-size-select">
                    <option value="">Choisir</option>
                    ${sizeOptions}
                  </select>
                </div>
              `
              : `<p><strong>Taille :</strong> Unique</p>`
          }

          <!-- ACTIONS -->
          <div class="modal-actions">
            <button id="modal-add-cart-btn" class="modal-add-cart">
              Ajouter au panier
            </button>

            ${
              p.fabrication_possible
  ? `<button class="fabrication-btn" data-ref="${p.reference}">Sur mesure</button>`
  : ""
            }
          </div>
        </div>
      </div>
    `;
  }

  // ======================================================
  // EVENTS
  // ======================================================
  bindEvents(product) {
    const addBtn = document.getElementById("modal-add-cart-btn");
    const sizeSelect = document.getElementById("modal-size-select");
    const customBtn = document.querySelector(".fabrication-btn");


    // --- Ajouter au panier ---
if (addBtn) {
  addBtn.addEventListener("click", () => {
    let chosenSize = "unique";

    if (sizeSelect) {
      chosenSize = sizeSelect.value;
      if (!chosenSize) {
        alert("Veuillez choisir une taille");
        return;
      }
    }

    if (window.addToCart) {
      window.addToCart({
        ...product,
        size: chosenSize   // 🔴 LA LIGNE CLÉ
      }, 1);
    }

    this.close();
  });
}

    // --- Sur mesure ---
if (customBtn) {
  customBtn.addEventListener("click", () => {
    if (window.openFabricationModal) {
      window.openFabricationModal(product);
    }
    this.close();
  });
}
  }
}

console.log("modalView.js — EV1 chargé");