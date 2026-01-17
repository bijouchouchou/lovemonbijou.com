// ============================================
// UTILS.JS — Fonctions utilitaires globales
// SOURCE DE VÉRITÉ EV1
// ============================================

// ============================================
// FILTER UTILS (FRONT ONLY)
// ============================================

export function getUniqueValues(products, extractor) {
  return [...new Set(
    products
      .map(extractor)
      .filter(v => v && v !== "")
  )];
}

// ---------------------------
// Sélecteurs rapides
// ---------------------------
export function $(selector, context = document) {
    return context.querySelector(selector);
}

export function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

// ---------------------------
// Création d'éléments DOM
// ---------------------------
export function createEl(tag, attrs = {}, content = null) {
    const el = document.createElement(tag);

    if (typeof attrs === "string") {
        el.className = attrs;
    } else {
        Object.entries(attrs).forEach(([key, value]) => {
            if (value == null) return;

            if (key === "class") el.className = value;
            else if (key === "dataset") {
                Object.entries(value).forEach(([k, v]) => el.dataset[k] = v);
            } else if (key in el) el[key] = value;
            else el.setAttribute(key, value);
        });
    }

    if (content != null) {
        if (Array.isArray(content)) {
            content.forEach(c => c && el.appendChild(c));
        } else if (content instanceof Node) {
            el.appendChild(content);
        } else {
            el.textContent = content;
        }
    }

    return el;
}

// ---------------------------
// Format prix
// ---------------------------
export function formatPrice(value) {
    const n = parseFloat(String(value).replace(",", "."));
    if (isNaN(n)) return "0,00 €";
    return n.toFixed(2).replace(".", ",") + " €";
}

// ---------------------------
// Toast notification
// ---------------------------
export function showNotification(message, type = "info") {
    let box = document.getElementById("notif-box");

    if (!box) {
        box = document.createElement("div");
        box.id = "notif-box";
        Object.assign(box.style, {
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: "10px"
        });
        document.body.appendChild(box);
    }

    const el = document.createElement("div");
    el.textContent = message;

    Object.assign(el.style, {
        padding: "12px 18px",
        borderRadius: "6px",
        color: "#fff",
        fontSize: "14px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        opacity: "0",
        transition: "0.3s"
    });

    const colors = {
        success: "#2ecc71",
        error: "#e74c3c",
        warning: "#f1c40f",
        info: "#3498db"
    };

    el.style.background = colors[type] || colors.info;
    if (type === "warning") el.style.color = "#000";

    box.appendChild(el);
    requestAnimationFrame(() => el.style.opacity = "1");

    setTimeout(() => {
        el.style.opacity = "0";
        setTimeout(() => el.remove(), 300);
    }, 2500);
}

// ======================================================
// NORMALISATION PRODUIT — SOURCE UNIQUE EV1
// ======================================================
export function normalizeProduct(p) {
    if (!p) return null;

    // ---------------------------
    // Identifiant (CRITIQUE)
    // ---------------------------
    const id = p.reference || p.REFERENCE || p.id || p.ref;
    if (!id) return null;

    // ---------------------------
    // Helpers
    // ---------------------------
    const num = v => {
        if (v == null) return 0;
        return parseFloat(String(v).replace(",", ".")) || 0;
    };

    // ---------------------------
    // Métal & titrage
    // ---------------------------
    const carat = parseInt(p.carat || p.titre || p.TITRE || 0, 10) || null;
    const metal = p.metal || "or";
    const metalLabel = carat ? `${metal} ${carat}k` : metal;

    // ---------------------------
    // Couleur
    // ---------------------------
    const rawColor = (p.metal_color || p.couleur || "").toUpperCase();
    const colorMap = {
        Y: "Jaune",
        YG: "Jaune et Blanc",
        W: "Blanc",
        WG: "Blanc et Jaune",
        R: "Rose",
        RG: "Rose et Blanc"
    };

    let colorLabel = colorMap[rawColor] || "";
    if (!colorLabel && rawColor.length >= 2) colorLabel = "Deux couleurs";
    if (!colorLabel && rawColor) colorLabel = rawColor.toLowerCase();

    // ---------------------------
    // Pierres (LOGIQUE ROBUSTE)
    // ---------------------------
    const stoneType = p.stone_type || p["type de pierres"] || "";
    const stoneTypeLower = stoneType.toLowerCase().trim();

    const noStoneValues = [
        "", "aucune", "sans pierre", "pas de pierre",
        "n/a", "na", "none", "null"
    ];

    const hasStone = !!(stoneType && !noStoneValues.includes(stoneTypeLower));

    // ---------------------------
    // Tailles
    // ---------------------------
    const sizes = Array.isArray(p.available_sizes) ? p.available_sizes : [];
    const stockBySize =
        p.stock_by_size && typeof p.stock_by_size === "object"
            ? p.stock_by_size
            : {};

    // ---------------------------
    // Libellé titre
    // ---------------------------
    const typeBijou = p.type || p["type de bijoux"] || "bijou";
    const titleLabel = `${typeBijou} ${metalLabel}`.toLowerCase();

    // ---------------------------
    // OBJET FINAL NORMALISÉ
    // ---------------------------
    return {
        // Identité
        id,
        ref: id,
        reference: id,
        sku: p.sku || id,

        // Affichage
        titleLabel,
        type: typeBijou,
        description: p.description || "",

        // Métal
        metal,
        carat,
        metalLabel,
        metal_color: rawColor,
        colorLabel,
        metal_weight: num(p.metal_weight || p["POIDS OR"]),

        // Pierres
        stone_type: stoneType,
        stone_weight: num(p.stone_weight || p["Poids pierre"]),
        has_stone: hasStone,

        // Prix / stock
        price: num(p.price || p.price_euros),
        stock: parseInt(p.stock, 10) || 0,

        // Tailles
        available_sizes: sizes,
        stock_by_size: stockBySize,
        default_size: p.default_size || sizes[0] || "unique",

        // Fabrication
        fabrication_possible: p.fabrication_possible === "OUI" || !!p.custom_made,
        custom_made: !!p.custom_made,

        // Événements
        events: Array.isArray(p.events) ? p.events : [],
        primary_event: p.primary_event || "",

        // Images
        image: p.image || "",
        images: Array.isArray(p.images) ? p.images : []
    };
}

console.log("UTILS.JS — normalisation EV1 chargée");
