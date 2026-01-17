/* ======================================================
   DOM HELPERS (SAFE – NO GLOBAL $)
====================================================== */

export const qs = (selector, ctx = document) =>
  ctx.querySelector(selector);

export const qsa = (selector, ctx = document) =>
  Array.from(ctx.querySelectorAll(selector));


/* ======================================================
   FORMAT HELPERS
====================================================== */

export function formatPrice(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0.00 €";
  return `${n.toFixed(2)} €`;
}


/* ======================================================
   PRODUCT NORMALIZATION (EXISTANT – INCHANGÉ)
====================================================== */

export function normalizeProduct(p) {
  if (!p) return null;

  const id = p.reference || p.REFERENCE || p.id || p.ref || "";

  const price = Number(p.price || p.PRICE || 0);

  const metal = p.metal || "";
  const carat = Number(p.carat || p.CARAT || 0);
  const metalLabel = metal && carat ? `${metal} ${carat}k` : metal;

  const metal_weight = Number(p.metal_weight || p.METAL_WEIGHT || 0);

  const stone_type = p.stone_type || p.STONE_TYPE || null;
  const stone_weight = Number(p.stone_weight || p.STONE_WEIGHT || 0);
  const has_stone = !!stone_type && stone_weight > 0;

  const metal_color = p.metal_color || p.METAL_COLOR || "";
  const colorLabel =
    metal_color === "Y" ? "Jaune" :
    metal_color === "W" ? "Blanc" :
    metal_color === "R" ? "Rose" :
    null;

  return {
    id,
    titleLabel: p.title || p.name || p.TITLE || "",
    description: p.description || p.DESCRIPTION || "",
    image: p.image || p.IMAGE || "",
    price,

    metal,
    carat,
    metalLabel,
    metal_weight,

    metal_color,
    colorLabel,

    has_stone,
    stone_type,
    stone_weight,
  };
}


/* ======================================================
   CART ITEM NORMALIZATION (NOUVEAU – PANIER)
====================================================== */

export function normalizeCartItem(cartItem) {
  if (!cartItem) return null;

  // cartItem vient du CartCore
  const base =
    cartItem.metalLabel || cartItem.colorLabel
      ? cartItem
      : normalizeProduct(cartItem);

  if (!base) return null;

  const quantity = Number(cartItem.quantity || 1);
  const unitPrice = Number(cartItem.price || base.price || 0);

  return {
    // Identité
    key: cartItem.key,
    id: cartItem.id,

    // Affichage
    title: base.titleLabel || cartItem.name || "",
    description: base.description || "",
    image: cartItem.image || base.image || "",

    // Variante commandée
    size: cartItem.size || "unique",
    quantity,

    // Métal & couleur
    metalLabel: base.metalLabel || null,
    colorLabel: base.colorLabel || null,

    // Poids
    goldWeight: base.metal_weight || null,
    stoneType: base.has_stone ? base.stone_type : null,
    stoneWeight: base.has_stone ? base.stone_weight : null,

    // Prix
    unitPrice,
    lineTotal: unitPrice * quantity,
  };
}