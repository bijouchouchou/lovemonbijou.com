// assets/js/modals/modalView.js
import { ModalBase } from "./modalBase.js";
import CONFIG from "../core/config.js";

/* ======================================================
  HELPERS
====================================================== */

function safe(v) {
  return v != null ? String(v).trim() : "";
}

function safeNumber(v) {
  if (v == null || v === "") return 0;
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function formatPriceEUR(p) {
  const n = safeNumber(p);
  return n.toFixed(2).replace(".", ",") + " €";
}

function formatStoneWeightCt(raw) {
  const n = safeNumber(raw);
  if (!n) return "";
  return n.toFixed(3) + " ct";
}

function formatMetalWeight(raw) {
  const n = safeNumber(raw);
  if (!n) return "";
  return n.toFixed(2) + " g";
}

function parseSizes(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseStockBySize(sizesRaw, stocksRaw) {
  const sizes = parseSizes(sizesRaw);
  const out = {};

  if (!stocksRaw) {
    sizes.forEach((s) => (out[s] = null));
    return out;
  }

  const stocks = String(stocksRaw)
    .split(",")
    .map((x) => parseInt(x.trim(), 10) || 0);

  sizes.forEach((s, i) => {
    out[s] = stocks[i] ?? 0;
  });

  return out;
}

function getImageUrl(product) {
  const ref =
    safe(product.reference) ||
    safe(product.REFERENCE) ||
    safe(product.id);

  return ref ? CONFIG.getCloudinaryUrl(ref) : CONFIG.placeholder;
}

/* ======================================================
  PRODUCT MODAL — HYBRIDE AMÉLIORÉE
====================================================== */

export class ProductModal extends ModalBase {
  constructor(modalId = "product-modal") {
    super(modalId);
    console.log("ProductModal initialisé :", modalId);
  }

  /* -----------------------------
     PUBLIC
  ----------------------------- */

  showProduct(product) {
    if (!product) {
      console.error("ProductModal: produit null");
      return;
    }

    try {
      const data = this.extractProductData(product);
      const html = this.render(data);

      this.setContent(html);
      this.open();
      this.bindProductEvents(product);

    } catch (err) {
      console.error("Erreur ProductModal:", err);
      this.showError();
    }
  }

  /* -----------------------------
     DATA
  ----------------------------- */

  extractProductData(product) {
    const ref = product["REFERENCE"] || product.id;

    const title = product["title"] || "Bijou en or";

    const titrage = product["TITRE"]; // 9, 18, etc.

    const metalWeightRaw = product["POIDS OR"];
    const stoneWeightRaw = product["Poids pierre"];

    const sizesRaw = product["tailles disponibles"];
    const stockRaw = product["quantité_ par_ taille"];

    return {
      ref,
      titleLabel: title,

      // Titrage
      titrage,

      // Poids
      metal_weight: formatMetalWeight(metalWeightRaw),
      stone_weight: safeNumber(stoneWeightRaw),

      // Pierre
      stone_type: product["type de pierres"] || "",

      // Description
      desc: product["description"] || "",
      type: product["type de bijoux"] || "",

      // Couleur
      colorLabel: product["couleur"] || "",

      // Prix
      price: safeNumber(product.price_euros),

      // Tailles
      available_sizes: parseSizes(sizesRaw),
      stock_by_size: parseStockBySize(sizesRaw, stockRaw),

      // Events
      events: (product.evenement || "")
        .split(",")
        .map(e => e.trim())
        .filter(Boolean),

      image: getImageUrl(product),

      fabrication_possible: product.fabrication_possible === "OUI"
    };
  }

  /* -----------------------------
     RENDER — VERSION SIMPLIFIÉE ET ROBUSTE
  ----------------------------- */

  render(p) {
    const sizes = p.available_sizes || [];
    const stockBySize = p.stock_by_size || {};

    const sizeOptions = sizes.map(size => {
      const qty = stockBySize[size] ?? 0;
      const disabled = qty <= 0;
      return `
        <option value="${size}" ${disabled ? "disabled" : ""}>
          ${size}${disabled ? " (épuisé)" : ""}
        </option>
      `;
    }).join("");

    return `
      <div class="modal-grid">
        <div class="modal-images">
          <img class="main-img"
               src="${p.image}"
               alt="${p.titleLabel || "Bijou"}"
               onerror="this.src='${CONFIG.placeholder}'">
        </div>

        <div class="modal-info">
          <h2>${p.titleLabel || "Bijou"}</h2>
          <div class="price">${formatPriceEUR(p.price)}</div>
          <p><strong>Type :</strong> ${p.type || "—"}</p>
          <p>
            <strong>Pierre :</strong>
            ${p.stone_type || "Sans pierre"}
            ${p.stone_weight > 0
              ? ` • ${p.stone_weight.toFixed(3)} ct`
              : ""}
          </p>
          <p><strong>Poids or :</strong> ${p.metal_weight ? p.metal_weight : "—"}</p>
          <p><strong>Couleur :</strong> ${p.colorLabel || "—"}</p>

          ${sizes.length
            ? `
              <div class="sizes-area">
                <label for="modal-size-select">Taille</label>
                <select id="modal-size-select">
                  <option value="">Choisir</option>
                  ${sizeOptions}
                </select>
              </div>
            `
            : `<p>Taille unique</p>`
          }

          <div class="modal-actions">
            <button id="modal-add-cart-btn">
              Ajouter au panier
            </button>

            ${p.fabrication_possible
              ? `<button id="modal-custom-btn">Sur mesure</button>`
              : ""
            }
          </div>
        </div>
      </div>
    `;
  }

  /* -----------------------------
     EVENTS — VERSION COMPLÈTE ET SÉCURISÉE
  ----------------------------- */

  bindProductEvents(product) {
    const addBtn = document.getElementById("modal-add-cart-btn");
    const sizeSelect = document.getElementById("modal-size-select");
    const customBtn = document.getElementById("modal-custom-btn");

    if (addBtn) {
      addBtn.addEventListener("click", () => {
        let chosenSize = null;

        if (sizeSelect) {
          chosenSize = sizeSelect.value;
          if (!chosenSize) {
            alert("Veuillez choisir une taille");
            return;
          }
        }

        const item = { ...product };
        if (chosenSize) item.__size = chosenSize;

        if (window.addToCart) {
          window.addToCart(product.id, item);
        }

        this.close();
      });
    }

    if (customBtn) {
      customBtn.addEventListener("click", () => {
        if (window.openFabricationModal) {
          window.openFabricationModal(product);
        }
        this.close();
      });
    }
  }

  showError() {
    this.setContent("<p>Produit indisponible.</p>");
    this.open();
  }
}

console.log("modalView.js chargé (EV1 stable hybride)");