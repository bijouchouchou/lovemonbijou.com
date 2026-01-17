/* ======================================================
   UTILS.JS — LOVE MON BIJOU
   Version finale propre, stable, unifiée
====================================================== */

/* ======================================================
   CONFIG CLOUDINARY (SOURCE UNIQUE)
====================================================== */

const CLOUDINARY = {
  cloudName: "dcak9pjrt",
  placeholder:
    "https://res.cloudinary.com/dcak9pjrt/image/upload/w_60,h_60,c_fill,q_auto,f_auto/placeholder",
};

/* ======================================================
   DOM HELPERS
====================================================== */

export const qs = (selector, ctx = document) =>
  ctx.querySelector(selector);

export const qsa = (selector, ctx = document) =>
  Array.from(ctx.querySelectorAll(selector));

export function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ======================================================
   FORMAT
====================================================== */

export function formatPrice(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0.00 €";
  return `${n.toFixed(2)} €`;
}

/* ======================================================
   NORMALISATION TYPE DE BIJOU (CSV)
====================================================== */

function normalizeJewelryType(raw) {
  if (!raw) return "bague";

  let t = String(raw).toLowerCase().trim();

  // Supprimer accents
  t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Aliases CSV contrôlés
  const MAP = {
    bagues: "bague",
    bague: "bague",
    colliers: "collier",
    collier: "collier",
    bracelets: "bracelet",
    bracelet: "bracelet",
    pendentifs: "pendentif",
    pendentif: "pendentif",
    chaines: "chaine",
    chaine: "chaine",
    boucles: "boucles d’oreilles",
    "boucle d'oreille": "boucles d’oreilles",
    "boucles d'oreilles": "boucles d’oreilles",
  };

  if (MAP[t]) return MAP[t];

  // Fallback singulier simple
  if (t.endsWith("s") && t.length > 3) {
    t = t.slice(0, -1);
  }

  return t || "bague";
}

/* ======================================================
   CLOUDINARY — UTILITAIRES
====================================================== */

function normalizePublicId(reference) {
  if (!reference) return "";

  let id = String(reference).trim();
  id = id.replace(/\\/g, "/");
  id = id.replace(/\.(jpg|jpeg|png|webp|gif|avif)$/i, "");

  return id
    .split("/")
    .map(seg => encodeURIComponent(seg))
    .join("/");
}

function cloudinaryUrl(reference, { width, height } = {}) {
  if (!reference) return CLOUDINARY.placeholder;

  const publicId = normalizePublicId(reference);

  const transform = [
    width ? `w_${width}` : null,
    height ? `h_${height}` : null,
    "c_fill",
    "q_auto",
    "f_auto",
  ]
    .filter(Boolean)
    .join(",");

  return `https://res.cloudinary.com/${CLOUDINARY.cloudName}/image/upload/${transform}/${publicId}`;
}

/* ======================================================
   IMAGES
====================================================== */

export function getItemImage(item) {
  if (!item) return CLOUDINARY.placeholder;

  if (item.image && item.image.startsWith("http")) {
    return item.image;
  }

  const ref = item.reference || item.id;
  if (!ref) return CLOUDINARY.placeholder;

  return cloudinaryUrl(ref, { width: 400, height: 400 });
}

export function getCartImage(reference) {
  if (!reference) return CLOUDINARY.placeholder;
  return cloudinaryUrl(reference, { width: 60, height: 60 });
}

/* ======================================================
   NORMALISATION PRODUIT (CATALOGUE + MODALE)
====================================================== */

export function normalizeProduct(p) {
  if (!p) return null;

  const id = p.reference || p.REFERENCE || p.id;
  if (!id) return null;

  /* -------- TYPE -------- */
  const type = normalizeJewelryType(
    p["type de bijoux"] || p.type
  );

  /* -------- PRIX / STOCK -------- */
  const price =
    Number(String(p.price || p.price_euros || "0").replace(",", ".")) || 0;

  const stock =
    Number(p.stock || p.quantite || 0) || 0;

  /* -------- DESCRIPTION -------- */
  const description =
    p.description || p.DESCRIPTION || "";

  /* -------- MÉTAL / CARAT -------- */
  const carat =
    parseInt(p.TITRE || p.carat || 0, 10) || null;

  const metal = "or";
  const metalLabel = carat ? `${metal} ${carat} carats` : metal;

  /* -------- COULEUR -------- */
  const colorMap = {
    Y: "Jaune",
    YG: "Jaune",
    W: "Blanc",
    WG: "Blanc",
    R: "Rose",
    RG: "Rose",
  };

  const metal_color_code =
    (p.couleur || p.metal_color || "").toUpperCase().trim();

  const colorLabel =
    colorMap[metal_color_code] || metal_color_code || "";

  /* -------- PIERRES -------- */
  const stone_type =
    p["type de pierres"] || p.stone_type || "";

  const stone_weight =
    parseFloat(
      String(p["Poids pierre"] || p.stone_weight || "0").replace(",", ".")
    ) || 0;

  const has_stone =
    Boolean(stone_type) && stone_weight > 0;

  /* -------- TAILLES -------- */
  const available_sizes = p["tailles disponibles"]
    ? p["tailles disponibles"]
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
    : [];

  const default_size =
    available_sizes[0] || "unique";

  /* -------- FABRICATION -------- */
  const fabrication_possible =
    p.fabrication_possible === "OUI" ||
    p.fabrication_possible === true ||
    p.custom_made === "OUI" ||
    p.custom_made === true;

  /* -------- ÉVÉNEMENTS -------- */
  const events = p.evenement
    ? p.evenement.split(",").map(e => e.trim()).filter(Boolean)
    : [];

  /* -------- TITRE MODALE -------- */
  let titleLabel = type;

  if (metalLabel) titleLabel += ` ${metalLabel}`;
  if (colorLabel) titleLabel += ` ${colorLabel}`;
  if (has_stone) titleLabel += ` avec ${stone_type}`;

  titleLabel = titleLabel.trim();

  /* -------- IMAGE -------- */
  const image = getItemImage({
    reference: id,
    image: p.image || p.IMAGE,
  });

  return {
    id,
    reference: id,

    type,
    titleLabel,
    description,
    image,

    metal,
    carat,
    metalLabel,
    metal_color: metal_color_code,
    colorLabel,
    metal_weight:
      parseFloat(
        String(p["POIDS OR"] || p.metal_weight || "0").replace(",", ".")
      ) || null,

    stone_type,
    stone_weight,
    has_stone,

    available_sizes,
    default_size,

    fabrication_possible,
    custom_made: fabrication_possible,

    price,
    stock,

    events,
    primary_event: events[0] || "",
  };
}

/* ======================================================
   NORMALISATION ITEM PANIER
====================================================== */

export function normalizeCartItem(cartItem) {
  if (!cartItem) return null;

  const reference = cartItem.reference || cartItem.id;
  if (!reference) return null;

  const quantity = Number(cartItem.quantity || 1);
  const unitPrice = Number(cartItem.price || 0);
  const lineTotal = quantity * unitPrice;

  const type = normalizeJewelryType(cartItem.type);
  const headerTitle = `${type.toUpperCase()} ${reference}`;

  let subtitle = "";
  if (cartItem.carat) {
    subtitle = `${cartItem.carat} carats`;
  } else if (cartItem.metalLabel) {
    subtitle = cartItem.metalLabel;
  }

  return {
    key: cartItem.key || `${reference}_unique`,
    reference,

    headerTitle, // ex: "BAGUE AJR24686"
    subtitle,    // ex: "9 carats"

    image:
      cartItem.image ||
      getCartImage(reference),

    quantity,
    unitPrice,
    lineTotal,

    _displayPrice: `${quantity} × ${unitPrice.toFixed(2)} €`,
    _displayTotal: `${lineTotal.toFixed(2)} €`,
  };
}

/* ======================================================
   DEBUG
====================================================== */

console.log("✅ utils.js chargé — version finale complète");
