/* ======================================================
   UTILS.JS - VERSION COMPLÈTE AVEC NORMALISATION AMÉLIORÉE
   ====================================================== */

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
   NORMALISATION PRODUIT (SOURCE DE VÉRITÉ - AMÉLIORÉE)
====================================================== */

export function normalizeProduct(p) {
  if (!p) return null;

  const id = p.reference || p.REFERENCE || p.id || "";
  if (!id) return null;

  console.log(`🔧 Normalisation produit: ${id}`);

  // ========== EXTRACTION DES DONNÉES ==========
  
  // Carat depuis TITRE (ex: "9" pour 9 carats)
  const carat = parseInt(p.TITRE || p.carat || 0, 10) || null;
  
  // Type de bijoux
  const type = p["type de bijoux"] || p.type || "bijou";
  
  // Pierres
  const stoneType = p["type de pierres"] || p.stone_type || "";
  const stoneWeight = parseFloat(String(p["Poids pierre"] || p.stone_weight || "0").replace(",", ".")) || 0;
  const hasStone = !!stoneType && stoneWeight > 0;
  
  // Poids or
  const goldWeight = parseFloat(String(p["POIDS OR"] || p.metal_weight || "0").replace(",", ".")) || 0;
  
  // Prix
  const price = parseFloat(String(p.price_euros || p.price || "0").replace(",", ".")) || 0;
  
  // Stock
  const stock = parseInt(p.stock || p.quantite || "0", 10) || 0;
  
  // ========== CONVERSION COULEURS ==========
  const colorMap = {
    Y: "Jaune",
    YG: "Jaune",
    W: "Blanc", 
    WG: "Blanc",
    R: "Rose",
    RG: "Rose",
  };
  
  const colorCode = (p.couleur || p.metal_color || "").toUpperCase().trim();
  const colorLabel = colorMap[colorCode] || colorCode || "";
  
  // ========== CONSTRUCTION MÉTAL ==========
  const metal = "or";
  const metalLabel = carat ? `${metal} ${carat}k` : metal;
  
  // ========== CONSTRUCTION DU TITRE SIGNIFICATIF ==========
  let titleLabel = `${type} `;
  
  // Ajouter métal et carat
  if (metalLabel) titleLabel += `${metalLabel} `;
  
  // Ajouter couleur si spécifique et simple
  if (colorLabel && !colorLabel.includes("et") && colorLabel !== colorCode) {
    titleLabel += `${colorLabel} `;
  }
  
  // Ajouter pierres si présentes
  if (hasStone) {
    titleLabel += `avec ${stoneType}`;
    if (stoneWeight > 0) {
      titleLabel += ` (${stoneWeight.toFixed(2)}ct)`;
    }
  }
  
  // Nettoyer
  titleLabel = titleLabel.trim().replace(/\s+/g, ' ');
  
  // Si titre trop court, ajouter référence
  if (titleLabel.length < 10) {
    titleLabel = `${titleLabel} - Ref: ${id}`;
  }
  
  // ========== IMAGE CLOUDINARY ==========
  let image = p.image || p.IMAGE || "";
  if (!image && id) {
    // Construction URL Cloudinary générique
    // À ADAPTER avec votre configuration Cloudinary
    image = `https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill,q_auto,f_auto/jewelry/${id}.jpg`;
  }
  
  // ========== TAILLES ==========
  const availableSizes = p["tailles disponibles"] ? 
    p["tailles disponibles"].split(',').map(s => s.trim()).filter(s => s) : 
    [];
  
  // ========== ÉVÉNEMENTS ==========
  const events = p.evenement ? 
    p.evenement.split(',').map(e => e.trim()).filter(e => e) : 
    [];
  
  // ========== FABRICATION ==========
  const fabricationPossible = 
    p.fabrication_possible === "OUI" || 
    p.fabrication_possible === true || 
    p.custom_made === "OUI" || 
    p.custom_made === true;

  // ========== RETOUR ==========
  return {
    // === IDENTITÉ ===
    id,
    reference: id,
    sku: id,
    
    // === AFFICHAGE ===
    titleLabel,
    type,
    description: p.description || p.DESCRIPTION || "",
    image,
    
    // === MÉTAL ===
    metal,
    carat,
    metalLabel,
    metal_color: colorCode,
    colorLabel,
    metal_weight: goldWeight,
    
    // === PIERRES ===
    stone_type: stoneType,
    stone_weight: stoneWeight,
    has_stone: hasStone,
    
    // === PRIX & STOCK ===
    price,
    stock,
    
    // === TAILLES ===
    available_sizes: availableSizes,
    stock_by_size: p.stock_by_size || {},
    default_size: availableSizes[0] || "unique",
    
    // === FABRICATION ===
    fabrication_possible: fabricationPossible,
    custom_made: fabricationPossible,
    
    // === ÉVÉNEMENTS ===
    events,
    primary_event: events[0] || "",
    
    // === POUR DEBUG ===
    _rawCarat: p.TITRE,
    _rawColor: p.couleur,
    _rawGoldWeight: p["POIDS OR"]
  };
}

/* ======================================================
   NORMALISATION ITEM PANIER (AMÉLIORÉE)
====================================================== */

export function normalizeCartItem(cartItem) {
  if (!cartItem) return null;

  console.log(`🛒 Normalisation item panier: ${cartItem.id || cartItem.key}`);

  // ========== NORMALISER L'ITEM ==========
  let baseProduct;
  
  // Si l'item a déjà des propriétés de produit normalisé
  if (cartItem.titleLabel || cartItem.reference) {
    baseProduct = cartItem;
  } else {
    // Sinon, normaliser comme produit
    try {
      baseProduct = normalizeProduct(cartItem);
    } catch (e) {
      console.warn('❌ Normalisation produit échouée:', e);
      baseProduct = cartItem;
    }
  }
  
  // ========== DONNÉES DE BASE ==========
  const quantity = Number(cartItem.quantity || 1);
  const unitPrice = Number(cartItem.price || baseProduct.price || 0);
  const lineTotal = unitPrice * quantity;
  
  // ========== TAILLE ==========
  const size = cartItem.size || baseProduct.default_size || "unique";
  
  // ========== IMAGE CLOUDINARY POUR PANIER ==========
  let image = cartItem.image || baseProduct.image || "";
  const reference = baseProduct.reference || cartItem.id || "";
  
  if (!image && reference) {
    // URL Cloudinary optimisée pour le panier (plus petit)
    image = `https://res.cloudinary.com/demo/image/upload/w_100,h_100,c_fill,q_auto,f_auto/jewelry/${reference}.jpg`;
  }
  
  // ========== TITRE POUR PANIER ==========
  let title = baseProduct.titleLabel || "";
  if (!title) {
    // Fallback intelligent
    if (baseProduct.type && baseProduct.metalLabel) {
      title = `${baseProduct.type} ${baseProduct.metalLabel}`;
    } else if (reference) {
      title = `Bijou Ref: ${reference}`;
    } else {
      title = "Produit";
    }
  }
  
  // Raccourcir le titre si trop long pour le panier
  if (title.length > 40) {
    title = title.substring(0, 37) + '...';
  }
  
  // ========== DÉTAILS SPÉCIFIQUES ==========
  const colorLabel = baseProduct.colorLabel || "";
  const metalLabel = baseProduct.metalLabel || "";
  const stoneType = baseProduct.has_stone ? baseProduct.stone_type : null;
  const stoneWeight = baseProduct.has_stone ? baseProduct.stone_weight : null;
  
  // ========== CONSTRUCTION DES DÉTAILS ==========
  let details = [];
  if (size && size !== "unique") details.push(`Taille: ${size}`);
  if (colorLabel) details.push(colorLabel);
  if (metalLabel) details.push(metalLabel);
  if (stoneType) details.push(`avec ${stoneType}`);
  
  const detailsText = details.join(' • ');
  
  // ========== CLÉ UNIQUE ==========
  const key = cartItem.key || `${reference}_${size}`;
  
  // ========== RETOUR ==========
  return {
    // === IDENTITÉ ===
    key,
    id: cartItem.id || reference,
    reference,
    
    // === AFFICHAGE ===
    title,
    description: baseProduct.description || "",
    image,
    
    // === VARIANTE ===
    size,
    
    // === DÉTAILS ===
    colorLabel,
    metalLabel,
    goldWeight: baseProduct.metal_weight || null,
    stoneType,
    stoneWeight,
    details: detailsText,
    
    // === PRIX ===
    quantity,
    unitPrice,
    lineTotal,
    
    // === POUR LE RENDU ===
    _displayPrice: `${quantity} × ${unitPrice.toFixed(2)} €`,
    _displayTotal: `${lineTotal.toFixed(2)} €`,
    
    // === POUR DEBUG ===
    _normalized: true,
    _source: baseProduct === cartItem ? 'alreadyNormalized' : 'normalizedFromRaw'
  };
}

console.log("✅ UTILS.JS: Normalisation améliorée chargée");