// ============================================
// STATE.JS — Gestion centrale de l'etat
// ============================================

let state = {
    products: [],
    filteredProducts: [],
    cart: [],
    filters: {
        event: "",
        types: [],
        stones: [],
        colors: [],
        searchText: ""
    }
};

console.log("STATE.JS: État initialisé");

/**
 * Retourne tous les produits
 */
export function getProducts() {
    return state.products;
}

/**
 * Met a jour la liste des produits
 */
export function setProducts(products) {
    if (!Array.isArray(products)) {
        console.warn("setProducts: tableau attendu");
        state.products = [];
    } else {
        state.products = products;
    }
    console.log("STATE.JS → Produits mis à jour:", state.products.length);
}

/**
 * Filtrer les produits (a developper)
 */
export function setFilteredProducts(list) {
    state.filteredProducts = list || [];
}

/**
 * Recuperer un produit par reference
 */
export function getProductByRef(ref) {
    return state.products.find(p => p.reference === ref);
}

/**
 * Charger le panier depuis le localStorage
 */
export function initState() {
    try {
        const saved = localStorage.getItem("cart");
        if (saved) {
            state.cart = JSON.parse(saved);
            console.log("STATE.JS: Panier chargé:", state.cart.length);
        }
    } catch (e) {
        console.error("STATE.JS: Erreur chargement panier", e);
    }
}

export default state;
