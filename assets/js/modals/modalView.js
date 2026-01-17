// ============================================
// MODAL VIEW — PRODUIT (EV1 STABLE & EVENT-DRIVEN)
// ============================================

import { ModalBase } from "./modalBase.js";
import CONFIG from "../core/config.js";
import { formatPrice } from "../core/utils.js";
import { eventsBus, EVENTS } from "../core/eventsBus.js";

export class ProductModal extends ModalBase {
  constructor(id = "product-modal") {
    super(id);
    this.bound = false;
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

    this.currentProduct = product;

    this.setContent(this.render(product));
    this.open();
    this.bindEvents();
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

    const sizeOptions = sizes
      .map((size) => {
        const qty = p.stock_by_size?.[size] ?? 0;
        const disabled = qty <= 0;
        return `
          <option value="${size}" ${disabled ? "disabled" : ""}>
            ${size}${disabled ? " (épuisé)" : ""}
          </option>
        `;
      })
      .join("");

    return `
      <div class="modal-product-grid">

        <div class="modal-left">
          <img
            src="${p.image}"
            alt="${p.titleLabel}"
            onerror="this.src='${CONFIG.placeholder}'"
          />
        </div>

        <div class="modal-right">
          <h2 class="modal-title">${p.titleLabel}</h2>
          <div class="modal-price">${formatPrice(p.price)}</div>

          <ul class="modal-details">
            <li><strong>Référence :</strong> ${reference}</li>
            <li><strong>Type :</strong> ${p.type || "—"}</li>

            <li>
              <strong>Pierre :</strong>
              ${p.has_stone ? p.stone_type : "Sans pierre"}
              ${
                p.has_stone && p.stone_weight
                  ? ` • ${p.stone_weight.toFixed(3)} ct`
                  : ""
              }
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

          <div class="modal-actions">
            <button id="modal-add-cart-btn" class="modal-add-cart">
              Ajouter au panier
            </button>

            ${
              p.fabrication_possible
                ? `<button class="fabrication-btn">Sur mesure</button>`
                : ""
            }
          </div>
        </div>
      </div>
    `;
  }

  // ======================================================
  // EVENTS (SAFE — NO DUPLICATES)
  // ======================================================
  bindEvents() {
    if (this.bound) return;
    this.bound = true;

    this.modal.addEventListener("click", (e) => {
      const addBtn = e.target.closest("#modal-add-cart-btn");
      const fabBtn = e.target.closest(".fabrication-btn");

      if (!addBtn && !fabBtn) return;

      e.preventDefault();
      e.stopPropagation();

      // ---- AJOUT PANIER
      if (addBtn) {
        let chosenSize = "unique";
        const sizeSelect = this.modal.querySelector("#modal-size-select");

        if (sizeSelect) {
          chosenSize = sizeSelect.value;
          if (!chosenSize) {
            alert("Veuillez choisir une taille");
            return;
          }
        }

        eventsBus.emit(
          EVENTS.PRODUCT_ADD_TO_CART,
          {
            product: {
              ...this.currentProduct,
              size: chosenSize
            },
            quantity: 1
          },
          "ProductModal"
        );

        this.close();
        return;
      }

      // ---- FABRICATION
      if (fabBtn) {
        eventsBus.emit(
          EVENTS.PRODUCT_VIEWED,
          { product: this.currentProduct },
          "ProductModal"
        );

        this.close();
      }
    });
  }
}

console.log("modalView.js — EV1 stable chargé");
