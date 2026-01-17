const CONFIG = {
    csvUrl: "./data/products.csv",
    placeholder: "assets/placeholder.png"
};

console.log("CONFIG.JS: Configuration chargée");

// Export ES6
export { CONFIG };

// Gardez aussi pour compatibilite
window.CONFIG = CONFIG;
