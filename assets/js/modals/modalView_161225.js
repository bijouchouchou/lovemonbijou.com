// assets/js/modals/modalView.js
import { ModalBase } from "./modalBase.js";
import CONFIG from "../core/config.js";

/* ======================================================
   Helpers (robustes)
====================================================== */
function safeStr(v) {
  return v == null ? "" : String(v).trim();
}

function toNumber(v) {
  if (v == null || v === "") return 0;
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function formatEUR(v) {
  const n = toNumber(v);
  return n.toFixed(2).replace(".", ",") + " €";
}

function formatGram(v) {
  const n = toNumber(v);
  return n > 0 ? n.toFixed(2) + " g" : "";
}

function formatCt(v) {
  const n = toNumber(v);
  return n > 0 ? n.toFixed(3) + " ct" : "";
}

function parseSizes(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(Boolean);
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// accepte objet {48:1,...} ou chaine CSV "1,1,0"
function parseStockBySize(sizesRaw, stocksRaw) {
  const sizes = parseSizes(sizesRaw);
  if (!sizes.length) return {};

  if (stocksRaw && typeof stocksRaw === "object" && !Array.isArray(stocksRaw)) {
    return stocksRaw;
  }

  const out = {};
  if (!stocksRaw) {
    sizes.forEach((s) => (out[s] = 0));
    return out;
  }

  const stocks = String(stocksRaw)
    .split(",")
    .map((x) => parseInt(x.trim(), 10) || 0);

  sizes.forEach((s, i) => (out[s] = stocks[i] ?? 0));
  return out;
}

function getId(p) {
  return safeStr(p?.id || p?.reference || p?.REFERENCE || p?.ref);
}

function getImage(p) {
  // si déjà normalisé
  if (p?.image) return p.image;

  const id = getId(p);
  if (!id) return CONFIG.placeholder;
  return CONFIG.getCloudinaryUrl(id);
}

/**
 * Normalisation locale MINIMALE :
 * - si l’objet est déjà normalisé (stone_type, metal_weight, available_sizes, etc.) => on garde
 * - sinon on essaie les clés CSV FR
 */
function normalizeForModal(p) {
  const id = getId(p);
  if (!id) return null;

  const type = safeStr(p.type || p["type de bijoux"] || p.type_de_bijoux);
  const titleLabel = safeStr(p.titleLabel || p.title || p.titre || p.name || "Bijou");

  const stoneType = safeStr(p.stone_type || p["type de pierres"] || p.type_de_pierres);
  const stoneWeight = toNumber(p.stone_weight || p["Poids pierre"] || p.poids_pierre);

  const metalWeight = toNumber(p.metal_weight || p["POIDS OR"] || p.poids_or);
  const colorLabel = safeStr(p.colorLabel || p.couleur || p.metal_color || p["couleur"]);

  const price = toNumber(p.price || p.price_euros || p.PRIX);

  const sizesRaw = p.available_sizes || p["tailles disponibles"] || p.tailles_disponibles;
  const stockRaw = p.stock_by_size || p["quantité_ par_ taille"] || p.quantite_par_taille || p.quantite__par__taille;

  const available_sizes = parseSizes(sizesRaw);
  const stock_by_size = parseStockBySize(sizesRaw, stockRaw);

  const fabrication_possible =
    p.fabrication_possible === true ||
    p.fabrication_possible === "OUI" ||
    p.custom_made === true ||
    p.custom_made === "OUI";

  return {
    id,
    titleLabel,
    type,
    description: safeStr(p.description || p.desc || p["description"]),
    price,
    stone_type: stoneType,
    stone_weight: stoneWeight,
    metal_weight: metalWeight,
    colorLabel,
    available_sizes,
    stock_by_size,
    fabrication_possible,
    image: getImage(p),
  };
}

/* ======================================================
   ProductModal (EV1 stable)
====================================================== */
export class ProductModal extends ModalBase {
  constructor(modalId = "product-modal") {
    super(modalId);
    // ModalBase définit this.modalContent
    this.current = null;
    console.log("ProductModal initialisé :", modalId);
  }

  showProduct(product) {
    const p = normalizeForModal(product);
    if (!p) {
      console.error("showProduct: produit invalide", product);
      this.showError();
      return;
    }

    this.current = p;

    this.setContent(this.render(p));
    this.open();
    this.bindEvents(p);
  }

  render(p) {
    const sizes = p.available_sizes || [];
    const stock = p.stock_by_size || {};

    const sizeOptions = sizes
      .map((s) => {
        const q = stock?.[s] ?? 0;
        const disabled = q <= 0;
        const label = disabled ? `${s} (épuisé)` : `${s} (stock ${q})`;
        return `<option value="${s}" ${disabled ? "disabled" : ""}>${label}</option>`;
      })
      .join("");

    const stoneLine =
      p.stone_type
        ? `${p.stone_type}${p.stone_weight > 0 ? ` • ${formatCt(p.stone_weight)}` : ""}`
        : "Sans pierre";

    const metalWeightLabel = p.metal_weight > 0 ? formatGram(p.metal_weight) : "—";

    // IMPORTANT :
    // - Le bouton "Fermer" ci-dessous est un fallback visuel (au cas où le .close-modal du DOM est caché)
    // - Le .close-modal "global" (dans index.html) reste géré par ModalBase.
    return `
      <div class="modal-product-grid">

        <div class="modal-left">
          <img class="modal-main-img"
               src="${p.image}"
               alt="${p.titleLabel || "Bijou"}"
               onerror="this.src='${CONFIG.placeholder}'">
        </div>

        <div class="modal-right">
          <button type="button"
        class="close-modal"
        data-action="close"
        aria-label="Fermer">×</button>


          <h2 class="modal-title">${p.titleLabel || "Bijou"}</h2>
          <div class="modal-price">${formatEUR(p.price)}</div>

          ${p.type ? `<div class="modal-type">${p.type}</div>` : ""}

          ${p.description ? `<p class="modal-desc">${p.description}</p>` : ""}

          <ul class="modal-details">
            <li><strong>Pierre :</strong> ${stoneLine}</li>
            <li><strong>Poids or :</strong> ${metalWeightLabel}</li>
            <li><strong>Couleur :</strong> ${p.colorLabel || "—"}</li>
          </ul>

          ${
            sizes.length
              ? `
                <div class="modal-sizes">
                  <label for="modal-size-select">Choisir une taille</label>
                  <select id="modal-size-select">
                    <option value="">-- Choisir --</option>
                    ${sizeOptions}
                  </select>
                </div>
              `
              : `
                <div class="modal-sizes">
                  <p>Taille unique ou réglable.</p>
                </div>
              `
          }

          <div class="modal-actions">
            <button id="modal-add-cart-btn" class="modal-add-cart" type="button">
  Ajouter au panier
</button>


            ${
              p.fabrication_possible
                ? `
                  <button id="modal-fabrication-btn" class="modal-fabrication-btn" type="button">
                    Fabrication sur mesure
                  </button>
                `
                : ""
            }
          </div>
        </div>

      </div>
    `;
  }

  bindEvents(p) {
    const closeInside = this.modal?.querySelector('[data-action="close"]');
    if (closeInside) closeInside.onclick = () => this.close();

    const orderBtn = document.getElementById("modal-order-btn");
    const sizeSelect = document.getElementById("modal-size-select");
    const fabBtn = document.getElementById("modal-fabrication-btn");

    // Active/désactive Commander si tailles disponibles
    const refreshOrderState = () => {
      if (!orderBtn) return;
      if (!sizeSelect) {
        orderBtn.disabled = false;
        return;
      }
      orderBtn.disabled = !sizeSelect.value;
    };

    if (sizeSelect) {
      sizeSelect.addEventListener("change", refreshOrderState);
      refreshOrderState();
    }

    if (orderBtn) {
      orderBtn.onclick = () => {
        let chosenSize = null;

        if (sizeSelect) {
          chosenSize = sizeSelect.value;
          if (!chosenSize) {
            alert("Veuillez choisir une taille.");
            return;
          }
        }

        // clé panier stable EV1
        const key = chosenSize ? `${p.id}|size:${chosenSize}` : `${p.id}|item`;
        const item = { ...p };
        if (chosenSize) item.__size = chosenSize;

        if (window.addToCart) {
          window.addToCart(key, item);
          if (window.updateCartUI) window.updateCartUI();
        } else {
          console.warn("addToCart global manquant");
        }

        this.close();
      };
    }

    if (fabBtn) {
      fabBtn.onclick = () => {
        if (window.openFabricationModal) {
          window.openFabricationModal(p);
          this.close();
        } else {
          console.warn("openFabricationModal global manquant");
        }
      };
    }
  }

  showError() {
    this.setContent(`<p>Produit indisponible.</p>`);
    this.open();
  }
}

console.log("modalView.js chargé (EV1 stable)");
